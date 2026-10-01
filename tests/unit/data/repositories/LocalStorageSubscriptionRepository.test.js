import { beforeEach, describe, expect, it } from 'vitest';
import { StorageCorruptedError, StorageUnavailableError } from '@/data/errors/StorageError.js';
import { LocalStorageSubscriptionRepository } from '@/data/repositories/LocalStorageSubscriptionRepository.js';
import { isSubscriptionRepository } from '@/data/repositories/SubscriptionRepository.js';
import { STORAGE_KEY } from '@/data/storage/migrations.js';
import { repositoryContract } from '../../../contract/repositoryContract.suite.js';
import { FakeStorage } from '../../../support/FakeStorage.js';

const FIXED_NOW = '2026-10-01T12:00:00.000Z';

function createRepository(storage = new FakeStorage()) {
  let counter = 0;
  return new LocalStorageSubscriptionRepository(storage, {
    idFactory: () => `sub-${++counter}`,
    now: () => FIXED_NOW,
  });
}

const SUBSCRIPTION = {
  name: 'Netflix',
  amount: 15000,
  frequency: 'MENSUAL',
  category: 'ENTRETENIMIENTO',
  nextChargeDate: '2026-10-05',
};

repositoryContract(() => createRepository(), { name: 'LocalStorageSubscriptionRepository' });

