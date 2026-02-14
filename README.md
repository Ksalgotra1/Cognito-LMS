# Cognito LMS

**An intelligent learning management system built on directed acyclic graph (DAG) course dependencies, AI-assisted tutoring, and algorithmic study scheduling.**

---

## ■ Overview

Cognito is a full-stack LMS that goes beyond content hosting. It models course dependencies as a DAG with enforced acyclicity, runs a 2-layer search engine (in-memory Trie with AI semantic fallback), generates personalized study schedules via a greedy first-fit algorithm, and provides an AI tutor with full course-context awareness through a Retrieval-Augmented Generation (RAG) pipeline.

The platform handles the complete learning lifecycle: course discovery in a marketplace, enrollment with async notification, video-based lessons with integrated code labs, quiz assessment, certificate generation with public verification, and student progress analytics.

---

## ■ Demo

`[Demo Video Placeholder]`

---

## ■ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Redux Toolkit, React Router 7, Tailwind CSS 3.4 |
| **Backend** | Django 6, Django REST Framework 3.16, Simple JWT |
| **Database** | SQLite (dev), PostgreSQL (prod) |
| **Caching** | Redis via django-redis |
| **Async** | Celery 5 with Redis broker |
| **AI/LLM** | Ollama (Llama 3, local inference) |
| **Code Execution** | Piston API (sandboxed, proxied through backend) |
| **Visualization** | React Flow (DAG), Monaco Editor (code lab), Recharts (analytics) |
| **Documents** | ReportLab (PDF certificates), qrcode (QR generation) |

### Documentation

| Document | Scope |
|----------|-------|
| [Frontend README](cognito-frontend/README.md) | Component architecture, state management, API layer, skeleton loading |
| [Backend README](backend/README.md) | API endpoint reference, data models, algorithms, Celery tasks, test coverage |

---

## ■ System Architecture

### High-Level Request Flow

```mermaid
graph TB
    subgraph Frontend ["▲ Frontend (React 19 / Vite :5173)"]
        Browser["Browser"]
        Axios["Axios Client<br/>JWT Interceptor + Token Refresh"]
        Redux["Redux Store<br/>authSlice + coursesSlice"]
    end

    subgraph Backend ["■ Backend (Django :8000)"]
        DRF["DRF ViewSet / APIView"]
        Serializer["Serializer Layer<br/>Validation + N+1 Prevention"]
        ORM["Django ORM"]
    end

    subgraph DataLayer ["● Data Layer"]
        DB[(PostgreSQL / SQLite)]
        Redis[(Redis :6379)]
        Redis_db0["db=0: Celery Broker + Results"]
        Redis_db1["db=1: django-redis Cache"]
    end

    subgraph AsyncLayer ["◆ Async Workers"]
        Celery["Celery Worker"]
        Ollama["Ollama / Llama 3"]
        Email["Email Dispatch"]
    end

    Browser --> Axios
    Axios --> DRF
    DRF --> Serializer --> ORM --> DB
    DRF --> Redis
    Redis --> Redis_db0
    Redis --> Redis_db1
    DRF -- ".delay()" --> Redis_db0
    Redis_db0 --> Celery
    Celery --> Ollama
    Celery --> Email
    Celery -- "Store Result" --> Redis_db0
    Redux --> Axios
```

### Database Schema

