import { useState } from 'react';
import { CobbChart } from '../components/chart/CobbChart';
import { MeasurementForm } from '../components/MeasurementForm';
import { MeasurementTable } from '../components/MeasurementTable';
import { StatTiles } from '../components/StatTiles';
import { TrendBadge } from '../components/TrendBadge';
import { TREATMENTS, UNCERTAINTY } from '../domain/config';
import { fmtAge, fmtDate, todayIso } from '../domain/format';
import { curveColor, curveLabel } from '../domain/labels';
import { derivePhases, summarize, type TrendSummary } from '../domain/trend';
import type { Measurement, Patient } from '../domain/types';

interface Props {
  patient: Patient;
  onChange: (p: Patient) => void;
}

function trendHint(s: TrendSummary): string {
  if (s.kind === 'offen') return 'Für eine Einstufung werden mindestens zwei vergleichbare Messungen ohne Korsett benötigt.';
  if (s.kind === 'stabil') return `Die Veränderung liegt innerhalb der Messunsicherheit von ±${UNCERTAINTY}°.`;
  return `Die Veränderung übersteigt die Messunsicherheit von ±${UNCERTAINTY}°.`;
}

export function DoctorView({ patient, onChange }: Props) {
  const [curveId, setCurveId] = useState(patient.curves[0].id);
  const [showZones, setShowZones] = useState(false);
  const [showTarget, setShowTarget] = useState(true);
  const [showUncertainty, setShowUncertainty] = useState(false);
  const [xMode, setXMode] = useState<'date' | 'age'>('date');
  const [form, setForm] = useState<{ initial?: Measurement } | null>(null);

  const summary = summarize(patient.measurements, curveId);
  const phases = derivePhases(patient.measurements, todayIso());

  function save(m: Measurement) {
    const exists = patient.measurements.some((x) => x.id === m.id);
    onChange({
      ...patient,
      measurements: exists ? patient.measurements.map((x) => (x.id === m.id ? m : x)) : [...patient.measurements, m],
    });
    setForm(null);
  }

  const toggle = (label: string, checked: boolean, set: (v: boolean) => void) => (
    <label className="chip py-1 text-xs">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => set(e.target.checked)} />
      <span aria-hidden="true" className={checked ? 'text-teal-700' : 'text-slate-300'}>
        ●
      </span>
      {label}
    </label>
  );

  return (
    <div className="space-y-5">
      <a href="#/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-teal-700">
        ← Patientenübersicht
      </a>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{patient.name}</h1>
          <p className="mt-1 text-slate-600">
            {patient.code} · {fmtAge(patient.birth, todayIso())} · {patient.diagnosis}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={`#/patient/${patient.id}/eltern`} className="btn btn-secondary">
            Elternansicht
          </a>
          <button type="button" className="btn btn-primary" onClick={() => setForm({})}>
            <span aria-hidden="true">+</span> Neue Untersuchung
          </button>
        </div>
      </div>

      {patient.curves.length > 1 && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Krümmung für Kennzahlen">
          <span className="text-sm text-slate-500">Kennzahlen für:</span>
          {patient.curves.map((c) => (
            <label key={c.id} className="chip">
              <input type="radio" name="stat-curve" className="sr-only" checked={curveId === c.id} onChange={() => setCurveId(c.id)} />
              <span className="h-2 w-2 rounded-full" style={{ background: curveColor(patient, c.id) }} />
              {curveLabel(c)}
            </label>
          ))}
        </div>
      )}

      <StatTiles summary={summary} />

      <div className="card flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
        <TrendBadge kind={summary.kind} />
        <span className="text-sm text-slate-600">{trendHint(summary)}</span>
        {summary.excludedInBrace > 0 && (
          <span className="text-sm text-slate-500">
            {summary.excludedInBrace} Aufnahme{summary.excludedInBrace > 1 ? 'n' : ''} im Korsett nicht einbezogen.
          </span>
        )}
      </div>

      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Entwicklung des Cobb-Winkels</h2>
          <div className="flex flex-wrap items-center gap-2">
            {toggle('Orientierungsbereiche', showZones, setShowZones)}
            {toggle(`Messunsicherheit ±${UNCERTAINTY}°`, showUncertainty, setShowUncertainty)}
            {toggle('Ziellinie', showTarget, setShowTarget)}
            {showTarget && (
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                <span className="sr-only">Zielwinkel in Grad</span>
                <input
                  className="input w-16 px-2 py-1 text-xs tabular-nums"
                  inputMode="decimal"
                  placeholder="–"
                  value={patient.targetAngle ?? ''}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    const n = Number(v.replace(',', '.'));
                    onChange({ ...patient, targetAngle: v === '' || Number.isNaN(n) || n < 0 || n > 120 ? undefined : n });
                  }}
                />
                °
              </label>
            )}
            <div className="ml-1 inline-flex rounded-full border border-slate-300 p-0.5 text-xs" role="group" aria-label="Zeitachse">
              {(['date', 'age'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={xMode === mode}
                  onClick={() => setXMode(mode)}
                  className={`cursor-pointer rounded-full px-3 py-1 font-medium ${xMode === mode ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {mode === 'date' ? 'Datum' : 'Alter'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <CobbChart patient={patient} showZones={showZones} showTarget={showTarget} showUncertainty={showUncertainty} xMode={xMode} />
      </section>

      <div className="grid gap-5 xl:grid-cols-4">
        <section className="card min-w-0 xl:col-span-3">
          <h2 className="px-5 pt-5 pb-2 text-base font-semibold text-slate-900">Untersuchungen</h2>
          <MeasurementTable
            patient={patient}
            onEdit={(m) => setForm({ initial: m })}
            onDelete={(m) => onChange({ ...patient, measurements: patient.measurements.filter((x) => x.id !== m.id) })}
          />
        </section>

        <section className="card p-5">
          <h2 className="text-base font-semibold text-slate-900">Behandlungsverlauf</h2>
          {phases.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Noch keine Behandlung dokumentiert.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {phases.map((p, i) => (
                <li key={p.from} className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: TREATMENTS[p.kind].fill, outline: `2px solid ${TREATMENTS[p.kind].text}33` }} />
                  <div>
                    <div className="text-sm font-medium text-slate-800">{TREATMENTS[p.kind].label}</div>
                    <div className="text-xs text-slate-500">
                      {fmtDate(p.from)} – {i === phases.length - 1 ? 'heute' : fmtDate(p.to)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
            Abgeleitet aus der Angabe „Aktuelle Behandlung“ der einzelnen Untersuchungen.
          </p>
        </section>
      </div>

      {form && <MeasurementForm patient={patient} initial={form.initial} defaultCurveId={curveId} onSave={save} onCancel={() => setForm(null)} />}
    </div>
  );
}
