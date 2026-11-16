import { CobbChart } from '../components/chart/CobbChart';
import { StatTiles } from '../components/StatTiles';
import { TrendBadge } from '../components/TrendBadge';
import { REGION_PLAIN } from '../domain/config';
import { fmtAge, fmtDate, todayIso } from '../domain/format';
import { curveColor } from '../domain/labels';
import { parentText, summarize } from '../domain/trend';
import type { Patient } from '../domain/types';

/** Reduzierte Präsentationsansicht für das Elterngespräch – auch als Ausdruck/PDF */
export function ParentView({ patient }: { patient: Patient }) {
  const multi = patient.curves.length > 1;
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8 print:max-w-none print:p-0">
      <div className="no-print mb-6 flex items-center justify-between gap-3">
        <a href={`#/patient/${patient.id}`} className="btn btn-ghost -ml-3">
          ← Zurück zur Ärzteansicht
        </a>
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
          Drucken / als PDF speichern
        </button>
      </div>

      <header className="mb-6">
        <p className="text-sm font-semibold tracking-wide text-teal-700 uppercase">Skoliose-Verlauf</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{patient.name}</h1>
        <p className="mt-1 text-slate-500">
          {fmtAge(patient.birth, todayIso()).replace('J.', 'Jahre')} · Stand {fmtDate(todayIso())}
        </p>
      </header>

      <div className="space-y-6">
        {patient.curves.map((c) => {
          const s = summarize(patient.measurements, c.id);
          const t = parentText(s);
          return (
            <section key={c.id} className="break-inside-avoid">
              {multi && (
                <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <span className="h-3 w-3 rounded-full" style={{ background: curveColor(patient, c.id) }} />
                  {REGION_PLAIN[c.region]}
                </h2>
              )}
              <StatTiles summary={s} large />
              <div className="card mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 p-5 sm:p-6">
                <TrendBadge kind={s.kind} large />
                <div className="min-w-[16rem] flex-1">
                  <p className="text-lg font-semibold text-slate-900">{t.title}</p>
                  <p className="mt-0.5 text-slate-600">{t.text}</p>
                </div>
              </div>
            </section>
          );
        })}

        <section className="card break-inside-avoid p-4 sm:p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">So hat sich der Winkel entwickelt</h2>
          <CobbChart patient={patient} variant="parent" />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          <div className="rounded-2xl bg-teal-50 p-5 text-teal-950">
            <h3 className="font-semibold">Was ist der Cobb-Winkel?</h3>
            <p className="mt-1 text-sm leading-relaxed">
              Er beschreibt, wie stark die Wirbelsäule zur Seite gekrümmt ist, und wird auf dem Röntgenbild gemessen. Je kleiner der Winkel, desto
              geringer die Krümmung.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-5 text-slate-800">
            <h3 className="font-semibold">Gut zu wissen</h3>
            <p className="mt-1 text-sm leading-relaxed">
              Unterschiede von wenigen Grad können allein durch die Messung entstehen. Wie der Verlauf zu bewerten ist, bespricht die Ärztin mit
              Ihnen.
            </p>
          </div>
        </section>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">Demonstration mit frei erfundenen Daten · keine medizinische Bewertung</p>
    </div>
  );
}
