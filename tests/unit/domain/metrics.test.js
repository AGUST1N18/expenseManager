import { describe, expect, it } from 'vitest';
import { FIXED_TODAY, makeSubscription } from '../../support/fixtures.js';
import { annualProjection } from '@/domain/metrics/annualProjection.js';
import { distributionByCategory } from '@/domain/metrics/distribution.js';
import { monthlyEquivalent } from '@/domain/metrics/monthlyEquivalent.js';
import { buildMetrics, monthlyTotal } from '@/domain/metrics/summary.js';

const active = (overrides) => makeSubscription({ status: 'ACTIVA', ...overrides });
const paused = (overrides) => makeSubscription({ status: 'PAUSADA', ...overrides });
const cancelled = (overrides) =>
  makeSubscription({ status: 'CANCELADA', cancelledAt: '2026-09-01', ...overrides });

describe('monthlyEquivalent (FR-020)', () => {
  it('devuelve el monto tal cual para una suscripción mensual', () => {
    expect(monthlyEquivalent(15000, 'MENSUAL')).toBe(15000);
  });

  it('divide entre 12 una suscripción anual', () => {
    expect(monthlyEquivalent(120000, 'ANUAL')).toBe(10000);
    expect(monthlyEquivalent(70000, 'ANUAL')).toBeCloseTo(5833.33, 2);
  });

  it('rechaza frecuencias fuera del catálogo', () => {
    expect(() => monthlyEquivalent(15000, 'SEMANAL')).toThrow();
  });
});

describe('monthlyTotal (FR-020, SC-003)', () => {
  it('estandariza mensual más anual: 10000 + 120000/12 = 20000', () => {
    const subscriptions = [
      active({ id: 'a', amount: 10000, frequency: 'MENSUAL' }),
      active({ id: 'b', amount: 120000, frequency: 'ANUAL' }),
    ];
    expect(monthlyTotal(subscriptions)).toBe(20000);
  });

  it('estandariza mensual más anual: 10000 + 24000/12 = 12000', () => {
    const subscriptions = [
      active({ id: 'a', amount: 10000, frequency: 'MENSUAL' }),
      active({ id: 'b', amount: 24000, frequency: 'ANUAL' }),
    ];
    expect(monthlyTotal(subscriptions)).toBe(12000);
  });

  it('estandariza dos anuales: 35000/12 + 20000/12 = 4583.33', () => {
    const subscriptions = [
      active({ id: 'a', amount: 35000, frequency: 'ANUAL' }),
      active({ id: 'b', amount: 20000, frequency: 'ANUAL' }),
    ];
    expect(monthlyTotal(subscriptions)).toBeCloseTo(4583.33, 2);
  });

  it('suma sin redondear hasta presentar el resultado', () => {
    const subscriptions = [
      active({ id: 'a', amount: 100, frequency: 'ANUAL' }),
      active({ id: 'b', amount: 100, frequency: 'ANUAL' }),
    ];
    expect(monthlyTotal(subscriptions)).toBeCloseTo(16.666666, 5);
  });

  it('excluye las suscripciones pausadas', () => {
    const subscriptions = [
      active({ id: 'a', name: 'Netflix', amount: 10000 }),
      paused({ id: 'b', name: 'Gimnasio', amount: 25000 }),
    ];
    expect(monthlyTotal(subscriptions)).toBe(10000);
  });

  it('devuelve 0 sin suscripciones', () => {
    expect(monthlyTotal([])).toBe(0);
  });
});

