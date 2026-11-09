import { WebSocket } from 'ws';
import { SARAS_TOOL_DECLARATIONS, executeSarasTool, ToolExecutionContext } from './tools.ts';
import { db } from './db.ts';
import { SARAS_SYSTEM_INSTRUCTION } from './systemPrompt.ts';

export interface RealtimeConfig {
  model: string;
  voice: string;
  temperature: number;
}

/**
 * OpenAI Realtime API Session Handler for Saras Dynamics
 * Manages bidirectional WebSocket streaming between the browser / telephony client
 * and OpenAI Realtime API (wss://api.openai.com/v1/realtime).
 *
 * Implements server-side VAD, interruption / barge-in handling, automated turn-taking,
 * streaming audio playback, model-side transcriptions, and dynamic RAG tool executions.
 */
export class OpenAIRealtimeSessionHandler {
  private clientWs: WebSocket;
  private callId: string;
  private callerPhone?: string;
  private visitorName?: string;
  private openaiWs: WebSocket | null = null;
  private isAlive: boolean = true;
  private apiKey?: string;
  private model: string;
  private voice: string;
  private sessionConfigured: boolean = false;

  constructor(clientWs: WebSocket, callId: string, callerPhone?: string, initialVisitorName?: string, configuredVoice?: string) {
    this.clientWs = clientWs;
    this.callId = callId;
    this.callerPhone = callerPhone;
    this.visitorName = initialVisitorName;

    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime';
    this.voice = configuredVoice || process.env.OPENAI_REALTIME_VOICE || 'coral'; // Warm, professional Indian-English tone
  }

