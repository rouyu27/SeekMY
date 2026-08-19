# SeekMY Fullstack

SeekMY is organized into frontend and backend areas so each part of the system is easy to find.

## Project Structure

- `frontend/` - Vite React application, public assets, browser favicon, UI pages, and client API code.
- `backend/firebase/` - Firebase Hosting, Firestore, Storage, and project configuration.
- `backend/supabase/` - Supabase Edge Functions used for activity logs, reviews, leaderboard, weather, and AI guide APIs.
- `docs/` - Setup notes, module ownership, API/backend documentation, and import guides.

## Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
```

## Backend

Firebase rules and hosting config are in `backend/firebase/`.

Supabase Edge Functions are in `backend/supabase/functions/`.

See `docs/BACKEND_SETUP.md` for environment variables, deployment commands, and database notes.
