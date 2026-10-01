import { describe, expect, it } from 'vitest';
import { CATEGORY_IDS } from '../../support/fixtures.js';
import {
  SUBSCRIPTION_ERROR_NAME,
  VALIDATION_MESSAGES,
  subscriptionError,
  validateSubscription,
} from '@/domain/subscriptions/validateSubscription.js';

const validInput = {
  name: 'Netflix',
  amount: 15000,
  frequency: 'MENSUAL',
  category: CATEGORY_IDS.entertainment,
  nextChargeDate: '2026-10-05',
};

describe('validateSubscription (FR-001 a FR-004, FR-010)', () => {
  it('acepta un conjunto válido de datos', () => {
    expect(validateSubscription(validInput)).toEqual({ isValid: true, errors: {} });
  });

  it('rechaza el nombre vacío y el nombre solo con espacios', () => {
    expect(validateSubscription({ ...validInput, name: '' }).errors.name).toBe(
      VALIDATION_MESSAGES.nameRequired,
    );
    expect(validateSubscription({ ...validInput, name: '   ' }).errors.name).toBe(
      VALIDATION_MESSAGES.nameRequired,
    );
  });

  it('rechaza un nombre demasiado largo', () => {
    const name = 'a'.repeat(81);
    expect(validateSubscription({ ...validInput, name }).errors.name).toBe(
      VALIDATION_MESSAGES.nameTooLong,
    );
  });

  it('rechaza el monto 0, el negativo y el no numérico', () => {
    expect(validateSubscription({ ...validInput, amount: 0 }).errors.amount).toBe(
      VALIDATION_MESSAGES.amountInvalid,
    );
    expect(validateSubscription({ ...validInput, amount: -500 }).errors.amount).toBe(
      VALIDATION_MESSAGES.amountInvalid,
    );
    expect(validateSubscription({ ...validInput, amount: '15000' }).errors.amount).toBe(
      VALIDATION_MESSAGES.amountInvalid,
    );
    expect(validateSubscription({ ...validInput, amount: Number.NaN }).errors.amount).toBe(
      VALIDATION_MESSAGES.amountInvalid,
    );
    expect(
      validateSubscription({ ...validInput, amount: Number.POSITIVE_INFINITY }).errors.amount,
    ).toBe(VALIDATION_MESSAGES.amountInvalid);
    expect(validateSubscription({ ...validInput, amount: undefined }).errors.amount).toBe(
      VALIDATION_MESSAGES.amountInvalid,
    );
  });

  it('acepta un monto decimal positivo', () => {
    expect(validateSubscription({ ...validInput, amount: 1599.99 }).isValid).toBe(true);
  });

  it('rechaza una frecuencia fuera del conjunto cerrado', () => {
    expect(validateSubscription({ ...validInput, frequency: 'SEMANAL' }).errors.frequency).toBe(
      VALIDATION_MESSAGES.frequencyInvalid,
    );
    expect(validateSubscription({ ...validInput, frequency: undefined }).errors.frequency).toBe(
      VALIDATION_MESSAGES.frequencyInvalid,
    );
  });

  it('rechaza una categoría fuera del catálogo', () => {
    expect(validateSubscription({ ...validInput, category: 'DEPORTES' }).errors.category).toBe(
      VALIDATION_MESSAGES.categoryInvalid,
    );
    expect(validateSubscription({ ...validInput, category: undefined }).errors.category).toBe(
      VALIDATION_MESSAGES.categoryInvalid,
    );
  });

  it('rechaza una fecha inválida', () => {
    expect(
      validateSubscription({ ...validInput, nextChargeDate: '2026-02-30' }).errors.nextChargeDate,
    ).toBe(VALIDATION_MESSAGES.nextChargeDateInvalid);
    expect(
      validateSubscription({ ...validInput, nextChargeDate: '05/10/2026' }).errors.nextChargeDate,
    ).toBe(VALIDATION_MESSAGES.nextChargeDateInvalid);
  });

  it('devuelve todos los errores de una vez, con un mensaje por campo', () => {
    const result = validateSubscription({
      name: '',
      amount: 0,
      frequency: 'SEMANAL',
      category: 'DEPORTES',
      nextChargeDate: 'ayer',
    });

    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual([
      'amount',
      'category',
      'frequency',
      'name',
      'nextChargeDate',
    ]);
    for (const message of Object.values(result.errors)) {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it('no muta la entrada recibida', () => {
    const input = { ...validInput };
    validateSubscription({ ...input, amount: -1 });
    expect(input).toEqual(validInput);
  });

  it('valida una entrada vacía sin lanzar', () => {
    const result = validateSubscription({});
    expect(result.isValid).toBe(false);
    expect(validateSubscription().isValid).toBe(false);
  });
});

describe('Estado y fechas de sistema (FR-006, FR-038, FR-039)', () => {
  it('acepta los tres estados del ciclo de vida', () => {
    for (const status of ['ACTIVA', 'PAUSADA', 'CANCELADA']) {
      expect(validateSubscription({ ...validInput, status }).isValid).toBe(true);
    }
  });

  it('rechaza un estado fuera del catálogo', () => {
    expect(validateSubscription({ ...validInput, status: 'BAJADA' }).errors.status).toBe(
      VALIDATION_MESSAGES.statusInvalid,
    );
  });

  it('rechaza una fecha de pago inválida', () => {
    expect(
      validateSubscription({ ...validInput, lastPaidDate: '2026-02-30' }).errors.lastPaidDate,
    ).toBe(VALIDATION_MESSAGES.systemDateInvalid);
  });

  it('rechaza una fecha de baja inválida', () => {
    expect(validateSubscription({ ...validInput, cancelledAt: 'ayer' }).errors.cancelledAt).toBe(
      VALIDATION_MESSAGES.systemDateInvalid,
    );
  });

  it('acepta las fechas de sistema ausentes o nulas', () => {
    for (const value of [undefined, null]) {
      const result = validateSubscription({
        ...validInput,
        lastPaidDate: value,
        cancelledAt: value,
      });
      expect(result.isValid).toBe(true);
    }
  });

  it('no exige las fechas de sistema para validar un alta', () => {
    expect(validateSubscription(validInput).isValid).toBe(true);
  });

  it('acumula errores de estado y de fechas de sistema', () => {
    const result = validateSubscription({
      ...validInput,
      status: 'X',
      lastPaidDate: '2026-13-01',
      cancelledAt: '2026-13-02',
    });

    expect(Object.keys(result.errors).sort()).toEqual(['cancelledAt', 'lastPaidDate', 'status']);
  });
});

describe('subscriptionError', () => {
  it('expone el nombre de dominio y los errores por campo', () => {
    const error = subscriptionError('La suscripción no es válida', { name: 'Obligatorio' });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(SUBSCRIPTION_ERROR_NAME);
    expect(error.message).toBe('La suscripción no es válida');
    expect(error.errors).toEqual({ name: 'Obligatorio' });
  });

  it('deja los errores vacíos cuando no se pasan', () => {
    expect(subscriptionError('Algo falló').errors).toEqual({});
  });
});
