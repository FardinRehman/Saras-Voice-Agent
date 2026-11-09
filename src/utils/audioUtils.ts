/**
 * Real-time Audio processing, VAD, PCM encoding/decoding, and gapless playback for OpenAI Realtime API
 */

// Resample audio from arbitrary hardware sample rate to 24,000 Hz PCM16 LE
function resampleTo24kPcm16(input: Float32Array, sourceSampleRate: number): Int16Array {
  const targetSampleRate = 24000;
  let resampled: Float32Array;

  if (sourceSampleRate === targetSampleRate) {
    resampled = input;
  } else {
    const ratio = sourceSampleRate / targetSampleRate;
    const targetLength = Math.round(input.length / ratio);
    resampled = new Float32Array(targetLength);
    for (let i = 0; i < targetLength; i++) {
      const srcIndex = i * ratio;
      const index = Math.floor(srcIndex);
      const frac = srcIndex - index;
      const s1 = input[index] ?? 0;
      const s2 = input[index + 1] ?? s1;
      resampled[i] = s1 + frac * (s2 - s1);
    }
  }

  // Convert Float32 [-1.0, 1.0] to 16-bit signed PCM LE
  const pcm16 = new Int16Array(resampled.length);
  for (let i = 0; i < resampled.length; i++) {
    const s = Math.max(-1, Math.min(1, resampled[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}

export type VoiceIsolationLevel = 'balanced' | 'high' | 'ultra';

export const ISOLATION_CONFIGS: Record<VoiceIsolationLevel, { name: string; gateThreshold: number; vadThreshold: number; description: string }> = {
  balanced: {
    name: 'Balanced',
    gateThreshold: 0.018,
    vadThreshold: 0.65,
    description: 'Home/Office use. Filters gentle background hum, fan noise, and keyboard clicks.',
  },
  high: {
    name: 'High Focus (Default)',
    gateThreshold: 0.032,
    vadThreshold: 0.78,
    description: 'Recommended: Isolates your voice only, actively canceling background chatter, TV, and nearby speakers.',
  },
  ultra: {
    name: 'Ultra Near-Field',
    gateThreshold: 0.055,
    vadThreshold: 0.88,
    description: 'Maximum isolation: Exclusively accepts loud, direct speech close into the microphone.',
  },
};

export class AudioRecorder {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private voiceClarityFilter: BiquadFilterNode | null = null;

  // Voice Isolation & Dynamic Noise Gate
  private voiceIsolation: boolean = true;
  private isolationLevel: VoiceIsolationLevel = 'high';
  private isGateOpen: boolean = false;
  private lastVoiceTimestamp: number = 0;
  private hangoverMs: number = 380; // Keep gate open 380ms after voice to prevent trailing syllable clipping
  private ambientNoiseFloor: number = 0.005;
  private preBuffer: string[] = []; // Rolling buffer of ~3 chunks (150ms) to preserve speech onsets

  // VAD & Silence detection state
  private isUserSpeaking: boolean = false;
  private silenceTimer: any = null;
  private speechStartTimestamp: number = 0;
  private silenceThresholdMs: number = 650; // 650ms silence = speech end
  private energyThreshold: number = 0.025; // RMS threshold

  private onAudioDataCallback: ((base64Pcm: string) => void) | null = null;
  private onSpeakingStateChange: ((isSpeaking: boolean) => void) | null = null;
  private onSpeechEndCallback: (() => void) | null = null;
  private onVolumeChangeCallback: ((volume: number, isAboveGate: boolean) => void) | null = null;
  private onGateStateChangeCallback: ((isOpen: boolean, isNoiseBlocked: boolean) => void) | null = null;
  private isMuted: boolean = false;

  public async start(
    onAudioData: (base64Pcm: string) => void,
    onSpeakingState?: (isSpeaking: boolean) => void,
    onSpeechEnd?: () => void,
    onVolume?: (volume: number, isAboveGate: boolean) => void,
    onGateState?: (isOpen: boolean, isNoiseBlocked: boolean) => void
  ): Promise<void> {
    this.onAudioDataCallback = onAudioData;
    this.onSpeakingStateChange = onSpeakingState || null;
    this.onSpeechEndCallback = onSpeechEnd || null;
    this.onVolumeChangeCallback = onVolume || null;
    this.onGateStateChangeCallback = onGateState || null;

    // Initialize AudioContext (request 24kHz, with automatic browser fallback if fixed clock)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    try {
      this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
    } catch {
      this.audioCtx = new AudioContextClass();
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    // Request audio stream with maximum browser hardware DSP noise suppression
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // Vendor-specific Chrome/Edge/Firefox enhanced DSP constraints
        // @ts-ignore
        googEchoCancellation: true,
        // @ts-ignore
        googAutoGainControl: true,
        // @ts-ignore
        googNoiseSuppression: true,
        // @ts-ignore
        googHighpassFilter: true,
        // @ts-ignore
        googNoiseReduction: true,
      } as any,
    });

    this.source = this.audioCtx.createMediaStreamSource(this.mediaStream);

    // 1. High-pass filter (85Hz) - removes sub-vocal rumble, AC hum, desk vibration
    this.highpassFilter = this.audioCtx.createBiquadFilter();
    this.highpassFilter.type = 'highpass';
    this.highpassFilter.frequency.value = 85;
    this.highpassFilter.Q.value = 0.7;

    // 2. Low-pass filter (7500Hz) - removes high-frequency hiss, static, coil whine
    this.lowpassFilter = this.audioCtx.createBiquadFilter();
    this.lowpassFilter.type = 'lowpass';
    this.lowpassFilter.frequency.value = 7500;
    this.lowpassFilter.Q.value = 0.7;

    // 3. Peaking voice clarity filter (2000Hz, +2.5dB) - enhances primary speaker intelligibility
    this.voiceClarityFilter = this.audioCtx.createBiquadFilter();
    this.voiceClarityFilter.type = 'peaking';
    this.voiceClarityFilter.frequency.value = 2000;
    this.voiceClarityFilter.Q.value = 1.0;
    this.voiceClarityFilter.gain.value = 2.5;

    // Connect DSP chain: source -> highpass -> lowpass -> voiceClarity -> analyser -> processor -> destination
    this.source.connect(this.highpassFilter);
    this.highpassFilter.connect(this.lowpassFilter);
    this.lowpassFilter.connect(this.voiceClarityFilter);

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 512;
    this.voiceClarityFilter.connect(this.analyser);

    // Buffer size 2048 = ~42-85ms chunks for low-latency streaming
    this.processor = this.audioCtx.createScriptProcessor(2048, 1, 1);
    this.analyser.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);

    this.processor.onaudioprocess = (e) => {
      if (this.isMuted) return;

      const inputBuffer = e.inputBuffer.getChannelData(0);
      const currentSampleRate = e.inputBuffer.sampleRate || this.audioCtx?.sampleRate || 24000;

      // 1. Calculate RMS energy
      let sum = 0;
      for (let i = 0; i < inputBuffer.length; i++) {
        sum += inputBuffer[i] * inputBuffer[i];
      }
      const rms = Math.sqrt(sum / inputBuffer.length);
      const volumeLevel = Math.min(1, rms * 6); // Normalized 0..1

      // Adaptive ambient floor tracking
      if (rms < 0.015) {
        this.ambientNoiseFloor = this.ambientNoiseFloor * 0.96 + rms * 0.04;
      }

      // Dynamic gate threshold based on user-selected isolation level
      const baseGate = ISOLATION_CONFIGS[this.isolationLevel].gateThreshold;
      const effectiveThreshold = this.voiceIsolation
        ? Math.max(baseGate, this.ambientNoiseFloor * 2.2)
        : 0.010;

      const isSignalAboveThreshold = rms >= effectiveThreshold;
      const now = Date.now();

      // Manage noise gate state
      let gateJustOpened = false;
      let isNoiseBlocked = false;

      if (isSignalAboveThreshold) {
        this.lastVoiceTimestamp = now;
        if (!this.isGateOpen) {
          this.isGateOpen = true;
          gateJustOpened = true;
        }
      } else if (this.isGateOpen) {
        // Voice dipped or paused: keep gate open during hangover window
        if (now - this.lastVoiceTimestamp > this.hangoverMs) {
          this.isGateOpen = false;
        }
      } else {
        // Gate is closed: if sound is detected (rms > 0.007) but below voice threshold, it is background noise
        if (rms > 0.007) {
          isNoiseBlocked = true;
        }
      }

      // Dispatch visualizer and gate status callbacks
      if (this.onVolumeChangeCallback) {
        this.onVolumeChangeCallback(volumeLevel, this.isGateOpen);
      }
      if (this.onGateStateChangeCallback) {
        this.onGateStateChangeCallback(this.isGateOpen, isNoiseBlocked);
      }

      // VAD logic for UI customer speaking indicators
      if (this.isGateOpen) {
        if (!this.isUserSpeaking) {
          this.isUserSpeaking = true;
          this.speechStartTimestamp = now;
          if (this.onSpeakingStateChange) {
            this.onSpeakingStateChange(true);
          }
        }
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
      } else if (this.isUserSpeaking) {
        if (!this.silenceTimer) {
          this.silenceTimer = setTimeout(() => {
            this.isUserSpeaking = false;
            this.silenceTimer = null;
            if (this.onSpeakingStateChange) {
              this.onSpeakingStateChange(false);
            }
            if (this.onSpeechEndCallback) {
              this.onSpeechEndCallback();
            }
          }, this.silenceThresholdMs);
        }
      }

      // 3. Audio transmission & noise cancellation logic
      const pcm16 = resampleTo24kPcm16(inputBuffer, currentSampleRate);
      const base64Chunk = int16ToBase64(pcm16);

      if (this.voiceIsolation) {
        if (this.isGateOpen) {
          // If gate just opened, flush pre-buffer so start of utterance is not chopped
          if (gateJustOpened && this.preBuffer.length > 0) {
            for (const prevChunk of this.preBuffer) {
              if (this.onAudioDataCallback) {
                this.onAudioDataCallback(prevChunk);
              }
            }
            this.preBuffer = [];
          }
          if (this.onAudioDataCallback) {
            this.onAudioDataCallback(base64Chunk);
          }
        } else {
          // Gate closed: save to rolling pre-buffer (max 3 chunks = ~150ms)
          this.preBuffer.push(base64Chunk);
          if (this.preBuffer.length > 3) {
            this.preBuffer.shift();
          }

          // Send zeroed PCM chunk so OpenAI Realtime server VAD receives pure silence (0 amplitude)
          // This keeps the 24kHz stream clocking cleanly without passing any background sounds or speech!
          const silencePcm16 = new Int16Array(pcm16.length);
          const silenceBase64 = int16ToBase64(silencePcm16);
          if (this.onAudioDataCallback) {
            this.onAudioDataCallback(silenceBase64);
          }
        }
      } else {
        // Voice isolation disabled - pass all audio directly
        if (this.onAudioDataCallback) {
          this.onAudioDataCallback(base64Chunk);
        }
      }
    };
  }

  public setIsolationSettings(enabled: boolean, level: VoiceIsolationLevel): void {
    this.voiceIsolation = enabled;
    this.isolationLevel = level;
  }

  public getIsolationSettings(): { enabled: boolean; level: VoiceIsolationLevel; threshold: number } {
    return {
      enabled: this.voiceIsolation,
      level: this.isolationLevel,
      threshold: ISOLATION_CONFIGS[this.isolationLevel].gateThreshold,
    };
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  public stop(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.voiceClarityFilter) {
      this.voiceClarityFilter.disconnect();
      this.voiceClarityFilter = null;
    }
    if (this.lowpassFilter) {
      this.lowpassFilter.disconnect();
      this.lowpassFilter = null;
    }
    if (this.highpassFilter) {
      this.highpassFilter.disconnect();
      this.highpassFilter = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.preBuffer = [];
    this.isGateOpen = false;
    this.isUserSpeaking = false;
  }
}

export class GaplessAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaying: boolean = false;
  private onSpeakingChange: ((isSpeaking: boolean) => void) | null = null;
  private gainNode: GainNode | null = null;
  private volume: number = 1.0;

  constructor(onSpeakingChange?: (isSpeaking: boolean) => void) {
    this.onSpeakingChange = onSpeakingChange || null;
  }

  private initCtx(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      // OpenAI Realtime model output audio is 24kHz PCM16
      this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  public playChunk(base64Pcm: string): void {
    const ctx = this.initCtx();
    const pcmData = base64ToInt16(base64Pcm);
    if (!pcmData || pcmData.length === 0) return;

    // Convert Int16 to Float32
    const float32 = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32[i] = pcmData[i] / (pcmData[i] < 0 ? 0x8000 : 0x7fff);
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    if (this.gainNode) {
      source.connect(this.gainNode);
    } else {
      source.connect(ctx.destination);
    }

    const currentTime = ctx.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime + 0.03; // small jitter buffer
    }

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.activeSources.push(source);

    if (!this.isPlaying) {
      this.isPlaying = true;
      if (this.onSpeakingChange) this.onSpeakingChange(true);
    }

    source.onended = () => {
      const index = this.activeSources.indexOf(source);
      if (index > -1) {
        this.activeSources.splice(index, 1);
      }
      if (this.activeSources.length === 0 && ctx.currentTime >= this.nextStartTime) {
        this.isPlaying = false;
        if (this.onSpeakingChange) this.onSpeakingChange(false);
      }
    };
  }

  /**
   * Stop immediately when customer interrupts or call ends
   */
  public stopAndClearQueue(): void {
    this.activeSources.forEach(src => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }
    this.isPlaying = false;
    if (this.onSpeakingChange) {
      this.onSpeakingChange(false);
    }
  }

  public close(): void {
    this.stopAndClearQueue();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}

// Helpers
function int16ToBase64(int16Array: Int16Array): string {
  const bytes = new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
}