describe('distributionByCategory (FR-021, SC-004)', () => {
  it('reparte 50/50 entre dos categorías con el mismo peso', () => {
    const subscriptions = [
      active({ id: 'a', amount: 6000, category: 'ENTRETENIMIENTO' }),
      active({ id: 'b', amount: 12000, category: 'TRABAJO' }),
    ];
    const distribution = distributionByCategory(subscriptions);

    expect(distribution.map((group) => [group.category, group.percentage])).toEqual([
      ['TRABAJO', 67],
      ['ENTRETENIMIENTO', 33],
    ]);
  });

  it('da el 100% a la categoría que concentra todo el gasto', () => {
    const subscriptions = [
      active({ id: 'a', amount: 15000, category: 'ENTRETENIMIENTO' }),
      active({ id: 'b', amount: 15000, category: 'TRABAJO' }),
    ];
    const distribution = distributionByCategory(subscriptions);

    expect(distribution).toHaveLength(2);
    expect(distribution.reduce((sum, group) => sum + group.percentage, 0)).toBe(100);
  });

  it('aplica el método del resto mayor para que la suma sea exactamente 100', () => {
    const subscriptions = [
      active({ id: 'a', amount: 10000, category: 'ENTRETENIMIENTO' }),
      active({ id: 'b', amount: 10000, category: 'TRABAJO' }),
      active({ id: 'c', amount: 10000, category: 'SALUD' }),
    ];
    const distribution = distributionByCategory(subscriptions);

    expect(distribution.reduce((sum, group) => sum + group.percentage, 0)).toBe(100);
    expect(distribution.map((group) => group.percentage)).toEqual([34, 33, 33]);
  });

  it('mantiene la suma en 100 con muchas categorías desiguales', () => {
    const subscriptions = [
      active({ id: 'a', amount: 1, category: 'ENTRETENIMIENTO' }),
      active({ id: 'b', amount: 1, category: 'TRABAJO' }),
      active({ id: 'c', amount: 1, category: 'SALUD' }),
      active({ id: 'd', amount: 1, category: 'EDUCACION' }),
      active({ id: 'e', amount: 1, category: 'HOGAR' }),
      active({ id: 'f', amount: 1, category: 'UTILIDADES' }),
      active({ id: 'g', amount: 1, category: 'FINANZAS' }),
    ];
    const distribution = distributionByCategory(subscriptions);

    expect(distribution.reduce((sum, group) => sum + group.percentage, 0)).toBe(100);
  });

  it('omite las categorías sin gasto', () => {
    const subscriptions = [
      active({ id: 'a', amount: 15000, category: 'ENTRETENIMIENTO' }),
      paused({ id: 'b', amount: 20000, category: 'TRABAJO' }),
    ];
    const distribution = distributionByCategory(subscriptions);

    expect(distribution.map((group) => group.category)).toEqual(['ENTRETENIMIENTO']);
  });

  it('estandariza antes de repartir, contando la categoría de la suscripción', () => {
    const subscriptions = [
      active({ id: 'a', amount: 12000, frequency: 'ANUAL', category: 'TRABAJO' }),
    ];
    const distribution = distributionByCategory(subscriptions);

    expect(distribution[0].amount).toBe(1000);
    expect(distribution[0].percentage).toBe(100);
    expect(distribution[0].label).toBe('Trabajo');
    expect(distribution[0].subscriptions).toBe(1);
  });

  it('devuelve una distribución vacía sin suscripciones', () => {
    expect(distributionByCategory([])).toEqual([]);
  });
});

describe('annualProjection (FR-022, SC-005)', () => {
  it('suma los cobros mensuales restantes del año: 3 cobros de 15000', () => {
    const subscriptions = [active({ nextChargeDate: '2026-10-05', amount: 15000 })];
    expect(annualProjection(subscriptions, { today: FIXED_TODAY })).toBe(45000);
  });

  it('cuenta un cobro anual una sola vez', () => {
    const subscriptions = [
      active({ nextChargeDate: '2026-12-01', amount: 120000, frequency: 'ANUAL' }),
    ];
    expect(annualProjection(subscriptions, { today: FIXED_TODAY })).toBe(120000);
  });

  it('no cuenta cobros anuales ya vencidos', () => {
    const subscriptions = [
      active({ nextChargeDate: '2026-01-15', amount: 120000, frequency: 'ANUAL' }),
    ];
    expect(annualProjection(subscriptions, { today: FIXED_TODAY })).toBe(0);
  });

  it('acumula varias suscripciones: 45000 + 24000 = 69000', () => {
    const subscriptions = [
      active({ id: 'a', nextChargeDate: '2026-10-05', amount: 15000 }),
      active({ id: 'b', nextChargeDate: '2026-10-20', amount: 8000 }),
    ];
    expect(annualProjection(subscriptions, { today: FIXED_TODAY })).toBe(69000);
  });

  it('excluye las suscripciones pausadas', () => {
    const subscriptions = [paused({ nextChargeDate: '2026-10-10', amount: 25000 })];
    expect(annualProjection(subscriptions, { today: FIXED_TODAY })).toBe(0);
  });

  it('no cuenta cobros más allá del 31 de diciembre', () => {
    const subscriptions = [active({ nextChargeDate: '2026-12-31', amount: 15000 })];
    expect(annualProjection(subscriptions, { today: FIXED_TODAY })).toBe(15000);
  });

  it('exige la fecha de referencia inyectada', () => {
    expect(() => annualProjection([], {})).toThrow(TypeError);
  });

  it('cambia de año de referencia al cambiar la fecha del sistema', () => {
    const subscriptions = [
      active({ nextChargeDate: '2026-12-01', amount: 120000, frequency: 'ANUAL' }),
    ];
    expect(annualProjection(subscriptions, { today: '2026-10-01' })).toBe(120000);
    expect(annualProjection(subscriptions, { today: '2027-01-05' })).toBe(120000);
  });

  it('no cuenta el cobro anual ya superado dentro del mismo año', () => {
    const subscriptions = [
      active({ nextChargeDate: '2027-01-01', amount: 120000, frequency: 'ANUAL' }),
    ];
    expect(annualProjection(subscriptions, { today: '2027-01-05' })).toBe(0);
  });
});

