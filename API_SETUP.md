# SeekMY API setup

## Location coordinates (required)

Every published `Location` document must store WGS84 numeric fields named `lat`
and `lng`. The Map and Weather modules use the same pair, so weather is requested
for the outdoor site rather than a state or town centre. `latitude` and `longitude`
are accepted only as migration aliases.

The map never requires the visitor's device location. It starts over Malaysia and
automatically fits the visible location markers.

## OpenWeatherMap
The live weather integration is in:

`src/app/lib/weather.ts`

The Spark-plan build calls the Supabase `seekmy-backend` Edge Function, which reads
`OPENWEATHER_API_KEY` from Supabase secrets and proxies OpenWeather responses.

Location detail pages call OpenWeatherMap's current-weather and 5-day/3-hour
forecast endpoints with the selected location's stored coordinates. Legacy records
without coordinates temporarily fall back to name geocoding; migrate these records
instead of relying on this fallback. A failed request is shown as unavailable; the
production UI does not label demo data as live weather.

This keeps the key out of the browser bundle and does not require Firebase Blaze.

## MET Malaysia

MET Malaysia is the recommended second source for official Malaysian general
forecasts and warnings: https://metapi2.met.gov.my/

- OpenWeatherMap: coordinate-based current conditions and short forecast.
- MET Malaysia: official general forecast and active warning/advisory data.

Do not merge a state-level forecast into a location-level reading without showing
its coverage area and source timestamp.

## Outdoor-place discovery

Use OpenStreetMap Overpass only in an administrator-run import job. Do not call it
when a visitor opens Discover or Map. See `OUTDOOR_DATA_IMPORT.md`.

## Firebase
The Firebase API/data adapter is in:

`src/app/api/firebaseClient.ts`

See `FIREBASE_SETUP.md` for the Firebase variables and connected features.
