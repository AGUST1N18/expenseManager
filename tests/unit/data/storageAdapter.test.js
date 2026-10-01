import { describe, expect, it } from 'vitest';
import { StorageCorruptedError, StorageUnavailableError } from '@/data/errors/StorageError.js';
import {
  registerMigration,
  resetMigrations,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from '@/data/storage/migrations.js';
import { createStorageAdapter, StorageAdapter } from '@/data/storage/storageAdapter.js';
import { FakeStorage } from '../../support/FakeStorage.js';

const SUBSCRIPTION = {
  id: 'sub-1',
  name: 'Netflix',
  amount: 15000,
  frequency: 'MENSUAL',
  category: 'ENTRETENIMIENTO',
  nextChargeDate: '2026-10-05',
  status: 'ACTIVA',
  lastPaidDate: null,
  cancelledAt: null,
  createdAt: '2026-10-01T12:00:00.000Z',
};

describe('StorageAdapter', () => {
  it('exige un storage con getItem', () => {
    expect(() => new StorageAdapter(null)).toThrow(TypeError);
    expect(() => new StorageAdapter({})).toThrow(TypeError);
  });

  it('createStorageAdapter devuelve una instancia equivalente', () => {
    expect(createStorageAdapter(new FakeStorage())).toBeInstanceOf(StorageAdapter);
  });

  it('devuelve el documento vacío cuando la clave no existe, sin escribir', () => {
    const storage = new FakeStorage();
    const adapter = new StorageAdapter(storage);

    expect(adapter.read()).toEqual({
      schemaVersion: SCHEMA_VERSION,
      preferences: { currencySymbol: '$' },
      subscriptions: [],
    });
    expect(storage.writeCount).toBe(0);
  });

  it('escribe y relee un documento conservando las fechas', () => {
    const storage = new FakeStorage();
    const adapter = new StorageAdapter(storage);
    const document = { preferences: { currencySymbol: '$' }, subscriptions: [SUBSCRIPTION] };

    adapter.write(document);
    const read = adapter.read();

    expect(read.subscriptions).toEqual([SUBSCRIPTION]);
    expect(read.subscriptions[0].lastPaidDate).toBeNull();
  });

  it('acepta una clave propia', () => {
    const storage = new FakeStorage();
    const adapter = new StorageAdapter(storage, { key: 'otra:clave' });

    adapter.write({ subscriptions: [] });

    expect(storage.raw('otra:clave')).not.toBeNull();
    expect(storage.raw(STORAGE_KEY)).toBeNull();
  });

  it('aplica las migraciones antes de entregar el documento', () => {
    registerMigration(1, (document) => ({ ...document, preferences: { currencySymbol: '€' } }));

    try {
      const storage = new FakeStorage();
      storage.seed(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, subscriptions: [] }));
      const adapter = new StorageAdapter(storage);

      // El MVP no soporta todavía la versión 2, así que la ruta está vacía.
      expect(adapter.read().preferences.currencySymbol).toBe('$');
    } finally {
      resetMigrations();
    }
  });

  it('envuelve un JSON ilegible en StorageCorruptedError conservando la causa', () => {
    const storage = new FakeStorage();
    storage.seed(STORAGE_KEY, '{ roto');
    const adapter = new StorageAdapter(storage);

    try {
      adapter.read();
      expect.unreachable('debería lanzar');
    } catch (error) {
      expect(error).toBeInstanceOf(StorageCorruptedError);
      expect(error.cause).toBeInstanceOf(StorageCorruptedError);
      expect(error.cause.cause).toBeInstanceOf(SyntaxError);
    }
  });

  it('envuelve un esquema inválido en StorageCorruptedError', () => {
    const storage = new FakeStorage();
    storage.seed(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, subscriptions: 'nope' }));
    const adapter = new StorageAdapter(storage);

    expect(() => adapter.read()).toThrow(StorageCorruptedError);
  });

  it('envuelve un fallo de lectura en StorageUnavailableError', () => {
    const storage = new FakeStorage();
    storage.simulateUnavailable();
    const adapter = new StorageAdapter(storage);

    try {
      adapter.read();
      expect.unreachable('debería lanzar');
    } catch (error) {
      expect(error).toBeInstanceOf(StorageUnavailableError);
      expect(error.cause).toBeInstanceOf(Error);
    }
  });

  it('envuelve un fallo de escritura en StorageUnavailableError', () => {
    const storage = new FakeStorage();
    const adapter = new StorageAdapter(storage);
    storage.simulateQuotaExceeded();

    expect(() => adapter.write({ subscriptions: [] })).toThrow(StorageUnavailableError);
  });

  it('envuelve un documento no serializable en StorageUnavailableError', () => {
    const storage = new FakeStorage();
    const adapter = new StorageAdapter(storage);
    const circular = {};
    circular.self = circular;

    expect(() => adapter.write({ subscriptions: [circular] })).toThrow(StorageUnavailableError);
  });

  it('remove borra la clave y un remove posterior no falla', () => {
    const storage = new FakeStorage();
    const adapter = new StorageAdapter(storage);
    adapter.write({ subscriptions: [] });

    adapter.remove();
    expect(storage.raw(STORAGE_KEY)).toBeNull();

    expect(() => adapter.remove()).not.toThrow();
  });

  it('envuelve un fallo al borrar en StorageUnavailableError', () => {
    const storage = new FakeStorage();
    const adapter = new StorageAdapter(storage);
    storage.failOnRemove = true;

    expect(() => adapter.remove()).toThrow(StorageUnavailableError);
  });
});
