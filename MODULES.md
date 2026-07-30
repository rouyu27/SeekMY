# SeekMY — Module Map (Proposal ↔ Code)

Aligned with BMSE3004 proposal, use-case diagram, and activity diagrams.

| # | Proposal Module | Route / File | Status |
|---|-----------------|--------------|--------|
| 1 | Account Module | `/login` `/register` `/forgot-password` `/reset-password` `/profile` → `pages/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Profile.jsx` | Done |
| 2 | Home Module | `/` → `pages/Home.jsx` + `components/HeroSlider.jsx`, `StateFlag.jsx` | Done |
| 3 | Badge Achievement System | `/activity-log` badges section → `pages/ActivityLog.jsx` + local `Badge` entity | Done |
| 4 | Weather Module | Location detail weather panel → `pages/LocationDetail.jsx` + `base44.functions.invoke('getWeather')` | Done (mock API in local mode) |
| 5 | Local Contributor Portal | `/contributor` → `pages/ContributorPortal.jsx` | Done |
| 6 | Location Detail Module | `/location/:id` → `pages/LocationDetail.jsx` | Done |
| 7 | Map Module | `/map` → `pages/MapView.jsx` (Leaflet + Get Directions) | Done |
| 8 | Admin Panel Module | `/admin` → `pages/AdminPanel.jsx` | Done |
| 9 | Bookmark Module | `/bookmarks` → `pages/Bookmarks.jsx` | Done |
| 10 | User Review & Rating | Location detail reviews → `pages/LocationDetail.jsx` | Done |
| 11 | Activity Filter Module | State page + Discover filters → `pages/StatePage.jsx`, `Discover.jsx` | Done |
| 12 | AI Outdoor Assistant | `/chatbot` → `pages/Chatbot.jsx` | Done (local heuristic; wire real AI API for production) |
| 13 | Community Leaderboard | `/leaderboard` → `pages/Leaderboard.jsx` (weekly/monthly/all + KM/check-ins/states) | Done |
| 14 | Activity Log & Personal Stats | `/activity-log` + `/insights` → `pages/ActivityLog.jsx`, `Insights.jsx` | Done |
| 15 | Help / FAQ (usability US2.4) | `/help` → `pages/Help.jsx` | Done |
| 16 | PWA shell | `public/manifest.json` + index.html | Done (add service worker for full offline later) |

## Roles

- **General User** — browse, filter, bookmark, review, log, badges, leaderboard, AI
- **Local Contributor** — register via Contributors portal (admin verifies)
- **Administrator** — `/admin` locations, contributors, reviews

## Demo accounts

| Email | Password | Role |
|-------|----------|------|
| admin@seekmy.local | admin123 | Admin |
| demo@seekmy.local | demo123 | User |
| Register OTP | 123456 | — |

## Data

Local mode stores entities in `localStorage` (`src/api/base44Client.js`). Seed locations in `src/api/seedData.js`. Images in `public/images/`.

## Diagrams note

Activity diagrams and class/architecture diagrams in your PDF remain the official design artefacts. This codebase implements the **behaviours** those diagrams describe; keep the Visual Paradigm exports in the proposal package as documentation (do not replace them with code).
