# 📢 Campaign Amplification Platform

A community-funded advertising and message-amplification platform. Individuals, creators, nonprofits, and community groups write campaigns to spread important messages to audiences beyond their existing networks. Backers pool contributions toward distribution costs (paid digital advertising across Meta, Instagram, Reddit, etc.).

> **Important:** This is not a donation platform. Contributions fund digital advertising that spreads the message; they never directly fund the cause, person, or organization.

---

## 📁 Repository Structure

```text
.
├── mobile/                  # React Native mobile application (Expo SDK 58)
│   ├── src/                 # Screens, components, navigation, stores, api
│   ├── app.json             # Expo project configuration
│   ├── eas.json             # EAS Build configuration for Android APK
│   ├── package.json         # Mobile dependencies
│   └── tsconfig.json        # TypeScript configuration
├── backend/                 # FastAPI REST API service
│   ├── app/                 # FastAPI application, models, routers, services
│   ├── tests/               # Pytest suite
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Production container build
│   └── render.yaml          # Render deployment blueprint (rootDir: backend)
├── BRIEF.md                 # Official hackathon assessment brief
├── PLAN.md                  # Comprehensive implementation plan and roadmap
└── README.md                # Project documentation
```

---

## 🛠 Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Mobile App** | Expo SDK 58, React Native 0.88 | Cross-platform Android & iOS |
| **Navigation** | React Navigation 7 | Native stack + 5 bottom tabs |
| **Client State** | TanStack Query + Zustand | Persistent via AsyncStorage |
| **Backend API** | FastAPI (Python 3.11 / 3.13) | RESTful API at `/api/v1` |
| **Database** | SQLAlchemy 2.x | SQLite (dev) / PostgreSQL (production) |
| **AI Integration** | Google Gemini Flash | Server-side with demo fallback |
| **Styling** | Custom Tokens + StyleSheet | Clean, accessible design system |

---

## 🚀 Quick Start

### 1. Backend Service

```bash
cd backend
python -m venv .venv

# Windows activation
.\.venv\Scripts\activate
# Linux/macOS activation: source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Moderation Console: [http://localhost:8000/admin](http://localhost:8000/admin)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Mobile Application

```bash
cd mobile
npm ci
npx expo start
```

- Press `a` for Android emulator, or scan QR code with Expo Go.
- Press `w` for Expo Web preview.

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
pytest -v

# Run mobile type checks
cd mobile
npx tsc --noEmit
npx expo-doctor
```

---

## 📦 Building Android APK

```bash
cd mobile
eas build -p android --profile preview
```

---

## 📄 License

MIT
