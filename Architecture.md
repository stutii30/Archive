# Archive — System Architecture

> Campus resource hub & community platform  
> Stack: React · Java (Spring Boot) · MySQL

---

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────┐
│                   Client Layer                  │
│          React SPA  (Vite + React Router)        │
│   Library │ Community │ Events │ Auth / Profile  │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS / REST + JSON
┌──────────────────────▼──────────────────────────┐
│                  API Gateway / Nginx             │
│     (reverse proxy, SSL termination, CORS)       │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│            Spring Boot Application               │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  Auth    │  │ Resource  │  │  Community   │  │
│  │  Module  │  │  Module   │  │  Module      │  │
│  └──────────┘  └───────────┘  └──────────────┘  │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  Events  │  │  Search   │  │  File        │  │
│  │  Module  │  │  Module   │  │  Storage Svc │  │
│  └──────────┘  └───────────┘  └──────────────┘  │
└──────────┬──────────────────────────────────────┘
           │
    ┌──────┴──────┐
    │    MySQL    │     ← primary relational store
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │  S3 / MinIO │     ← binary file storage (PDFs, images)
    └─────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Tech choices
| Concern | Choice |
|---|---|
| Framework | React 18 (Vite) |
| Routing | React Router v6 |
| State management | Zustand (global) + React Query (server state) |
| Styling | Vanilla CSS with CSS custom properties (design tokens) |
| Forms | React Hook Form |
| Icons | Inline SVGs (consistent with mockup) |
| Fonts | Space Grotesk · Inter · JetBrains Mono (Google Fonts) |

### 2.2 Folder structure
```
src/
├── assets/              # static images, fonts
├── components/
│   ├── ui/              # atomic: Button, Chip, Avatar, Badge, Tag, Modal
│   ├── layout/          # Sidebar, Topbar, AppShell
│   ├── library/         # ResourceCard, ResourceGrid, FilterBar, UploadModal
│   ├── community/       # PostCard, Composer, PostBadge, AttachChip, ReplyThread
│   └── events/          # EventCard, EventStrip, TimelineView, SaveButton
├── pages/
│   ├── LibraryPage.jsx
│   ├── CommunityPage.jsx
│   └── EventsPage.jsx
├── hooks/               # useAuth, useTheme, useSearch, useInfiniteScroll
├── store/               # zustand slices: auth, theme
├── services/            # axios instances + API calls per module
├── styles/
│   ├── tokens.css       # all CSS custom properties (design tokens)
│   ├── base.css         # reset + typography
│   └── utilities.css    # reusable helper classes
└── main.jsx
```

### 2.3 Key routing
```
/                  → redirect → /library
/library           → LibraryPage
/library/:id       → ResourceDetailPage
/community         → CommunityPage
/community/:postId → PostDetailPage (with thread)
/events            → EventsPage
/events/:id        → EventDetailPage
/profile           → ProfilePage
/auth/login        → LoginPage
/auth/register     → RegisterPage
```

### 2.4 Theme system
- Theme stored in `localStorage` and Zustand.
- Applied as `data-theme` attribute on `<html>`.
- Four themes: `light` · `dark-grey` · `black` · `dark-blue`.
- All components exclusively reference CSS custom properties — zero hardcoded colors.

---

## 3. Backend Architecture

### 3.1 Tech choices
| Concern | Choice |
|---|---|
| Framework | Spring Boot 3.x |
| Auth | Spring Security + JWT (access + refresh tokens) |
| ORM | Spring Data JPA + Hibernate |
| Database | MySQL 8.x |
| File uploads | Spring Multipart → S3/MinIO |
| Search | MySQL FULLTEXT index (phase 1); Elasticsearch (phase 2) |
| Validation | Jakarta Bean Validation |
| API docs | SpringDoc OpenAPI (Swagger UI) |

### 3.2 Module breakdown

#### Auth Module — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | email + password + college info |
| POST | `/login` | returns `accessToken` + `refreshToken` |
| POST | `/refresh` | rotate refresh token |
| POST | `/logout` | invalidate token |

