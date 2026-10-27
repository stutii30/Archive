-- V2: Users table
-- Character set and collation inherited from archive_db (utf8mb4 / utf8mb4_unicode_ci)

CREATE TABLE users (
    id             BIGINT          NOT NULL AUTO_INCREMENT,
    name           VARCHAR(100)    NOT NULL,
    email          VARCHAR(150)    NOT NULL,
    password_hash  VARCHAR(255)    NOT NULL,
    college        VARCHAR(150),
    department     VARCHAR(100),
    year           TINYINT,
    avatar_url     VARCHAR(500),
    role           ENUM('STUDENT', 'MODERATOR', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_role ON users (role);

CREATE TABLE verification_codes (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    email       VARCHAR(150)    NOT NULL,
    code        VARCHAR(10)     NOT NULL,
    purpose     VARCHAR(30)     NOT NULL,
    expires_at  DATETIME        NOT NULL,
    used        BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
