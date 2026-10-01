import { NotFoundError } from '@/data/errors/NotFoundError.js';
import { ValidationError } from '@/data/errors/ValidationError.js';
import {
  EDITABLE_FIELDS,
  STATUSES_FOR_SET_STATUS,
} from '@/data/repositories/SubscriptionRepository.js';
import { StorageAdapter } from '@/data/storage/storageAdapter.js';
import { STATUS_ACTIVE, STATUS_CANCELLED } from '@/domain/catalog/frequencies.js';
import { applyChanges } from '@/domain/subscriptions/applyChanges.js';
import {
  VALIDATION_MESSAGES,
  validateSubscription,
} from '@/domain/subscriptions/validateSubscription.js';

const VALIDATION_MESSAGE = 'La suscripción no es válida';

function defaultIdFactory() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `sub_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
}

function defaultNow() {
  return new Date().toISOString();
}

function compareSubscriptions(a, b) {
  if (a.nextChargeDate !== b.nextChargeDate) {
    return a.nextChargeDate < b.nextChargeDate ? -1 : 1;
  }
  if (a.name === b.name) return 0;
  return a.name < b.name ? -1 : 1;
}

function copy(subscription) {
  return { ...subscription };
}

/**
 * Adaptador de `SubscriptionRepository` sobre `localStorage`.
 *
 * Traduce el resultado de `validateSubscription` a `ValidationError`, de modo que
 * el dominio sigue sin depender de la capa de datos (constitución II).
 *
 * El documento se lee una vez y se mantiene en memoria; cada mutación se escribe
 * de inmediato. Eso supone una sola pestaña activa, que es el alcance del MVP.
 */
export class LocalStorageSubscriptionRepository {
  constructor(storage, { idFactory = defaultIdFactory, now = defaultNow, key } = {}) {
    if (!storage || typeof storage.getItem !== 'function') {
      throw new TypeError('LocalStorageSubscriptionRepository requiere un storage con getItem');
    }

    this.adapter = new StorageAdapter(storage, key ? { key } : {});
    this.idFactory = idFactory;
    this.now = now;
    this.#document = null;
  }

  #document;

  #load() {
    if (this.#document === null) {
      this.#document = this.adapter.read();
    }
    return this.#document;
  }

  #save() {
    this.adapter.write(this.#document);
  }

  #validate(entity, message = VALIDATION_MESSAGE) {
    const { isValid, errors } = validateSubscription(entity);
    if (!isValid) {
      throw new ValidationError(message, { errors });
    }
    return entity;
  }

  #require(id) {
    const index = this.#load().subscriptions.findIndex((subscription) => subscription.id === id);
    if (index === -1) {
      throw new NotFoundError(`No existe una suscripción con el id "${id}"`);
    }
    return index;
  }

  #replace(index, next) {
    const subscriptions = [...this.#document.subscriptions];
    subscriptions[index] = next;
    this.#document = { ...this.#document, subscriptions };
    this.#save();
    return copy(next);
  }

  async findAll() {
    return this.#load().subscriptions.slice().sort(compareSubscriptions).map(copy);
  }

  async findById(id) {
    const found = this.#load().subscriptions.find((subscription) => subscription.id === id);
    return found ? copy(found) : null;
  }

  async create(data) {
    this.#load();

    const entity = {
      id: this.idFactory(),
      name: typeof data?.name === 'string' ? data.name.trim() : data?.name,
      amount: data?.amount,
      frequency: data?.frequency,
      category: data?.category,
      nextChargeDate: data?.nextChargeDate,
      status: STATUS_ACTIVE,
      lastPaidDate: null,
      cancelledAt: null,
      createdAt: this.now(),
    };

    this.#validate(entity);

    const subscriptions = [...this.#document.subscriptions, entity];
    this.#document = { ...this.#document, subscriptions };
    this.#save();
    return copy(entity);
  }

  async update(id, changes = {}) {
    this.#load();
    const index = this.#require(id);

    const editable = Object.fromEntries(
      EDITABLE_FIELDS.filter((field) => Object.hasOwn(changes, field)).map((field) => [
        field,
        changes[field],
      ]),
    );

    const next = this.#validate(applyChanges(this.#document.subscriptions[index], editable));
    return this.#replace(index, next);
  }

  async delete(id) {
    this.#load();
    const index = this.#require(id);

    this.#document = {
      ...this.#document,
      subscriptions: this.#document.subscriptions.filter((_, position) => position !== index),
    };
    this.#save();
  }

  async setStatus(id, status) {
    this.#load();

    if (!STATUSES_FOR_SET_STATUS.includes(status)) {
      throw new ValidationError(VALIDATION_MESSAGE, {
        errors: { status: VALIDATION_MESSAGES.statusInvalid },
      });
    }

    const index = this.#require(id);
    return this.#replace(index, { ...this.#document.subscriptions[index], status });
  }

  async markPaid(id, payment = {}) {
    this.#load();
    const index = this.#require(id);

    const next = this.#validate({
      ...this.#document.subscriptions[index],
      nextChargeDate: payment.nextChargeDate,
      lastPaidDate: payment.lastPaidDate,
    });

    return this.#replace(index, next);
  }

  async cancel(id, cancelledAt) {
    this.#load();
    const index = this.#require(id);

    const next = this.#validate({
      ...this.#document.subscriptions[index],
      status: STATUS_CANCELLED,
      cancelledAt,
    });

    return this.#replace(index, next);
  }

  async reactivate(id) {
    this.#load();
    const index = this.#require(id);

    const next = this.#validate({
      ...this.#document.subscriptions[index],
      status: STATUS_ACTIVE,
      cancelledAt: null,
    });

    return this.#replace(index, next);
  }

  async clear() {
    this.#document = null;
    this.adapter.remove();
  }
}
