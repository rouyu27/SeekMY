# Firebase setup

SeekMY now uses the Firebase adapter at `src/app/api/firebaseClient.ts`.

## Connected browser features
- Email/password sign in
- Registration with Firebase Authentication
- Verification email after registration
- Password reset email
- Session restoration when the app reloads
- Sign out
- Firestore entity adapter for `Location`, `Review`, `Bookmark`, `ActivityLog`, `Badge`, `Contributor`, and `User`
- Firebase Storage helper for activity-photo uploads

The Firebase values from the supplied `SEEKMY (3)` project are preserved in `.env.local`. `.env.local` is listed in `.gitignore`; do not commit it to a public repository.

If you need to configure another Firebase project, copy `.env.example` to `.env.local` and fill in:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_OPENWEATHER_API_KEY=
```

Enable Email/Password (and Google if you later expose Google sign-in in the mockup), create Firestore, and create Firebase Storage in the Firebase console.

## Important
The mockup keeps its existing local sample data for screens that have not yet been migrated to Firestore. The reusable Firebase entity adapter is included so those pages can be migrated incrementally without changing the design.