describe('buildMetrics (FR-023, FR-024, FR-026, SC-003, SC-010)', () => {
  it('anualiza multiplicando el total mensual por doce: 15000 + 120000/12 = 300000', () => {
    const subscriptions = [
      active({ id: 'a', amount: 15000, frequency: 'MENSUAL' }),
      active({ id: 'b', amount: 120000, frequency: 'ANUAL' }),
    ];
    expect(buildMetrics(subscriptions, { today: FIXED_TODAY }).annualizedTotal).toBe(300000);
  });

  it('cuenta activas, pausadas, canceladas y totales', () => {
    const subscriptions = [
      active({ id: 'a' }),
      active({ id: 'b' }),
      active({ id: 'c' }),
      paused({ id: 'd' }),
      paused({ id: 'e' }),
      cancelled({ id: 'f' }),
    ];
    expect(buildMetrics(subscriptions, { today: FIXED_TODAY }).counts).toEqual({
      active: 3,
      paused: 2,
      cancelled: 1,
      total: 6,
    });
  });

  it('devuelve todas las métricas en cero sin suscripciones', () => {
    const metrics = buildMetrics([], { today: FIXED_TODAY });

    expect(metrics).toEqual({
      monthlyTotal: 0,
      annualizedTotal: 0,
      annualProjectionTotal: 0,
      distribution: [],
      counts: { active: 0, paused: 0, cancelled: 0, total: 0 },
      isEmpty: true,
      hasMetrics: false,
    });
  });

  it('no produce NaN ni Infinity con la lista vacía', () => {
    const metrics = buildMetrics([], { today: FIXED_TODAY });
    for (const value of [
      metrics.monthlyTotal,
      metrics.annualizedTotal,
      metrics.annualProjectionTotal,
    ]) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it('compone todas las métricas del panel en una sola llamada', () => {
    const subscriptions = [
      active({ id: 'a', amount: 15000, category: 'ENTRETENIMIENTO', nextChargeDate: '2026-10-05' }),
      paused({ id: 'b', amount: 25000, category: 'TRABAJO', nextChargeDate: '2026-10-10' }),
    ];
    const metrics = buildMetrics(subscriptions, { today: FIXED_TODAY });

    expect(metrics.monthlyTotal).toBe(15000);
    expect(metrics.annualizedTotal).toBe(180000);
    expect(metrics.annualProjectionTotal).toBe(45000);
    expect(metrics.distribution).toHaveLength(1);
    expect(metrics.isEmpty).toBe(false);
    expect(metrics.hasMetrics).toBe(true);
  });

  it('recalcula tras una pausa sin requerir recarga', () => {
    const before = [active({ id: 'a', amount: 15000 })];
    const after = [paused({ id: 'a', amount: 15000 })];

    expect(buildMetrics(before, { today: FIXED_TODAY }).monthlyTotal).toBe(15000);
    expect(buildMetrics(after, { today: FIXED_TODAY }).monthlyTotal).toBe(0);
  });
});

describe('Suscripciones canceladas (FR-024, FR-029, FR-039)', () => {
  it('no aportan al gasto real mensual ni al anualizado', () => {
    const metrics = buildMetrics([active({ amount: 15000 }), cancelled({ amount: 99999 })], {
      today: FIXED_TODAY,
    });

    expect(metrics.monthlyTotal).toBe(15000);
    expect(metrics.annualizedTotal).toBe(180000);
  });

  it('no aparecen en la distribución por categoría', () => {
    const metrics = buildMetrics(
      [
        active({ category: 'ENTRETENIMIENTO', amount: 10000 }),
        cancelled({ category: 'SALUD', amount: 50000 }),
      ],
      { today: FIXED_TODAY },
    );

    expect(metrics.distribution).toHaveLength(1);
    expect(metrics.distribution[0].category).toBe('ENTRETENIMIENTO');
  });

  it('no aparecen en la proyección anual', () => {
    const metrics = buildMetrics([active({ amount: 15000 }), cancelled({ amount: 50000 })], {
      today: FIXED_TODAY,
    });

    expect(metrics.annualProjectionTotal).toBe(45000);
  });

  it('el panel no está vacío cuando solo hay canceladas', () => {
    const metrics = buildMetrics([cancelled({ amount: 50000 })], { today: FIXED_TODAY });

    expect(metrics.isEmpty).toBe(false);
    expect(metrics.hasMetrics).toBe(false);
    expect(metrics.monthlyTotal).toBe(0);
    expect(metrics.distribution).toEqual([]);
  });

  it('con todas las canceladas el conteo queda en cero activas y el total no', () => {
    const metrics = buildMetrics([cancelled({ id: 'a' }), cancelled({ id: 'b' })], {
      today: FIXED_TODAY,
    });

    expect(metrics.counts).toEqual({ active: 0, paused: 0, cancelled: 2, total: 2 });
  });
});