  /**
   * Request an ephemeral client secret token from OpenAI REST endpoint
   * for direct browser WebRTC peer connection.
   */
  public static async createEphemeralSession(visitorName?: string, configuredVoice?: string): Promise<{
    client_secret: { value: string; expires_at: number };
    model: string;
    voice: string;
  }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured on the server.');
    }

    const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime';
    const voice = configuredVoice || process.env.OPENAI_REALTIME_VOICE || 'coral';

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
        modalities: ['text', 'audio'],
        instructions: SARAS_SYSTEM_INSTRUCTION,
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: Number(process.env.OPENAI_VAD_THRESHOLD) || 0.78,
          prefix_padding_ms: 300,
          silence_duration_ms: 600,
          create_response: true,
        },
        tools: SARAS_TOOL_DECLARATIONS,
        tool_choice: 'auto',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create OpenAI Realtime session (${response.status}): ${errText}`);
    }

    const sessionData = await response.json();
    return sessionData;
  }

  public async start(): Promise<void> {
    if (!this.apiKey) {
      this.sendToClient({
        type: 'error',
        message: 'OPENAI_API_KEY is not configured on the server. Please check your environment variables.',
      });
      return;
    }

    try {
      this.sendToClient({
        type: 'status',
        status: 'CONNECTING',
        message: 'Connecting to Saras Dynamics AI Voice Engine...',
      });

      // Connect to OpenAI Realtime WebSocket endpoint
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(this.model)}`;
      this.openaiWs = new WebSocket(wsUrl, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      this.openaiWs.on('open', () => {
        this.configureSession();
      });

      this.openaiWs.on('message', async (data: Buffer | string) => {
        if (!this.isAlive) return;
        await this.handleOpenAIMessage(data.toString());
      });

      this.openaiWs.on('error', (err: any) => {
        console.error(`[OpenAI Realtime] WebSocket error in session ${this.callId}:`, err);
        this.sendToClient({
          type: 'error',
          message: err?.message || 'Error communicating with OpenAI Realtime API.',
        });
      });

      this.openaiWs.on('close', (code, reason) => {
        this.sendToClient({
          type: 'status',
          status: 'CLOSED',
          message: `Saras Dynamics voice session closed (${code}): ${reason || 'Normal closure'}`,
        });
        this.cleanup();
      });
    } catch (error: any) {
      console.error('[OpenAI Realtime] Failed to initialize session:', error);
      this.sendToClient({
        type: 'error',
        message: error?.message || 'Failed to initialize Saras Dynamics Voice session.',
      });
    }
  }

  /**
   * Send session.update to configure voice, VAD, whisper transcription, tools, and Saras system prompt
   */
  private configureSession(): void {
    if (!this.openaiWs || this.openaiWs.readyState !== WebSocket.OPEN) return;

    const sessionUpdate = {
      type: 'session.update',
      session: {
        type: 'realtime',
        output_modalities: ['audio'],
        instructions: SARAS_SYSTEM_INSTRUCTION,
        tools: SARAS_TOOL_DECLARATIONS,
        tool_choice: 'auto',
        audio: {
          input: {
            format: { type: 'audio/pcm', rate: 24000 },
            transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: Number(process.env.OPENAI_VAD_THRESHOLD) || 0.78,
              prefix_padding_ms: 300,
              silence_duration_ms: 600,
              create_response: true,
              interrupt_response: true,
            },
          },
          output: {
            format: { type: 'audio/pcm', rate: 24000 },
            voice: this.voice,
          },
        },
      },
    };

    this.openaiWs.send(JSON.stringify(sessionUpdate));
    this.sessionConfigured = true;

    this.sendToClient({
      type: 'status',
      status: 'READY',
      message: 'Saras Dynamics AI Voice Assistant connected. Listening...',
      model: this.model,
      voice: this.voice,
    });

    // Proactively trigger initial greeting
    setTimeout(() => {
      if (this.openaiWs && this.openaiWs.readyState === WebSocket.OPEN) {
        const greetingInstructions = this.visitorName
          ? `Say warmly in natural, fluent Indian English: "Hey ${this.visitorName}! Welcome to Saras Dynamics. I'm Saras, your AI assistant. It's great to have you here! I can help you explore our AI solutions, software development services, or even discuss an idea you're planning to build. So, what brings you here today?"`
          : `Say warmly in natural, fluent Indian English: "Hey! Welcome to Saras Dynamics. I'm Saras, your AI assistant. It's great to have you here! I can help you explore our AI solutions, software development services, or even discuss an idea you're planning to build. So, what brings you here today?"`;

        this.openaiWs.send(
          JSON.stringify({
            type: 'response.create',
            response: {
              instructions: greetingInstructions,
            },
          })
        );
      }
    }, 400);
  }

  /**
   * Handle events received from OpenAI Realtime API
   */
  private async handleOpenAIMessage(raw: string): Promise<void> {
    try {
      const event = JSON.parse(raw);

      switch (event.type) {
        // 1. Audio stream from model
        case 'response.output_audio.delta':
        case 'response.audio.delta': {
          if (event.delta) {
            this.sendToClient({
              type: 'audio',
              audio: event.delta,
            });
          }
          break;
        }

        // 2. User speech started -> Automatic VAD Barge-in
        case 'input_audio_buffer.speech_started': {
          this.sendToClient({
            type: 'interrupted',
          });
          break;
        }

        // 3. User speech stopped
        case 'input_audio_buffer.speech_stopped': {
          this.sendToClient({
            type: 'speech_stopped',
          });
          break;
        }

        // 4. Model audio transcript delta
        case 'response.output_audio_transcript.delta':
        case 'response.audio_transcript.delta': {
          if (event.delta) {
            this.sendToClient({
              type: 'transcript_delta',
              speaker: 'agent',
              delta: event.delta,
            });
          }
          break;
        }

        // 5. Model audio transcript completed
        case 'response.output_audio_transcript.done':
        case 'response.audio_transcript.done': {
          if (event.transcript) {
            db.addTranscript(this.callId, 'agent', event.transcript);
            this.sendToClient({
              type: 'transcript',
              speaker: 'agent',
              text: event.transcript,
              isPartial: false,
            });
          }
          break;
        }

        // 6. User spoken audio transcript completed (via whisper-1)
        case 'conversation.item.input_audio_transcription.completed': {
          if (event.transcript) {
            db.addTranscript(this.callId, 'visitor', event.transcript);
            this.sendToClient({
              type: 'transcript',
              speaker: 'visitor',
              text: event.transcript,
              isPartial: false,
            });
          }
          break;
        }

        // 7. Turn complete
        case 'response.done': {
          this.sendToClient({
            type: 'turn_complete',
          });
          break;
        }

        // 8. Tool Call / Function Execution
        case 'response.function_call_arguments.done': {
          const callId = event.call_id;
          const toolName = event.name;
          let toolArgs: Record<string, any> = {};

          try {
            toolArgs = JSON.parse(event.arguments || '{}');
          } catch {
            toolArgs = {};
          }

          const ctx: ToolExecutionContext = {
            callId: this.callId,
            callerPhone: this.callerPhone,
            visitorName: this.visitorName,
          };

          this.sendToClient({
            type: 'tool_executing',
            toolName,
            args: toolArgs,
          });

          // Execute tool
          const result = await executeSarasTool(toolName, toolArgs, ctx);

          this.sendToClient({
            type: 'tool_executed',
            toolName,
            args: toolArgs,
            result: result.data || result.error,
            status: result.success ? 'SUCCESS' : 'FAILED',
          });

          // Send tool output back to OpenAI Realtime session
          if (this.openaiWs && this.openaiWs.readyState === WebSocket.OPEN) {
            const toolResponseItem = {
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: callId,
                output: JSON.stringify(result),
              },
            };
            this.openaiWs.send(JSON.stringify(toolResponseItem));

            // Prompt model to speak the result
            const createResponse = {
              type: 'response.create',
            };
            this.openaiWs.send(JSON.stringify(createResponse));
          }
          break;
        }

        // 9. Error from OpenAI
        case 'error': {
          console.error('[OpenAI Realtime Error Event]:', event.error);
          this.sendToClient({
            type: 'error',
            message: event.error?.message || 'OpenAI Realtime error encountered.',
          });
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error('[OpenAI Realtime] Failed to parse OpenAI event:', e);
    }
  }

  /**
   * Handle incoming audio chunk or control commands from client
   */
  public handleClientMessage(data: string | Buffer): void {
    if (!this.isAlive || !this.openaiWs || this.openaiWs.readyState !== WebSocket.OPEN) return;

    try {
      const parsed = JSON.parse(data.toString());

      if (parsed.type === 'audio' && parsed.audio) {
        this.openaiWs.send(
          JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: parsed.audio,
          })
        );
      } else if (parsed.type === 'text_input' && parsed.text) {
        db.addTranscript(this.callId, 'visitor', parsed.text);
        this.openaiWs.send(
          JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: parsed.text,
                },
              ],
            },
          })
        );
        this.openaiWs.send(JSON.stringify({ type: 'response.create' }));
      } else if (parsed.type === 'update_vad' && typeof parsed.threshold === 'number') {
        const clamped = Math.max(0.4, Math.min(0.95, parsed.threshold));
        this.openaiWs.send(
          JSON.stringify({
            type: 'session.update',
            session: {
              audio: {
                input: {
                  turn_detection: {
                    type: 'server_vad',
                    threshold: clamped,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 600,
                    create_response: true,
                    interrupt_response: true,
                  },
                },
              },
            },
          })
        );
      } else if (parsed.type === 'end_call') {
        this.cleanup();
      }
    } catch (e) {
      if (Buffer.isBuffer(data)) {
        const base64 = data.toString('base64');
        this.openaiWs.send(
          JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64,
          })
        );
      }
    }
  }

  private sendToClient(data: Record<string, any>): void {
    if (this.clientWs.readyState === WebSocket.OPEN) {
      this.clientWs.send(JSON.stringify(data));
    }
  }

  public cleanup(): void {
    this.isAlive = false;

    if (this.openaiWs) {
      try {
        this.openaiWs.close();
      } catch {}
      this.openaiWs = null;
    }

    const session = db.getCallSession(this.callId);
    if (session && session.status === 'IN_PROGRESS') {
      const duration = Math.max(1, Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000));
      db.updateCallSession(this.callId, {
        status: 'COMPLETED',
        endTime: new Date().toISOString(),
        durationSeconds: duration,
      });
      db.recordAudit(
        'VISITOR',
        'VOICE_AGENT',
        'CALL_COMPLETED',
        this.callId,
        `Saras Dynamics voice session ended. Duration: ${duration}s. Model: ${this.model}.`,
        'SUCCESS'
      );
    }
  }
}
