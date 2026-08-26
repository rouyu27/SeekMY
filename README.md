# SeekMY

SeekMY is a React/Vite outdoor-discovery app for Malaysia, aligned with the Visit Malaysia 2026 proposal. Firebase provides authentication, Firestore data, and activity-photo storage; OpenWeatherMap provides live weather data.

## Quick start

1. Copy `.env.example` to `.env.local` and add the Firebase web configuration and OpenWeatherMap API key.
2. Follow `FIREBASE_SETUP.md` to enable Firebase Authentication, create Firestore and Storage, and publish the documented rules.
3. Run `npm install` and `npm run dev`, then open <http://localhost:5173>.

`.env.local` is ignored by Git and must not be committed.

## Initial data

Firestore starts empty. Register or sign in with `shanyuew416@gmail.com`, open `/admin`, and select **Import Starter Locations**. This explicit, idempotent action creates missing `Location` documents in Firestore; the app does not auto-seed data or use browser storage as a database.

## Features

- Firebase email/password and Google authentication, email verification, and password reset
- Activity discovery by state, type, difficulty, and accessibility filters
- Map view, location detail, and live OpenWeatherMap conditions/forecast
- Firestore-backed bookmarks, reviews, activity logs, badges, contributors, users, and leaderboard
- Firebase Storage uploads for activity photos
- Administrator tools for locations, contributors, reviews, and user roles

The AI chatbot and Google Calendar integration remain unavailable until secure Firebase Cloud Functions and server-managed secrets are added.

## PWA status

The project includes a web app manifest, but no service worker yet. It is not fully offline-capable.

## Tech

- React 18, Vite, Tailwind CSS, Radix UI
- React Router and TanStack Query
- Firebase Authentication, Cloud Firestore, and Cloud Storage
- OpenWeatherMap API

Project-owned images belong in `public/images/` and are served at `/images/filename.jpg`.
