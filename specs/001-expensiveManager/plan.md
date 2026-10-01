# Implementation Plan: expenseManager — Gestor de Suscripciones y Gastos

**Branch**: `001-expensiveManager` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-expensiveManager/spec.md`

## Summary

Aplicación web de una sola página para registrar gastos recurrentes y
suscripciones, y ver el dinero que se van: total mensual estandarizado,
distribución por categoría, proyección hasta fin de año y alertas de los cobros
de los próximos 7 días.

Enfoque técnico: **SPA en React + Vite + Tailwind CSS**, con la lógica de
negocio escrita como **módulos puros sin dependencias del framework** y todo el
acceso a datos detrás de un **contrato de Repositorio**. La primera (y única)
implementación del contrato escribe en `localStorage`; la migración a una base
de datos real consistirá en agregar un adaptador HTTP que cumpla el mismo
contrato, sin modificar ni servicios, ni componentes, ni pruebas de dominio.

El resultado esperado es que el 100% de los escenarios Gherkin de FR-001 a
FR-036 sea verificable de forma automatizada (Vitest + Testing Library), con
`localStorage` simulado en el entorno de pruebas.

## Technical Context

**Language/Version**: JavaScript ES2022 (JSX), sin transpilación de tipos.
Node.js como entorno de desarrollo y build: Vite 8 exige `^20.19.0 || >=22.12.0`
y `jsdom` 30 declara `^22.22.2 || ^24.15.0 || >=26.0.0`. La Fase 1 se validó con
Node v24.13.1 y npm 11.8.0.

**Primary Dependencies** (versiones instaladas y validadas en la Fase 1):

- `react` 19.3.0 y `react-dom` 19.3.0 — interfaz de usuario.
- `vite` 8.3.2 — bundler y servidor de desarrollo. Requiere Node
  `^20.19.0 || >=22.12.0`.
- `@vitejs/plugin-react` 6.1.1 — soporte JSX y Fast Refresh.
- `tailwindcss` 4.3.3 + `@tailwindcss/vite` 4.3.3 — estilización (README: "Tailwind
  CSS para estilización rápida"). Tailwind 4 se integra como plugin de Vite; no
  requiere `tailwind.config.js` ni `postcss.config.js`.
- `vitest` 5.0.3 + `@vitest/coverage-v8` 5.0.3, `@testing-library/react` 16.3.3,
  `@testing-library/user-event` 14.6.7, `@testing-library/jest-dom` 7.0.1,
  `jsdom` 30.1.1 — pruebas unitarias, de contrato, integrales y entorno de
  navegador simulado (incluye `localStorage`). `jsdom` 30 declara engines
  `^22.22.2 || ^24.15.0 || >=26.0.0`; el proyecto se ejecuta y las pruebas pasan
  con Node 24.13.1 pese al aviso `EBADENGINE` de npm.
- `eslint` 10.11.0 + `@eslint/js` 10.0.1 + `eslint-plugin-react-hooks` 7.1.1 +
  `globals` 17.13.0 — control de calidad estático con configuración plana
  (ESLint 10 no admite la clave `extends` en flat config).
- `prettier` 3.9.9 — formato de código.

Nota de scaffolding: el template `react` de Vite 8 usa `oxlint` y genera
`src/index.css` y `src/App.css`. Este proyecto sustituye `oxlint` por ESLint
(constitución V, puerta G-05) y elimina ambos CSS del template: el único `.css`
permitido es `src/styles/index.css`.

**Storage**: `localStorage` del navegador bajo una única clave versionada
(`expenseManager:state:v1`), detrás de un adaptador de Repositorio. Sin
servidor, sin base de datos, sin red.

**Testing**: Vitest 5. Tres Suites: `unit` (dominio y adaptador, sin DOM),
`contract` (contrato de repositorio reutilizable para cualquier adaptador
futuro), `integration` (componentes con Testing Library sobre `jsdom`). La
configuración vive en el bloque `test` de `vite.config.js` (entorno `jsdom`,
`globals: true`, `setupFiles: ['./tests/setupTests.js']`, cobertura v8 con
umbrales 90 sobre `src/domain/**` y `src/data/**`); el patrón `include` cubre
`src/**` y `tests/**`.

**Target Platform**: Navegador web moderno (últimas dos versiones de Chrome,
Firefox, Safari y Edge) en escritorio y móvil. Sin soporte offline service
worker en el MVP.

**Project Type**: `web` — aplicación frontend de una sola página, sin backend.

**Performance Goals**:

- 60 fps en interacción (arrastre-free; sin animaciones costosas).
- Cálculo de métricas y alertas por debajo de 16 ms con 1.000 suscripciones
  (presupuesto de un frame).
- Primer render útil por debajo de 1 s en build de producción.
- Localización por interaction: lectura/escritura de estado por debajo de 10 ms
  con 1.000 suscripciones.

**Constraints**:

- 100% local: los datos de gasto no salen del navegador (spec: FR-034).
- La lógica de negocio no puede importar React ni tocar `localStorage`
  directamente (habilita pruebas puras y la migración del almacenamiento).
- Los montos se calculan con precisión de centavo; el redondeo a 2 decimales
  ocurre solo en la capa de presentación (SC-003).
- La suma de porcentajes por categoría debe cerrar en 100% con tolerancia
  máxima de 1 punto porcentual (SC-004).
- No se suman ni se restan fechas con `Date` en UTC: todas las fechas se
  manejan como cadenas `YYYY-MM-DD` en zona horaria local.

**Scale/Scope**: Uso personal, un único espacio de trabajo, sin cuentas ni
roles. Volumen esperado de 5 a 50 suscripciones; el diseño debe sostener 1.000
sin degradar la interacción. 5 historias de usuario, 36 requerimientos
funcionales, 7 componentes de dominio, 1 pantalla principal con 3 secciones.

### Decisiones de stack

| Área                     | Decisión                                                                             | Alternativas evaluadas y motivo de descarte                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Librería de UI           | React 19 con componentes propios                                                     | VanillaJS: menos dependencias, pero con este nivel de estado derivado (listado + panel + alertas sincronizados) la reconciliación manual agrega complejidad real y riesgo de desincronización. **Recomendación del README: React.**                                         |
| Estilización             | Tailwind CSS 4 vía `@tailwindcss/vite`                                               | CSS plano con custom properties: menos dependencias pero sin utilidad para estados visuales (pausada, atrasada, alerta) sin escribir CSS a mano. **README: Tailwind.**                                                                                                      |
| Gráficos de distribución | Barras horizontales con clases de Tailwind + ancho en porcentaje                     | Recharts/Chart.js: 1 dépendance pesada (~100 kB) para un solo gráfico de barras. Se registra como decisión "YAGNI"; si el panel crece, se puede incorporar más adelante.                                                                                                    |
| Enrutado                 | Sin librería de rutas: vista única con secciones y estado de pestaña en `useState`   | `react-router`:innecesario para 3 secciones de una sola pantalla; una dependencia de más que mantener.                                                                                                                                                                      |
| Estado global            | Un único `Context` + `useReducer` para suscripciones, y `useMemo` para los derivados | Redux/Zustand:innecesario con un solo tipo de entidad; Zustand es una alternativa válida si en el futuro aparecen varios dominios independientes.                                                                                                                           |
| Manejo de fechas         | Funciones propias en `src/domain/dates` (parseo, `addMonths` con clamp, `diffDays`)  | `date-fns` / `Luxon`: resuelven el 90% del caso, pero el _clamp_ de fin de mes (día 31 → último día del mes) y el cálculo de ocurrencias deben estar igual escritos y probados; las funciones propias son 60 líneas y verificables con casos del spec (FR-005, Edge Cases). |
| Persistencia             | `localStorage` con clave versionada y migración leída-de-enum                        | `indexedDB`: asíncrono real y transaccional, pero innecesario para el volumen objetivo; añadirlo después es trivial con el contrato de repositorio.                                                                                                                         |

### Modelo de datos estructurado (JSON)

#### Documento raíz persistido

Clave única de almacenamiento: `expenseManager:state:v1`.

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-10-01T12:00:00.000Z",
  "preferences": {
    "currencyCode": "ARS",
    "currencySymbol": "$"
  },
  "subscriptions": [
    {
      "id": "sub_7f3a9c21-4b8e-4a1d-9f0c-2e5b6d8a1c34",
      "name": "Netflix",
      "amount": 15000,
      "frequency": "MENSUAL",
      "category": "Entretenimiento",
      "nextChargeDate": "2026-11-05",
      "status": "ACTIVA",
      "lastPaidDate": "2026-10-05",
      "cancelledAt": null,
      "createdAt": "2026-10-01T12:00:00.000Z"
    },
    {
      "id": "sub_1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      "name": "Adobe CC",
      "amount": 360000,
      "frequency": "ANUAL",
      "category": "Trabajo",
      "nextChargeDate": "2026-12-01",
      "status": "ACTIVA",
      "lastPaidDate": null,
      "cancelledAt": null,
      "createdAt": "2026-10-01T12:05:00.000Z"
    },
    {
      "id": "sub_9e8d7c6b-5a4f-4e3d-2c1b-0a9f8e7d6c5b",
      "name": "Gimnasio",
      "amount": 25000,
      "frequency": "MENSUAL",
      "category": "Salud",
      "nextChargeDate": "2026-10-10",
      "status": "PAUSADA",
      "lastPaidDate": "2026-09-10",
      "cancelledAt": null,
      "createdAt": "2026-10-01T12:10:00.000Z"
    },
    {
      "id": "sub_3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f",
      "name": "HBO Max",
      "amount": 9000,
      "frequency": "MENSUAL",
      "category": "Entretenimiento",
      "nextChargeDate": "2026-10-02",
      "status": "CANCELADA",
      "lastPaidDate": "2026-09-02",
      "cancelledAt": "2026-10-01",
      "createdAt": "2026-09-01T09:00:00.000Z"
    }
  ]
}
```

#### Definición de la entidad `Suscripción`

| Campo            | Tipo                                   | Reglas                                                                                                                                                                                                                                                                                                                                                                                          | Requisitos                                                    |
| ---------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `id`             | `string` (UUID v4)                     | Generado por la aplicación, inmutable, único. Es la identidad real del registro: los nombres pueden repetirse.                                                                                                                                                                                                                                                                                  | FR-001, FR-008, Edge "Nombres duplicados"                     |
| `name`           | `string`                               | Obligatorio, no vacío tras `trim()`, longitud 1–80. No único.                                                                                                                                                                                                                                                                                                                                   | FR-001, FR-010, escenario "nombre vacío" y "nombre muy largo" |
| `amount`         | `number`                               | Obligatorio, `> 0`, finito, hasta 2 decimales. Se almacena como número; el redondeo a 2 decimales se aplica solo al mostrar.                                                                                                                                                                                                                                                                    | FR-004, FR-010, SC-003                                        |
| `frequency`      | `"MENSUAL" \| "ANUAL"`                 | Conjunto cerrado. La UI expone las etiquetas "Mensual" y "Anual" y persiste los identificadores en mayúsculas para poder agregar valores futuros sin romper datos.                                                                                                                                                                                                                              | FR-002                                                        |
| `category`       | `string`                               | Obligatoria, debe pertenecer al catálogo. Se persiste el identificador en mayúsculas y sin tildes (`EDUCACION`) y la interfaz muestra su etiqueta en español (`Educación`); el par vive centralizado en `src/domain/catalog/categories.js`, de modo que agregar un valor futuro no rompe los datos ya guardados.                                                                                | FR-003, T016                                                  |
| `nextChargeDate` | `string` `YYYY-MM-DD`                  | Obligatoria, fecha válida en calendario (admite 29 de febrero). Es el **ancla** de la periodicidad: todas las ocurrencias futuras se derivan de aquí avanzando por periodos, de modo que el día de cobro se conserva aunque un mes sea más corto. Cuando la app necesite avanzar el próximo cobro debe hacerlo por periodos desde esta fecha de origen, nunca desde una ocurrencia ya ajustada. | FR-005, FR-015, Edge "Día 31 en un mes corto"                 |
| `status`         | `"ACTIVA" \| "PAUSADA" \| "CANCELADA"` | `ACTIVA` al crear. `PAUSADA` y `CANCELADA` no computan en el gasto real mensual; solo `CANCELADA` excluye además las alertas. El estado lo mutan exclusivamente las acciones de pausa/reanudación (`setStatus`) y de cancelación/reactivación (`cancel`, `reactivate`), nunca una edición.                                                                                                      | FR-006, FR-016, FR-017, FR-039, FR-040                        |
| `lastPaidDate`   | `string` `YYYY-MM-DD` \| `null`        | Fecha del último pago confirmado por el usuario. La mantiene el sistema al marcar la suscripción como pagada; vale `null` hasta el primer pago y no es editable a mano.                                                                                                                                                                                                                         | FR-037, FR-038                                                |
| `cancelledAt`    | `string` `YYYY-MM-DD` \| `null`        | Fecha de baja. La mantiene el sistema al cancelar; vale `null` mientras la suscripción no está cancelada y se elimina al reactivarla. No es editable a mano.                                                                                                                                                                                                                                    | FR-039, FR-040                                                |
| `createdAt`      | `string` ISO 8601 UTC                  | Solo informativo, se conserva en ediciones.                                                                                                                                                                                                                                                                                                                                                     | Key Entities                                                  |

#### Entidades derivadas (no se persisten)

Se calculan en cada render a partir de las suscripciones; guardarlas sería
duplicar información susceptible de quedar inconsistente.

| Entidad derivada       | Cálculo                                                                                                                                                                                                                                                                                                                              | Requisitos                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `monthlyEquivalent`    | `amount` si `MENSUAL`; `amount / 12` si `ANUAL`.                                                                                                                                                                                                                                                                                     | FR-020                                        |
| `Ocurrencia de cobro`  | Fecha y monto; se generan desde `nextChargeDate` avanzando por periodicidad (mes o año). El avance se recalcula **siempre desde la fecha de origen**, no encadenado: una suscripción que cobra el 31 genera 31-01, 28-02, 31-03, 30-04, de modo que el ajuste a un mes corto no arrastra el día hacia atrás en los meses siguientes. | FR-005, FR-022, Edge "Día 31 en un mes corto" |
| `Métrica`              | Gasto real mensual, gasto anualizado (`monthlyTotal * 12`), distribución por categoría, proyección anual, conteos activas/pausadas/total.                                                                                                                                                                                            | FR-020 a FR-026                               |
| `Alerta de renovación` | Suscripción `ACTIVA` cuya próxima ocurrencia cae entre hoy y hoy + 7 días inclusive, con `daysRemaining` y monto.                                                                                                                                                                                                                    | FR-027 a FR-032                               |

#### Reglas de formato y redondeo

- `amount` se guarda como `number`. Los agregados se suman sin redondear y se
  redondean a 2 decimales **solo al presentar** (`formatMoney`). Esto cumple
  "el cálculo agregado usa el valor sin redondear y solo el valor mostrado se
  redondea" (Edge Cases). Alternativa descartada: guardar centavos como entero
  (`amountCents`); agrega conversión y campos duplicados sin aportar valor en un
  único caso de uso personal.
- Porcentajes por categoría: se calcula el valor exacto y se aplica el método
  de **resto mayor** (largest remainder) para que la suma de los enteros de
  porcentaje sea exactamente 100, con lo que el redondeo a 2 decimales no puede
  desviarse más de 0.01 pp por categoría.
- La fecha nunca se serializa como `Date`: se usa `YYYY-MM-DD` para evitar el
  corrimiento de un día por zona horaria al parsear.

#### Migración de esquema

El documento incluye `schemaVersion`. Al leer, si la versión persistida es
menor que la soportada, `storageAdapter` aplica funciones `migrations` puras y
secuenciales (`1 -> 2 -> …`) antes de entregar el documento a la aplicación. Para
el MVP solo existe la versión 1, pero el punto de extensión queda definido desde
ahora para que agregar un campo no obligue a pedirle al usuario que borre sus
datos.

### Arquitectura de almacenamiento (Patrón Repositorio)

#### Principio

La UI **nunca** habla con `localStorage`. Habla con un servicio de aplicación
que habla con un repositorio, y el repositorio cumple un contrato de
interfaz. Como todas las operaciones del contrato devuelven `Promise`, hoy se
resuelven con `setTimeout(..., 0)` y mañana con `fetch` contra una API, sin
cambiar una sola línea de los componentes.

```
Componentes React (UI, formularios, ConfirmDialog)
        │  eventos de usuario, sin conocimiento del almacenamiento
        ▼
Hooks de estado  useSubscriptions / useMetrics / useAlerts
        │  despachan acciones y consumen derivados
        ▼
Servicios de aplicación  subscriptionService.js  (casos de uso, validación)
        │  orquesta: valida -> construye entidad -> persiste -> devuelve entidad
        ▼
Contrato  SubscriptionRepository  (async: findAll, findById, create, update, delete, setStatus, markPaid, cancel, reactivate, clear)
        │
        ├── LocalStorageSubscriptionRepository   ← MVP (escrito en disco del navegador)
        └── HttpSubscriptionRepository           ← futuro (no se implementa en el MVP)
```

#### Contrato del repositorio

Definido como documentación ejecutable en
`src/data/repositories/SubscriptionRepository.js` (contrato formal en JSDoc +
tipos de retorno), documentado para las personas en
`specs/001-expensiveManager/contracts/subscription-repository.md` (tarea T051) y
verificado por la suite compartida `tests/contract/repositoryContract.test.js`
(tarea T062). Cualquier adaptador nuevo, real o falso, debe pasar esa suite sin
cambios.

| Método                    | Entrada                                      | Salida                                                            | Errores que puede propagar                         |
| ------------------------- | -------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| `findAll()`               | —                                            | `Promise<Suscripcion[]>` ordenado por `nextChargeDate` ascendente | `StorageError`                                     |
| `findById(id)`            | `string`                                     | `Promise<Suscripcion \| null>`                                    | `StorageError`                                     |
| `create(data)`            | `SuscripcionNueva`                           | `Promise<Suscripcion>`                                            | `ValidationError`, `StorageError`                  |
| `update(id, changes)`     | `string`, parcial de campos editables        | `Promise<Suscripcion>`                                            | `NotFoundError`, `ValidationError`, `StorageError` |
| `delete(id)`              | `string`                                     | `Promise<void>`                                                   | `NotFoundError`, `StorageError`                    |
| `setStatus(id, status)`   | `string`, `ACTIVA \| PAUSADA`                | `Promise<Suscripcion>`                                            | `NotFoundError`, `StorageError`                    |
| `markPaid(id, payment)`   | `string`, `{ nextChargeDate, lastPaidDate }` | `Promise<Suscripcion>`                                            | `NotFoundError`, `ValidationError`, `StorageError` |
| `cancel(id, cancelledAt)` | `string`, `YYYY-MM-DD`                       | `Promise<Suscripcion>`                                            | `NotFoundError`, `ValidationError`, `StorageError` |
| `reactivate(id)`          | `string`                                     | `Promise<Suscripcion>`                                            | `NotFoundError`, `ValidationError`, `StorageError` |
| `clear()`                 | —                                            | `Promise<void>`                                                   | `StorageError`                                     |

`update` acepta solo los campos editables (`name`, `amount`, `frequency`,
`category`, `nextChargeDate`); el estado y las fechas de sistema se modifican
únicamente por `setStatus`, `markPaid`, `cancel` y `reactivate`, de modo que el
frontend no pueda mutar el estado ni las fechas derivadas por accidente (FR-008,
FR-016, FR-017, FR-037, FR-039, FR-040).

Cada transición del ciclo de vida tiene su propio método y escribe exactamente los
campos que posee: `markPaid` es el único que puede escribir `lastPaidDate` y
`nextChargeDate` como resultado de un pago, y `cancel` es el único que puede
escribir `cancelledAt`. Las fechas que viajan en esos métodos las calcula el
dominio (`markAsPaid`, `cancelSubscription`); el repositorio solo las persiste, de
modo que ninguna regla de negocio queda en la capa de datos. El repositorio
rechaza un `id` inexistente con `NotFoundError` y valida la forma de los campos
con `ValidationError`, pero no vuelve a comprobar las precondiciones de negocio:
esa verificación es del dominio y ocurre antes de llegar al puerto.

#### Adaptador local (`LocalStorageSubscriptionRepository`)

- Recibir por inyección un `storage` con la misma forma que
  `window.localStorage` (`getItem`, `setItem`, `removeItem`). En producción se
  pasa `window.localStorage`; en pruebas, un `FakeStorage` en memoria. Esto
  permite probar el adaptador sin tocar el navegador y simular cuota
  agotada, datos corruptos y almacenamiento no disponible.
- Estrategia de **lectura única en memoria + escritura completa**:
  `findAll()` lee `getItem` una vez, valida el esquema con `parseDocument` y
  cachea el resultado; `create/update/delete/setStatus/markPaid/cancel/reactivate`
  mutan una copia del
  estado y ejecutan `setItem` del documento completo. Con el volumen objetivo
  (≤ 1.000 registros) un único documento es más simple y más rápido que un
  índice por suscripción, y mantiene la actualización atómica desde el punto de
  vista de la aplicación.
- `parseDocument(raw)` es **defensivo**: ausencia de la clave → documento vacío
  válido; JSON inválido, tipo incorrecto o `subscriptions` que no es arreglo →
  lanza `StorageCorruptedError`; excepción al leer o escribir (modo privado del
  navegador, cuota excedida) → `StorageUnavailableError`.
- Nada de datos ajenos: la clave es propia y el documento no contiene datos
  sensibles más allá de los gastos que el usuario decidió cargar (FR-034).

#### Fábrica y punto de extensión

`src/data/repositories/index.js` exporta `createRepository()`, que resuelve el
adaptador a partir de una variable de entorno (`VITE_STORAGE_DRIVER`, con
`local` por defecto) y devuelve la instancia. Cambiar a backend en el futuro es
una línea de configuración más una clase nueva:

```js
export function createRepository() {
  const driver = import.meta.env?.VITE_STORAGE_DRIVER ?? 'local';
  if (driver === 'local') return new LocalStorageSubscriptionRepository(localStorage);
  throw new Error(`Driver de almacenamiento desconocido: ${driver}`);
}
```

Esa es la única pieza del sistema que conoce el mecanismo de almacenamiento; el resto
del código depende solo del contrato.

#### Recuperación ante datos corruptos (FR-035)

`SubscriptionsProvider` captura `StorageCorruptedError` /
`StorageUnavailableError` durante la carga inicial y renderiza
`StorageErrorBanner` con el mensaje del spec y un botón "Reiniciar datos" que
invoca `repository.clear()`. Nunca se muestra una lista corrupta ni una pantalla
en blanco, y el resto de la aplicación sigue operable con el estado vacío.

#### Puntos de captura de errores

| Origen                                      | Tipo                                               | Destino en la UI                                                     |
| ------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| Validación de alta/edición                  | `ValidationError` con `errors: { campo: mensaje }` | Mensaje bajo el campo, foco al primer error (FR-001, FR-010, SC-009) |
| Suscripción inexistente                     | `NotFoundError`                                    | Mensaje informativo y se refresca el listado                         |
| Lectura/escritura corrupta o no disponible  | `StorageCorruptedError`, `StorageUnavailableError` | Banner con opción de reinicio (FR-035)                               |
| Confirmación de eliminación cancelada       | —                                                  | `ConfirmDialog` se cierra sin escribir en el repositorio (FR-011)    |
| Pago o baja sobre una suscripción no activa | `ValidationError` con mensaje en español           | Mensaje informativo y refresco del listado (FR-038, FR-039, FR-040)  |

### Capa de dominio (reglas de negocio puras)

Todo en `src/domain` es JavaScript puro: sin React, sin `localStorage`, sin
`Date.now()` implícito. La fecha de referencia se inyecta siempre por parámetro
(`{ today }`), lo que hace que los escenarios Gherkin con "Given hoy es
2026-10-01" sean directamente unit tests.

| Módulo                                    | Responsabilidad                                                                                                                                                    | Requisitos                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `dates/parseDate.js`                      | `YYYY-MM-DD` → partes numéricas, sin zona horaria                                                                                                                  | FR-005                                 |
| `dates/addMonths.js`                      | Avance mensual/anual con clamp al último día del mes y soporte de año bisiesto                                                                                     | FR-005, Edge Cases                     |
| `dates/diffDays.js`                       | Días calendario entre dos fechas (`hoy` inclusive)                                                                                                                 | FR-027, FR-032                         |
| `dates/endOfYear.js`                      | 31 de diciembre del año de referencia                                                                                                                              | FR-022                                 |
| `catalog/categories.js`                   | Catálogo de 8 categorías y su etiqueta                                                                                                                             | FR-003                                 |
| `catalog/frequencies.js`                  | `MENSUAL`/`ANUAL` y etiqueta visible                                                                                                                               | FR-002                                 |
| `subscriptions/validateSubscription.js`   | `{ isValid, errors }` por campo; reglas de nombre, monto, frecuencia, categoría y fecha                                                                            | FR-001, FR-002, FR-003, FR-004, FR-010 |
| `subscriptions/createSubscription.js`     | Normaliza entrada, genera `id`, fija `status: "ACTIVA"` y `createdAt`                                                                                              | FR-001, FR-006, FR-007                 |
| `subscriptions/applyChanges.js`           | Aplica un parche válido preservando `id`, `status` y `createdAt`                                                                                                   | FR-008, FR-009                         |
| `subscriptions/markAsPaid.js`             | `{ nextChargeDate, lastPaidDate }` a partir de la suscripción y `{ today }`; rechaza suscripciones no activas                                                      | FR-037, FR-038                         |
| `subscriptions/cancelSubscription.js`     | Fija `status: "CANCELADA"` y `cancelledAt: { today }`; rechaza una suscripción ya cancelada                                                                        | FR-006, FR-039                         |
| `subscriptions/reactivateSubscription.js` | Vuelve a `ACTIVA` y elimina `cancelledAt`; rechaza una suscripción no cancelada                                                                                    | FR-040                                 |
| `subscriptions/occurrences.js`            | `nextOccurrence(subscription, from)` y `occurrencesBetween(subscription, from, to)`                                                                                | FR-005, FR-022, FR-015                 |
| `metrics/monthlyEquivalent.js`            | Estandarización por frecuencia                                                                                                                                     | FR-020                                 |
| `metrics/summary.js`                      | Agrega total mensual, anualizado, conteos (activas, pausadas, canceladas y total) y distribución                                                                   | FR-020, FR-023, FR-024, FR-039         |
| `metrics/distribution.js`                 | Porcentajes por categoría con resto mayor; omite categorías sin gasto                                                                                              | FR-021                                 |
| `metrics/annualProjection.js`             | Suma de ocurrencias desde hoy hasta el 31 de diciembre                                                                                                             | FR-022                                 |
| `alerts/upcomingRenewals.js`              | Suscripciones activas dentro de la ventana de 7 días, ordenadas; excluye `PAUSADA` y `CANCELADA`                                                                   | FR-027, FR-028, FR-029, FR-030, FR-039 |
| `alerts/describeRenewal.js`               | Texto "hoy", "en N días", "hace N días"                                                                                                                            | FR-028, FR-032                         |
| `formatters/money.js`                     | `formatMoney(value, preferences)` con símbolo configurable y 2 decimales                                                                                           | FR-004, SC-003                         |
| `formatters/date.js`                      | Fechas legibles y días restantes; los nombres de mes salen de `catalog/months.js`; `formatPaymentDate` y `formatCancellationDate` rotulan el último pago y la baja | FR-012, FR-028, FR-038, FR-039         |

Con cero suscripciones, `summary` devuelve ceros y una distribución vacía sin
dividir por cero en ningún punto (FR-026, SC-010). `buildMetrics`,
`annualProjection` y `upcomingRenewals` exigen la referencia `today` inyectada
y lanzan si falta, para que un error de cableado en la capa de estado no pase
desapercibido como un cero silencioso.

### Capa de estado y reactividad

- `SubscriptionsProvider` (Context + `useReducer`) es la **única** fuente de
  verdad. Las acciones `LOADED`, `CREATED`, `UPDATED`, `STATUS_CHANGED` y
  `DELETED` se despachan después de que el repositorio resuelve, por lo que la
  vista siempre refleja el estado persistido.
- El reducer no calcula métricas: expone la lista. `useMetrics` y
  `useAlerts` derivan con `useMemo` a partir de la lista y de `today`.
  Cualquier alta, edición, pausa, reanudación o eliminación dispara un
  re-render del panel y de las alertas sin recarga manual (FR-019, FR-025,
  SC-002).
- `today` se resuelve una vez al montar el proveedor y se recalcula cuando la
  aplicación vuelve a primer plano (`visibilitychange`) o al detectar que
  cambió el día, para que las alertas reflejen la fecha real sin polling
  (FR-032).
- `useReducer` en lugar de multiples `useState` dispersos: las transiciones de
  estado (alta + confirmación + limpieza de formulario) se describen en un solo
  lugar y son easiest de probar.

### Componentes de interfaz

| Componente                                    | Responsabilidad                                                                                                                      | Requisitos                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `App.jsx`                                     | Monta proveedores y la composición de secciones                                                                                      | —                                                      |
| `layout/AppHeader.jsx`                        | Título, moneda configurada y total anualizado                                                                                        | FR-023                                                 |
| `layout/SectionNav.jsx`                       | Cambio de sección (Suscripciones / Panel / Alertas)                                                                                  | —                                                      |
| `subscriptions/SubscriptionList.jsx`          | Lista ordenada por próximo cobro                                                                                                     | FR-012, FR-013                                         |
| `subscriptions/SubscriptionRow.jsx`           | Fila: nombre, monto, frecuencia, categoría, próximo cobro, estado, atrasada                                                          | FR-012, FR-015                                         |
| `subscriptions/SubscriptionForm.jsx`          | Alta y edición con validación en línea                                                                                               | FR-007, FR-008, FR-009, FR-010                         |
| `subscriptions/SubscriptionActions.jsx`       | Marcar como pagada, pausar, reanudar, cancelar, reactivar, editar y eliminar; solo ofrece las acciones válidas para el estado actual | FR-012, FR-016, FR-017, FR-037, FR-038, FR-039, FR-040 |
| `subscriptions/ConfirmDialog.jsx`             | Confirmación de eliminación                                                                                                          | FR-011                                                 |
| `subscriptions/EmptyState.jsx`                | Estado vacío accionable                                                                                                              | FR-014                                                 |
| `dashboard/DashboardPanel.jsx`                | Orquesta las tarjetas del panel                                                                                                      | FR-020, FR-026                                         |
| `dashboard/MetricCard.jsx`                    | Total mensual, anualizado, proyección anual, conteos                                                                                 | FR-020, FR-022, FR-023, FR-024                         |
| `dashboard/CategoryDistribution.jsx`          | Barras de porcentaje por categoría                                                                                                   | FR-021                                                 |
| `alerts/AlertsSection.jsx`                    | Lista de alertas y estado "sin cobros próximos"                                                                                      | FR-027, FR-031                                         |
| `alerts/RenewalAlertCard.jsx`                 | Monto, fecha y días restantes                                                                                                        | FR-028, FR-030                                         |
| `common/Field.jsx`, `Button.jsx`, `Badge.jsx` | Primitivas visuales reutilizables                                                                                                    | —                                                      |
| `common/StorageErrorBanner.jsx`               | Mensaje de error de almacenamiento con reinicio                                                                                      | FR-035                                                 |

Estados visuales distinguished con Tailwind: `ACTIVA` (verde), `PAUSADA`
(ámbar, atenuada), cobro `atrasado` (rojo), `hoy` (rojo), `en N días` (ámbar),
`7 días` (ámbar claro).

### Riesgos y mitigaciones

| Riesgo                                           | Impacto                            | Mitigación                                                                                                        |
| ------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Suma de `float` deriva centavos (FR-004, SC-003) | Métricas con 0.01 de diferencia    | Agregar sin redondear, redondear solo en `formatMoney`, y comparar en pruebas con tolerancia de 0.01              |
| Zona horaria mueve la fecha un día               | Alertas y "atrasado" incorrectos   | Fechas como cadenas `YYYY-MM-DD` y aritmética de calendario propia; prohibido `new Date(iso)` para parsear        |
| Clamp de fin de mes mal implementado             | Ocurrencias en fechas inexistentes | `addMonths` con clamp al último día del mes, cubierto por casos de bisiesto y día 31                              |
| Crecimiento del documento en `localStorage`      | Cuota excedida                     | Volumen objetivo ≤ 1.000 registros (~200 kB); `StorageUnavailableError` manejado con mensaje y opción de reinicio |
| Datos persistidos por una versión anterior       | JSON ilegible tras un cambio       | `schemaVersion` + cadena de migraciones puras                                                                     |
| Métricas recalculadas desde distintos lugares    | Divergencia entre panel y alertas  | Una sola función `summary` en dominio, consumida por todos los selectores                                         |

## Constitution Check

**GATE: debe pasar antes de la Fase 0 de investigación. Reevaluar después de
la Fase 1 de diseño.**

_Estado verificado:_ constitución ratificada en
`opencode/.specify/memory/constitution.md`, **versión 1.1.0** (Ratified y Last
Amended 2026-10-01).

**Resultado de la puerta: APROBADA.** Cada principio se cumple en el diseño
planteado:

| Principio de la constitución v1.1.0               | Cumplimiento en el plan                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. El Repositorio es la Única Puerta de Datos** | Contrato asíncrono `SubscriptionRepository` (10 métodos, todos `Promise`); la UI nunca accede a `localStorage`; solo `src/services` invoca el repositorio; selección del adaptador aislada en `createRepository()`; storage inyectado para poder probar sin navegador; errores tipados (`ValidationError`, `NotFoundError`, `StorageError`) mapeados a mensajes en español |
| **II. Dominio Puro y Aisolado**                   | `src/domain/**` sin React, sin plataforma y sin E/S; `today` inyectado en toda función de fechas y métricas; `id` inyectable en `createSubscription`; fechas como cadenas `YYYY-MM-DD` con aritmética propia y clamp de fin de mes; redondeo solo en `formatters`; cobertura ≥ 90 % en dominio                                                                             |
| **III. Tailwind CSS como Estilo Exclusivo**       | Estilos con utilidades Tailwind; el único `.css` del árbol es `src/styles/index.css` (import de Tailwind + `@theme` opcional); sin estilos en línea, sin CSS Modules ni CSS-in-JS; sin librería de gráficos; estados visuales distinguibles por clase, texto e icono; usable desde 360 px                                                                                  |
| **IV. Estilo y Nomenclatura**                     | PascalCase en componentes, camelCase en funciones, UPPER_SNAKE_CASE en catálogos, `handle` en eventos, `is`/`has` en booleanos; prefijo `handle*` y singular/plural respetados; linter como puerta G-05                                                                                                                                                                    |
| **V. Código en Inglés, Producto en Español**      | Todos los nombres de archivo, símbolos y claves del documento JSON están en inglés; los textos de UI, mensajes de validación y catálogos quedan en español y se traducen desde los módulos `catalog/categories.js` y `catalog/frequencies.js`                                                                                                                              |

**Puertas de calidad que este plan debe satisfacer** (constitución v1.1.0,
sección "Restricciones de Implementación y Puertas de Calidad"):

| Puerta                       | Cómo la resuelve el plan                                                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| G-01 Trazabilidad            | Tabla "Trazabilidad Especificación → Implementación → Pruebas"                                                                                                                                                                                                           |
| G-02 Pruebas del dominio     | `tests/unit/domain/**` con cobertura ≥ 90 %                                                                                                                                                                                                                              |
| G-03 Contrato de repositorio | Contrato escrito en `specs/001-expensiveManager/contracts/subscription-repository.md` (tarea T051) más la suite reutilizable `tests/contract/repositoryContract.test.js` (tarea T062), que debe pasar cualquier adaptador                                                |
| G-04 Pruebas de historia     | `tests/integration/*Flow.test.jsx`, una suite por historia P1 a P5                                                                                                                                                                                                       |
| G-05 Lint y formato          | `eslint` 10 (configuración plana en `eslint.config.js`, con `eslint-plugin-react-hooks` y reglas que prohíben `localStorage` fuera de `src/data/`) + `prettier` 3 con `.prettierrc` y `.prettierignore`; puertas ejecutables con `npm run lint` y `npm run format:check` |
| G-06 Pruebas completas       | Suite completa verde antes de declarar una funcionalidad terminada                                                                                                                                                                                                       |
| G-07 Casos límite            | Casos del spec cubiertos en `dates.test.js`, `metrics.test.js`, `alerts.test.js`, `parseDocument.test.js` y `persistenceFlow.test.jsx`                                                                                                                                   |

**Sin violaciones que justificar.** No hay entradas pendientes en "Complexity
Tracking" por incumplimiento de la constitución: las cinco desviaciones
registradas ahí son elecciones de diseño (patrón repositorio, dominio puro,
aritmética de fechas propia, contexto único y versionado de esquema) que la
constitución exige o habilita, no excepciones a ella.

## Project Structure

### Documentation (this feature)

```text
specs/001-expensiveManager/
├── plan.md              # Este archivo (existe)
├── spec.md              # Especificación funcional (FR-001 a FR-036 en Gherkin) (existe)
├── tasks.md             # Plan de tareas T001 a T121 (existe)
├── quickstart.md        # PENDIENTE (tarea T116): guía de validación end-to-end
└── contracts/
    └── subscription-repository.md   # PENDIENTE (tarea T051): contrato del puerto y reglas de error
```

`research.md` y `data-model.md` se descartaron a propósito: para este MVP el
modelo de datos y las decisiones de stack ya están fijados en este `plan.md` y
en `spec.md`, que son la fuente de verdad.

### Source Code (repository root)

```text
expenseManager/
├── index.html
├── package.json
├── vite.config.js                        # React + Tailwind + alias @ + config de Vitest
├── jsconfig.json                         # Alias "@/*": ["src/*"]
├── eslint.config.js
├── .prettierrc
├── .prettierignore
├── .editorconfig
├── .gitignore
├── README.md
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.test.jsx                      # Prueba de humo (Fase 1)
│   ├── styles/
│   │   └── index.css                     # Único .css del proyecto (Tailwind + @theme)
│   ├── domain/                          # Reglas de negocio puras (sin React, sin E/S)
│   │   ├── catalog/
│   │   │   ├── categories.js
│   │   │   ├── frequencies.js
│   │   │   └── months.js                 # Nombres de mes en español para formatters
│   │   ├── dates/
│   │   │   ├── parseDate.js
│   │   │   ├── addMonths.js
│   │   │   ├── diffDays.js
│   │   │   ├── endOfYear.js
│   │   │   └── today.js
│   │   ├── subscriptions/
│   │   │   ├── validateSubscription.js
│   │   │   ├── createSubscription.js
│   │   │   ├── applyChanges.js
│   │   │   ├── markAsPaid.js
│   │   │   ├── cancelSubscription.js
│   │   │   ├── reactivateSubscription.js
│   │   │   └── occurrences.js
│   │   ├── metrics/
│   │   │   ├── monthlyEquivalent.js
│   │   │   ├── distribution.js
│   │   │   ├── annualProjection.js
│   │   │   └── summary.js
│   │   ├── alerts/
│   │   │   ├── upcomingRenewals.js
│   │   │   └── describeRenewal.js
│   │   └── formatters/
│   │       ├── money.js
│   │       └── date.js
│   ├── data/                            # Capa de acceso a datos (port + adaptadores)
│   │   ├── storage/
│   │   │   ├── storageAdapter.js        # get/set/remove defensivos + migraciones
│   │   │   ├── parseDocument.js         # Validación del esquema y versionado
│   │   │   └── migrations.js            # Cadena 1 -> 2 -> ... (solo v1 en el MVP)
│   │   ├── repositories/
│   │   │   ├── SubscriptionRepository.js   # Contrato (JSDoc) que todo adaptador cumple
│   │   │   ├── LocalStorageSubscriptionRepository.js
│   │   │   ├── HttpSubscriptionRepository.js  # Stub documentado, no implementado
│   │   │   └── index.js                 # createRepository() -> punto de extensión
│   │   └── errors/
│   │       ├── ValidationError.js
│   │       ├── NotFoundError.js
│   │       └── StorageError.js          # StorageCorruptedError, StorageUnavailableError
│   ├── services/
│   │   ├── subscriptionService.js       # Casos de uso: validar -> construir -> persistir
│   │   └── metricsService.js            # Fachada de lectura del panel
│   ├── state/
│   │   ├── SubscriptionsContext.jsx
│   │   ├── subscriptionsReducer.js
│   │   ├── PreferencesContext.jsx
│   │   ├── useSubscriptions.js
│   │   ├── useMetrics.js
│   │   └── useAlerts.js
│   ├── hooks/
│   │   └── useToday.js                  # Fecha de referencia, se refresca al volver a la pestaña
│   └── components/
│       ├── layout/
│       │   ├── AppHeader.jsx
│       │   └── SectionNav.jsx
│       ├── subscriptions/
│       │   ├── SubscriptionList.jsx
│       │   ├── SubscriptionRow.jsx
│       │   ├── SubscriptionForm.jsx
│       │   ├── SubscriptionActions.jsx
│       │   ├── ConfirmDialog.jsx
│       │   └── EmptyState.jsx
│       ├── dashboard/
│       │   ├── DashboardPanel.jsx
│       │   ├── MetricCard.jsx
│       │   └── CategoryDistribution.jsx
│       ├── alerts/
│       │   ├── AlertsSection.jsx
│       │   └── RenewalAlertCard.jsx
│       └── common/
│           ├── Field.jsx
│           ├── Button.jsx
│           ├── Badge.jsx
│           └── StorageErrorBanner.jsx
└── tests/
    ├── setupTests.js                     # jest-dom, limpieza de localStorage entre tests
    ├── unit/
    │   ├── domain/
    │   │   ├── dates.test.js            # bisiestos, clamp fin de mes, diffDays
    │   │   ├── validateSubscription.test.js   # FR-001 a FR-004, FR-010
    │   │   ├── occurrences.test.js      # FR-005, FR-015
    │   │   ├── metrics.test.js          # FR-020 a FR-024, SC-003, SC-004, SC-005
    │   │   ├── alerts.test.js           # FR-027 a FR-032, SC-006
    │   │   └── formatters.test.js       # FR-004, redondeo
    │   └── data/
    │       ├── parseDocument.test.js    # Datos ausentes, JSON inválido, esquema roto
    │       └── localStorageRepository.test.js  # Adaptador con FakeStorage
    ├── contract/
    │   └── repositoryContract.test.js   # Suite reutilizable: todo adaptador debe pasarla
    ├── integration/
    │   ├── crudFlow.test.jsx            # Historia P1: alta, listado, edición, eliminación
    │   ├── pauseFlow.test.jsx           # Historia P2: pausa, reanudación, métricas
    │   ├── dashboardFlow.test.jsx       # Historia P3: FR-020 a FR-026
    │   ├── alertsFlow.test.jsx          # Historia P4: FR-027 a FR-032
    │   └── persistenceFlow.test.jsx     # Historia P5: FR-033 a FR-036
    └── support/
        ├── FakeStorage.js               # localStorage en memoria
        └── fixtures.js                  # Constructores de suscripciones para pruebas
```

### Trazabilidad Especificación → Implementación → Pruebas

| Historia                              | Requisitos                                      | Módulos principales                                                                                                                              | Suite                                                                                                      |
| ------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| P1 Registrar y mantener suscripciones | FR-001, FR-002, FR-003, FR-004, FR-007 a FR-015 | `validateSubscription`, `createSubscription`, `applyChanges`, `subscriptionService`, `SubscriptionForm`, `SubscriptionList`, `ConfirmDialog`     | `unit/domain/validateSubscription.test.js`, `integration/crudFlow.test.jsx`                                |
| P2 Pausar y reanudar                  | FR-006, FR-016, FR-017, FR-018, FR-019          | `subscriptionService.setStatus`, `subscriptionsReducer`, `useMetrics`                                                                            | `integration/pauseFlow.test.jsx`                                                                           |
| P3 Panel de métricas                  | FR-020 a FR-026                                 | `metrics/*`, `dashboard/*`                                                                                                                       | `unit/domain/metrics.test.js`, `integration/dashboardFlow.test.jsx`                                        |
| P4 Alertas de renovación              | FR-027 a FR-032                                 | `alerts/*`, `useToday`, `RenewalAlertCard`                                                                                                       | `unit/domain/alerts.test.js`, `integration/alertsFlow.test.jsx`                                            |
| P5 Persistencia                       | FR-033 a FR-036                                 | `LocalStorageSubscriptionRepository`, `parseDocument`, `migrations`, `StorageErrorBanner`                                                        | `unit/data/*.test.js`, `contract/repositoryContract.test.js`, `integration/persistenceFlow.test.jsx`       |
| P6 Pago y baja de suscripciones       | FR-006, FR-037 a FR-041                         | `markAsPaid`, `cancelSubscription`, `reactivateSubscription`, `summary`, `SubscriptionActions`, `subscriptionService.markPaid/cancel/reactivate` | `unit/domain/lifecycle.test.js`, `contract/repositoryContract.test.js`, `integration/paymentFlow.test.jsx` |
| Transversal                           | SC-001 a SC-010                                 | `formatters/money`, `summary` (caso vacío)                                                                                                       | `unit/domain/metrics.test.js`, `unit/domain/formatters.test.js`                                            |

**Estrategia de pruebas**: el dominio cubre la mayor parte de los FR con
pruebas puras y rápidas (sin React), lo que hace que un fallo apunte a una regla
de negocio concreta; las pruebas de integración sobre componentes validan el
comportamiento observable de las historias; y la suite de contrato del
repositorio garantiza que la futura migración a una base de datos real no rompa
la aplicación. Cobertura objetivo: 90% en `src/domain` y `src/data`.

**Structure Decision**: proyecto único de tipo `web` con la fuente en `src/`
dividida en cuatro capas por responsabilidad — `domain` (reglas puras),
`data` (contrato y adaptadores), `state` (orquestación de UI) y `components`
(presentación) — y las pruebas en `tests/` separadas por suite. No se elige la
opción "frontend + backend" porque el MVP no tiene servidor: el repositorio
simula la base de datos desde el navegador, y esa frontera está aislada en
`src/data/` para que la futura adición de un backend sea aditiva. La
separación `domain` / `data` es la que garantiza el requisito FR-036
(independencia del origen de datos) y es la que hace testeable cada escenario
Gherkin sin navegador.

## Complexity Tracking

> **Se completa solo porque hay desviaciones justificadas frente a la opción
> más simple posible para un MVP local.**

| Violation                                                             | Por qué es necesario                                                                                                                                                | Alternativa más simple descartada porque                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Patrón Repositorio con contrato asíncrono y adaptador inyectado       | Es un compromiso explícito del README y el requisito FR-036 exige que los resultados no dependan del almacenamiento; además es lo que permite testear sin navegador | Leer y escribir `localStorage` desde los componentes: es menos código hoy, pero deja la lógica pegada al navegador, impide probar con `FakeStorage` y obligaría a reescribir componentes al migrar a una base de datos    |
| Capa de dominio con módulos puros separados de `state` y `components` | 36 FR, de los cuales las métricas (FR-020 a FR-024) exigen exactitud a centavo; aislar el cálculo permite verificarlo exhaustivamente sin montar la interfaz        | Calcular métricas dentro de los componentes: elimina archivos, pero mezcla presentación con reglas de negocio, impide reutilizar `summary` entre panel y alertas y hace que un error de cálculo solo aparezca en pantalla |
| Aritmética de fechas propia en vez de una librería                    | El spec exige clamp al último día del mes (Edge Cases), años bisiestos (FR-005) y días restantes exactos (FR-028)                                                   | `date-fns` cubre parte, pero el clamp y el cálculo de ocurrencias habría que escribirlos igual; ~60 líneas propias, probadas con casos del spec, sin dependencia externa                                                  |
| Contexto único con `useReducer` en vez de estado local por componente | FR-025 y FR-019 exigen que panel, listado y alertas se recalculen juntos tras cualquier operación, sin recarga                                                      | Estado disperso con `useState` por componente y eventos padre entre ellos: produce divergencia entre vistas y viola SC-002                                                                                                |
| Versionado del documento y cadena de migraciones                      | Agregar un campo en una versión futura no debe obligar al usuario a borrar sus gastos (spec: los datos del usuario se conservan)                                    | Sin `schemaVersion`, cualquier cambio de esquema invalida el documento y el usuario pierde todo su registro                                                                                                               |
