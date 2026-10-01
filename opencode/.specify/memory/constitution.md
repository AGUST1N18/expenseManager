# expenseManager Constitution

Las reglas de este documento son **no negociables**. Prevalece sobre el README,
sobre los planes de implementación, sobre las tareas y sobre cualquier práctica
habitual del equipo o de la herramienta que se use. Todo el código y toda
decisión de arquitectura del proyecto deben ser justificables frente a este
documento. Si una regla estorba, se **enmienda la constitución**: nunca se la
rodea.

**Alcance**: aplicación web de gestión de suscripciones y gastos recurrentes,
desarrollada con React + Vite + Tailwind CSS, almacenamiento local y arquitectura
basada en Patrón Repositorio.

**Idiomas oficiales del proyecto** (dos idiomas, con una frontera estricta):

- **Inglés** para todo identificador, archivo, comentario y mensaje de commit
  del código fuente, y para las claves del documento de datos persistido.
- **Español** para todo lo que ve o lee una persona usuera o interesada sin
  tocar el código: textos de la interfaz, mensajes de validación y de error,
  contenido de los catálogos de dominio (categorías, frecuencias, estados) y
  documentación de producto (`spec.md`, `plan.md`, esta constitución y el
  `README.md`).

La frontera es unidireccional: el código describe datos con claves inglesas, y
un módulo de catálogo traduce esas claves a las etiquetas en español que la
interfaz muestra. Ningún archivo de código fuente contiene textos de
interfaz.

## Core Principles

### I. El Repositorio es la Única Puerta de Datos (NON-NEGOTIABLE)

- Todo acceso a datos persistidos MUST pasar por un repositorio que cumpla un
  contrato asíncrono explícito y documentado (`SubscriptionRepository` y sus
  sucesores).
- Los componentes de interfaz MUST NOT acceder a `localStorage`,
  `sessionStorage`, `indexedDB` ni `document.cookie`, ni de forma directa ni
  indirecta (a través de utilidades, hooks propios o funciones auxiliares).
- La capa de UI MUST NOT conocer la clave de almacenamiento, el formato del
  documento persistido ni la versión del esquema.
- Los componentes MUST NOT invocar el repositorio: MUST consumir la capa de
  servicio (`src/services/`), que es el único módulo autorizado a invocar el
  repositorio.
- La selección del adaptador concreto MUST ocurrir en un único punto de
  composición (`createRepository()`). Ningún otro módulo MUST importar una
  implementación concreta de repositorio.
- Todo método del repositorio MUST devolver una `Promise`, aunque la
  implementación sea local y sincrónica. La asincronía es parte del contrato,
  no un detalle de la implementación.
- Los fallos MUST propagarse como tipos de error declarados (`ValidationError`,
  `NotFoundError`, `StorageError` y sus subtipos) y MUST mapearse a mensajes en
  español en la capa de presentación.
- Las pruebas MUST poder ejecutarse sin `localStorage` real, mediante un
  storage inyectado y falso.
- Cambiar de LocalStorage a una base de datos real MUST ser aditivo: se agrega
  un adaptador del mismo contrato y se cambia la selección. Ninguna regla de
  negocio, componente o prueba de dominio puede requerir modificación.

> **Por qué**: es el compromiso explícito del README y la razón de que la lógica
> de negocio sea portable. Sin esta frontera, la migración a un backend exige
> reescribir la aplicación completa.

### II. Dominio Puro y Aislado (NON-NEGOTIABLE)

- `src/domain/**` MUST contener únicamente funciones puras: mismas entradas,
  misma salida, sin efectos secundarios observables.
- `src/domain/**` MUST NOT importar React, hooks, JSX ni ningún módulo de
  `src/data/`, `src/services/`, `src/state/` o `src/components/`.
- `src/domain/**` MUST NOT acceder a `localStorage`, `fetch`, `window`,
  `document` ni a ninguna API de plataforma.
- `src/domain/**` MUST NOT leer la hora del sistema de forma implícita. La fecha
  de referencia MUST inyectarse siempre (`{ today }`) para que los escenarios
  con fecha fija sean pruebas deterministas.
- La generación de identificadores MUST estar encapsulada en un único módulo y
  MUST ser inyectable para poder fijar el `id` en las pruebas.
- Las fechas MUST representarse y manipularse como cadenas `YYYY-MM-DD`.
  Está prohibido usar `new Date(isoString)` para interpretarlas y prohibido
  hacer aritmética de calendario en UTC, por los corrimientos de zona horaria.
