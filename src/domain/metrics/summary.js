import { STATUS_CANCELLED, STATUS_PAUSED } from '@/domain/catalog/frequencies.js';
import { annualProjection } from '@/domain/metrics/annualProjection.js';
import { activeSubscriptions, distributionByCategory } from '@/domain/metrics/distribution.js';
import { monthlyEquivalent } from '@/domain/metrics/monthlyEquivalent.js';

export function monthlyTotal(subscriptions) {
  return activeSubscriptions(subscriptions).reduce(
    (total, subscription) => total + monthlyEquivalent(subscription.amount, subscription.frequency),
    0,
  );
}

export function buildMetrics(subscriptions = [], { today } = {}) {
  const active = activeSubscriptions(subscriptions);
  const paused = subscriptions.filter((subscription) => subscription.status === STATUS_PAUSED);
  const cancelled = subscriptions.filter(
    (subscription) => subscription.status === STATUS_CANCELLED,
  );
  const monthly = monthlyTotal(subscriptions);

  return {
    monthlyTotal: monthly,
    annualizedTotal: monthly * 12,
    annualProjectionTotal: annualProjection(subscriptions, { today }),
    distribution: distributionByCategory(subscriptions),
    counts: {
      active: active.length,
      paused: paused.length,
      cancelled: cancelled.length,
      total: subscriptions.length,
    },
    isEmpty: subscriptions.length === 0,
    hasMetrics: monthly > 0,
  };
}
