-- V6: Events — events, event_stages, event_saves

CREATE TABLE events (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    creator_id          BIGINT        NOT NULL,
    title               VARCHAR(300)  NOT NULL,
    description         TEXT,
    organizer           VARCHAR(200),
    type                ENUM('HACKATHON','FEST','PLACEMENT','CONTEST','SEMINAR','OTHER')
                                      NOT NULL DEFAULT 'OTHER',
    location            VARCHAR(300),
    start_date          DATE,
    end_date            DATE,
    registration_link   VARCHAR(1000),
    registrant_count    INT           NOT NULL DEFAULT 0,
    is_deleted          BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_events_creator FOREIGN KEY (creator_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_events_creator ON events (creator_id);
CREATE INDEX idx_events_type    ON events (type);
CREATE INDEX idx_events_start   ON events (start_date ASC);

CREATE TABLE event_stages (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    event_id     BIGINT       NOT NULL,
    stage_number TINYINT      NOT NULL DEFAULT 1,
    title        VARCHAR(300) NOT NULL,
    description  TEXT,
    start_dt     DATETIME,
    end_dt       DATETIME,

    PRIMARY KEY (id),
    CONSTRAINT fk_es_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_es_event_stage ON event_stages (event_id, stage_number ASC);

CREATE TABLE event_saves (
    user_id  BIGINT   NOT NULL,
    event_id BIGINT   NOT NULL,
    remind   BOOLEAN  NOT NULL DEFAULT TRUE,
    saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, event_id),
    CONSTRAINT fk_evs_user  FOREIGN KEY (user_id)  REFERENCES users (id)  ON DELETE CASCADE,
    CONSTRAINT fk_evs_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_evs_event ON event_saves (event_id);
