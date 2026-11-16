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

const ICON_BTN =
  'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-700';

function Actions({ m, onEdit, onAskDelete }: { m: Measurement; onEdit: () => void; onAskDelete: () => void }) {
  const date = fmtDate(m.date);
  return (
    <span className="inline-flex gap-0.5">
      <button type="button" className={`${ICON_BTN} hover:bg-slate-100 hover:text-teal-700`} onClick={onEdit} title="Bearbeiten" aria-label={`Messung vom ${date} bearbeiten`}>
        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M13.5 3.5l3 3L7 16l-4 1 1-4 9.5-9.5z" />
          <path d="M11.5 5.5l3 3" />
        </svg>
      </button>
      <button type="button" className={`${ICON_BTN} hover:bg-rose-50 hover:text-rose-700`} onClick={onAskDelete} title="Löschen" aria-label={`Messung vom ${date} löschen`}>
        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.5 5.5h13M8 5.5V3.5h4v2M5 5.5l.8 11h8.4l.8-11M8.3 8.5v5M11.7 8.5v5" />
        </svg>
      </button>
    </span>
  );
}

function ConfirmDelete({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-900" role="alert">
      <span className="flex-1">Diese Untersuchung wirklich löschen?</span>
      <button type="button" className="btn btn-danger px-3 py-1.5 text-xs" onClick={onConfirm}>
        Löschen
      </button>
      <button type="button" className="btn btn-secondary px-3 py-1.5 text-xs" onClick={onCancel}>
        Abbrechen
      </button>
    </div>
  );
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

  const rows = [...sorted].reverse().map((m) => {
    const curve = patient.curves.find((c) => c.id === m.curveId);
    const d = delta.get(m.id);
    return {
      m,
      curveName: curve ? REGION_SHORT[curve.region] : '–',
      color: curveColor(patient, m.curveId),
      deltaText: d === undefined ? '–' : fmtDelta(d),
      height: m.heightCm !== undefined ? `${m.heightCm.toLocaleString('de-DE')} cm` : '–',
      treatment: TREATMENTS[m.treatment],
      confirm: confirmId === m.id,
      remove: () => {
        setConfirmId(null);
        onDelete(m);
      },
    };
  });

  const th = 'px-2 py-2.5 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase first:pl-5 last:pr-3';
  const td = 'px-2 pt-2.5 pb-2.5 align-middle first:pl-5 last:pr-3';
  const cols = multi ? 9 : 8;

  return (
    <>
      {/* Ab Tablet-Breite: Tabelle ohne Querscrollen – Notizen stehen in einer zweiten Zeile */}
      <table className="hidden w-full text-sm sm:table">
        <thead className="border-b border-slate-200">
          <tr>
            <th className={th}>Datum</th>
            <th className={`${th} hidden lg:table-cell`}>Alter</th>
            {multi && <th className={th}>Krümmung</th>}
            <th className={`${th} text-right`}>Winkel</th>
            <th className={`${th} text-right`} title="Differenz zur vorherigen vergleichbaren Messung derselben Krümmung">
              Änderung
            </th>
            <th className={th}>Behandlung</th>
            <th className={th}>Größe</th>
            <th className={th}>Risser</th>
            <th className={th}>
              <span className="sr-only">Aktionen</span>
            </th>
          </tr>
        </thead>
        {rows.map(({ m, curveName, color, deltaText, height, treatment, confirm, remove }) => (
          <tbody key={m.id} className={`border-b border-slate-100 last:border-0 ${confirm ? 'bg-rose-50/40' : 'hover:bg-slate-50/70'}`}>
            <tr>
              <td className={`${td} font-medium whitespace-nowrap text-slate-900 tabular-nums`}>{fmtDate(m.date)}</td>
              <td className={`${td} hidden whitespace-nowrap text-slate-600 lg:table-cell`}>{fmtAge(patient.birth, m.date)}</td>
              {multi && (
                <td className={`${td} whitespace-nowrap text-slate-700`}>
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: color }} />
                  {curveName}
                </td>
              )}
              <td className={`${td} text-right whitespace-nowrap`}>
                <span className="text-base font-semibold text-slate-900 tabular-nums">{fmtAngle(m.angle)}</span>
                {m.inBrace && <div className="text-[11px] font-medium text-slate-500">im Korsett</div>}
              </td>
              <td className={`${td} text-right whitespace-nowrap text-slate-600 tabular-nums`}>{deltaText}</td>
              <td className={td}>
                <span className="inline-block rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: treatment.fill, color: treatment.text }}>
                  {treatment.label}
                </span>
              </td>
              <td className={`${td} whitespace-nowrap text-slate-600 tabular-nums`}>{height}</td>
              <td className={`${td} text-slate-600`}>{m.risser ?? '–'}</td>
              <td className={`${td} w-px text-right whitespace-nowrap`}>
                <Actions m={m} onEdit={() => onEdit(m)} onAskDelete={() => setConfirmId(m.id)} />
              </td>
            </tr>
            {(m.note || confirm) && (
              <tr>
                <td colSpan={cols} className="space-y-2 px-5 pb-3">
                  {m.note && <p className="text-[13px] leading-snug text-slate-500">{m.note}</p>}
                  {confirm && <ConfirmDelete onConfirm={remove} onCancel={() => setConfirmId(null)} />}
                </td>
              </tr>
            )}
          </tbody>
        ))}
      </table>

      {/* Schmale Bildschirme: gestapelte Einträge */}
      <ul className="divide-y divide-slate-100 sm:hidden">
        {rows.map(({ m, curveName, color, deltaText, height, treatment, confirm, remove }) => (
          <li key={m.id} className={`space-y-2 px-5 py-3 ${confirm ? 'bg-rose-50/40' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900 tabular-nums">{fmtDate(m.date)}</div>
                <div className="text-xs text-slate-500">
                  {fmtAge(patient.birth, m.date)}
                  {multi && (
                    <>
                      {' · '}
                      <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: color }} />
                      {curveName}
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-slate-900 tabular-nums">{fmtAngle(m.angle)}</div>
                {m.inBrace && <div className="text-[11px] font-medium text-slate-500">im Korsett</div>}
              </div>
              <Actions m={m} onEdit={() => onEdit(m)} onAskDelete={() => setConfirmId(m.id)} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              <span className="rounded-md px-2 py-0.5 font-medium" style={{ background: treatment.fill, color: treatment.text }}>
                {treatment.label}
              </span>
              <span>Änderung: {deltaText}</span>
              {m.heightCm !== undefined && <span>Größe: {height}</span>}
              {m.risser !== undefined && <span>Risser: {m.risser}</span>}
            </div>
            {m.note && <p className="text-[13px] leading-snug text-slate-500">{m.note}</p>}
            {confirm && <ConfirmDelete onConfirm={remove} onCancel={() => setConfirmId(null)} />}
          </li>
        ))}
      </ul>
    </>
  );
}