```mermaid
erDiagram
    User ||--o{ Course : "instructs"
    User ||--o{ Enrollment : "enrolls"
    User ||--o{ UserProgress : "tracks"
    User ||--o{ Certificate : "earns"
    User ||--o{ StudyPlan : "generates"
    User ||--|| UserProfile : "has"

    Course ||--o{ Module : "contains"
    Course }o--o{ Course : "prerequisites (DAG)"
    Course ||--o{ Enrollment : "enrolled_in"
    Course ||--o{ Certificate : "certifies"
    Course ||--o{ StudyPlan : "planned_for"

    Module ||--o{ Lesson : "contains"

    Lesson ||--o{ Question : "has"
    Lesson ||--o{ UserProgress : "tracked_by"

    Question ||--o{ Choice : "has"

    User {
        int id PK
        string username
        string email
        string role "STUDENT | INSTRUCTOR | ADMIN"
        text bio
        json learning_style
    }

    Course {
        int id PK
        string title
        text description
        int instructor_id FK
        url thumbnail_url
    }

    Module {
        int id PK
        int course_id FK
        string title
        int order
    }

    Lesson {
        int id PK
        int module_id FK
        string title
        text content
        int order
        int duration_minutes
        text notes
    }

    Question {
        int id PK
        int lesson_id FK
        text text
    }

    Choice {
        int id PK
        int question_id FK
        text text
        bool is_correct
    }

    Enrollment {
        int id PK
        int student_id FK
        int course_id FK
        datetime enrolled_at
    }

    UserProgress {
        int id PK
        int user_id FK
        int lesson_id FK
        bool is_completed
    }

    Certificate {
        uuid certificate_id PK
        int user_id FK
        int course_id FK
        datetime issued_at
    }

    StudyPlan {
        int id PK
        int user_id FK
        int course_id FK
        date target_date
        json weekly_availability
        json generated_schedule
    }

    UserProfile {
        int id PK
        int user_id FK
        text bio
        url avatar_url
        json name_change_history
    }
```

### Search Architecture (2-Layer Pipeline)

```mermaid
flowchart LR
    Query["User Query"] --> Trie

    subgraph Layer1 ["Layer 1: In-Memory Trie (sub-ms)"]
        Trie["CourseTrie.search()"]
        Trie --> TrieCheck{Results > 0?}
    end

    TrieCheck -- "Yes" --> FastReturn["Return results<br/>tagged: trie_fast"]

    TrieCheck -- "No (miss)" --> AI

    subgraph Layer2 ["Layer 2: AI Semantic Fallback"]
        AI["Llama 3: Extract Keywords"]
        AI --> DBScan["icontains scan<br/>Courses + Lessons"]
        DBScan --> SemanticReturn["Return results<br/>tagged: ai_semantic"]
    end

    style Layer1 fill:#e8f5e9,stroke:#2e7d32
    style Layer2 fill:#fff3e0,stroke:#e65100
    style FastReturn fill:#c8e6c9,stroke:#2e7d32
    style SemanticReturn fill:#ffe0b2,stroke:#e65100
```

### DAG Validation Flow

```mermaid
flowchart TD
    Start["Instructor adds prerequisite<br/>B → A"] --> Validate["CourseSerializer<br/>.validate_prerequisites()"]
    Validate --> DFS["Course.creates_cycle(B)"]

    DFS --> Init["Initialize stack = B<br/>visited = empty set"]
    Init --> Loop{"Stack empty?"}

    Loop -- "No" --> Pop["Pop node from stack"]
    Pop --> Visited{"Already visited?"}
    Visited -- "Yes" --> Loop
    Visited -- "No" --> MarkVisit["Add to visited set"]
    MarkVisit --> SelfCheck{"Node == Course A?"}

    SelfCheck -- "Yes" --> Reject["CYCLE DETECTED<br/>Reject with 400"]
    SelfCheck -- "No" --> Push["Push all prerequisites<br/>of current node"]
    Push --> Loop

    Loop -- "Yes (exhausted)" --> Allow["No cycle found<br/>Allow prerequisite addition"]

    style Reject fill:#ffcdd2,stroke:#c62828
    style Allow fill:#c8e6c9,stroke:#2e7d32
```

### RAG Context Builder (`services.py`)

```mermaid
flowchart TD
    Request["AI Tutor Query"] --> BuildRAG["get_rag_context(course_id, user)"]

    BuildRAG --> CacheCheck{"Redis Cache<br/>Hit?"}

    CacheCheck -- "Hit" --> Unpickle["Unpickle cached<br/>DAG + Course Structure"]
    CacheCheck -- "Miss" --> QueryDB["Query DB:<br/>Course + Modules + Lessons<br/>+ Prerequisites (2-level)"]
    QueryDB --> BuildDAG["Build DAG Dictionary:<br/>parents, grandparents,<br/>lesson titles, durations"]
    BuildDAG --> CacheStore["Cache with pickle<br/>TTL = 1 hour"]
    CacheStore --> Unpickle

    Unpickle --> LiveQuery["Fetch LIVE User Progress<br/>(never cached)"]
    LiveQuery --> Assemble["Assemble System Prompt:<br/>role + course context +<br/>DAG relationships +<br/>completion history"]
    Assemble --> Return["Return context string<br/>to Celery task"]

    style CacheCheck fill:#fff9c4,stroke:#f9a825
    style CacheStore fill:#e3f2fd,stroke:#1565c0
    style LiveQuery fill:#fce4ec,stroke:#c62828
```

