import type { Measurement, Patient, TreatmentKind } from '../domain/types';

/**
 * Ausschließlich frei erfundene Demonstrationsdaten.
 * Namen, Kennungen und Messwerte haben keinen Bezug zu realen Personen.
 */

type Row = [date: string, angle: number, treatment: TreatmentKind, extra?: Partial<Measurement>];

function rows(patientId: string, curveId: string, list: Row[]): Measurement[] {
  return list.map(([date, angle, treatment, extra], i) => ({
    id: `${patientId}-${curveId}-${i}`,
    date,
    curveId,
    angle,
    inBrace: false,
    treatment,
    ...extra,
  }));
}

export function seedPatients(): Patient[] {
  return [
    {
      id: 'p1',
      code: 'SK-0041',
      name: 'Mia B.',
      birth: '2014-05',
      diagnosis: 'Idiopathische Adoleszentenskoliose',
      curves: [{ id: 'th', region: 'thorakal', side: 'rechts' }],
      targetAngle: 20,
      growth: [{ from: '2025-06-01', to: '2026-04-01' }],
      measurements: rows('p1', 'th', [
        ['2025-01-14', 32, 'beobachtung', { heightCm: 146, risser: 0, note: 'Erstvorstellung, Ganzwirbelsäulenaufnahme im Stehen.' }],
        ['2025-04-08', 31, 'korsett', { heightCm: 147.5, risser: 0, note: 'Korsettversorgung begonnen.' }],
        ['2025-05-06', 17, 'korsett', { inBrace: true, note: 'Korsettkontrolle – gute Primärkorrektur.' }],
        ['2025-07-15', 28, 'korsett', { heightCm: 149.5, risser: 1 }],
        ['2025-11-04', 27, 'korsett', { heightCm: 152, risser: 1, note: 'Tragezeit laut Eltern ca. 20 h/Tag.' }],
        ['2026-03-10', 24, 'korsett', { heightCm: 154.5, risser: 2 }],
        ['2026-07-07', 22, 'korsett', { heightCm: 156, risser: 2 }],
        ['2026-10-20', 21, 'korsett', { heightCm: 157, risser: 3, note: 'Korsett angepasst.' }],
      ]),
    },
    {
      id: 'p2',
      code: 'SK-0058',
      name: 'Lena K.',
      birth: '2013-02',
      diagnosis: 'Idiopathische Adoleszentenskoliose, doppelbogig',
      curves: [
        { id: 'th', region: 'thorakal', side: 'rechts' },
        { id: 'lu', region: 'lumbal', side: 'links' },
      ],
      measurements: [
        ...rows('p2', 'th', [
          ['2025-02-18', 28, 'korsett', { heightCm: 155, risser: 1 }],
          ['2025-06-24', 29, 'korsett', { heightCm: 157, risser: 2 }],
          ['2025-11-11', 27, 'korsett', { heightCm: 159, risser: 2 }],
          ['2026-04-14', 28, 'korsett', { heightCm: 160.5, risser: 3 }],
          ['2026-09-22', 29, 'korsett', { heightCm: 161, risser: 4, note: 'Wachstum weitgehend abgeschlossen.' }],
        ]),
        ...rows('p2', 'lu', [
          ['2025-02-18', 22, 'korsett'],
          ['2025-06-24', 23, 'korsett'],
          ['2025-11-11', 21, 'korsett'],
          ['2026-04-14', 22, 'korsett'],
          ['2026-09-22', 22, 'korsett'],
        ]),
      ],
    },
    {
      id: 'p3',
      code: 'SK-0063',
      name: 'Jonas W.',
      birth: '2012-09',
      diagnosis: 'Idiopathische Adoleszentenskoliose',
      curves: [{ id: 'tl', region: 'thorakolumbal', side: 'links' }],
      growth: [{ from: '2025-02-01', to: '2026-03-01' }],
      measurements: rows('p3', 'tl', [
        ['2024-11-19', 24, 'beobachtung', { heightCm: 158, risser: 0 }],
        ['2025-03-25', 26, 'beobachtung', { heightCm: 161, risser: 0 }],
        ['2025-08-12', 31, 'korsett', { heightCm: 166, risser: 1, note: 'Progression im Wachstumsschub, Korsett verordnet.' }],
        ['2026-01-20', 34, 'korsett', { heightCm: 170.5, risser: 2, note: 'Tragezeit unregelmäßig.' }],
        ['2026-06-09', 36, 'korsett', { heightCm: 173, risser: 3 }],
        ['2026-10-13', 38, 'korsett', { heightCm: 174.5, risser: 3, note: 'Verlauf engmaschig kontrollieren.' }],
      ]),
    },
    {
      id: 'p4',
      code: 'SK-0072',
      name: 'Emma S.',
      birth: '2015-11',
      diagnosis: 'Idiopathische Skoliose, milde Ausprägung',
      curves: [{ id: 'lu', region: 'lumbal', side: 'links' }],
      measurements: rows('p4', 'lu', [
        ['2025-05-13', 14, 'physio', { heightCm: 138 }],
        ['2025-11-18', 15, 'physio', { heightCm: 141 }],
        ['2026-05-19', 13, 'physio', { heightCm: 144, note: 'Übungsprogramm wird regelmäßig durchgeführt.' }],
        ['2026-11-03', 12, 'physio', { heightCm: 147 }],
      ]),
    },
    {
      id: 'p5',
      code: 'SK-0080',
      name: 'Paul R.',
      birth: '2014-08',
      diagnosis: 'Verdacht auf idiopathische Skoliose',
      curves: [{ id: 'th', region: 'thorakal', side: 'rechts' }],
      measurements: rows('p5', 'th', [
        ['2026-10-28', 27, 'beobachtung', { heightCm: 151, risser: 0, note: 'Erstvorstellung. Kontrolle in 4 Monaten.' }],
      ]),
    },
  ];
}
