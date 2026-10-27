-- V8: Discovery & Profiles — trending score & FULLTEXT search indexes

ALTER TABLE resources ADD COLUMN trending_score DOUBLE NOT NULL DEFAULT 0.0;
ALTER TABLE posts ADD COLUMN trending_score DOUBLE NOT NULL DEFAULT 0.0;

CREATE INDEX idx_resources_trending ON resources (trending_score DESC);
CREATE INDEX idx_posts_trending ON posts (trending_score DESC);

ALTER TABLE posts ADD INDEX ft_posts_search (title, body);
ALTER TABLE events ADD INDEX ft_events_search (title, description, organizer);
