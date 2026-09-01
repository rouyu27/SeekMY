# Firebase-first conversion

This version keeps the existing SeekMY UI but follows the Firebase pattern from the supplied AdminPanel example:

1. Read data with `firebaseClient.entities.<Collection>.list/filter()`.
2. Create/update/delete the Firestore document first.
3. Update React state only after Firebase succeeds.
4. User-owned data uses Firebase Auth UID through `created_by_id`.

## Firebase collections used

- `User` — profile and role
- `Location` — public outdoor places and `is_hidden_gem`
- `Review` — public reviews and moderation status
- `Bookmark` — private saved places
- `ActivityLog` — private activity history
- `Badge` — private badge records
- `Contributor` — contributor registration/application
- `LocationSubmission` — suggested places waiting for admin review
- `Announcement` — approval/rejection messages for users

## Firebase Storage folders

- `activity-photos/{uid}/...`
- `location-submissions/{uid}/...`
- `contributor-documents/{uid}/...`

## Important

Publish both `firestore.rules` and `storage.rules` in Firebase Console. The primary admin email in the rules is `shanyuew416@gmail.com`.
