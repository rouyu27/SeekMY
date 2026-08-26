# SeekMY System Architecture

## 1. Purpose

SeekMY is a responsive web application for discovering outdoor activities in Malaysia. It supports general users, local contributor applicants, and administrators. The current prototype uses a React single-page application, Firebase managed services, OpenWeatherMap, and OpenStreetMap tiles through Leaflet.

This document describes the architecture implemented in the current source code. Features that require future server-side services are identified separately.

## 2. Architectural style

SeekMY follows a three-layer client-server architecture:

1. **Presentation layer** - React pages and reusable components receive user input and display results.
2. **Application layer** - React hooks, contexts, route guards, validation, aggregation, filtering, and the Firebase adapter implement application behaviour.
3. **Data and service layer** - Firebase Authentication, Cloud Firestore, Firebase Storage, OpenWeatherMap, and OpenStreetMap provide persistent data and external services.

```mermaid
flowchart TB
    subgraph Client["Presentation and application layer - browser"]
        UI["React pages and components"]
        Router["React Router"]
        State["React state and TanStack Query"]
        AuthContext["Authentication context and route guards"]
        Adapter["firebaseClient service adapter"]

        UI --> Router
        UI --> State
        Router --> AuthContext
        State --> Adapter
        AuthContext --> Adapter
    end

    subgraph Firebase["Firebase managed services"]
        FAuth["Firebase Authentication"]
        Firestore["Cloud Firestore"]
        Storage["Firebase Storage"]
    end

    subgraph External["External services"]
        Weather["OpenWeatherMap REST API"]
        Tiles["OpenStreetMap tile service"]
        Directions["External directions link"]
    end

    Adapter -->|"register, login, profile"| FAuth
    Adapter -->|"CRUD and queries"| Firestore
    Adapter -->|"activity photos"| Storage
    Adapter -->|"current weather and forecast"| Weather
    UI -->|"Leaflet map tiles"| Tiles
    UI -->|"navigation request"| Directions
```

## 3. Logical layers

### 3.1 Presentation layer

The presentation layer is located mainly in `src/pages`, `src/components`, and `src/components/ui`.

- `App.jsx` defines the route hierarchy.
- `Layout.jsx` provides shared navigation and page structure.
- Page components implement each functional module.
- Tailwind CSS and Radix-based components provide responsive styling and interaction patterns.
- Recharts displays activity and insight charts.
- React Leaflet displays location markers.

### 3.2 Application and business layer

Application behaviour is distributed across:

- `AuthContext.jsx` - authentication state and user profile loading.
- `ProtectedRoute.jsx` - authenticated-route enforcement.
- `AdminRoute.jsx` - administrator-route enforcement.
- Page-level handlers - validation, filters, statistics, badge evaluation, and user actions.
- `firebaseClient.js` - a common interface for authentication, CRUD operations, storage uploads, weather requests, and integration placeholders.
- `malaysia-data.js` - Malaysian states, activity types, difficulty metadata, and badge definitions.

### 3.3 Data and integration layer

Cloud Firestore stores seven application collections:

- `User`
- `Location`
- `Review`
- `Bookmark`
- `ActivityLog`
- `Badge`
- `Contributor`

Firebase Authentication stores credentials and identity-provider information. Firebase Storage stores uploaded activity photographs under `activity-photos/{userId}/...`.

## 4. Route architecture

```mermaid
flowchart LR
    Public["Public routes"] --> Home["Home / state explorer"]
    Public --> Discovery["Discover, state and map"]
    Public --> Detail["Location detail"]
    Public --> Contributor["Contributor directory/application"]
    Public --> Leaderboard["Leaderboard and insights"]
    Public --> Help["Help"]
    Public --> Auth["Login, register and password recovery"]

    Protected["Authenticated routes"] --> Activity["Activity log and badges"]
    Protected --> Bookmarks["Bookmarks"]
    Protected --> Profile["Profile"]

    Admin["Administrator route"] --> Panel["Admin panel"]

    AuthGuard["ProtectedRoute"] --> Protected
    AdminGuard["AdminRoute"] --> Admin
```

## 5. Main runtime flows

### 5.1 Authentication

```mermaid
sequenceDiagram
    actor User
    participant UI as React UI
    participant Client as firebaseClient
    participant Auth as Firebase Authentication
    participant DB as Cloud Firestore

    User->>UI: Register or sign in
    UI->>Client: Authentication request
    Client->>Auth: Firebase authentication operation
    Auth-->>Client: Authenticated Firebase user
    Client->>DB: Read or create User/{uid}
    DB-->>Client: Application profile and role
    Client-->>UI: Authenticated profile
```

### 5.2 Location discovery

The client queries active `Location` documents, applies state and activity filters, and renders cards or Leaflet markers. Selecting a location opens `/location/:id`, which loads the location, active reviews, bookmarks, verified contributors, and weather data.

### 5.3 Activity and badge processing

An authenticated user creates or updates an `ActivityLog`. The client recalculates totals and evaluates local badge definitions. Newly satisfied badges are written to the `Badge` collection. This is client-side prototype logic rather than a trusted server-side award process.

## 6. Security boundaries

- User passwords are handled only by Firebase Authentication.
- `.env.local` is excluded from Git.
- Authentication and administrator routes are guarded in the UI.
- Firestore and Storage rules must enforce ownership and roles; client-side route guards alone are not security controls.
- AI provider secrets and OAuth client secrets must never be placed in browser code.
- The OpenWeatherMap browser key should be domain-restricted and usage-limited where supported.
- Administrator assignment should eventually use trusted server-side claims instead of relying only on an email comparison.

## 7. Deployment view

```mermaid
flowchart LR
    Dev["Developer workstation"] -->|"npm run build"| Dist["Static dist output"]
    Dist --> Hosting["Static web hosting over HTTPS"]
    Hosting --> Browser["User browser"]
    Browser --> Firebase["Firebase services"]
    Browser --> Weather["OpenWeatherMap"]
    Browser --> OSM["OpenStreetMap tiles"]
```

The application is built by Vite into static assets. The repository includes a web app manifest, but a service worker and offline caching are not currently implemented; therefore, the application is not yet a complete offline-capable PWA.

## 8. Planned server-side extensions

The following integrations require a trusted backend, such as Firebase Cloud Functions:

- AI Outdoor Assistant requests and provider-secret management.
- Google Calendar OAuth and token storage.
- Trusted badge awarding and leaderboard calculations.
- Contributor notifications and advanced approval workflows.
- Scheduled weekly/monthly leaderboard snapshots.
- Stronger administrator role management using custom claims.

