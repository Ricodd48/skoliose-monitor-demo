import { useState, type FormEvent } from 'react';
import { ANGLE_MAX, ANGLE_MIN, TREATMENTS, TREATMENT_ORDER } from '../domain/config';
import { todayIso } from '../domain/format';
import { curveLabel } from '../domain/labels';
import { byDate } from '../domain/trend';
import type { Measurement, Patient, TreatmentKind } from '../domain/types';
import { useEscape } from './Dialog';

interface Props {
  patient: Patient;
  /** vorhandene Messung = Bearbeiten, sonst Neuanlage */
  initial?: Measurement;
  defaultCurveId: string;
  onSave: (m: Measurement) => void;
  onCancel: () => void;
}

const num = (s: string) => Number(s.replace(',', '.'));

export function MeasurementForm({ patient, initial, defaultCurveId, onSave, onCancel }: Props) {
  useEscape(onCancel);
  const latest = [...patient.measurements].sort(byDate).pop();
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [curveId, setCurveId] = useState(initial?.curveId ?? defaultCurveId);
  const [angle, setAngle] = useState(initial ? String(initial.angle) : '');
  const [inBrace, setInBrace] = useState(initial?.inBrace ?? false);
  const [treatment, setTreatment] = useState<TreatmentKind>(initial?.treatment ?? latest?.treatment ?? 'beobachtung');
  const [height, setHeight] = useState(initial?.heightCm !== undefined ? String(initial.heightCm) : '');
  const [risser, setRisser] = useState(initial?.risser !== undefined ? String(initial.risser) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!date) err.date = 'Bitte ein Datum angeben.';
    else if (date > todayIso()) err.date = 'Das Datum darf nicht in der Zukunft liegen.';
    const a = num(angle);
    if (angle.trim() === '' || Number.isNaN(a)) err.angle = 'Bitte den Cobb-Winkel angeben.';
    else if (a < ANGLE_MIN || a > ANGLE_MAX) err.angle = `Der Winkel muss zwischen ${ANGLE_MIN}° und ${ANGLE_MAX}° liegen.`;
    const h = height.trim() === '' ? undefined : num(height);
    if (h !== undefined && (Number.isNaN(h) || h < 50 || h > 220)) err.height = 'Bitte eine Größe zwischen 50 und 220 cm angeben.';
    setErrors(err);
    if (Object.keys(err).length) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      date,
      curveId,
      angle: Math.round(a * 10) / 10,
      inBrace,
      treatment,
      heightCm: h,
      risser: risser === '' ? undefined : Number(risser),
      note: note.trim() || undefined,
    });
  }

  const error = (key: string) =>
    errors[key] && (
      <p className="mt-1.5 text-sm text-rose-700" role="alert">
        {errors[key]}
      </p>
    );

  return (
    <div className="no-print fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onCancel} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={initial ? 'Untersuchung bearbeiten' : 'Neue Untersuchung'}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{initial ? 'Untersuchung bearbeiten' : 'Neue Untersuchung'}</h2>
            <p className="text-sm text-slate-500">
              {patient.name} · {patient.code}
            </p>
          </div>
          <button type="button" className="btn btn-ghost px-2.5" onClick={onCancel} aria-label="Schließen">
            ✕
          </button>
        </header>

        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="f-date">
                  Untersuchungsdatum
                </label>
                <input id="f-date" type="date" className="input" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="f-angle">
                  Cobb-Winkel (°)
                </label>
                <input
                  id="f-angle"
                  className="input text-lg font-semibold tabular-nums"
                  inputMode="decimal"
                  autoFocus
                  placeholder="z. B. 24"
                  value={angle}
                  onChange={(e) => setAngle(e.target.value)}
                />
              </div>
              <div className="col-span-2 -mt-3">
                {error('date')}
                {error('angle')}
              </div>
            </div>

            {patient.curves.length > 1 && (
              <fieldset>
                <legend className="field-label">Krümmung</legend>
                <div className="flex flex-wrap gap-2">
                  {patient.curves.map((c) => (
                    <label key={c.id} className="chip">
                      <input type="radio" name="curve" className="sr-only" checked={curveId === c.id} onChange={() => setCurveId(c.id)} />
                      {curveLabel(c)}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset>
              <legend className="field-label">Aktuelle Behandlung</legend>
              <div className="flex flex-wrap gap-2">
                {TREATMENT_ORDER.map((k) => (
                  <label key={k} className="chip">
                    <input type="radio" name="treatment" className="sr-only" checked={treatment === k} onChange={() => setTreatment(k)} />
                    {TREATMENTS[k].label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-teal-700" checked={inBrace} onChange={(e) => setInBrace(e.target.checked)} />
              <span>
                <span className="block text-sm font-medium text-slate-800">Aufnahme im Korsett</span>
                <span className="block text-xs text-slate-500">
                  Wird im Diagramm gesondert markiert und nicht in den Verlaufsvergleich einbezogen.
                </span>
              </span>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="f-height">
                  Körpergröße (cm) <span className="font-normal text-slate-400">optional</span>
                </label>
                <input id="f-height" className="input tabular-nums" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="f-risser">
                  Risser-Stadium <span className="font-normal text-slate-400">optional</span>
                </label>
                <select id="f-risser" className="input" value={risser} onChange={(e) => setRisser(e.target.value)}>
                  <option value="">–</option>
                  {[0, 1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 -mt-3">{error('height')}</div>
            </div>

            <div>
              <label className="field-label" htmlFor="f-note">
                Notiz <span className="font-normal text-slate-400">optional</span>
              </label>
              <textarea id="f-note" rows={3} className="input resize-none" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
              Demo: Bitte keine echten Patientendaten eingeben. Eingaben bleiben nur in diesem Browser.
            </p>
          </div>

          <footer className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              {initial ? 'Änderungen speichern' : 'Messung speichern'}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
