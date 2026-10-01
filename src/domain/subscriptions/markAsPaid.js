import { STATUS_ACTIVE } from '@/domain/catalog/frequencies.js';
import { nextOccurrenceAfter } from '@/domain/subscriptions/occurrences.js';
import { subscriptionError } from '@/domain/subscriptions/validateSubscription.js';

export const PAYMENT_ERROR_MESSAGE = 'Solo se puede marcar como pagada una suscripción activa';

export function markAsPaid(subscription, { today } = {}) {
  if (typeof today !== 'string') {
    throw new TypeError('markAsPaid requiere la fecha de referencia "today"');
  }
  if (subscription.status !== STATUS_ACTIVE) {
    throw subscriptionError(PAYMENT_ERROR_MESSAGE);
  }

  return {
    ...subscription,
    nextChargeDate: nextOccurrenceAfter(subscription, today),
    lastPaidDate: today,
  };
}
