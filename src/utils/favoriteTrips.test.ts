import { describe, expect, it } from 'vitest';
import { readFavorites, saveFavorite } from './favoriteTrips';
import type { SavedTrip } from './mobility';

describe('favoritos locais', () => {
  it('tolera dados corrompidos e descarta modos ou IDs inválidos', () => {
    expect(readFavorites('{')).toEqual([]);
    expect(readFavorites(JSON.stringify([{ id: 'a', mode: 'walking', origin: 'privada' }, { id: '', mode: 'driving' }, { id: 'b', mode: 'bus' }]))).toEqual([{ id: 'a', mode: 'walking' }]);
  });
  it('limita a oito destinos, sem duplicar um destino ao mudar o modo', () => {
    let saved: SavedTrip[] = [];
    for (let i = 0; i < 12; i++) saved = saveFavorite(saved, { id: `cnes-${i}`, mode: 'driving' });
    expect(saved).toHaveLength(8);
    saved = saveFavorite(saved, { id: 'cnes-11', mode: 'walking' });
    expect(saved).toHaveLength(8);
    expect(saved[0]).toEqual({ id: 'cnes-11', mode: 'walking' });
  });
});
