export const FREQUENCIES = {
  MONTHLY: 'MENSUAL',
  YEARLY: 'ANUAL',
};

export const FREQUENCY_LABELS = {
  [FREQUENCIES.MONTHLY]: 'Mensual',
  [FREQUENCIES.YEARLY]: 'Anual',
};

export const FREQUENCY_VALUES = [FREQUENCIES.MONTHLY, FREQUENCIES.YEARLY];

export const STATUS_ACTIVE = 'ACTIVA';

export const STATUS_PAUSED = 'PAUSADA';

export const STATUS_CANCELLED = 'CANCELADA';

export const STATUS_VALUES = [STATUS_ACTIVE, STATUS_PAUSED, STATUS_CANCELLED];

export const STATUS_LABELS = {
  [STATUS_ACTIVE]: 'Activa',
  [STATUS_PAUSED]: 'Pausada',
  [STATUS_CANCELLED]: 'Cancelada',
};

export function isValidFrequency(value) {
  return FREQUENCY_VALUES.includes(value);
}

export function isValidStatus(value) {
  return STATUS_VALUES.includes(value);
}

export function frequencyLabel(value) {
  return FREQUENCY_LABELS[value] ?? value;
}

export function statusLabel(value) {
  return STATUS_LABELS[value] ?? value;
}
