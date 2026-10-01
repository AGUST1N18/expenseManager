# Feature Specification: expenseManager — Gestor de Suscripciones y Gastos

**Feature Branch**: `001-expensiveManager`

**Created**: 2026-10-01

**Status**: Draft

**Input**: User description: "Gestor personal ligero para controlar gastos recurrentes y suscripciones (alta, consulta, edición, eliminación, pausa y reanudación), con un panel de métricas mensuales (gasto real mensualizado, distribución por categoría, proyección anual y activas vs. pausadas) y alertas de los cobros que se renuevan en los próximos 7 días."

## User Scenarios & Testing *(mandatory)*

<!--
  Los Escenarios de Aceptación se expresan en formato Gherkin
  (Feature / Rule / Background / Scenario / Scenario Outline) para que cada
  historia sea un contrato de comportamiento verificable.
-->

### User Story 1 - Registrar y mantener mis suscripciones (Priority: P1)

Como persona usuaria, quiero registrar cada gasto recurrente (nombre del
servicio, monto, frecuencia, categoría y fecha de próximo cobro) y poder
consultarlo, modificarlo o eliminarlo cuando cambia de precio, se renueva o ya
no lo uso. Este es el corazón del producto: sin el registro no hay visibilidad
ni métricas.

**Why this priority**: Sin un origen de datos confiable, el panel de métricas y
las alertas no tienen nada que calcular. Es el único camino que desbloquea todo
el valor del producto.

**Independent Test**: Se prueba con un usuario nuevo vacío: agregar tres
suscripciones, verlas en el listado, editar una, eliminar otra y comprobar que
la lista refleja exactamente esos cambios. No requiere panel ni alertas para
considerarse entregado.

**Acceptance Scenarios**:

```gherkin
Feature: Alta de suscripciones
  Como usuario que detectó una fuga de dinero
  Quiero registrar un gasto recurrente
  Para que deje de ser invisible y pase a ser rastreable

  Background:
    Given el usuario "Mauro" no tiene suscripciones registradas

  Scenario: Alta exitosa de una suscripción mensual
    Given el usuario "Mauro" no tiene suscripciones registradas
    When registra la suscripción "Netflix" con monto 15000, frecuencia "Mensual",
      categoría "Entretenimiento" y próximo cobro 2026-10-05
    Then la suscripción queda registrada y visible en el listado
    And su estado es "Activa"
    And su próximo cobro figura como 2026-10-05

  Scenario: Alta exitosa de una suscripción anual
    Given el usuario "Mauro" no tiene suscripciones registradas
    When registra la suscripción "Adobe CC" con monto 360000, frecuencia "Anual",
      categoría "Trabajo" y próximo cobro 2026-12-01
    Then la suscripción queda registrada y visible en el listado
    And su peso mensual equivalente figura como 30000

  Scenario: Intento de alta con nombre vacío
    Given el usuario "Mauro" no tiene suscripciones registradas
    When intenta registrar una suscripción con nombre vacío
    Then el registro es rechazado
    And se muestra un mensaje indicando que el nombre es obligatorio
    And no se crea ningún registro

  Scenario: Intento de alta con monto cero o negativo
    Given el usuario "Mauro" no tiene suscripciones registradas
    When intenta registrar "Gimnasio" con monto 0
    Then el registro es rechazado
    And se muestra un mensaje indicando que el monto debe ser mayor que cero
    And no se crea ningún registro

  Scenario: Intento de alta sin categoría ni frecuencia
    Given el usuario "Mauro" no tiene suscripciones registradas
    When intenta registrar "Spotify" sin seleccionar categoría ni frecuencia
    Then el registro es rechazado
    And el mensaje de validación enumera los campos faltantes
    And no se crea ningún registro

  Scenario: Dos servicios con el mismo nombre en categorías distintas
    Given el usuario "Mauro" ya registró "Spotify" en categoría "Entretenimiento"
    When registra otra suscripción llamada "Spotify" en categoría "Trabajo"
    Then ambos registros coexisten de forma independiente
    And cada uno conserva su propia categoría, monto y estado

  Scenario: Registro con nombre muy largo
    Given el usuario "Mauro" no tiene suscripciones registradas
    When registra una suscripción con un nombre de más de 60 caracteres
    Then la suscripción queda registrada íntegra
    And el listado la muestra acotada sin alterar el dato original
```

```gherkin
Feature: Consulta del listado de suscripciones
  Como usuario que quiere saber qué pagos tiene cargados
  Quiero ver todas mis suscripciones en un solo lugar
  Para detectar rápidamente servicios que ya no uso

  Background:
    Given el usuario "Mauro" tiene registradas:
      | nombre    | monto  | frecuencia | categoria       | estado  |
      | Netflix   | 15000  | Mensual    | Entretenimiento | Activa  |
      | Adobe CC  | 360000 | Anual      | Trabajo         | Activa  |
      | Gimnasio  | 25000  | Mensual    | Salud           | Pausada |

  Scenario: Listado completo
    Given el usuario "Mauro" tiene 3 suscripciones registradas
    When consulta su listado
    Then ve las 3 suscripciones
    And cada fila muestra nombre, monto, frecuencia, categoría, próximo cobro y estado

  Scenario: Listado con el sistema vacío
    Given el usuario "Mauro" no tiene suscripciones registradas
    When consulta su listado
    Then ve un estado vacío que explica que aún no cargó suscripciones
    And ve una acción visible para registrar la primera
    And no ve errores ni columnas con valores sin definir

  Scenario: Listado ordenado por próximo cobro
    Given el usuario "Mauro" tiene 3 suscripciones registradas
    When consulta su listado
    Then las suscripciones se muestran ordenadas por fecha de próximo cobro ascendente
    And la primera fila es la de fecha más próxima

  Scenario: Visibilidad del peso mensual de una suscripción anual
    Given el usuario "Mauro" tiene "Adobe CC" con monto 360000 y frecuencia "Anual"
    When consulta su listado
    Then la fila de "Adobe CC" indica que el monto es anual
    And muestra su equivalencia mensual de 30000 para compararla con las mensuales
```

