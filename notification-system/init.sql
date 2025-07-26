CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS outbox_event (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dead Letter Queue table for tracking failed messages
CREATE TABLE IF NOT EXISTS dlq_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_key VARCHAR(255),
    original_payload JSONB NOT NULL,
    error_message TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'FAILED', -- FAILED, RETRYING, RESOLVED
    retry_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient DLQ queries
CREATE INDEX IF NOT EXISTS idx_dlq_status ON dlq_messages(status);
CREATE INDEX IF NOT EXISTS idx_dlq_failed_at ON dlq_messages(failed_at);
CREATE INDEX IF NOT EXISTS idx_dlq_message_key ON dlq_messages(message_key); 