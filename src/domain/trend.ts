import { UNCERTAINTY } from './config';
import type { Measurement, TreatmentPhase } from './types';

export type TrendKind = 'ruecklaeufig' | 'stabil' | 'zunehmend' | 'offen';

export interface TrendSummary {
  kind: TrendKind;
  /** Erste vergleichbare Messung (ohne Korsett) */
  first?: Measurement;
  /** Letzte vergleichbare Messung (ohne Korsett) */
  last?: Measurement;
  /** last − first in Grad; nur bei mindestens zwei vergleichbaren Messungen */
  delta?: number;
  /** Anzahl vergleichbarer Messungen */
  count: number;
  /** Anzahl ausgeklammerter Aufnahmen im Korsett */
  excludedInBrace: number;
}

export const byDate = (a: Measurement, b: Measurement) => a.date.localeCompare(b.date);

export function curveMeasurements(measurements: Measurement[], curveId: string): Measurement[] {
  return measurements.filter((m) => m.curveId === curveId).sort(byDate);
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Fasst den Verlauf einer Krümmung zusammen. Aufnahmen im Korsett zeigen
 * systematisch kleinere Winkel und werden deshalb nicht in den Vergleich einbezogen.
 */
export function summarize(
  measurements: Measurement[],
  curveId: string,
  uncertainty: number = UNCERTAINTY,
): TrendSummary {
  const all = curveMeasurements(measurements, curveId);
  const comparable = all.filter((m) => !m.inBrace);
  const base = {
    first: comparable[0],
    last: comparable[comparable.length - 1],
    count: comparable.length,
    excludedInBrace: all.length - comparable.length,
  };
  if (comparable.length < 2) return { kind: 'offen', ...base };

  const delta = round1(base.last.angle - base.first.angle);
  const kind: TrendKind =
    delta <= -uncertainty ? 'ruecklaeufig' : delta >= uncertainty ? 'zunehmend' : 'stabil';
  return { kind, delta, ...base };
}

/**
 * Leitet Behandlungsabschnitte aus den Untersuchungen ab: Ein Abschnitt beginnt
 * mit der ersten Untersuchung, bei der eine (andere) Behandlung dokumentiert ist.
 */
export function derivePhases(measurements: Measurement[], end: string): TreatmentPhase[] {
  const sorted = [...measurements].sort(byDate);
  const phases: TreatmentPhase[] = [];
  for (const m of sorted) {
    const current = phases[phases.length - 1];
    if (current && current.kind === m.treatment) continue;
    if (current) current.to = m.date;
    phases.push({ kind: m.treatment, from: m.date, to: end });
  }
  const last = phases[phases.length - 1];
  if (last && last.to < last.from) last.to = last.from;
  return phases;
}

export const TREND_LABEL: Record<TrendKind, string> = {
  ruecklaeufig: 'Rückläufiger Winkel',
  stabil: 'Stabiler Verlauf',
  zunehmend: 'Zunehmender Winkel',
  offen: 'Noch kein Verlauf',
};

/** Erklärung in Alltagssprache für die Elternansicht */
export function parentText(s: TrendSummary, uncertainty: number = UNCERTAINTY): { title: string; text: string } {
  const abs = s.delta === undefined ? '' : Math.abs(s.delta).toLocaleString('de-DE', { maximumFractionDigits: 1 });
  switch (s.kind) {
    case 'ruecklaeufig':
      return {
        title: 'Der gemessene Winkel hat abgenommen.',
        text: `Der letzte Messwert liegt ${abs}° unter dem Ausgangswert. Ob das eine nachhaltige Verbesserung bedeutet, beurteilt die Ärztin.`,
      };
    case 'zunehmend':
      return {
        title: 'Der gemessene Winkel hat zugenommen.',
        text: `Der letzte Messwert liegt ${abs}° über dem Ausgangswert. Was das für die weitere Behandlung bedeutet, bespricht die Ärztin mit Ihnen.`,
      };
    case 'stabil':
      return {
        title: 'Der gemessene Winkel ist stabil geblieben.',
        text: `Der Unterschied zum Ausgangswert beträgt ${abs}°. Das liegt innerhalb der üblichen Messungenauigkeit von etwa ±${uncertainty}°.`,
      };
    default:
      return {
        title: 'Es liegt noch kein Verlauf vor.',
        text: 'Ein Verlauf lässt sich zeigen, sobald mindestens zwei vergleichbare Messungen vorhanden sind.',
      };
  }
}
