# Tasks: expenseManager — Gestor de Suscripciones y Gastos

**Input**: Documentos de diseño de `specs/001-expensiveManager/`

**Prerequisites**: `plan.md` (requerido), `spec.md` (requerido para las historias
de usuario), constitución ratificada v1.1.0 en `opencode/.specify/memory/constitution.md`

**Tests**: las pruebas **no son opcionales** en este proyecto. La constitución
(v1.1.0) establece las puertas G-01 a G-07, que exigen cobertura de cada
requisito funcional, contrato de repositorio, pruebas por historia y pruebas de
los casos límite del spec. Por eso cada módulo de dominio lleva su prueba
escrita **antes** de la implementación.

**Organization**: las tareas están agrupadas por capa y, dentro de cada capa,
por historia de usuario, de modo que cada historia se pueda implementar, probar
y demostrar por separado. Las historias se identifican como `US1` a `US5`
siguiendo la numeración de `spec.md` (US1 = P1 CRUD, US2 = P2 pausa, US3 = P3
panel, US4 = P4 alertas, US5 = P5 persistencia).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: historia de usuario a la que pertenece la tarea
- Las descripciones incluyen la ruta exacta del archivo
- Fases 1 a 5 siguen el orden solicitado: Inicialización → Dominio →
  Infraestructura → Estado Global → Componentes de UI
- La Fase 6 (cierre y validación) es la fase de pulido que exige la plantilla

---

## Fase 1: Inicialización (Vite + Tailwind)

**Purpose**: proyecto base que compila, muestra estilos de Tailwind y tiene las
puertas de lint y test operativas antes de escribir lógica de negocio.

**Versiones fijadas en esta fase** (verificadas en `package.json` y
`node_modules`, Node v24.13.1 / npm 11.8.0):

| Paquete                     | Versión          | Paquete                       | Versión |
| --------------------------- | ---------------- | ----------------------------- | ------- |
| `react` / `react-dom`       | 19.3.0           | `vitest`                      | 5.0.3   |
| `vite`                      | 8.3.2            | `@vitest/coverage-v8`         | 5.0.3   |
| `@vitejs/plugin-react`      | 6.1.1            | `jsdom`                       | 30.1.1  |
| `tailwindcss`               | 4.3.3            | `@testing-library/react`      | 16.3.3  |
| `@tailwindcss/vite`         | 4.3.3            | `@testing-library/user-event` | 14.6.7  |
| `eslint`                    | 10.11.0          | `@testing-library/jest-dom`   | 7.0.1   |
| `eslint-plugin-react-hooks` | 7.1.1            | `prettier`                    | 3.9.9   |
| `@eslint/js` / `globals`    | 10.0.1 / 17.13.0 |                               |         |

- [x] T001 Crear el proyecto base con `npm create vite@latest . -- --template react` y verificar que genera `package.json`, `index.html`, `vite.config.js`, `src/main.jsx` y `src/App.jsx`
  - Ejecutado sobre un directorio temporal y copiado a la raíz para no pisar `README.md`, `opencode/` ni `specs/` (Vite pregunta qué hacer si el destino no está vacío).
  - El template de Vite 8 trae `oxlint`, `src/index.css` y `src/App.css`: `oxlint` se descarta en favor de ESLint (T004) y los dos CSS se eliminan por la constitución III.
- [x] T002 Instalar dependencias de runtime y desarrollo: `npm install react react-dom` y `npm install -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @vitest/coverage-v8 eslint eslint-plugin-react-hooks prettier`
  - Se añaden además `@eslint/js`, `globals` y `@vitejs/plugin-react` (base del flat config).
  - Sin `tailwind.config.js` ni `postcss.config.js`: Tailwind 4 se integra con `@tailwindcss/vite`.
