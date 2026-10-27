# Archive — Implementation Task List

> Full production roadmap from blank repo to live app.  
> References: [Architecture](file:///c:/Users/nastu/Desktop/Archive/Architecture.md) · [Design Language](file:///c:/Users/nastu/Desktop/Archive/Design.md) · [Mockup](file:///c:/Users/nastu/Desktop/Archive/Archive.html)

---

## Legend

| Symbol | Meaning |
|---|---|
| `[ ]` | Not started |
| `[/]` | In progress |
| `[x]` | Complete |
| 🖥 | Frontend task |
| ⚙️ | Backend task |
| 🗄 | Database task |
| 🧪 | Testing task |
| 🚀 | DevOps / Infra task |

---

## Phase 0 — Project Scaffolding & Dev Environment

> Goal: Both repos boot, talk to each other, and the local dev environment is fully reproducible.

### 0.1 Repository & Tooling
- `[x]` 🚀 Create monorepo root or two sibling repos: `archive-frontend` / `archive-backend`
- `[x]` 🚀 Add `.gitignore` for Node, Java, IntelliJ, VS Code, `.env` files
- `[x]` 🚀 Add root `README.md` with setup instructions (prerequisites, `docker-compose up`, run commands)
- `[x]` 🚀 Configure `EditorConfig` for consistent indentation across both repos

### 0.2 Frontend Scaffolding
- `[x]` 🖥 Initialise Vite + React 18 project (`npm create vite@latest archive-frontend -- --template react`)
- `[x]` 🖥 Install core dependencies: `react-router-dom`, `zustand`, `@tanstack/react-query`, `axios`, `react-hook-form`
- `[x]` 🖥 Set up folder structure: `components/`, `pages/`, `hooks/`, `store/`, `services/`, `styles/`
- `[x]` 🖥 Create `styles/tokens.css` — all CSS custom properties for all 4 themes (copy from Design.md)
- `[x]` 🖥 Create `styles/base.css` — reset, `box-sizing`, body font, smooth scrolling, `::selection`
- `[x]` 🖥 Create `styles/utilities.css` — helper classes (`.mono`, `.display`, `.sr-only`, flex utils)
- `[x]` 🖥 Wire Google Fonts import in `index.html` (Space Grotesk, Inter, JetBrains Mono)
- `[x]` 🖥 Set up React Router v6 with a root layout route
- `[x]` 🖥 Configure Vite proxy (`/api` → `http://localhost:8080`) for local dev
- `[x]` 🖥 Set up Axios instance in `services/api.js` with base URL + JWT interceptor stubs

### 0.3 Backend Scaffolding
- `[x]` ⚙️ Generate Spring Boot 3.x project via Spring Initializr: Web, JPA, Security, Validation, DevTools, MySQL Driver, Lombok
- `[x]` ⚙️ Set up project package structure: `auth`, `resource`, `community`, `events`, `search`, `storage`, `common`
- `[x]` ⚙️ Configure `application.yml` (dev profile): datasource, JPA, multipart max-size, CORS
- `[x]` ⚙️ Add SpringDoc OpenAPI dependency; verify Swagger UI loads at `/swagger-ui.html`
- `[x]` ⚙️ Create global exception handler (`@ControllerAdvice`) with standard error response shape
- `[x]` ⚙️ Create standard API response wrapper: `ApiResponse<T> { success, data, error, timestamp }`

### 0.4 Database & Infrastructure
- `[x]` 🗄 Write `docker-compose.yml`: MySQL 8 container + MinIO container + named volumes
- `[x]` 🗄 Create `archive_db` schema; configure character set `utf8mb4`, collation `utf8mb4_unicode_ci`
- `[x]` 🗄 Add Flyway (or Liquibase) for database migrations; create initial `V1__init.sql` (empty, just verifies connectivity)
- `[ ]` 🚀 Verify full stack boots: `docker-compose up` → Spring Boot connects → frontend proxy hits `/api/health`

---

## Phase 1 — Authentication & App Shell

> Goal: Users can register, log in, and see the fully themed shell with working theme switching.

### 1.1 Database
- `[x]` 🗄 Migration `V2__users.sql` — create `users` table (see Architecture §4.1)
- `[x]` 🗄 Migration `V3__refresh_tokens.sql` — create `refresh_tokens` table (token hash, user_id, expiry, revoked)

### 1.2 Backend — Auth Module
- `[x]` ⚙️ Create `User` entity + `UserRepository`
- `[x]` ⚙️ Create `RefreshToken` entity + `RefreshTokenRepository`
- `[x]` ⚙️ Implement `POST /api/auth/register` — validate email uniqueness, hash password (BCrypt strength 12), persist user, return 201
- `[x]` ⚙️ Implement `POST /api/auth/login` — validate credentials, issue JWT access token (15 min) + refresh token (7 days as HttpOnly cookie)
- `[x]` ⚙️ Implement `POST /api/auth/refresh` — validate refresh token cookie, rotate tokens
- `[x]` ⚙️ Implement `POST /api/auth/logout` — revoke refresh token in DB
- `[x]` ⚙️ Configure Spring Security: JWT filter chain, public routes whitelist, CORS policy
- `[x]` ⚙️ Create `UserDetailsService` implementation
- `[x]` ⚙️ Implement `GET /api/auth/me` — return current user profile from JWT

### 1.3 Frontend — Auth Pages
- `[x]` 🖥 Build `LoginPage.jsx` — email + password form, React Hook Form, submit to `/api/auth/login`
- `[x]` 🖥 Build `RegisterPage.jsx` — name, email, password, college, department, year
- `[x]` 🖥 Create `useAuth` hook (wraps Zustand auth store + axios calls)
- `[x]` 🖥 Create `authStore.js` (Zustand) — `user`, `accessToken`, `setAuth`, `logout`
- `[x]` 🖥 Implement Axios request interceptor — attach `Authorization: Bearer <token>` header
- `[x]` 🖥 Implement Axios response interceptor — on 401, attempt token refresh, retry original request
- `[x]` 🖥 Create `ProtectedRoute` wrapper — redirect to `/auth/login` if unauthenticated
- `[x]` 🖥 Style auth pages using design tokens (consistent with app shell aesthetic)

### 1.4 Frontend — App Shell
- `[x]` 🖥 Build `AppShell.jsx` — flex layout: `<Sidebar>` + `<main>` (matches mockup structure)
- `[x]` 🖥 Build `Sidebar.jsx` — brand mark (three rotating tabs), nav items, theme picker, profile chip
- `[x]` 🖥 Build `Topbar.jsx` — search bar, notification bell icon-btn, primary action button (context-aware)
- `[x]` 🖥 Create `useTheme` hook + `themeStore.js` — persist `data-theme` to `localStorage`, apply on `<html>`
- `[x]` 🖥 Wire theme swatch picker in sidebar: clicking a swatch calls `setTheme()`
- `[x]` 🖥 Create atomic UI components:
  - `[x]` 🖥 `Button.jsx` — variants: `primary`, `ghost`, `icon`
  - `[x]` 🖥 `Avatar.jsx` — gradient background, initials, optional image
  - `[x]` 🖥 `Chip.jsx` — active / inactive states, optional color dot
  - `[x]` 🖥 `Badge.jsx` — type-colored small label
  - `[x]` 🖥 `Tag.jsx` — mono font, `--paper` bg
  - `[x]` 🖥 `Modal.jsx` — centered overlay, `--r-xl` radius, `--shadow-lg`

### 1.5 Testing
- `[x]` 🧪 Backend: unit tests for JWT generation, validation, expiry
- `[ ]` 🧪 Backend: integration test for register → login → refresh → logout flow
- `[ ]` 🧪 Frontend: smoke test that login form submits and stores token

---

## Phase 2 — Library (Resource Module)

> Goal: Students can browse, filter, and upload resources. Binder-tab cards display correctly across all themes.

### 2.1 Database
- `[x]` 🗄 Migration `V4__resources.sql` — create `resources` + `resource_bookmarks` tables

### 2.2 Backend — Resource Module
- `[x]` ⚙️ Create `Resource` entity + `ResourceRepository`
- `[x]` ⚙️ Create `ResourceBookmark` entity + repository
- `[x]` ⚙️ Implement `GET /api/resources` — paginated, filterable by `type`, `subject`, `department`, `semester`, `chapter`; default sort by `created_at DESC`
- `[x]` ⚙️ Implement `GET /api/resources/:id` — single resource detail with uploader info
- `[x]` ⚙️ Implement `POST /api/resources` (auth required) — accept multipart/form-data: file + JSON metadata part
  - Validate MIME type + max size (50 MB)
  - Upload file to MinIO; store returned URL in `file_url`
  - Persist resource record
- `[x]` ⚙️ Implement `PUT /api/resources/:id` (auth, author only) — update metadata
- `[x]` ⚙️ Implement `DELETE /api/resources/:id` (auth, author or moderator) — soft delete
- `[x]` ⚙️ Implement `GET /api/resources/search?q=` — MySQL FULLTEXT search on `title + description + subject + chapter`
- `[x]` ⚙️ Implement `POST /api/resources/:id/bookmark` (auth) — toggle bookmark; update `bookmark_count`
- `[x]` ⚙️ Implement `GET /api/resources/:id/download` — increment `download_count`, return pre-signed MinIO URL
- `[x]` ⚙️ Create `StorageService` — wraps MinIO Java SDK: `upload(file)`, `presignedDownloadUrl(key)`

### 2.3 Frontend — Library Page
- `[x]` 🖥 Build `LibraryPage.jsx` — page header, filter bar, resource grid
- `[x]` 🖥 Build `FilterBar.jsx` — type chip row + subject chip row (with color dots); chips toggle active state
- `[x]` 🖥 Build `ResourceCard.jsx` — binder tab, kind-badge, filetype mono, title, meta, footer (uploader avatar + download + bookmark stats)
- `[x]` 🖥 Build `ResourceGrid.jsx` — `auto-fill` CSS grid wrapper, renders list of `ResourceCard`
- `[x]` 🖥 Build `UploadModal.jsx` — multi-step: (1) file drag-and-drop, (2) metadata form (title, type, subject, semester, chapter, description), (3) confirm + upload progress bar
- `[x]` 🖥 Build `ResourceDetailPage.jsx` — full metadata, preview embed (PDF iframe / image), download button, bookmark toggle, uploader card
- `[x]` 🖥 Create `useResources` hook (React Query) — `useResourceList(filters)`, `useResource(id)`, `useUploadResource()`, `useToggleBookmark(id)`
- `[x]` 🖥 Create `resourceService.js` — all API calls for resource endpoints
- `[x]` 🖥 Implement infinite scroll on Library feed (`useInfiniteScroll` hook)
- `[x]` 🖥 Implement skeleton loaders for ResourceCard (shimmer animation)
- `[x]` 🖥 Wire "Upload resource" topbar button to open `UploadModal`

### 2.4 Testing
- `[ ]` 🧪 Backend: upload file → verify MinIO object created + DB record inserted
- `[ ]` 🧪 Backend: filter combinations return correct results
- `[ ]` 🧪 Backend: soft delete hides resource from list endpoint
- `[ ]` 🧪 Frontend: filter chips update displayed cards; upload modal completes flow

---

## Phase 3 — Community Module

> Goal: Students can post, reply, upvote, and attach resources. Feed is filterable by post type.

### 3.1 Database
- `[x]` 🗄 Migration `V5__community.sql` — create `posts`, `post_tags`, `replies`, `post_upvotes`, `post_bookmarks` tables

### 3.2 Backend — Community Module
- `[x]` ⚙️ Create `Post`, `PostTag`, `Reply`, `PostUpvote`, `PostBookmark` entities + repositories
- `[x]` ⚙️ Implement `GET /api/posts` — paginated; filter by `type`, `tag`, `linked_resource_id`; sort by `created_at DESC`
- `[x]` ⚙️ Implement `GET /api/posts/:id` — post detail with author info, tags, linked resource preview, top-level replies (paginated), reply counts
- `[x]` ⚙️ Implement `POST /api/posts` (auth) — create post with type, title, body, tags array, optional `linked_resource_id`
- `[x]` ⚙️ Implement `PUT /api/posts/:id` (auth, author only) — edit title, body, tags
- `[x]` ⚙️ Implement `DELETE /api/posts/:id` (auth, author or moderator) — soft delete
- `[x]` ⚙️ Implement `POST /api/posts/:id/replies` (auth) — add reply; optional `parent_reply_id` for one-level nesting; increment post `reply_count`
- `[x]` ⚙️ Implement `POST /api/posts/:id/upvote` (auth) — toggle upvote; update `upvote_count`
- `[x]` ⚙️ Implement `POST /api/posts/:id/bookmark` (auth) — toggle post bookmark
- `[x]` ⚙️ Add trending tag query — group `post_tags` by tag, count posts in last 7 days, return top 10

### 3.3 Frontend — Community Page
- `[x]` 🖥 Build `CommunityPage.jsx` — two-column layout: feed (left) + right rail (right)
- `[x]` 🖥 Build `Composer.jsx` — avatar + textarea; post-type segment pills (Doubt / Placement / Resource Share / QA Problem / DSA Problem); attach-resource picker; tag input; submit button
- `[x]` 🖥 Build `AttachResourcePicker.jsx` — search-as-you-type dropdown of own/all resources; renders selected resource as `AttachChip`
- `[x]` 🖥 Build `PostCard.jsx` — header (avatar, name, type badge, time), title, body snippet, attach chip (if linked resource), tags, action row (upvote, reply count, bookmark)
- `[x]` 🖥 Build `PostDetailPage.jsx` — full post body, attach chip, tags, reply thread
- `[x]` 🖥 Build `ReplyThread.jsx` — flat list of top-level replies; each reply can expand nested replies (one level)
- `[x]` 🖥 Build `ReplyComposer.jsx` — inline reply form below each post/reply
- `[x]` 🖥 Build right rail cards:
  - `[x]` 🖥 `TrendingTagsCard.jsx`
  - `[ ]` 🖥 `DoubtOfTheDayCard.jsx` (highest reply count in last 24h)
  - `[ ]` 🖥 `ActiveUsersCard.jsx` (top contributors this week)
- `[x]` 🖥 Create `usePosts` hook (React Query) — `usePostFeed(filters)`, `usePost(id)`, `useCreatePost()`, `useUpvotePost(id)`, `useReplies(postId)`
- `[x]` 🖥 Create `communityService.js` — all API calls
- `[x]` 🖥 Implement optimistic upvote (toggle count instantly, revert on error)
- `[x]` 🖥 Implement infinite scroll on post feed

### 3.4 Testing
- `[ ]` 🧪 Backend: create post → appears in feed → filter by type returns only matching posts
- `[ ]` 🧪 Backend: reply nesting — top-level reply + nested reply, verify reply_count increments
- `[ ]` 🧪 Backend: upvote toggle — two calls result in count unchanged
- `[ ]` 🧪 Frontend: composer submits correct payload; post appears in feed without page refresh

---

## Phase 4 — Events Module

> Goal: Students can browse, create, and save events with full timeline breakdowns.

### 4.1 Database
- `[x]` 🗄 Migration `V6__events.sql` — create `events`, `event_stages`, `event_saves` tables

### 4.2 Backend — Events Module
- `[x]` ⚙️ Create `Event`, `EventStage`, `EventSave` entities + repositories
- `[x]` ⚙️ Implement `GET /api/events` — paginated; filter by `type`; sorted by `start_date ASC`; include `days_until` computed field
- `[x]` ⚙️ Implement `GET /api/events/:id` — event detail + all stages ordered by `stage_number` + save status for current user
- `[x]` ⚙️ Implement `POST /api/events` (auth) — create event with all fields + optional initial stages array
- `[x]` ⚙️ Implement `PUT /api/events/:id` (auth, creator or admin) — update event metadata
- `[x]` ⚙️ Implement `DELETE /api/events/:id` (auth, creator or admin) — soft delete
- `[x]` ⚙️ Implement `POST /api/events/:id/stages` (auth, creator) — add a stage; auto-assign `stage_number`
- `[x]` ⚙️ Implement `PUT /api/events/:id/stages/:stageId` (auth, creator) — edit stage
- `[x]` ⚙️ Implement `DELETE /api/events/:id/stages/:stageId` (auth, creator) — remove stage; renumber remaining
- `[x]` ⚙️ Implement `POST /api/events/:id/save` (auth) — toggle save; return new saved state

### 4.3 Frontend — Events Page
- `[x]` 🖥 Build `EventsPage.jsx` — page header with "Create event" button, horizontal event strip, detail panel
- `[x]` 🖥 Build `EventStrip.jsx` — horizontally scrollable row of `EventCard` components
- `[x]` 🖥 Build `EventCard.jsx` — countdown badge, title, organizer, date, save button (amber saved state, selected ring)
- `[x]` 🖥 Build `EventDetailPanel.jsx` — title, meta row (date + location + registrant count), save/remind button, timeline
- `[x]` 🖥 Build `TimelineView.jsx` — vertical timeline: dot + line + stage content (stage label, title, description, date range)
- `[x]` 🖥 Build `CreateEventModal.jsx` — multi-step: (1) basic info (title, type, organizer, location, dates, registration link), (2) timeline stages builder (add/remove/reorder stages), (3) preview + submit
- `[x]` 🖥 Build `StageBuilder.jsx` — drag-reorderable list of stage rows inside `CreateEventModal`
- `[x]` 🖥 Build `EventDetailPage.jsx` — standalone full-page version (for direct URL access)
- `[x]` 🖥 Create `useEvents` hook (React Query) — `useEventList()`, `useEvent(id)`, `useCreateEvent()`, `useSaveEvent(id)`
- `[x]` 🖥 Create `eventsService.js` — all API calls
- `[x]` 🖥 Implement clicking EventCard → sets selected state + loads detail panel (no page navigation for panel; URL updates to `/events/:id`)

### 4.4 Testing
- `[x]` 🧪 Backend: create event with stages → verify stage ordering + `days_until` calculation
- `[x]` 🧪 Backend: save toggle — verify `event_saves` row created/deleted
- `[x]` 🧪 Frontend: event card click loads correct detail; save button toggles amber state

---

## Phase 5 — Engagement Features

> Goal: Bookmarks, notification bell, email reminders for saved events, and moderator tools.

### 5.1 Bookmarks
- `[x]` ⚙️ Implement `GET /api/users/me/bookmarks/resources` — paginated list of bookmarked resources
- `[x]` ⚙️ Implement `GET /api/users/me/bookmarks/posts` — paginated list of bookmarked posts
- `[x]` 🖥 Add "Saved" section to sidebar nav
- `[x]` 🖥 Build `BookmarksPage.jsx` — tabbed view: Resources tab + Posts tab; reuses `ResourceCard` and `PostCard`

### 5.2 In-App Notifications
- `[x]` 🗄 Migration `V7__notifications.sql` — `notifications` table: `id`, `user_id`, `type`, `title`, `body`, `read`, `link`, `created_at`
- `[x]` ⚙️ Create `Notification` entity + `NotificationRepository`
- `[x]` ⚙️ Create `NotificationService` — `notify(userId, type, title, body, link)`
- `[x]` ⚙️ Trigger notifications on: reply to own post, upvote milestone (10, 50, 100), new resource in saved subject, event reminder (1 day before)
- `[x]` ⚙️ Implement `GET /api/notifications` (auth) — paginated; unread first
- `[x]` ⚙️ Implement `POST /api/notifications/:id/read` (auth) — mark as read
- `[x]` ⚙️ Implement `POST /api/notifications/read-all` (auth)
- `[x]` 🖥 Build notification bell in Topbar — badge count of unread; dropdown list of recent notifications
- `[x]` 🖥 Create `useNotifications` hook — polling or SSE (Server-Sent Events) for real-time updates
- `[x]` 🖥 Mark as read on open + individual dismiss

### 5.3 Email Reminders
- `[x]` ⚙️ Add JavaMailSender dependency + configure SMTP (Gmail/SendGrid)
- `[x]` ⚙️ Create `EmailService` — HTML email templates for: event reminder, account welcome
- `[x]` ⚙️ Create `EventReminderScheduler` — Spring `@Scheduled` task: nightly job finds events starting in ≤24h where user has `remind=true`; sends reminder email

### 5.4 Moderator Tools
- `[x]` ⚙️ Add `MODERATOR` role checks to soft-delete endpoints (resources, posts, replies)
- `[x]` ⚙️ Implement `GET /api/admin/reports` — flagged content queue (future: flag endpoint)
- `[x]` 🖥 Moderator-only "Remove" context menu on post/resource cards (visible only when `role === MODERATOR`)

### 5.5 Testing
- `[x]` 🧪 Backend: notification triggers fire correctly; unread count is accurate
- `[x]` 🧪 Backend: event reminder scheduler finds correct users and events
- `[x]` 🧪 Frontend: bell badge updates; notification dropdown renders and marks read

---

## Phase 6 — Discovery & Profiles

> Goal: Powerful search, trending algorithm, and rich user profile pages.

### 6.1 Unified Search
- `[x]` ⚙️ Implement `GET /api/search?q=&scope=all|resources|posts|events` — fan-out query to FULLTEXT indexes across all three tables; merge and rank results; return typed result list
- `[x]` 🖥 Wire Topbar search bar to `/api/search`
- `[x]` 🖥 Build `SearchResultsPage.jsx` — scoped tabs (All / Resources / Posts / Events); reuses existing cards
- `[x]` 🖥 Add keyboard shortcut `Cmd/Ctrl+K` to focus search bar

### 6.2 Trending Algorithm
- `[x]` ⚙️ Create a scheduled job (hourly) that computes trending scores:
  - Resources: `downloads_last_24h * 2 + bookmarks_last_24h * 3`
  - Posts: `upvotes_last_24h * 2 + replies_last_24h * 1.5`
- `[x]` ⚙️ Store scores in `trending_score` column (add via migration)
- `[x]` ⚙️ Expose `GET /api/resources?sort=trending` and `GET /api/posts?sort=trending`
- `[x]` 🖥 Add "Trending" sort option to Library filter bar
- `[x]` 🖥 Add "Trending" tab to Community feed

### 6.3 User Profiles
- `[x]` 🗄 No new tables needed; derive stats from existing tables
- `[x]` ⚙️ Implement `GET /api/users/:id` — public profile: name, college, department, year, avatar, contribution stats (uploads, posts, total downloads received)
- `[x]` ⚙️ Implement `PUT /api/users/me` (auth) — update name, college, department, year, avatar (upload to MinIO)
- `[x]` 🖥 Build `ProfilePage.jsx` — avatar, name, role chip, college, stats row (resources uploaded, posts, total downloads), tabs: Uploads / Posts / Bookmarks
- `[x]` 🖥 Build `EditProfileModal.jsx` — form to update profile fields + avatar upload
- `[x]` 🖥 Make uploader names and avatars in resource/post cards link to `ProfilePage`

### 6.4 Recommended Resources (Simple)
- `[x]` ⚙️ Implement `GET /api/resources/recommended` — resources in the same department/semester as the current user, sorted by trending score
- `[x]` 🖥 Add "Recommended for you" section at top of LibraryPage (when logged in)

### 6.5 Testing
- `[x]` 🧪 Backend: search returns results across all scopes; empty query returns 400
- `[x]` 🧪 Backend: trending scores update hourly; sorted results differ from chronological
- `[x]` 🧪 Frontend: search results page renders correctly per scope tab

---

## Phase 7 — Production Hardening & Deployment

> Goal: The app is secure, observable, performant, and running in production.

### 7.1 Security Hardening
- `[x]` ⚙️ Add rate limiting to auth endpoints (e.g., Spring's `RateLimiter` or Bucket4j): max 10 login attempts / 15 min per IP
- `[x]` ⚙️ Add request size limits (already in Spring config; verify enforced in Nginx)
- `[x]` ⚙️ Audit all endpoints — verify every mutating endpoint requires auth
- `[x]` ⚙️ Add `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options` headers via Spring Security
- `[x]` 🖥 Sanitize all user-generated text rendered as HTML (use `DOMPurify` or text-only rendering)
- `[x]` ⚙️ Enable HTTPS-only cookies for refresh token in production profile

### 7.2 Performance
- `[x]` ⚙️ Add database indexes: `resources(type, department, semester)`, `posts(type, created_at)`, `events(start_date)`, `post_tags(tag)`
- `[x]` ⚙️ Add Redis cache layer for: trending scores, notification unread counts, resource download URL pre-signing
- `[x]` 🖥 Implement React code splitting (`React.lazy` + `Suspense`) per page
- `[x]` 🖥 Implement image lazy loading for avatars and resource thumbnails
- `[x]` 🖥 Add `staleTime` and `cacheTime` tuning to all React Query hooks
- `[x]` ⚙️ Enable Spring Boot response compression (gzip)

### 7.3 Observability
- `[x]` ⚙️ Add Spring Boot Actuator endpoints (`/health`, `/metrics`, `/info`)
- `[x]` ⚙️ Configure structured JSON logging (Logback → Logstash pattern)
- `[x]` ⚙️ Add request correlation ID filter (MDC) so every log line includes `requestId`
- `[x]` 🚀 Set up log aggregation (e.g., Loki + Grafana, or CloudWatch Logs)

### 7.4 CI/CD Pipeline
- `[x]` 🚀 Create GitHub Actions workflow — on push to `main`:
  - Backend: `mvn test` → `mvn package` → build Docker image → push to registry
  - Frontend: `npm test` → `npm run build` → build Docker image → push to registry
- `[x]` 🚀 Write `Dockerfile` for Spring Boot app (multi-stage: build + JRE runtime image)
- `[x]` 🚀 Write `Dockerfile` for React app (build → Nginx static serve)
- `[x]` 🚀 Write production `docker-compose.yml` or Kubernetes manifests: backend + frontend + MySQL + MinIO/S3 + Redis

### 7.5 Production Infrastructure
- `[x]` 🚀 Provision cloud server / managed Kubernetes cluster
- `[x]` 🚀 Set up managed MySQL instance (RDS or equivalent) with automated backups
- `[x]` 🚀 Configure S3 bucket (or MinIO cluster) with lifecycle rules (e.g., infrequent-access after 90 days)
- `[x]` 🚀 Configure Nginx reverse proxy: SSL termination, gzip, `proxy_pass` to backend, serve frontend static files
- `[x]` 🚀 Set up SSL certificate (Let's Encrypt or ACM)
- `[x]` 🚀 Configure environment secrets manager (GitHub Secrets / AWS Secrets Manager / Vault)
- `[x]` 🚀 Set up uptime monitoring (e.g., UptimeRobot or Better Uptime) on `/api/health`

### 7.6 Final QA & Launch
- `[x]` 🧪 End-to-end test all critical paths: register → upload resource → post → link resource → save event
- `[x]` 🧪 Cross-browser test: Chrome, Firefox, Safari, Edge
- `[x]` 🧪 Test all four themes across all three views
- `[x]` 🧪 Mobile/tablet responsive check (sidebar hidden below 980px, content readable)
- `[x]` 🧪 Accessibility audit (axe DevTools): keyboard nav, contrast ratios, ARIA labels
- `[x]` 🧪 Load test: simulate 100 concurrent users browsing Library + Community
- `[x]` 🚀 Tag `v1.0.0` release on both repos
- `[x]` 🚀 Deploy to production and verify all endpoints via Swagger UI
- `[x]` 🚀 Announce to beta users / campus

---

## Summary by Phase

| Phase | Focus | Key Deliverable |
|---|---|---|
| **0** | Scaffolding | Both repos boot; DB migrates; Docker dev env works |
| **1** | Auth + Shell | Login/register; full themed app shell with working theme switcher |
| **2** | Library | Upload, browse, filter, and download resources |
| **3** | Community | Post feed with types, replies, upvotes, resource linking |
| **4** | Events | Event browsing, timeline creation, save/remind |
| **5** | Engagement | Bookmarks, in-app notifications, email reminders, mod tools |
| **6** | Discovery | Unified search, trending, user profiles, recommendations |
| **7** | Production | Security, performance, CI/CD, cloud deployment, launch |

---

*Last updated: 2026-07-28*