- El redondeo de montos MUST aplicarse únicamente en la capa de presentación
  (`formatters`). Los agregados MUST calcularse sobre valores sin redondear.
- Un componente MUST NOT contener cálculos de métricas, fechas, porcentajes ni
  agrupamientos: MUST consumir funciones de dominio.
- Cada función de dominio MUST tener al menos un test unitario, y la cobertura de
  `src/domain/**` MUST ser igual o superior al 90 %.
- Una regla de negocio MUST estar en un solo lugar. Está prohibido duplicar una
  fórmula de cálculo entre el panel, las alertas y el listado.

> **Por qué**: los criterios de éxito del spec (SC-003 a SC-006) exigen
> exactitud a centavo y a punto porcentual. Aislar el cálculo permite
> verificarlo exhaustivamente sin montar la interfaz, y hace que un error
> apunte a una regla concreta.

### III. Tailwind CSS como Estilo Exclusivo (NON-NEGOTIABLE)

- Los estilos MUST expresarse exclusivamente con utilidades de Tailwind CSS.
- Está PROHIBIDO el uso de estilos en línea: el atributo `style` y cualquier
  expresión `style={{ ... }}` MUST NOT usarse.
- Está PROHIBIDO crear archivos `.css` sueltos. El único archivo `.css`
  permitido en el repositorio es `src/styles/index.css`, y su contenido MUST
  limitarse a la importación de Tailwind y, opcionalmente, a un bloque `@theme`
  con los design tokens del proyecto.
- MUST NOT usarse CSS Modules, `styled-components`, `emotion` ni ninguna otra
  variante de CSS-in-JS.
- MUST NOT añadirse librerías de UI ni de gráficos sin una enmienda previa de
  esta constitución que documente el motivo.
- Todo estado visual (activa, pausada, cobro atrasado, alerta de hoy, alerta
  próxima, estado vacío, error de almacenamiento) MUST ser distinguible mediante
  clases de Tailwind y MUST NOT depender únicamente del color: cada estado
  necesita texto o icono que lo identifique.
- Todo control interactivo MUST tener etiqueta accesible asociada y estado de
  foco visible.
- La interfaz MUST ser utilizable desde 360 px de ancho hasta escritorio. Está
  prohibido fijar anchos absolutos que impidan el uso móvil.

> **Por qué**: el README define Tailwind como herramienta de estilización del
> MVP. Mezclar mechanisms de estilos produce inconsistencia visual y difficulty
> para verificar estados.

### IV. Estilo y Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Componentes React | PascalCase | `SubscriptionList` |
| Funciones, variables, parámetros, props | camelCase | `calculateMonthlySpend` |
| Constantes inmutables (catálogos, enumeraciones) | UPPER_SNAKE_CASE | `CATEGORIES`, `FREQUENCIES` |
| Módulos y archivos | Nombre del símbolo exportado, con su misma convención | `calculateMonthlySpend.js`, `SubscriptionList.jsx` |
| Pruebas | Nombre del módulo bajo prueba | `calculateMonthlySpend.test.js` |
| Pruebas de contrato e integración | Nombre del comportamiento | `repositoryContract.test.js`, `crudFlow.test.jsx` |
| Booleanos y predicados | Prefijo `is`, `has`, `can` | `isActive`, `hasAlerts` |
| Manejadores de eventos | Prefijo `handle` | `handleSave`, `handleDelete` |
| Colecciones | Plural | `subscriptions` |
| Entidades y valores singulares | Singular | `subscription` |

- El código fuente MUST estar escrito en inglés (ver Principio V).
- MUST NOT usarse nombres de una sola letra, salvo `i` en bucles acotados.
- MUST NOT usarse abreviaturas no obvias ni nombres que no describan la
  intención.
- El formato MUST ser uniforme: 2 espacios de indentación, comillas simples,
  punto y coma, sin espacios finales.
- El linter MUST estar configurado y MUST pasar sin errores antes de cada
  commit. Está prohibido desactivar una regla del linter para hacer pasar un
  commit; la corrección corresponde al código o a una enmienda de la
  constitución.

> **Por qué**: nombres y formato uniformes hacen que el código se lea sin
> contexto y que las revisiones se centren en el comportamiento.

### V. Código en Inglés, Producto en Español (NON-NEGOTIABLE)

**Code (inglés)**

