import { STATUS_ACTIVE } from '@/domain/catalog/frequencies.js';
import { categoryLabel } from '@/domain/catalog/categories.js';
import { diffDays } from '@/domain/dates/diffDays.js';

export const DEFAULT_WINDOW_DAYS = 7;

export function upcomingRenewals(
  subscriptions = [],
  { today, windowDays = DEFAULT_WINDOW_DAYS } = {},
) {
  if (typeof today !== 'string') {
    throw new TypeError('upcomingRenewals requiere la fecha de referencia "today"');
  }

  return subscriptions
    .filter((subscription) => subscription.status === STATUS_ACTIVE)
    .filter((subscription) => diffDays(today, subscription.nextChargeDate) >= 0)
    .map((subscription) => ({
      id: subscription.id,
      name: subscription.name,
      amount: subscription.amount,
      frequency: subscription.frequency,
      category: subscription.category,
      categoryLabel: categoryLabel(subscription.category),
      chargeDate: subscription.nextChargeDate,
      daysRemaining: diffDays(today, subscription.nextChargeDate),
    }))
    .filter((alert) => alert.daysRemaining <= windowDays)
    .sort((a, b) => a.chargeDate.localeCompare(b.chargeDate));
}
