# Campaign Amplifier — Implementation Plan v2 (based on the real brief)

**Submit:** Android **APK + demo video** → Telegram group (https://t.me/+brkDpS8rYfBjNzll). Deadline Tue 11:59 AM (brief says 19 Oct). **Target: finished Mon 19 Oct night; Tuesday morning = buffer only.**
**Source code is NOT required.** They judge: UI/UX (top), product thinking, end-to-end journey, state handling, backend logic, security/privacy.
Reference site: https://campaign-one-pearl.vercel.app/ · Repo: https://github.com/Harshit-Chaturvedi/campaign-amplifier (app in nested `campaign-amplifier/campaign-amplifier/`) · Local: `C:\Users\harsh\Documents\antigravity\bold-volta\campaign-amplifier`

## 0. Non-negotiable product rules (get these wrong = lose points)

1. **Not a donation platform.** A contribution pays for *distribution/reach of the message*, never the cause. Say this on detail page, backing review step, confirmation, receipt.
2. **Never invent trust scores or claim independent verification.** (My v1 plan had an AI "trust score" — removed.) Show sources + "how review works" only.
3. **Never promise fixed reach.** Always "estimated", labelled, from configurable demo assumptions. Never mix estimated with measured numbers.
4. **Creator sets the funding goal in Step 5.** AI/earlier steps must never generate or overwrite it.
5. Creation steps **in order, no extra screens between them:** Basics → Story → Campaign & Ad Visuals → Reach → Submit. Persistent 5-step progress bar, autosave, form state kept on Back.
6. **Browse without an account** (guest). Guest contributions allowed. Don't ask for unneeded info.
7. Funding complete ≠ ads launched. Distribution starts only after approval + payment + budget + ad setup conditions.
8. Backer names **private by default**; payment records still accurate.
9. Demo/sample figures clearly labelled "Demo data".
10. No dead buttons. Every button works or is removed.

## 1. Stack (decided)

| Layer | Choice | Notes |
|---|---|---|
| App | **Expo SDK 58 + React Native 0.88 + TypeScript**, keep existing **React Navigation 7** (stack + bottom tabs) | required; already in repo — do NOT migrate to Expo Router (AGENTS.md suggests it, but it costs hours for no graded benefit) |
| UI | StyleSheet + small design system (tokens), `react-native-reanimated`, `expo-image`, `@expo/vector-icons`, `expo-haptics` | skeletons via reanimated |
| Client state | **TanStack Query** (server data) + **Zustand** (draft, auth, prefs) persisted with AsyncStorage | |
| Backend | **FastAPI (Python)** + Pydantic validation + JWT auth + role checks | you already know FastAPI; clear REST API |
| DB | **Supabase Postgres** (SQLAlchemy/asyncpg or supabase-py); Supabase Storage for images | |
| Hosting | Backend on **Render/Railway**; ping health endpoint to avoid cold start; **bundled seed fallback in app** if API unreachable | demo must never be blank |
| AI | **Gemini API** (server-side only): draft-from-text, suggest title/summary/category, transcribe+structure voice, ad-copy | key never in APK; **demo-mode fallback** with canned output if AI fails |
| Voice | `expo-audio` record → send to backend → Gemini transcribes + extracts fields → editable draft | fallback: type the answers / demo mode |
| Payments | **Simulated checkout** screen, clearly labelled, with outcome states success / pending / failed / cancelled / rejected | brief explicitly allows dummy |
| Uploads | `expo-image-picker`, `expo-document-picker`; validate type/size/dimensions client + server | |
| Share | `expo-sharing` / RN `Share` + `expo-linking` deep links | |
| Notifications | in-app centre (DB-backed). Push optional, skip | |
| Charts | `react-native-gifted-charts` (or simple custom bars) | |
| Build | **EAS Build** `preview` profile → APK (`eas build -p android --profile preview`) | **first build Sunday midday** |

Fallback if backend time runs out: keep API contract, serve seeded data from FastAPI memory/SQLite — but keep the state machine and validation real.

## 2. Navigation (bottom tabs, stable everywhere)

`Home · Explore · Create · Activity · Profile`
Detail pages and flows push on top with clear Back. Secondary pages (Partners, About, How It Works, FAQs, Help, Contact, Terms, Privacy, Community Guidelines) live under **Profile → Help & About** and linked from Home footer. Simple static screens, shared `InfoPage` component.

## 3. Screens & behaviour

### Home
Hero: headline "Help important messages travel beyond their networks", 2 CTAs (**Explore Campaigns**, **Start a Campaign**), **reach-per-dollar estimate** from config, labelled "Estimate, not a guarantee". Featured carousel, **How it works: Create → Review → Amplify** (3 visual cards), campaign feed.
**CampaignCard:** cover, category chip, title, creator/org, 1–2 line editorial summary, raised/goal + progress bar, est. reach at goal, **Back This Campaign** button.

### Explore
Search (debounced, server-side), category chips (Environment, Health, Science, Education, Public Policy, Economic Policy, Community, Arts & Culture, Business, Other), sort (Trending, Newest, Most funded, Ending soon, Closest to goal), filters sheet (status, funding %, reach). Skeletons, empty state, no-results state with "clear filters", error state with Retry. Results must really change.

### Create (tab)
- Resume drafts list (title, last saved, step reached) + two entry cards: **Create Manually** / **Create with Your Voice**.
- **Voice:** guided questions (what is it about? who should see it? why it matters? what evidence?). Record per question or one long take → transcript → AI fills draft → lands on **editable draft (Step 1)**. If service fails: clear message + demo-mode sample + manual fallback.

### The 5-step creator flow (one Stack, shared header with progress)
Autosave: debounce 800 ms to server (`PATCH /drafts/:id`) + local persist; "Saved ✓ just now" indicator; Save as Draft button always present. Per-field validation with inline messages.

1. **Basics** — title (required, max 60, live counter; helper: "start of title may be used as ad headline"), category (required), creator/org name (required), short summary, optional cover image, optional "Suggest with AI" (proposes title/summary/category; user edits/rejects).
2. **Story** — editorial composer. Block list: heading, paragraph, image (caption + credit), statistic, pull-quote, suggested audience action. Add / reorder (up/down buttons + drag if time) / delete blocks. Simple formatting toolbar (bold, italic, link). **Sources manager:** title + URL, validated, add/remove. Toggle **Edit / Live preview** (same renderer as published page). Sources render on public page.
3. **Campaign & Ad Visuals** — cover image, ad images (multi), optional video (if supported, else show "Not supported in prototype"), ad headline (defaults to first 60 chars of title if blank), ad description, CTA text, **placement previews** (feed, story/vertical, search-text) via small preview components, file validation (type, ≤ size, min dimensions), missing-asset warnings, optional "creative-quality feedback" prompt. Image generation: optional "Generate with AI" only if cheap to wire; otherwise omit.
4. **Reach** — locations (multi-select chips), interests, channels (Meta, Google, YouTube, X… as demo), budget allocation across channels (sliders summing to 100%), duration (7/14/30 days). **Audience preview** card (who + sample ad appearance). Two clear sections: **"You choose"** vs **"Platform may finalize during review."** Copy: "Actual reach depends on inventory, prices, targeting, delivery and performance."
5. **Submit** — full preview (title, summary, creator, story + sources, visuals, audience/distribution, duration, fees & funding policy, est. reach). **Funding goal input (creator-entered, required, min/max validated)** with est. reach recomputed. Required checkbox(es): campaign rules + submission policies. Actions: **Back · Save as Draft · Preview Campaign · Submit for Review**. After submit: confirmation + **status timeline** (Submitted → In review → Approved/Changes → Available for funding…).

### Campaign Detail
Header: back to Explore, cover, category, title, creator, date, share, status badge. Body: readable editorial rendering (headings, paragraphs, images in context with captions, statistics, **visible sources list**). **Sticky funding bar** (raised, goal, % funded, time left, est. reach, **Back This Campaign**, Share) that doesn't hide story. Expandables: **Use of funds** (platform fee, % for advertising, allocation policy, refund conditions, unspent funds; bold line: "funds distribution of the message, not direct support for the cause"), **Audience & distribution** (targeting, placements, privacy & ad disclosures), **Review & trust** (review process, sources, verification info *only if real*, partners), **Feedback** (Did the visuals make you keep reading? / Did it change your mind? → No / Somewhat / Yes). Save/follow button. Comments: skip (or read-only) unless time — needs moderation/reporting.

### Back a Campaign (modal stack, 6 steps)
1. Inspect (jump to story/sources/use-of-funds) → 2. **Choose amount** (presets $5/$10/$25/$50/$100 + custom; reach estimate updates live) → 3. **Review** (amount, fees, total, est. reach, progress, terms/refund, "amplification not donation" notice, optional "show my name publicly" default OFF) → 4. **Simulated checkout** (labelled; guest allowed with optional email for receipt; buttons to simulate Success / Pending / Failed / Cancelled so states are demonstrable) → 5. **Confirmation** (amount, campaign, receipt link, updated progress animating, Share) → 6. **Track** (follow, updates, final report).
Server creates `contribution` as `pending` → webhook-like `/payments/simulate` sets final state → only `succeeded` increments `raised`.

### Activity
Tabs: All · Funding · Updates · Following. Events: submission received, approved/rejected/changes requested, available for backing, milestone (25/50/75/100%), deadline approaching, contribution success/fail, promotion begins, distribution progress, completed, final report ready, new update, security event. De-duplicate/throttle. Notification preferences screen (categories toggles). Mark read, empty state.

### Profile
Account (guest → sign-in prompt), **Created campaigns = Creator Dashboard**, Backed campaigns, Saved campaigns, Payment history (+ receipt), Settings (notifications, privacy default), Help & About links, Sign out.

### Creator Dashboard (inside Profile → Created)
Tabs: Drafts · Under Review · Published/Funding · Promoting · Completed · Requires Action. Card: thumb, title, status, progress, goal, deadline, est. reach. Detail: edit draft, preview, view moderation feedback + respond/edit & resubmit, share link, milestones/updates, promotion progress, **final distribution report**. **Analytics** with labelled sections: *Funding* (raised, backers count, contributions list — names private), *Budget* (allocated vs spent), *Delivery* (**Measured**: impressions, clicks, measured reach) vs *Estimates* (est. reach) — visually separated, with definitions in an info sheet. Edit rules: published campaign material changes → status goes back to "Changes pending review" and ads not updated until approved.

## 4. Campaign lifecycle (server-enforced state machine)

`draft → submitted → (changes_requested ↔ submitted) | approved → available_for_funding → (goal_reached | funding_ended) → distribution_preparation → promoting → completed`
Exceptional: `rejected`, `cancelled`, `refund_pending`, `failed`.
Transition table in one module; every transition checks role + preconditions + writes `moderation_events` (audit). `distribution_preparation → promoting` requires: approved ✔, payments settled ✔, budget ✔, ad setup ✔. Goal reached does **not** auto-promote.

## 5. Data model (Postgres)

`users(id, email, name, role[user|admin], created_at)` ·
`campaigns(id, owner_id, status, title, category, creator_name, summary, cover_url, headline, ad_description, cta, goal_amount, raised_amount, currency, duration_days, deadline, funding_ends_at, reach_estimate, created_at, submitted_at, published_at)` ·
`campaign_story_blocks(id, campaign_id, position, type, content jsonb)` ·
`campaign_sources(id, campaign_id, title, url)` ·
`campaign_assets(id, campaign_id, kind[cover|ad_image|video], url, meta jsonb)` ·
`campaign_reach(campaign_id, locations jsonb, interests jsonb, channels jsonb, budget_alloc jsonb, platform_finalized jsonb)` ·
`drafts` = campaigns where status=draft + `draft_step`, `updated_at` ·
`contributions(id, campaign_id, user_id nullable, guest_email nullable, amount, fee, total, status[pending|succeeded|failed|cancelled|rejected|refunded], show_name bool, receipt_no, created_at)` ·
`moderation_events(id, campaign_id, actor_id, from_status, to_status, note, created_at)` ·
`notifications(id, user_id, type, campaign_id, title, body, read, created_at)` + `notification_prefs` ·
`follows`, `saves` ·
`campaign_updates(id, campaign_id, body, created_at)` ·
`feedback(id, campaign_id, visuals_kept_reading, changed_mind)` ·
`reports(campaign_id, funds_raised, ad_spend, impressions, measured_reach, clicks, est_reach, final bool)` ·
`config(key, value)` — demo assumptions: `cpm_usd`, `avg_frequency`, `platform_fee_pct`, `payment_fee_pct`, `min_goal`, `max_goal`.

**Reach formula (server, configurable):** `ad_budget = amount × (1 − platform_fee_pct)`; `impressions = ad_budget / cpm × 1000`; `est_reach = impressions / avg_frequency`. Return `{estimate, assumptions, label:"Estimate"}`.

## 6. API (REST, `/api/v1`)

Auth: `POST /auth/register|login`, `GET /me` · Public: `GET /campaigns` (q, category, sort, status, page), `GET /campaigns/{id}`, `GET /config/public`, `POST /reach/estimate`, `POST /campaigns/{id}/feedback` · Drafts/creator: `POST /drafts`, `GET /drafts`, `PATCH /drafts/{id}` (partial, validated), `POST /drafts/{id}/submit`, `POST /campaigns/{id}/respond`, `GET /me/campaigns?status=`, `GET /campaigns/{id}/analytics`, `POST /campaigns/{id}/updates`, `POST /uploads` · AI: `POST /ai/draft-from-text`, `POST /ai/voice-draft`, `POST /ai/suggest` (all with demo-mode fallback) · Backing: `POST /contributions` (pending), `POST /payments/simulate` (outcome), `GET /me/contributions`, `GET /receipts/{id}` · Social: `POST/DELETE /campaigns/{id}/follow|save` · Activity: `GET /notifications`, `PATCH /notifications/{id}/read`, `GET/PUT /notification-prefs` · Admin (role=admin): `GET /admin/review-queue`, `POST /admin/campaigns/{id}/approve|request-changes|reject`, `POST /admin/campaigns/{id}/start-promotion`, `POST /admin/campaigns/{id}/simulate-delivery`, `POST /admin/campaigns/{id}/complete`.
Server rules: Pydantic validation (title ≤ 60, goal range, URL format, asset types/size), role guards, ownership checks, never expose guest emails/backer names/payment details to others.

## 7. Admin / review (not graded, but needed for a coherent demo)

Tiny role-restricted **web page served by FastAPI at `/admin`** (HTML + fetch): review queue, approve / request changes / reject with note, "start promotion", "simulate delivery" (writes measured impressions/clicks), "complete". Use it in the demo video to show the full lifecycle and notifications arriving in the app.

## 8. Seed data (credibility matters)

12–15 campaigns across all 10 categories & creator types (nonprofit, creator, business, community group), varied funding (5%–100%), statuses (funding, promoting, completed with a report), real-looking stories with images, statistics and 2–4 sources each. Fixed demo accounts: `creator@demo`, `backer@demo`, `admin@demo`. Everything consistent between feed, detail, dashboard. Banner/label: "Demo data".

## 9. Design system

Calm, premium, credible. Primary indigo `#4f46e5` (matches the site), neutral slate surfaces, 4/8 spacing scale, radius 16 cards / 12 inputs, type: Inter (or system) — title 24/28, body 16/24 (story body ≥16px, ~60 char lines), min touch target 48. Colour semantics: green funded/success, amber pending/review, red failed. Reusable: `Button`, `Card`, `CampaignCard`, `ProgressBar`, `StepProgress`, `Expandable`, `StatusBadge`, `Skeleton`, `EmptyState`, `ErrorState`, `Toast`, `SourceItem`, `InfoTooltip`, `BottomSheet`, `InfoPage`. Subtle haptics on submit/back, animated progress on confirmation. Contextual explainers (info icons) for "estimated reach", "use of funds", "review". Test at 360×640 and 412×915.

## 10. Build order & checkpoints (tick as you go)

**Sat night (17 Oct)**
- [x] Inspect repo — **decision: reuse** (builds & typechecks; see Section 13)
- [x] Quick wins: remove auth gate, rename Impact→Activity, delete trust score, 10 categories
- [x] FastAPI backend + SQLite/Postgres schema + seed script + /admin dashboard + /campaigns (Phase 3)
- [ ] Expo Router tabs, theme tokens, core components, API client + TanStack Query

**Sun (18 Oct)** — the core journey
- [ ] Home, Explore (real search/filter/sort), CampaignCard, states
- [ ] Campaign Detail with sources, sticky funding bar, expandables
- [ ] Creator flow Steps 1–5 + autosave + resume drafts + submit + timeline
- [ ] **EAS APK build #1 by midday; install on phone; fix build issues**
- [ ] Backing flow 6 steps + simulated payment + states + receipt

**Mon (19 Oct)** — completeness & polish
- [x] State machine + admin page + notifications generation (backend complete)
- [ ] Activity tab, Profile (created/backed/saved/payments), creator dashboard + analytics (measured vs estimated)
- [ ] Voice creation + AI suggest (with demo fallback); static info pages
- [ ] Polish pass: loading/empty/error everywhere, a11y contrast, back behaviour, remove dead buttons
- [ ] Final APK; clean install test; **record demo**; submit to Telegram

**Tue AM**: buffer — bug fixes only.

If time is short, **cut in this order:** comments → image generation → push notifications → video creatives → drag-reorder (use arrows) → partners page depth. **Never cut:** 5-step creation, draft autosave, detail page w/ sources, backing flow with states, dashboard, lifecycle.

## 11. Demo video (≈4–5 min) — hit every graded theme

1. Home: promise, reach estimate (labelled), how it works. 2. Explore: search + filter + sort, no-results state. 3. Open campaign: story, visible sources, use of funds ("not a donation"). 4. **Guest** backs it: amount → live reach → review with fees → simulated checkout → confirmation → progress updates → receipt. 5. Sign in as creator: **voice creation → editable draft → 5 steps** (show autosave, validation, goal entered by creator) → submit → timeline. 6. Admin page: approve → notification appears in Activity → funding → goal reached ≠ promoting → start promotion → simulate delivery → report. 7. Creator dashboard: tabs, analytics with measured vs estimated. 8. Failed-payment and error/empty states. 9. 10-second architecture slide (Expo ↔ FastAPI ↔ Postgres, state machine). Record phone screen + voiceover, one clean take.

## 12. Hand-off state (UPDATE AS YOU WORK)

**Phase 1 Complete (Sat 17 Oct, 23:45 IST):**
- Auth Gate Removed, Activity Tab built, Trust Scores eradicated, 10 Categories added, Amplification copy reworded.

**Phase 2 & 2.1 Complete (Sun 18 Oct, 00:05 IST):**
- Domain model, 14-state lifecycle, reach service, seed data with 14 campaigns, verification claims and reach guarantees eliminated app-wide.

**Phase 3 Complete (Sun 18 Oct, 00:30 IST):**
- **Backend (/backend):** FastAPI, SQLAlchemy 2.x, Pydantic v2, PyJWT auth, bcrypt hashing, SQLite/Postgres via `DATABASE_URL`.
- **Models & Tables (app/models.py):** `users`, `campaigns`, `campaign_story_blocks`, `campaign_sources`, `campaign_assets`, `campaign_reach`, `contributions`, `moderation_events`, `notifications`, `notification_prefs`, `follows`, `saves`, `campaign_updates`, `feedback`, `reports`, `system_config`.
- **State Machine (app/services/lifecycle.py):** Pure transition table covering all 14 states with preconditions, audit logging in `moderation_events`, and 409 Conflict enforcement on illegal transitions.
- **Reach Service (app/services/reach.py):** Mirrors mobile reach estimation `(amount * (1 - platformFeePct) / cpmUsd * 1000) / avgFrequency` and backer fee calculation.
- **Seed Script (app/seed.py):** Seeds identical 14 campaigns, demo accounts `creator@demo.org` / `creator@demo.com`, `backer@demo.org` / `backer@demo.com`, `admin@demo.org` / `admin@demo.com` (password `demo123`), contributions, and notifications.
- **Endpoints (/api/v1):** Auth, Public Campaigns (search, category, sort, page), Detail, Config Public, Reach Estimate, Drafts CRUD (with partial PATCH), Submit, Respond, Contributions (pending), Payments Simulate (success/pending/failed/cancelled/rejected, only success increments raised & checks milestones), Receipts, Social (follow/save), Notifications + Prefs, Analytics, Feedback, Uploads, AI endpoints (with demo-mode fallback).
- **Admin Console (/admin):** Responsive HTML/JS dashboard for moderation queue, review actions with notes, delivery simulation, and completion.
- **Verification:** `pytest -v` (10 passed, 0 failed); `uvicorn` running on port 8000; `/health`, `/docs`, `/admin` returning 200 OK; verified 3 complete end-to-end user flows.

Next: Phase 4 (Explore filters/sort & Backing flow 6 steps) & Phase 5 (Creator flow 5-step wizard).
Env: `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY` (server only), `EXPO_PUBLIC_API_URL`.

## 13. Gap map: existing repo vs the brief (what to keep / change / build)

The repo was built from the website concept, **before** the brief, so several parts contradict graded requirements. Fix these first.

### Must change (contradicts the brief)
| Existing | Problem | Action |
|---|---|---|
| `RootNavigator` shows **Auth stack until signed in** | Brief: browse **without an account** | Always show Main tabs; sign-in only when creating/saving/following; guests can back |
| Tab "**Impact**" | Brief tab 4 is **Activity** | Rename; build notification centre; move impact charts into creator analytics |
| `trustScore.ts`, `TrustScoreBadge`, Trust Score block in Detail, `trust_score` fields | Fake hash-based score; brief: **never invent a trust score** | **Delete** all of it; replace with "How review works" + visible Sources |
| 6-step wizard "Describe → AI Enhance → Sources → Settings → Ad Creative → Review" | Brief requires **exactly 5 steps: Basics → Story → Campaign & Ad Visuals → Reach → Submit** | Rewrite `CreateCampaignScreen` as 5 step components + shared progress header |
| Wizard has no autosave/drafts; funding goal defaults to `'5000'` | Needs autosave, resume, goal set by creator in Step 5 | Persist draft (AsyncStorage + API), no default goal |
| `campaignAI.ts` = keyword templater | Fine as demo-mode fallback only | Keep as fallback; real AI via backend `/ai/*` |
| 6 categories (environment, health, education, consumer, community, civic) | Brief lists 10 | Update `CampaignCategory` + colours + seed |
| `CampaignStatus` = Approved/Pending/Rejected/Completed | Needs full lifecycle | Replace with state machine statuses (Section 4) |
| Funding requires sign-in, minimum $1 alert, amounts in cents, instant success | Needs guest backing, fees, review step, simulated checkout with pending/failed/cancelled | Rebuild as 6-step backing flow (Section 3) |
| Copy: "funds the campaign", "Impact So Far", "people reached" | Risks reading as donation / guaranteed reach | Reword to "amplification" + "estimated reach"; add "not a donation" notice |
| Hero/Home stats banner with plain numbers | Sample figures must be labelled | Add "Demo data" labels |

### Keep & adapt
`Button`, `Card`, `Input` (extend with error/helper text), `CampaignCard` (add summary, est. reach, **Back This Campaign** button), `theme/colors.ts` (becomes tokens file), `formatting.ts`, Home/Explore skeletons (add sort, filters, skeleton/empty/error states), Detail page layout (add sticky funding bar, expandables, story blocks), SVG chart code from `ImpactDashboard` (reuse in creator analytics, with Measured vs Estimated split), `eas.json`/`app.json`.

### Build new (not in repo at all)
Backend (FastAPI + Postgres) and API client · draft autosave + resume · 5 creation steps incl. story composer, sources manager, ad-placement previews, reach step, submit preview · voice creation · backing flow w/ fees + simulated payment states + receipts · lifecycle state machine + admin page · Activity/notifications + preferences · creator dashboard tabs · reports · saved/followed · secondary info pages · feedback widget (No/Somewhat/Yes) · reach-estimate service driven by config.

### Fastest path (recommended order of attack)
1. Remove auth gate + rename Impact→Activity + delete trust score (30 min — quick wins, app stays runnable).
2. New types/seed (10 categories, lifecycle, story blocks, sources as {title,url}, reach config) — keep local seed as the offline fallback.
3. Backend skeleton + `/campaigns`; switch Home/Explore/Detail to TanStack Query (`npx expo install @tanstack/react-query`).
4. Creation flow rewrite → backing flow → dashboard → activity → voice/AI → polish.
5. `eas init` (creates projectId), first APK build **Sunday midday**.

Use `npx expo install <pkg>` for every new dependency (SDK 58 compatibility) and run `npx tsc --noEmit` + `npx expo-doctor` before each EAS build.

**Resume prompt for a new Claude session:**
> I'm building the Campaign Amplification hackathon app (Expo SDK 58 RN + React Navigation, FastAPI + Postgres backend) per the attached PLAN.md and original brief. Repo: github.com/Harshit-Chaturvedi/campaign-amplifier (app is in the nested `campaign-amplifier/campaign-amplifier` folder). Section 13 lists what to change/keep/build. Continue from the first unchecked item in Section 10, respecting the rules in Section 0.
