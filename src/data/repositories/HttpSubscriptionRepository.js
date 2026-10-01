import { StorageUnavailableError } from '@/data/errors/StorageError.js';

const NOT_IMPLEMENTED =
  'El cliente HTTP todavía no está disponible: elegí el driver local en VITE_STORAGE_DRIVER';

/**
 * Stub del adaptador remoto. Cumple la forma del puerto (puerta G-03) para que la
 * UI pueda compilarse contra él, pero ningún método es usable todavía.
 *
 * Cuando se implemente, este archivo es el punto donde se mapean los códigos HTTP
 * a los errores del contrato, según la tabla de
 * `specs/001-expensiveManager/contracts/subscription-repository.md`:
 * `404` → `NotFoundError`, `400`/`422` → `ValidationError` con `errors` por campo,
 * `5xx` → `StorageUnavailableError`, cuerpo ilegible → `StorageCorruptedError`.
 */
export class HttpSubscriptionRepository {
  constructor({ baseUrl } = {}) {
    this.baseUrl = baseUrl ?? '/api';
  }

  #notImplemented() {
    return new StorageUnavailableError(NOT_IMPLEMENTED);
  }

  async findAll() {
    throw this.#notImplemented();
  }

  async findById(_id) {
    throw this.#notImplemented();
  }

  async create(_data) {
    throw this.#notImplemented();
  }

  async update(_id, _changes) {
    throw this.#notImplemented();
  }

  async delete(_id) {
    throw this.#notImplemented();
  }

  async setStatus(_id, _status) {
    throw this.#notImplemented();
  }

  async markPaid(_id, _payment) {
    throw this.#notImplemented();
  }

  async cancel(_id, _cancelledAt) {
    throw this.#notImplemented();
  }

  async reactivate(_id) {
    throw this.#notImplemented();
  }

  async clear() {
    throw this.#notImplemented();
  }
}
