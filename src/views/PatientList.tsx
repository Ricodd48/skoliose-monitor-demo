import { useMemo, useState } from 'react';
import { Sparkline } from '../components/chart/Sparkline';
import { TrendBadge } from '../components/TrendBadge';
import { REGION_SHORT, TREATMENTS } from '../domain/config';
import { fmtAge, fmtAngle, fmtDate, todayIso } from '../domain/format';
import { curveColor } from '../domain/labels';
import { byDate, summarize, TREND_LABEL, type TrendKind } from '../domain/trend';
import type { Patient } from '../domain/types';

type SortKey = 'name' | 'lastDesc' | 'lastAsc' | 'angleDesc' | 'trend' | 'ageAsc';
type TrendFilter = 'alle' | TrendKind;

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'lastDesc', label: 'Letzte Untersuchung (neueste zuerst)' },
  { key: 'lastAsc', label: 'Letzte Untersuchung (älteste zuerst)' },
  { key: 'angleDesc', label: 'Aktueller Winkel (größter zuerst)' },
  { key: 'trend', label: 'Verlauf (zunehmend zuerst)' },
  { key: 'ageAsc', label: 'Alter (jüngste zuerst)' },
];

const TREND_RANK: Record<TrendKind, number> = { zunehmend: 0, stabil: 1, ruecklaeufig: 2, offen: 3 };
const FILTERS: TrendFilter[] = ['alle', 'zunehmend', 'stabil', 'ruecklaeufig', 'offen'];

// Suche und Sortierung bleiben erhalten, wenn man aus einer Patientenakte zurückkehrt
const saved: { q: string; sort: SortKey; trend: TrendFilter } = { q: '', sort: 'name', trend: 'alle' };

function buildRow(p: Patient) {
  const curves = p.curves.map((curve) => ({
    curve,
    summary: summarize(p.measurements, curve.id),
    points: p.measurements.filter((m) => m.curveId === curve.id && !m.inBrace).sort(byDate),
  }));
  const last = [...p.measurements].sort(byDate).pop();
  return {
    p,
    curves,
    last,
    kinds: curves.map((c) => c.summary.kind),
    maxAngle: Math.max(-1, ...curves.map((c) => c.summary.last?.angle ?? -1)),
    rank: Math.min(...curves.map((c) => TREND_RANK[c.summary.kind])),
    haystack: `${p.name} ${p.code} ${p.diagnosis}`.toLowerCase(),
  };
}

type Row = ReturnType<typeof buildRow>;

const byName = (a: Row, b: Row) => a.p.name.localeCompare(b.p.name, 'de');

const COMPARE: Record<SortKey, (a: Row, b: Row) => number> = {
  name: byName,
  lastDesc: (a, b) => (b.last?.date ?? '').localeCompare(a.last?.date ?? '') || byName(a, b),
  lastAsc: (a, b) => (a.last?.date ?? '9').localeCompare(b.last?.date ?? '9') || byName(a, b),
  angleDesc: (a, b) => b.maxAngle - a.maxAngle || byName(a, b),
  trend: (a, b) => a.rank - b.rank || b.maxAngle - a.maxAngle || byName(a, b),
  ageAsc: (a, b) => b.p.birth.localeCompare(a.p.birth) || byName(a, b),
};

const GRID = 'md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)_9.5rem_1rem] md:items-center md:gap-x-5';

