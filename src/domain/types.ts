export type CurveRegion = 'thorakal' | 'thorakolumbal' | 'lumbal';
export type CurveSide = 'rechts' | 'links';
export type TreatmentKind = 'beobachtung' | 'korsett' | 'physio' | 'sonstiges';

/** Eine Wirbelsäulenkrümmung. Messungen werden immer genau einer Krümmung zugeordnet. */
export interface Curve {
  id: string;
  region: CurveRegion;
  side: CurveSide;
}

export interface Measurement {
  id: string;
  /** ISO-Datum JJJJ-MM-TT */
  date: string;
  curveId: string;
  /** Cobb-Winkel in Grad */
  angle: number;
  /** Röntgenaufnahme im Korsett – nicht mit Aufnahmen ohne Korsett vergleichbar */
  inBrace: boolean;
  /** Behandlung zum Zeitpunkt der Untersuchung */
  treatment: TreatmentKind;
  heightCm?: number;
  /** Risser-Stadium 0–5 */
  risser?: number;
  note?: string;
}

export interface GrowthMarker {
  from: string;
  to: string;
}

export interface Patient {
  id: string;
  /** Pseudonyme Kennung */
  code: string;
  /** Fiktiver Anzeigename */
  name: string;
  /** JJJJ-MM */
  birth: string;
  diagnosis: string;
  curves: Curve[];
  measurements: Measurement[];
  growth?: GrowthMarker[];
  /** Individuell von der Ärztin gesetzter Zielwinkel */
  targetAngle?: number;
}

/** Aus den Untersuchungen abgeleiteter Behandlungsabschnitt */
export interface TreatmentPhase {
  kind: TreatmentKind;
  from: string;
  to: string;
}
