import { describe, expect, it } from 'vitest';
import { NotFoundError } from '@/data/errors/NotFoundError.js';
import { ValidationError } from '@/data/errors/ValidationError.js';
import {
  StorageCorruptedError,
  StorageError,
  StorageUnavailableError,
} from '@/data/errors/StorageError.js';

describe('ValidationError', () => {
  it('expone el nombre, el mensaje y los errores por campo', () => {
    const error = new ValidationError('La suscripción no es válida', {
      errors: { name: 'El nombre es obligatorio', amount: 'El monto debe ser mayor que 0' },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('La suscripción no es válida');
    expect(error.errors).toEqual({
      name: 'El nombre es obligatorio',
      amount: 'El monto debe ser mayor que 0',
    });
  });

  it('deja los errores vacíos cuando no se pasan', () => {
    expect(new ValidationError('Revisá los datos').errors).toEqual({});
  });

  it('conserva la causa original', () => {
    const cause = new Error('fallo original');
    expect(new ValidationError('Datos inválidos', { cause }).cause).toBe(cause);
  });
});

describe('NotFoundError', () => {
  it('expone el nombre y el mensaje', () => {
    const error = new NotFoundError('No existe una suscripción con el id "sub-9"');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('NotFoundError');
    expect(error.message).toBe('No existe una suscripción con el id "sub-9"');
  });

  it('conserva la causa original', () => {
    const cause = new Error('búsqueda fallida');
    expect(new NotFoundError('No encontrado', { cause }).cause).toBe(cause);
  });
});

describe('StorageError y sus variantes', () => {
  it('expone el nombre y el mensaje del error base', () => {
    const error = new StorageError('No se pudo leer la información guardada');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('StorageError');
    expect(error.message).toBe('No se pudo leer la información guardada');
  });

  it('StorageCorruptedError hereda de StorageError', () => {
    const error = new StorageCorruptedError('La información guardada está dañada');

    expect(error).toBeInstanceOf(StorageError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('StorageCorruptedError');
    expect(error.message).toBe('La información guardada está dañada');
  });

  it('StorageUnavailableError hereda de StorageError', () => {
    const error = new StorageUnavailableError('El almacenamiento no está disponible');

    expect(error).toBeInstanceOf(StorageError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('StorageUnavailableError');
    expect(error.message).toBe('El almacenamiento no está disponible');
  });

  it('conserva la causa original en cada variante', () => {
    const cause = new Error('cuota excedida');

    expect(new StorageError('fallo', { cause }).cause).toBe(cause);
    expect(new StorageCorruptedError('dañada', { cause }).cause).toBe(cause);
    expect(new StorageUnavailableError('caída', { cause }).cause).toBe(cause);
  });

  it('permite encadenar causas entre variantes', () => {
    const root = new Error('JSON inválido');
    const corrupted = new StorageCorruptedError('Documento ilegible', { cause: root });
    const unavailable = new StorageUnavailableError('No se pudo leer', { cause: corrupted });

    expect(unavailable.cause).toBe(corrupted);
    expect(unavailable.cause.cause).toBe(root);
  });

  it('deja el mensaje vacío cuando no se pasa uno', () => {
    expect(new StorageError().message).toBe('');
  });
});
