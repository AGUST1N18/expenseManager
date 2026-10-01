import { describe, expect, it } from 'vitest';
import {
  FREQUENCIES,
  STATUS_ACTIVE,
  STATUS_CANCELLED,
  STATUS_PAUSED,
} from '@/domain/catalog/frequencies.js';
import { cancelSubscription } from '@/domain/subscriptions/cancelSubscription.js';
import { markAsPaid } from '@/domain/subscriptions/markAsPaid.js';
import { nextOccurrenceAfter } from '@/domain/subscriptions/occurrences.js';
import { reactivateSubscription } from '@/domain/subscriptions/reactivateSubscription.js';
import { FIXED_TODAY, makeSubscription } from '../../support/fixtures.js';

const ANUAL = FREQUENCIES.YEARLY;

describe('nextOccurrenceAfter', () => {
  it('devuelve la primera ocurrencia posterior a hoy avanzando al menos un periodo', () => {
    const subscription = makeSubscription({ nextChargeDate: FIXED_TODAY });

    expect(nextOccurrenceAfter(subscription, FIXED_TODAY)).toBe('2026-11-01');
  });

  it('salta al primer cobro futuro cuando la suscripción está atrasada', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-07-15' });

    expect(nextOccurrenceAfter(subscription, FIXED_TODAY)).toBe('2026-10-15');
  });

  it('ajusta al último día del mes cuando el ancla no existe en el destino', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-01-31' });

    expect(nextOccurrenceAfter(subscription, '2026-01-31')).toBe('2026-02-28');
  });

  it('vuelve al día del ancla en el mes siguiente tras el ajuste', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-01-31' });

    expect(nextOccurrenceAfter(subscription, '2026-02-28')).toBe('2026-03-31');
  });

  it('avanza un año completo cuando la frecuencia es anual', () => {
    const subscription = makeSubscription({
      frequency: ANUAL,
      nextChargeDate: '2026-01-15',
    });

    expect(nextOccurrenceAfter(subscription, FIXED_TODAY)).toBe('2027-01-15');
  });

  it('nunca devuelve una fecha ya vencida', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-01-05' });

    const result = nextOccurrenceAfter(subscription, FIXED_TODAY);

    expect(result > FIXED_TODAY).toBe(true);
  });
});

describe('markAsPaid', () => {
  it('avanza un mes y registra la fecha del pago', () => {
    const subscription = makeSubscription({ nextChargeDate: FIXED_TODAY });

    const result = markAsPaid(subscription, { today: FIXED_TODAY });

    expect(result.nextChargeDate).toBe('2026-11-01');
    expect(result.lastPaidDate).toBe(FIXED_TODAY);
  });

  it('avanza un año cuando la frecuencia es anual', () => {
    const subscription = makeSubscription({
      frequency: ANUAL,
      nextChargeDate: '2026-10-01',
    });

    expect(markAsPaid(subscription, { today: FIXED_TODAY }).nextChargeDate).toBe('2027-10-01');
  });

  it('hace saltar un cobro atrasado al primer cobro futuro', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-07-15' });

    const result = markAsPaid(subscription, { today: FIXED_TODAY });

    expect(result.nextChargeDate).toBe('2026-10-15');
    expect(result.lastPaidDate).toBe(FIXED_TODAY);
  });

  it('cuenta como prepago y avanza un periodo si el cobro aún no venció', () => {
    const subscription = makeSubscription({ nextChargeDate: '2026-12-15' });

    expect(markAsPaid(subscription, { today: FIXED_TODAY }).nextChargeDate).toBe('2027-01-15');
  });

  it('conserva el resto de los datos de la suscripción', () => {
    const subscription = makeSubscription({ amount: 18900, category: 'SALUD' });

    const result = markAsPaid(subscription, { today: FIXED_TODAY });

    expect(result).toMatchObject({
      id: subscription.id,
      name: subscription.name,
      amount: 18900,
      frequency: subscription.frequency,
      category: 'SALUD',
      status: STATUS_ACTIVE,
      createdAt: subscription.createdAt,
    });
  });

  it('no muta la suscripción original', () => {
    const subscription = makeSubscription();

    markAsPaid(subscription, { today: FIXED_TODAY });

    expect(subscription.nextChargeDate).toBe('2026-10-05');
    expect(subscription.lastPaidDate).toBeUndefined();
  });

  it('rechaza una suscripción pausada sin tocar el próximo cobro', () => {
    const subscription = makeSubscription({ status: STATUS_PAUSED });

    expect(() => markAsPaid(subscription, { today: FIXED_TODAY })).toThrow(
      /solo se puede marcar como pagada una suscripción activa/i,
    );
    expect(subscription.nextChargeDate).toBe('2026-10-05');
  });

  it('rechaza una suscripción cancelada', () => {
    const subscription = makeSubscription({
      status: STATUS_CANCELLED,
      cancelledAt: '2026-09-01',
    });

    expect(() => markAsPaid(subscription, { today: FIXED_TODAY })).toThrow(
      /solo se puede marcar como pagada una suscripción activa/i,
    );
  });

  it('exige la fecha de referencia', () => {
    expect(() => markAsPaid(makeSubscription())).toThrow(/requiere la fecha de referencia "today"/);
  });
});

