export const STORAGE_KEY = 'expenseManager:state:v1';

export const StorageKey = STORAGE_KEY;

export const SCHEMA_VERSION = 1;

export const DEFAULT_PREFERENCES = { currencySymbol: '$' };

export const EMPTY_DOCUMENT = {
  schemaVersion: SCHEMA_VERSION,
  preferences: { ...DEFAULT_PREFERENCES },
  subscriptions: [],
};

const migrations = [];

export function registerMigration(fromVersion, migrate) {
  migrations.push({ fromVersion, migrate });
}

export function resetMigrations() {
  migrations.length = 0;
}

export function migrationPath(fromVersion, toVersion) {
  return migrations
    .filter((entry) => entry.fromVersion >= fromVersion && entry.fromVersion < toVersion)
    .sort((a, b) => a.fromVersion - b.fromVersion);
}

/**
 * Aplica las migraciones secuenciales necesarias hasta `toVersion`.
 *
 * Con el MVP solo existe la versión 1, así que la ruta siempre está vacía y la
 * función se limita a declarar la versión soportada. El parámetro `toVersion`
 * existe para que el punto de extensión sea verificable: al agregar un campo se
 * sube `SCHEMA_VERSION`, se registra `registerMigration(1, …)` y la cadena queda
 * probada antes de que exista el documento real que la ejercite.
 */
export function migrateDocument(document, toVersion = SCHEMA_VERSION) {
  const path = migrationPath(document.schemaVersion, toVersion);

  if (path.length === 0) {
    return { ...document, schemaVersion: toVersion };
  }

  return path.reduce((current, entry) => {
    const next = entry.migrate(current);
    return { ...next, schemaVersion: entry.fromVersion + 1 };
  }, document);
}
