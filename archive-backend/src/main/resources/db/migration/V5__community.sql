-- V5: Community — posts, post_tags, replies, upvotes, bookmarks

CREATE TABLE posts (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    author_id           BIGINT        NOT NULL,
    type                ENUM('DOUBT','PLACEMENT','RESOURCE_SHARE','QA_PROBLEM','DSA_PROBLEM')
                                      NOT NULL DEFAULT 'DOUBT',
    title               VARCHAR(400)  NOT NULL,
    body                TEXT,
    linked_resource_id  BIGINT,
    upvote_count        INT           NOT NULL DEFAULT 0,
    reply_count         INT           NOT NULL DEFAULT 0,
    bookmark_count      INT           NOT NULL DEFAULT 0,
    is_deleted          BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_posts_author   FOREIGN KEY (author_id)          REFERENCES users (id),
    CONSTRAINT fk_posts_resource FOREIGN KEY (linked_resource_id) REFERENCES resources (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_posts_author   ON posts (author_id);
CREATE INDEX idx_posts_type     ON posts (type);
CREATE INDEX idx_posts_created  ON posts (created_at DESC);
CREATE INDEX idx_posts_resource ON posts (linked_resource_id);

CREATE TABLE post_tags (
    post_id BIGINT       NOT NULL,
    tag     VARCHAR(80)  NOT NULL,

    PRIMARY KEY (post_id, tag),
    CONSTRAINT fk_pt_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pt_tag ON post_tags (tag);

CREATE TABLE replies (
    id              BIGINT  NOT NULL AUTO_INCREMENT,
    post_id         BIGINT  NOT NULL,
    author_id       BIGINT  NOT NULL,
    parent_reply_id BIGINT,              -- NULL = top-level; non-null = nested (one level)
    body            TEXT    NOT NULL,
    upvote_count    INT     NOT NULL DEFAULT 0,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_replies_post   FOREIGN KEY (post_id)         REFERENCES posts   (id) ON DELETE CASCADE,
    CONSTRAINT fk_replies_author FOREIGN KEY (author_id)       REFERENCES users   (id),
    CONSTRAINT fk_replies_parent FOREIGN KEY (parent_reply_id) REFERENCES replies (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_replies_post   ON replies (post_id, created_at ASC);
CREATE INDEX idx_replies_parent ON replies (parent_reply_id);

CREATE TABLE post_upvotes (
    user_id    BIGINT NOT NULL,
    post_id    BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_pu_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_pu_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pu_post ON post_upvotes (post_id);

CREATE TABLE post_bookmarks (
    user_id    BIGINT NOT NULL,
    post_id    BIGINT NOT NULL,
    saved_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_pb_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_pb_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pb_post ON post_bookmarks (post_id);
