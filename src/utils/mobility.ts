export type TravelMode = 'driving' | 'walking' | 'bicycling';
export type SavedTrip = { id: string; mode: TravelMode };
export const tripKey = 'planaltina-private-trip-v1';

export type ExternalMapsApp = 'google' | 'waze' | 'apple' | 'organic';

/** Links gratuitos: o app externo resolve a origem; nunca usamos GPS pessoal no URL.
 * Organic Maps abre o ponto no app, não presume uma rota calculada.
 */
export function routeUrl(
  destination: { lat: number; lng: number; name?: string },
  mode: TravelMode,
  provider: ExternalMapsApp = 'google'
): string {
  if (!Number.isFinite(destination.lat) || !Number.isFinite(destination.lng) ||
      Math.abs(destination.lat) > 90 || Math.abs(destination.lng) > 180 ||
      (destination.lat === 0 && destination.lng === 0)) throw new Error('Destino inválido');
  const coordinates = `${destination.lat},${destination.lng}`;
  if (provider === 'waze') {
    if (mode !== 'driving') throw new Error('O Waze é oferecido aqui somente para trajetos de carro.');
    const url = new URL('https://waze.com/ul');
    url.search = new URLSearchParams({ ll: coordinates, navigate: 'yes' }).toString();
    return url.href;
  }
  if (provider === 'apple') {
    const url = new URL('https://maps.apple.com/');
    const params = new URLSearchParams({ daddr: coordinates });
    if (mode !== 'bicycling') params.set('dirflg', mode === 'walking' ? 'w' : 'd');
    url.search = params.toString();
    return url.href;
  }
  if (provider === 'organic') {
    const url = new URL('https://omaps.app/map');
    url.search = new URLSearchParams({
      v: '1', ll: coordinates,
      ...(destination.name ? { n: destination.name.slice(0, 100) } : {}),
    }).toString();
    return url.href;
  }
  if (provider !== 'google') throw new Error('Provedor de mapas indisponível.');
  const url = new URL('https://www.google.com/maps/dir/');
  url.search = new URLSearchParams({ api: '1', destination: coordinates, travelmode: mode }).toString();
  return url.href;
}

/** Cidades com ligações regionais documentadas pela ANTT/AGR.
 * Estes itens são destinos externos para mapas de terceiros, não
 * traçados offline, confirmação de linha ativa ou horários de ônibus.
 * Os endereços completos distinguem Planaltina/GO de Planaltina/DF.
 */
export const REGIONAL_DESTINATIONS = [
  { id: 'planaltina-df', name: 'Planaltina (DF)', address: 'Planaltina, Distrito Federal, Brasil' },
  { id: 'sobradinho-df', name: 'Sobradinho (DF)', address: 'Sobradinho, Distrito Federal, Brasil' },
  { id: 'brasilia-df', name: 'Brasília (DF)', address: 'Brasília, Distrito Federal, Brasil' },
  { id: 'formosa-go', name: 'Formosa (GO)', address: 'Formosa, Goiás, Brasil' },
] as const;
export type RegionalDestinationId = typeof REGIONAL_DESTINATIONS[number]['id'];

export function regionalRouteUrl(destinationId: RegionalDestinationId, mode: TravelMode): string {
  const destination = REGIONAL_DESTINATIONS.find(point => point.id === destinationId);
  if (!destination) throw new Error('Destino regional indisponível.');
  const url = new URL('https://www.google.com/maps/dir/');
  url.search = new URLSearchParams({
    api: '1', destination: destination.address, travelmode: mode,
  }).toString();
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
