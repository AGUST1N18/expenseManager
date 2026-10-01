export class NotFoundError extends Error {
  constructor(message, { cause } = {}) {
    super(message, { cause });
    this.name = 'NotFoundError';
  }
}
