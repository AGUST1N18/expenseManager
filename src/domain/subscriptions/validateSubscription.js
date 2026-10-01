import { isValidCategory } from '@/domain/catalog/categories.js';
import { isValidFrequency, isValidStatus } from '@/domain/catalog/frequencies.js';
import { isValidDate } from '@/domain/dates/parseDate.js';

export const VALIDATION_MESSAGES = {
  nameRequired: 'El nombre es obligatorio',
  nameTooLong: 'El nombre no puede superar 80 caracteres',
  amountInvalid: 'El monto debe ser un número mayor que 0',
  frequencyInvalid: 'Selecciona una frecuencia válida',
  categoryInvalid: 'Selecciona una categoría válida',
  nextChargeDateInvalid: 'Ingresa una fecha válida',
  statusInvalid: 'Selecciona un estado válido',
  systemDateInvalid: 'Ingresa una fecha válida',
};

export const MAX_NAME_LENGTH = 80;

export const SYSTEM_DATE_FIELDS = ['lastPaidDate', 'cancelledAt'];

export const SUBSCRIPTION_ERROR_NAME = 'SubscriptionValidationError';

export function subscriptionError(message, errors = {}) {
  const error = new Error(message);
  error.name = SUBSCRIPTION_ERROR_NAME;
  error.errors = errors;
  return error;
}

export function validateSubscription(input = {}) {
  const errors = {};

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name.length === 0) {
    errors.name = VALIDATION_MESSAGES.nameRequired;
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = VALIDATION_MESSAGES.nameTooLong;
  }

  const amount = input.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    errors.amount = VALIDATION_MESSAGES.amountInvalid;
  }

  if (!isValidFrequency(input.frequency)) {
    errors.frequency = VALIDATION_MESSAGES.frequencyInvalid;
  }

  if (!isValidCategory(input.category)) {
    errors.category = VALIDATION_MESSAGES.categoryInvalid;
  }

  if (!isValidDate(input.nextChargeDate)) {
    errors.nextChargeDate = VALIDATION_MESSAGES.nextChargeDateInvalid;
  }

  if (input.status !== undefined && !isValidStatus(input.status)) {
    errors.status = VALIDATION_MESSAGES.statusInvalid;
  }

  for (const field of SYSTEM_DATE_FIELDS) {
    const value = input[field];
    if (value !== undefined && value !== null && !isValidDate(value)) {
      errors[field] = VALIDATION_MESSAGES.systemDateInvalid;
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