- [x] T003 [P] Registrar `@tailwindcss/vite` en `vite.config.js` y crear `src/styles/index.css` cuyo único contenido sea `@import "tailwindcss";` más, opcionalmente, un bloque `@theme` con los design tokens (constitución III: este es el único `.css` permitido)
- [x] T004 [P] Crear `eslint.config.js` con el plugin de React Hooks y la regla `no-restricted-imports` que prohíba `localStorage` fuera de `src/data/` (constitución I), y añadir el script `"lint"`
  - ESLint 10 usa configuración plana: nada de la clave `extends`.
  - La prohibición de `localStorage` se implementa con `no-restricted-globals` (el acceso directo a un global) y se complementa con `sessionStorage`, `indexedDB` y `document.cookie`; `localStorage` sí se permite en `src/data/**`.
  - `src/domain/**` añade además `no-restricted-imports` y `no-restricted-syntax` para bloquear React, `fetch`, `Date.now()` y las capas `@/data`, `@/services`, `@/state`, `@/components` (constitución II).
- [x] T005 [P] Crear `.prettierrc` (2 espacios, comillas simples, punto y coma), `.editorconfig` y extender `.gitignore` con `node_modules/`, `dist/` y `coverage/`
  - Se añade también `.prettierignore` para excluir `node_modules`, `dist`, `coverage`, `package-lock.json` y `opencode/` de `npm run format`.
- [x] T006 [P] Crear `jsconfig.json` con el alias `"@/*": ["src/*"]` para resolver imports sin rutas relativas profundas
  - El mismo alias se declara en `resolve.alias` de `vite.config.js` para que Vitest lo resuelva igual.
- [x] T007 [P] Configurar Vitest en `vite.config.js` (o `vitest.config.js`) con `environment: 'jsdom'`, `setupFiles: ['./tests/setupTests.js']`, `globals: true` y los umbrales de cobertura `90` para `src/domain/**` y `src/data/**`; crear `tests/setupTests.js` con `@testing-library/jest-dom` y limpieza de `localStorage` entre pruebas
  - `include` cubre `src/**/*.{test,spec}.{js,jsx}` y `tests/**/*.{test,spec}.{js,jsx}`, porque las suites de las Fases 2 a 5 viven en `tests/`.
- [x] T008 [P] Completar los scripts de `package.json`: `dev`, `build`, `preview`, `test`, `test:watch`, `test:coverage` y `format`
  - Se añade también `format:check`, que usa la puerta G-05 más adelante.
- [x] T009 Crear `src/App.test.jsx` como prueba de humo que renderiza `App` y verifica que el build de pruebas arranca

**Checkpoint**: `npm run dev` sirve la app con estilos de Tailwind aplicados,
`npm run lint` pasa sin errores y `npm test` pasa (solo la prueba de humo).
Verificado además con `npm run build`, `npm run format:check` y
`npm run test:coverage` (0 archivos instrumentados hasta que existan
`src/domain/**` y `src/data/**`).

---

## Fase 2: Dominio de datos y lógica pura (fechas, cálculos)

**Purpose**: todas las reglas de negocio como funciones puras, sin React ni
acceso a almacenamiento, con la fecha de referencia inyectada (constitución II).
Ninguna tarea de esta fase puede importar `react`, `localStorage`, `fetch`,
`window` o `document`.

### Fechas

- [ ] T010 Escribir `tests/unit/domain/dates.test.js` con los casos del spec: año bisiesto (2028-02-29), día 31 en mes corto (2026-04-30), `diffDays` con hoy incluido, `endOfYear` y `today` en zona horaria local
- [ ] T011 [P] [US3] Crear `src/domain/dates/parseDate.js` con `parseDate(iso)`, `formatIsoDate(parts)` e `isValidDate(iso)` que trabajen con cadenas `YYYY-MM-DD` sin `new Date(iso)` para interpretarlas
- [ ] T012 [P] [US3] Crear `src/domain/dates/addMonths.js` con `addMonths(iso, months)` que ajuste al último día del mes destino (FR-005 y caso límite "Día 31 en un mes corto")
- [ ] T013 [P] [US4] Crear `src/domain/dates/diffDays.js` con `diffDays(fromIso, toIso)` en días calendario
- [ ] T014 [P] [US3] Crear `src/domain/dates/endOfYear.js` con `endOfYear(todayIso)` que devuelva el 31 de diciembre del año de referencia
- [ ] T015 [P] [US4] Crear `src/domain/dates/today.js` con `today()` que devuelva la fecha local actual en `YYYY-MM-DD`

