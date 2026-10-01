import { STATUS_ACTIVE, STATUS_CANCELLED } from '@/domain/catalog/frequencies.js';
import { subscriptionError } from '@/domain/subscriptions/validateSubscription.js';

export const NOT_CANCELLED_ERROR_MESSAGE = 'Solo se puede reactivar una suscripción cancelada';

export function reactivateSubscription(subscription) {
  if (subscription.status !== STATUS_CANCELLED) {
    throw subscriptionError(NOT_CANCELLED_ERROR_MESSAGE);
  }

  return {
    ...subscription,
    status: STATUS_ACTIVE,
    cancelledAt: null,
  };
}
