import { describe, expect, it } from 'vitest';
import { StorageCorruptedError } from '@/data/errors/StorageError.js';
import { SCHEMA_VERSION, StorageKey } from '@/data/storage/migrations.js';
import { parseDocument, serializeDocument } from '@/data/storage/parseDocument.js';
import { makeSubscription } from '../../support/fixtures.js';

const validSubscription = {
  id: 'sub-1',
  name: 'Netflix',
  amount: 15000,
  frequency: 'MENSUAL',
  category: 'ENTRETENIMIENTO',
  nextChargeDate: '2026-10-05',
  status: 'ACTIVA',
  lastPaidDate: null,
  cancelledAt: null,
  createdAt: '2026-10-01T12:00:00.000Z',
};

describe('parseDocument', () => {
  it('devuelve el documento vacío cuando la clave no existe', () => {
    const document = parseDocument(null);

    expect(document).toEqual({
      schemaVersion: SCHEMA_VERSION,
      preferences: { currencySymbol: '$' },
      subscriptions: [],
    });
  });

  it('lanza StorageCorruptedError con JSON inválido', () => {
    expect(() => parseDocument('{ esto no es json')).toThrow(StorageCorruptedError);
  });

  it('lanza StorageCorruptedError si el documento no es un objeto', () => {
    expect(() => parseDocument('[]')).toThrow(StorageCorruptedError);
    expect(() => parseDocument('"texto"')).toThrow(StorageCorruptedError);
  });

  it('lanza StorageCorruptedError si subscriptions no es un arreglo', () => {
    expect(() => parseDocument(JSON.stringify({ schemaVersion: 1, subscriptions: {} }))).toThrow(
      StorageCorruptedError,
    );
  });

  it('lanza StorageCorruptedError si schemaVersion no es un número', () => {
    expect(() =>
      parseDocument(JSON.stringify({ schemaVersion: 'uno', subscriptions: [] })),
    ).toThrow(StorageCorruptedError);
  });

  it('lanza StorageCorruptedError si schemaVersion es futura y no soportada', () => {
    expect(() =>
      parseDocument(JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1, subscriptions: [] })),
    ).toThrow(StorageCorruptedError);
  });

  it('conserva la causa del error de sintaxis en la cadena', () => {
    try {
      parseDocument('{ roto');
      expect.unreachable('debería lanzar');
    } catch (error) {
      expect(error).toBeInstanceOf(StorageCorruptedError);
      expect(error.cause).toBeInstanceOf(SyntaxError);
    }
  });

  it('normaliza a null las fechas de sistema ausentes', () => {
    const legacy = { ...validSubscription };
    delete legacy.lastPaidDate;
    delete legacy.cancelledAt;

    const { subscriptions } = parseDocument(
      JSON.stringify({ schemaVersion: 1, subscriptions: [legacy] }),
    );

    expect(subscriptions[0].lastPaidDate).toBeNull();
    expect(subscriptions[0].cancelledAt).toBeNull();
  });

  it('lee un documento válido conservando todas las suscripciones', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      preferences: { currencySymbol: '€' },
      subscriptions: [validSubscription, { ...validSubscription, id: 'sub-2' }],
    });

    const document = parseDocument(raw);

    expect(document.schemaVersion).toBe(1);
    expect(document.preferences.currencySymbol).toBe('€');
    expect(document.subscriptions).toHaveLength(2);
    expect(document.subscriptions[1].id).toBe('sub-2');
  });

  it('rellena la moneda por defecto si no viene', () => {
    const raw = JSON.stringify({ schemaVersion: 1, subscriptions: [] });
    expect(parseDocument(raw).preferences.currencySymbol).toBe('$');
  });

  it('descarta una suscripción sin identificador', () => {
    const sinId = { ...validSubscription };
    delete sinId.id;

    const raw = JSON.stringify({ schemaVersion: 1, subscriptions: [sinId, validSubscription] });

    const { subscriptions } = parseDocument(raw);

    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].id).toBe('sub-1');
  });
});

describe('parseDocument: formas degeneradas', () => {
  it('descarta elementos que no son objetos', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      subscriptions: [null, 'texto', 42, validSubscription],
    });

    expect(parseDocument(raw).subscriptions).toEqual([validSubscription]);
  });

  it('reemplaza preferencias inválidas por las de por defecto', () => {
    const raw = JSON.stringify({ schemaVersion: 1, preferences: 'dolar', subscriptions: [] });

    expect(parseDocument(raw).preferences).toEqual({ currencySymbol: '$' });
  });

  it('rechaza un objeto null sin romperse', () => {
    expect(() => parseDocument('null')).toThrow(StorageCorruptedError);
  });
});

describe('serializeDocument', () => {
  it('serializa el documento con su versión de esquema', () => {
    const serialized = serializeDocument({
      preferences: { currencySymbol: '$' },
      subscriptions: [validSubscription],
    });

    expect(JSON.parse(serialized)).toEqual({
      schemaVersion: SCHEMA_VERSION,
      preferences: { currencySymbol: '$' },
      subscriptions: [validSubscription],
    });
  });

  it('produce un documento que parseDocument puede volver a leer', () => {
    const serialized = serializeDocument({
      preferences: { currencySymbol: '$' },
      subscriptions: [makeSubscription()],
    });

    expect(parseDocument(serialized).subscriptions[0].id).toBe('sub-1');
  });

  it('serializa una lista vacía sin fallar', () => {
    expect(
      JSON.parse(serializeDocument({ preferences: {}, subscriptions: [] })).subscriptions,
    ).toEqual([]);
  });
});

describe('Constante de almacenamiento', () => {
  it('usa una clave propia versionada', () => {
    expect(StorageKey).toBe('expenseManager:state:v1');
  });
});
