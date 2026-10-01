import { describe, expect, it, vi } from 'vitest';
import { StorageUnavailableError } from '@/data/errors/StorageError.js';
import {
  createRepository,
  DEFAULT_DRIVER,
  HTTP_DRIVER,
  LOCAL_DRIVER,
} from '@/data/repositories/createRepository.js';
import { HttpSubscriptionRepository } from '@/data/repositories/HttpSubscriptionRepository.js';
import { LocalStorageSubscriptionRepository } from '@/data/repositories/LocalStorageSubscriptionRepository.js';
import {
  isSubscriptionRepository,
  REPOSITORY_METHODS,
} from '@/data/repositories/SubscriptionRepository.js';
import { FakeStorage } from '../../../support/FakeStorage.js';

describe('createRepository', () => {
  it('usa el driver local por defecto', () => {
    expect(DEFAULT_DRIVER).toBe('local');
    expect(createRepository({ storage: new FakeStorage() })).toBeInstanceOf(
      LocalStorageSubscriptionRepository,
    );
  });

  it('devuelve el adaptador local cuando el driver es "local"', () => {
    const repository = createRepository({ driver: LOCAL_DRIVER, storage: new FakeStorage() });

    expect(repository).toBeInstanceOf(LocalStorageSubscriptionRepository);
    expect(isSubscriptionRepository(repository)).toBe(true);
  });

  it('devuelve el stub HTTP cuando el driver es "http"', () => {
    const repository = createRepository({ driver: HTTP_DRIVER, baseUrl: '/api/v1' });

    expect(repository).toBeInstanceOf(HttpSubscriptionRepository);
    expect(repository.baseUrl).toBe('/api/v1');
  });

  it('falla con StorageUnavailableError si no hay almacenamiento local', () => {
    expect(() => createRepository({ driver: LOCAL_DRIVER, storage: null })).toThrow(
      StorageUnavailableError,
    );
    expect(() => createRepository({ driver: LOCAL_DRIVER, storage: undefined })).toThrow(
      StorageUnavailableError,
    );
  });

  it('falla con un mensaje explícito ante un driver desconocido', () => {
    expect(() => createRepository({ driver: 'sqlite' })).toThrow(
      'Driver de almacenamiento desconocido: sqlite',
    );
  });

  it('lee el driver de import.meta.env cuando no se pasa override', () => {
    vi.stubEnv('VITE_STORAGE_DRIVER', HTTP_DRIVER);

    try {
      expect(createRepository()).toBeInstanceOf(HttpSubscriptionRepository);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('el override gana sobre import.meta.env', () => {
    vi.stubEnv('VITE_STORAGE_DRIVER', HTTP_DRIVER);

    try {
      const repository = createRepository({ driver: LOCAL_DRIVER, storage: new FakeStorage() });
      expect(repository).toBeInstanceOf(LocalStorageSubscriptionRepository);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('HttpSubscriptionRepository (stub)', () => {
  it('cumple la forma del puerto para que la UI compile', () => {
    expect(isSubscriptionRepository(new HttpSubscriptionRepository())).toBe(true);
    for (const method of REPOSITORY_METHODS) {
      expect(typeof new HttpSubscriptionRepository()[method]).toBe('function');
    }
  });

  it('todas las operaciones rechazan con StorageUnavailableError', async () => {
    const repository = new HttpSubscriptionRepository();

    for (const method of REPOSITORY_METHODS) {
      await expect(repository[method]('sub-1', {})).rejects.toBeInstanceOf(StorageUnavailableError);
    }
  });

  it('explica en el mensaje que hay que elegir el driver local', async () => {
    await expect(new HttpSubscriptionRepository().findAll()).rejects.toThrow(/VITE_STORAGE_DRIVER/);
  });

  it('usa /api como base por defecto', () => {
    expect(new HttpSubscriptionRepository().baseUrl).toBe('/api');
  });
});