### Study Scheduler (Greedy First-Fit Algorithm)

```mermaid
flowchart TD
    Input["Student Input:<br/>target_date + weekly_availability"] --> Fetch["Fetch all lessons<br/>ordered by module.order, lesson.order"]

    Fetch --> Init["Set current_date = today<br/>lesson_idx = 0"]
    Init --> DayLoop{"Lessons remaining?"}

    DayLoop -- "No" --> Store["Store schedule<br/>in StudyPlan model"]
    Store --> Return["Return schedule<br/>with daily lesson cards"]

    DayLoop -- "Yes" --> Safety{"current_date ><br/>start + 365?"}
    Safety -- "Yes" --> Return

    Safety -- "No" --> GetBudget["budget = availability<br/>for day_name"]
    GetBudget --> BudgetCheck{"budget > 0?"}

    BudgetCheck -- "No (skip day)" --> NextDay["Advance to next day"]
    NextDay --> DayLoop

    BudgetCheck -- "Yes" --> FillLoop{"Next lesson fits<br/>in budget?"}
    FillLoop -- "Yes" --> AddLesson["Add lesson to day<br/>budget -= duration<br/>lesson_idx++"]
    AddLesson --> FillLoop
    FillLoop -- "No" --> AppendDay["Append day<br/>to schedule"]
    AppendDay --> NextDay

    style Input fill:#e8eaf6,stroke:#283593
    style Return fill:#c8e6c9,stroke:#2e7d32
```

### Certificate Generation and Verification

```mermaid
flowchart LR
    subgraph Generation ["Certificate Generation"]
        Req["Student requests<br/>certificate"] --> VidCheck{"100% lessons<br/>completed?"}
        VidCheck -- "No" --> Reject403["403: Incomplete<br/>(show count)"]
        VidCheck -- "Yes" --> QuizCheck{"All quizzes<br/>passed?"}
        QuizCheck -- "No" --> Reject403
        QuizCheck -- "Yes" --> Mint["get_or_create<br/>Certificate (UUID4)"]
        Mint --> QR["Generate QR Code<br/>(verification URL)"]
        QR --> PDF["Render PDF<br/>ReportLab: landscape,<br/>double border,<br/>name, date, QR"]
        PDF --> Download["FileResponse<br/>(attachment)"]
    end

    subgraph Verification ["Public Verification"]
        Visit["Visitor hits<br/>/verify/:uuid"] --> Lookup["GET /certificate/<br/>verify/:uuid/"]
        Lookup --> Found{"UUID exists?"}
        Found -- "Yes" --> Valid["200: student,<br/>course, issued_at"]
        Found -- "No" --> Invalid["404: Invalid<br/>Certificate"]
    end

    style Reject403 fill:#ffcdd2,stroke:#c62828
    style Valid fill:#c8e6c9,stroke:#2e7d32
    style Invalid fill:#ffcdd2,stroke:#c62828
```

### AI Tutor Interaction Lifecycle

```mermaid
sequenceDiagram
    participant U as Student (Browser)
    participant F as React Frontend
    participant D as Django API
    participant R as Redis
    participant C as Celery Worker
    participant O as Ollama (Llama 3)

    U->>F: Type question in AiTutor chat
    F->>D: POST /courses/:id/ask/
    D->>R: Dispatch Celery task
    D-->>F: 202: {task_id, status: "processing"}

    loop Every 2s (max 30 attempts)
        F->>D: GET /courses/tasks/:task_id/
        D->>R: Check task status
        R-->>D: status: "pending" / "completed"
        D-->>F: {status, message}
    end

    C->>R: Pick up task from queue
    C->>R: Check RAG context cache
    alt Cache Hit
        R-->>C: Return pickled DAG
    else Cache Miss
        C->>C: Build from DB + cache (1h TTL)
    end
    C->>C: Fetch LIVE user progress
    C->>C: Assemble system prompt
    C->>O: ollama.chat(model='llama3')
    O-->>C: AI response
    C->>R: Store result (expires 3600s)

    F->>D: GET /courses/tasks/:task_id/
    D->>R: Fetch completed result
    R-->>D: {answer: "..."}
    D-->>F: {status: "completed", answer: "..."}
    F->>U: Render AI response in chat bubble
```

