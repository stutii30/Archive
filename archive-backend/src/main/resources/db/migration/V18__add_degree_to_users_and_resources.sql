-- V18: Add degree to users and resources
ALTER TABLE users ADD COLUMN degree VARCHAR(100);
ALTER TABLE resources ADD COLUMN degree VARCHAR(100);

-- Populate sensible defaults for existing demo records
UPDATE users SET degree = 'B.Tech' WHERE degree IS NULL AND (department LIKE '%Computer%' OR department LIKE '%CSE%' OR department LIKE '%Engineering%');
UPDATE users SET degree = 'LLB' WHERE degree IS NULL AND (department LIKE '%LLB%' OR department LIKE '%Law%');
UPDATE users SET degree = 'MBA' WHERE degree IS NULL AND (department LIKE '%MBA%' OR department LIKE '%Management%');

UPDATE resources SET degree = 'B.Tech' WHERE degree IS NULL;

CREATE INDEX idx_users_degree ON users (degree);
CREATE INDEX idx_resources_degree ON resources (degree);
