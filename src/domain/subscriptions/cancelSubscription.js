import { STATUS_CANCELLED } from '@/domain/catalog/frequencies.js';
import { subscriptionError } from '@/domain/subscriptions/validateSubscription.js';

export const ALREADY_CANCELLED_ERROR_MESSAGE = 'La suscripción ya está cancelada';

export function cancelSubscription(subscription, { today } = {}) {
  if (typeof today !== 'string') {
    throw new TypeError('cancelSubscription requiere la fecha de referencia "today"');
  }
  if (subscription.status === STATUS_CANCELLED) {
    throw subscriptionError(ALREADY_CANCELLED_ERROR_MESSAGE);
  }

  return {
    ...subscription,
    status: STATUS_CANCELLED,
    cancelledAt: today,
  };
}
