import { municipalityPath } from '../profile/profile.ts';
import type { MunicipalityListing } from './indicator-layer.ts';

type Municipality = MunicipalityListing['municipalities'][number];
const normalized = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function searchMunicipalities(places: Municipality[], query: string): Municipality[] {
  const words = normalized(query).split(' ').filter(Boolean);
  if (!words.length) return [];
  return places.filter(place => words.every(word => normalized(`${place.name} ${place.uf}`).split(' ').some(part => part.startsWith(word)))).slice(0, 20);
}

/** Municipal documents take precedence over the legacy query-only selection. */
export function municipalityFromUrl(places: Municipality[], url: URL): Municipality | undefined {
  return places.find(place => municipalityPath(place) === url.pathname)
    ?? places.find(place => place.code === url.searchParams.get('municipio'));
}

/** Coordinate selection without binding history or the map engine to the profile view. */
export function createMunicipalityNavigation<T>(options: {
  places: Municipality[];
  getUrl(): URL;
  setUrl(url: URL): void;
  focus(place: Municipality): void;
  load(place: Municipality): Promise<T>;
  show(content: T): void;
  clear(): void;
}) {
  let request = 0;
  return {
    async select(place: Municipality, push = true) {
      const pending = ++request;
      options.focus(place);
      if (push) {
        const url = options.getUrl();
        url.pathname = municipalityPath(place);
        url.searchParams.delete('municipio');
        if (url.hash.startsWith('#tipo-')) url.hash = '';
        options.setUrl(url);
      }
      try {
        const content = await options.load(place);
        if (pending === request) options.show(content);
      } catch (error) {
        if (pending === request) throw error;
      }
    },
    close(push = true) {
      ++request;
      if (push) {
        const url = options.getUrl();
        url.pathname = '/';
        url.searchParams.delete('municipio');
        options.setUrl(url);
      }
      options.clear();
    },
    restore() {
      const url = options.getUrl();
      const place = municipalityFromUrl(options.places, url);
      return place ? this.select(place, false) : this.close(false);
    },
  };
}
