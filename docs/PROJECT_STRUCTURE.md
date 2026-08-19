# SeekMY Final Project Structure & Code Ownership

```text
SeekMY_final/
│
├── .env.local
│   ← MAIN / TEAM SHARED
│
├── .gitignore
│   ← MAIN / TEAM SHARED
│
├── package.json
│   ← MAIN / TEAM SHARED
│
├── package-lock.json
│   ← MAIN / TEAM SHARED
│
├── tsconfig.json
│   ← MAIN / TEAM SHARED
│
├── vite.config.ts
│   ← MAIN / TEAM SHARED
│
├── firestore.rules
│   ← Wong Yue Shan
│      [Firebase Setup / Firestore Security]
│
├── storage.rules
│   ← Wong Yue Shan
│      [Firebase Setup / Storage Security]
│
├── public/
│   ← MAIN / TEAM SHARED
│
└── src/
    │
    ├── main.tsx
    │   ← MAIN / TEAM SHARED
    │
    ├── firebase.ts
    │   ← Wong Yue Shan
    │      [Firebase Setup]
    │
    └── app/
        │
        ├── App.tsx
        │   ← Wong Yue Shan
        │      [Weather / Contributor / Admin Integration]
        │   ← Wilson Choong Wei Shan
        │      [Account / Activity Filter / AI Integration]
        │   ← Low Jun Feng
        │      [Home / Badge Integration]
        │   ← Lim Rou Yu
        │      [Location Detail / Map Integration]
        │   ← Lim Tze Xin
        │      [Bookmark / Review & Rating Integration]
        │   ← Fong Xin Tong
        │      [Leaderboard / Activity Log / Stats Integration]
        │
        ├── api/
        │   └── firebaseClient.ts
        │       ← Wong Yue Shan
        │          [Admin / Contributor / Location Management]
        │       ← Wilson Choong Wei Shan
        │          [Account / Authentication]
        │       ← Low Jun Feng
        │          [Home / Badge Data]
        │       ← Lim Rou Yu
        │          [Location / Map Data]
        │       ← Lim Tze Xin
        │          [Bookmark / Review & Rating Data]
        │       ← Fong Xin Tong
        │          [Activity Log / Leaderboard / Stats Data]
        │
        ├── lib/
        │   ├── types.ts
        │   │   ← MAIN / TEAM SHARED
        │   ├── weather.ts
        │   │   ← Wong Yue Shan [WEATHER MODULE]
        │   ├── mapGeocoding.ts
        │   │   ← Lim Rou Yu [MAP MODULE]
        │   └── badges.ts
        │       ← Low Jun Feng [BADGE ACHIEVEMENT SYSTEM]
        │
        ├── pages/
        │   ├── HomePage.tsx
        │   │   ← Low Jun Feng [HOME MODULE]
        │   ├── AccountPage.tsx
        │   │   ← Wilson Choong Wei Shan [ACCOUNT MODULE]
        │   ├── AIPage.tsx
        │   │   ← Wilson Choong Wei Shan [AI OUTDOOR ASSISTANT CHATBOT]
        │   ├── ExplorePage.tsx
        │   │   ← Wilson Choong Wei Shan [ACTIVITY FILTER MODULE]
        │   ├── MapPage.tsx
        │   │   ← Lim Rou Yu [MAP MODULE]
        │   ├── LocationPage.tsx
        │   │   ← Lim Rou Yu [LOCATION DETAIL MODULE]
        │   │   ← Wong Yue Shan [WEATHER SECTION]
        │   │   ← Lim Tze Xin [BOOKMARK / REVIEW & RATING SECTION]
        │   │   ← Fong Xin Tong [ACTIVITY LOG INTEGRATION]
        │   ├── BookmarksPage.tsx
        │   │   ← Lim Tze Xin [BOOKMARK MODULE]
        │   ├── LogPage.tsx
        │   │   ← Fong Xin Tong [ACTIVITY LOG]
        │   ├── InsightsPage.tsx
        │   │   ← Fong Xin Tong [PERSONAL STATS DASHBOARD]
        │   ├── LeaderboardPage.tsx
        │   │   ← Fong Xin Tong [COMMUNITY LEADERBOARD & RANKING]
        │   ├── ContributorPage.tsx
        │   │   ← Wong Yue Shan [LOCAL CONTRIBUTOR PORTAL]
        │   ├── SuggestLocationPage.tsx
        │   │   ← Wong Yue Shan [LOCAL CONTRIBUTOR PORTAL]
        │   └── AdminPage.tsx
        │       ← Wong Yue Shan [ADMIN PANEL]
        │
        └── components/
            ├── LocationCard.tsx
            │   ← Lim Rou Yu [LOCATION INFORMATION / NAVIGATION]
            │   ← Lim Tze Xin [BOOKMARK FUNCTION]
            ├── AuthModal.tsx
            │   ← Wilson Choong Wei Shan [ACCOUNT / AUTHENTICATION]
            ├── Navigation.tsx
            │   ← MAIN / TEAM SHARED
            └── ui/
                ← MAIN / TEAM SHARED [COMMON UI COMPONENTS]
```

## Member Module Ownership

1. **WONG YUE SHAN**
   - Weather Module
   - Local Contributor Portal
   - Admin Panel
   - Firebase Setup

2. **WILSON CHOONG WEI SHAN**
   - Account Module
   - Activity Filter Module
   - AI Outdoor Assistant Chatbot

3. **LOW JUN FENG**
   - Home Module
   - Badge Achievement System

4. **LIM ROU YU**
   - Location Detail Module
   - Map Module

5. **LIM TZE XIN**
   - Bookmark Module
   - User Review & Rating Module

6. **FONG XIN TONG**
   - Community Leaderboard & Ranking Module
   - Activity Log & Personal Stats Dashboard

## Shared Files

- `App.tsx` is a shared integration file covering all six members.
- `firebaseClient.ts` is a shared Firebase backend file covering all six members.
- `LocationPage.tsx` is shared by Lim Rou Yu, Wong Yue Shan, Lim Tze Xin, and Fong Xin Tong.
- `LocationCard.tsx` is shared by Lim Rou Yu and Lim Tze Xin.
- Common project configuration, common UI foundation, navigation, shared types, and entry files are marked `MAIN / TEAM SHARED`.
