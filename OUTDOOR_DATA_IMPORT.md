# SeekMY outdoor-location import

## Objective

Populate all Malaysian states and federal territories without manually typing each
place while keeping coordinates, weather, source attribution and quality control
consistent.

## Published record

Firestore `Location` is the application's published record. External APIs discover
candidates; the browser must not query a places service on every page load.

Each published record requires `name`, `state`, `stateCode`, `address`, numeric
`lat` and `lng`, `activity`, `source`, `sourceId`, `sourceUrl`, `status`,
`importedAt` and `lastVerifiedAt`.

## Import pipeline

1. An administrator starts an import for exactly one state or federal territory.
2. A server-side job queries OpenStreetMap Overpass for parks, peaks, trails,
   campsites, caves, beaches, waterfalls and recreation areas.
3. Use node coordinates directly. For ways and relations, request their centre or
   calculate a representative point.
4. Normalize the state and map OSM tags to a candidate activity.
5. Reject results outside Malaysia or the selected state boundary.
6. Deduplicate by `source + sourceId`, then flag similar name/state pairs.
7. Write to `LocationImportCandidate`, never directly to public `Location`.
8. An administrator reviews the name, activity, coordinates and source link.
9. Approval copies the candidate to `Location`; rejection retains an audit record.

## No-billing student workflow

Generate a reviewed JSON batch locally (no API key or service account required):

```powershell
npm run import:locations -- --state "Selangor" --category waterfall
```

Optional exact Mapillary photos can be resolved when OSM already contains a
`mapillary=*` image reference. Create a free Mapillary application, then set its
client token only in the current terminal:

```powershell
$env:MAPILLARY_TOKEN="your-client-token"
npm run import:locations -- --state "Terengganu" --category all
```

The importer does not automatically select arbitrary nearby Mapillary imagery.
If the OSM feature has no explicit Mapillary reference, the normal
Wikimedia/Wikidata checks and admin/contributor photo workflow remain in use.
Never store the token in a `VITE_` variable or in generated JSON.

Supported categories are `park`, `peak`, `waterfall`, `beach`, `cave`,
`climbing_site`, `camp_site`, `dive_site`, `viewpoint`, `nature_reserve`,
`hiking_route`, `cycling_route`, `running_route` and `water_sports`. Use `--category all` to run all
categories sequentially, or `--state all` for every Malaysian state and federal
territory. Start with one state/category because public Overpass servers can be
busy. The generated file is written under `imports/`.

Sign in to SeekMY as an administrator, open **Admin → Outdoor Import**, choose the
generated JSON, preview its validation result, and select **Bulk upload
candidates**. The existing authenticated Firebase web session performs the write;
no Cloud Function, Blaze plan, or service-account private key is used.

Use candidate statuses `pending`, `approved`, `rejected` and `needs_review`.
Difficulty, duration, accessibility, facilities, fees, safety, best months and an
editorial description must not be presented as verified unless reviewed.

Run state-sized batches with throttling and retry/backoff. Do not use public
Nominatim for bulk geocoding; Overpass results already contain geometry.

## Attribution and updates

Display `© OpenStreetMap contributors` and retain each source URL. Review ODbL
obligations before publishing an extracted database. During refresh, do not silently
overwrite administrator or community corrections; send conflicts for review.

## Map and weather contract

```text
Firestore Location.lat/lng
        |-- Leaflet marker
        `-- weather current + forecast request
```

The map works without browser geolocation permission. Device location may be added
later only as an explicit optional `Use my location` action.

## Production security

Overpass imports and authenticated weather calls should run in Firebase Functions.
Store credentials in Firebase Secret Manager, validate admin authorization, cache
weather responses, and apply quotas. Never treat a `VITE_` value as secret.
