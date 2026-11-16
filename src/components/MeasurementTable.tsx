import { useState } from 'react';
import { REGION_SHORT, TREATMENTS } from '../domain/config';
import { fmtAge, fmtAngle, fmtDate, fmtDelta } from '../domain/format';
import { curveColor } from '../domain/labels';
import { byDate } from '../domain/trend';
import type { Measurement, Patient } from '../domain/types';

interface Props {
  patient: Patient;
  onEdit: (m: Measurement) => void;
  onDelete: (m: Measurement) => void;
}

export function MeasurementTable({ patient, onEdit, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const sorted = [...patient.measurements].sort(byDate);
  const multi = patient.curves.length > 1;

  // Differenz zur vorherigen vergleichbaren Messung derselben Krümmung
  const prevAngle = new Map<string, number>();
  const delta = new Map<string, number>();
  for (const m of sorted) {
    if (m.inBrace) continue;
    const prev = prevAngle.get(m.curveId);
    if (prev !== undefined) delta.set(m.id, Math.round((m.angle - prev) * 10) / 10);
    prevAngle.set(m.curveId, m.angle);
  }

  if (sorted.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-slate-500">Noch keine Untersuchungen erfasst.</p>;
  }

  const th = 'px-3 py-2.5 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase first:pl-5 last:pr-5';
  const td = 'px-3 py-3 align-top first:pl-5 last:pr-5';

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-slate-200">
          <tr>
            <th className={th}>Datum</th>
            <th className={th}>Alter</th>
            {multi && <th className={th}>Krümmung</th>}
            <th className={`${th} text-right`}>Winkel</th>
            <th className={`${th} text-right`}>Δ Vormessung</th>
            <th className={th}>Behandlung</th>
            <th className={th}>Größe</th>
            <th className={th}>Risser</th>
            <th className={th}>Notiz</th>
            <th className={th}>
              <span className="sr-only">Aktionen</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[...sorted].reverse().map((m) => {
            const curve = patient.curves.find((c) => c.id === m.curveId);
            const d = delta.get(m.id);
            return (
              <tr key={m.id} className="hover:bg-slate-50/70">
                <td className={`${td} font-medium whitespace-nowrap text-slate-900 tabular-nums`}>{fmtDate(m.date)}</td>
                <td className={`${td} whitespace-nowrap text-slate-600`}>{fmtAge(patient.birth, m.date)}</td>
                {multi && (
                  <td className={`${td} whitespace-nowrap text-slate-700`}>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: curveColor(patient, m.curveId) }} />
                    {curve ? REGION_SHORT[curve.region] : '–'}
                  </td>
                )}
                <td className={`${td} text-right whitespace-nowrap`}>
                  <span className="font-semibold text-slate-900 tabular-nums">{fmtAngle(m.angle)}</span>
                  {m.inBrace && <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">im Korsett</span>}
                </td>
                <td className={`${td} text-right text-slate-600 tabular-nums`}>{d === undefined ? '–' : fmtDelta(d)}</td>
                <td className={`${td} whitespace-nowrap`}>
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{ background: TREATMENTS[m.treatment].fill, color: TREATMENTS[m.treatment].text }}
                  >
                    {TREATMENTS[m.treatment].label}
                  </span>
                </td>
                <td className={`${td} whitespace-nowrap text-slate-600 tabular-nums`}>
                  {m.heightCm !== undefined ? `${m.heightCm.toLocaleString('de-DE')} cm` : '–'}
                </td>
                <td className={`${td} text-slate-600`}>{m.risser ?? '–'}</td>
                <td className={`${td} max-w-[16rem] text-slate-600`}>{m.note ?? ''}</td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  {confirmId === m.id ? (
                    <span className="inline-flex gap-1.5">
                      <button
                        type="button"
                        className="btn btn-danger px-2.5 py-1 text-xs"
                        onClick={() => {
                          setConfirmId(null);
                          onDelete(m);
                        }}
                      >
                        Löschen
                      </button>
                      <button type="button" className="btn btn-secondary px-2.5 py-1 text-xs" onClick={() => setConfirmId(null)}>
                        Abbrechen
                      </button>
                    </span>
                  ) : (
                    <span className="inline-flex gap-1">
                      <button type="button" className="btn btn-ghost px-2.5 py-1 text-xs" onClick={() => onEdit(m)} aria-label={`Messung vom ${fmtDate(m.date)} bearbeiten`}>
                        Bearbeiten
                      </button>
                      <button type="button" className="btn btn-ghost px-2.5 py-1 text-xs text-rose-700" onClick={() => setConfirmId(m.id)} aria-label={`Messung vom ${fmtDate(m.date)} löschen`}>
                        Löschen
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
