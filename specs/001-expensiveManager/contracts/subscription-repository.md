# Contrato: `SubscriptionRepository`

Puerto de acceso a datos de la aplicación. Es la **única** pieza del sistema que
conoce el mecanismo de almacenamiento: la UI nunca habla con `localStorage`, solo
`src/services` invoca este puerto (constitución I).

Este documento es la referencia escrita que implementan el puerto en JSDoc
(tarea T064), el adaptador `LocalStorageSubscriptionRepository` (T065 y T066) y el
stub `HttpSubscriptionRepository` (T067), y que verifica la suite reutilizable
`tests/contract/repositoryContract.test.js` (T062 y T063, puerta G-03).

## Reglas generales

1. **Todo método devuelve `Promise`.** Aunque el adaptador local resuelva de forma
   síncrona, la firma expone `Promise` para que cambiar de almacenamiento no
   obligue a cambiar la UI.
2. **Ninguna regla de negocio.** El repositorio valida la _forma_ de los datos y su
   existencia, no el significado. Las reglas (qué es un pago válido, cuándo una
   suscripción puede cancelarse, cómo se avanza una fecha) viven en `src/domain` y
   las resuelve `src/services` antes de llamar a este puerto.
3. **No filtra el almacenamiento.** Ningún método devuelve el `storage`, la clave ni
   el documento crudo; la aplicación nunca ve `localStorage` ni `JSON.parse`.
4. **Errores tipados.** Se propagan `ValidationError`, `NotFoundError` y las
   variantes de `StorageError`; nunca `TypeError` por datos del usuario ni
   excepciones nativas del navegador.
5. **Transiciones dedicadas.** `status`, `lastPaidDate` y `cancelledAt` solo se
   escriben por `setStatus`, `markPaid`, `cancel` y `reactivate`. `update` los ignora
   aunque el parche los incluya, de modo que el frontend no pueda mutar el estado
   por accidente (FR-008, FR-016, FR-017, FR-037, FR-039, FR-040).

## Documento persistido

Clave única: `expenseManager:state:v1`. Un solo documento JSON:

```json
{
  "schemaVersion": 1,
  "preferences": { "currencySymbol": "$" },
  "subscriptions": [
    {
      "id": "sub_7f3a9c21",
      "name": "Netflix",
      "amount": 15000,
      "frequency": "MENSUAL",
      "category": "ENTRETENIMIENTO",
      "nextChargeDate": "2026-11-05",
      "status": "ACTIVA",
      "lastPaidDate": "2026-10-05",
      "cancelledAt": null,
      "createdAt": "2026-10-01T12:00:00.000Z"
    }
  ]
}
```

- `schemaVersion` es un entero y habilita migraciones secuenciales
  (`1 -> 2 -> …`) antes de entregar el documento a la aplicación.
- Las fechas viajan como `YYYY-MM-DD`; `createdAt` como ISO 8601 UTC. Nunca se
  serializa un `Date`, para evitar el corrimiento de un día por zona horaria.
- `lastPaidDate` y `cancelledAt` admiten `null` y significan "sin definir".
- El documento no contiene datos ajenos a los gastos que el usuario decidió
  registrar (FR-034).

## Los 10 métodos

| Método                    | Entrada                                      | Salida                                                            | Errores                                            |
| ------------------------- | -------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| `findAll()`               | —                                            | `Promise<Suscripcion[]>` ordenado por `nextChargeDate` ascendente | `StorageError`                                     |
| `findById(id)`            | `string`                                     | `Promise<Suscripcion \| null>`                                    | `StorageError`                                     |
| `create(data)`            | `SuscripcionNueva`                           | `Promise<Suscripcion>`                                            | `ValidationError`, `StorageError`                  |
| `update(id, changes)`     | `string`, parcial de campos editables        | `Promise<Suscripcion>`                                            | `NotFoundError`, `ValidationError`, `StorageError` |
| `delete(id)`              | `string`                                     | `Promise<void>`                                                   | `NotFoundError`, `StorageError`                    |
| `setStatus(id, status)`   | `string`, `ACTIVA \| PAUSADA`                | `Promise<Suscripcion>`                                            | `NotFoundError`, `ValidationError`, `StorageError` |
| `markPaid(id, payment)`   | `string`, `{ nextChargeDate, lastPaidDate }` | `Promise<Suscripcion>`                                            | `NotFoundError`, `ValidationError`, `StorageError` |
| `cancel(id, cancelledAt)` | `string`, `YYYY-MM-DD`                       | `Promise<Suscripcion>`                                            | `NotFoundError`, `ValidationError`, `StorageError` |
| `reactivate(id)`          | `string`                                     | `Promise<Suscripcion>`                                            | `NotFoundError`, `ValidationError`, `StorageError` |
| `clear()`                 | —                                            | `Promise<void>`                                                   | `StorageError`                                     |

