import { StorageCorruptedError } from '@/data/errors/StorageError.js';
import { DEFAULT_PREFERENCES, EMPTY_DOCUMENT, SCHEMA_VERSION } from '@/data/storage/migrations.js';

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeSubscription(raw) {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.id !== 'string' || raw.id === '') return null;

  return {
    ...raw,
    lastPaidDate: typeof raw.lastPaidDate === 'string' ? raw.lastPaidDate : null,
    cancelledAt: typeof raw.cancelledAt === 'string' ? raw.cancelledAt : null,
  };
}

export function emptyDocument() {
  return {
    schemaVersion: SCHEMA_VERSION,
    preferences: { ...DEFAULT_PREFERENCES },
    subscriptions: [],
  };
}

export function parseDocument(raw) {
  if (typeof raw !== 'string' || raw === '') {
    return emptyDocument();
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new StorageCorruptedError('La información guardada está dañada', { cause: error });
  }

  if (!isPlainObject(parsed)) {
    throw new StorageCorruptedError(
      'La información guardada tiene un formato que la aplicación no reconoce',
    );
  }

  if (!Number.isInteger(parsed.schemaVersion)) {
    throw new StorageCorruptedError('La información guardada no declara una versión válida');
  }

  if (parsed.schemaVersion > SCHEMA_VERSION) {
    throw new StorageCorruptedError(
      `La información guardada pertenece a una versión más nueva (${parsed.schemaVersion})`,
    );
  }

  if (!Array.isArray(parsed.subscriptions)) {
    throw new StorageCorruptedError(
      'La información guardada no contiene una lista de suscripciones',
    );
  }

  const preferences = isPlainObject(parsed.preferences) ? parsed.preferences : {};
  const subscriptions = parsed.subscriptions
    .map((subscription) => normalizeSubscription(subscription))
    .filter((subscription) => subscription !== null);

  return {
    schemaVersion: parsed.schemaVersion,
    preferences: { ...DEFAULT_PREFERENCES, ...preferences },
    subscriptions,
  };
}

export function serializeDocument(document = {}) {
  return JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    preferences: { ...DEFAULT_PREFERENCES, ...(document.preferences ?? {}) },
    subscriptions: document.subscriptions ?? [],
  });
}

export { EMPTY_DOCUMENT };
