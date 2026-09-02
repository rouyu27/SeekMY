# SeekMY

SeekMY is a Malaysian outdoor discovery web application that helps users explore outdoor destinations, track activities, submit location suggestions, read reviews, earn badges, and receive profile announcements. The system includes user, contributor, and administrator workflows for managing outdoor location data and community activity.

Live site: https://seekmy-integration.web.app

## Features

- Explore outdoor locations across Malaysia
- Search and filter by state, activity, difficulty, and location details
- Interactive map for discovering locations
- Location detail pages with photos, weather, cost range, facilities, accessibility, reviews, and activity information
- User activity log with required photo upload
- Admin approval/rejection workflow for activity logs
- Review and rating system after approved activity participation
- Bookmark and saved location management
- Badge achievement system
- Profile announcements and unread notification badge
- Contributor registration and location submission workflow
- Admin dashboard for managing users, locations, contributors, submissions, reviews, badges, announcements, and activity logs

## User Roles

### Guest

Guests can browse public outdoor locations, explore the map, and view general location information.

### Registered User

Registered users can save locations, log outdoor activities, upload activity photos, receive announcements, earn badges, and write reviews after their activity is approved.

### Contributor

Contributors can register for contributor access, submit new outdoor locations, update editable submissions, upload location photos, and track approval status.

### Administrator

Administrators can manage platform records, approve or reject contributor submissions, moderate reviews, approve or reject activity logs, manage badge definitions, create announcements, and manage users.

## Core System Logic

### Activity Log Approval

Users must upload at least one photo before submitting an activity log.

```text
User submits activity log
-> Activity is saved as Pending
-> Admin reviews the activity
-> Admin approves or rejects
-> User receives announcement
-> Approved activity counts toward stats, badges, leaderboard, and review access
```

### Location Submission Approval

Contributor location submissions are reviewed by administrators before becoming public locations.

```text
Contributor submits location
-> Submission is saved as Pending
-> Admin reviews details and photo
-> Admin approves or rejects
-> Contributor receives announcement
-> Approved location appears in Explore, Map, and Location pages
```

### Announcement Notification

Users receive announcements for important updates such as approval, rejection, badge achievement, or admin notices. Unread announcements are shown with a red notification badge in the profile area.

## Tech Stack

- React
- TypeScript
- Vite
- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- Firebase Hosting
- Supabase Edge Functions
- Supabase Database
- Tailwind CSS
- Leaflet / React Leaflet
- Lucide React Icons

## Project Structure

```text
SeekMY/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── firebaseClient.ts
│   │   ├── components/
│   │   ├── lib/
│   │   └── pages/
│   ├── assets/
│   ├── firebase.ts
│   ├── main.tsx
│   └── supabase.ts
├── public/
├── supabase/
│   ├── functions/
│   │   ├── seekmy-backend/
│   │   └── chat-with-guide/
│   ├── migrations/
│   ├── backend_schema.sql
│   └── storage_setup.sql
├── imports/
├── guidelines/
├── firebase.json
├── firestore.rules
├── storage.rules
├── package.json
└── README.md
```

## Important Folders

- `src/app/pages/` contains main application pages such as Home, Explore, Map, Location, Account, Contributor, Admin, Activity Log, Leaderboard, and Insights.
- `src/app/components/` contains reusable UI and feature components.
- `src/app/lib/` contains shared types, constants, helpers, badge logic, weather logic, and map geocoding logic.
- `src/app/api/firebaseClient.ts` contains Firebase and backend API integration.
- `supabase/functions/` contains Supabase Edge Functions used for backend logic.
- `supabase/migrations/` contains database migration files.
- `public/` contains static assets, icons, manifest, service worker, and public data.

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
.env.local
```

Required environment variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Run the development server:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

## Firebase Deployment

Deploy hosting and Firestore rules:

```bash
firebase deploy --only firestore,hosting
```

Deploy hosting only:

```bash
firebase deploy --only hosting
```

## Supabase Deployment

Link the Supabase project:

```bash
npx supabase link --project-ref <project-ref>
```

Push database migrations:

```bash
npx supabase db push --include-all
```

Deploy backend function:

```bash
npx supabase functions deploy seekmy-backend --no-verify-jwt
```

Deploy AI guide function:

```bash
npx supabase functions deploy chat-with-guide --no-verify-jwt
```

## Main Commands

```bash
npm install
npm run dev
npm run build
firebase deploy --only hosting
npx supabase db push --include-all
npx supabase functions deploy seekmy-backend --no-verify-jwt
```

## Team Module Ownership

### Wong Yue Shan

- Admin Panel
- Contributor Portal
- Weather Module
- Firebase Setup

### Wilson Choong Wei Shan

- Account Module
- Authentication
- Activity Filter
- AI Outdoor Assistant

### Low Jun Feng

- Home Module
- Badge Achievement System

### Lim Rou Yu

- Location Detail Module
- Map Module

### Lim Tze Xin

- Bookmark Module
- Review and Rating Module

### Fong Xin Tong

- Activity Log
- Personal Stats Dashboard
- Community Leaderboard

## Notes

- Firebase is used for authentication, Firestore records, storage rules, and hosting.
- Supabase Edge Functions are used for backend actions such as activity logs, reviews, leaderboard, badges, weather, shared bookmarks, and AI guide logic.
- Activity logs require admin approval before they affect user statistics.
- Contributor location submissions require admin approval before they become public.
- Announcements are used to notify users about approvals, rejections, achievements, and platform notices.
