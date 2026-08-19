# Login-gated personal pages

The following pages remain visible in the SeekMY navigation before login:
- Activity Log
- Saved / Bookmarks
- Contributor
- Insights

When a guest opens one of these pages, the page shows a Sign In screen instead of private user data.
After login, `App.tsx` loads `Bookmark` and `ActivityLog` records where `created_by_id` equals the current Firebase Authentication UID.

Saving a place also requires login. `firebaseClient.entities.Bookmark.create(...)` automatically writes `created_by_id` from the logged-in Firebase user.

Deploy/copy `firestore.rules` into Firebase Console > Firestore Database > Rules so private Bookmark, ActivityLog, and Badge records cannot be read by other users.
