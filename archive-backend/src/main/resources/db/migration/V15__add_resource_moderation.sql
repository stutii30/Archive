-- V15: Add AI moderation status, flag, and notice columns to resources table
ALTER TABLE resources ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';
ALTER TABLE resources ADD COLUMN moderation_flag VARCHAR(100) DEFAULT NULL;
ALTER TABLE resources ADD COLUMN ai_notice VARCHAR(500) DEFAULT NULL;

CREATE INDEX idx_resources_status ON resources(status);
