import { readTrip, type SavedTrip } from './mobility';

export const favoritesKey = 'planaltina-private-favorites-v1';
const limit = 8;

export function readFavorites(raw: string | null): SavedTrip[] {
  try {
    if (!raw || raw.length > 20_000) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const result: SavedTrip[] = [];
    for (const value of parsed.slice(0, 50)) {
      const trip = readTrip(JSON.stringify(value));
      if (trip && !result.some(item => item.id === trip.id)) result.push(trip);
      if (result.length === limit) break;
    }
    return result;
  } catch { return []; }
}

export function saveFavorite(items: SavedTrip[], trip: SavedTrip): SavedTrip[] {
  return readFavorites(JSON.stringify([trip, ...items.filter(item => item.id !== trip.id)]));
}

/** Refuse writes when saved data cannot be safely represented by this version. */
export function readFavoritesForUpdate(raw: string | null): SavedTrip[] | null {
  if (raw === null) return [];
  if (raw.length > 20_000) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length > limit) return null;
    const result: SavedTrip[] = [];
    for (const value of parsed) {
      if (!value || typeof value !== 'object' || Array.isArray(value) ||
          Object.keys(value).some(key => key !== 'id' && key !== 'mode')) return null;
      const trip = readTrip(JSON.stringify(value));
      if (!trip || result.some(item => item.id === trip.id)) return null;
      result.push(trip);
    }
    return result;
  } catch { return null; }
}