```gherkin
Feature: Edición de suscripciones
  Como usuario cuyo servicio cambió de precio
  Quiero editar los datos de una suscripción
  Para que mis métricas reflejen la realidad sin duplicar registros

  Background:
    Given el usuario "Mauro" tiene registrada "Netflix" con monto 15000,
      frecuencia "Mensual", categoría "Entretenimiento" y próximo cobro 2026-10-05

  Scenario: Edición del monto
    Given el usuario "Mauro" tiene registrada "Netflix" con monto 15000
    When edita "Netflix" y cambia el monto a 18900
    Then la suscripción queda registrada con monto 18900
    And la fecha de próximo cobro, la frecuencia y el estado se conservan
    And no se crea una suscripción adicional

  Scenario: Cambio de frecuencia de mensual a anual
    Given el usuario "Mauro" tiene registrada "Netflix" con monto 15000 y frecuencia "Mensual"
    When edita "Netflix" y cambia la frecuencia a "Anual" con monto 180000
    Then la suscripción queda registrada con frecuencia "Anual"
    And su peso mensual equivalente pasa a ser 15000

  Scenario: Edición de categoría
    Given el usuario "Mauro" tiene registrada "Netflix" en categoría "Entretenimiento"
    When edita "Netflix" y la mueve a la categoría "Salud"
    Then la suscripción queda registrada en la categoría "Salud"
    And la distribución por categoría refleja el nuevo destino

  Scenario: Edición inválida que no debe guardarse
    Given el usuario "Mauro" tiene registrada "Netflix" con monto 15000
    When edita "Netflix" escribiendo un monto 0 y confirma
    Then la edición es rechazada
    And se muestra un mensaje de validación del monto
    And la suscripción conserva el monto anterior de 15000

  Scenario: Cancelación de la edición sin guardar cambios
    Given el usuario "Mauro" tiene registrada "Netflix" con monto 15000
    When edita "Netflix", cambia el monto a 99999 y descarta los cambios
    Then la suscripción conserva el monto 15000
```

```gherkin
Feature: Eliminación de suscripciones
  Como usuario que se dio de baja de un servicio
  Quiero eliminar la suscripción
  Para dejar de pagar un impuesto que ya no corresponde

  Background:
    Given el usuario "Mauro" tiene registradas:
      | nombre  | monto | frecuencia | categoria | estado |
      | Netflix | 15000 | Mensual    | Trabajo   | Activa |
      | Spotify | 8000  | Mensual    | Trabajo   | Activa |

  Scenario: Eliminación confirmada
    Given el usuario "Mauro" tiene registradas "Netflix" y "Spotify"
    When elimina "Netflix" y confirma la operación
    Then "Netflix" deja de estar registrada
    And el listado muestra únicamente "Spotify"
    And el gasto real mensual refleja la baja de "Netflix"

  Scenario: Eliminación cancelada
    Given el usuario "Mauro" tiene registradas "Netflix" y "Spotify"
    When elimina "Netflix" y cancela la confirmación
    Then "Netflix" sigue registrada
    And el listado y las métricas no cambian

  Scenario: Eliminación de la última suscripción
    Given el usuario "Mauro" tiene registrada una única suscripción "Netflix"
    When elimina "Netflix" y confirma
    Then el sistema queda sin suscripciones
    And el panel muestra totales en cero sin valores sin definir
    And el listado vuelve al estado vacío con acción para registrar la primera
```

---

### User Story 2 - Pausar lo que no uso sin perderlo de vista (Priority: P2)

Como persona usuaria, quiero pausar una suscripción que no estoy usando y
reanudarla cuando vuelva a necesitarla, para que deje de inflar mis métricas sin
perder el registro de lo que pago ni su fecha de renovación.

**Why this priority**: Habilita la métrica de activas vs. pausadas y evita que
el usuario tenga que elegir entre "contarlo como gasto" o "borrar el
historial". Es un ajuste sobre datos ya registrados, por lo que depende del
P1 pero no bloquea al P1.

**Independent Test**: Se prueba registrando una suscripción, pausándola y
verificando que queda en estado "Pausada", que desaparece del cálculo del gasto
mensual y de las alertas, y que al reanudarla vuelve a computar con los mismos
datos.

**Acceptance Scenarios**:

```gherkin
Feature: Pausa y reanudación de suscripciones
  Como usuario que no usa un servicio pero no lo canceló
  Quiero pausar esa suscripción
  Para que deje de computar en mis métricas sin perder el registro

  Background:
    Given el usuario "Mauro" tiene registrada "Gimnasio" con monto 25000,
      frecuencia "Mensual", categoría "Salud" y estado "Activa"

  Scenario: Pausar una suscripción activa
    Given el usuario "Mauro" tiene registrada "Gimnasio" con estado "Activa"
    When pausa "Gimnasio"
    Then su estado pasa a "Pausada"
    And deja de computar en el gasto real mensual
    And deja de generar alertas de renovación
    And su monto, frecuencia, categoría y próximo cobro se conservan

  Scenario: Reanudar una suscripción pausada
    Given el usuario "Mauro" tiene registrada "Gimnasio" con estado "Pausada"
    When reanuda "Gimnasio"
    Then su estado pasa a "Activa"
    And vuelve a computar en el gasto real mensual
    And vuelve a ser elegible para alertas de renovación

  Scenario: Estado por defecto al crear
    Given el usuario "Mauro" no tiene suscripciones registradas
    When registra una suscripción válida
    Then su estado inicial es "Activa"

  Scenario: Pausa y reanudación repetidas
    Given el usuario "Mauro" tiene registrada "Gimnasio" con estado "Activa"
    When pausa "Gimnasio" y luego la reanuda
    Then su estado final es "Activa"
    And su monto, frecuencia, categoría y próximo cobro no fueron alterados

  Scenario: Eliminar una suscripción pausada
    Given el usuario "Mauro" tiene registrada "Gimnasio" con estado "Pausada"
    When elimina "Gimnasio" y confirma
    Then "Gimnasio" deja de estar registrada
    And los conteos de activas y pausadas se actualizan
```

---

### User Story 3 - Entender cuánto gasto cada mes (Priority: P3)

Como persona usuaria, quiero ver un panel con el gasto real mensual ya
estandarizado, la distribución por categoría, la proyección anual y el conteo de
activas vs. pausadas, para responder en segundos "¿cuánto se me va en
suscripciones?" y "¿en qué categoría me estoy gastando de más?", incluyendo el
peso real de los cobros anuales.

**Why this priority**: Es la promesa de valor central del producto, pero depende
de que ya existan suscripciones cargadas. Con el P1 y el P2 implementados ya
es demostrable por sí sola.

**Independent Test**: Con un conjunto fijo de suscripciones conocidas, el panel
debe mostrar los totales, porcentajes y proyecciones esperados. No requiere
alertas ni edición para considerarse entregado.

**Acceptance Scenarios**:

