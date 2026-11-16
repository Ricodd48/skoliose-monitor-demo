import { fmtAngle, fmtDelta, fmtMonthLong } from '../domain/format';
import type { TrendSummary } from '../domain/trend';

const DELTA_COLOR = {
  ruecklaeufig: 'text-teal-700',
  stabil: 'text-sky-700',
  zunehmend: 'text-amber-700',
  offen: 'text-slate-400',
} as const;

/** Beginn / Aktuell / Veränderung – in zwei Größen für Ärzte- und Elternansicht */
export function StatTiles({ summary, large = false }: { summary: TrendSummary; large?: boolean }) {
  const { first, last, delta, kind } = summary;
  const num = large ? 'text-3xl sm:text-6xl' : 'text-2xl sm:text-4xl';
  const tile = `card min-w-0 ${large ? 'p-4 sm:p-6' : 'p-3.5 sm:p-5'}`;
  const label = `font-medium text-slate-500 ${large ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`;
  const sub = `mt-1 text-slate-500 ${large ? 'text-sm' : 'text-xs'}`;
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <div className={tile}>
        <div className={label}>Beginn</div>
        <div className={`mt-1 font-bold tracking-tight text-slate-900 tabular-nums ${num}`}>
          {first ? fmtAngle(first.angle) : '–'}
        </div>
        <div className={sub}>{first ? fmtMonthLong(first.date) : 'keine Messung'}</div>
      </div>
      <div className={tile}>
        <div className={label}>Aktuell</div>
        <div className={`mt-1 font-bold tracking-tight text-slate-900 tabular-nums ${num}`}>
          {last ? fmtAngle(last.angle) : '–'}
        </div>
        <div className={sub}>{last ? fmtMonthLong(last.date) : 'keine Messung'}</div>
      </div>
      <div className={tile}>
        <div className={label}>Veränderung</div>
        <div className={`mt-1 font-bold tracking-tight tabular-nums ${num} ${DELTA_COLOR[kind]}`}>
          {delta === undefined ? '–' : fmtDelta(delta)}
        </div>
        <div className={sub}>{delta === undefined ? 'ab der zweiten Messung' : 'seit Beginn'}</div>
      </div>
    </div>
  );
}
