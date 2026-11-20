import { municipalityPath } from '../profile/profile.ts';
import type { MunicipalityListing } from './indicator-layer.ts';

type Municipality = MunicipalityListing['municipalities'][number];
const normalized = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function searchMunicipalities(places: Municipality[], query: string): Municipality[] {
  const words = normalized(query).split(' ').filter(Boolean);
  if (!words.length) return [];
  return places.filter(place => words.every(word => normalized(`${place.name} ${place.uf}`).split(' ').some(part => part.startsWith(word)))).slice(0, 20);
}

export function searchStatusText(found: number): string {
  if (!found) return 'Nenhum município encontrado.';
  return found === 1 ? '1 município encontrado.' : `${found} municípios encontrados.`;
}

/** Municipal documents take precedence over the legacy query-only selection. */
export function municipalityFromUrl(places: Municipality[], url: URL): Municipality | undefined {
  return places.find(place => municipalityPath(place) === url.pathname)
    ?? places.find(place => place.code === url.searchParams.get('municipio'));
}