---

## ■ Architecture Workflow (User Journey)

```mermaid
flowchart LR
    subgraph Auth ["1. Authentication"]
        Login["Login / Register"] --> JWT["JWT Tokens stored<br/>in localStorage"]
    end

    subgraph Browse ["2. Marketplace"]
        JWT --> Market["Browse all courses<br/>Enrolled badges shown"]
    end

    subgraph Enroll ["3. Enrollment"]
        Market --> Click["Click course card"]
        Click --> Locked{"Enrolled?"}
        Locked -- "No" --> EnrollBtn["Enroll Now button<br/>POST /enroll/"]
        EnrollBtn --> CeleryEmail["Celery: async email"]
        EnrollBtn --> Unlock["UI refreshes:<br/>content unlocked"]
        Locked -- "Yes" --> Unlock
    end

    subgraph Learn ["4. Learning"]
        Unlock --> Video["Watch video lessons"]
        Video --> Toggle["Toggle completion<br/>(optimistic update)"]
        Toggle --> CodeLab["Code Lab:<br/>Monaco + Piston"]
        Toggle --> AI["AI Tutor:<br/>RAG + Celery polling"]
    end

    subgraph Schedule ["5. Scheduler"]
        Unlock --> Plan["Study Plan Modal:<br/>set target + availability"]
        Plan --> Greedy["Greedy First-Fit<br/>algorithm"]
        Greedy --> Timeline["Timeline view:<br/>daily lesson cards"]
    end

    subgraph Assess ["6. Assessment"]
        Toggle --> Quiz["Take quiz"]
        Quiz --> Grade{"Score >= 70%?"}
        Grade -- "Pass" --> Next["Next lesson"]
        Grade -- "Fail" --> Retry["Review + Retry"]
    end

    subgraph Certify ["7. Certification"]
        Next --> CertCheck{"All lessons +<br/>quizzes done?"}
        CertCheck -- "Yes" --> GenCert["Generate Certificate<br/>UUID + QR + PDF"]
        GenCert --> Verify["Public /verify/:uuid<br/>for employers"]
    end
```

### 1. Landing and Authentication

A visitor arrives at the platform and is presented with login or registration. Authentication uses JWT with automatic token refresh. Tokens persist in `localStorage`; the Axios interceptor transparently refreshes expired access tokens using the refresh token.

### 2. Course Marketplace

After login, the student navigates to `/browse` to see all available courses in a grid. Each card displays the title, description, instructor name, and an "Enrolled" badge if the student is already registered. The marketplace is accessible to both authenticated and unauthenticated users.

### 3. Enrollment

Clicking a non-enrolled course opens the detail page with locked content (video URLs stripped, sidebar lessons disabled, Code Lab tab hidden). The "Enroll Now" button triggers a POST to the enrollment endpoint. Celery dispatches an async enrollment email. The UI instantly refreshes to show unlocked content without a full page reload.

### 4. DAG Visualization

The "Prerequisites" tab renders a React Flow graph. Enrolled users see an interactive 3-level DAG (grandparents, parents, current course). Non-enrolled users see a simplified prerequisite list. Edges are animated with directional arrows.

### 5. Study Scheduler

The student opens the Study Plan modal, sets a target completion date, and adjusts per-day availability (in minutes). The greedy algorithm allocates lessons across available days. Results appear as a vertical timeline with per-day lesson cards showing titles and durations.

### 6. AI Tutor

From the course detail page, the student opens the "Coding Lab and AI" tab. The AI tutor chat panel uses RAG: it pre-loads the full course structure, DAG relationships, and the student's completion history. Queries are processed asynchronously via Celery with 2-second polling on the frontend. Responses appear in a chat interface with copy-to-clipboard support.

### 7. Code Lab

The integrated Monaco Editor provides a VS Code-like environment. Code execution routes through the backend proxy to the Piston API, with rate limiting and 30-second timeout protection. Output appears in a terminal panel below the editor.

### 8. Certificate Generation

Once a student completes all lessons and passes all quizzes, they can request a certificate. The system verifies 100% completion, mints a UUID-keyed certificate, generates a QR code encoding the verification URL, and renders a PDF with ReportLab (landscape format, double border, instructor and date).

