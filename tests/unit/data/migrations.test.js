import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  EMPTY_DOCUMENT,
  migrateDocument,
  migrationPath,
  registerMigration,
  resetMigrations,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from '@/data/storage/migrations.js';

describe('Constantes de almacenamiento', () => {
  it('declara la clave propia y versionada', () => {
    expect(STORAGE_KEY).toBe('expenseManager:state:v1');
  });

  it('arranca en la versión 1 con la moneda por defecto', () => {
    expect(SCHEMA_VERSION).toBe(1);
    expect(DEFAULT_PREFERENCES).toEqual({ currencySymbol: '$' });
  });

  it('expone un documento vacío reutilizable', () => {
    expect(EMPTY_DOCUMENT).toEqual({
      schemaVersion: 1,
      preferences: { currencySymbol: '$' },
      subscriptions: [],
    });
  });
});

describe('Migraciones de esquema', () => {
  afterEach(() => {
    resetMigrations();
  });

  it('no inventa migraciones en el MVP: la versión 1 se mantiene', () => {
    const document = { schemaVersion: 1, subscriptions: [] };

    expect(migrationPath(1)).toEqual([]);
    expect(migrateDocument(document)).toEqual({
      schemaVersion: 1,
      subscriptions: [],
    });
  });

  it('aplica una migración registrada al subir de versión', () => {
    registerMigration(1, (document) => ({ ...document, currencySymbol: '€' }));

    const migrated = migrateDocument({ schemaVersion: 1, subscriptions: [] }, 2);

    expect(migrated).toEqual({
      schemaVersion: 2,
      subscriptions: [],
      currencySymbol: '€',
    });
  });

  it('encadena migraciones en orden ascendente aunque se registren desordenadas', () => {
    const order = [];
    registerMigration(2, (document) => {
      order.push(2);
      return { ...document, tercero: true };
    });
    registerMigration(1, (document) => {
      order.push(1);
      return { ...document, segundo: true };
    });

    const migrated = migrateDocument({ schemaVersion: 1, subscriptions: [] }, 3);

    expect(order).toEqual([1, 2]);
    expect(migrated).toEqual({
      schemaVersion: 3,
      subscriptions: [],
      segundo: true,
      tercero: true,
    });
  });

  it('alimenta cada migración con el resultado de la anterior', () => {
    registerMigration(1, (document) => ({ ...document, cadena: 'uno' }));
    registerMigration(2, (document) => ({ ...document, cadena: `${document.cadena}-dos` }));

    const migrated = migrateDocument({ schemaVersion: 1 }, 3);

    expect(migrated.cadena).toBe('uno-dos');
  });

  it('ignora migraciones posteriores a la versión soportada', () => {
    registerMigration(3, (document) => ({ ...document, futuro: true }));

    expect(migrationPath(1, 3)).toEqual([]);
    expect(migrateDocument({ schemaVersion: 1 }, 3)).not.toHaveProperty('futuro');
  });

  it('no vuelve a migrar un documento que ya está en la versión soportada', () => {
    registerMigration(1, (document) => ({ ...document, aplicado: true }));

    expect(migrateDocument({ schemaVersion: 2 }, 2)).not.toHaveProperty('aplicado');
  });

  it('resetMigrations vacía el registro', () => {
    registerMigration(1, (document) => document);
    resetMigrations();

    expect(migrationPath(1, 2)).toEqual([]);
  });
});

describe('Esquema del documento y migraciones en conjunto', () => {
  it('un documento v0 sin los campos nuevos se completa con los valores por defecto', () => {
    const migrated = migrateDocument({ schemaVersion: 0, subscriptions: [] });

    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.subscriptions).toEqual([]);
  });
});