JWT payload: `userId`, `email`, `roles`

#### Resource Module — `/api/resources`
| Method | Path | Description |
|---|---|---|
| GET | `/` | list with filters (type, subject, semester, chapter) |
| GET | `/:id` | resource detail + metadata |
| POST | `/` | upload file (multipart) + metadata JSON |
| PUT | `/:id` | update metadata |
| DELETE | `/:id` | soft delete |
| GET | `/search?q=` | fulltext search |
| POST | `/:id/bookmark` | save to user's bookmarks |

#### Community Module — `/api/posts`
| Method | Path | Description |
|---|---|---|
| GET | `/` | paginated feed (filter by type, tag, linked resource) |
| GET | `/:id` | single post + nested replies |
| POST | `/` | create post (type: DOUBT / PLACEMENT / RESOURCE_SHARE / QA_PROBLEM / DSA_PROBLEM) |
| PUT | `/:id` | edit post (author only) |
| DELETE | `/:id` | soft delete |
| POST | `/:id/replies` | add reply (supports one level of nesting) |
| POST | `/:id/upvote` | toggle upvote |
| POST | `/:id/bookmark` | save post |

#### Events Module — `/api/events`
| Method | Path | Description |
|---|---|---|
| GET | `/` | list upcoming events (sorted by date; filter by type) |
| GET | `/:id` | event detail + full timeline stages |
| POST | `/` | create event |
| PUT | `/:id` | update event |
| DELETE | `/:id` | soft delete |
| POST | `/:id/stages` | add a timeline stage |
| PUT | `/:id/stages/:stageId` | edit stage |
| DELETE | `/:id/stages/:stageId` | remove stage |
| POST | `/:id/save` | toggle save/reminder for logged-in user |

#### Search Module — `/api/search`
| Method | Path | Description |
|---|---|---|
| GET | `/?q=&scope=` | unified search across resources / posts / events |

---

## 4. Database Schema

### 4.1 Users
```sql
users
  id             BIGINT        PK AUTO_INCREMENT
  name           VARCHAR(100)
  email          VARCHAR(150)  UNIQUE NOT NULL
  password_hash  VARCHAR(255)
  college        VARCHAR(150)
  department     VARCHAR(100)
  year           TINYINT
  avatar_url     VARCHAR(500)
  role           ENUM('STUDENT','MODERATOR','ADMIN') DEFAULT 'STUDENT'
  created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP
  updated_at     DATETIME      ON UPDATE CURRENT_TIMESTAMP
```

### 4.2 Resources
```sql
resources
  id             BIGINT        PK AUTO_INCREMENT
  uploader_id    BIGINT        FK → users.id
  title          VARCHAR(300)  NOT NULL
  description    TEXT
  type           ENUM('NOTES','PYQ','DSA','QA','LAB_MANUAL','PLACEMENT','OTHER')
  subject        VARCHAR(150)
  department     VARCHAR(100)
  semester       TINYINT
  chapter        VARCHAR(200)
  file_url       VARCHAR(1000)
  file_type      VARCHAR(20)       -- pdf, docx, sheet
  file_size_kb   INT
  download_count INT           DEFAULT 0
  bookmark_count INT           DEFAULT 0
  is_deleted     BOOLEAN       DEFAULT FALSE
  created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP

resource_bookmarks
  user_id        BIGINT        FK → users.id
  resource_id    BIGINT        FK → resources.id
  saved_at       DATETIME
  PRIMARY KEY (user_id, resource_id)
```

