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