- Todo identificador del código fuente MUST estar en inglés: variables,
  funciones, componentes, parámetros, props, tipos y constantes.
- Los archivos y directorios propiedad del proyecto MUST estar nombrados en
  inglés.
- Las claves del documento de datos persistido MUST estar en inglés, de modo
  que el esquema sea convencional, portable y legible por cualquier herramienta o
  futuro backend.
- Los mensajes de los commits MUST estar en inglés y MUST seguir el formato
  Conventional Commits: `feat(dashboard): add annual projection`.
- Los comentarios de código MUST estar en inglés y MUST explicar el porqué, no
  el qué.
- Los identificadores de dominio MUST usar las palabras del modelo de datos
  aprovado en el plan técnico, sin traducción improvisada: `name`, `amount`,
  `frequency`, `category`, `nextChargeDate`, `status`, `createdAt`.
- Los identificadores genéricos o de framework MUST NOT traducirse ni
  reinventarse: se usan los términos habituales del ecosistema (`props`,
  `state`, `children`, `data`, `error`, `loading`).

**Producto (español)**

- Todos los textos visibles en la interfaz MUST estar en español, incluidos
  etiquetas, botones, títulos de sección, estados vacíos y textos de las
  tarjetas de alerta.
- Los mensajes de validación y de error MUST estar en español y MUST nombrar el
  campo que el usuario debe corregir.
- El contenido de los catálogos de dominio MUST estar en español, tal como lo
  define la especificación: categorías (`Entretenimiento`, `Trabajo`, `Salud`,
  `Educación`, `Hogar`, `Utilidades`, `Finanzas`, `Otros`) y las etiquetas de
  frecuencia (`Mensual`, `Anual`) y estado (`Activa`, `Pausada`).
- Los valores de esas enumeraciones, cuando se persistan, MUST almacenarse en
  mayúsculas y sin tildes para que sean claves estables: `MENSUAL`, `ANUAL`,
  `ACTIVA`, `PAUSADA`.
- La traducción entre la clave de dominio y la etiqueta visible MUST estar
  centralizada en un módulo de catálogo por enumeración. Está prohibido
  traducir en línea dentro de un componente.
- La documentación de producto (`README.md`, `spec.md`, `plan.md`, esta
  constitución) MUST estar en español.

**Frontera**

- Ningún archivo de `src/` MUST contener literales de texto de interfaz fuera
  de los módulos de catálogo. Las etiquetas visibles MUST llegar al componente
  desde el catálogo o desde una constante compartida.
- Ningún identificador del código fuente MUST contener palabras en español.
  Excepción: los valores de catálogo, que son datos y no código.

> **Por qué**: el código en inglés lo puede leer cualquier desarrollador y lo
> pueden consumir herramientas estándar; el producto en español es lo que
> realmente usa la persona. Mantener la frontera explícita evita el caso
> habitual de una base de código con identificadores en un idioma y textos en
> otro sin regla que lo justifique.

**Excepciones obligatorias** (nombres impuestos por herramientas externas, que
no se traducen): `package.json`, `package-lock.json`, `index.html`,
`vite.config.js`, `tailwind.config.js`, `postcss.config.js`,
`eslint.config.js`, `jsconfig.json`, `node_modules/`, `README.md`, `LICENSE`,
`specs/`, `src/main.jsx`.

## Restricciones de Implementación y Puertas de Calidad

**Tecnología**

- El stack MUST ser React + Vite + Tailwind CSS, según la decisión registrada en
  el plan técnico.
- Está prohibido introducir un backend, una base de datos, autenticación,
  sincronización en la nube, notificaciones push o una aplicación móvil dentro
  del alcance del MVP. Cualquiera de estas capacidades requiere una enmienda de
  alcance y una nueva especificación.
- Toda dependencia nueva MUST justificarse por escrito y quedar registrada como
  complejidad aceptada en el plan. La regla por defecto es no añadir
  dependencias: el presupuesto actual es React, Vite, Tailwind y el stack de
  pruebas.

**Puertas de calidad (bloquean la integración)**

- **G-01 Trazabilidad**: cada requisito funcional MUST tener al menos una prueba
  que lo verifique, y la correspondencia MUST estar declarada de forma explícita
  en el plan de la funcionalidad.
- **G-02 Pruebas del dominio**: los cambios en `src/domain/**` MUST venir
  acompañados de pruebas unitarias; la cobertura MUST ser igual o superior al
  90 %.