```gherkin
Feature: Gasto real mensualizado
  Como usuario con cobros mensuales y anuales mezclados
  Quiero ver un único total mensual comparable
  Para planificar mi presupuesto sin distorciones por la frecuencia

  Scenario Outline: Estandarización según frecuencia
    Given el usuario "Mauro" tiene registrada la suscripción "<nombre>"
      con monto <monto> y frecuencia "<frecuencia>"
    When consulta el gasto real mensual
    Then el total de gasto real mensual es <total>

    Examples:
      | nombre   | monto  | frecuencia | total   |
      | Netflix  | 10000  | Mensual    | 10000   |
      | Adobe CC | 120000 | Anual      | 20000   |
      | Dominio  | 24000  | Anual      | 4000    |
      | Mixto    | 35000  | Anual      | 5833.33 |

  Scenario: El total mensualiza solo suscripciones activas
    Given el usuario "Mauro" tiene "Netflix" activa por 10000 y "Gimnasio" pausada por 25000
    When consulta el gasto real mensual
    Then el total de gasto real mensual es 10000
    And la suscripción pausada no aporta al total

  Scenario: Panel sin suscripciones
    Given el usuario "Mauro" no tiene suscripciones registradas
    When consulta el panel de métricas
    Then el gasto real mensual es 0
    And la proyección anual es 0
    And ninguna métrica muestra valores sin definir, infinitos ni NaN

  Scenario: Redondeo visible coherente
    Given el usuario "Mauro" tiene "Adobe CC" con monto 100000 y frecuencia "Anual"
    When consulta el gasto real mensual
    Then el valor mostrado se redondea a 2 decimales
    And el valor mostrado es 8333.33
```

```gherkin
Feature: Distribución del gasto por categoría
  Como usuario que quiere saber dónde se concentra su dinero
  Quiero ver el porcentaje por categoría
  Para detectar categorías desproporcionadas

  Scenario: Reparto porcentual entre categorías
    Given el usuario "Mauro" tiene:
      | nombre  | monto | frecuencia | categoria       | estado |
      | Netflix | 6000  | Mensual    | Entretenimiento | Activa |
      | Adobe   | 12000 | Mensual    | Trabajo         | Activa |
      | Spotify | 6000  | Mensual    | Entretenimiento | Activa |
    When consulta la distribución por categoría
    Then "Trabajo" representa el 50% del gasto mensualizado
    And "Entretenimiento" representa el 50% del gasto mensualizado
    And la suma de los porcentajes es 100%

  Scenario: Una sola categoría con gasto
    Given el usuario "Mauro" tiene "Netflix" por 15000 en "Entretenimiento"
    When consulta la distribución por categoría
    Then "Entretenimiento" representa el 100% del gasto mensualizado

  Scenario: Las categorías sin gasto no se listan
    Given el usuario "Mauro" tiene "Netflix" por 15000 en "Entretenimiento"
    And no tiene ninguna suscripción en "Trabajo"
    When consulta la distribución por categoría
    Then solo se muestra "Entretenimiento"
    And no se muestra "Trabajo" con 0%

  Scenario: Pausar una suscripción recalcula los porcentajes
    Given el usuario "Mauro" tiene "Netflix" por 15000 en "Entretenimiento" y
      "Adobe CC" por 15000 en "Trabajo"
    And pausa "Adobe CC"
    When consulta la distribución por categoría
    Then "Entretenimiento" representa el 100% del gasto mensualizado
    And "Trabajo" ya no aparece en la distribución

  Scenario: Redondeo de porcentajes que no cierra exacto
    Given el usuario "Mauro" tiene 3 suscripciones mensuales de 10000 cada una
      en 3 categorías distintas
    When consulta la distribución por categoría
    Then cada categoría representa 33.33% o 33.34% del gasto mensualizado
    And la suma de los porcentajes mostrados difiere de 100% en no más de 1 punto porcentual
```

```gherkin
Feature: Proyección anual
  Como usuario que quiere saber cuánto representarán sus suscripciones a fin de año
  Quiero ver la proyección del gasto acumulado hasta el 31 de diciembre
  Para saber cuánto reservar

  Scenario: Proyección acumulada hasta fin de año
    Given hoy es 2026-10-01
    And el usuario "Mauro" tiene "Netflix" activa por 15000 mensual con próximo cobro 2026-10-05
    When consulta la proyección anual
    Then la proyección incluye los cobros de "Netflix" de octubre, noviembre y diciembre
    And la proyección anual es 45000

  Scenario: Un cobro anual dentro del período se cuenta una sola vez
    Given hoy es 2026-10-01
    And el usuario "Mauro" tiene "Adobe CC" activa por 120000 anual con próximo cobro 2026-12-01
    When consulta la proyección anual
    Then la proyección anual es 120000
    And el monto no se divide ni se repite dentro del mismo año

  Scenario: Un cobro anual ya ocurrido en el año no se vuelve a contar
    Given hoy es 2026-10-01
    And el usuario "Mauro" tiene "Adobe CC" activa por 120000 anual con próximo cobro 2026-01-15
    When consulta la proyección anual
    Then la proyección anual no incluye cobros anteriores a hoy
    And la proyección anual es 0

  Scenario: Las suscripciones pausadas no proyectan
    Given hoy es 2026-10-01
    And el usuario "Mauro" tiene "Gimnasio" pausada por 25000 mensual con próximo cobro 2026-10-10
    When consulta la proyección anual
    Then la proyección anual es 0

  Scenario: Referencia de gasto anualizado
    Given el usuario "Mauro" tiene "Netflix" activa por 15000 mensual
    When consulta la proyección anual
    Then el panel también muestra la referencia de gasto anualizado de 180000
```

```gherkin
Feature: Conteo de suscripciones activas vs. pausadas
  Como usuario que quiere saber cuántos servicios mantiene
  Quiero ver cuántas suscripciones están activas y cuántas pausadas
  Para medir el tamaño de mi compromiso de gasto

  Scenario: Conteo mixto
    Given el usuario "Mauro" tiene 3 suscripciones activas y 2 pausadas
    When consulta el panel
    Then se muestra 3 suscripciones activas
    And se muestra 2 suscripciones pausadas
    And se muestra un total de 5 suscripciones

  Scenario: Conteo sin suscripciones
    Given el usuario "Mauro" no tiene suscripciones registradas
    When consulta el panel
    Then se muestran 0 activas y 0 pausadas
    And el total mostrado es 0

  Scenario: El conteo refleja eliminaciones
    Given el usuario "Mauro" tiene 3 suscripciones activas
    When elimina una suscripción y confirma
    Then se muestran 2 suscripciones activas
    And el total mostrado es 2
```

---

### User Story 4 - No volver a pagar un servicio olvidado (Priority: P4)