### 9. Public Verification

Anyone with the certificate URL can verify it without authentication. The frontend displays the student name, course title, issue date, and a "Verified Credential" badge on success, or an "Invalid Certificate" message with the attempted UUID on failure.

---

## ■ Core Engineering Highlights

### ● DAG with Cycle Detection (Acyclic Enforcement)

Course prerequisites form a directed graph where cycles would create impossible completion paths. The `Course.creates_cycle()` method uses iterative DFS (no recursion, stack-safe for deep graphs) to traverse from a candidate prerequisite back through its ancestors. If the traversal reaches the source course, the edge is rejected at the serializer validation layer. The self-referential M2M field uses `symmetrical=False` to enforce directionality. Time complexity: O(V + E).

### ● Greedy Study Scheduler

The scheduler implements a First-Fit Decreasing bin-packing variant. Lessons are processed in module/lesson order. For each calendar day between now and the target date, the algorithm fills available minutes with lessons until the next lesson exceeds remaining capacity, then advances to the next day. A 365-day safety ceiling prevents infinite loops. The result is stored in `StudyPlan.generated_schedule` as a JSON array for stateless retrieval.

### ● 2-Layer Search (Trie + AI Fallback)

The Trie is built at server startup from all course and lesson titles. Each `TrieNode` uses `__slots__` for memory efficiency, storing children and a list of associated data payloads. Search is case-insensitive and prefix-based, delivering sub-millisecond lookups from RAM with zero network overhead. When the Trie returns no results, the system falls back to Llama 3, which extracts search keywords from the natural-language query. These keywords drive `icontains` queries against the database. Results from each layer are tagged with their source for frontend badge rendering.

### ● Redis + Celery Async Orchestration

Redis serves dual roles: as Celery's message broker (db=0) and as a Django cache backend (db=1). AI queries are offloaded to Celery workers to avoid blocking request threads. The frontend polls task status every 2 seconds with a 60-second hard timeout. Enrollment emails are dispatched asynchronously. Celery results expire after 3600 seconds to prevent Redis memory bloat.

### ● Transient Caching (RAG Context)

The RAG context builder splits data into cacheable (course structure, DAG relationships: 1-hour TTL) and non-cacheable (user progress: always live) layers. Cache keys are per-course. The `CourseDetailView` proactively warms the cache when a student opens a course page, ensuring the first AI query experiences a cache hit. Serialization uses `pickle` to support complex nested dictionaries.

### ● In-Memory Trie (RAM-Resident Search)

The Trie lives entirely in process memory, providing the fastest possible lookup latency (no network hop, no serialization). It is built once at Django startup from the database via `apps.py`, guarded against double-loading during the Vite reloader, and skips initialization during migration commands. This design is intentional: a Redis-backed alternative would add ~0.5ms network latency per lookup and require serialization on every query, negating the purpose of a Trie data structure. The one-time O(N) startup rebuild cost is negligible compared to the runtime performance advantage.

### ● Course Marketplace Architecture

The marketplace serves two audiences from a single API endpoint. For unauthenticated users, all courses are returned with basic metadata. For authenticated users, the serializer annotates each course with `is_enrolled` status by checking the `Enrollment` table. The frontend renders conditional badges and CTAs based on this flag.

### ● Learning Library (Sorted by Last Edited)

The student dashboard fetches enrolled courses ordered by `enrollment.enrolled_at` (most recent first), functioning as a "last touched" sort. This prioritizes actively studied courses at the top. Each course card shows completion progress computed as `(completed_lessons / total_lessons) * 100`.

### ● UUID-Based Certificate System

Certificates use `uuid.uuid4()` as their primary key, preventing sequential enumeration attacks on the public verification endpoint. The certificate object is idempotent via `get_or_create`, ensuring a student receives the same UUID if they re-request a certificate. The PDF includes a QR code that encodes the full verification URL for physical document scanning.

### ● Public Certificate Verification Route

The `/verify/:uuid` route is publicly accessible (no authentication required). The Django view uses `AllowAny` permissions and returns a flat JSON payload `{student, course, issued_at}`. The React component renders three states: loading (spinner), verified (green badge with student/course/date), and invalid (red badge with error message). The route is designed for third-party verification (employers, institutions).