describe('LocalStorageSubscriptionRepository', () => {
  let storage;
  let repository;

  beforeEach(() => {
    storage = new FakeStorage();
    repository = createRepository(storage);
  });

  it('cumple la forma del puerto', () => {
    expect(isSubscriptionRepository(repository)).toBe(true);
  });

  it('persiste bajo la clave propia y versionada', async () => {
    await repository.create(SUBSCRIPTION);

    const raw = storage.raw(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw)).toMatchObject({
      schemaVersion: 1,
      subscriptions: [{ id: 'sub-1', name: 'Netflix' }],
    });
  });

  it('no escribe nada al solo leer un repositorio vacío', async () => {
    await repository.findAll();

    expect(storage.writeCount).toBe(0);
    expect(storage.raw(STORAGE_KEY)).toBeNull();
  });

  it('no toca el almacenamiento cuando no hay documento', async () => {
    await expect(repository.findAll()).resolves.toEqual([]);
    expect(storage.readCount).toBe(1);
  });

  it('asigna createdAt inyectado y un id único', async () => {
    const first = await repository.create(SUBSCRIPTION);
    const second = await repository.create(SUBSCRIPTION);

    expect(first.createdAt).toBe(FIXED_NOW);
    expect(first.id).not.toBe(second.id);
  });

  it('normaliza el nombre con espacios al crear', async () => {
    const created = await repository.create({ ...SUBSCRIPTION, name: '  Netflix  ' });

    expect(created.name).toBe('Netflix');
  });

  it('lee un documento previamente persistido', async () => {
    const other = createRepository(storage);
    await other.create(SUBSCRIPTION);

    const reopened = createRepository(storage);
    await expect(reopened.findAll()).resolves.toHaveLength(1);
    await expect(reopened.findById('sub-1')).resolves.toMatchObject({ name: 'Netflix' });
  });

  it('propaga StorageCorruptedError si el documento guardado es ilegible', async () => {
    storage.seed(STORAGE_KEY, '{ no es json');

    await expect(createRepository(storage).findAll()).rejects.toBeInstanceOf(StorageCorruptedError);
  });

  it('propaga StorageUnavailableError si el almacenamiento falla al leer', async () => {
    storage.simulateUnavailable();

    await expect(createRepository(storage).findAll()).rejects.toBeInstanceOf(
      StorageUnavailableError,
    );
  });

  it('propaga StorageUnavailableError si el almacenamiento falla al escribir', async () => {
    await repository.create(SUBSCRIPTION);
    storage.simulateQuotaExceeded();

    await expect(repository.update('sub-1', { amount: 25000 })).rejects.toBeInstanceOf(
      StorageUnavailableError,
    );
  });

  it('conserva la causa nativa del fallo de almacenamiento', async () => {
    storage.simulateQuotaExceeded();

    await repository.create(SUBSCRIPTION).catch((error) => {
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.cause.message).toContain('cuota');
    });
  });

  it('clear borra la clave y deja el repositorio listo para reutilizar', async () => {
    await repository.create(SUBSCRIPTION);
    await repository.clear();

    expect(storage.raw(STORAGE_KEY)).toBeNull();
    await expect(repository.create(SUBSCRIPTION)).resolves.toMatchObject({ status: 'ACTIVA' });
  });

  it('encadena pausa, pago, baja y reactivación sin perder datos', async () => {
    const created = await repository.create(SUBSCRIPTION);

    await repository.setStatus(created.id, 'PAUSADA');
    await repository.setStatus(created.id, 'ACTIVA');

    const paid = await repository.markPaid(created.id, {
      nextChargeDate: '2026-11-05',
      lastPaidDate: '2026-10-05',
    });
    expect(paid.lastPaidDate).toBe('2026-10-05');

    const cancelled = await repository.cancel(created.id, '2026-10-20');
    expect(cancelled).toMatchObject({
      status: 'CANCELADA',
      cancelledAt: '2026-10-20',
      lastPaidDate: '2026-10-05',
      nextChargeDate: '2026-11-05',
    });

    const reactivated = await repository.reactivate(created.id);
    expect(reactivated).toMatchObject({
      status: 'ACTIVA',
      cancelledAt: null,
      lastPaidDate: '2026-10-05',
      nextChargeDate: '2026-11-05',
    });
  });

  it('markPaid rechaza fechas inválidas y deja el documento intacto', async () => {
    const created = await repository.create(SUBSCRIPTION);

    await expect(
      repository.markPaid(created.id, { nextChargeDate: '2026-13-45', lastPaidDate: 'ayer' }),
    ).rejects.toThrow(/no es válida/);

    await expect(repository.findById(created.id)).resolves.toMatchObject({
      nextChargeDate: '2026-10-05',
      lastPaidDate: null,
    });
  });

  it('cancel rechaza una fecha de baja inválida', async () => {
    const created = await repository.create(SUBSCRIPTION);

    await expect(repository.cancel(created.id, '2026-02-30')).rejects.toThrow(/no es válida/);
    await expect(repository.findById(created.id)).resolves.toMatchObject({ status: 'ACTIVA' });
  });

  it('desempata por nombre cuando dos suscripciones cobran el mismo día', async () => {
    await repository.create({ ...SUBSCRIPTION, name: 'Spotify' });
    await repository.create({ ...SUBSCRIPTION, name: 'Netflix' });
    await repository.create({ ...SUBSCRIPTION, name: 'Internet' });

    const names = (await repository.findAll()).map((subscription) => subscription.name);
    expect(names).toEqual(['Internet', 'Netflix', 'Spotify']);
  });

  it('update parcial no borra los campos ausentes del parche', async () => {
    const created = await repository.create(SUBSCRIPTION);

    const updated = await repository.update(created.id, { amount: 19000 });

    expect(updated).toMatchObject({
      amount: 19000,
      name: 'Netflix',
      frequency: 'MENSUAL',
      category: 'ENTRETENIMIENTO',
      nextChargeDate: '2026-10-05',
    });
  });

  it('genera un id por defecto cuando no se inyecta idFactory', async () => {
    const auto = new LocalStorageSubscriptionRepository(storage);

    const created = await auto.create(SUBSCRIPTION);

    expect(created.id).toEqual(expect.any(String));
    expect(created.id).not.toBe('');
  });

  it('cae a un id generado si crypto.randomUUID no está disponible', async () => {
    const original = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });

    try {
      const auto = new LocalStorageSubscriptionRepository(storage);
      const created = await auto.create(SUBSCRIPTION);

      expect(created.id).toMatch(/^sub_[a-z0-9]+$/);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: original,
        configurable: true,
        writable: true,
      });
    }
  });

  it('sella createdAt con la hora del sistema si no se inyecta now', async () => {
    const auto = new LocalStorageSubscriptionRepository(storage);

    const created = await auto.create(SUBSCRIPTION);

    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('exige un storage con getItem', () => {
    expect(() => new LocalStorageSubscriptionRepository({})).toThrow(TypeError);
    expect(() => new LocalStorageSubscriptionRepository(null)).toThrow(TypeError);
  });

  it('acepta una clave propia sin tocar la del MVP', async () => {
    const custom = new LocalStorageSubscriptionRepository(storage, { key: 'otra:clave' });
    await custom.create(SUBSCRIPTION);

    expect(storage.raw('otra:clave')).not.toBeNull();
    expect(storage.raw(STORAGE_KEY)).toBeNull();
  });
});