Como persona usuaria, quiero ver los cobros que se produzcan en los próximos 7
días con su monto y los días restantes, para poder cancelar o renovar a tiempo y
evitar el "impuesto del olvido".

**Why this priority**: Entrega la prevención de la fuga de dinero, que es el
motivo declarado del producto, pero su valor es complementario: opera sobre los
mismos datos que el panel y solo tiene efecto cuando existen cobros próximos.

**Independent Test**: Con una suscripción cuyo próximo cobro es dentro de 5
días, otra dentro de 20 días y una pausada dentro de 3 días, solo la primera
debe aparecer en alertas, ordenada y con los días restantes correctos.

**Acceptance Scenarios**:

```gherkin
Feature: Alertas de renovación próximas
  Como usuario que teme olvidar una renovación
  Quiero ver qué se me cobra en los próximos 7 días
  Para cancelar o confirmar el cobro a tiempo

  Background:
    Given hoy es 2026-10-01

  Scenario: Cobro dentro de la ventana de 7 días
    Given el usuario "Mauro" tiene "Netflix" activa con próximo cobro 2026-10-05
    When el usuario consulta las alertas
    Then "Netflix" aparece en la sección de alertas
    And se indica que faltan 4 días para el cobro
    And se indica el monto a cobrar

  Scenario: Cobro en el día de hoy
    Given el usuario "Mauro" tiene "Spotify" activa con próximo cobro 2026-10-01
    When el usuario consulta las alertas
    Then "Spotify" aparece en las alertas
    And se indica que el cobro es hoy

  Scenario: Límite inclusivo de 7 días
    Given el usuario "Mauro" tiene "Adobe CC" activa con próximo cobro 2026-10-08
    When el usuario consulta las alertas
    Then "Adobe CC" aparece en las alertas con 7 días restantes

  Scenario: Cobro fuera de la ventana de 7 días
    Given el usuario "Mauro" tiene "Gimnasio" activa con próximo cobro 2026-10-09
    When el usuario consulta las alertas
    Then "Gimnasio" no aparece en las alertas
    And no se muestra ninguna alerta con 8 días restantes

  Scenario: Suscripción pausada sin alerta
    Given el usuario "Mauro" tiene "Gimnasio" pausada con próximo cobro 2026-10-03
    When el usuario consulta las alertas
    Then no se muestra ninguna alerta por "Gimnasio"

  Scenario: Alertas ordenadas por fecha de cobro
    Given el usuario "Mauro" tiene activas "Netflix" con próximo cobro 2026-10-07 y
      "Spotify" con próximo cobro 2026-10-03
    When el usuario consulta las alertas
    Then "Spotify" aparece antes que "Netflix"

  Scenario: Sin cobros próximos
    Given el usuario "Mauro" tiene activas dos suscripciones con próximo cobro dentro de 30 días
    When el usuario consulta las alertas
    Then ve un mensaje indicando que no hay cobros en los próximos 7 días
    And no se muestran alertas de cobro

  Scenario: La alerta se actualiza al pasar el tiempo
    Given hoy es 2026-10-01
    And el usuario "Mauro" tiene "Netflix" activa con próximo cobro 2026-10-05
    When la fecha del sistema pasa a 2026-10-05
    Then la alerta de "Netflix" indica que el cobro es hoy

  Scenario: Alerta de un cobro anual upcoming
    Given hoy es 2026-10-01
    And el usuario "Mauro" tiene "Adobe CC" activa con frecuencia "Anual",
      monto 360000 y próximo cobro 2026-10-09
    When el usuario consulta las alertas
    Then "Adobe CC" aparece en las alertas
    And el monto indicado es 360000
```

---

### User Story 5 - Conservar mi información entre sesiones (Priority: P5)

Como persona usuaria, quiero que mis suscripciones sobrevivan al cierre de la
aplicación y que toda la información viva en un único espacio personal local.
Prefiero que mis datos de gasto no salgan de mi equipo, así que no quiero
cuentas, contraseñas ni servidores en esta versión.

**Why this priority**: Sin persistencia el producto no es utilizable en la
práctica, pero la lógica de negocio (métricas y alertas) es valuable aunque el
almacenamiento cambie a futuro.

**Independent Test**: Registrar una suscripción, cerrar y reabrir la
aplicación, y comprobar que la suscripción y todas las métricas se mantienen
sin cambios.

**Acceptance Scenarios**:

```gherkin
Feature: Persistencia de la información
  Como usuario que vuelve a la aplicación otro día
  Quiero encontrar mis datos tal como los dejé
  Para no tener que recargar todo

  Scenario: Los datos sobreviven a un cierre y reapertura
    Given el usuario "Mauro" registró "Netflix" por 15000 y "Adobe CC" por 120000 anual
    When cierra la aplicación y la vuelve a abrir
    Then ambas suscripciones siguen registradas con sus mismos datos
    And el gasto real mensual sigue siendo 25000

  Scenario: Las métricas se recalculan de forma consistente tras reabrir
    Given el usuario "Mauro" tiene 2 suscripciones activas y 1 pausada
    When cierra y reabre la aplicación
    Then el panel muestra el mismo gasto real mensual, distribución, proyección y conteos

  Scenario: Espacio de trabajo personal y único
    Given el usuario "Mauro" registra suscripciones
    When consulta sus datos
    Then solo ve sus propias suscripciones
    And no existe la posibilidad de ver ni registrar datos de otra persona

  Scenario: Almacenamiento no disponible o corrupto
    Given el almacenamiento local no está disponible o su contenido está dañado
    When el usuario abre la aplicación
    Then ve un mensaje claro indicando que no fue posible leer sus datos
    And se le ofrece la opción de reiniciar los datos
    And no ve una lista de suscripciones corrupta ni una pantalla en blanco
```

### Edge Cases

- **Sin suscripciones**: todos los totales son 0, la distribución y las alertas
  muestran estados vacíos con acción de registro; nunca aparecen valores sin
  definir, `NaN` ni divisiones por cero.
- **Monto anual no divisible por 12** (100000 → 8333.33): el cálculo agregado
  usa el valor sin redondear y solo el valor mostrado se redondea a 2 decimales.
- **Reparto porcentual que no cierra en 100%** por redondeo (3 categorías
  iguales): se tolera una diferencia de hasta 1 punto porcentual.
- **Próximo cobro en fecha pasada**: la suscripción se marca como "cobro
  atrasado" y su próxima ocurrencia se calcula por periodicidad, sin duplicar
  cobros ni alterar el monto.
- **Próximo cobro el día 31 en meses de 30 días**: la ocurrencia se ajusta al
  último día del mes correspondiente.
