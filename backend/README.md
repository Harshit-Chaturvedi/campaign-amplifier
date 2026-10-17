# Campaign Amplification Platform &mdash; Backend

FastAPI + SQLAlchemy + Pydantic v2 backend service for the Campaign Amplification hackathon platform.

**Core Mission:** Community-funded digital advertising distribution. Backers pool funds to pay for ad distribution that spreads checkable messages beyond creators' personal networks. *Not a donation platform: contributions fund ad distribution, never the cause, person, or organization.*

---

## Architecture & Technology

- **Framework:** FastAPI (Python 3.11 / 3.13)
- **Database ORM:** SQLAlchemy 2.x
- **Database:** SQLite (default for local development) / PostgreSQL (production / Supabase) via `DATABASE_URL`
- **Validation:** Pydantic v2 schemas
- **Authentication:** JWT (PyJWT) with bcrypt password hashing
- **State Machine:** Pure lifecycle transition table (`app/services/lifecycle.py`) enforcing preconditions and audit logs (`moderation_events`)
- **Reach Service:** Configurable CPM / frequency assumptions (`app/services/reach.py`), completely mirroring mobile formula
- **AI Endpoints:** Real Gemini 1.5 Flash via `GEMINI_API_KEY` with deterministic demo-mode fallbacks (`demo_mode: true`)

---

## Demo Accounts

All demo accounts use password: **`demo123`**

| Role | Email (org & com both supported) | Purpose |
|---|---|---|
| **Admin** | `admin@demo.org` / `admin@demo.com` | Moderation queue, approve, request changes, reject, start promotion, simulate delivery, complete |
| **Creator** | `creator@demo.org` / `creator@demo.com` | Create drafts, autosave, manage story blocks & sources, submit for review, view creator dashboard |
| **Backer** | `backer@demo.org` / `backer@demo.com` | Browse campaigns, back campaigns, simulate checkout, view receipts, notification center |

---

## Getting Started Locally

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Seed Script (Automatic on First Startup)
```bash
python -m app.seed
```
*Note: The app will also automatically seed the 14 credible campaigns and demo users on first startup if the database is empty.*

### 4. Run Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
- Interactive API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Interactive Moderation Dashboard: [http://localhost:8000/admin](http://localhost:8000/admin)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

## Running Test Suite

Run unit and integration tests with `pytest`:
```bash
pytest -v
```

Tests cover:
- Reach estimation calculations and backer fee breakdown
- Complete 14-state campaign lifecycle transitions (including preconditions and checks)
- Illegal transitions rejecting with `409 Conflict`
- Backing contributions and payment simulation (`failed` does not increment raised; only `success` increments raised and checks milestones)
- Role-based access control and backer privacy protections

---

## Deployment (Render / Docker)

### Render (via `render.yaml`)
1. Connect GitHub repository to Render.
2. Select **Blueprint** and point to `backend/render.yaml`.
3. Set environment variable `DATABASE_URL` (e.g. Supabase Postgres connection string).

### Docker
```bash
docker build -t campaign-amplifier-backend .
docker run -p 8000:8000 -e DATABASE_URL=sqlite:///./campaign_amplifier.db campaign-amplifier-backend
```
