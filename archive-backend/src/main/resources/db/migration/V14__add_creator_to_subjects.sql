-- V14: Add creator_id to subjects table to track subject creators
ALTER TABLE subjects ADD COLUMN creator_id BIGINT NULL;
ALTER TABLE subjects ADD CONSTRAINT fk_subjects_creator FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX idx_subjects_creator ON subjects (creator_id);