### Catálogos

- [ ] T016 Escribir `tests/unit/domain/catalog.test.js` que verifique los 8 valores de categoría, las etiquetas de frecuencia y estado, y que los valores persistidos estén en mayúsculas y sin tildes
- [ ] T017 [P] [US1] Crear `src/domain/catalog/categories.js` con `CATEGORIES` (8 etiquetas en español) y `isValidCategory(value)`
- [ ] T018 [P] [US1] Crear `src/domain/catalog/frequencies.js` con `FREQUENCIES` (`MENSUAL`, `ANUAL`), `FREQUENCY_LABELS` (`Mensual`, `Anual`), `STATUS_ACTIVE`/`STATUS_PAUSED` y sus etiquetas `Activa`/`Pausada`

### Suscripciones

- [ ] T019 Escribir `tests/unit/domain/validateSubscription.test.js` cubriendo nombre vacío, monto 0, monto negativo, monto no numérico, frecuencia y categoría no definidas y fecha inválida, con el mensaje en español asociado a cada campo (FR-001 a FR-004, FR-010)
- [ ] T020 [P] [US1] Crear `src/domain/subscriptions/validateSubscription.js` con `validateSubscription(input)` que devuelva `{ isValid, errors }` y mensajes en español
- [ ] T021 Escribir `tests/unit/domain/subscriptions.test.js` para `createSubscription` (id inyectable, estado inicial `ACTIVA`, `createdAt`) y para `applyChanges` (conserva `id`, `status` y `createdAt`)
- [ ] T022 [P] [US1] Crear `src/domain/subscriptions/createSubscription.js` con `createSubscription(input, { idFactory, now })`
- [ ] T023 [P] [US1] Crear `src/domain/subscriptions/applyChanges.js` con `applyChanges(subscription, changes)` que solo acepte los campos editables
- [ ] T024 Escribir `tests/unit/domain/occurrences.test.js` con los casos de cobro atrasado, día 31 en meses de 30 días y múltiples ocurrencias dentro del año
- [ ] T025 [P] [US3] Crear `src/domain/subscriptions/occurrences.js` con `nextOccurrence(subscription, fromIso)`, `occurrencesBetween(subscription, fromIso, toIso)` e `isOverdue(subscription, todayIso)` (FR-015, FR-022)

### Métricas

- [ ] T026 Escribir `tests/unit/domain/metrics.test.js` con los `Examples` del spec: mensualización (10000, 120000/12, 24000/12, 35000/12 = 5833.33), exclusión de pausadas, porcentajes por categoría con resto mayor, suma de 100% con tolerancia de 1 punto, proyección anual (45000, 120000, 0, 69000) y panel vacío en cero (SC-003, SC-004, SC-005, SC-010)
- [ ] T027 [P] [US3] Crear `src/domain/metrics/monthlyEquivalent.js` con `monthlyEquivalent(amount, frequency)` (FR-020)
- [ ] T028 [P] [US3] Crear `src/domain/metrics/distribution.js` con `distributionByCategory(subscriptions)` que aplique resto mayor y omita categorías sin gasto (FR-021)
- [ ] T029 [P] [US3] Crear `src/domain/metrics/annualProjection.js` con `annualProjection(subscriptions, { today })` sumando ocurrencias hasta el 31 de diciembre y contando cada cobro anual una sola vez (FR-022)
- [ ] T030 [P] [US3] Crear `src/domain/metrics/summary.js` con `buildMetrics(subscriptions, { today })` que componga total mensual, anualizado, distribución, proyección y conteos, y devuelva ceros sin dividir entre cero con la lista vacía (FR-023, FR-024, FR-026)

### Alertas

- [ ] T031 Escribir `tests/unit/domain/alerts.test.js` con la ventana de 7 días inclusiva: hoy, 4 días, 7 días sí aparecen; 8 días y 3 meses no; pausadas excluidas; orden ascendente; y el comportamiento cuando cambia la fecha del sistema (FR-027 a FR-032, SC-006)
- [ ] T032 [P] [US4] Crear `src/domain/alerts/upcomingRenewals.js` con `upcomingRenewals(subscriptions, { today, windowDays: 7 })` que devuelva nombre, monto, fecha y `daysRemaining`, ordenado por fecha
- [ ] T033 [P] [US4] Crear `src/domain/alerts/describeRenewal.js` con `describeRenewal(alert)` en español: "Cobra hoy", "En N días", "Cobro atrasado"

