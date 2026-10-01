/**
 * Puerto de acceso a datos (constitución I).
 *
 * Contrato completo y escrito en
 * `specs/001-expensiveManager/contracts/subscription-repository.md`.
 * Verificado por la suite reutilizable `tests/contract/repositoryContract.test.js`.
 *
 * Reglas que todo adaptador cumple:
 *  1. Los 10 métodos devuelven `Promise`, aunque resuelvan de forma síncrona.
 *  2. No se filtran el `storage`, la clave ni el documento crudo.
 *  3. Las reglas de negocio se calculan antes, en `src/domain`.
 *  4. `status`, `lastPaidDate` y `cancelledAt` solo se escriben por `setStatus`,
 *     `markPaid`, `cancel` y `reactivate`; `update` los ignora.
 *
 * @typedef {object} Suscripcion
 * @property {string} id
 * @property {string} name
 * @property {number} amount
 * @property {'MENSUAL'|'ANUAL'} frequency
 * @property {string} category
 * @property {string} nextChargeDate Fecha `YYYY-MM-DD`; ancla de la periodicidad.
 * @property {'ACTIVA'|'PAUSADA'|'CANCELADA'} status
 * @property {string|null} lastPaidDate Fecha `YYYY-MM-DD` o `null`.
 * @property {string|null} cancelledAt Fecha `YYYY-MM-DD` o `null`.
 * @property {string} createdAt ISO 8601 UTC.
 *
 * @typedef {object} SuscripcionNueva
 * @property {string} name
 * @property {number} amount
 * @property {'MENSUAL'|'ANUAL'} frequency
 * @property {string} category
 * @property {string} nextChargeDate
 *
 * @typedef {object} Repository
 * @property {() => Promise<Suscripcion[]>} findAll
 * @property {(id: string) => Promise<Suscripcion|null>} findById
 * @property {(data: SuscripcionNueva) => Promise<Suscripcion>} create
 * @property {(id: string, changes: Partial<Suscripcion>) => Promise<Suscripcion>} update
 * @property {(id: string) => Promise<void>} delete
 * @property {(id: string, status: 'ACTIVA'|'PAUSADA') => Promise<Suscripcion>} setStatus
 * @property {(id: string, payment: { nextChargeDate: string, lastPaidDate: string }) => Promise<Suscripcion>} markPaid
 * @property {(id: string, cancelledAt: string) => Promise<Suscripcion>} cancel
 * @property {(id: string) => Promise<Suscripcion>} reactivate
 * @property {() => Promise<void>} clear
 *
 * @throws {import('@/data/errors/ValidationError.js').ValidationError}
 * @throws {import('@/data/errors/NotFoundError.js').NotFoundError}
 * @throws {import('@/data/errors/StorageError.js').StorageError}
 */

export const REPOSITORY_METHODS = [
  'findAll',
  'findById',
  'create',
  'update',
  'delete',
  'setStatus',
  'markPaid',
  'cancel',
  'reactivate',
  'clear',
];

export const EDITABLE_FIELDS = ['name', 'amount', 'frequency', 'category', 'nextChargeDate'];

export const STATUSES_MANAGED_BY_TRANSITIONS = ['ACTIVA', 'PAUSADA', 'CANCELADA'];

export const STATUSES_FOR_SET_STATUS = ['ACTIVA', 'PAUSADA'];

/**
 * @param {unknown} repository
 * @returns {boolean} `true` si expone los 10 métodos como funciones.
 */
export function isSubscriptionRepository(repository) {
  return REPOSITORY_METHODS.every((method) => typeof repository?.[method] === 'function');
}
