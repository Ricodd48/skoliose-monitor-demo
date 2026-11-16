import { scaleLinear } from 'd3-scale';
import { curveMonotoneX, line } from 'd3-shape';
import { parseDate } from '../../domain/format';
import type { Measurement } from '../../domain/types';

/** Kleine Verlaufsvorschau für die Patientenkarte */
export function Sparkline({ points, color }: { points: Measurement[]; color: string }) {
  const W = 120;
  const H = 40;
  if (points.length === 0) return <div style={{ width: W, height: H }} />;
  const t = points.map((p) => parseDate(p.date).getTime());
  const a = points.map((p) => p.angle);
  const lo = Math.min(...a);
  const hi = Math.max(...a);
  const padY = Math.max(3, (hi - lo) * 0.2);
  const x = scaleLinear().domain([Math.min(...t), Math.max(...t) || 1]).range([5, W - 5]);
  const y = scaleLinear().domain([lo - padY, hi + padY]).range([H - 5, 5]);
  const single = points.length === 1;
  const px = (i: number) => (single ? W - 5 : x(t[i]));
  const d = line<number>()
    .x((_, i) => px(i))
    .y((v) => y(v))
    .curve(curveMonotoneX)(a);
  const last = points.length - 1;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {!single && <path d={d ?? undefined} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />}
      <circle cx={px(last)} cy={y(a[last])} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} />
    </svg>
  );
}