### Formato

- [ ] T034 Escribir `tests/unit/domain/formatters.test.js` con `formatMoney(15000)` → `$ 15000`, `formatMoney(8333.333…)` → `$ 8333.33` y el formato de fechas y días restantes
- [ ] T035 [P] [US1] Crear `src/domain/formatters/money.js` con `formatMoney(value, { currencySymbol })` y `round2(value)`; es el único lugar del código donde se redondea (constitución II)
- [ ] T036 [P] [US1] Crear `src/domain/formatters/date.js` con `formatDate(iso)` y `formatDaysRemaining(days)`

### Guardia arquitectónica

- [ ] T037 Crear `tests/unit/architecture.test.js` que recorra `src/domain/**` y falle si algún archivo importa `react`, `localStorage`, `fetch`, `window` o `document`, o si usa `Date.now()` de forma implícita (constituciones I y II, puerta G-05)

**Checkpoint**: `npm run test:coverage` pasa con 90% o más en `src/domain/**`,
`src/domain` no importa nada externo y los casos límite del spec están cubiertos.

---

## Fase 3: Infraestructura (Patrón Repositorio y LocalStorage)

**Purpose**: contrato de repositorio, adaptador de LocalStorage y errores
tipados, de modo que la UI nunca toque el almacenamiento y la migración a una
base de datos real sea aditiva (constitución I).

### Contrato

- [ ] T038 [US5] Crear `specs/001-expensiveManager/contracts/subscription-repository.md` con el contrato completo del puerto: los 7 métodos asíncronos con su firma y sus errores tipados, la forma del documento persistido (`schemaVersion` y `subscriptions`), la regla de que todo adaptador devuelve `Promise` y no puede filtrar el almacenamiento, y una sección de contrato para el `HttpSubscriptionRepository` futuro. Es la referencia escrita que implementan T050 (contrato en JSDoc), T051 (adaptador de localStorage) y T052 (stub HTTP), y que verifica la suite de contrato T049 (puerta G-03)

### Errores

- [ ] T039 Escribir `tests/unit/data/errors.test.js` que verifique nombre, mensaje y cadena `cause` de cada tipo de error
- [ ] T040 [P] [US1] Crear `src/data/errors/ValidationError.js` con `errors` por campo y mensaje en español
- [ ] T041 [P] [US1] Crear `src/data/errors/NotFoundError.js`
- [ ] T042 [P] [US5] Crear `src/data/errors/StorageError.js` con las variantes `StorageCorruptedError` y `StorageUnavailableError`

### Almacenamiento

- [ ] T043 [P] Crear `tests/support/FakeStorage.js`, un doble de `localStorage` en memoria con capacidad de simular cuota excedida y escritura fallida
- [ ] T044 [P] Crear `tests/support/fixtures.js` con constructores de suscripciones de prueba y una fecha de referencia fija (2026-10-01) reutilizable
- [ ] T045 Escribir `tests/unit/data/parseDocument.test.js` con los casos: clave ausente, JSON inválido, `subscriptions` que no es arreglo, `schemaVersion` desconocido y documento válido
- [ ] T046 [P] [US5] Crear `src/data/storage/migrations.js` con la cadena de migraciones versionadas (solo la versión 1 en el MVP, con el punto de extensión definido)
- [ ] T047 [P] [US5] Crear `src/data/storage/parseDocument.js` con `parseDocument(raw)` y `serializeDocument(document)`, defensivo frente a datos corruptos
- [ ] T048 [US5] Crear `src/data/storage/storageAdapter.js` que envuelva `getItem`/`setItem`/`removeItem` en `try/catch`, aplique migraciones y traduzca fallos a `StorageError` (FR-035)

### Repositorio

