export const FIXED_TODAY = '2026-10-01';

export const CATEGORY_IDS = {
  entertainment: 'ENTRETENIMIENTO',
  work: 'TRABAJO',
  health: 'SALUD',
  education: 'EDUCACION',
  home: 'HOGAR',
  utilities: 'UTILIDADES',
  finance: 'FINANZAS',
  other: 'OTROS',
};

export const DEFAULT_SUBSCRIPTION = {
  id: 'sub-1',
  name: 'Netflix',
  amount: 15000,
  frequency: 'MENSUAL',
  category: CATEGORY_IDS.entertainment,
  nextChargeDate: '2026-10-05',
  status: 'ACTIVA',
  createdAt: '2026-10-01T12:00:00.000Z',
};

export function makeSubscription(overrides = {}) {
  return { ...DEFAULT_SUBSCRIPTION, ...overrides };
}

export function fixedIdFactory() {
  let counter = 0;
  return () => {
    counter += 1;
    return `sub-${counter}`;
  };
}

export const FIXED_CREATED_AT = '2026-10-01T12:00:00.000Z';

export function fixedNow() {
  return FIXED_CREATED_AT;
}
