import { describe, expect, it } from 'vitest';
import { FIXED_TODAY, makeSubscription } from '../../support/fixtures.js';
import {
  isOverdue,
  nextOccurrence,
  occurrencesBetween,
  periodInMonths,
} from '@/domain/subscriptions/occurrences.js';

describe('periodInMonths', () => {
  it('mapea cada frecuencia a su periodo', () => {
    expect(periodInMonths('MENSUAL')).toBe(1);
    expect(periodInMonths('ANUAL')).toBe(12);
  });

  it('rechaza frecuencias fuera del catálogo', () => {
    expect(() => periodInMonths('SEMANAL')).toThrow();
  });
});

describe('nextOccurrence (FR-005, FR-015)', () => {
  it('devuelve el próximo cobro cuando todavía no venció', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-10-20' });
    expect(nextOccurrence(subscription, FIXED_TODAY)).toBe('2026-10-20');
  });

  it('calcula la siguiente ocurrencia de una suscripción mensual atrasada', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-09-05' });
    expect(nextOccurrence(subscription, FIXED_TODAY)).toBe('2026-10-05');
  });

  it('no duplica cobros cuando el atraso abarca varios periodos', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-03-05' });
    expect(nextOccurrence(subscription, FIXED_TODAY)).toBe('2026-10-05');
  });

  it('calcula la siguiente ocurrencia de una suscripción anual atrasada', () => {
    const subscription = makeSubscription({
      nextChargeDate: '2026-01-15',
      frequency: 'ANUAL',
    });
    expect(nextOccurrence(subscription, FIXED_TODAY)).toBe('2027-01-15');
  });

  it('avanza la ocurrencia cuando el cobro cae el mismo día de la referencia', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-10-05' });
    expect(nextOccurrence(subscription, '2026-10-05')).toBe('2026-11-05');
  });
});

describe('isOverdue (FR-015)', () => {
  it('marca como atrasada la suscripción con cobro en fecha pasada', () => {
    expect(isOverdue(makeSubscription({ nextChargeDate: '2026-09-05' }), FIXED_TODAY)).toBe(true);
  });

  it('no marca como atrasada la suscripción que cobra hoy o más adelante', () => {
    expect(isOverdue(makeSubscription({ nextChargeDate: '2026-10-01' }), FIXED_TODAY)).toBe(false);
    expect(isOverdue(makeSubscription({ nextChargeDate: '2026-10-05' }), FIXED_TODAY)).toBe(false);
  });
});

describe('occurrencesBetween (FR-022 y casos límite)', () => {
  it('lista los cobros mensuales dentro del rango, extremos incluidos', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-10-05' });
    const occurrences = occurrencesBetween(subscription, '2026-10-01', '2026-12-31');

    expect(occurrences).toEqual([
      { date: '2026-10-05', amount: 15000 },
      { date: '2026-11-05', amount: 15000 },
      { date: '2026-12-05', amount: 15000 },
    ]);
  });

  it('cuenta un solo cobro por año en la frecuencia anual', () => {
    const subscription = makeSubscription({
      nextChargeDate: '2026-12-01',
      frequency: 'ANUAL',
      amount: 120000,
    });

    expect(occurrencesBetween(subscription, FIXED_TODAY, '2026-12-31')).toEqual([
      { date: '2026-12-01', amount: 120000 },
    ]);
  });

  it('no cuenta cobros pasados al rango', () => {
    const subscription = makeSubscription({
      nextChargeDate: '2026-01-15',
      frequency: 'ANUAL',
      amount: 120000,
    });

    expect(occurrencesBetween(subscription, FIXED_TODAY, '2026-12-31')).toEqual([]);
  });

  it('ajusta el día 31 a meses de 30 días sin perder cobros', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-01-31' });

    expect(occurrencesBetween(subscription, '2026-01-01', '2026-05-31')).toEqual([
      { date: '2026-01-31', amount: 15000 },
      { date: '2026-02-28', amount: 15000 },
      { date: '2026-03-31', amount: 15000 },
      { date: '2026-04-30', amount: 15000 },
      { date: '2026-05-31', amount: 15000 },
    ]);
  });

  it('no deja que el ajuste al mes corto derive el día de cobros futuros', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-01-31' });
    expect(nextOccurrence(subscription, '2026-02-28')).toBe('2026-03-31');
  });

  it('incluye el cobro del día exacto del rango inicial', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-10-05' });
    expect(occurrencesBetween(subscription, '2026-10-05', '2026-10-05')).toHaveLength(1);
  });

  it('rechaza frecuencias no soportadas', () => {
    const subscription = makeSubscription({ frequency: 'DIARIA' });
    expect(() => occurrencesBetween(subscription, FIXED_TODAY, '2026-12-31')).toThrow();
  });
});
