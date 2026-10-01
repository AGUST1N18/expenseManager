import { endOfYear } from '@/domain/dates/endOfYear.js';
import { occurrencesBetween } from '@/domain/subscriptions/occurrences.js';
import { activeSubscriptions } from '@/domain/metrics/distribution.js';

export function annualProjection(subscriptions, { today } = {}) {
  if (typeof today !== 'string') {
    throw new TypeError('annualProjection requiere la fecha de referencia "today"');
  }

  const limit = endOfYear(today);
  let total = 0;

  for (const subscription of activeSubscriptions(subscriptions)) {
    for (const occurrence of occurrencesBetween(subscription, today, limit)) {
      total += occurrence.amount;
    }
  }

  return total;
}
