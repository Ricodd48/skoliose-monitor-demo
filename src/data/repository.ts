import type { Patient } from '../domain/types';
import { seedPatients } from './seed';

/**
 * Speicherschnittstelle. Die Oberfläche kennt nur dieses Interface.
 * Für einen Klinikbetrieb wird hier eine eigene Implementierung eingesetzt
 * (interne Datenbank, REST-Dienst, KIS-Anbindung) – deshalb bewusst asynchron.
 */
export interface PatientRepository {
  load(): Promise<Patient[]>;
  save(patients: Patient[]): Promise<void>;
  reset(): Promise<Patient[]>;
}

const KEY = 'skoliose-monitor-demo-v1';

/** Demo-Implementierung: Fake-Daten, Änderungen bleiben nur im Browser. */
export class LocalStorageRepository implements PatientRepository {
  async load(): Promise<Patient[]> {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Patient[];
      }
    } catch {
      // defekter oder blockierter Speicher → mit Demo-Daten weiterarbeiten
    }
    return seedPatients();
  }

  async save(patients: Patient[]): Promise<void> {
    try {
      localStorage.setItem(KEY, JSON.stringify(patients));
    } catch {
      // z. B. privater Modus: Demo funktioniert weiter, nur ohne Persistenz
    }
  }

  async reset(): Promise<Patient[]> {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // siehe oben
    }
    return seedPatients();
  }
}

export const repository: PatientRepository = new LocalStorageRepository();
