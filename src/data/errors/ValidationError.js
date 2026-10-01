export class ValidationError extends Error {
  constructor(message, { errors = {}, cause } = {}) {
    super(message, { cause });
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
