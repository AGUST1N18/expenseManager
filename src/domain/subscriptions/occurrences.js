import { addMonths } from '@/domain/dates/addMonths.js';
import { FREQUENCIES } from '@/domain/catalog/frequencies.js';

const MONTHS_PER_PERIOD = {
  [FREQUENCIES.MONTHLY]: 1,
  [FREQUENCIES.YEARLY]: 12,
};

export function periodInMonths(frequency) {
  const months = MONTHS_PER_PERIOD[frequency];
  if (months === undefined) {
    throw new Error(`Frecuencia no reconocida para calcular ocurrencias: "${frequency}"`);
  }
  return months;
}

export function nextOccurrence(subscription, fromIso) {
  const step = periodInMonths(subscription.frequency);
  const anchor = subscription.nextChargeDate;
  let periods = 0;

  while (true) {
    const candidate = addMonths(anchor, periods * step);
    if (candidate > fromIso) return candidate;
    periods += 1;
  }
}

export function nextOccurrenceAfter(subscription, fromIso) {
  const step = periodInMonths(subscription.frequency);
  const anchor = subscription.nextChargeDate;
  let periods = 1;

  while (true) {
    const candidate = addMonths(anchor, periods * step);
    if (candidate > fromIso) return candidate;
    periods += 1;
  }
}

export function occurrencesBetween(subscription, fromIso, toIso) {
  const step = periodInMonths(subscription.frequency);
  const anchor = subscription.nextChargeDate;
  const occurrences = [];
  let periods = 0;

  while (addMonths(anchor, periods * step) < fromIso) {
    periods += 1;
  }

  while (true) {
    const candidate = addMonths(anchor, periods * step);
    if (candidate > toIso) return occurrences;
    occurrences.push({ date: candidate, amount: subscription.amount });
    periods += 1;
  }
}

export function isOverdue(subscription, todayIso) {
  return subscription.nextChargeDate < todayIso;
}
