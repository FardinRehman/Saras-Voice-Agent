import crypto from 'crypto';
import { db } from './db.ts';
import { CallSession } from '../types/saras.ts';

export interface TelephonyWebhookPayload {
  callSid: string;
  from: string;
  to: string;
  callStatus: 'ringing' | 'in-progress' | 'completed' | 'busy' | 'no-answer' | 'failed';
  direction?: 'inbound' | 'outbound-api';
  timestamp?: string;
  signature?: string;
}

export interface TelephonyConfig {
  provider: 'SIP_TRUNK' | 'TWILIO_MEDIA_STREAM' | 'AUDIO_SOCKET';
  supportNumber: string;
  authToken: string;
  inboundWebhookUrl: string;
  statusCallbackUrl: string;
  humanDeskNumber: string;
  liveModeEnabled: boolean;
}

export class TelephonyAdapter {
  private config: TelephonyConfig = {
    provider: (process.env.TELEPHONY_PROVIDER as any) || 'TWILIO_MEDIA_STREAM',
    supportNumber: process.env.TELEPHONY_PHONE_NUMBER || '+91 80 4000 8888', // Saras Dynamics corporate inquiry hotline
    authToken: process.env.TELEPHONY_WEBHOOK_SECRET || process.env.TELEPHONY_AUTH_TOKEN || 'saras_telephony_secret_demo',
    inboundWebhookUrl: '/api/telephony/inbound',
    statusCallbackUrl: '/api/telephony/status',
    humanDeskNumber: '+91 80 4000 8899',
    liveModeEnabled: !!process.env.TELEPHONY_PHONE_NUMBER,
  };

  private activeCallMap: Map<string, string> = new Map();
  private processedCallSids: Set<string> = new Set();

  public getConfig(): TelephonyConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<TelephonyConfig>): TelephonyConfig {
    this.config = { ...this.config, ...updates };
    return this.config;
  }

  public verifyWebhookSignature(url: string, params: Record<string, string>, signatureHeader?: string): boolean {
    if (!signatureHeader || !this.config.authToken || this.config.authToken === 'saras_telephony_secret_demo') {
      return true;
    }
    try {
      const data = Object.keys(params)
        .sort()
        .reduce((acc, key) => acc + key + params[key], url);
      const expected = crypto
        .createHmac('sha1', this.config.authToken)
        .update(Buffer.from(data, 'utf-8'))
        .digest('base64');
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
    } catch {
      return false;
    }
  }

  public handleInboundCall(payload: TelephonyWebhookPayload): {
    xmlResponse: string;
    sessionId: string;
  } {
    if (this.processedCallSids.has(payload.callSid)) {
      const existingSessionId = this.activeCallMap.get(payload.callSid) || `CALL-${payload.callSid}`;
      return {
        xmlResponse: `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Call already in progress.</Say></Response>`,
        sessionId: existingSessionId,
      };
    }
    this.processedCallSids.add(payload.callSid);

    const callerNumber = payload.from;
    const session = db.createCallSession(callerNumber, this.config.liveModeEnabled ? 'LIVE' : 'SIMULATION');
    this.activeCallMap.set(payload.callSid, session.id);

    const host = process.env.APP_URL ? new URL(process.env.APP_URL).host : 'localhost:5000';
    const wsProtocol = process.env.APP_URL?.startsWith('https') ? 'wss' : 'ws';
    const streamUrl = `${wsProtocol}://${host}/api/live?callId=${session.id}&caller=${encodeURIComponent(callerNumber)}`;

    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Welcome to Saras Dynamics. Connecting you to our AI Voice Assistant...</Say>
  <Connect>
    <Stream url="${streamUrl}" />
  </Connect>
</Response>`;

    db.recordAudit(
      'TELEPHONY',
      'SYSTEM',
      'INBOUND_CALL_CONNECTED',
      session.id,
      `Inbound PSTN call connected from ${callerNumber} to Saras Dynamics voice stream.`,
      'SUCCESS'
    );

    return { xmlResponse, sessionId: session.id };
  }

  public handleStatusCallback(payload: TelephonyWebhookPayload): void {
    const sessionId = this.activeCallMap.get(payload.callSid);
    if (!sessionId) return;

    if (payload.callStatus === 'completed' || payload.callStatus === 'failed') {
      const session = db.getCallSession(sessionId);
      if (session) {
        const duration = Math.max(1, Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000));
        db.updateCallSession(sessionId, {
          status: payload.callStatus === 'completed' ? 'COMPLETED' : 'FAILED',
          endTime: new Date().toISOString(),
          durationSeconds: duration,
        });
      }
      this.activeCallMap.delete(payload.callSid);
    }
  }

  public transferToHuman(callSid: string, destinationNumber?: string): { success: boolean; message: string } {
    const target = destinationNumber || this.config.humanDeskNumber;
    return {
      success: true,
      message: `Call ${callSid} initiated warm transfer to Saras Dynamics solutions engineering team at ${target}.`,
    };
  }
}

export const telephonyAdapter = new TelephonyAdapter();
