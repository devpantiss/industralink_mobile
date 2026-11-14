import * as Location from 'expo-location';

export type CityResult =
  | { ok: true; city: string }
  | { ok: false; reason: 'denied' | 'off' | 'unknown' };

/**
 * The city the phone is in right now: asks for location permission (while using the app),
 * takes a recent fix if there is one, otherwise a fresh one, and turns it into a city name.
 */
export async function getCurrentCity(): Promise<CityResult> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { ok: false, reason: 'denied' };
    if (!(await Location.hasServicesEnabledAsync())) return { ok: false, reason: 'off' };

    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000, requiredAccuracy: 5000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

    const [place] = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    const city = place?.city || place?.subregion || place?.district || place?.region;
    return city ? { ok: true, city } : { ok: false, reason: 'unknown' };
  } catch {
    return { ok: false, reason: 'unknown' };
  }
}