- [ ] T049 Escribir `tests/contract/repositoryContract.test.js` como suite reutilizable que cualquier adaptador debe pasar: `findAll` ordenado por próximo cobro, `findById`, `create`, `update` preservando estado, `delete`, `setStatus`, `clear` y propagación de errores (puerta G-03)
- [ ] T050 [US5] Crear `src/data/repositories/SubscriptionRepository.js` con el contrato documentado en JSDoc: 7 métodos, todos con retorno `Promise`, y `update` limitado a los campos editables
- [ ] T051 [US5] [P] Crear `src/data/repositories/LocalStorageSubscriptionRepository.js` con storage inyectado, caché en memoria y escritura del documento completo en cada operación
- [ ] T052 [US5] [P] Crear `src/data/repositories/HttpSubscriptionRepository.js` como stub documentado que cumple el contrato con `fetch` y no está conectado a la selección activa
- [ ] T053 [US5] Crear `src/data/repositories/index.js` con `createRepository()` que resuelve el adaptador desde `VITE_STORAGE_DRIVER` y falla con error explícito ante un driver desconocido
- [ ] T054 Escribir `tests/unit/data/localStorageRepository.test.js` con `FakeStorage`, incluidos los escenarios de cuota excedida y almacenamiento no disponible (FR-033 a FR-035)

**Checkpoint**: la suite de contrato pasa para el adaptador local y cambiar
`VITE_STORAGE_DRIVER` no requiere tocar ningún otro archivo (FR-036).

---

## Fase 4: Estado Global (Context/Reducers) y capa de servicios

**Purpose**: única fuente de verdad en la interfaz. Los componentes no invocan
el repositorio: consumen los hooks, que a su vez usan los servicios, único
capa autorizada para hablar con el repositorio (constitución I).

### Reducer y fecha de referencia

- [ ] T055 Escribir `tests/unit/state/subscriptionsReducer.test.js` para las acciones `LOADED`, `CREATED`, `UPDATED`, `STATUS_CHANGED`, `DELETED`, `ERROR` y `RESET`
- [ ] T056 [US1] Crear `src/state/subscriptionsReducer.js` con el reducer y la tabla de acciones, sin ningún cálculo de métricas
- [ ] T057 [P] Escribir `tests/unit/hooks/useToday.test.js` con reloj falso para verificar que la fecha de referencia se recalcula al volver a la pestaña
- [ ] T058 [P] [US4] Crear `src/hooks/useToday.js` que resuelva `today()` al montar y lo refresque con `visibilitychange` (FR-032)

### Servicios (única capa que invoca el repositorio)

- [ ] T059 [P] Escribir `tests/unit/services/subscriptionService.test.js` cubriendo alta, edición, pausa, reanudación, eliminación y propagación de `ValidationError` y `NotFoundError` con un repositorio falso
- [ ] T060 [P] [US1] Crear `src/services/subscriptionService.js` con `list`, `create`, `update`, `remove`, `pause` y `resume`, respetando la secuencia validar → construir entidad → persistir
- [ ] T061 [P] Escribir `tests/unit/services/metricsService.test.js` que verifique que el panel se construye con la función de dominio y no con fórmulas propias
- [ ] T062 [P] [US3] Crear `src/services/metricsService.js` como fachada de lectura que delega en `buildMetrics` y `upcomingRenewals`

### Contextos y hooks

- [ ] T063 [P] Escribir `tests/unit/state/PreferencesContext.test.js` para la moneda configurable con símbolo `$` por defecto (FR-004)
- [ ] T064 [P] [US1] Crear `src/state/PreferencesContext.jsx`
- [ ] T065 Escribir `tests/integration/stateFlow.test.jsx` para la carga inicial, el estado de error de almacenamiento y el reinicio de datos (FR-035, FR-036)
- [ ] T066 [US1] Crear `src/state/SubscriptionsContext.jsx` que carga con `createRepository()`, despacha después de que el repositorio resuelva y expone el estado de error
- [ ] T067 [P] [US1] Crear `src/state/useSubscriptions.js` con las acciones de alta, edición, pausa, reanudación y eliminación
- [ ] T068 [P] [US3] Crear `src/state/useMetrics.js` con `useMemo` sobre la lista y la fecha de referencia
- [ ] T069 [P] [US4] Crear `src/state/useAlerts.js` con `useMemo` sobre la lista y la fecha de referencia