- **Próximo cobro a más de 12 meses**: no genera alertas ni se cuenta en la
  proyección del año en curso.
- **Pausar dentro de la ventana de alerta**: la alerta desaparece en la misma
  interacción, sin requerir recarga.
- **Eliminar o pausar con el panel visible**: todas las métricas se recalculan
  de inmediato, sin recarga manual.
- **Nombres duplicados**: permitidos; cada suscripción es independiente y la
  edición o eliminación afecta solo a la elegida.
- **Categoría con suscripciones activas y pausadas**: solo las activas aportan a
  los porcentajes; si todas están pausadas, la categoría no se lista.
- **Almacenamiento no disponible o corrupto**: mensaje claro, opción de
  reiniciar los datos y ninguna pantalla en blanco ni lista corrupta.

## Requirements *(mandatory)*

### Functional Requirements

<!--
  Cada requerimiento funcional se especifica como una regla Gherkin con sus
  escenarios verificables.
-->

#### Modelo de datos y validaciones

```gherkin
Rule: FR-001 La suscripción MUST almacenar nombre, monto, frecuencia, categoría y próximo cobro
  Scenario: Registro completo
    Given un conjunto válido de datos de suscripción
    When se registra la suscripción
    Then los cinco datos quedan almacenados y consultables
    And la suscripción tiene un identificador propio y único

  Scenario Outline: Validación de campos obligatorios
    Given un conjunto de datos con "<campo>" inválido
    When se intenta registrar la suscripción
    Then el registro es rechazado con un mensaje asociado a "<campo>"
    And no se crea ningún registro

    Examples:
      | campo        | valor inválido |
      | nombre       | (vacío)        |
      | monto        | 0              |
      | monto        | -500           |
      | monto        | (no numérico)  |
      | frecuencia   | (no definida)  |
      | categoría    | (no definida)  |
      | próximoCobro | (fecha inválida) |
```

```gherkin
Rule: FR-002 La frecuencia MUST pertenecer a un conjunto cerrado de dos valores
  Scenario Outline: Frecuencias admitidas
    Given el usuario registra una suscripción con frecuencia "<frecuencia>"
    When confirma el registro
    Then la suscripción queda registrada con esa frecuencia

    Examples:
      | frecuencia |
      | Mensual    |
      | Anual      |

  Scenario: Frecuencia fuera del conjunto
    Given el usuario intenta registrar una suscripción con frecuencia "Semanal"
    Then la frecuencia no está disponible para seleccionar
    And el registro es rechazado
```

```gherkin
Rule: FR-003 La categoría MUST pertenecer a un catálogo predeterminado extensible
  Scenario: Catálogo predeterminado disponible
    Given el usuario abre el formulario de alta
    Then puede seleccionar Entretenimiento, Trabajo, Salud, Educación,
      Hogar, Utilidades, Finanzas y Otros

  Scenario: Selección de "Otros"
    Given el usuario selecciona la categoría "Otros"
    When registra la suscripción
    Then la suscripción queda registrada con la categoría "Otros"

  Scenario: Categoría única por suscripción
    Given el usuario registra una suscripción eligiendo "Trabajo"
    When confirma el registro
    Then la suscripción tiene una sola categoría
    And esa misma suscripción no puede contarse en otra categoría
```

```gherkin
Rule: FR-004 El monto MUST almacenarse con precisión decimal y mostrarse en la moneda configurada
  Scenario: Montos con centavos
    Given el usuario registra una suscripción con monto 1599.99
    When confirma el registro
    Then el monto almacenado es 1599.99
    And se muestra con el símbolo de moneda configurado

  Scenario: Símbolo de moneda
    Given la moneda configurada es "$"
    When el usuario registra una suscripción por 15000
    Then el monto se muestra como "$ 15000"
```

```gherkin
Rule: FR-005 La fecha de próximo cobro MUST persistir como fecha y MUST admitir años bisiestos
  Scenario: 29 de febrero
    Given el usuario registra una suscripción mensual con próximo cobro 2028-02-29
    When confirma el registro
    Then la fecha se almacena correctamente
    And la ocurrencia siguiente se calcula sobre un 29 de febrero válido

  Scenario: Día 31 en un mes corto
    Given el usuario registra una suscripción mensual con próximo cobro 2026-04-30
    When la fecha de sistema avanza al mes siguiente
    Then la ocurrencia siguiente se ajusta al último día del mes destino
```

```gherkin
Rule: FR-006 El estado de la suscripción MUST ser "Activa" o "Pausada"
  Scenario: Estado inicial
    Given el usuario registra una suscripción
    Then su estado es "Activa"

  Scenario: Estados válidos para pausar y reanudar
    Given el usuario tiene una suscripción en cualquiera de los dos estados
    When ejecuta la acción de alternar estado
    Then su estado pasa al estado contrario
    And solo esos dos estados son válidos
```

#### Alta y edición

```gherkin
Rule: FR-007 El usuario MUST poder registrar una suscripción
  Scenario: Alta válida
    Given el usuario no tiene la suscripción "Netflix"
    When la registra con datos válidos
    Then queda disponible en el listado sin pasos adicionales

  Scenario: Confirmación del alta
    Given el usuario registra una suscripción válida
    When confirma el registro
    Then ve una confirmación de que la suscripción fue registrada
    And el formulario se limpia para permitir un nuevo alta
```

```gherkin
Rule: FR-008 El usuario MUST poder editar una suscripción conservando su identidad
  Scenario Outline: Edición de campos editables
    Given el usuario tiene registrada la suscripción "Netflix"
    When edita el "<campo>" a "<valor>"
    Then la suscripción queda con "<campo>" = "<valor>"
    And no se crea una suscripción adicional

    Examples:
      | campo        | valor    |
      | nombre       | Netflix  |
      | monto        | 18900    |
      | frecuencia   | Anual    |
      | categoría    | Trabajo  |
      | próximoCobro | 2026-11-05 |

  Scenario: La edición no reinicia el estado
    Given el usuario tiene "Netflix" con estado "Pausada"
    When edita su monto
    Then sigue con estado "Pausada"
```

```gherkin
Rule: FR-009 El usuario MUST poder descartar una edición sin aplicarla
  Scenario: Descartar cambios
    Given el usuario tiene "Netflix" con monto 15000
    When edita el monto a 99999 y descarta los cambios
    Then la suscripción conserva el monto 15000
```