describe('cancelSubscription', () => {
  it('deja la suscripción cancelada con su fecha de baja', () => {
    const subscription = makeSubscription();

    const result = cancelSubscription(subscription, { today: FIXED_TODAY });

    expect(result.status).toBe(STATUS_CANCELLED);
    expect(result.cancelledAt).toBe(FIXED_TODAY);
  });

  it('conserva monto, frecuencia, categoría, próximo cobro y fecha de pago', () => {
    const subscription = makeSubscription({
      amount: 360000,
      frequency: ANUAL,
      category: 'TRABAJO',
      lastPaidDate: '2026-09-01',
    });

    const result = cancelSubscription(subscription, { today: FIXED_TODAY });

    expect(result).toMatchObject({
      amount: 360000,
      frequency: ANUAL,
      category: 'TRABAJO',
      nextChargeDate: '2026-10-05',
      lastPaidDate: '2026-09-01',
    });
  });

  it('no muta la suscripción original', () => {
    const subscription = makeSubscription();

    cancelSubscription(subscription, { today: FIXED_TODAY });

    expect(subscription.status).toBe(STATUS_ACTIVE);
    expect(subscription.cancelledAt).toBeUndefined();
  });

  it('rechaza una suscripción ya cancelada', () => {
    const subscription = makeSubscription({
      status: STATUS_CANCELLED,
      cancelledAt: '2026-09-01',
    });

    expect(() => cancelSubscription(subscription, { today: FIXED_TODAY })).toThrow(
      /ya está cancelada/,
    );
  });

  it('permite cancelar una suscripción pausada sin perder su fecha de pago', () => {
    const subscription = makeSubscription({
      status: STATUS_PAUSED,
      lastPaidDate: '2026-09-10',
    });

    const result = cancelSubscription(subscription, { today: FIXED_TODAY });

    expect(result.status).toBe(STATUS_CANCELLED);
    expect(result.lastPaidDate).toBe('2026-09-10');
  });

  it('exige la fecha de referencia', () => {
    expect(() => cancelSubscription(makeSubscription())).toThrow(
      /requiere la fecha de referencia "today"/,
    );
  });
});

describe('reactivateSubscription', () => {
  it('vuelve a activa y elimina la fecha de baja', () => {
    const subscription = makeSubscription({
      status: STATUS_CANCELLED,
      cancelledAt: '2026-10-01',
    });

    const result = reactivateSubscription(subscription);

    expect(result.status).toBe(STATUS_ACTIVE);
    expect(result.cancelledAt).toBeNull();
  });

  it('conserva el próximo cobro y la fecha del último pago', () => {
    const subscription = makeSubscription({
      status: STATUS_CANCELLED,
      cancelledAt: '2026-10-01',
      nextChargeDate: '2026-08-01',
      lastPaidDate: '2026-07-01',
    });

    const result = reactivateSubscription(subscription);

    expect(result.nextChargeDate).toBe('2026-08-01');
    expect(result.lastPaidDate).toBe('2026-07-01');
  });

  it('no muta la suscripción original', () => {
    const subscription = makeSubscription({
      status: STATUS_CANCELLED,
      cancelledAt: '2026-10-01',
    });

    reactivateSubscription(subscription);

    expect(subscription.status).toBe(STATUS_CANCELLED);
    expect(subscription.cancelledAt).toBe('2026-10-01');
  });

  it('rechaza una suscripción activa', () => {
    expect(() => reactivateSubscription(makeSubscription())).toThrow(
      /Solo se puede reactivar una suscripción cancelada/,
    );
  });

  it('rechaza una suscripción pausada', () => {
    expect(() => reactivateSubscription(makeSubscription({ status: STATUS_PAUSED }))).toThrow(
      /Solo se puede reactivar una suscripción cancelada/,
    );
  });
});
