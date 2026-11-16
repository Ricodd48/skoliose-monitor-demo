export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayIso(): string {
  return toIso(new Date());
}

const DATE_FMT = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const MONTH_FMT = new Intl.DateTimeFormat('de-DE', { month: 'short', year: '2-digit' });
const LONG_FMT = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

export const fmtDate = (iso: string) => DATE_FMT.format(parseDate(iso));
export const fmtMonth = (date: Date) => MONTH_FMT.format(date).replace('.', '');
export const fmtMonthLong = (iso: string) => LONG_FMT.format(parseDate(iso));

/** Alter in Jahren (mit Nachkommastellen) zum Datum; birth = JJJJ-MM */
export function ageAt(birth: string, iso: string): number {
  const b = parseDate(`${birth}-15`);
  const d = parseDate(iso);
  return (d.getTime() - b.getTime()) / (365.25 * 24 * 3600 * 1000);
}

export function fmtAge(birth: string, iso: string): string {
  return `${Math.floor(ageAt(birth, iso))} J.`;
}

export function fmtAngle(angle: number): string {
  return `${angle.toLocaleString('de-DE', { maximumFractionDigits: 1 })}°`;
}

/** Vorzeichenbehaftete Differenz mit typografischem Minus */
export function fmtDelta(delta: number): string {
  const abs = Math.abs(delta).toLocaleString('de-DE', { maximumFractionDigits: 1 });
  if (delta === 0) return '±0°';
  return `${delta < 0 ? '−' : '+'}${abs}°`;
}
