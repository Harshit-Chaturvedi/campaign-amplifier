# 📢 Campaign Amplifier

A community-funded ad campaign platform built with React Native (Expo). Create campaigns about civic and local issues, get them trust-scored, rally backers to fund them, and distribute ads across social platforms.

## 🎯 Features

- **AI Campaign Generation** — Describe your issue in plain language, AI generates a full campaign: title, tagline, description, ad copy, slides, and trust score
- **UUTS Trust Scoring** — 3-pillar trust analysis: Fact Check (45%) + Communication Integrity (30%) + Shared Reality (25%)
- **Community Funding** — Select preset or custom amounts, see real-time impact preview (people reached, estimated views)
- **Impact Dashboard** — Track your contribution impact with SVG charts, perception shift metrics, and campaign breakdown
- **Explore & Search** — Filter campaigns by category (Environment, Health, Education, Consumer, Community, Civic)
- **Ad Preview** — Facebook-style ad mockups showing how your campaign appears to target audiences
- **6-Step Campaign Wizard** — Describe → AI Enhance → Sources → Settings → Ad Creative → Review & Submit

## 🛠 Tech Stack

| Tech | Purpose |
|------|---------|
| React Native 0.88 + Expo SDK 58 | Cross-platform mobile |
| TypeScript 6.0 | Type safety |
| Zustand | State management |
| React Navigation 7 | Navigation (stack + bottom tabs) |
| react-native-svg | Charts in Impact Dashboard |
| @expo/vector-icons (Ionicons) | Icons throughout |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npx expo start

# Test on phone
# Install Expo Go, scan QR code (same WiFi)
```

## 📦 Build APK

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview
```

## 📁 Project Structure

```
src/
├── types/          # TypeScript types (Campaign, Navigation)
├── theme/          # Design tokens & colors
├── utils/          # Hash, keywords, formatting utilities
├── services/       # AI generation, trust scoring, impact calc
├── data/           # Seed data (8 campaigns, 4 users, 16 contributions)
├── store/          # Zustand stores (auth, campaigns)
├── components/     # Reusable UI + campaign components
├── navigation/     # Root navigator with auth + 5-tab layout
└── screens/        # Auth, Home, Explore, Create, Funding, Impact, Profile
```

## 📱 Screens

| Screen | Description |
|--------|-------------|
| Login / Register | Demo login or create account |
| Home | Featured campaigns, stats banner, closing soon |
| Campaign Detail | Full campaign view with trust score, sources, ad preview, funding |
| Explore | Search + category filter across all campaigns |
| Create Campaign | 6-step wizard with AI generation |
| Fund Campaign | Amount selection + impact preview |
| Impact Dashboard | SVG charts, stats, perception shift |
| Profile | User stats, contributions, campaigns |

## 📄 License

MIT
