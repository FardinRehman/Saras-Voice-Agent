# Saras Dynamics — AI Voice Agent
### Official Virtual Representative for Saras Dynamics (https://www.sarasdynamics.com/)
### Powered by OpenAI Realtime API (`gpt-realtime`) & Dynamic RAG Knowledge Base

An enterprise-grade, speech-to-speech AI Voice Assistant engineered to represent **Saras Dynamics**, an AI automation, software services, and digital engineering company based in Coimbatore, Tamil Nadu, India. 

The AI agent communicates naturally with website visitors, explains engineering capabilities and services, discusses production architectures and portfolio case studies, and conversationally captures qualified business leads into the CRM pipeline.

---

## 🌟 Key Highlights

- **Hands-Free Speech-to-Speech (OpenAI Realtime API)**:
  Continuous bidirectional audio streaming with low-latency turn-taking. Employs server-side Voice Activity Detection (`server_vad`) with customizable sensitivity thresholds to automatically detect speech completion and isolate the primary speaker from background chatter.
- **Natural Indian English Persona & Human-Like Delivery**:
  Warm, articulate, friendly, and fluent Indian English technology consultant persona (`coral` default voice) with natural acknowledgements ("*Absolutely!*", "*Sure, I'd be happy to help*"), smooth transitions, phonetic guidance for Indian terms and tech stacks, and real-time audio evaluation tools in the Admin Dashboard.
- **Natural Barge-In & Interruption Handling**:
  Instantly halts audio playback on the client and flushes the buffer as soon as the visitor interrupts, seamlessly yielding to process the new inquiry.
