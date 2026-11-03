import type { IndicatorLayer, MunicipalityIndicator, TrendClass, UfQuality } from '../map/indicator-layer';

export interface SeriesPoint {
  year: number;
  value: number | null;
  without_treatment_info: number | null;
  provisional: boolean;
}

export interface TreatmentProfile extends Pick<IndicatorLayer, 'period' | 'source' | 'has_status' | 'reference'> {
  quality: UfQuality;
  uf_trend: TrendClass | null;
  municipalities: Record<string, MunicipalityIndicator & { series_id: string | null }>;
  series: Record<string, SeriesPoint[]>;
}

export interface UfProfile {
  uf: string;
  indicators: { within_60_days: Record<string, TreatmentProfile> };
}

export function municipalityPath(municipality: { code: string; name: string }): string {
  const name = municipality.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `/municipio/${municipality.code}-${name}/`;
}
