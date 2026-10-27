-- V4: Resources + Resource Bookmarks
-- FULLTEXT index on searchable fields (MySQL 8 InnoDB supports FULLTEXT natively).

CREATE TABLE resources (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    uploader_id     BIGINT          NOT NULL,
    title           VARCHAR(300)    NOT NULL,
    description     TEXT,
    type            ENUM('NOTES','PYQ','DSA','QA','LAB_MANUAL','PLACEMENT','OTHER')
                                    NOT NULL DEFAULT 'OTHER',
    subject         VARCHAR(150),
    department      VARCHAR(100),
    semester        TINYINT,
    chapter         VARCHAR(200),
    file_url        VARCHAR(1000),
    file_key        VARCHAR(500)    NOT NULL,   -- object key in MinIO/S3
    file_type       VARCHAR(20),                -- pdf, docx, pptx, jpg, …
    file_size_kb    INT,
    download_count  INT             NOT NULL DEFAULT 0,
    bookmark_count  INT             NOT NULL DEFAULT 0,
    is_deleted      BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_resources_uploader FOREIGN KEY (uploader_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_resources_uploader    ON resources (uploader_id);
CREATE INDEX idx_resources_type        ON resources (type);
CREATE INDEX ft_resources_search ON resources (title, subject, chapter);
CREATE INDEX idx_resources_department  ON resources (department);
CREATE INDEX idx_resources_semester    ON resources (semester);
CREATE INDEX idx_resources_created     ON resources (created_at DESC);

CREATE TABLE resource_bookmarks (
    user_id     BIGINT   NOT NULL,
    resource_id BIGINT   NOT NULL,
    saved_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, resource_id),
    CONSTRAINT fk_rb_user     FOREIGN KEY (user_id)     REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_rb_resource FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_rb_resource ON resource_bookmarks (resource_id);
