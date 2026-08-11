# Firebase and API setup

1. Create a Firebase project and register a Web app. Copy its configuration values into a new `.env.local` file based on `.env.example`.
2. In **Authentication > Sign-in method**, enable **Email/Password** and **Google**. Add your deployed domain and `localhost` to **Authentication > Settings > Authorized domains**.
3. Create a **Cloud Firestore** database and a **Storage** bucket. Use the rules below before testing with real users.
4. Create an OpenWeatherMap API key, add it as `VITE_OPENWEATHER_API_KEY`, and restrict it to your development/deployed site in the OpenWeatherMap dashboard.
5. Restart `npm run dev` after changing `.env.local`.
6. Sign in as the primary administrator, open `/admin`, and select **Import Starter Locations**. This explicit action writes missing curated records to Firestore; the app never seeds them automatically.

## Firestore rules

Paste these in **Firestore Database > Rules**. The primary administrator is `shanyuew416@gmail.com`; they can promote other user profiles in the Admin Panel.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function admin() {
      return signedIn() && get(/databases/$(database)/documents/User/$(request.auth.uid)).data.role == 'admin';
    }
    function owner() { return signedIn() && resource.data.created_by_id == request.auth.uid; }
    function primaryAdmin() { return signedIn() && request.auth.token.email == 'shanyuew416@gmail.com'; }

    match /User/{userId} {
      allow read: if signedIn();
      allow create: if signedIn() && userId == request.auth.uid && (request.resource.data.role == 'user' || (primaryAdmin() && request.resource.data.role == 'admin'));
      allow update: if admin() || (userId == request.auth.uid && request.resource.data.role == resource.data.role);
      allow delete: if admin() || userId == request.auth.uid;
    }
    match /Location/{id} { allow read: if true; allow write: if admin(); }
    match /Review/{id}, /Bookmark/{id}, /ActivityLog/{id}, /Badge/{id}, /Contributor/{id} {
      allow read: if true;
      allow create: if signedIn() && request.resource.data.created_by_id == request.auth.uid;
      allow update, delete: if admin() || owner();
    }
  }
}
```

## Storage rules

Use paths like `activity-photos/{uid}/{fileName}` when you add Firebase Storage uploads. Only a signed-in owner should read/write their own folder.

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /activity-photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Keep secrets server-side

Do not put an OpenAI/AI provider key or Google Calendar OAuth client secret in `.env.local`: Vite exposes `VITE_*` variables to the browser. Implement those features with Firebase Cloud Functions and store secrets using Firebase/Google Cloud secret management.
