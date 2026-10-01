import { STATUS_ACTIVE } from '@/domain/catalog/frequencies.js';
import { categoryLabel } from '@/domain/catalog/categories.js';
import { monthlyEquivalent } from '@/domain/metrics/monthlyEquivalent.js';

export function activeSubscriptions(subscriptions) {
  return subscriptions.filter((subscription) => subscription.status === STATUS_ACTIVE);
}

export function distributionByCategory(subscriptions) {
  const totals = new Map();

  for (const subscription of activeSubscriptions(subscriptions)) {
    const monthly = monthlyEquivalent(subscription.amount, subscription.frequency);
    const current = totals.get(subscription.category) ?? { amount: 0, subscriptions: 0 };
    current.amount += monthly;
    current.subscriptions += 1;
    totals.set(subscription.category, current);
  }

  const groups = [...totals.entries()]
    .filter(([, total]) => total.amount > 0)
    .map(([category, total]) => ({
      category,
      label: categoryLabel(category),
      amount: total.amount,
      subscriptions: total.subscriptions,
      exactPercentage: 0,
      percentage: 0,
    }))
    .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label, 'es'));

  const total = groups.reduce((sum, group) => sum + group.amount, 0);
  if (total === 0) return [];

  const assigned = groups.reduce((sum, group) => {
    group.exactPercentage = (group.amount / total) * 100;
    group.percentage = Math.floor(group.exactPercentage);
    return sum + group.percentage;
  }, 0);

  const byRemainder = [...groups].sort(
    (a, b) =>
      b.exactPercentage -
        Math.floor(b.exactPercentage) -
        (a.exactPercentage - Math.floor(a.exactPercentage)) ||
      b.amount - a.amount ||
      a.label.localeCompare(b.label, 'es'),
  );

  let pointsLeft = 100 - assigned;
  for (const group of byRemainder) {
    if (pointsLeft <= 0) break;
    group.percentage += 1;
    pointsLeft -= 1;
  }

  return groups;
}
