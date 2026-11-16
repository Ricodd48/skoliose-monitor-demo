import { useEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear, scaleTime } from 'd3-scale';
import { area, curveMonotoneX, line } from 'd3-shape';
import { REGION_PLAIN, TREATMENTS, UNCERTAINTY, ZONES } from '../../domain/config';
import { fmtAge, fmtAngle, fmtDate, fmtMonth, parseDate, toIso } from '../../domain/format';
import { curveColor, curveLabel } from '../../domain/labels';
import { byDate, derivePhases } from '../../domain/trend';
import type { Measurement, Patient } from '../../domain/types';

export interface CobbChartProps {
  patient: Patient;
  showZones?: boolean;
  showTarget?: boolean;
  showUncertainty?: boolean;
  xMode?: 'date' | 'age';
  /** 'parent' = reduzierte Darstellung ohne Fachdetails */
  variant?: 'doctor' | 'parent';
  height?: number;
}

const DAY = 24 * 3600 * 1000;
const AXIS = '#64748b';
const GRID = '#e2e8f0';

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function ageTicks(birth: string, from: Date, to: Date, maxCount: number) {
  const b = parseDate(`${birth}-15`);
  const out: { date: Date; label: string; whole: boolean }[] = [];
  for (let k = 0; k < 60; k++) {
    const date = new Date(b.getFullYear(), b.getMonth() + 6 * k, 15);
    if (date < from) continue;
    if (date > to) break;
    const whole = k % 2 === 0;
    out.push({ date, whole, label: whole ? `${k / 2} J.` : `${(k - 1) / 2}½ J.` });
  }
  return out.length > maxCount ? out.filter((t) => t.whole) : out;
}

