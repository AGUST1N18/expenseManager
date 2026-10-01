import { describe, expect, it } from 'vitest';
import { fixedIdFactory, fixedNow, FIXED_TODAY, makeSubscription } from '../../support/fixtures.js';
import { applyChanges, EDITABLE_FIELDS } from '@/domain/subscriptions/applyChanges.js';
import { createSubscription } from '@/domain/subscriptions/createSubscription.js';

const validInput = {
  name: 'Netflix',
  amount: 15000,
  frequency: 'MENSUAL',
  category: 'ENTRETENIMIENTO',
  nextChargeDate: '2026-10-05',
};

const injected = () => ({ idFactory: fixedIdFactory(), now: () => `${FIXED_TODAY}T12:00:00.000Z` });

describe('createSubscription (FR-001, FR-006, FR-007)', () => {
  it('crea la suscripción con estado inicial Activa y fecha de registro', () => {
    const subscription = createSubscription(validInput, injected());

    expect(subscription).toEqual({
      id: 'sub-1',
      name: 'Netflix',
      amount: 15000,
      frequency: 'MENSUAL',
      category: 'ENTRETENIMIENTO',
      nextChargeDate: '2026-10-05',
      status: 'ACTIVA',
      lastPaidDate: null,
      cancelledAt: null,
      createdAt: '2026-10-01T12:00:00.000Z',
    });
  });

  it('usa el identificador inyectado y nunca uno propio', () => {
    const subscription = createSubscription(validInput, {
      idFactory: () => 'uuid-fijado',
      now: () => '2026-10-01T00:00:00.000Z',
    });

    expect(subscription.id).toBe('uuid-fijado');
  });

  it('genera identificadores distintos en cada llamada', () => {
    const idFactory = fixedIdFactory();
    const now = () => '2026-10-01T12:00:00.000Z';
    const first = createSubscription(validInput, { idFactory, now });
    const second = createSubscription({ ...validInput, name: 'Spotify' }, { idFactory, now });

    expect(first.id).not.toBe(second.id);
  });

  it('normaliza el nombre recortando espacios', () => {
    const subscription = createSubscription({ ...validInput, name: '  Netflix  ' }, injected());
    expect(subscription.name).toBe('Netflix');
  });

  it('rechaza datos inválidos y expone los errores por campo', () => {
    expect(() => createSubscription({ ...validInput, amount: 0 }, injected())).toThrow(
      'La suscripción no es válida',
    );

    try {
      createSubscription({ ...validInput, name: '' }, injected());
      expect.unreachable('debería lanzar');
    } catch (error) {
      expect(error.name).toBe('SubscriptionValidationError');
      expect(error.errors.name).toBe('El nombre es obligatorio');
    }
  });

  it('exige que idFactory y now se inyecten', () => {
    expect(() => createSubscription(validInput)).toThrow(TypeError);
    expect(() => createSubscription(validInput, { idFactory: () => 'x' })).toThrow(TypeError);
    expect(() => createSubscription(validInput, { now: () => 'x' })).toThrow(TypeError);
  });
});

describe('applyChanges (FR-008, FR-009)', () => {
  const subscription = makeSubscription();

  it('aplica un cambio de monto conservando id, status y createdAt', () => {
    const updated = applyChanges(subscription, { amount: 18900 });

    expect(updated.amount).toBe(18900);
    expect(updated.id).toBe(subscription.id);
    expect(updated.status).toBe(subscription.status);
    expect(updated.createdAt).toBe(subscription.createdAt);
  });

  it('no reinicia el estado al editar una suscripción pausada', () => {
    const paused = makeSubscription({ status: 'PAUSADA' });
    const updated = applyChanges(paused, { amount: 18900 });
    expect(updated.status).toBe('PAUSADA');
  });

  it('aplica todos los campos editables', () => {
    const changes = {
      name: '  Adobe CC  ',
      amount: 360000,
      frequency: 'ANUAL',
      category: 'TRABAJO',
      nextChargeDate: '2026-12-01',
    };
    const updated = applyChanges(subscription, changes);

    expect(EDITABLE_FIELDS).toEqual(['name', 'amount', 'frequency', 'category', 'nextChargeDate']);
    expect(updated).toEqual({ ...subscription, ...changes, name: 'Adobe CC' });
  });

  it('ignora campos que no son editables', () => {
    const updated = applyChanges(subscription, {
      id: 'otro-id',
      status: 'PAUSADA',
      createdAt: '2030-01-01T00:00:00.000Z',
      nombre: 'campo inventado',
    });

    expect(updated).toEqual(subscription);
  });

  it('no muta la suscripción original', () => {
    const original = makeSubscription();
    applyChanges(original, { amount: 1 });
    expect(original.amount).toBe(15000);
  });

  it('devuelve una copia sin cambios cuando no recibe cambios', () => {
    const updated = applyChanges(subscription, {});
    expect(updated).toEqual(subscription);
    expect(updated).not.toBe(subscription);
  });
});

describe('Fechas de sistema en createSubscription (FR-037, FR-039)', () => {
  it('inicializa la fecha de pago y la de baja en null', () => {
    const created = createSubscription(validInput, {
      idFactory: fixedIdFactory(),
      now: fixedNow,
    });

    expect(created.lastPaidDate).toBeNull();
    expect(created.cancelledAt).toBeNull();
  });

  it('ignora fechas de sistema que venga en la entrada', () => {
    const created = createSubscription(
      { ...validInput, lastPaidDate: '2020-01-01', cancelledAt: '2020-01-02' },
      { idFactory: fixedIdFactory(), now: fixedNow },
    );

    expect(created.lastPaidDate).toBeNull();
    expect(created.cancelledAt).toBeNull();
  });
});

describe('Campos de sistema fuera de la edición (FR-008, FR-037, FR-039)', () => {
  const base = {
    ...makeSubscription(),
    lastPaidDate: '2026-09-01',
    cancelledAt: null,
  };

  it('no incluye el estado ni las fechas de sistema entre los campos editables', () => {
    expect(EDITABLE_FIELDS).not.toContain('status');
    expect(EDITABLE_FIELDS).not.toContain('lastPaidDate');
    expect(EDITABLE_FIELDS).not.toContain('cancelledAt');
    expect(EDITABLE_FIELDS).toEqual(['name', 'amount', 'frequency', 'category', 'nextChargeDate']);
  });

  it('ignora un parche que intenta cambiar el estado', () => {
    expect(applyChanges(base, { status: 'CANCELADA' }).status).toBe('ACTIVA');
  });

  it('ignora un parche que intenta cambiar la fecha de pago o la de baja', () => {
    const result = applyChanges(base, { lastPaidDate: '2026-10-10', cancelledAt: '2026-10-10' });

    expect(result.lastPaidDate).toBe('2026-09-01');
    expect(result.cancelledAt).toBeNull();
  });

  it('sí aplica los campos editables y conserva el resto', () => {
    const result = applyChanges(base, { name: '  Netflix Premium  ', amount: 21000 });

    expect(result.name).toBe('Netflix Premium');
    expect(result.amount).toBe(21000);
    expect(result.lastPaidDate).toBe('2026-09-01');
    expect(result.status).toBe('ACTIVA');
  });
});
