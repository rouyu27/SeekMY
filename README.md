# SeekMY

SeekMY is a Malaysian outdoor discovery web app built with Vite, React, Firebase, and Supabase Edge Functions.

## Running The Code

```bash
npm install
npm run dev
npm run build
```

## Project Structure

- `src/` - React application, pages, UI components, client API code, and assets.
- `public/` - static web assets, icons, manifest, service worker, and state images.
- `supabase/` - Edge Functions, database schema, migrations, and storage setup.
- `firebase.json`, `firestore.rules`, `storage.rules` - Firebase Hosting and security configuration.
- `imports/` - outdoor location import datasets.
- `guidelines/` - project guideline notes.

The project uses Firebase for Auth, Firestore, Storage rules, and Hosting. Supabase Edge Functions handle activity logs, reviews, leaderboard, weather, shared bookmarks, and AI backend logic. See `BACKEND_SETUP.md` for setup and deployment instructions.
