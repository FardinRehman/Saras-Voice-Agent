-- ====================================================================
-- Saras Dynamics AI Voice Agent - Core PostgreSQL Schema
-- Migration: 001_initial_schema.sql
-- Company: Saras Dynamics (https://www.sarasdynamics.com/)
-- ====================================================================

-- Enable pgvector extension if available on PostgreSQL instance
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgvector extension not installed; proceeding with numeric/array vector fallback';
END
$$;

-- 1. Administrative Staff & Role-Based Access Control
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'SALES_LEAD', 'AI_ENGINEER', 'AUDITOR')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. Customer Enquiries & Lead Management
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(64) PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    company_name VARCHAR(150),
    required_service VARCHAR(100) NOT NULL,
    project_description TEXT NOT NULL,
    estimated_budget VARCHAR(64),
    expected_timeline VARCHAR(64),
    additional_requirements TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'IN_DISCUSSION', 'QUALIFIED', 'CONVERTED', 'CLOSED')),
    assigned_to VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    internal_notes TEXT,
    conversation_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- 3. Ingested Knowledge Documents (PDF, DOCX, TXT)
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id VARCHAR(64) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(32) NOT NULL,
    file_size INT NOT NULL,
    chunk_count INT DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'PROCESSED' CHECK (status IN ('PROCESSING', 'PROCESSED', 'FAILED')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    extracted_text TEXT,
    hash VARCHAR(64) NOT NULL
);

-- 4. Ingested Website Pages (https://www.sarasdynamics.com/...)
CREATE TABLE IF NOT EXISTS website_pages (
    id VARCHAR(64) PRIMARY KEY,
    url VARCHAR(512) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'INDEXED' CHECK (status IN ('PENDING', 'INDEXED', 'FAILED')),
    last_crawled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    chunk_count INT DEFAULT 0,
    content_hash VARCHAR(64) NOT NULL
);

-- 5. Dynamic Company Knowledge Chunks (RAG vector items)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    source VARCHAR(32) NOT NULL CHECK (source IN ('WEBSITE', 'DOCUMENT', 'MANUAL')),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    url VARCHAR(512),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chunks_category ON knowledge_chunks(category);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON knowledge_chunks(source);

-- 6. Voice Call Sessions & Visitor Interactions
CREATE TABLE IF NOT EXISTS call_sessions (
    id VARCHAR(64) PRIMARY KEY,
    customer_name VARCHAR(150),
    customer_email VARCHAR(150),
    caller_number VARCHAR(32) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INT DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'RINGING' CHECK (status IN ('RINGING', 'IN_PROGRESS', 'COMPLETED', 'TRANSFERRED', 'FAILED')),
    mode VARCHAR(16) NOT NULL DEFAULT 'SIMULATION' CHECK (mode IN ('SIMULATION', 'LIVE')),
    language VARCHAR(32) NOT NULL DEFAULT 'English',
    sentiment VARCHAR(16) DEFAULT 'NEUTRAL' CHECK (sentiment IN ('POSITIVE', 'NEUTRAL', 'FRUSTRATED')),
    escalated_to_human BOOLEAN DEFAULT FALSE,
    lead_captured BOOLEAN DEFAULT FALSE,
    lead_id VARCHAR(64) REFERENCES leads(id) ON DELETE SET NULL,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_calls_start ON call_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_calls_lead ON call_sessions(lead_id);

-- 7. Call Transcripts (Visitor and Agent dialogue turns)
CREATE TABLE IF NOT EXISTS call_transcripts (
    id VARCHAR(64) PRIMARY KEY,
    call_id VARCHAR(64) NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    speaker VARCHAR(16) NOT NULL CHECK (speaker IN ('visitor', 'agent', 'system')),
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transcripts_call ON call_transcripts(call_id);

-- 8. Tool Executions Record (RAG telemetry & Lead registration logs)
CREATE TABLE IF NOT EXISTS tool_executions (
    id VARCHAR(64) PRIMARY KEY,
    call_id VARCHAR(64) NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    args JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(16) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
    execution_time_ms INT NOT NULL DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tool_exec_call ON tool_executions(call_id);

-- 9. Security Audit Log (Append-only governance trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_id VARCHAR(100),
    details TEXT NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE', 'WARNING')),
    ip_address VARCHAR(45) NOT NULL DEFAULT '127.0.0.1'
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
