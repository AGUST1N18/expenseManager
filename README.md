# expenseManager - Gestor de Suscripciones y Gastos

Un gestor personal ligero para tener bajo control los gastos recurrentes y suscripciones, con análisis de métricas mensuales y proyección de gastos, diseñado para evitar "fugas de dinero" invisibles.

## 🧠 Análisis del Producto

### El Motivo (¿Por qué construir esto?)
Hoy en día, consumimos casi todo bajo modelos de suscripción (Netflix, gimnasio, herramientas de trabajo, nube, etc.). El problema es que estos gastos son "invisibles" y automáticos. Es muy fácil suscribirse a algo, olvidar cancelarlo y terminar pagando meses por un servicio que no se utiliza.

### Necesidades que resuelve
1. **Falta de visibilidad:** Las personas no saben cuánto pagan en total cada mes por sus servicios digitales.
2. **Confusión de frecuencias:** Algunos cobros son mensuales y otros anuales, lo que rompe la planificación presupuestaria.
3. **El "Impuesto del olvido":** Pagar por servicios inactivos por olvidar la fecha de renovación.
4. **Falta de Análisis:** Ausencia de métricas que indiquen en qué categorías se gasta más o cómo evoluciona el gasto en el tiempo.

## 🎯 Funcionalidades Principales (MVP)

### 1. Gestión de Suscripciones (CRUD)
* Agregar, ver, editar y eliminar gastos recurrentes.
* **Datos:** Nombre del servicio, Monto, Frecuencia (Mensual/Anual), Categoría (Entretenimiento, Trabajo, Salud, etc.), y Fecha de próximo cobro.

### 2. Panel de Estadísticas y Métricas Mensuales (Dashboard)
* **Gasto Real Mensualizado:** Estandarización de gastos (los gastos anuales se dividen por 12 para mostrar el peso mensual real).
* **Distribución por Categoría:** Gráfico o listado porcentual mostrando dónde se concentra el gasto (ej. 40% Trabajo, 60% Entretenimiento).
* **Proyección Anual:** Cálculo de cuánto dinero representarán estas suscripciones a fin de año.
* **Suscripciones Activas vs. Pausadas:** Métrica simple de servicios en uso.

### 3. Alertas
* Indicadores visuales para suscripciones que se renovarán/cobrarán en los próximos 7 días.

---

## 🛠️ Stack Tecnológico y Arquitectura

Para este MVP, se utilizará una arquitectura web orientada a componentes, utilizando almacenamiento local, pero **diseñada con el Patrón Repositorio**. Esto significa que la lógica de la aplicación interactuará con una "interfaz de base de datos" simulada, permitiendo migrar a una base de datos real (PostgreSQL/MongoDB) en el futuro sin reescribir la lógica de negocio.

* **Frontend / UI:** React + Vite + HTML/CSS (Tailwind CSS para estilización rápida).
* **Almacenamiento Temporal:** `LocalStorage` del navegador.
* **Arquitectura de Datos:** Patrón Servicio/Repositorio (Simulando llamadas asíncronas tipo API que hoy escriben en LocalStorage, pero mañana escribirán en un backend real).
* **Metodología:** Desarrollo Guiado por Especificaciones (SDD - Spec-Kit) utilizando asistencia de IA.