**Checkpoint**: los ganchos entregan métricas, alertas y conteos recalculados en
la misma interacción, sin recarga manual (FR-019, FR-025, SC-002).

---

## Fase 5: Componentes de UI

**Purpose**: interfaz en español, estilizada solo con Tailwind, que hace
verificables las cinco historias de usuario de punta a punta (constituciones
III y V).

### Pruebas de historia (se escriben primero)

- [ ] T070 [US1] Escribir `tests/integration/crudFlow.test.jsx`: alta válida, rechazo con mensajes por campo, listado ordenado por próximo cobro, edición que conserva estado, descarte de cambios, eliminación con confirmación y estado vacío accionable
- [ ] T071 [US2] Escribir `tests/integration/pauseFlow.test.jsx`: pausa, exclusión inmediata de métricas y alertas, reanudación, ciclo reversible y eliminación de una pausada
- [ ] T072 [US3] Escribir `tests/integration/dashboardFlow.test.jsx`: total mensual, peso de una suscripción anual en el listado, distribución por categoría, proyección anual, anualizado, conteos y panel vacío coherente
- [ ] T073 [US4] Escribir `tests/integration/alertsFlow.test.jsx`: alerta de hoy, de 4 y de 7 días, ausencia a 8 días, exclusión de pausadas, orden, contenido de la tarjeta, mensaje sin cobros próximos y actualización al cambiar la fecha
- [ ] T074 [US5] Escribir `tests/integration/persistenceFlow.test.jsx`: los datos sobreviven a cerrar y reabrir, banner de almacenamiento corrupto con opción de reiniciar y recuperación al estado vacío

### Primitivas y layout

- [ ] T075 [P] [US1] Crear `src/components/common/Button.jsx` con variantes Tailwind
- [ ] T076 [P] [US1] Crear `src/components/common/Field.jsx` con etiqueta accesible, mensaje de error en español y foco en el primer campo inválido
- [ ] T077 [P] [US1] Crear `src/components/common/Badge.jsx` para los estados activo, pausado, atrasado y alerta
- [ ] T078 [US5] Crear `src/components/common/StorageErrorBanner.jsx` con el mensaje de FR-035 y la acción de reiniciar datos
- [ ] T079 [P] [US1] Crear `src/components/layout/AppHeader.jsx` con título y referencia de gasto anualizado
- [ ] T080 [P] [US1] Crear `src/components/layout/SectionNav.jsx` para cambiar entre suscripciones, panel y alertas

### Suscripciones

- [ ] T081 [US1] Crear `src/components/subscriptions/SubscriptionForm.jsx` para alta y edición con validación en línea, mensajes en español y limpieza del formulario tras confirmar
- [ ] T082 [US1] Crear `src/components/subscriptions/SubscriptionList.jsx` con orden por próximo cobro
- [ ] T083 [US1] Crear `src/components/subscriptions/SubscriptionRow.jsx` con nombre, monto, peso mensual de las anuales, categoría, próximo cobro, marca de atraso y nombre largo acotado
- [ ] T084 [US2] Crear `src/components/subscriptions/SubscriptionActions.jsx` con pausar, reanudar, editar y eliminar
- [ ] T085 [US1] Crear `src/components/subscriptions/ConfirmDialog.jsx` con foco atrapado y cancelación sin escritura
- [ ] T086 [US1] Crear `src/components/subscriptions/EmptyState.jsx` con mensaje y acción de registrar la primera

### Panel y alertas

- [ ] T087 [P] [US3] Crear `src/components/dashboard/MetricCard.jsx` para total mensual, anualizado, proyección anual y conteos
- [ ] T088 [P] [US3] Crear `src/components/dashboard/CategoryDistribution.jsx` con barras de porcentaje en Tailwind, sin librería de gráficos
- [ ] T089 [US3] Crear `src/components/dashboard/DashboardPanel.jsx` que orquesta las tarjetas y el mensaje de panel vacío
- [ ] T090 [P] [US4] Crear `src/components/alerts/RenewalAlertCard.jsx` con monto, fecha y días restantes
- [ ] T091 [P] [US4] Crear `src/components/alerts/AlertsSection.jsx` con la lista de alertas y el estado "no hay cobros en los próximos 7 días"