### 4.3 Community
```sql
posts
  id                  BIGINT        PK AUTO_INCREMENT
  author_id           BIGINT        FK → users.id
  type                ENUM('DOUBT','PLACEMENT','RESOURCE_SHARE','QA_PROBLEM','DSA_PROBLEM')
  title               VARCHAR(500)
  body                TEXT
  linked_resource_id  BIGINT        FK → resources.id  NULL
  upvote_count        INT           DEFAULT 0
  reply_count         INT           DEFAULT 0
  is_deleted          BOOLEAN       DEFAULT FALSE
  created_at          DATETIME      DEFAULT CURRENT_TIMESTAMP

post_tags
  post_id    BIGINT   FK → posts.id
  tag        VARCHAR(80)
  INDEX(tag)

replies
  id               BIGINT   PK AUTO_INCREMENT
  post_id          BIGINT   FK → posts.id
  parent_reply_id  BIGINT   FK → replies.id  NULL   -- one-level nesting
  author_id        BIGINT   FK → users.id
  body             TEXT
  upvote_count     INT      DEFAULT 0
  is_deleted       BOOLEAN  DEFAULT FALSE
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP

post_upvotes
  user_id  BIGINT   FK → users.id
  post_id  BIGINT   FK → posts.id
  PRIMARY KEY (user_id, post_id)

post_bookmarks
  user_id   BIGINT   FK → users.id
  post_id   BIGINT   FK → posts.id
  saved_at  DATETIME
  PRIMARY KEY (user_id, post_id)
```

### 4.4 Events
```sql
events
  id                  BIGINT       PK AUTO_INCREMENT
  creator_id          BIGINT       FK → users.id
  title               VARCHAR(300) NOT NULL
  description         TEXT
  organizer           VARCHAR(200)
  type                ENUM('HACKATHON','FEST','PLACEMENT','CONTEST','SEMINAR','OTHER')
  location            VARCHAR(300)
  start_date          DATE
  end_date            DATE
  registration_link   VARCHAR(1000)
  registrant_count    INT          DEFAULT 0
  is_deleted          BOOLEAN      DEFAULT FALSE
  created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP

event_stages
  id            BIGINT       PK AUTO_INCREMENT
  event_id      BIGINT       FK → events.id
  stage_number  TINYINT
  title         VARCHAR(300)
  description   TEXT
  start_dt      DATETIME
  end_dt        DATETIME

event_saves
  user_id   BIGINT   FK → users.id
  event_id  BIGINT   FK → events.id
  remind    BOOLEAN  DEFAULT TRUE
  saved_at  DATETIME
  PRIMARY KEY (user_id, event_id)
```

---

## 5. File Storage

- All binary uploads (PDFs, images) go to **S3-compatible storage** (AWS S3 in prod, MinIO locally).
- The backend uploads the file and stores the resulting URL in `resources.file_url`.
- Download URLs are **pre-signed** (short-lived, generated per-request).
- Max upload size: **50 MB** (configurable).
- Accepted MIME types (validated server-side): `application/pdf`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.*`, `image/*`.

---

## 6. Auth & Security

- **JWT** access tokens (15 min TTL) + **refresh tokens** (7-day TTL, stored as `HttpOnly` cookie).
- Passwords hashed with **BCrypt** (strength 12).
- Role-based access: `STUDENT` can CRUD own content · `MODERATOR` can soft-delete any content · `ADMIN` has full access.
- CORS restricted to the frontend origin only.
- File upload endpoints require auth; public read endpoints (resources, posts, events) are unauthenticated so sharing links work without login.

---

## 7. Development Environment

### Local setup
```
/archive-frontend    ← Vite React app         (port 5173)
/archive-backend     ← Spring Boot app        (port 8080)
/docker-compose.yml  ← MySQL 8 + MinIO containers
```

### Backend environment variables
```env
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/archive_db
SPRING_DATASOURCE_USERNAME=archive
SPRING_DATASOURCE_PASSWORD=***
JWT_SECRET=***
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=archive-files
STORAGE_ACCESS_KEY=***
STORAGE_SECRET_KEY=***
```

---

## 8. Phased Roadmap

| Phase | Scope |
|---|---|
| **P1 — Core** | Auth, Resource upload/browse, Community feed + posts, Events list + timeline |
| **P2 — Engagement** | Replies & upvotes, Bookmarks, Notifications, Email reminders for saved events |
| **P3 — Discovery** | Elasticsearch-powered search, Trending algorithm, Recommended resources |
| **P4 — Social** | User profiles, Follow system, Activity feed, Contribution scores |

---

*Last updated: 2026-07-28*