export function PatientList({ patients }: { patients: Patient[] }) {
  const [q, setQ] = useState(saved.q);
  const [sort, setSort] = useState<SortKey>(saved.sort);
  const [trend, setTrend] = useState<TrendFilter>(saved.trend);
  saved.q = q;
  saved.sort = sort;
  saved.trend = trend;

  const rows = useMemo(() => patients.map(buildRow), [patients]);
  const counts = useMemo(() => {
    const c: Record<TrendFilter, number> = { alle: rows.length, zunehmend: 0, stabil: 0, ruecklaeufig: 0, offen: 0 };
    for (const r of rows) for (const k of new Set(r.kinds)) c[k]++;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return rows
      .filter((r) => (trend === 'alle' || r.kinds.includes(trend)) && terms.every((t) => r.haystack.includes(t)))
      .sort(COMPARE[sort]);
  }, [rows, q, sort, trend]);

  const filtered = q.trim() !== '' || trend !== 'alle';

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patientenübersicht</h1>
        <p className="mt-1 text-slate-600">
          {filtered ? `${visible.length} von ${rows.length}` : rows.length} fiktive Patientinnen und Patienten
        </p>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <svg viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="input pl-10"
              placeholder="Suchen nach Name, Kennung oder Diagnose"
              aria-label="Patienten suchen"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Sortieren nach</span>
            <select className="input w-auto min-w-0 flex-1 sm:flex-none" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Nach Verlauf filtern">
          {FILTERS.map((f) => (
            <label key={f} className="chip py-1 text-xs">
              <input type="radio" name="trend-filter" className="sr-only" checked={trend === f} onChange={() => setTrend(f)} />
              {f === 'alle' ? 'Alle' : TREND_LABEL[f]}
              <span className="text-slate-400 tabular-nums">{counts[f]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className={`hidden border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-semibold tracking-wide text-slate-500 uppercase ${GRID}`}>
          <span>Patient/in</span>
          <span>Krümmung · aktueller Winkel · Verlauf</span>
          <span>Letzte Untersuchung</span>
          <span />
        </div>

        {visible.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-700">Keine Treffer für die aktuelle Suche.</p>
            <button
              type="button"
              className="btn btn-secondary mt-4"
              onClick={() => {
                setQ('');
                setTrend('alle');
              }}
            >
              Suche zurücksetzen
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((r) => (
              <li key={r.p.id}>
                <PatientRow row={r} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PatientRow({ row }: { row: Row }) {
  const { p, curves, last } = row;
  return (
    <a
      href={`#/patient/${p.id}`}
      className={`group block space-y-3 px-5 py-3.5 transition-colors hover:bg-teal-50/60 focus-visible:bg-teal-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700 md:space-y-0 ${GRID}`}
    >
      <div className="min-w-0">
        <div className="truncate font-semibold text-slate-900">{p.name}</div>
        <div className="text-sm text-slate-500">
          {p.code} · {fmtAge(p.birth, todayIso())}
        </div>
        <div className="truncate text-xs text-slate-500" title={p.diagnosis}>
          {p.diagnosis}
        </div>
      </div>

      <div className="min-w-0 space-y-1.5">
        {curves.map(({ curve, summary, points }) => {
          const color = curveColor(p, curve.id);
          return (
            <div key={curve.id} className="flex items-center gap-3">
              <span className="flex w-28 shrink-0 items-center gap-1.5 text-sm text-slate-600 lg:w-40">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                <span className="truncate">
                  {REGION_SHORT[curve.region]}
                  <span className="hidden lg:inline">, {curve.side}</span>
                </span>
              </span>
              <span className="w-14 shrink-0 text-right text-lg font-bold text-slate-900 tabular-nums">
                {summary.last ? fmtAngle(summary.last.angle) : '–'}
              </span>
              <span className="w-44 shrink-0">
                <TrendBadge kind={summary.kind} />
              </span>
              <span className="hidden xl:block">
                <Sparkline points={points} color={color} width={96} height={28} />
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-sm">
        {last ? (
          <>
            <div className="text-slate-800 tabular-nums">
              <span className="text-slate-500 md:hidden">Letzte Untersuchung: </span>
              {fmtDate(last.date)}
            </div>
            <div className="text-xs text-slate-500">{TREATMENTS[last.treatment].label}</div>
          </>
        ) : (
          <span className="text-slate-500">Noch keine Untersuchung</span>
        )}
      </div>

      <span className="hidden text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600 md:block" aria-hidden="true">
        →
      </span>
    </a>
  );
}
