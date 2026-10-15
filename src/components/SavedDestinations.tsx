import type { MapPoint } from '../types';
import type { SavedTrip } from '../utils/mobility';

export function SavedDestinations({ favorites, points, onChoose, onRemove }: {
  favorites: SavedTrip[]; points: MapPoint[]; onChoose: (trip: SavedTrip) => void; onRemove: (id: string) => void;
}) {
  if (!favorites.length) return null;
  const available = favorites.flatMap(trip => {
    const point = points.find(item => item.id === trip.id);
    return point ? [{ trip, point }] : [];
  });
  return <details className="my-3 rounded-lg border border-neutral-400 p-3">
    <summary className="min-h-11 cursor-pointer py-2 font-semibold">Destinos salvos ({available.length})</summary>
    <p className="text-xs">Até oito destinos, somente neste navegador. Nenhuma origem ou localização pessoal é guardada.</p>
    {available.length < favorites.length && <p className="my-2 text-xs">{favorites.length - available.length} destino(s) sem confirmação no catálogo atual. A navegação fica indisponível até voltarem à base verificada.</p>}
    <ul>{favorites.map(trip => {
      const item = available.find(value => value.trip.id === trip.id);
      return <li key={trip.id} className="mt-2 flex items-center gap-2 border-t border-neutral-300 pt-2">
        {item ? <button type="button" aria-label={`Usar destino salvo ${item.point.name}`} className="min-h-11 min-w-0 flex-1 rounded-lg p-2 text-left text-sm underline" onClick={() => onChoose(trip)}>{item.point.name}</button> : <span className="min-w-0 flex-1 text-sm">Destino indisponível • {trip.id}</span>}
        <button type="button" className="min-h-11 rounded-lg border border-neutral-400 px-2 text-sm" aria-label={`Remover destino salvo ${item?.point.name ?? trip.id}`} onClick={() => onRemove(trip.id)}>Remover</button>
      </li>;
    })}</ul>
  </details>;
}
