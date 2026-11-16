import { CURVE_COLORS, REGION_SHORT } from './config';
import type { Curve, Patient } from './types';

export const curveLabel = (c: Curve) => `${REGION_SHORT[c.region]}, ${c.side}konvex`;

export const curveColor = (patient: Patient, curveId: string) => {
  const i = patient.curves.findIndex((c) => c.id === curveId);
  return CURVE_COLORS[(i < 0 ? 0 : i) % CURVE_COLORS.length];
};
