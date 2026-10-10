# EduMate AI — Advanced Learning Assistant & AI Interview Portal

EduMate AI is a production-grade, general-purpose AI learning workspace and interview preparation platform. It combines a ChatGPT-like conversational experience with student-focused capabilities: persistent multi-layer memory, specialized learning modes, document Q&A, AI quiz generation & evaluation, custom study planning, real-time learning analytics, and a **complete AI Mock Interview Portal with Email Delivery**.

---

## 🌟 Key Features & Architecture Upgrades

### 🔒 1. Complete User Authentication & JWT Session Security
- **Registration & Login:** Secure password hashing using `bcrypt` / `passlib`, JWT bearer tokens (`pyjwt`), email uniqueness validation, and password strength rules.
- **Protected Endpoints:** All API endpoints validate authentication headers and enforce strict data ownership checks so one user cannot access another user's records.

### 👤 2. ChatGPT-Style Profile Dropdown Menu
- **Sidebar Integration:** Anchored profile button near the bottom-left sidebar avatar with smooth dropdown menu.
- **Unauthenticated State:** Prompts "Log In" and "Create Account" options.
- **Authenticated State:** Displays User Initials Avatar, Full Name, Email, "My Profile", "Account Settings", and "Log Out".
- **Keyboard & Click Handling:** Automatically closes on outside click or pressing the `Escape` key.

### ⚙️ 3. Full Account Profile & Settings
- Update Full Name, Academic Level (High School, Undergraduate, Graduate, Self-Learner), and Preferred Language.
- Change Password modal with current and new password verification.

### 💼 4. NEW MAJOR FEATURE: AI Interview Portal with Email Delivery
- **Interactive Configuration:** Select Candidate Name, Candidate Email, Job Role (Python Developer, Full-Stack, Frontend, Backend, AI Engineer, etc.), Interview Type (Technical, HR, Behavioral, Coding, System Design), Skill Tags, Difficulty, and Duration.
- **Live AI Interview Session:** Generates tailored interview questions via Gemini AI. Interactive answer input with voice transcription capability and countdown timer.
- **Automated AI Evaluation:** Computes an overall score out of 100, technical strengths, areas for improvement, recommended study topics, and a personalized preparation plan.
- **Automated Email Result Delivery:** Generates a clean HTML evaluation report and emails it to the candidate's email address upon interview completion via SMTP with idempotent retry capabilities.

### 🗄️ 5. Production Database: MySQL 8.x + SQLAlchemy 2.x
- Fully migrated to SQLAlchemy 2.x ORM models configured for MySQL 8.x with `utf8mb4` Unicode support for multi-language handling (English, Telugu, Hindi).
- Includes connection pooling (`pool_pre_ping=True`, `pool_recycle=3600`) and transaction safety with SQLite compatibility fallback.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons |
| **Markdown & Math** | react-markdown, remark-gfm, rehype-highlight, rehype-katex, KaTeX |
| **Backend** | Python 3.13, FastAPI, Uvicorn, Pydantic v2 |
| **Database** | MySQL 8.x / PyMySQL with SQLAlchemy 2.x ORM & Alembic |
| **Security & Auth** | JWT (`pyjwt`), Password Hashing (`passlib[bcrypt]`) |
| **AI Orchestration** | Google Gemini API (`google-genai` SDK with `gemini-3.6-flash`) |
| **Email Delivery** | `smtplib` / MIMEMultipart HTML Template Engine |

---

## 📂 Project Structure

```text
edumate-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py         # REST API routes (Auth, Profile, Chat, Docs, Quizzes, Interviews)
│   │   ├── core/
│   │   │   └── security.py          # Password hashing & JWT token management
│   │   ├── db/
│   │   │   ├── database.py          # SQLAlchemy 2.x engine & session manager
│   │   │   └── models.py            # MySQL 8.x ORM models
│   │   ├── schemas/
│   │   │   └── schemas.py           # Pydantic schemas
│   │   ├── services/
│   │   │   ├── ai_service.py        # Gemini AI orchestration
│   │   │   ├── interview_service.py # AI Interview Portal logic & evaluation
│   │   │   ├── email_service.py     # HTML Result email generator & SMTP sender
│   │   │   ├── memory_service.py    # Persistent multi-layer memory
│   │   │   ├── document_service.py  # PDF text extraction & chunk Q&A
│   │   │   ├── quiz_service.py      # Quiz generator & grading engine
│   │   │   ├── study_service.py     # Study plan generator & checklist
│   │   │   └── analytics_service.py # Aggregated metrics
│   │   ├── config.py                # Environment configuration
│   │   └── main.py                  # FastAPI application entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx          # Navigation & ChatGPT profile dropdown
│   │   │   ├── AuthModal.tsx        # Login & Sign Up modal
│   │   │   ├── InterviewWorkspace.tsx # AI Interview Portal (Dashboard, Session, Report)
│   │   │   ├── ProfileSettingsView.tsx # Account profile & password settings
│   │   │   ├── Header.tsx           # Mode selector & language switcher
│   │   │   ├── ChatWorkspace.tsx    # Main AI chat workspace
│   │   │   ├── MessageItem.tsx      # Markdown, KaTeX & code block rendering
│   │   │   ├── DocumentWorkspace.tsx # PDF upload & note Q&A
│   │   │   ├── QuizWorkspace.tsx    # Quiz generator & test taking
│   │   │   ├── StudyPlannerWorkspace.tsx # Study plan generator
│   │   │   ├── AnalyticsWorkspace.tsx # Analytics metrics dashboard
│   │   │   └── MemoryWorkspace.tsx  # Persistent student memory settings
│   │   ├── services/
│   │   │   └── api.ts               # Frontend API client with JWT headers
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interface definitions
│   │   ├── App.tsx                  # Main application state assembly
│   │   └── index.css                # Tailwind CSS & KaTeX styling
│   ├── vite.config.ts
│   └── package.json
├── database/
│   └── schema.sql                   # SQL schema definition for MySQL 8.x
├── .env.example
└── README.md
```

---

## ⚙️ Environment Configuration (`.env`)

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash

# MySQL 8.x Database URL
DATABASE_URL=mysql+pymysql://root:password@127.0.0.1:3306/edumate_ai?charset=utf8mb4
DATABASE_PATH=backend/app/edumate.db

# JWT Security
JWT_SECRET_KEY=edumate_ai_secret_jwt_key_2026_super_secure

# SMTP Configuration for Result Emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_SENDER_EMAIL=noreply@edumate.ai
SMTP_SENDER_NAME=EduMate AI

# Frontend & CORS
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## ⚡ Quick Start & Run Commands

### 1. Start FastAPI Backend (Port 8000)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start Vite React Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your web browser.

---

## 🧪 Verification & Acceptance Tests Executed

1. **User Authentication & JWT Tokens**:
   - `POST /api/auth/register` registered new users, hashed passwords with `bcrypt`, and generated valid JWT bearer tokens.
   - Protected endpoints verify `Authorization: Bearer <token>` headers.
2. **ChatGPT Profile Dropdown Menu**:
   - Anchored profile button triggers dropdown menu displaying user initials, full name, email, profile link, settings link, and logout.
   - Responds to outside click and `Escape` key dismissals.
3. **AI Interview Portal**:
   - `POST /api/interviews/create` generated 5 job-role-specific interview questions.
   - `POST /api/interviews/{id}/finish` computed overall score out of 100, strengths, improvement areas, and study topics.
   - `POST /api/interviews/{id}/retry-email` dispatched HTML evaluation reports via background task and logged status.
4. **Production Build Verification**:
   - `npm run build` (`tsc -b && vite build`) passed with 0 errors.
