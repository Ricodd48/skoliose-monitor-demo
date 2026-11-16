import { Sparkline } from '../components/chart/Sparkline';
import { TrendBadge } from '../components/TrendBadge';
import { fmtAge, fmtAngle, fmtDate, todayIso } from '../domain/format';
import { curveColor, curveLabel } from '../domain/labels';
import { byDate, summarize } from '../domain/trend';
import type { Patient } from '../domain/types';

export function PatientList({ patients }: { patients: Patient[] }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patientenübersicht</h1>
        <p className="mt-1 text-slate-600">
          {patients.length} fiktive Patientinnen und Patienten. Wählen Sie eine Karte, um den Verlauf zu öffnen.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {patients.map((p) => (
          <PatientCard key={p.id} patient={p} />
        ))}
      </div>
    </div>
  );
}

function PatientCard({ patient }: { patient: Patient }) {
  const lastExam = [...patient.measurements].sort(byDate).pop();
  return (
    <a
      href={`#/patient/${patient.id}`}
      className="card group block p-5 transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">{patient.name}</div>
          <div className="text-sm text-slate-500">
            {patient.code} · {fmtAge(patient.birth, todayIso())}
          </div>
        </div>
        <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600" aria-hidden="true">
          →
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{patient.diagnosis}</p>

      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
        {patient.curves.map((c) => {
          const s = summarize(patient.measurements, c.id);
          const color = curveColor(patient, c.id);
          const points = patient.measurements.filter((m) => m.curveId === c.id && !m.inBrace).sort(byDate);
          return (
            <div key={c.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                  <span className="truncate">{curveLabel(c)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2.5">
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">{s.last ? fmtAngle(s.last.angle) : '–'}</span>
                  <TrendBadge kind={s.kind} />
                </div>
              </div>
              <Sparkline points={points} color={color} />
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-slate-500">
        {lastExam ? `Letzte Untersuchung: ${fmtDate(lastExam.date)}` : 'Noch keine Untersuchung'}
      </div>
    </a>
  );
}
