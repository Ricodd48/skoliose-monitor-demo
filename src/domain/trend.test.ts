import { describe, expect, it } from 'vitest';
import { derivePhases, summarize } from './trend';
import type { Measurement } from './types';
import { ageAt, fmtDelta } from './format';
import { seedPatients } from '../data/seed';

let n = 0;
const m = (date: string, angle: number, extra: Partial<Measurement> = {}): Measurement => ({
  id: `m${n++}`,
  date,
  curveId: 'c1',
  angle,
  inBrace: false,
  treatment: 'beobachtung',
  ...extra,
});

describe('summarize', () => {
  it('stuft eine Abnahme ab der Messunsicherheit als rückläufig ein', () => {
    const s = summarize([m('2025-01-01', 32), m('2025-06-01', 27)], 'c1');
    expect(s.kind).toBe('ruecklaeufig');
    expect(s.delta).toBe(-5);
  });

  it('stuft kleine Veränderungen als stabil ein', () => {
    expect(summarize([m('2025-01-01', 30), m('2025-06-01', 26)], 'c1').kind).toBe('stabil');
    expect(summarize([m('2025-01-01', 30), m('2025-06-01', 34.5)], 'c1').kind).toBe('stabil');
  });

  it('stuft eine Zunahme ab der Messunsicherheit als zunehmend ein', () => {
    const s = summarize([m('2025-01-01', 24), m('2025-06-01', 38)], 'c1');
    expect(s.kind).toBe('zunehmend');
    expect(s.delta).toBe(14);
  });

  it('sortiert nach Datum, unabhängig von der Eingabereihenfolge', () => {
    const s = summarize([m('2025-06-01', 20), m('2025-01-01', 30)], 'c1');
    expect(s.first?.angle).toBe(30);
    expect(s.last?.angle).toBe(20);
  });

  it('klammert Aufnahmen im Korsett aus dem Vergleich aus', () => {
    const s = summarize(
      [m('2025-01-01', 32), m('2025-03-01', 15, { inBrace: true }), m('2025-06-01', 31)],
      'c1',
    );
    expect(s.kind).toBe('stabil');
    expect(s.excludedInBrace).toBe(1);
    expect(s.count).toBe(2);
  });

  it('vergleicht nur Messungen derselben Krümmung', () => {
    const s = summarize([m('2025-01-01', 30), m('2025-06-01', 10, { curveId: 'c2' })], 'c1');
    expect(s.kind).toBe('offen');
    expect(s.count).toBe(1);
  });

  it('bleibt bei null oder einer Messung offen', () => {
    expect(summarize([], 'c1')).toMatchObject({ kind: 'offen', count: 0 });
    const one = summarize([m('2025-01-01', 27)], 'c1');
    expect(one.kind).toBe('offen');
    expect(one.delta).toBeUndefined();
    expect(one.last?.angle).toBe(27);
  });

  it('akzeptiert eine abweichende Messunsicherheit', () => {
    expect(summarize([m('2025-01-01', 30), m('2025-06-01', 27)], 'c1', 3).kind).toBe('ruecklaeufig');
  });
});

describe('derivePhases', () => {
  it('fasst gleiche Behandlungen zusammen und schließt Abschnitte beim Wechsel', () => {
    const phases = derivePhases(
      [
        m('2025-01-01', 30),
        m('2025-04-01', 30, { treatment: 'korsett' }),
        m('2025-08-01', 28, { treatment: 'korsett' }),
      ],
      '2025-12-31',
    );
    expect(phases).toEqual([
      { kind: 'beobachtung', from: '2025-01-01', to: '2025-04-01' },
      { kind: 'korsett', from: '2025-04-01', to: '2025-12-31' },
    ]);
  });

  it('liefert ohne Messungen keine Abschnitte', () => {
    expect(derivePhases([], '2025-12-31')).toEqual([]);
  });
});

describe('format', () => {
  it('formatiert Differenzen mit Vorzeichen', () => {
    expect(fmtDelta(-8)).toBe('−8°');
    expect(fmtDelta(3.5)).toBe('+3,5°');
    expect(fmtDelta(0)).toBe('±0°');
  });

  it('berechnet das Alter', () => {
    expect(Math.floor(ageAt('2014-05', '2026-11-16'))).toBe(12);
  });
});

describe('Seed-Daten', () => {
  it('sind in sich konsistent', () => {
    const patients = seedPatients();
    const ids = new Set<string>();
    for (const p of patients) {
      const curveIds = new Set(p.curves.map((c) => c.id));
      for (const x of p.measurements) {
        expect(curveIds.has(x.curveId)).toBe(true);
        expect(ids.has(x.id)).toBe(false);
        ids.add(x.id);
      }
    }
    expect(patients.map((p) => summarize(p.measurements, p.curves[0].id).kind)).toEqual([
      'ruecklaeufig',
      'stabil',
      'zunehmend',
      'stabil',
      'offen',
    ]);
  });
});
