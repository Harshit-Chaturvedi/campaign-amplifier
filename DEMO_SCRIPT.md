# Campaign Amplifier — Video Demo Script (3–4 Minutes)

This walkthrough demonstrates the end-to-end functionality of **Campaign Amplifier**, built with React Native (Expo) and FastAPI/Postgres.

---

## Demo Credentials & Setup
- **Creator Account:** `creator@demo.org` / `demo123`
- **Backer Account:** `backer@demo.org` / `demo123`
- **Admin Account:** `admin@demo.org` / `demo123`
- **Backend API:** Live on Render (`https://campaign-amplifier-backend.onrender.com/api/v1`) with bundled offline fallback seed data.

---

## Timestamped Walkthrough (0:00 – 3:30)

### 0:00 – 0:45 | Scene 1: Discovery & Core Value Proposition (Home & Explore)
- **What to click:**
  1. Open app on Home screen.
  2. Point out Hero banner: *"Help important messages travel beyond their networks"*, reach-per-dollar estimate labelled *"Estimate, not a guarantee"*, and the prominent note: *"Contributions pool to pay for digital advertising that spreads the message... It is not a donation to causes."*
  3. Scroll through the "How It Works" sequence (*Create -> Review -> Amplify*) and Featured Campaigns carousel.
  4. Tap the **Explore** tab. Show category filter chips (Environment, Health, Science, Civic, etc.) and search input. Search for *"water"*.
  5. Tap into the campaign **"Clean drinking water in every public school"**.
- **What to say:**
  > *"Welcome to Campaign Amplifier. Campaign Amplifier is civic message distribution infrastructure. It is strictly not a donation platform. Instead of giving money to causes or individuals, community members pool micro-contributions to purchase digital advertising that spreads checkable messages to targeted audiences and decision-makers. Notice that our reach metrics are always transparently labelled as estimates, never guarantees."*

---

### 0:45 – 1:30 | Scene 2: Transparent Campaign Details & Backing Flow
- **What to click:**
  1. On the Campaign Detail page, scroll down through the editorial story blocks, verifiable primary source citations, and expandable sections (*Use of funds: 95% ad spend, 5% platform review*).
  2. Tap the bottom sticky button: **"Back This Campaign"**.
  3. **Step 1 (Choose Amount):** Tap preset `$25` or `$50`. Notice live estimate updating: *"Est. people reached: ~1,350"*. Notice the banner: *"Message amplification, not a donation"*.
  4. Tap **"Review $50"**.
  5. **Step 2 (Review & Fee Breakdown):** Review itemized fee breakdown: Chosen Contribution ($50.00), Payment processing fee (2.9% + $0.30 = $1.75), Total charged ($51.75). Show that the 95% ad spend vs 5% operations split is completely transparent.
  6. Point out the switch: *"Show my name publicly"* is **OFF by default** to preserve backer privacy.
  7. Tap **"Proceed to Checkout ($51.75)"**.
  8. **Step 3 (Simulated Checkout):** Note the prominent header: *"Test mode - no real payment"*. Tap **"Simulate Success ($51.75)"**. (Mention other testable states: Pending, Failed, Cancelled).
  9. **Confirmation Screen:** Show updated progress bar, digital receipt (`#REC-2026-XXXXXX`), and follow toggle.
- **What to say:**
  > *"Backing is accessible to anyone, including guests without an account. Backers see an itemized fee breakdown before payment, and backer names are private by default. When we simulate checkout in test mode, payments are processed and a digital receipt is immediately issued. Reaching a funding goal does not launch ads automatically—campaigns must go through placement setup first."*

---

### 1:30 – 2:30 | Scene 3: Campaign Creation (Manual & Voice Flow)
- **What to click:**
  1. Tap the **Create** tab (+ icon).
  2. Show saved drafts list and the two creation modes: **"Create Manually"** and **"Create with Your Voice"**.
  3. Tap **"Create with Your Voice"**.
  4. Tap the microphone button to start recording answer to Question 1 (*"What local issue needs attention?"*). Speak or tap "Use Demo Mode".
  5. Notice audio pulse and real-time timer. Proceed through questions or select demo sample.
  6. The app lands strictly on **Step 1: Basics** with fields pre-filled and completely editable. Point out: **Funding goal is never touched or hallucinated by AI**.
  7. Walk through the 5 persistent steps:
     - **Step 1 Basics:** Title with character counter (max 60), Category, Creator Name, Summary.
     - **Step 2 Story:** Editorial blocks (headings, paragraphs, stats) and primary source manager.
     - **Step 3 Visuals:** Cover image, ad headline, ad placement previews (Feed, Story, Search).
     - **Step 4 Reach:** Target locations, interest tags, channels (Facebook, Instagram), and budget allocation sliders summing to 100%.
     - **Step 5 Submit:** Full live campaign preview. The creator **types their own funding goal** (e.g. `$3,500`), checks compliance agreements, and taps **"Submit for Review"**.
- **What to say:**
  > *"Creating a campaign follows a rigorous 5-step sequence with autosave. Creators can use their voice or create manually. Our AI integration transcribes and drafts copy, but enforces strict safeguards: AI never invents sources or URLs, and it never touches the funding goal—that must be entered by the creator. Every field remains completely editable before submission."*

---

### 2:30 – 3:15 | Scene 4: Creator Dashboard, Activity Center & Delivery Reports
- **What to click:**
  1. Tap the **Profile** tab. Show user status, Backed campaigns, Saved campaigns, Payment history with Digital Receipts.
  2. Tap **"Creator Dashboard"**.
  3. Walk through the status tabs: *Drafts*, *In Review*, *Funding*, *Promoting*, *Completed*, *Requires Action*.
  4. Select a completed campaign (e.g., *"A supervised crossing outside the primary school"*).
  5. Tap **"View Delivery & Analytics Report"**.
  6. Show the 4 strictly separated sections:
     - **Funding Summary:** Total raised, backer count, anonymized contributions list.
     - **Budget Allocation:** 95% ad spend, 5% platform operations fee.
     - **Delivery — Measured:** Explicitly labelled **"Measured (demo data)"** showing impressions, clicks, CTR, and measured reach.
     - **Estimates:** Explicitly labelled **"Estimate"** showing initial targeting projections.
     - Tap **"Metric Definitions & Policy"** to open the explanatory sheet.
  7. Tap the **Activity** tab. Show event notifications (*Milestone reached*, *Submission approved*, *Delivery report ready*) across All, Funding, Updates, and Following tabs. Tap the settings gear to show notification preference toggles.
- **What to say:**
  > *"The Creator Dashboard lets creators track campaigns across their complete lifecycle. In the Delivery & Analytics Report, we maintain strict honesty: actual measured impressions and clicks are clearly labelled 'Measured (demo data)' and never conflated with estimates. Backer lists remain anonymized by default. Finally, the Activity tab keeps users informed with categorized notifications."*

---

### 3:15 – 3:30 | Scene 5: Platform Policies & Conclusion
- **What to click:**
  1. Navigate to **Profile -> Fees & Refunds** or tap the footer on Home.
  2. Show one of the 9 dedicated info pages with clean callout cards.
  3. Conclude the video.
- **What to say:**
  > *"All 9 platform policy pages—from Fees & Refunds to Community Guidelines—are accessible across the app. Campaign Amplifier brings verifiable transparency, disciplined lifecycle state management, and clear community reach to civic causes. Thank you."*
