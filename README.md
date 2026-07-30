# SeekMY

Progressive web app to discover outdoor activities across Malaysia (Visit Malaysia 2026).

**This version runs fully offline / without Base44.** Data and auth use browser `localStorage`.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@seekmy.local` | `admin123` | Admin |
| `demo@seekmy.local` | `demo123` | User |

Register also works: use OTP **`123456`** when prompted.

## Features

- Activity discovery by state / type / difficulty
- Map view, location detail, weather (mock)
- Bookmarks, activity log, badges, leaderboard
- Contributor portal & admin panel
- AI insights (local heuristic recommendations)

## Tech

- React 18 + Vite + Tailwind + Radix UI
- React Router, TanStack Query
- Local mock API (`src/api/base44Client.js`) replacing Base44 SDK

## Reset local data

In the browser console:

```js
Object.keys(localStorage).filter(k => k.startsWith('seekmy_')).forEach(k => localStorage.removeItem(k));
location.reload();
```

## Custom images

Put your photos in **`public/images/`**.

| Use | Filenames |
|-----|-----------|
| Home hero slider | `hero-1.jpg` … `hero-6.jpg` |
| Logo | `logo.png` |
| Locations | see `public/images/README.txt` |

Code references them as `/images/filename.jpg` (Vite serves `public/` at the site root).
