export type TravelMode = 'driving' | 'walking' | 'bicycling';
export type SavedTrip = { id: string; mode: TravelMode };
export const tripKey = 'planaltina-private-trip-v1';

export function routeUrl(destination: { lat: number; lng: number }, mode: TravelMode): string {
  if (!Number.isFinite(destination.lat) || !Number.isFinite(destination.lng) ||
      Math.abs(destination.lat) > 90 || Math.abs(destination.lng) > 180 ||
      (destination.lat === 0 && destination.lng === 0)) throw new Error('Destino inválido');
  const url = new URL('https://www.google.com/maps/dir/');
  url.search = new URLSearchParams({ api: '1', destination: `${destination.lat},${destination.lng}`, travelmode: mode }).toString();
  return url.href;
}

export function estimateFuelCost(km: number, kmPerLiter: number, price: number): number | null {
  if (![km, kmPerLiter, price].every(value => Number.isFinite(value) && value > 0)) return null;
  const result = km / kmPerLiter * price;
  return Number.isFinite(result) ? result : null;
}

export function readTrip(raw: string | null): SavedTrip | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    return value && typeof value.id === 'string' && value.id.length > 0 && value.id.length <= 200 &&
      ['driving', 'walking', 'bicycling'].includes(value.mode)
      ? { id: value.id, mode: value.mode } : null;
  } catch { return null; }
}
