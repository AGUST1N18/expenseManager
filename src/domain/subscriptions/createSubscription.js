import { STATUS_ACTIVE } from '@/domain/catalog/frequencies.js';
import {
  subscriptionError,
  validateSubscription,
} from '@/domain/subscriptions/validateSubscription.js';

export function createSubscription(input, { idFactory, now } = {}) {
  if (typeof idFactory !== 'function') {
    throw new TypeError('createSubscription requiere una función idFactory');
  }
  if (typeof now !== 'function') {
    throw new TypeError('createSubscription requiere una función now');
  }

  const { isValid, errors } = validateSubscription(input);
  if (!isValid) {
    throw subscriptionError('La suscripción no es válida', errors);
  }

  return {
    id: idFactory(),
    name: input.name.trim(),
    amount: input.amount,
    frequency: input.frequency,
    category: input.category,
    nextChargeDate: input.nextChargeDate,
    status: STATUS_ACTIVE,
    lastPaidDate: null,
    cancelledAt: null,
    createdAt: now(),
  };
}
