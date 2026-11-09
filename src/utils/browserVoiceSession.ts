import { executeSarasTool, ToolExecutionContext } from '../server/tools.ts';
import { db } from '../server/db.ts';

export interface MockSocketEvent {
  data: string;
}

export type MockMessageHandler = (event: MockSocketEvent) => void;

/**
 * In-browser simulated WebSocket connection that mimics the OpenAI Realtime backend
 * for Saras Dynamics voice interactions with human-like Indian English personality.
 */
export class BrowserVoiceSession {
  public readyState: number = 0; // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
  public onopen: (() => void) | null = null;
  public onmessage: MockMessageHandler | null = null;
  public onerror: ((error: any) => void) | null = null;
  public onclose: (() => void) | null = null;

  private callId: string;
  private callerPhone?: string;
  private visitorName?: string;
  private leadStep: 'IDLE' | 'ASK_NAME' | 'ASK_EMAIL' | 'ASK_PHONE' | 'ASK_DETAILS' | 'CONFIRM' = 'IDLE';
  private pendingLead: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    service?: string;
    description?: string;
  } = {};

  constructor(callId: string, callerPhone?: string, initialVisitorName?: string) {
    this.callId = callId;
    this.callerPhone = callerPhone || '+91 98765 43210';
    this.visitorName = initialVisitorName;

    // Simulate connection
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen();

      // Human-like welcoming greeting from Saras Dynamics AI Voice Assistant
      setTimeout(() => {
        const greeting = this.visitorName
          ? `Hey ${this.visitorName}! Welcome to Saras Dynamics. I'm Saras, your AI assistant. It's great to have you here! I can help you explore our AI solutions, software development services, or even discuss an idea you're planning to build. So, what brings you here today?`
          : `Hey! Welcome to Saras Dynamics. I'm Saras, your AI assistant. It's great to have you here! I can help you explore our AI solutions, software development services, or even discuss an idea you're planning to build. So, what brings you here today?`;
        this.emitTranscript('agent', greeting);
        this.speakBrowser(greeting);
      }, 500);
    }, 150);
  }

  public send(data: string): void {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'end_call') {
        this.close();
        return;
      }

      if (msg.type === 'text_input' && msg.text) {
        this.handleUserInput(msg.text);
      }
    } catch {
      // ignore raw audio chunks in browser simulation mode
    }
  }

  public close(): void {
    this.readyState = 3; // CLOSED
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.onclose) this.onclose();
  }

  private emit(payload: any): void {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(payload) });
    }
  }

  private emitTranscript(speaker: 'agent' | 'visitor', text: string): void {
    db.addTranscript(this.callId, speaker, text);
    this.emit({
      type: 'transcript',
      speaker,
      text,
      isPartial: false,
    });
  }

  private speakBrowser(text: string): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Prefer Indian English voice if available in the browser's synthesis voices
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes('en-in') ||
          v.lang.toLowerCase().includes('en_in') ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('veena') ||
          v.name.toLowerCase().includes('neerja') ||
          v.name.toLowerCase().includes('ravi')
      );
      if (indianVoice) {
        utterance.voice = indianVoice;
      }

      utterance.onend = () => {
        this.emit({ type: 'turn_complete' });
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        this.emit({ type: 'turn_complete' });
      }, 1500);
    }
  }

  private async handleUserInput(rawText: string): Promise<void> {
    const text = rawText.trim().toLowerCase();

    const toolContext: ToolExecutionContext = {
      callId: this.callId,
      callerPhone: this.callerPhone,
      visitorName: this.visitorName,
    };

    // 1. Conversational Lead Capture Workflow (Section 8)
    if (this.leadStep !== 'IDLE') {
      if (this.leadStep === 'ASK_NAME') {
        const cleanedName = rawText.replace(/my name is|i am|this is/gi, '').trim();
        this.pendingLead.name = cleanedName || rawText.trim();
        this.leadStep = 'ASK_EMAIL';
        const reply = `Nice to meet you, ${this.pendingLead.name}! What's the best email address to reach you?`;
        this.emitTranscript('agent', reply);
        this.speakBrowser(reply);
        return;
      }

      if (this.leadStep === 'ASK_EMAIL') {
        const foundEmail = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        this.pendingLead.email = foundEmail ? foundEmail[0] : rawText.trim();
        this.leadStep = 'ASK_PHONE';
        const reply = `Got it, ${this.pendingLead.email}. And what's a good phone number for our solutions team to follow up?`;
        this.emitTranscript('agent', reply);
        this.speakBrowser(reply);
        return;
      }

      if (this.leadStep === 'ASK_PHONE') {
        this.pendingLead.phone = rawText.trim();
        this.leadStep = 'ASK_DETAILS';
        const reply = `Thanks! Could you tell me a little about what you're planning to build and your key objectives?`;
        this.emitTranscript('agent', reply);
        this.speakBrowser(reply);
        return;
      }

      if (this.leadStep === 'ASK_DETAILS') {
        this.pendingLead.description = rawText.trim();

        // Finalize and submit lead
        this.emit({
          type: 'tool_executing',
          toolName: 'capture_customer_lead',
          args: {
            customerName: this.pendingLead.name || this.visitorName || 'Prospective Client',
            email: this.pendingLead.email,
            phone: this.pendingLead.phone || this.callerPhone || '+91 98765 43210',
            requiredService: this.pendingLead.service || 'AI & Autonomous Systems',
            projectDescription: this.pendingLead.description,
          },
        });

        const execResult = await executeSarasTool(
          'capture_customer_lead',
          {
            customerName: this.pendingLead.name || this.visitorName || 'Prospective Client',
            email: this.pendingLead.email,
            phone: this.pendingLead.phone || this.callerPhone || '+91 98765 43210',
            requiredService: this.pendingLead.service || 'AI & Autonomous Systems',
            projectDescription: this.pendingLead.description,
          },
          toolContext
        );

        this.emit({
          type: 'tool_executed',
          toolName: 'capture_customer_lead',
          args: {},
          result: execResult.data || execResult.error,
          status: execResult.success ? 'SUCCESS' : 'FAILED',
        });

        this.leadStep = 'IDLE';
        this.pendingLead = {};
        const reply = `Perfect! I've successfully registered your enquiry with our team. Our solutions team can now review the details and get back to you shortly.`;
        this.emitTranscript('agent', reply);
        this.speakBrowser(reply);
        return;
      }
    }

    // 2. Scenario 1: "Hey, what do you guys actually do?"
    if (
      text.includes('actually do') ||
      text.includes('what do you guys do') ||
      text.includes('what does saras dynamics do') ||
      text.includes('who are you') ||
      text.includes('what is saras')
    ) {
      const reply = `Hey! So, we're a technology and AI engineering company based in Coimbatore. We work on things like custom AI solutions, high-performance web applications, mobile apps, and intelligent automation pipelines. Are you exploring something specific for your business?`;
      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 3. Scenario 2: "Can you build an AI chatbot for my business?"
    if (
      text.includes('chatbot') ||
      text.includes('build an ai') ||
      text.includes('voice assistant') ||
      text.includes('chat bot') ||
      text.includes('virtual agent')
    ) {
      const reply = `Absolutely! We can definitely build that. Just to understand your idea better, are you looking for a website chatbot, a voice-based assistant like me, or something that integrates directly with your business systems and database?`;
      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 4. Scenario 3: "How much will it cost?" / Pricing
    if (
      text.includes('how much will it cost') ||
      text.includes('cost') ||
      text.includes('pricing') ||
      text.includes('rates') ||
      text.includes('how much does it cost')
    ) {
      const reply = `Good question! It really depends on the features, complexity, and overall scope of the project. If you tell me a little about what you have in mind, I can collect the requirements so our team can review them and prepare a suitable proposal.`;
      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 5. Scenario 4: "Can I speak to your team?" / Contact & Project Enquiry
    if (
      text.includes('speak to your team') ||
      text.includes('talk to someone') ||
      text.includes('contact your team') ||
      text.includes('hire you') ||
      text.includes('start a project') ||
      text.includes('discuss a project')
    ) {
      this.leadStep = this.visitorName ? 'ASK_EMAIL' : 'ASK_NAME';
      if (this.visitorName) {
        this.pendingLead.name = this.visitorName;
        const reply = `Of course! I'd be happy to help you connect with our team. What's the best email address to reach you at?`;
        this.emitTranscript('agent', reply);
        this.speakBrowser(reply);
      } else {
        const reply = `Of course! I'd be happy to help you connect with the team. May I take your name first so we can arrange a follow-up?`;
        this.emitTranscript('agent', reply);
        this.speakBrowser(reply);
      }
      return;
    }

    // 6. Technical Question: "Can you explain how RAG-based AI systems work?"
    if (
      text.includes('rag') ||
      text.includes('retrieval-augmented') ||
      text.includes('retrieval augmented') ||
      text.includes('how rag works')
    ) {
      const reply = `In simple terms, RAG—or Retrieval-Augmented Generation—connects an AI model directly to your company's live documents and database. When someone asks a question, the system retrieves only verified facts from your knowledge base and feeds them into the model. That gives you accurate, hallucination-free answers grounded in your business data. Is this something you're planning to implement?`;
      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 7. Services Overview: "What services do you provide?"
    if (
      text.includes('what services') ||
      text.includes('services do you offer') ||
      text.includes('what do you provide') ||
      text.includes('capabilities')
    ) {
      const reply = `At Saras Dynamics, we work across a few areas. We build AI-powered systems, web and mobile applications, cloud infrastructure, and intelligent automation solutions. So, depending on what you're planning, we can explore the right approach together. Which of these areas are you most interested in?`;
      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 8. Custom AI / Autonomous Systems
    if (text.includes('custom ai') || text.includes('llm') || text.includes('autonomous')) {
      this.emit({
        type: 'tool_executing',
        toolName: 'get_service_details',
        args: { serviceKey: 'ai_autonomous_systems' },
      });

      const execResult = await executeSarasTool('get_service_details', { serviceKey: 'ai_autonomous_systems' }, toolContext);

      this.emit({
        type: 'tool_executed',
        toolName: 'get_service_details',
        args: { serviceKey: 'ai_autonomous_systems' },
        result: execResult.data,
        status: 'SUCCESS',
      });

      const reply = `That's something we specialize in! We build domain-specific LLM integrations, RAG pipelines, and autonomous workflow agents. Could you tell me a little more about what you're planning to build?`;
      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 9. Web & Mobile Development
    if (text.includes('web') || text.includes('mobile') || text.includes('app') || text.includes('next.js') || text.includes('ios') || text.includes('android')) {
      const reply = `Sure! On the web, we build high-performance Next.js and React platforms with real-time streaming. And on mobile, we build native iOS and Android apps, as well as React Native and Flutter with offline synchronization. Are you looking to launch a new product or modernize an existing one?`;
      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 10. Case Studies (Aegis, Apex, Nexus)
    if (text.includes('aegis') || text.includes('apex') || text.includes('nexus') || text.includes('case study') || text.includes('portfolio')) {
      let key = 'aegis_neural_engine';
      if (text.includes('apex') || text.includes('fintech')) key = 'apex_fintech_terminal';
      else if (text.includes('nexus') || text.includes('health')) key = 'nexus_health_wearable';
      else if (text.includes('dicon') || text.includes('design')) key = 'design_assets_dicons';

      this.emit({
        type: 'tool_executing',
        toolName: 'get_portfolio_case_study',
        args: { projectKey: key },
      });

      const execResult = await executeSarasTool('get_portfolio_case_study', { projectKey: key }, toolContext);

      this.emit({
        type: 'tool_executed',
        toolName: 'get_portfolio_case_study',
        args: { projectKey: key },
        result: execResult.data,
        status: 'SUCCESS',
      });

      const title = execResult.data?.title || 'Our Deployment';
      const desc = execResult.data?.description || 'Engineered by Saras Dynamics.';
      const reply = `The interesting part is that ${title} delivers ${desc}. Would you like to explore building a similar architecture for your organization?`;
      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 11. Default RAG Knowledge Base Retrieval
    this.emit({
      type: 'tool_executing',
      toolName: 'retrieve_company_knowledge',
      args: { query: rawText },
    });

    const execResult = await executeSarasTool('retrieve_company_knowledge', { query: rawText }, toolContext);

    this.emit({
      type: 'tool_executed',
      toolName: 'retrieve_company_knowledge',
      args: { query: rawText },
      result: execResult.data,
      status: 'SUCCESS',
    });

    const chunks = execResult.data?.retrievedChunks || [];
    let responseText = '';
    if (chunks.length > 0) {
      responseText = `So, here's how that works. ${chunks[0].content} Would you like to dive deeper into any part of that?`;
    } else {
      responseText = `That's something our solution architects can definitely discuss with you. While I don't have that specific detail in our verified records right now, I can note down your requirements so our team can follow up with you. Would you like to share your contact details?`;
    }

    this.emitTranscript('agent', responseText);
    this.speakBrowser(responseText);
  }
}
