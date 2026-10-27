-- V10: Resource Reviews and Ratings

CREATE TABLE resource_reviews (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    resource_id BIGINT       NOT NULL,
    user_id     BIGINT       NOT NULL,
    rating      TINYINT      NOT NULL DEFAULT 5,
    comment     TEXT,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_rr_resource FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE,
    CONSTRAINT fk_rr_user     FOREIGN KEY (user_id)     REFERENCES users (id)     ON DELETE CASCADE,
    CONSTRAINT uk_rr_resource_user UNIQUE (resource_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_rr_resource ON resource_reviews (resource_id);