```gherkin
Rule: FR-010 El sistema MUST validar toda edición con las mismas reglas del alta
  Scenario Outline: Edición inválida
    Given el usuario tiene registrada la suscripción "Netflix"
    When edita "<campo>" a "<valor inválido>" y confirma
    Then la edición es rechazada con un mensaje asociado a "<campo>"
    And la suscripción conserva su valor anterior

    Examples:
      | campo  | valor inválido |
      | nombre | (vacío)        |
      | monto  | 0              |
      | monto  | -1             |
      | categoría | (no definida) |
```

```gherkin
Rule: FR-011 El sistema MUST exigir confirmación antes de eliminar una suscripción
  Scenario: Confirmación aceptada
    Given el usuario tiene registradas "Netflix" y "Spotify"
    When solicita eliminar "Netflix" y confirma
    Then ve una confirmación indicando qué suscripción va a eliminarse
    When confirma la eliminación
    Then "Netflix" deja de estar registrada

  Scenario: Confirmación cancelada
    Given el usuario tiene registradas "Netflix" y "Spotify"
    When solicita eliminar "Netflix" y cancela
    Then "Netflix" sigue registrada
```

#### Listado

```gherkin
Rule: FR-012 El listado MUST mostrar todos los datos relevantes de cada suscripción
  Scenario: Columnas del listado
    Given el usuario tiene 3 suscripciones registradas
    When consulta su listado
    Then cada fila muestra nombre, monto, frecuencia, categoría, próximo cobro y estado
    And se muestra el peso mensual equivalente cuando la frecuencia es "Anual"
```

```gherkin
Rule: FR-013 El listado MUST estar ordenado por fecha de próximo cobro ascendente
  Scenario: Orden por fecha
    Given el usuario tiene suscripciones con próximos cobros 2026-12-01, 2026-10-03 y 2026-10-20
    When consulta su listado
    Then el orden de las filas es 2026-10-03, 2026-10-20, 2026-12-01
```

```gherkin
Rule: FR-014 El listado MUST mostrar un estado vacío accionable cuando no hay suscripciones
  Scenario: Estado vacío
    Given el usuario no tiene suscripciones registradas
    When consulta su listado
    Then ve un mensaje indicando que no hay suscripciones cargadas
    And ve una acción para registrar la primera
```

```gherkin
Rule: FR-015 El listado MUST permitir identificar visualmente los cobros atrasados
  Scenario: Marca de atraso
    Given hoy es 2026-10-10
    And el usuario tiene "Netflix" con próximo cobro 2026-09-05
    When consulta su listado
    Then "Netflix" se identifica como cobro atrasado
    And se muestra la fecha de la próxima ocurrencia calculada
```

#### Pausa y reanudación

```gherkin
Rule: FR-016 El usuario MUST poder pausar una suscripción activa
  Scenario: Pausa
    Given el usuario tiene "Gimnasio" activa por 25000
    When la pausa
    Then su estado pasa a "Pausada"
    And deja de computar en el gasto real mensual, la distribución por categoría,
      la proyección anual y el conteo de activas
    And sus datos de monto, frecuencia, categoría y próximo cobro se conservan
```

```gherkin
Rule: FR-017 El usuario MUST poder reanudar una suscripción pausada
  Scenario: Reanudación
    Given el usuario tiene "Gimnasio" pausada por 25000
    When la reanuda
    Then su estado pasa a "Activa"
    And vuelve a computar en todas las métricas
    And vuelve a ser elegible para alertas de renovación
```

```gherkin
Rule: FR-018 La pausa y la reanudación MUST ser reversibles sin pérdida de datos
  Scenario: Ciclar el estado dos veces
    Given el usuario tiene "Gimnasio" activa con próximo cobro 2026-10-15
    When pausa y luego reanuda "Gimnasio"
    Then su estado final es "Activa"
    And su monto, frecuencia, categoría y próximo cobro son los originales
```

```gherkin
Rule: FR-019 La pausa MUST reflejarse de inmediato en todas las vistas
  Scenario: Panel visible durante la pausa
    Given el usuario tiene el panel visible con 2 activas y 1 pausada
    When pausa una de las activas
    Then el panel muestra 1 activa y 2 pausadas
    And el gasto real mensual se recalcula sin requerir recarga
```

#### Panel de métricas

```gherkin
Rule: FR-020 El panel MUST mostrar el gasto real mensual estandarizado
  Scenario Outline: Estandarización
    Given el usuario tiene suscripciones activas:
      | nombre   | monto  | frecuencia |
      | <n1>     | <m1>   | <f1>       |
      | <n2>     | <m2>   | <f2>       |
    When consulta el gasto real mensual
    Then el total es <total>

    Examples:
      | n1       | m1    | f1     | n2      | m2    | f2     | total   |
      | Netflix  | 10000 | Mensual | Adobe   | 120000| Anual  | 20000   |
      | Netflix  | 10000 | Mensual | Dominio | 24000 | Anual  | 12000   |
      | Adobe    | 35000 | Anual   | Dominio | 12000 | Anual  | 4583.33 |

  Scenario: Exclusión de pausadas
    Given el usuario tiene "Netflix" activa por 10000 y "Gimnasio" pausada por 25000
    When consulta el gasto real mensual
    Then el total es 10000
```

```gherkin
Rule: FR-021 El panel MUST mostrar la distribución porcentual por categoría
  Scenario Outline: Porcentajes
    Given el usuario tiene suscripciones activas:
      | nombre   | monto | frecuencia | categoria |
      | <n1>     | <m1>  | <f1>       | <c1>      |
      | <n2>     | <m2>  | <f2>       | <c2>      |
    When consulta la distribución por categoría
    Then "<c1>" representa el <p1>% del gasto mensualizado
    And "<c2>" representa el <p2>% del gasto mensualizado

    Examples:
      | n1      | m1    | f1     | c1             | n2    | m2    | f2     | c2     | p1  | p2  |
      | Netflix | 6000  | Mensual | Entretenimiento| Adobe | 12000| Mensual| Trabajo| 50   | 50  |
      | Netflix | 15000 | Mensual | Entretenimiento| Adobe | 15000| Mensual| Trabajo| 100  | 0   |

  Scenario: Suma de porcentajes
    Given el usuario tiene suscripciones en varias categorías
    When consulta la distribución por categoría
    Then la suma de los porcentajes mostrados es 100% con una tolerancia máxima de 1 punto porcentual

  Scenario: Omisión de categorías sin gasto
    Given el usuario solo tiene suscripciones activas en "Entretenimiento"
    When consulta la distribución por categoría
    Then solo se listan las categorías con gasto
    And no se listan categorías con 0%
```