export function CobbChart({
  patient,
  showZones = false,
  showTarget = false,
  showUncertainty = false,
  xMode = 'date',
  variant = 'doctor',
  height,
}: CobbChartProps) {
  const [ref, width] = useWidth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const parent = variant === 'parent';
  const H = height ?? (parent ? 440 : 420);
  const narrow = width < 520;
  // Mit Orientierungsbereichen: Beschriftung in einer Randspalte, damit sie keine Messwerte verdeckt
  const gutter = showZones ? (narrow ? 88 : 108) : 0;
  const m = { top: 30, right: (narrow ? 14 : 24) + gutter, bottom: 82, left: narrow ? 38 : 48 };
  const innerW = Math.max(0, width - m.left - m.right);
  const innerH = H - m.top - m.bottom;
  const fs = parent ? 14 : 12;

  const ms = useMemo(
    () => patient.measurements.filter((x) => !parent || !x.inBrace).sort(byDate),
    [patient.measurements, parent],
  );

  const model = useMemo(() => {
    const times = ms.map((x) => parseDate(x.date).getTime());
    const now = Date.now();
    const min = times.length ? Math.min(...times) : now - 90 * DAY;
    const max = times.length ? Math.max(...times) : now + 90 * DAY;
    const pad = Math.max((max - min) * 0.06, 25 * DAY);
    const d0 = new Date(min - pad);
    const d1 = new Date(max + pad);
    const maxAngle = Math.max(0, ...ms.map((x) => x.angle), showTarget ? (patient.targetAngle ?? 0) : 0);
    const yMax = Math.max(40, Math.ceil((maxAngle + 8) / 10) * 10);
    return { d0, d1, yMax };
  }, [ms, patient.targetAngle, showTarget]);

  const x = scaleTime().domain([model.d0, model.d1]).range([0, innerW]);
  const y = scaleLinear().domain([0, model.yMax]).range([innerH, 0]);
  const px = (mm: Measurement) => x(parseDate(mm.date));
  const py = (mm: Measurement) => y(mm.angle);

  const yTicks = y.ticks(Math.min(8, model.yMax / 10));
  const xTicks =
    xMode === 'age'
      ? ageTicks(patient.birth, model.d0, model.d1, Math.floor(innerW / 64))
      : x.ticks(Math.max(2, Math.floor(innerW / 88))).map((date) => ({ date, label: fmtMonth(date) }));

  const phases = derivePhases(ms, toIso(model.d1));
  const lineGen = line<Measurement>().x(px).y(py).curve(curveMonotoneX);
  const bandGen = area<Measurement>()
    .x(px)
    .y0((d) => y(Math.max(0, d.angle - UNCERTAINTY)))
    .y1((d) => y(Math.min(model.yMax, d.angle + UNCERTAINTY)))
    .curve(curveMonotoneX);

  const series = patient.curves.map((curve) => {
    const all = ms.filter((x) => x.curveId === curve.id);
    return {
      curve,
      color: curveColor(patient, curve.id),
      solid: all.filter((x) => !x.inBrace),
      brace: all.filter((x) => x.inBrace),
    };
  });

  const active = ms.find((x) => x.id === activeId);
  const activeCurve = active && patient.curves.find((c) => c.id === active.curveId);
  const hasBrace = series.some((s) => s.brace.length > 0);
  const target = showTarget ? patient.targetAngle : undefined;

  const summary = ms.length
    ? `Verlauf des Cobb-Winkels, ${ms.length} Messungen von ${fmtDate(ms[0].date)} bis ${fmtDate(ms[ms.length - 1].date)}.`
    : 'Noch keine Messungen vorhanden.';

  return (
    <div>
      <div ref={ref} className="relative" onMouseLeave={() => setActiveId(null)}>
        {width > 0 && (
          <svg
            viewBox={`0 0 ${width} ${H}`}
            width="100%"
            role="img"
            aria-label={summary}
            style={{ display: 'block', fontFamily: 'inherit' }}
          >
            <defs>
              <pattern id="growth-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="1.5" opacity="0.35" />
              </pattern>
              <clipPath id={`plot-${patient.id}`}>
                <rect x="0" y="0" width={innerW} height={innerH} />
              </clipPath>
            </defs>

            <g transform={`translate(${m.left},${m.top})`}>
              {/* Orientierungsbereiche */}
              {showZones &&
                ZONES.filter((z) => z.from < model.yMax).map((z) => {
                  const top = y(Math.min(z.to, model.yMax));
                  const h = y(z.from) - top;
                  return (
                    <g key={z.label}>
                      <rect x={0} y={top} width={innerW} height={h} fill={z.fill} />
                      <rect x={innerW} y={top} width={4} height={h} fill={z.text} opacity={0.35} />
                      {h > 14 && (
                        <text x={innerW + 12} y={top + h / 2} dy="0.35em" fontSize={narrow ? 10 : 11} fontWeight={600} fill={z.text}>
                          {z.label}
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Raster und Y-Achse */}
              {yTicks.map((t) => (
                <g key={t}>
                  <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} stroke={showZones ? '#cbd5e1' : GRID} strokeDasharray={t === 0 ? undefined : '2 4'} />
                  <text x={-10} y={y(t)} dy="0.32em" textAnchor="end" fontSize={fs} fill={AXIS}>
                    {t}°
                  </text>
                </g>
              ))}
              <text x={-m.left + 4} y={-14} fontSize={11} fontWeight={600} fill={AXIS}>
                Cobb-Winkel
              </text>

              {/* Wachstumsschub */}
              {!parent &&
                (patient.growth ?? []).map((g) => {
                  const gx0 = Math.max(0, x(parseDate(g.from)));
                  const gx1 = Math.min(innerW, x(parseDate(g.to)));
                  if (gx1 <= gx0) return null;
                  return (
                    <g key={g.from}>
                      <rect x={gx0} y={0} width={gx1 - gx0} height={innerH} fill="url(#growth-hatch)" />
                      {gx1 - gx0 > 96 && (
                        <text x={(gx0 + gx1) / 2} y={innerH - 8} textAnchor="middle" fontSize={11} fill="#64748b">
                          Wachstumsschub
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* X-Achse */}
              {xTicks.map((t) => (
                <g key={t.date.getTime()} transform={`translate(${x(t.date)},${innerH})`}>
                  <line y2={5} stroke="#94a3b8" />
                  <text y={20} textAnchor="middle" fontSize={fs} fill={AXIS}>
                    {t.label}
                  </text>
                </g>
              ))}

              {/* Ziellinie */}
              {target !== undefined && target <= model.yMax && (
                <g>
                  <line x1={0} x2={innerW} y1={y(target)} y2={y(target)} stroke="#0f766e" strokeWidth={1.5} strokeDasharray="6 5" />
                  <text x={6} y={y(target) - 6} fontSize={11} fontWeight={600} fill="#0f766e">
                    Ziel {fmtAngle(target)}
                  </text>
                </g>
              )}

              {/* Verlaufslinien */}
              <g clipPath={`url(#plot-${patient.id})`}>
                {series.map((s) => (
                  <g key={s.curve.id}>
                    {showUncertainty && s.solid.length > 1 && (
                      <path d={bandGen(s.solid) ?? undefined} fill={s.color} opacity={0.12} />
                    )}
                    {s.solid.length > 1 && (
                      <path
                        d={lineGen(s.solid) ?? undefined}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={parent ? 3.5 : 2.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </g>
                ))}
              </g>

              {/* Messpunkte */}
              {series.map((s) => {
                const labelAll = parent && s.solid.length <= 8 && !narrow;
                return (
                  <g key={s.curve.id}>
                    {showUncertainty && s.solid.length === 1 && (
                      <line
                        x1={px(s.solid[0])}
                        x2={px(s.solid[0])}
                        y1={y(s.solid[0].angle + UNCERTAINTY)}
                        y2={y(Math.max(0, s.solid[0].angle - UNCERTAINTY))}
                        stroke={s.color}
                        strokeWidth={8}
                        strokeLinecap="round"
                        opacity={0.15}
                      />
                    )}
                    {[...s.solid, ...s.brace].map((mm) => {
                      const isLast = !mm.inBrace && mm === s.solid[s.solid.length - 1];
                      const isFirst = !mm.inBrace && mm === s.solid[0];
                      const isActive = mm.id === activeId;
                      const showLabel = !mm.inBrace && (labelAll || isLast || (parent && isFirst));
                      const r = (parent ? 6.5 : 5.5) + (isActive ? 1.5 : 0);
                      return (
                        <g
                          key={mm.id}
                          transform={`translate(${px(mm)},${py(mm)})`}
                          tabIndex={0}
                          role="button"
                          aria-label={`${fmtDate(mm.date)}: ${fmtAngle(mm.angle)}${mm.inBrace ? ', Aufnahme im Korsett' : ''}`}
                          style={{ cursor: 'pointer', outline: 'none' }}
                          onMouseEnter={() => setActiveId(mm.id)}
                          onFocus={() => setActiveId(mm.id)}
                          onBlur={() => setActiveId(null)}
                          onClick={() => setActiveId(mm.id)}
                        >
                          <circle r={16} fill="transparent" />
                          {isActive && <circle r={r + 5} fill={s.color} opacity={0.15} />}
                          <circle
                            r={r}
                            fill={mm.inBrace ? '#ffffff' : s.color}
                            stroke={mm.inBrace ? s.color : '#ffffff'}
                            strokeWidth={2.5}
                          />
                          {showLabel && (
                            <text
                              y={-14}
                              textAnchor="middle"
                              fontSize={parent ? 16 : 13}
                              fontWeight={700}
                              fill={s.color}
                              stroke="#ffffff"
                              strokeWidth={4}
                              paintOrder="stroke"
                            >
                              {fmtAngle(mm.angle)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Behandlungsabschnitte */}
              {phases.map((p) => {
                const x0 = Math.max(0, x(parseDate(p.from)));
                const x1 = Math.min(innerW, x(parseDate(p.to)));
                const w = x1 - x0;
                if (w <= 1) return null;
                const t = TREATMENTS[p.kind];
                return (
                  <g key={p.from} transform={`translate(${x0},${innerH + 40})`}>
                    <rect width={Math.max(0, w - 2)} height={24} rx={6} fill={t.fill} />
                    {w > 104 && (
                      <text x={10} y={12} dy="0.35em" fontSize={11.5} fontWeight={600} fill={t.text}>
                        {t.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {ms.length === 0 && (
                <text x={innerW / 2} y={innerH / 2} textAnchor="middle" fontSize={14} fill={AXIS}>
                  Noch keine Messungen – erfassen Sie die erste Untersuchung.
                </text>
              )}
            </g>
          </svg>
        )}

        {/* Tooltip */}
        {active && activeCurve && (
          <div
            className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg print:hidden"
            style={{
              left: Math.min(Math.max(m.left + px(active), 120), Math.max(120, width - 120)),
              top: m.top + py(active) + 18,
            }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-slate-500">{fmtDate(active.date)}</span>
              <span className="text-lg font-bold tabular-nums" style={{ color: curveColor(patient, active.curveId) }}>
                {fmtAngle(active.angle)}
              </span>
            </div>
            <div className="mt-1 text-slate-700">
              {parent ? REGION_PLAIN[activeCurve.region] : curveLabel(activeCurve)}
            </div>
            {!parent && (
              <dl className="mt-2 space-y-0.5 text-xs text-slate-600">
                <div>Alter: {fmtAge(patient.birth, active.date)}</div>
                <div>{active.inBrace ? 'Aufnahme im Korsett' : 'Aufnahme ohne Korsett'}</div>
                <div>Behandlung: {TREATMENTS[active.treatment].label}</div>
                {active.heightCm !== undefined && <div>Größe: {active.heightCm.toLocaleString('de-DE')} cm</div>}
                {active.risser !== undefined && <div>Risser: {active.risser}</div>}
                {active.note && <div className="mt-1.5 border-t border-slate-100 pt-1.5 text-slate-700">{active.note}</div>}
              </dl>
            )}
          </div>
        )}
      </div>

      {/* Legende */}
      <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-xs text-slate-600">
        {series.map((s) => (
          <span key={s.curve.id} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {parent ? REGION_PLAIN[s.curve.region] : curveLabel(s.curve)}
          </span>
        ))}
        {!parent && hasBrace && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-teal-700 bg-white" />
            Aufnahme im Korsett (nicht im Vergleich)
          </span>
        )}
        {showUncertainty && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-sm bg-teal-700/15" />
            Messunsicherheit ±{UNCERTAINTY}°
          </span>
        )}
        {showZones && <span className="text-slate-500">Farbige Bereiche: nur grobe Orientierung, keine Therapieempfehlung</span>}
      </div>
    </div>
  );
}
