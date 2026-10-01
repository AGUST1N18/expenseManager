export class StorageError extends Error {
  constructor(message, { cause } = {}) {
    super(message, { cause });
    this.name = 'StorageError';
  }
}

export class StorageCorruptedError extends StorageError {
  constructor(message, { cause } = {}) {
    super(message, { cause });
    this.name = 'StorageCorruptedError';
  }
}

export class StorageUnavailableError extends StorageError {
  constructor(message, { cause } = {}) {
    super(message, { cause });
    this.name = 'StorageUnavailableError';
  }
}