```gherkin
Rule: FR-022 El panel MUST mostrar la proyección del gasto hasta el 31 de diciembre del año en curso
  Scenario Outline: Proyección acumulada
    Given hoy es 2026-10-01
    And el usuario tiene la suscripción activa:
      | nombre   | monto | frecuencia | próximoCobro | estado |
      | <n1>     | <m1>  | <f1>       | <c1>         | Activa |
    When consulta la proyección anual
    Then la proyección anual es <total>

    Examples:
      | nombre   | monto  | frecuencia | próximoCobro | total  |
      | Netflix  | 15000  | Mensual    | 2026-10-05   | 45000  |
      | Adobe    | 120000 | Anual      | 2026-12-01   | 120000 |
      | Adobe    | 120000 | Anual      | 2026-01-15   | 0      |

  Scenario: Proyección acumulada de varias suscripciones
    Given hoy es 2026-10-01
    And el usuario tiene "Netflix" activa por 15000 mensual con próximo cobro 2026-10-05
    And el usuario tiene "Spotify" activa por 8000 mensual con próximo cobro 2026-10-20
    When consulta la proyección anual
    Then la proyección anual es 69000

  Scenario: Exclusión de pausadas y de cobros pasados
    Given hoy es 2026-10-01
    And el usuario tiene "Gimnasio" pausada por 25000 mensual con próximo cobro 2026-10-10
    When consulta la proyección anual
    Then la proyección anual es 0
```

```gherkin
Rule: FR-023 El panel MUST mostrar la referencia de gasto anualizado
  Scenario: Anualizado a partir del gasto mensual
    Given el usuario tiene "Netflix" activa por 15000 mensual y "Adobe" activa por 120000 anual
    When consulta la referencia de gasto anualizado
    Then el valor mostrado es 180000
```

```gherkin
Rule: FR-024 El panel MUST mostrar el conteo de suscripciones activas, pausadas y totales
  Scenario: Conteos
    Given el usuario tiene 3 activas y 2 pausadas
    When consulta el panel
    Then se muestran 3 activas, 2 pausadas y 5 en total

  Scenario: Conteos en cero
    Given el usuario no tiene suscripciones
    When consulta el panel
    Then se muestran 0 activas, 0 pausadas y 0 en total
```

```gherkin
Rule: FR-025 El panel MUST recalcularse ante cualquier cambio en las suscripciones
  Scenario Outline: Recálculo por operación
    Given el usuario tiene 2 activas y 1 pausada con un gasto real mensual de 25000
    When el usuario <operación>
    Then todas las métricas del panel reflejan el estado resultante
    And el recálculo ocurre sin que el usuario recargue la vista

    Examples:
      | operación                       |
      | registra una nueva suscripción |
      | edita el monto de una existente |
      | elimina una suscripción        |
      | pausa una suscripción          |
      | reanuda una suscripción        |
```

```gherkin
Rule: FR-026 El panel MUST ser coherente con cero suscripciones
  Scenario: Panel vacío
    Given el usuario no tiene suscripciones
    When consulta el panel
    Then todas las métricas muestran 0
    And ninguna métrica muestra valores sin definir, infinitos o NaN
    And se indica que no hay datos para calcular métricas
```

#### Alertas

```gherkin
Rule: FR-027 El sistema MUST alertar los cobros de suscripciones activas dentro de los próximos 7 días
  Scenario Outline: Inclusión en la ventana de alerta
    Given hoy es 2026-10-01
    And el usuario tiene "Netflix" activa con próximo cobro <fecha>
    When el usuario consulta las alertas
    Then <resultado>

    Examples:
      | fecha       | resultado                                     |
      | 2026-10-01  | "Netflix" aparece con cobro hoy                |
      | 2026-10-05  | "Netflix" aparece con 4 días restantes         |
      | 2026-10-08  | "Netflix" aparece con 7 días restantes         |
      | 2026-10-09  | no aparece ninguna alerta para "Netflix"       |
      | 2027-03-01  | no aparece ninguna alerta para "Netflix"       |
```

```gherkin
Rule: FR-028 Las alertas MUST indicar el monto a cobrar y los días restantes
  Scenario: Contenido de la alerta
    Given hoy es 2026-10-01
    And el usuario tiene "Adobe CC" activa con monto 360000, frecuencia "Anual"
      y próximo cobro 2026-10-05
    When el usuario consulta las alertas
    Then la alerta muestra el nombre "Adobe CC"
    And la alerta muestra el monto a cobrar de 360000
    And la alerta muestra los días restantes y la fecha de cobro
```

```gherkin
Rule: FR-029 Las alertas MUST excluir suscripciones pausadas
  Scenario: Pausada dentro de la ventana
    Given hoy es 2026-10-01
    And el usuario tiene "Gimnasio" pausada con próximo cobro 2026-10-03
    When el usuario consulta las alertas
    Then no se muestra ninguna alerta por "Gimnasio"
```

```gherkin
Rule: FR-030 Las alertas MUST estar ordenadas por fecha de cobro ascendente
  Scenario: Orden de las alertas
    Given hoy es 2026-10-01
    And el usuario tiene "Netflix" activa con próximo cobro 2026-10-07
    And el usuario tiene "Spotify" activa con próximo cobro 2026-10-03
    When el usuario consulta las alertas
    Then "Spotify" se muestra antes que "Netflix"
```

```gherkin
Rule: FR-031 El sistema MUST informar cuando no hay cobros próximos
  Scenario: Sin alertas
    Given hoy es 2026-10-01
    And el usuario tiene 2 activas con próximo cobro dentro de 30 días
    When el usuario consulta las alertas
    Then ve un mensaje indicando que no hay cobros en los próximos 7 días
    And no se muestran tarjetas de alerta
```

```gherkin
Rule: FR-032 Las alertas MUST recalcularse al cambiar la fecha del sistema
  Scenario: El día del cobro
    Given hoy es 2026-10-01
    And el usuario tiene "Netflix" activa con próximo cobro 2026-10-05
    When la fecha del sistema pasa a 2026-10-05
    Then la alerta indica que el cobro es hoy
```

#### Persistencia e integridad de datos

```gherkin
Rule: FR-033 La información MUST persistir entre sesiones
  Scenario: Reapertura de la aplicación
    Given el usuario registró 2 suscripciones y pausó una de ellas
    When cierra la aplicación y la vuelve a abrir
    Then las 2 suscripciones siguen registradas con sus mismos datos y estados
    And todas las métricas muestran los mismos valores

  Scenario: Las operaciones sobreviven a la reapertura
    Given el usuario registró "Netflix" y "Adobe CC"
    When cierra y reabre la aplicación
    Then las operaciones de alta, edición, pausa y eliminación previas siguen reflejadas
```

