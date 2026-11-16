import { useEffect, useState } from 'react';
import { Dialog } from './components/Dialog';
import { repository } from './data/repository';
import type { Patient } from './domain/types';
import { DoctorView } from './views/DoctorView';
import { ParentView } from './views/ParentView';
import { PatientList } from './views/PatientList';

type Route = { view: 'list' } | { view: 'doctor' | 'parent'; id: string };

function parseRoute(hash: string): Route {
  const match = hash.match(/^#\/patient\/([^/]+)(\/eltern)?$/);
  if (!match) return { view: 'list' };
  return { view: match[2] ? 'parent' : 'doctor', id: decodeURIComponent(match[1]) };
}

function useRoute(): Route {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parseRoute(hash);
}

export default function App() {
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [dialog, setDialog] = useState<'info' | 'reset' | null>(null);
  const route = useRoute();

  useEffect(() => {
    void repository.load().then(setPatients);
  }, []);

  if (!patients) return null;

  function updatePatient(next: Patient) {
    const all = patients!.map((p) => (p.id === next.id ? next : p));
    setPatients(all);
    void repository.save(all);
  }

  async function reset() {
    setPatients(await repository.reset());
    setDialog(null);
  }

  const patient = route.view === 'list' ? undefined : patients.find((p) => p.id === route.id);

  if (route.view === 'parent' && patient) return <ParentView patient={patient} />;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="#/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700">
              <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
                <path d="M16 5c-5 4 5 7 0 11s5 7 0 11" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-base font-bold tracking-tight whitespace-nowrap text-slate-900 sm:text-lg">Skoliose-Monitor</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Demo</span>
          </a>
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-ghost px-3 py-2 whitespace-nowrap" onClick={() => setDialog('info')}>
              <span className="sm:hidden">Info</span>
              <span className="hidden sm:inline">Über die Demo</span>
            </button>
            <button type="button" className="btn btn-ghost px-3 py-2 whitespace-nowrap" onClick={() => setDialog('reset')}>
              <span className="sm:hidden">Reset</span>
              <span className="hidden sm:inline">Demo zurücksetzen</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {route.view === 'list' && <PatientList patients={patients} />}
        {route.view === 'doctor' && patient && <DoctorView key={patient.id} patient={patient} onChange={updatePatient} />}
        {route.view !== 'list' && !patient && (
          <div className="card p-8 text-center">
            <p className="text-slate-700">Diese Patientin bzw. dieser Patient wurde nicht gefunden.</p>
            <a href="#/" className="btn btn-primary mt-4">
              Zur Patientenübersicht
            </a>
          </div>
        )}
      </main>

      <footer className="no-print border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Demonstration mit frei erfundenen Daten · keine medizinische Bewertung · kein Medizinprodukt
      </footer>

      {dialog === 'info' && (
        <Dialog title="Über diese Demo" onClose={() => setDialog(null)}>
          <p>
            Der Skoliose-Monitor ist ein klickbarer Prototyp. Er zeigt, wie sich der Verlauf des Cobb-Winkels für die ärztliche Arbeit und für das
            Elterngespräch darstellen lässt.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Alle Personen und Messwerte sind frei erfunden.</li>
            <li>Eingaben werden nur lokal in diesem Browser gespeichert – es gibt keinen Server und keine Datenübertragung.</li>
            <li>Bitte keine echten Patientendaten eingeben.</li>
            <li>Farbige Bereiche und Einstufungen sind grobe Orientierung und ersetzen keine ärztliche Beurteilung.</li>
          </ul>
          <div className="flex justify-end pt-2">
            <button type="button" className="btn btn-primary" onClick={() => setDialog(null)}>
              Verstanden
            </button>
          </div>
        </Dialog>
      )}

      {dialog === 'reset' && (
        <Dialog title="Demo zurücksetzen?" onClose={() => setDialog(null)}>
          <p>Alle Änderungen in diesem Browser werden verworfen und die ursprünglichen Beispieldaten wiederhergestellt.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setDialog(null)}>
              Abbrechen
            </button>
            <button type="button" className="btn btn-danger" onClick={() => void reset()}>
              Zurücksetzen
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
