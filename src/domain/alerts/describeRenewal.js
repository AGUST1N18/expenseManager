export function describeRenewal({ daysRemaining }) {
  if (daysRemaining < 0) return 'Cobro atrasado';
  if (daysRemaining === 0) return 'Cobra hoy';
  if (daysRemaining === 1) return 'Cobra mañana';
  return `Cobra en ${daysRemaining} días`;
}
