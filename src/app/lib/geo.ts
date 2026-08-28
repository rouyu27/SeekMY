// FILE PRIMARY OWNER: FONG XIN TONG | Activity Log Module — GPS check-in verification
// GitHub target: feature/fong-xin-tong -> Pull Request -> main
//==================== FongXinTong Part - Activity Log GPS Verification ====================

/**
 * Great-circle distance between two lat/lng points, in kilometers.
 * Standard Haversine formula.
 */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface DevicePosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

/**
 * Wraps the browser Geolocation API in a Promise with clear, user-facing
 * error messages instead of raw PositionError codes.
 */
export function getCurrentPosition(): Promise<DevicePosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("This browser doesn't support location — try Chrome or Edge on a device with GPS or Wi-Fi location enabled."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location permission was denied. Allow it in your browser's site settings to log an activity — this app checks you're actually at the location."));
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject(new Error("Couldn't determine your location. Check that GPS/location services are turned on."));
        } else {
          reject(new Error("Location request timed out — try again."));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
//==================== FongXinTong END - Activity Log GPS Verification ====================