```gherkin
Rule: FR-034 Los datos MUST pertenecer a un único espacio de trabajo personal sin cuentas
  Scenario: Un solo conjunto de datos
    Given el usuario tiene 3 suscripciones registradas
    When consulta sus datos
    Then ve exactamente esas 3 suscripciones
    And la aplicación no solicita registro, contraseña ni conexión a un servicio externo
```

```gherkin
Rule: FR-035 El sistema MUST informar de forma clara cuando la información no puede leerse
  Scenario: Almacenamiento corrupto
    Given la información persistida está dañada o no se puede leer
    When el usuario abre la aplicación
    Then ve un mensaje explicando que no fue posible leer su información
    And se le ofrece reiniciar los datos
    And no ve una pantalla en blanco ni una lista corrupta

  Scenario: Recuperación tras reiniciar
    Given el usuario reinicia sus datos desde el mensaje de error
    When la aplicación se recarga
    Then ve el estado vacío de suscripciones
    And puede registrar una nueva suscripción con normalidad
```

```gherkin
Rule: FR-036 La información persistida MUST ser independiente del origen de datos
  Scenario: Mismo comportamiento con cualquier almacenamiento
    Given el usuario registra "Netflix" por 15000 mensual
    When consulta el listado, el panel y las alertas
    Then los resultados son los mismos con independencia del almacenamiento utilizado
    And el usuario no percibe diferencias de comportamiento
```

### Key Entities

- **Suscripción**: gasto recurrente registrado por el usuario. Atributos:
  identificador, nombre del servicio, monto, frecuencia (Mensual o Anual),
  categoría, fecha de próximo cobro, estado (Activa o Pausada) y fecha de
  registro. Es la entidad central; todas las métricas y alertas se derivan de
  ella.
- **Categoría**: agrupación a la que pertenece cada suscripción, usada para el
  análisis de distribución. Catálogo predeterminado de ocho valores
  (Entretenimiento, Trabajo, Salud, Educación, Hogar, Utilidades, Finanzas,
  Otros). Se relaciona uno-a-uno con la suscripción que la referencia.
- **Ocurrencia de cobro**: instancia derivada que representa un cobro concreto
  de una suscripción (fecha y monto). No se almacena de forma independiente: se
  calcula a partir de la suscripción, su frecuencia y su próximo cobro.
- **Métrica**: valor agregado derivado del conjunto de suscripciones activas:
  gasto real mensual, gasto anualizado, distribución porcentual por categoría,
  proyección anual y conteos de activas, pausadas y totales. Es de solo lectura.
- **Alerta de renovación**: señal derivada que representa una suscripción activa
  cuyo próximo cobro cae dentro de los próximos 7 días, con su monto y días
  restantes.
- **Preferencias**: símbolo de moneda y demás ajustes de presentación del
  usuario, aplicados a montos y métricas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario sin datos previos puede registrar su primera
  suscripción válida y verla en el listado en menos de 60 segundos.
- **SC-002**: El 100% de las suscripciones registradas se reflejan correctamente
  en el listado, el panel y las alertas inmediatamente después de cualquier
  alta, edición, pausa, reanudación o eliminación, sin recarga manual.
- **SC-003**: El gasto real mensual mostrado coincide con el valor
  independently calculado por el usuario (suma de mensuales más anuales
  divididos por 12) en el 100% de los casos de prueba, con redondeo máximo de
  0.01.
- **SC-004**: Los porcentajes de la distribución por categoría suman 100% con
  una desviación máxima de 1 punto porcentual en el 100% de los casos de
  prueba.
- **SC-005**: La proyección anual coincide con la suma de los cobros previstos
  entre hoy y el 31 de diciembre en el 100% de los casos de prueba, contando
  cada suscripción anual una sola vez.
- **SC-006**: Toda suscripción activa cuyo próximo cobro cae dentro de los
  próximos 7 días aparece en las alertas, y ninguna que caiga fuera de esa
  ventana aparece, en el 100% de los casos de prueba.
- **SC-007**: Tras cerrar y reabrir la aplicación, el 100% de las suscripciones
  y sus métricas se recuperan sin pérdida ni alteración.
- **SC-008**: El 90% de los usuarios de prueba logra identificar su gasto
  mensual total y sus cobros de los próximos 7 días en la primera visita, sin
  ayuda externa.
- **SC-009**: Un intento de registro o edición con datos inválidos es rechazado
  en el 100% de los casos, con un mensaje que indica el campo a corregir.
- **SC-010**: Ninguna métrica muestra valores sin definir, `NaN` ni pantalla en
  blanco con cero suscripciones o con almacenamiento no disponible.

## Assumptions

- El producto es de uso personal y local: un único espacio de trabajo, sin
  cuentas, contraseñas, roles ni servidores en esta versión.
- La moneda es configurable y su símbolo por defecto es "$"; los montos se
  manejan como decimales y no se conversión entre monedas.
- Las frecuencias soportadas son únicamente Mensual y Anual; el resto queda
  fuera de alcance.
- El catálogo de categorías por defecto es extensible: los ocho valores
  iniciales pueden crecer en el futuro sin romper la información existente.
- Las métricas se calculan siempre sobre las suscripciones en estado "Activa";
  las pausadas se conservan pero no computan.
- "Gasto real mensual" es la suma de los montos mensuales activos más los
  anuales divididos por 12; la proyección anual suma los cobros previstos desde
  hoy hasta el 31 de diciembre del año en curso, contando una sola vez cada
  suscripción cuyo cobro anual cae dentro de ese período.
- La ventana de alerta es de 7 días corridos contados desde hoy, e incluye
  tanto el día de hoy como el séptimo día.
- Las fechas se interpretan en la zona horaria local del usuario y en formato
  año-mes-día.
- Los nombres de suscripción no son únicos: se permiten duplicados y cada
  registro se gestiona de forma independiente.
- La aplicación es una herramienta de registro y análisis, no ejecuta pagos ni
  se integra con servicios de facturación: la eliminación de una suscripción
  es una baja en el registro del usuario, no una cancelación real del servicio.
- Fuera de alcance para el MVP: cuentas de usuario, sincronización en la nube,
  exportación o importación de datos, reportes imprimibles, avisos por correo
  o notificaciones push, y aplicación móvil nativa.
- La organización interna separa la interfaz de usuario, la lógica de negocio y
  el acceso a los datos, de modo que la lógica no dependa del mecanismo de
  almacenamiento y pueda migrar a un servicio real sin reescribir las reglas de
  negocio.
