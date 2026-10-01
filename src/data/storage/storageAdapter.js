import { StorageCorruptedError, StorageUnavailableError } from '@/data/errors/StorageError.js';
import { migrateDocument, SCHEMA_VERSION, STORAGE_KEY } from '@/data/storage/migrations.js';
import { emptyDocument, parseDocument, serializeDocument } from '@/data/storage/parseDocument.js';

const READ_ERROR = 'No se pudo leer la información guardada';
const WRITE_ERROR = 'No se pudo guardar la información';
const REMOVE_ERROR = 'No se pudo borrar la información guardada';
const CORRUPTED_ERROR = 'La información guardada está dañada';

export class StorageAdapter {
  constructor(storage, { key = STORAGE_KEY } = {}) {
    if (!storage || typeof storage.getItem !== 'function') {
      throw new TypeError('StorageAdapter requiere un storage con getItem');
    }
    this.storage = storage;
    this.key = key;
  }

  read() {
    let raw;
    try {
      raw = this.storage.getItem(this.key);
    } catch (error) {
      throw new StorageUnavailableError(READ_ERROR, { cause: error });
    }

    if (raw === null || raw === undefined) {
      return emptyDocument();
    }

    try {
      return migrateDocument(parseDocument(raw));
    } catch (error) {
      throw new StorageCorruptedError(CORRUPTED_ERROR, { cause: error });
    }
  }

  write(document) {
    let serialized;
    try {
      serialized = serializeDocument(document);
    } catch (error) {
      throw new StorageUnavailableError(WRITE_ERROR, { cause: error });
    }

    try {
      this.storage.setItem(this.key, serialized);
    } catch (error) {
      throw new StorageUnavailableError(WRITE_ERROR, { cause: error });
    }

    return document;
  }

  remove() {
    try {
      this.storage.removeItem(this.key);
    } catch (error) {
      throw new StorageUnavailableError(REMOVE_ERROR, { cause: error });
    }
  }
}

export function createStorageAdapter(storage, options) {
  return new StorageAdapter(storage, options);
}

export { SCHEMA_VERSION, STORAGE_KEY };