- **G-03 Contrato de repositorio**: todo adaptador MUST pasar la suite de
  contrato compartida. Ninguna implementación concreta puede tener un
  comportamiento que el contrato no describa.
- **G-04 Pruebas de historia**: cada historia de usuario MUST tener pruebas de
  integración que verifiquen su comportamiento observable de punta a punta.
- **G-05 Lint y formato**: el linter y el formateador MUST pasar sin errores.
- **G-06 Pruebas completas**: la suite completa MUST pasar antes de declarar una
  funcionalidad terminada. Está prohibido desactivar o eliminar una prueba para
  que la suite pase.
- **G-07 Casos límite del spec**: todo caso límite documentado en la
  especificación (fechas pasadas, día 31 en meses cortos, año bisiesto, cero
  suscripciones, almacenamiento corrupto, redondeo de porcentajes) MUST tener una
  prueba que lo cubra.

**Restricciones de comportamiento**

- Los datos del usuario MUST permanecer en el navegador. Nada de lo que se
  registre puede enviarse a la red.
- El comportamiento observable MUST ser idéntico con independencia del
  adaptador de almacenamiento en uso.
- Toda métrica MUST ser coherente con cero suscripciones: prohibido mostrar
  valores sin definir, `NaN` ni pantallas en blanco.
- El estado de la interfaz MUST recalcularse sin recarga manual del navegador
  tras cualquier alta, edición, pausa, reanudación o eliminación.

## Flujo de Desarrollo y Proceso de Revisión

1. **Especificación antes que código**: ninguna funcionalidad MUST
   implementarse sin una especificación (`spec.md`) que la describa en escenarios
   de aceptación Gherkin, ni sin un plan técnico (`plan.md`) que indique dónde
   vive cada pieza.
2. **Tareas trazables**: cada tarea MUST referenciar el requisito funcional o el
   criterio de éxito que implementa.
3. **Verificación con evidencia**: una funcionalidad se considera terminada
   cuando su comportamiento está cubierto por pruebas que pasan, no cuando el
   código "funciona a mano".
4. **Revisión obligatoria**: antes de integrar, quien revisa MUST verificar
   cumplimiento de esta constitución y MUST declarar explícitamente el
   cumplimiento o la violación de cada una de las puertas G-01 a G-07.
5. **Violaciones**: una desviación no puede integrarse sin estar registrada como
   complejidad aceptada en el plan, con su justificación y la alternativa más
   simple que se descartó.
6. **Sin atajos silenciosos**: está prohibido introducir código provisional
   (TODOs, datos falsos en producción, lógica duplicada) para que una puerta
   pase.

## Governance

**Precedencia**

- Esta constitución prevalece sobre el README, los planes, las tareas, las
  convenciones de herramientas y las preferencias de herramientas de IA
  empleadas en el proyecto. Ante un conflicto, gana la constitución.
- Una discrepancia MUST resolverse enmendando uno de los dos documentos
  explícitamente, nunca dejando el conflicto abierto.

**Enmiendas**

- Toda modificación requiere: (a) una propuesta escrita con el motivo, (b) el
  impacto sobre el código existente, (c) la actualización de la línea de versión,
  (d) la revisión de las puertas de calidad afectadas.
- Una enmienda MUST NOT rebajar un principio existente. Cambiar el status de
  "NON-NEGOTIABLE" a opcional requiere una discusión explícita y registrada.

**Versionado**

- La versión sigue SemVer respecto de la gobernanza:
  - **MAJOR**: eliminación o redefinición incompatible de un principio.
  - **MINOR**: principio o sección nueva, o ampliación material de una regla.
  - **PATCH**: aclaraciones, correcciones de redacción o typos.
- Toda casilla de verificación completada en un documento de gobernanza MUST
  quedar registrada junto a la sección que respalda, y todo incumplimiento de
  una puerta de calidad MUST registrarse en el mismo documento que la respalda.

**Cumplimiento**

- El incumplimiento de esta constitución se considera un defecto, no una
  preferencia. Un revisor MUST bloquear la integración y MUST documentar la
  violación concreta, no emitir una observación genérica.
- Las excepciones temporales MUST tener fecha de vencimiento y una persona
  responsable.
- La constitución MUST revisarse al cerrar cada funcionalidad y MUST
  enmendarse si la realidad del proyecto la contradice: una constitución que ya
  no describe el proyecto es un defecto por sí misma.

**Version**: 1.1.0 | **Ratified**: 2026-10-01 | **Last Amended**: 2026-10-01
