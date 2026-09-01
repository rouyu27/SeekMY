# SeekMY backend setup

SeekMY uses a hybrid backend:

- Firebase Authentication for login.
- Firestore for app records such as users, locations, bookmarks, contributors, submissions and announcements.
- Firebase Hosting for the built frontend.
- Supabase Storage for uploaded activity photos, location photos and contributor documents.
- Supabase Edge Functions for protected backend logic.

Firebase Cloud Functions are not used by the active frontend.

## Supabase Edge Functions

The active backend endpoints live in `supabase/functions/seekmy-backend/index.ts`:

- `getWeather` - proxies OpenWeatherMap so the API key stays server-side.
- `getReviews` - loads approved reviews for a location.
- `getLeaderboard` - computes weekly/monthly leaderboard entries from Supabase activity rows.
- `getMyData` - loads the signed-in user's activities and badges.
- `createActivity` - validates and stores an activity log.
- `deleteActivity` - deletes the user's activity and recalculates stats/badges.
- `submitReview` - requires a prior logged activity before reviewing a location.
- `reportReview` - flags a review for moderation.
- `getAdminReviews` - admin-only review moderation list.
- `moderateReview` - admin-only review approve/remove action.
- `signContributorDocument` - admin-only signed URL for private contributor documents.

The AI guide lives in `supabase/functions/chat-with-guide/index.ts`.

## First-time setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Configure Firebase:

   ```sh
   firebase login
   firebase use --add
   ```

3. Apply the Supabase migrations. They create the activity, review, badge and stats tables plus the storage buckets.

   ```sh
   supabase db push
   ```

4. Add the required Supabase secrets:

   ```sh
   npx supabase secrets set FIREBASE_WEB_API_KEY="your-firebase-web-api-key"
   npx supabase secrets set FIREBASE_PROJECT_ID="your-firebase-project-id"
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
   npx supabase secrets set OPENWEATHER_API_KEY="your-openweather-key"
   ```

5. Deploy Supabase Edge Functions:

   ```sh
   npm run deploy:backend
   npm run deploy:chatbot
   ```

6. Deploy Firebase Firestore rules and Hosting:

   ```sh
   npm run deploy
   ```

## Local development

Run the frontend locally:

```sh
npm run dev
```

The local app still calls the deployed Supabase Edge Functions unless you run and configure Supabase locally.

## Important

Deploy `seekmy-backend` with `--no-verify-jwt` because it receives Firebase ID tokens rather than Supabase Auth tokens. The function validates Firebase tokens itself before protected actions.

The `SUPABASE_SERVICE_ROLE_KEY` secret is required because the backend tables use RLS and do not allow direct browser access. Do not put this key in `.env.local` or any frontend file.

Backend-owned activities, badges, reviews, statistics and leaderboard records live in RLS-protected Supabase PostgreSQL tables. Activity and submission photos are limited to 2 MB; contributor documents are private and limited to 5 MB.
