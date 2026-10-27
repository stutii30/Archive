# Archive

> Campus resource hub & community platform — React · Java (Spring Boot) · MySQL

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| npm | 10+ |
| Java (JDK) | 21+ |
| Maven | 3.9+ |
| Docker & Docker Compose | 24+ |

---

## Quick Start

### 1. Start infrastructure

```bash
# From repo root — starts MySQL 8 on :3306 and MinIO on :9000/:9001
docker-compose up -d
```

MinIO console → http://localhost:9001 (user: `minioadmin`, pass: `minioadmin`)

### 2. Backend

```bash
cd archive-backend

# Copy and fill in environment variables
cp .env.example .env

# Run (DevTools hot-reload enabled)
./mvnw spring-boot:run
```

Backend boots at **http://localhost:8080**  
Swagger UI → http://localhost:8080/swagger-ui.html  
Health check → http://localhost:8080/api/health

### 3. Frontend

```bash
cd archive-frontend

# Install dependencies (first time only)
npm install

# Start dev server with HMR
npm run dev
```

Frontend at **http://localhost:5173** — `/api/*` proxied to the backend.

---

## Environment Variables (backend)

Copy `archive-backend/.env.example` → `archive-backend/.env` and fill in:

```env
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/archive_db
SPRING_DATASOURCE_USERNAME=archive
SPRING_DATASOURCE_PASSWORD=archive_pass

JWT_SECRET=replace_with_64_char_random_hex

STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=archive-files
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
```

---

## Project Structure

```
Archive/
├── archive-frontend/    ← Vite + React 18 (port 5173)
├── archive-backend/     ← Spring Boot 3.x (port 8080)
├── docker-compose.yml   ← MySQL 8 + MinIO
├── Architecture.md      ← System design doc
├── Design.md            ← Design language spec
└── Implementation-Tasks.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Zustand, React Query, Axios |
| Backend | Spring Boot 3.x, Spring Security, Spring Data JPA |
| Database | MySQL 8.x + Flyway migrations |
| File storage | MinIO (local) / AWS S3 (production) |
| Auth | JWT (access token 15 min) + HttpOnly refresh token (7 days) |
