# SeekMY — Module Map

Aligned with the BMSE3004 proposal, use-case diagram, and activity diagrams.

| # | Proposal module | Route / implementation | Status |
|---|---|---|---|
| 1 | Account | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/profile`; Firebase Authentication and `User` documents | Implemented |
| 2 | Home | `/`; `pages/Home.jsx`, `HeroSlider.jsx`, `StateFlag.jsx` | Implemented |
| 3 | Badges | `/activity-log`; Firestore `Badge` documents | Implemented |
| 4 | Weather | Location detail; OpenWeatherMap current conditions and forecast | Implemented |
| 5 | Contributor portal | `/contributor`; Firestore contributors and admin verification | Implemented |
| 6 | Location detail | `/location/:id` | Implemented |
| 7 | Map | `/map`; Leaflet and directions links | Implemented |
| 8 | Admin | `/admin`; locations, starter-data import, contributors, reviews, and roles | Implemented |
| 9 | Bookmarks | `/bookmarks`; Firestore bookmarks | Implemented; Calendar deferred |
| 10 | Reviews and ratings | Location detail; Firestore reviews | Implemented |
| 11 | Filters | State and Discover pages | Implemented |
| 12 | AI assistant | `/chatbot` | Deferred pending a secure Firebase Cloud Function |
| 13 | Leaderboard | `/leaderboard`; Firestore activity aggregation | Implemented |
| 14 | Activity log and stats | `/activity-log`, `/insights`; Firestore and Firebase Storage | Implemented |
| 15 | Help / FAQ | `/help` | Implemented |
| 16 | PWA shell | Manifest and app metadata | Partial: service worker/offline caching not implemented |

## Roles and accounts

- **General user** — browse, filter, bookmark, review, log activities, earn badges, and view the leaderboard.
- **Local contributor** — submit a contributor profile for administrator verification.
- **Administrator** — manage locations, contributors, reviews, and roles through `/admin`.

The primary administrator is `shanyuew416@gmail.com`. Authentication uses real Firebase accounts; there are no built-in demo passwords or fake OTP codes. Firebase sends an email-verification link.

## Data and integrations

Firestore starts empty. The primary administrator can explicitly import curated `src/api/seedData.js` records into the real `Location` collection from `/admin`; nothing is loaded automatically. Live weather uses OpenWeatherMap.

AI and Google Calendar need Cloud Functions/server-side OAuth and secret management. Do not put AI keys, OAuth client secrets, or Firebase service-account credentials in browser code. The proposal’s exported diagrams remain the official design artefacts.
