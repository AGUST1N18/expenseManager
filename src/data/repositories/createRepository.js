import { StorageUnavailableError } from '@/data/errors/StorageError.js';
import { HttpSubscriptionRepository } from '@/data/repositories/HttpSubscriptionRepository.js';
import { LocalStorageSubscriptionRepository } from '@/data/repositories/LocalStorageSubscriptionRepository.js';

export const LOCAL_DRIVER = 'local';
export const HTTP_DRIVER = 'http';
export const DEFAULT_DRIVER = LOCAL_DRIVER;

/**
 * Punto de extensión único del sistema para cambiar de almacenamiento (FR-033,
 * FR-036). Es la única pieza que conoce el mecanismo; el resto del código depende
 * solo del contrato.
 *
 * @param {{ driver?: string, storage?: object, baseUrl?: string }} [overrides]
 * @returns {import('@/data/repositories/SubscriptionRepository.js').Repository}
 */
export function createRepository(overrides = {}) {
  const { driver, baseUrl } = overrides;
  const selectedDriver = driver ?? import.meta.env?.VITE_STORAGE_DRIVER ?? DEFAULT_DRIVER;

  if (selectedDriver === LOCAL_DRIVER) {
    const target = Object.hasOwn(overrides, 'storage')
      ? overrides.storage
      : globalThis.localStorage;
    if (!target) {
      throw new StorageUnavailableError(
        'El almacenamiento local no está disponible en este entorno',
      );
    }
    return new LocalStorageSubscriptionRepository(target);
  }

  if (selectedDriver === HTTP_DRIVER) {
    return new HttpSubscriptionRepository({ baseUrl });
  }

  throw new Error(`Driver de almacenamiento desconocido: ${selectedDriver}`);
}
