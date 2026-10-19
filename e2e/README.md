# Automated Browser End-to-End QA (Playwright)

This directory contains automated end-to-end tests for the Campaign Amplifier application, executing in real headless Chromium browser viewports (`412x915` and `360x740`).

---

## 1. Architecture & Test Scope

- **Framework**: Playwright (`@playwright/test`)
- **Viewports Tested**:
  - `pixel-412x915`: Google Pixel 7 standard mobile viewport (412 × 915)
  - `small-360x740`: Compact Android mobile viewport (360 × 740)
- **Local Isolation**: Tests run strictly against a local SQLite backend (`sqlite:///./e2e.db`) on port 8000 and a standalone web build served on port 8081. Never touches production Render or external databases.

### Test Suites (`e2e/tests/`):
- `smoke.spec.ts`: Rapid health check verifying initial home screen render, masthead typography, and seed campaign list.
- `guest_flow.spec.ts`: Scenario A: Guest search, sort, filter, campaign inspection, preset & custom backing, platform fee calculation review (2.9% + $0.30 gateway fee), checkout state simulation (Pending, Failed, Cancelled, Succeeded), and digital receipt with private backer identity.
- `creator_flow.spec.ts`: Scenario B: Creator login, manual draft creation via `POST /drafts`, step-by-step drafting (Steps 1–5), live reach calculation, debounced autosave (`PATCH /drafts/:id`), status indicator, mid-flow reload resume, and submission for moderation.
- `admin_lifecycle.spec.ts`: Scenario C: Admin review queue login, editorial inspection and approval, creator Activity notification verification, full goal completion, ad distribution launch, and delivery report accounting (`MEASURED (DEMO DATA)` vs `ESTIMATE`).
- `dashboard_profile.spec.ts`: Scenarios D & E: Creator dashboard showing strictly user-owned campaigns across tabs (Funding, Review, Promoting, Completed, Action Needed, Drafts) with valid cover images, and Guest profile verifying sign-in prompt, zero fake seed contributions for new guests, and non-dead navigation across all 9 Info policy pages.
- `offline_and_responsive.spec.ts`: Scenarios F, G, H: Browser offline mode handling (non-intrusive banner, cached campaign browsing, clean offline submit rejection), responsive layout verification (no horizontal scroll, min 44px touch targets, visible tab bar labels), and zero console errors/React key warnings.

---

## 2. Prerequisites & Setup

From the repository root on Windows:

### Step 1: Start the Local Backend
```powershell
cd backend
# Ensure SQLite DB is initialized with fresh migrations and seeds
$env:DATABASE_URL="sqlite:///./e2e.db"
$env:JWT_SECRET="localtest"
$env:CORS_ORIGINS="*"
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Step 2: Build and Serve the Web App
In a separate terminal:
```powershell
cd mobile
$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:8000/api/v1"
npx expo export --platform web --output-dir ..\e2e-dist
cd ..
npx serve e2e-dist -l 8081 -s
```

### Step 3: Install Playwright Dependencies
In a third terminal from repo root:
```powershell
cd e2e
npm install
npx playwright install chromium
```

---

## 3. Running the Tests

To run all 18 end-to-end tests across both viewports:
```powershell
cd e2e
npx playwright test
```

To run a specific test suite or viewport:
```powershell
# Run Creator Flow only on 412x915
npx playwright test tests/creator_flow.spec.ts --project=pixel-412x915

# Run Guest Flow only
npx playwright test tests/guest_flow.spec.ts

# Run with interactive Playwright UI
npx playwright test --ui
```

---

## 4. Artifacts & Screenshots

Screenshots captured during test execution are output to `docs/qa/`:
- `A_guest_checkout.png`: Step 2 fee review with payment processing breakdown ($25 + $1.03 fee).
- `A_guest_receipt.png`: Succeeded receipt modal with private backer badge and receipt reference.
- `B_creator_step5.png`: Funding goal input ($5,000) with live reach calculation and policy confirmation checkboxes.
- `B_creator_submitted.png`: Submission confirmation with audit status.
- `C_admin_approved.png`: Admin moderation console approval of submitted campaign.
- `C_delivered_report.png`: Transparent distribution report displaying `MEASURED (DEMO DATA)` vs `ESTIMATE`.
- `D_creator_dashboard.png`: Creator dashboard showing user-owned campaigns and status tab options.
- `E_guest_profile.png`: Clean guest profile with sign-in callout and empty backer history.
- `G_pixel_home.png`: Home screen rendered at 412×915 viewport.
- `G_small_home.png`: Home screen rendered at 360×740 compact viewport.