### Composición

- [ ] T092 [US1] Cablear `src/App.jsx` con `SubscriptionsProvider`, `PreferencesProvider` y las tres secciones, y definir los design tokens en el bloque `@theme` de `src/styles/index.css`
- [ ] T093 [P] [US1] Verificar que ninguna vista usa el atributo `style`, que no existen archivos `.css` fuera de `src/styles/index.css` y que todo estado visual se distingue con clase más texto o icono
- [ ] T094 [P] [US1] Verificar la interfaz desde 360 px de ancho y que todo control interactivo tiene etiqueta accesible y foco visible

**Checkpoint**: `crudFlow`, `pauseFlow`, `dashboardFlow`, `alertsFlow` y
`persistenceFlow` pasan; cada historia se puede demostrar por separado.

---

## Fase 6: Cierre y validación

**Purpose**: cumplir las puertas de calidad de la constitución y dejar el
proyecto documentado y reproducible.

- [ ] T095 [P] Crear `specs/001-expensiveManager/quickstart.md` con los pasos de validación de punta a punta y los resultados esperados
- [ ] T096 [P] Actualizar `README.md` con requisitos, comandos de instalación, desarrollo, pruebas y estructura del proyecto
- [ ] T097 Ejecutar la suite completa con `npm run test:coverage` y confirmar los umbrales: 90% en `src/domain/**` y `src/data/**`, y 100% de los casos límite del spec cubiertos (puertas G-02, G-06, G-07)
- [ ] T098 Ejecutar `npm run lint` y `npm run format:check` sin errores y sin reglas desactivadas (puerta G-05)
- [ ] T099 Revisar el cumplimiento de la constitución v1.1.0 principio por principio y de las puertas G-01 a G-07, y confirmar que la tabla de trazabilidad de `plan.md` sigue siendo exacta (G-01)
- [ ] T100 Revisar `git status` y `git diff`, verificar que no hay secretos ni datos de usuario en el repositorio, y crear un commit final con mensaje en inglés según el Principio V

**Checkpoint**: funcionalidad terminada y con cumplimiento verificado de la constitución.

---

## Dependencias y Orden de Ejecución

### Dependencias entre fases

- **Fase 1 (Inicialización)**: sin dependencias, puede empezar de inmediato.
- **Fase 2 (Dominio)**: depende de la Fase 1 (necesita el runner de pruebas).
  No depende de la Fase 3.
- **Fase 3 (Infraestructura)**: depende de la Fase 1. Puede ejecutarse en
  paralelo con la Fase 2.
- **Fase 4 (Estado Global)**: depende de las Fases 2 y 3 (los hooks consumen
  dominio y servicios).
- **Fase 5 (Componentes de UI)**: depende de la Fase 4. Las pruebas de historia
  T070 a T074 dependen de la Fase 4, no de los componentes.
- **Fase 6 (Cierre)**: depende de todo lo anterior.

### Dependencias entre historias

- **US1 (P1)**: puede empezar tras las Fases 1 a 4. No depende de otras historias.
- **US2 (P2)**: depende de US1 solo para reutilizar el formulario y la fila;
  su comportamiento es verificable de forma aislada.
- **US3 (P3)**: depende de US1 y US2 para tener datos, pero su cálculo es
  verificable con `buildMetrics` sin UI.
- **US4 (P4)**: depende de US1; se verifica con `upcomingRenewals` sin UI.
- **US5 (P5)**: depende de la Fase 3; se verifica con la suite de contrato sin UI.

### Dentro de cada historia

- La prueba se escribe y se confirma en rojo antes de la implementación.
- Los catálogos y el dominio antes que los servicios.
- El repositorio antes que los servicios; los servicios antes que los hooks.
- Los hooks antes que los componentes.
- La historia se completa antes de pasar a la siguiente prioridad.

### Oportunidades de paralelismo