---

## ■ Folder Structure

### Frontend (`cognito-frontend/src/`)

```
src/
  App.jsx                    -- Router config, protected routes, layout
  main.jsx                   -- ReactDOM entry, Redux Provider
  store.js                   -- Redux store (auth + courses reducers)
  index.css                  -- Tailwind directives
  |
  components/ui/
    Button.jsx               -- Reusable styled button
    CodeEditor.jsx           -- Monaco Editor + Piston proxy
    SearchBar.jsx            -- Hybrid search (Trie + AI, debounced)
    Skeleton.jsx             -- Base skeleton primitives
    Skeletons.jsx            -- Page-specific skeleton compositions
    Toast.jsx                -- Toast notification system
  |
  features/auth/
    api/authApi.js            -- login/register API calls
    components/LoginPage.jsx  -- Login form
    components/SignupPage.jsx -- Registration form
    slices/authSlice.js       -- JWT auth state (login, register, logout)
  |
  features/courses/
    api/coursesApi.js         -- Course/AI/enrollment API calls
    components/
      AiTutor.jsx             -- AI chat with async polling
      CourseDetail.jsx         -- Full course view (sidebar, video, tabs)
      CourseGraph.jsx          -- React Flow DAG visualization
      CourseMarketplace.jsx    -- Course grid with enrollment badges
      Dashboard.jsx            -- Enrolled courses + progress carousel
      Quiz.jsx                 -- Quiz taking + results screen
      SettingsModal.jsx        -- Profile editing modal
      StudyPlanModal.jsx       -- Greedy scheduler wizard (3-step)
    pages/
      CertificateVerify.jsx    -- Public certificate verification
      CoursePage.jsx           -- Course detail page wrapper
      ProfilePage.jsx          -- User profile + stats
    slices/coursesSlice.js     -- Course list + detail state
  |
  hooks/
    useDebounce.js             -- Input debouncing hook (300ms)
  |
  lib/
    axios.js                   -- Axios client with JWT interceptors
    toastEvents.js             -- Pub/sub event emitter for toasts
```

### Backend (`backend/`)

```
backend/
  manage.py                  -- Django management entry
  |
  mysite/
    __init__.py              -- Celery app auto-import
    celery.py                -- Celery configuration
    urls.py                  -- Root URL routing
    asgi.py / wsgi.py        -- ASGI/WSGI entry points
    settings/
      __init__.py            -- Environment-based settings selector
      base.py                -- Shared config (JWT, Redis, Celery, DRF)
      dev.py                 -- Development overrides (SQLite, DEBUG)
      prod.py                -- Production overrides (PostgreSQL, HSTS)
  |
  users/
    models.py                -- Custom User (AbstractUser + role enum)
    serializers.py           -- Registration serializer
    views.py                 -- RegisterView (AllowAny)
    admin.py                 -- User admin configuration
  |
  courses/
    models.py                -- Course, Module, Lesson, Question, Choice,
    |                           Enrollment, UserProgress, Certificate,
    |                           StudyPlan, UserProfile (10 models)
    views.py                 -- 18 API endpoints (ViewSets + APIViews)
    serializers.py           -- Nested serializers with N+1 prevention
    services.py              -- RAG context builder (Redis + DB hybrid)
    utils.py                 -- CourseTrie, generate_study_schedule
    tasks.py                 -- Celery tasks (AI response, email)
    ai_client.py             -- Ollama/Llama 3 integration
    apps.py                  -- Trie initialization at startup
    urls.py                  -- URL patterns for all course endpoints
    admin.py                 -- Course/Module/Lesson admin
    tests.py                 -- 412-line test suite (10 test classes)
    management/commands/     -- Custom management commands
```

---

## ■ Installation Guide

### Prerequisites

- Python 3.11+
- Node.js 18+
- Redis 7+
- Ollama (for AI features)

### Backend Setup

```bash
# Clone and enter project
git clone <repository-url>
cd Cognito-LMS

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cat > backend/.env << EOF
SECRET_KEY=your-secret-key-here
REDIS_URL=redis://localhost:6379/0
DJANGO_SETTINGS_MODULE=mysite.settings.dev
EOF

# Run migrations
cd backend
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Redis Setup

```bash
# macOS
brew install redis
brew services start redis