- **Dynamic RAG Company Knowledge Grounding**:
  Integrates official information from [https://www.sarasdynamics.com/](https://www.sarasdynamics.com/). Strictly prioritizes verified company data and eliminates hallucinations on pricing, deliverables, or testimonials.
- **Conversational Lead Capture & CRM Pipeline**:
  Collects prospect contact information, project scope, budget range, and timeline during conversations. Confirms details with the visitor and registers them in the PostgreSQL lead management pipeline.
- **Enterprise 14-Module Admin Dashboard**:
  Comprehensive administrative control: Overview, AI Voice Agent Configuration, Live Conversations, Conversation History, Customer Enquiries, Lead Management, Company Knowledge Base, Website Content Management, Document Management (PDF/DOCX/TXT), AI Analytics, Team Management, Roles & RBAC, System Settings, and Audit Logs.
- **Dual Transport & Database Architecture**:
  - **Voice Transport**: Direct WebRTC peer connection using ephemeral tokens or bidirectional WebSocket bridge (`/api/live`).
  - **Storage**: Production PostgreSQL connection pooling (`pg.Pool`) with automated schema migrations (`001_initial_schema.sql`) and dual-engine in-memory vector fallback for instant zero-dependency local development.

---

## 🏛️ Official Saras Dynamics Knowledge Domain

### Core Engineering Services
1. **Artificial Intelligence & Autonomous Systems**: Custom Large Language Model (LLM) fine-tuning, enterprise Retrieval-Augmented Generation (RAG) pipelines, autonomous AI agents with tool use, and predictive neural modeling.
2. **Full-Stack & Web Architecture**: High-performance web applications, Next.js App Router architectures, distributed micro-frontends, and high-concurrency API gateways.
3. **Mobile Engineering**: Native iOS (Swift) and Android (Kotlin) applications, cross-platform React Native/Flutter, offline-first synchronization, and BLE biometric telemetry.
4. **Cloud Infrastructure & DevOps**: Resilient production Kubernetes clusters (EKS/GKE/AKS), multi-cloud setups (AWS/GCP/Azure), Docker containerization, and zero-downtime CI/CD automation.
5. **Intelligent Automation**: Automated business workflows, ETL data transformation pipelines, robotic tasks, and enterprise ERP (SAP/Oracle) and CRM integrations.
6. **Experience Architecture (UI/UX & Product Design)**: Design systems adhering to WCAG 2.1 AA accessibility, interactive prototyping, and proprietary design products (*DIcons*, *DShapes*, *Graaadients*).

### Featured Deployments & Portfolio Case Studies
- **Aegis Neural Engine**: Autonomous AI decision platform and predictive neural evaluation engine with sub-50ms inference latency across 1.2M daily inferences.
- **Apex FinTech Terminal**: High-performance financial web platform with real-time WebSocket order book visualization and sub-100ms render cycles.
- **Nexus Health Wearable**: Mobile application and digital health ecosystem featuring continuous BLE biometric telemetry and offline-first SQLite synchronization.
- **Proprietary Design Assets**: DIcons (1,200+ vector icons), DShapes (generative geometric vectors), Graaadients (mesh gradient palette system).

---

## 💬 Conversation Scenarios Supported

- **Scenario A (Company Introduction)**:
  *Visitor:* "What is Saras Dynamics?"
  *Agent:* "Saras Dynamics is a software and AI engineering company specializing in intelligent software, enterprise AI systems, digital platforms, and automation solutions."
- **Scenario B (Services Overview)**:
  *Visitor:* "What services do you provide?"
  *Agent:* "Saras Dynamics offers AI and autonomous systems, full-stack web development, mobile engineering, cloud infrastructure and DevOps, intelligent automation, and UI/UX product design."
- **Scenario C (AI Development)**:
  *Visitor:* "Can you develop a custom AI agent?"
  *Agent:* "Saras Dynamics works with custom LLM integrations, RAG pipelines, and autonomous AI systems. Could you tell me a little about the type of AI agent you want to build?"
- **Scenario D (Web Development)**:
  *Visitor:* "Do you develop web applications?"
  *Agent:* "Yes. Saras Dynamics provides full-stack web development, high-performance web applications, distributed micro-frontends, and robust API platforms."
- **Scenario E (Project Enquiry & Lead Capture)**:
  *Visitor:* "I want to build a mobile application for my business."
  *Agent:* "Certainly! Could you tell me about your business and the main features you want in the application?" *(Gathers name, email, phone, and scope conversationally)*
- **Scenario F (Pricing & Safe Unknown Handling)**:
  *Visitor:* "What is your exact project development price?"
  *Agent:* "Project pricing depends on the requirements, complexity, and scope. I don't have a verified pricing schedule available, but I can collect your requirements for our engineering team to review and prepare a custom proposal."

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, Web Audio API |
| **Backend** | Node.js (v20+), Express.js, TypeScript (`tsx`), WebSockets (`ws`) |
| **AI Voice Engine** | **OpenAI Realtime API** (`gpt-realtime`), Voice: `coral` / `alloy`, OpenAI TTS (`tts-1`) |
| **Database & Vector** | PostgreSQL 15+ with pgvector support, connection pooling (`pg.Pool`), in-memory dual-engine fallback |
| **Telephony** | Twilio Media Streams, SIP Trunking, RFC 2104 HMAC webhook verification |
| **Security** | Scrypt password hashing, sliding-window rate limiting, RBAC governance |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **PostgreSQL** *(optional; automatically runs in-memory vector fallback if `DATABASE_URL` is omitted)*

### 2. Installation
```bash
git clone https://github.com/FardinRehman/Saras-Voice-Agent.git
cd Saras-Voice-Agent
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure your `.env` contains:
```env
PORT=5000
APP_URL=http://localhost:5000
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_REALTIME_MODEL=gpt-realtime
OPENAI_REALTIME_VOICE=coral
DATABASE_URL=postgresql://postgres:password@localhost:5432/saras_dynamics_voice
```

### 4. Running the Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5000`.

### 5. Running the Test Suite
Run the 36-assertion Saras Dynamics verification suite:
```bash
npm test
```

### 6. Production Build
```bash
npm run build
npm start
```

---

## 🐳 Docker Deployment

A production-ready `Dockerfile` and `docker-compose.yml` are provided.

To build and run via Docker Compose:
```bash
docker-compose up --build
```
This spins up the Saras Dynamics Node.js server along with a PostgreSQL instance preconfigured for vector storage.

---

## 📜 Role-Based Access Control (RBAC)

Default credentials for administrative access:
- **SUPER_ADMIN**: `admin` / `Saras_SuperAdmin@2026!`
- **SALES_LEAD**: `sales_lead` / `Saras_SalesLead@2026!`
- **AI_ENGINEER**: `ai_engineer` / `Saras_AiEng@2026!`
- **AUDITOR**: `auditor` / `Saras_Auditor@2026!`

---

## 🏢 Company Contact & Info

- **Company Name**: Saras Dynamics
- **Official Website**: [https://www.sarasdynamics.com/](https://www.sarasdynamics.com/)
- **Headquarters**: Coimbatore, Tamil Nadu, India
- **Engagements**: Free discovery calls, written technical proposals, and agile sprint deliverables.