- Todas las tareas `[P]` de la Fase 1 pueden ejecutarse en paralelo.
- Las Fases 2 y 3 pueden ejecutarse en paralelo por personas distintas.
- Dentro de la Fase 2, los grupos de fechas, catálogos, suscripciones,
  métricas, alertas y formatters son independientes entre sí.
- Dentro de la Fase 5, las tareas `[P]` de primitivas, layout, tarjetas y
  alertas no se bloquean entre sí; solo dependen de los hooks.
- Las pruebas de historia T070 a T074 pueden escribirse en paralelo una vez
  cerrada la Fase 4.

---

## Ejemplo de Ejecución en Paralelo

```bash
# Fase 2, grupo de métricas y grupo de alertas en paralelo:
Task: "T027 [P] [US3] Crear src/domain/metrics/monthlyEquivalent.js"
Task: "T032 [P] [US4] Crear src/domain/alerts/upcomingRenewals.js"

# Fase 3, adaptadores en paralelo una vez definido el contrato:
Task: "T051 [US5] [P] Crear src/data/repositories/LocalStorageSubscriptionRepository.js"
Task: "T052 [US5] [P] Crear src/data/repositories/HttpSubscriptionRepository.js"
```

---

## Estrategia de Implementación

### Primero el MVP (solo US1)

1. Completar Fase 1: Inicialización
2. Completar Fases 2 y 3: Dominio e Infraestructura
3. Completar Fase 4: Estado Global
4. Completar solo las tareas de US1 de la Fase 5 (T070, T075 a T086, T092)
5. **DETENERSE Y VALIDAR**: ejecutar `crudFlow` de forma aislada
6. Entregar o demostrar el MVP de CRUD

### Entrega incremental

1. Fase 1 + Fases 2 y 3 → base lista
2. US1 → validar `crudFlow` → entregar MVP
3. US2 → validar `pauseFlow` → entregar
4. US3 → validar `dashboardFlow` → entregar
5. US4 → validar `alertsFlow` → entregar
6. US5 → validar `persistenceFlow` y la suite de contrato → entregar
7. Cada historia aporta valor sin romper las anteriores

### Equipo con varias personas

1. Todo el equipo completa las Fases 1, 2 y 3 en paralelo
2. Una vez cerrada la Fase 4:
   - Persona A: componentes de suscripciones (T081 a T086)
   - Persona B: panel y alertas (T087 a T091)
   - Persona C: pruebas de historia (T070 a T074)
3. Las historias se integran de forma independiente

---

## Notas

- Las tareas `[P]` tocan archivos distintos y no dependen entre sí.
- La etiqueta `[Story]` mapea cada tarea a una historia para trazabilidad
  (puerta G-01 de la constitución).
- Cada historia debe ser completable y verificable de forma independiente.
- Confirmar que las pruebas fallan antes de implementar.
- Un commit por tarea o por grupo lógico, con mensaje en inglés en formato
  Conventional Commits (constitución V).
- Detenerse en cualquier checkpoint para validar la historia de forma aislada.
- Prohibido: tareas vagas, conflictos sobre el mismo archivo, dependencias
  entre historias que rompan la independencia y código provisional para que una
  puerta de calidad pase.
- Los ejemplos del bloque "Ejemplo de Ejecución en Paralelo" usan la
  nomenclatura real de tareas de este documento.

## Puertas de Calidad de la Constitución v1.1.0

| Puerta                         | Tareas que la satisfacen                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| G-01 Trazabilidad FR → prueba  | T010, T016, T019, T021, T024, T026, T031, T034, T049, T054, T070 a T074, T099                            |
| G-02 Pruebas del dominio (90%) | T010 a T037 y umbral en T007                                                                             |
| G-03 Contrato de repositorio   | T038 (contrato escrito), T049 (suite reutilizable), T050 (puerto en JSDoc), T051 (adaptador local), T054 |
| G-04 Pruebas por historia      | T070 (US1), T071 (US2), T072 (US3), T073 (US4), T074 (US5)                                               |
| G-05 Lint y formato            | T004, T005, T037, T093, T098                                                                             |
| G-06 Suite completa            | T097                                                                                                     |
| G-07 Casos límite del spec     | T010, T024, T026, T031, T045, T054, T073, T097                                                           |
