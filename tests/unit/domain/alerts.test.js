import { describe, expect, it } from 'vitest';
import { FIXED_TODAY, makeSubscription } from '../../support/fixtures.js';
import { describeRenewal } from '@/domain/alerts/describeRenewal.js';
import { upcomingRenewals } from '@/domain/alerts/upcomingRenewals.js';

const active = (overrides) => makeSubscription({ status: 'ACTIVA', ...overrides });
const paused = (overrides) => makeSubscription({ status: 'PAUSADA', ...overrides });
const cancelled = (overrides) =>
  makeSubscription({ status: 'CANCELADA', cancelledAt: '2026-09-01', ...overrides });

describe('upcomingRenewals (FR-027 a FR-032)', () => {
  it('incluye el cobro de hoy con 0 días restantes', () => {
    const alerts = upcomingRenewals([active({ nextChargeDate: '2026-10-01' })], {
      today: FIXED_TODAY,
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].daysRemaining).toBe(0);
    expect(alerts[0].name).toBe('Netflix');
  });

  it('incluye un cobro a 4 días', () => {
    const alerts = upcomingRenewals([active({ nextChargeDate: '2026-10-05' })], {
      today: FIXED_TODAY,
    });
    expect(alerts[0].daysRemaining).toBe(4);
  });

  it('incluye el último día de la ventana, a 7 días', () => {
    const alerts = upcomingRenewals([active({ nextChargeDate: '2026-10-08' })], {
      today: FIXED_TODAY,
    });
    expect(alerts[0].daysRemaining).toBe(7);
  });

  it('excluye un cobro a 8 días', () => {
    const alerts = upcomingRenewals([active({ nextChargeDate: '2026-10-09' })], {
      today: FIXED_TODAY,
    });
    expect(alerts).toEqual([]);
  });

  it('excluye un cobro lejano de tres meses', () => {
    const alerts = upcomingRenewals([active({ nextChargeDate: '2027-03-01' })], {
      today: FIXED_TODAY,
    });
    expect(alerts).toEqual([]);
  });

  it('excluye los cobros ya vencidos', () => {
    const alerts = upcomingRenewals([active({ nextChargeDate: '2026-09-05' })], {
      today: FIXED_TODAY,
    });
    expect(alerts).toEqual([]);
  });

  it('muestra el monto, la fecha y los días restantes', () => {
    const alerts = upcomingRenewals(
      [
        active({
          name: 'Adobe CC',
          amount: 360000,
          frequency: 'ANUAL',
          nextChargeDate: '2026-10-05',
        }),
      ],
      { today: FIXED_TODAY },
    );

    expect(alerts[0]).toMatchObject({
      name: 'Adobe CC',
      amount: 360000,
      chargeDate: '2026-10-05',
      daysRemaining: 4,
    });
  });

  it('excluye las suscripciones pausadas', () => {
    const alerts = upcomingRenewals([paused({ name: 'Gimnasio', nextChargeDate: '2026-10-03' })], {
      today: FIXED_TODAY,
    });
    expect(alerts).toEqual([]);
  });

  it('excluye las suscripciones canceladas aunque su cobro caiga en la ventana', () => {
    const alerts = upcomingRenewals(
      [cancelled({ name: 'HBO Max', nextChargeDate: '2026-10-03' })],
      { today: FIXED_TODAY },
    );
    expect(alerts).toEqual([]);
  });

  it('ordena por fecha de cobro ascendente', () => {
    const alerts = upcomingRenewals(
      [
        active({ id: 'a', name: 'Netflix', nextChargeDate: '2026-10-07' }),
        active({ id: 'b', name: 'Spotify', nextChargeDate: '2026-10-03' }),
      ],
      { today: FIXED_TODAY },
    );

    expect(alerts.map((alert) => alert.name)).toEqual(['Spotify', 'Netflix']);
  });

  it('devuelve una lista vacía sin cobros próximos', () => {
    const alerts = upcomingRenewals(
      [
        active({ id: 'a', nextChargeDate: '2026-10-25' }),
        active({ id: 'b', nextChargeDate: '2026-10-28' }),
      ],
      { today: FIXED_TODAY },
    );
    expect(alerts).toEqual([]);
  });

  it('recalcula el día del cobro cuando cambia la fecha del sistema (FR-032)', () => {
    const subscription = active({ nextChargeDate: '2026-10-05' });

    expect(upcomingRenewals([subscription], { today: '2026-10-01' })[0].daysRemaining).toBe(4);
    expect(upcomingRenewals([subscription], { today: '2026-10-05' })[0].daysRemaining).toBe(0);
    expect(describeRenewal(upcomingRenewals([subscription], { today: '2026-10-05' })[0])).toBe(
      'Cobra hoy',
    );
  });

  it('acepta una ventana distinta a siete días', () => {
    const subscriptions = [active({ nextChargeDate: '2026-10-15' })];

    expect(upcomingRenewals(subscriptions, { today: FIXED_TODAY })).toEqual([]);
    expect(upcomingRenewals(subscriptions, { today: FIXED_TODAY, windowDays: 30 })).toHaveLength(1);
  });

  it('devuelve vacío sin suscripciones y exige la fecha de referencia', () => {
    expect(upcomingRenewals([], { today: FIXED_TODAY })).toEqual([]);
    expect(() => upcomingRenewals([], {})).toThrow(TypeError);
  });
});

describe('describeRenewal (FR-028, FR-032)', () => {
  it('anuncia el cobro de hoy', () => {
    expect(describeRenewal({ daysRemaining: 0 })).toBe('Cobra hoy');
  });

  it('anuncia el cobro de mañana', () => {
    expect(describeRenewal({ daysRemaining: 1 })).toBe('Cobra mañana');
  });

  it('anuncia el cobro en varios días', () => {
    expect(describeRenewal({ daysRemaining: 4 })).toBe('Cobra en 4 días');
    expect(describeRenewal({ daysRemaining: 7 })).toBe('Cobra en 7 días');
  });

  it('avisa del cobro atrasado', () => {
    expect(describeRenewal({ daysRemaining: -3 })).toBe('Cobro atrasado');
  });
});