# Verify
redis-cli ping  # Should return PONG
```

### Celery Worker Setup

```bash
# In a separate terminal, from /backend
celery -A mysite worker --loglevel=info
```

### Ollama Setup (AI Tutor)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the model
ollama pull llama3

# Verify
ollama run llama3 "Hello"
```

### Frontend Setup

```bash
# From project root
cd cognito-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to `http://localhost:8000`.

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | Yes | - | Django cryptographic key |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection string |
| `DJANGO_SETTINGS_MODULE` | Yes | - | `mysite.settings.dev` or `mysite.settings.prod` |
| `DATABASE_URL` | Prod only | - | PostgreSQL connection string |
| `ALLOWED_HOSTS` | Prod only | - | Comma-separated hostnames |
| `CORS_ALLOWED_ORIGINS` | Prod only | - | Comma-separated frontend URLs |
| `SITE_URL` | No | `http://127.0.0.1:8000` | Base URL for QR codes |

---

## ■ Deployment Architecture

```mermaid
graph TB
    subgraph Internet ["Internet"]
        Client["Client Browser"]
    end

    subgraph Proxy ["Reverse Proxy"]
        Nginx["Nginx<br/>HTTPS Termination<br/>Static Files"]
    end

    subgraph AppLayer ["Application Tier"]
        G1["Gunicorn Worker 1"]
        G2["Gunicorn Worker 2"]
        GN["Gunicorn Worker N"]
    end

    subgraph CacheLayer ["Cache + Message Tier"]
        RSentinel["Redis Sentinel"]
        RPrimary["Redis Primary"]
        RReplica1["Redis Replica 1"]
        RReplica2["Redis Replica 2"]
    end

    subgraph WorkerLayer ["Worker Tier"]
        CGeneral["Celery Workers<br/>(General: email, PDF)"]
        CAI["Celery Workers<br/>(AI: GPU nodes)"]
    end

    subgraph DBLayer ["Database Tier"]
        PgBouncer["PgBouncer<br/>Connection Pool"]
        PGPrimary["PostgreSQL Primary"]
        PGReplica["PostgreSQL Read Replica"]
    end

    Client --> Nginx
    Nginx --> G1
    Nginx --> G2
    Nginx --> GN

    G1 --> RPrimary
    G2 --> RPrimary
    GN --> RPrimary
    RSentinel --> RPrimary
    RSentinel --> RReplica1
    RSentinel --> RReplica2

    RPrimary --> CGeneral
    RPrimary --> CAI

    G1 --> PgBouncer
    G2 --> PgBouncer
    GN --> PgBouncer
    PgBouncer --> PGPrimary
    PgBouncer --> PGReplica
```

### Scaling Strategy

| Component | Horizontal Strategy |
|-----------|-------------------|
| **Django** | Stateless; scale Gunicorn workers behind Nginx |
| **Redis** | Redis Sentinel or Redis Cluster for HA |
| **Celery** | Separate queues for AI (GPU) vs general (CPU) workers |
| **Database** | Read replicas for dashboard/marketplace queries |
| **Trie** | RAM-resident per process; rebuilt on deploy (sub-second for typical catalogs) |

### Redis Scaling Considerations

Redis db=0 (Celery broker) handles high write throughput from task dispatch. Redis db=1 (cache) handles read-heavy RAG context lookups. In production, separating these into distinct Redis instances prevents cache eviction from starving the broker.

### Database Considerations

`Certificate`, `Enrollment`, and `UserProgress` tables grow linearly with users. The `unique_together` constraints serve as implicit indexes. For large deployments, consider partitioning `UserProgress` by user or adding composite indexes on `(user_id, lesson_id, is_completed)`.

---

## ■ Security Considerations

### Authentication

JWT tokens with 1-day access and 1-day refresh lifetimes. Refresh tokens rotate on every use and old tokens are blacklisted. The Axios interceptor handles silent refresh transparently. Failed refresh clears all stored credentials and redirects to login.

### Certificate Verification Security

Certificates use UUID v4 (122 bits of entropy). The probability of guessing a valid certificate ID is roughly 1 in 5.3 x 10^36. The public verification endpoint returns only `{student, course, issued_at}` -- no sensitive data. The QR code encodes the verification URL, enabling physical document scanning.

### Input Validation

