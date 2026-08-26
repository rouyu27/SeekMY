# SeekMY Firebase data setup

The app no longer uses `src/app/data/`. That folder has been deleted.

## Firebase-backed collections used by the app

- `User` — login profile, admin role, leaderboard totals
- `Location` — homepage search, Explore, Map, AI recommendations
- `Bookmark` — signed-in user's saved locations
- `ActivityLog` — signed-in user's activity history
- `Badge` — achievements shown on Leaderboard
- `Review` — Firebase adapter is available, but the existing Location/Admin review UI still contains its older local review helper and can be migrated separately
- `Contributor` — Firebase adapter is available, but the existing contributor workflow still contains its older local submission helper and can be migrated separately

## Important Location fields

Each document in `Location` should contain fields used by the UI, for example:

```
name: "Broga Hill Trail"
state: "Selangor"
stateCode: "SLG"
activity: "Hiking"
difficulty: "Easy"
distance: "4.2 km"
duration: "2–3 hrs"
rating: 4.7
reviews: 851
badge: "Family Favourite"
weather: "Cloudy"
temp: 27
humidity: 80
wind: 6
color: "#2d6a4f"
emoji: "🌄"
description: "..."
facilities: ["Parking", "Food stalls"]
bestMonths: "Year-round"
accessibility: "Beginner-friendly"
tags: ["Family Friendly", "Beginner"]
budget: "Free"
lat: 2.939
lng: 101.901
source: "OpenStreetMap"
sourceId: "way/123456789"
sourceUrl: "https://www.openstreetmap.org/way/123456789"
status: "active"
importedAt: "2026-08-17T00:00:00.000Z"
lastVerifiedAt: "2026-08-17T00:00:00.000Z"
```

`lat` and `lng` must be Firestore numbers, not strings. Both are required before a
location is published. Older `latitude`/`longitude` fields are accepted temporarily
but should be migrated to `lat`/`lng`.

Imported descriptions, difficulty, duration, accessibility, facilities and safety
information must remain unverified until reviewed by an administrator or local
contributor. Never invent these values from the place category alone.

## Firestore rules

Your rules must allow public reads for `Location`, signed-in reads for `User`, and owner create/update/delete rules for `Bookmark`, `ActivityLog`, and `Badge`, matching the `created_by_id` field inserted by `firebaseClient.ts`.

## Run

After extracting:

```
npm install
npm run dev
```

If Firebase is empty, the app will intentionally show empty Firebase states rather than falling back to mock `src/data` arrays.
