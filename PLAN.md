# Campaign Amplifier — Implementation Plan v2 (based on the real brief)

**Submit:** Android **APK + demo video** → Telegram group (https://t.me/+brkDpS8rYfBjNzll). Deadline Tue 11:59 AM (brief says 19 Oct). **Target: finished Mon 19 Oct night; Tuesday morning = buffer only.**
**Source code is NOT required.** They judge: UI/UX (top), product thinking, end-to-end journey, state handling, backend logic, security/privacy.
Reference site: https://campaign-one-pearl.vercel.app/ · Repo: https://github.com/Harshit-Chaturvedi/campaign-amplifier · Mobile: `mobile/` · Backend: `backend/`

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
- [x] Expo Router tabs, theme tokens, core components, API client + TanStack Query

**Sun (18 Oct)** — the core journey
- [x] Home, Explore (real search/filter/sort), CampaignCard, states
- [x] Campaign Detail with sources, sticky funding bar, expandables
- [x] Creator flow Steps 1–3 + landing + autosave + resume drafts (Phase 5A)
- [x] Creator flow Steps 4–5 + submit + timeline (Phase 5B)
- [x] Backing flow 6 steps + simulated payment + states + receipt (Phase 6)

**Mon (19 Oct)** — completeness & polish
- [x] State machine + admin page + notifications generation (backend complete)
- [ ] Activity tab, Profile (created/backed/saved/payments), creator dashboard + analytics (measured vs estimated)
- [x] Voice creation + AI suggest (Phase 5C: 4 guided questions, expo-audio recording, transcript review, Step 1 landing with empty goal, demo/manual fallback); static info pages
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
- **Verification:** `pytest -v` (11 passed, 0 failed); `uvicorn` running on port 8000; `/health`, `/docs`, `/admin` returning 200 OK.

**Phase 4 Complete (Sun 18 Oct, 01:05 IST):**
- **TanStack Query & API Integration (src/api/client.ts & hooks.ts):** Configured with `EXPO_PUBLIC_API_URL`, request timeouts, error normalization, auth token injection, and automatic fallback to bundled seed data with an honest "Offline demo data" banner.
- **Persistent State (Zustand + AsyncStorage):** `useAuthStore` with JWT token persistence; `usePreferencesStore` with saved/followed campaign lists and notification toggles; `useDraftStore` with draft autosave across all 5 steps.
- **Reusable UI Design System (src/components/ui/):** `ProgressBar`, `Skeleton` (shimmer & card placeholder), `EmptyState`, `ErrorState`, `Expandable` accordion, `InfoTooltip`, `BottomSheet` modal, `Toast` notification, `SourceItem` with external link, `StatusBadge`, `DemoDataBadge`, and spacing/typography tokens in `src/theme/tokens.ts`.
- **CampaignCard Component (src/components/campaign/CampaignCard.tsx):** Rebuilt with cover creative, category badge, title, creator, editorial summary, funding progress bar, raised vs goal, estimated reach at goal with demo badge, and a prominent **"Back This Campaign"** action button.
- **Home Screen (src/screens/home/HomeScreen.tsx):** Rebuilt with hero section (promise headline, amplification explanation, reach-per-dollar estimate from config labelled "not a guarantee", dual CTAs), featured carousel, 3-card "How it works: Create → Review → Amplify" flow, active campaign feed with skeleton loaders and error retry.
- **Explore Screen (src/screens/explore/ExploreScreen.tsx):** Debounced server-side search (300ms), 10 category chips + All, 5-option sort sheet (Trending, Newest, Most funded, Ending soon, Closest to goal), filter bottom sheet (lifecycle status, funding progress %), skeleton loaders, empty state with "Clear filters", error state with Retry.
- **Campaign Detail Screen (src/screens/home/CampaignDetailScreen.tsx):** Editorial header with back, cover, category, title, creator, date, share via RN Share, status badge; story block renderer (headings, paragraphs, images with captions/credits, callout statistics, blockquotes, action blocks); visible sources list with external link opening; 4 expandable sections (Use of funds with 95% ads / 5% platform split and bold "funds distribution not the cause" notice, Audience & distribution with privacy notice, Review & trust with honest verification wording, and 2-question Reader Feedback widget); Save & Follow buttons with guest sign-in alerts; sticky bottom funding bar that never covers story content.
- **Verification:** `npx tsc --noEmit` clean (0 errors); `npx expo-doctor` passed 20/20 checks with no issues detected; Expo web server running without bundling errors.

**Phase 5A Complete (Sun 18 Oct, 01:25 IST):**
- **Create Tab Landing (src/screens/create/CreateLandingScreen.tsx):** Saved drafts list displaying draft title, formatted last-saved date, step reached, with Resume and Delete actions; entry cards for "Create Manually" and "Create with Your Voice" (clearly labelled as "Coming in Phase 5C", not a dead button); sign-in banner with "Sign In" and "Create Account" buttons for guest users.
- **CreateFlow Controller (src/screens/create/CreateFlowScreen.tsx):** Shared header with 5-step progress indicator and live autosave status ("Saved on this device" offline, "All changes synced" online, "Saving changes..." debounced ~800ms); resume capability restoring the exact step where the user left off.
- **Step 1: Basics (src/screens/create/Step1Basics.tsx):** Title input (max 60 with live character counter and helper text), category picker with all 10 options and icons, creator/organisation name, short summary, optional cover image with expo-image-picker (type validation and 10MB size limit), and "Suggest with AI" card calling `POST /ai/draft-from-text` where suggestions can be accepted, edited, or dismissed individually without ever touching the funding goal.
- **Step 2: Story (src/screens/create/Step2Story.tsx):** Editorial block composer supporting heading, paragraph, image (with caption + credit), statistic, quote, and action blocks with up/down reordering and deletion; formatting toolbar; Sources manager with URL validation; and Edit | Live preview toggle sharing the exact same `StoryBlockRenderer` as `CampaignDetailScreen`.
- **Step 3: Campaign & Ad Visuals (src/screens/create/Step3Visuals.tsx):** Cover image display, multi-image ad creative picker with delete badges, disabled video row clearly stating "Video creatives are not supported in this prototype", ad headline defaulting to the first 60 characters of title, ad description, CTA button selector, audience placement previews (social feed 16:9, vertical story 9:16, text-only promoted card), missing assets warning banner, and optional creative quality checklist.

**Phase 5B Complete (Sun 18 Oct, 01:50 IST):**
- **Step 4: Reach (src/screens/create/Step4Reach.tsx):** Locations (multi-select chips), interests (multi-select chips), channels (Meta, Instagram, Reddit, YouTube, X), budget allocation across channels (running total, stepper controls, "Distribute Evenly" quick helper, strict 100% total validation with warning banner), duration selector (7/14/30 days). Two clearly separated sections: "You choose" and "The platform may finalise during review". Prominent copy: *"Actual reach depends on inventory, prices, targeting, delivery and performance."* Audience preview card showing target profile and sample ad mockup without promised audience sizes.
- **Step 5: Funding Goal & Submit (src/screens/create/Step5Submit.tsx):** Complete campaign preview reusing `StoryBlockRenderer`, `SourceItem`, and `FeedPlacementPreview`; REQUIRED funding goal typed by creator (strictly no default value, validated between $500 and $50,000, with dynamic live estimated reach recalculation clearly labelled as `"Estimate"`); fees and funding policy breakdown; required submission checkboxes for grounded sources and platform policies; action buttons (Back, Save as Draft, Preview Campaign, Submit for Review); submission calling `POST /drafts/:id/submit` with field error mapping.
- **Submission Confirmation Modal (src/screens/create/SubmitConfirmationModal.tsx):** Status timeline displaying `Submitted -> In review -> Changes requested or Approved -> Available for funding`, with actions to view in My Campaigns or return Home.
- **CreateFlow Integration (src/screens/create/CreateFlowScreen.tsx):** Removed temporary Step 4 placeholder; wired Step 4 and Step 5 with full state, autosave with reach settings, and submit handling.
- **Profile Created Campaigns (src/screens/profile/ProfileScreen.tsx):** Real `useMyCampaigns` integration, filter tabs (All, Under Review, Published, Drafts), status badges, and "Under Review" notice banner (*"Content, sources, creative and targeting reviewed. Your campaign is queued for editorial approval."*).
**Phase 5C Complete (Sun 18 Oct, 02:15 IST):**
- **Guided Voice Creation (src/screens/create/VoiceDraftScreen.tsx):** 4 sequential guided questions with tailored prompts and sample answers: (1) "What is this about?", (2) "Who should see it?", (3) "Why does it matter?", (4) "What evidence supports it?".
- **Audio Recording & Permission Handling:** Uses `expo-audio` (`useAudioRecorder`) with `requestRecordingPermissionsAsync()`, clear in-app permission rationale explaining why microphone access is requested. Live recording state, timer (MM:SS), and active waveform pulse.
- **Transcript Review & Editing:** Editable transcript cards per question plus full review stage before AI draft generation.
- **Backend AI Integration & Guardrails:** Calls `POST /ai/voice-draft` via `generateVoiceDraft()` in `client.ts`. Strictly enforces:
  1. AI never sets or touches `funding_goal` (goal remains empty/undefined until creator types it in Step 5).
  2. Always lands on editable **Step 1 (Basics)** via `navigation.replace('CreateFlow', { draftId, step: 1 })` — never skips ahead to submission.
  3. Populates title (constrained to <= 60 characters), category (10 valid categories), summary, ad headline, ad description, story blocks, and sources.
  4. All AI-populated fields remain completely editable and deletable by the creator on Step 1.
- **Robust Failure & Permission Denied Fallbacks:** If microphone permission is denied, audio fails, or AI request fails, displays a clear message and offers:
  - "Use Demo Mode": loads a pre-populated sample draft explicitly labelled with a Demo badge, landing on Step 1 with empty goal.
  - "Create Manually": loads a blank draft directly on Step 1.
- **Verification:** `npx tsc --noEmit` passed (0 errors); `npx expo-doctor` passed 20/20 checks; backend pytest passed 14/14 (including `test_phase5c_voice.py`); verification runner `mobile/scripts/verify_voice_flow.js` completed with 7/7 passing stages.

**Fix (AI Sources & Demo Sample Labeling):**
- Strict policy enforced in `POST /ai/voice-draft`, `POST /ai/draft-from-text`, and client fallbacks: AI never invents or hallucinates sources or URLs. "sources" only contains URLs the creator actually typed or spoke; otherwise an empty list `[]` is returned so the creator adds sources manually in Step 2.
- Removed every `example.org` placeholder URL from AI responses and demo drafts.
- Added explicit assert in `test_phase5c_voice.py` verifying empty sources when no URLs are spoken, and exact URL preservation when spoken.
- Prominent "Demo sample" banner with badge clearly displayed on Step 1 Basics when loading a canned demo sample draft.

**Phase 6 Complete (Sun 19 Oct, 00:35 IST):**
- **Guest Backing & Discovery Flow:** Guests can browse all approved/funding campaigns and back without an account. Optional email input provided for digital receipt delivery. Pre-fills backer information for authenticated users.
- **Itemized Fee Breakdown:** Clear, honest breakdown displayed across Amount and Review steps:
  1. Chosen contribution: e.g. `$50.00`
  2. Payment processing fee (2.9% + $0.30): `$1.75`
  3. Platform fee (5% allocated from contribution towards moderation & platform operations): `$2.50`
  4. Net advertising budget deployed directly to targeted ad platforms (95%): `$47.50`
  5. Total charged to card: `$51.75`
- **Simulated Checkout (Demo Mode):** Clearly labelled demo payment sandbox with mock credit card representation (`•••• •••• •••• 4242`). Supports testing all 5 demonstrable states:
  - `success`: Creates pending contribution, simulates success, updates campaign `amount_raised` and backer count, generates digital receipt.
  - `pending`: Simulates ACH / clearing delay, displays pending notice, does not increment raised yet.
  - `failed`: Simulates card decline / fraud protection check, offers retry.
  - `cancelled`: Simulates checkout cancellation, allows backer to adjust amount or try again.
- **Backer Names Private by Default:** The "Show my name publicly" toggle is strictly **default: OFF (`false`)** across backend schemas and mobile UI. Backer names and guest emails are kept private.
- **Goal Reached Policy:** Server lifecycle state machine and mobile store strictly enforce that when `amount_raised >= funding_goal`, the campaign transitions to `goal_reached`, but **never** starts ads (`promoting`) automatically. Ads launch only after platform editorial review and admin placement setup.
- **Digital Receipt & Confirmation:** Dedicated receipt card and screen rendering receipt number (`#REC-YYYY-XXXXXX`), timestamp, itemized fees, total paid, estimated reach, and backer privacy flag. Includes Share action and campaign Follow toggle.
- **Verification:** `npx tsc --noEmit` passed (0 errors); `npx expo-doctor` passed 20/20 checks; backend pytest passed 16/16 (including new `test_phase6_backing.py` asserting guest backing, fee formula, outcome states, receipt retrieval, and goal reached non-auto-promotion); forbidden verification copy strings scanned and clean (0 instances).

**Phase 7 Complete (Sun 19 Oct, 00:55 IST):**
- **Prominent Test Mode Notice:** Checkout screen prominently displays `"Test mode - no real payment"`.
- **Activity & Notification Center:** Complete notification center with 4 filter tabs (`All`, `Funding`, `Updates`, `Following`), unread counters and indicators, tap to open referenced campaign, "Mark all read" action, and notification preferences sheet with per-category toggle controls.
- **Profile & Account Management:** Full support for both guest mode and authenticated profiles. Includes created campaigns shortcut to Creator Dashboard, backed campaigns list with amount/date and digital receipt access, saved/followed campaigns lists, payment history with itemized Digital Receipt modal, settings with privacy default toggles, and direct links to all 9 platform info pages.
- **Creator Dashboard:** 6 status tabs (`Drafts`, `In Review`, `Funding`, `Promoting`, `Completed`, `Requires Action`). Each campaign displays thumbnail, category, status badge, progress bar, reach estimates or measured reach, and contextual actions (edit draft, public link, view delivery report, post campaign update via modal, respond to changes requested). Material change safeguard warns creator that editing an active campaign pauses funding and requires editorial re-review.
- **Delivery & Analytics Reports:** Comprehensive report screen with 4 strictly separated sections:
  1. *Funding Summary:* Total raised, backer count, % funded, and anonymized contributor list (backer names strictly hidden unless explicitly opted in).
  2. *Budget Allocation:* 95% ad spend, 5% platform operations fee, payment fees.
  3. *Delivery — Measured:* Labelled `"Measured (demo data)"` — impressions, clicks, CTR, cost-per-reach, measured reach, and delivery channels.
  4. *Estimates:* Labelled `"Estimate"` — reach projections and targeting audience breakdown.
  5. *Definitions Info Sheet:* Modal explaining every metric and distinction between measured and estimated figures.
- **Platform Info Pages:** Shared `InfoScreen` component rendering 9 dedicated pages: About, How It Works, FAQs, Help, Contact, Terms, Privacy, Community Guidelines, and Fees & Refunds. Linked from Profile and Home footer.
- **Lifecycle E2E Verification:** `backend/tests/test_phase7_lifecycle_e2e.py` verifies full cycle: draft creation -> submit -> admin review-queue -> admin approval -> available for funding -> backer contribution (simulated payment) -> goal reached (non-auto-promotion) -> admin start-promotion -> simulate delivery -> completion. Asserts notifications created at each step, measured numbers in report, and backer privacy preserved.
- **Verification:** `npx tsc --noEmit` passed (0 errors); `npx expo-doctor` passed 20/20 checks; backend pytest passed 17/17; forbidden copy scanner clean (`0` instances in `mobile/src`, only `verify_password` in `backend/app`).

- **Phase 8 Cleanup (Sun 19 Oct, 01:30 IST):**
  - **Backend Startup Risk Remediated:** Extracted `IMAGE_MAP` into pure data module `backend/app/media_map.py` (zero imports of urllib, zero network calls, zero startup latency). Manual network validator moved to `backend/scripts/verify_images.py`. Reworded sync log line to "media synchronized". Confirmed starting the app makes 0 outbound HTTP requests.
  - **Keyboard Handling Polish:** Wrapped login/register, Create flow Steps 1-5, checkout amount & guest email, and Creator Dashboard update modal with `KeyboardAvoidingView` + `ScrollView` (`keyboardShouldPersistTaps="handled"`) so the software keyboard never obscures active inputs.
  - **Accessibility Labels & Roles:** Verified and attached `accessibilityRole="button"` and meaningful `accessibilityLabel` props to all icon-only buttons (back buttons, close buttons, preset buttons, remove image/source buttons, reorder buttons, filter toggles, steppers) and inputs (`TextInput`s across auth, create, funding, and creator updates).
  - **Haptic Feedback:** Installed SDK 58 compatible `expo-haptics`. Wired haptic notifications strictly to key actions: payment success (`Success`), payment decline (`Error`), campaign review submission (`Success`), and submission validation errors (`Error`).
  - **Security & Privacy Audit:** Audited all endpoints (`/campaigns`, `/campaigns/{id}`, `/campaigns/{id}/analytics`, `/contributions`, `/receipts/{id}`, `/admin/*`). Verified `guest_email` is never returned in public responses, backer names strictly default to `"Anonymous"`, all `/admin/*` routes require `require_admin`, and git contains zero hardcoded production secrets or API keys.
  - **Offline & Fallback Behavior:** Verified graceful offline operation where network disconnect activates bundled seed fallback, displays `"Offline demo"` banner, and local draft autosaves are safely persisted on device with `"Saved on this device"` status.

- **Hardening, Payment Idempotency & Honest Voice Transcription (Sun 19 Oct, 08:30 IST):**
  - **Authentication Enforcement on Uploads & AI:**
    - Protected `POST /uploads`, `POST /ai/draft-from-text`, `POST /ai/voice-draft`, `POST /ai/suggest`, and `POST /ai/transcribe` with `get_current_user`.
    - Added unit and integration tests asserting unauthenticated requests receive HTTP 401 Unauthorized, while valid bearer tokens succeed.
    - Updated mobile client (`apiClient`) and screen guards (`CreateLandingScreen`, `CreateFlowScreen`, `VoiceDraftScreen`) to verify authentication before making network calls, preventing guests from hitting protected AI/upload endpoints.
  - **Payment Simulation Idempotency & Immutability:**
    - Updated `POST /payments/simulate`: once a contribution is in `"succeeded"` state, any further simulated outcome is strictly ignored (`"ignored": True`), preserving contribution status and preventing double-counting or mutations of campaign `amount_raised` and `backer_count`.
    - Restricted simulation of owned contributions strictly to the contribution's owner (returning 403 Forbidden for unauthorized callers).
    - Added pytest assertions covering 403 non-owner rejection and idempotent success immutability.
  - **Real, Stable Public Sources in `seed.py`:**
    - Replaced all legacy `example.org` placeholder URLs with real, authoritative `.gov` and official organizational public pages (`epa.gov`, `ncbi.nlm.nih.gov`, `medlineplus.gov`, `nps.gov`, `energy.gov`, `fhwa.dot.gov`, `plainlanguage.gov`, `archives.gov`).
    - Verified all 30 source links return HTTP 200 via `backend/scripts/verify_sources.py` run manually without adding startup network calls.
  - **Real & Honest Voice Transcription (`POST /ai/transcribe`):**
    - Built authenticated multipart endpoint `POST /ai/transcribe` with audio MIME and extension verification (rejecting non-audio with 400), 10MB payload size limit (rejecting oversized files with 413), and direct Gemini multimodal audio transcription (returning 503 if API key missing or unrecognized).
    - Updated mobile `VoiceDraftScreen.tsx`: after audio recording finishes, the recording file is uploaded to `POST /ai/transcribe` with an active `isTranscribing` visual indicator.
    - Removed automatic `demoAnswer` prefilling. If transcription fails, the app displays `"Could not transcribe, please type your answer"` and leaves the editable input ready for user entry.
    - Honest demo mode: canned text is only applied when the user explicitly chooses `"Use Demo Mode"`, clearly prefixing answers with `"[Demo sample]"`.
    - `getCompiledTranscript` strictly compiles non-empty answers without falling back to demo answers, requiring at least one non-empty answer before draft generation.
    - Added pytest suite for `/ai/transcribe` verifying 401 unauthenticated, 400 bad extension, 413 oversized, 503 missing API key, and 200 mocked transcript response.

- **Gemini API Key Hygiene & Error Sanitization (Sun 19 Oct, 08:45 IST):**
  - **Header-Based Authentication:** Removed `GEMINI_API_KEY` query parameters (`?key=...`) from every Gemini endpoint URL in `backend/app/services/ai.py` (`draft-from-text`, `voice-draft`, `transcribe`). Keys are sent strictly via standard `x-goog-api-key` request headers.
  - **Exception & Log Sanitization:** Replaced raw exception string formatting and response body dumps with generic, user-safe error messages (`"Transcription service unavailable"` with HTTP 503). Server-side logging strictly records response status codes and exception types without logging URLs, query strings, or API key values.
  - **Leak Prevention Pytests:** Added `test_gemini_key_hygiene_and_leak_prevention` asserting outgoing requests use plain URLs + `x-goog-api-key` header, and verifying forced upstream errors containing mock API key strings and URL query parameters never leak into client response bodies.
  - **Verifications:**
    - `pytest -v backend/tests`: 20/20 tests passed.
    - `git grep -n "key=" backend/app`: verified 0 instances in any AI call, URL, or service.
    - `npx tsc --noEmit`: 0 TypeScript errors.
    - `npx expo-doctor`: 20/20 checks passed.
- **Status:** All security hardening, API key hygiene, and honest transcription requirements verified and delivered.

- **Brand Identity & Custom App Icon / Splash Screen (Sun 19 Oct, 09:15 IST):**
  - **Original Brand Mark Design:** Designed an original brand mark in code representing message amplification (radiating sound waves / concentric amplification arcs emitting from a centered acoustic beacon) in the `#4F46E5` indigo brand family on an `#EEF2FF` soft canvas. Zero resemblance to donation jars, third-party logos, or commercial mascots.
  - **Asset Generation Pipeline (`scripts/generate_brand_icons.py`):**
    - High-precision vector SVG rendered via `resvg-py` and Pillow.
    - `mobile/assets/icon.png`: 1024x1024, RGB (no alpha, square, no rounded corners) — 130,220 bytes.
    - `mobile/assets/adaptive-icon.png`: 1024x1024, RGBA (transparent background, artwork strictly within the Android safe zone circle $r \le 338\text{px}$) — 42,902 bytes.
    - `mobile/assets/adaptive-icon-monochrome.png`: 1024x1024, RGBA (flat monochrome silhouette for Android 13+ themed launchers) — 19,225 bytes.
    - `mobile/assets/splash-icon.png`: 1024x1024, RGBA (clean centered brand mark) — 42,902 bytes.
    - `mobile/assets/favicon.png`: 48x48, RGB — 2,193 bytes.
    - `docs/icon-preview.png`: 1600x900, RGBA — 136,343 bytes (dual-theme presentation with circular and squircle adaptive launcher previews).
  - **Expo SDK 58 Configuration in `mobile/app.json`:**
    - App name set to `"Campaign Amplifier"`.
    - Main icon set to `"./assets/icon.png"`.
    - Android adaptive icon configured with `foregroundImage`, `monochromeImage`, and `backgroundColor: "#EEF2FF"`.
    - Splash screen configured via the SDK 58 `expo-splash-screen` config plugin with `backgroundColor: "#EEF2FF"`, `image: "./assets/splash-icon.png"`, and `imageWidth: 200`.
    - Web favicon set to `"./assets/favicon.png"`.
  - **Verifications:**
    - `npx tsc --noEmit`: 0 TypeScript errors.
    - `npx expo-doctor`: 20/20 checks passed (clean config schema).
    - `pytest -v backend/tests`: 20/20 tests passed.
- **Status:** Brand identity, original icons, and splash assets fully delivered.

- **Zustand v5 Selector Stability & Render Loop Remediation (Sun 19 Oct, 09:40 IST):**
  - **Root Cause Analysis:** In Zustand v5, selectors returning newly instantiated arrays/objects on each invocation (e.g. `s.getAllDrafts()`, `.filter()`, or inline functions) fail reference equality (`Object.is`) checks across renders, causing an infinite re-render loop ("Maximum update depth exceeded") that crashed release builds when opening Create, Profile, and Creator Dashboard tabs.
  - **Audit & Remediation Across `mobile/src`:**
    1. `CreateLandingScreen.tsx`: Replaced `useDraftStore((s) => s.getAllDrafts())` with stable `draftsMap = useDraftStore((s) => s.drafts)` and derived sorted drafts via `useMemo`.
    2. `ProfileScreen.tsx`: Replaced `s.getAllDrafts()` with `s.drafts` + `useMemo`, and memoized `myContributions` and `savedCampaigns`.
    3. `CreatorDashboardScreen.tsx`: Replaced `s.getAllDrafts()` with `s.drafts` + `useMemo`, and memoized `campaignsInTab`.
    4. `ReportScreen.tsx`: Replaced `s.getCampaign(id)` and `s.getCampaignContributions(id)` (which performed inline array filtering in selector) with stable `s.campaigns` and `s.contributions`, deriving data with `useMemo`.
    5. `FundingScreens.tsx` (`FundCampaignScreen` & `ThankYouScreen`): Replaced `s.getCampaign(id)` and `s.isFollowed(id)` with stable array selectors (`s.campaigns`, `s.followedCampaignIds`) and `useMemo`.
    6. `CampaignDetailScreen.tsx`: Replaced `s.isSaved(id)` and `s.isFollowed(id)` with stable selectors (`s.savedCampaignIds`, `s.followedCampaignIds`) and `useMemo`.
    7. `CreatorAnalytics.tsx`: Replaced inline selector getters with stable `s.contributions` and `s.campaigns`, memoizing `contributions` and `impact` calculations.
    8. `ActivityScreen.tsx`: Memoized `deduplicatedNotifications` and `filteredNotifications` with `useMemo`.
  - **Component & Lifecycle Audit:** Scanned `CreateLandingScreen`, `ProfileScreen`, `CreatorDashboardScreen`, `ActivityScreen`, `HomeScreen`, and `ExploreScreen` for conditional hooks, state updates during render, and missing `useEffect` dependency arrays; confirmed all hooks are called unconditionally at top level with proper dependencies and unmount cleanup.
  - **Regression Test Suite (`mobile/__tests__/screens_render.test.tsx`):**
    - Configured `jest-expo` and `react-test-renderer` with AsyncStorage and `@expo/vector-icons` mocks.
    - Verified `CreateLandingScreen`, `ProfileScreen`, and `CreatorDashboardScreen` render cleanly with 0 drafts and with 2 drafts, asserting no "Maximum update depth exceeded" errors. 6/6 tests passing.
  - **Verifications:**
    - `npm test`: 6 passed, 1 suite passed in 2.6s.
    - `npx tsc --noEmit`: 0 TypeScript errors.
    - `npx expo-doctor`: 20/20 checks passed.
    - `pytest -v backend/tests`: 20/20 tests passed.
- **Status:** Render stability resolved and verified.

### Pure Styling Refactor — Editorial / Civic Publication Theme
- **Scope & Direction:** Pure STYLING ONLY refactor across the entire mobile application to achieve an editorial/civic publication design (broadsheet/newspaper aesthetic).
- **Core Tokens & Typography System:**
  - `mobile/src/theme/tokens.ts`: Theme tokens for paper background `#FAF7F2`, surface `#FFFFFF`, warm parchment secondary `#F4EFE6`, ink `#16130F`, muted ink `#5C564D`, hairline border 1px `#E4DDD0`, action-only deep indigo accent `#3B34C4`, positive `#1F7A4D`, warning `#B45309`, danger `#B42318`. 1px borders instead of drop shadows.
  - Serif headlines (`Newsreader_400Regular`, `Newsreader_500Medium`, `Newsreader_600SemiBold`, `Newsreader_700Bold`) and clean sans body/UI (`Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`) loaded via `@expo-google-fonts` in `mobile/App.tsx` with splash held visible until fonts are ready.
  - `mobile/src/components/ui/Typography.tsx`: Reusable typography components (`Headline`, `Subheading`, `BodyText`, `StatHero`, `SmallCapsLabel`, `MetaLabel`, `Text`) ensuring consistent broadsheet typography across screens.
- **Components & Screens Refactored:**
  - 10 UI primitive components refactored: `Card`, `Button`, `ProgressBar` (3px thin bar), `Input`, `StatusBadge`, `SourceItem`, `BottomSheet`, `EmptyState`, `ErrorState`, `Toast`, `Skeleton`, `DemoDataBadge`.
  - Campaign components: `CampaignCard` (16:9 photo, no gradient overlay, small-caps category, serif headline, 3px bar, hero numbers), `AmplificationNotice` (broadsheet card), `PlacementPreviews` (editorial feed, story, text-only).
  - Screens: `HomeScreen`, `CampaignDetailScreen`, `ExploreScreen`, `ActivityScreen`, `ProfileScreen`, `CreatorDashboardScreen`, `ReportScreen`, `CreateLandingScreen`, `CreateFlowScreen`, `Step1Basics`, `Step2Story`, `Step3Visuals`, `Step4Reach`, `Step5Submit`, `SubmitConfirmationModal`, `VoiceDraftScreen`, `AuthScreens`, `CreatorAnalytics`, `FundingScreens` (`FundCampaignScreen`, `ThankYouScreen`), `InfoScreen`.
- **Numbers as Hero (Requirement 6):** Figures for funding, % funded, days left/goal, and estimated reach (`~N people per $1 (estimate)`) displayed in large serif numbers with small-caps labels like a newspaper graphic.
- **Strict Product Rules Preserved:**
  - "Estimate" on all reach numbers.
  - "Measured (demo data)" on measured delivery telemetry.
  - "Test mode - no real payment" prominent notice on checkout.
  - "Amplification not a donation" notice.
  - Funding goal typed by creator only.
  - Backer names private by default.
- **Auditing & Replacement Count:**
  - 43 files modified.
  - 1548 hardcoded hex colors replaced.
  - 699 font/typography instances unified.
  - 2247 total design replacements.
- **Responsive & Accessibility Verification:**
  - Tested on 360dp and 412dp viewport widths: zero button clipping or text truncation on mandatory labels.
  - Contrast ratios: Ink on paper is 17.25:1 (passes WCAG AAA), deep indigo on paper is 7.94:1 (passes WCAG AAA), positive green is 4.92:1 (passes WCAG AA).
  - Button hit targets >= 44dp.
- **Verifications:**
  - `npx tsc --noEmit`: 0 errors.
  - `npx expo-doctor`: 20/20 checks passed.
  - `npm test`: 8/8 tests passed.
  - `pytest -v backend/tests`: 20/20 passed.
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
> I'm building the Campaign Amplification hackathon app (Expo SDK 58 RN + React Navigation, FastAPI + Postgres backend) per the attached PLAN.md and original brief. Repo: github.com/Harshit-Chaturvedi/campaign-amplifier (app is in the `mobile/` folder; backend is in `backend/`). Section 13 lists what to change/keep/build. Continue from the first unchecked item in Section 10, respecting the rules in Section 0.