Quiz answers are validated server-side -- the `ChoiceSerializer` strips `is_correct` from all API responses. Course prerequisites are validated against cycle detection before persistence. Profile name changes are rate-limited to 2 per year with an auditable timestamp log stored in `UserProfile.name_change_history`.

### Cache Safety

RAG context cache uses per-course keys, isolating cache entries. User-specific progress is never cached to prevent cross-user data leakage. Cache entries expire after 1 hour (TTL). Celery task results expire after 3600 seconds.

### Production Hardening

The `prod.py` settings enable: HSTS (1 year, preload), secure session and CSRF cookies, `X-Frame-Options: DENY`, browser XSS filter, and content-type nosniff. CORS uses an explicit origin whitelist (no wildcards).

---

## ■ Future Improvements

### Bayesian-GNN Hybrid Failure Predictor

Since the platform already models course dependencies as a DAG, this structure can serve as the backbone for a failure prediction system. The approach involves two layers:

**Layer 1 -- Bayesian Network (Small Data / Cold Start)**: Map quiz failure probabilities onto the existing DAG. Each course node becomes a conditional probability node where `P(fail_course_C | fail_prerequisite_A, fail_prerequisite_B)` is computed from historical quiz data. This works immediately with small datasets because Bayesian networks require only conditional probability tables, not large training corpora. The DAG structure directly provides the network topology -- no structure learning required.

**Layer 2 -- Graph Neural Network (Large Data)**: When sufficient data accumulates (thousands of student trajectories), train a GNN on the same DAG structure. Node features include: quiz scores, time-to-completion, retry count, AI tutor usage frequency. Edge features include: prerequisite completion gap (days between completing prerequisite and starting dependent course). The GNN propagates failure signals through the graph, identifying upstream knowledge gaps that predict downstream failures. This enables preemptive interventions -- the system can recommend revisiting a specific prerequisite before the student fails the dependent course.

```mermaid
flowchart TD
    subgraph CurrentDAG ["Existing Course DAG"]
        A["Course A<br/>(Prerequisite)"] --> C["Course C<br/>(Target)"]
        B["Course B<br/>(Prerequisite)"] --> C
    end

    subgraph BayesLayer ["Layer 1: Bayesian Network"]
        PA["P(fail A) = 0.3"] --> PC["P(fail C | A, B)<br/>= CPT from quiz history"]
        PB["P(fail B) = 0.1"] --> PC
    end

    subgraph GNNLayer ["Layer 2: GNN (Large Data)"]
        NA["Node A features:<br/>scores, time, retries"] --> GNN["GNN Message Passing<br/>along DAG edges"]
        NB["Node B features:<br/>scores, time, retries"] --> GNN
        GNN --> Predict["Predict: Student likely<br/>to fail Course C"]
        Predict --> Intervene["Recommend: Revisit<br/>Course A before proceeding"]
    end

    CurrentDAG -.-> BayesLayer
    BayesLayer -.-> GNNLayer

    style Intervene fill:#e8f5e9,stroke:#2e7d32
```

### Additional Technical Improvements

- **WebSocket for AI responses**: Replace polling with WebSocket channels for real-time AI streaming
- **Server-sent events for progress sync**: Broadcast lesson completion across tabs/devices
- **Full-text search**: PostgreSQL GIN indexes to replace `icontains` scans in the AI search fallback
- **Certificate revocation**: Admin endpoint to revoke certificates with revocation status on verification
- **Horizontal Celery routing**: Dedicated GPU worker queue for AI tasks vs CPU queue for email/PDF
- **Materialized views**: Pre-computed dashboard progress aggregates, refreshed on lesson completion
- **Rate limiting per endpoint**: Move from class-level to per-view throttle scopes
- **Audit logging**: Track all grade changes, certificate issuances, and role modifications
- **Offline-first PWA**: Service worker for lesson content caching and offline quiz attempts

---

## ■ Running Tests

```bash
cd backend
python manage.py test courses -v 2
```

The test suite covers 10 test classes across models (DAG cycles, user roles), utilities (Trie search, study scheduler), and API endpoints (CRUD, enrollment, quizzes, profiles, certificates, dashboard, lesson completion).

---

**Built with** Django 6 ▣ React 19 ▣ Redis ▣ Celery ▣ Ollama/Llama 3