### Detalle por método

- **`findAll()`** devuelve **copias**: mutar el resultado no altera lo persistido.
  El orden es `nextChargeDate` ascendente y, a igual fecha, `name` para que la
  lista sea estable entre lecturas (FR-013).
- **`findById(id)`** resuelve `null` cuando no existe; no lanza `NotFoundError`.
  Quien necesita fallar ante la ausencia usa `update`, `delete` o las
  transiciones.
- **`create(data)`** valida la forma con `validateSubscription`, completa
  `lastPaidDate` y `cancelledAt` en `null`, fija `status: 'ACTIVA'` y devuelve la
  entidad persistida (FR-007).
- **`update(id, changes)`** acepta solo `name`, `amount`, `frequency`, `category`
  y `nextChargeDate`. Ignora en silencio cualquier otro campo del parche y falla con
  `NotFoundError` si el `id` no existe (FR-008).
- **`setStatus(id, status)`** es la **única** vía para pausar y reanudar. Acepta
  solo `ACTIVA` y `PAUSADA`: `CANCELADA` requiere `cancel` porque además registra
  `cancelledAt` (FR-016, FR-017).
- **`markPaid(id, payment)`** es la única vía que escribe `lastPaidDate`, y escribe
  `nextChargeDate` con el valor que el dominio calculó. No recalcula la fecha: el
  repositorio no sabe qué periodicidad aplicar (FR-037, FR-038).
- **`cancel(id, cancelledAt)`** es la única vía que escribe `cancelledAt` y fija
  `status: 'CANCELADA'` (FR-039).
- **`reactivate(id)`** fija `status: 'ACTIVA'` y deja `cancelledAt` en `null`,
  conservando `nextChargeDate` y `lastPaidDate` (FR-040).
- **`clear()`** borra el documento completo. Es la acción que respalda "reiniciar
  datos" (FR-035).

## Contrato para un `HttpSubscriptionRepository` futuro

Un adaptador remoto debe cumplir exactamente los mismos diez métodos. Las
decisiones que el contrato ya fija para que ese adaptador no tenga que
reinterpretarlos:

| Aspecto          | Regla para cualquier adaptador                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Asincronía       | Siempre `Promise`, aunque la implementación resuelva sin esperar.                                                                                              |
| Identificador    | El servidor genera el `id`; el cliente no lo inventa ni lo fuerza.                                                                                             |
| Orden            | El servidor puede devolver cualquier orden; `findAll()` **debe** ordenar igual que el local.                                                                   |
| Códigos de error | `404` → `NotFoundError`, `400`/`422` → `ValidationError` con `errors` por campo, `5xx` → `StorageUnavailableError`, cuerpo ilegible → `StorageCorruptedError`. |
| Transiciones     | El endpoint de pago y el de cancelación son operaciones distintas y atómicas; no se acepta un `PATCH` genérico que cambie el estado.                           |
| Concurrencia     | La confirmación de un pago reenvía el `lastPaidDate` calculado para que la operación sea idempotente.                                                          |

Esa última fila es la razón por la que los pagos no se modelan como un `update`
genérico: una recarga de la página durante la confirmación no debe duplicar ni
perder el cobro.

## Verificación

`tests/contract/repositoryContract.test.js` es una suite reutilizable que recibe
una fábrica de repositorios y debe pasar, sin cambios, contra cualquier adaptador
real o falso. Si un adaptador nuevo no la pasa, el problema es del adaptador, no
de la suite.
