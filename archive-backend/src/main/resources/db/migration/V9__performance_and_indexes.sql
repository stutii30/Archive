-- V9: Performance & Indexes — Composite indexes for query acceleration

CREATE INDEX idx_resources_type_dept_sem ON resources (type, department, semester);
CREATE INDEX idx_posts_type_created ON posts (type, created_at DESC);
CREATE INDEX idx_events_start_date ON events (start_date ASC);
