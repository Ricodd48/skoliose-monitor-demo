import type { CurveRegion, TreatmentKind } from './types';

/**
 * Messunsicherheit des Cobb-Winkels in Grad. Veränderungen unterhalb dieser
 * Schwelle werden als „stabil“ eingestuft. Von der Klinik anzupassen.
 */
export const UNCERTAINTY = 5;

/** Plausibler Eingabebereich für den Cobb-Winkel */
export const ANGLE_MIN = 0;
export const ANGLE_MAX = 120;

/**
 * Grobe Orientierungsbereiche – ausdrücklich keine Therapieempfehlung.
 * Grenzen sind hier zentral konfigurierbar.
 */
export interface Zone {
  from: number;
  to: number;
  label: string;
  fill: string;
  text: string;
}

export const ZONES: Zone[] = [
  { from: 0, to: 10, label: 'unter 10°', fill: '#f0fdfa', text: '#0f766e' },
  { from: 10, to: 25, label: 'Beobachten', fill: '#f1f5f9', text: '#475569' },
  { from: 25, to: 45, label: 'Korsett-Bereich', fill: '#fef3c7', text: '#92400e' },
  { from: 45, to: Infinity, label: 'OP-Prüfung', fill: '#ffe4e6', text: '#9f1239' },
];

export const TREATMENTS: Record<TreatmentKind, { label: string; fill: string; text: string }> = {
  beobachtung: { label: 'Beobachtung', fill: '#e2e8f0', text: '#334155' },
  korsett: { label: 'Korsetttherapie', fill: '#99f6e4', text: '#115e59' },
  physio: { label: 'Physiotherapie', fill: '#c7d2fe', text: '#3730a3' },
  sonstiges: { label: 'Andere Behandlung', fill: '#fde68a', text: '#92400e' },
};

export const TREATMENT_ORDER: TreatmentKind[] = ['beobachtung', 'korsett', 'physio', 'sonstiges'];

export const REGION_LABEL: Record<CurveRegion, string> = {
  thorakal: 'Thorakal (Brustwirbelsäule)',
  thorakolumbal: 'Thorakolumbal',
  lumbal: 'Lumbal (Lendenwirbelsäule)',
};

export const REGION_SHORT: Record<CurveRegion, string> = {
  thorakal: 'Thorakal',
  thorakolumbal: 'Thorakolumbal',
  lumbal: 'Lumbal',
};

/** Verständliche Bezeichnung für die Elternansicht */
export const REGION_PLAIN: Record<CurveRegion, string> = {
  thorakal: 'Brustwirbelsäule',
  thorakolumbal: 'Übergang Brust-/Lendenwirbelsäule',
  lumbal: 'Lendenwirbelsäule',
};

/** Linienfarben je Krümmung (in Reihenfolge der Krümmungen des Patienten) */
export const CURVE_COLORS = ['#0f766e', '#4f46e5', '#b45309'];
