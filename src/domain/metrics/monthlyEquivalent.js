import { FREQUENCIES } from '@/domain/catalog/frequencies.js';

export function monthlyEquivalent(amount, frequency) {
  if (frequency === FREQUENCIES.MONTHLY) return amount;
  if (frequency === FREQUENCIES.YEARLY) return amount / 12;
  throw new Error(`Frecuencia no reconocida para mensualizar: "${frequency}"`);
}
