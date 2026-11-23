# FinTrack — Plataforma de gestión financiera personal y SaaS

![FinTrack Banner](https://fintrack-finanzas.web.app/fintrack-icon.svg)

> **FinTrack** es una Progressive Web App (PWA) de nivel empresarial diseñada para el control patrimonial, proyección de ahorros, seguimiento de vencimientos y analítica financiera personal en tiempo real. Construida con arquitectura moderna sobre **React 19**, **Vite**, **Bootstrap 5**, **Chart.js**, **Firebase** (Firestore, Authentication & Cloud Functions) e integración de pagos recurrentes con **Mercado Pago Checkout Pro**.

**Aplicación en producción:** [https://fintrack-finanzas.web.app](https://fintrack-finanzas.web.app)

---

## Tecnologías principales

- **Frontend core:** React 19 (SPA con `React.lazy` y `Suspense` para carga optimizada)
- **Bundler y build tool:** Vite 8 (segmentación de chunks con `vendor-react`, `firebase` y `charts`)
- **Estilos y diseño:** Bootstrap 5.3 + Bootstrap Icons + Sistema de variables CSS personalizadas
- **Visualización de datos:** Chart.js 4 (Gráficos interactivos de donas de gastos y barras comparativas anuales)
- **Backend y base de datos:** Firebase 10 (Firestore en tiempo real con `onSnapshot`, Authentication con Google OAuth y Email)
- **Serverless backend:** Firebase Cloud Functions (Node.js runtime con SDK oficial de Mercado Pago)
- **Pasarela de pagos SaaS:** Mercado Pago Checkout Pro (Suscripciones mensuales, anuales y Webhooks IPN)
- **PWA y Offline first:** Web App Manifest instalable en Android, iOS, Windows y macOS

---

## Módulos y funcionalidades

### 1. Sistema SaaS y monetización con Mercado Pago
- **Prueba gratuita de 60 Días:** Todo nuevo usuario accede automáticamente a 60 días completos de FinTrack Pro sin ingresar tarjeta de crédito.
- **Paywall inteligente (Modo solo lectura):** Al expirar el periodo de prueba, los datos históricos y exportaciones se preservan intactos, bloqueando únicamente nuevas cargas o ediciones hasta activar un plan.
- **Planes Pro flexibles:** Integración con Mercado Pago Checkout Pro para **Plan mensual** ($3.900 ARS) y **Plan anual** ($32.000 ARS con 32% OFF y 2 meses gratis).
- **Portal de facturación del cliente:** Modal interactivo para consultar estado de cuenta, días restantes de prueba, próxima renovación y cancelación de auto-renovación en 1 clic.
- **Webhooks seguros en cloud functions:** Endpoint HTTPS para recepción de notificaciones de pago (`mercadopagoWebhook`) que actualiza instantáneamente Firestore.
- **Lista blanca de administradores:** Acceso Pro vitalicio e ilimitado para cuentas fundadoras y administradoras (`daniela.cabrera5071@gmail.com`).

### 2. Dashboard financiero y KPIs en tiempo real
- **Balance neto:** Cálculo reactivo instantáneo de saldo disponible en efectivo (`Ingresos - Gastos + Resto acumulado`).
- **Ahorros multidivisa:** Seguimiento independiente de reservas en Pesos (**ARS**), Dólares (**USD**), Euros (**EUR**) y Cripto/Tether (**USDT**).
- **Dólar en vivo:** Cotizaciones actualizadas en tiempo real en la barra de navegación para **Dólar Blue**, **Oficial** y **MEP**.

### 3. Calendario financiero y control de vencimientos
- **Calendario mensual interactivo:** Vista matricial de ingresos, gastos y vencimientos distribuidos por día.
- **Sistema de alertas y semáforo:** Insignia interactiva con contador dinámico en la barra de navegación:
  - 🔴 **Vencido:** Facturas o impuestos con fecha límite superada.
  - 🟡 **Por vencer:** Compromisos financieros dentro de los próximos 7 días.
  - 🟢 **Al día:** Confirmación de pagos saldados.
- **Modal de vencimientos:** Gestión rápida con marcado de "Pagado" en un solo clic, impactando automáticamente el balance de efectivo.

### 4. Power BI y Excel Hub
- **Exportación estructurada de datos:** Generación de archivos CSV con codificación UTF-8 con BOM para apertura nativa y sin errores de caracteres en Microsoft Excel.
- **Kit DAX Pre-construido:** Generación de medidas analíticas en formato DAX listas para copiar y pegar en tableros de Power BI Desktop (`[Total Gastos]`, `[Total Ingresos]`, `[Tasa de Ahorro %]`, `[Burn Rate]`).

### 5. Seguridad y privacidad bancaria
- **Modo privacidad (Alt + P):** Alterna el desenfoque instantáneo de todos los importes y números de la pantalla para operar de forma segura en oficinas o lugares públicos.
- **Bloqueo de pantalla:** Modal de bloqueo protegido por contraseña/PIN de sesión.
- **Bitácora de auditoría y respaldos:** Registro de eventos de seguridad (inicios de sesión, exportaciones, cambios de configuración) y copias de seguridad descargables.
- **Diálogos de confirmación de alto impacto:** Ventanas de confirmación previa antes de registrar pagos importantes o eliminar registros.

### 6. Personalización y temas visuales
- **4 Paletas armónicas:** Clásica Pastel, Mint, Ocean y Lavender.
- **Modo oscuro nativo:** Tema oscuro (`[data-theme="dark"]`) con grises azulados (`#131b2e` y `#0f172a`) diseñados para reducir la fatiga visual.
- **Fondos personalizables:** Selección de degradados Mesh o carga de imagen propia con compresión en tiempo real vía HTML5 Canvas.

### 7. Accesibilidad universal e inclusión (WCAG 2.1 AA & Navegación 100% sin mouse)
- **Navegación 100% por Teclado:**
  - Enlace de salto al contenido principal (*Skip Navigation Link*) para acceder directamente a `#main-content`.
  - Anillo de foco de alto contraste (`:focus-visible` de 3px) reactivo al color del tema seleccionado.
  - Suite de atajos de teclado globales:
    - `Alt + N`: Apertura instantánea de Nuevo Movimiento.
    - `Alt + V`: Monitor de Vencimientos y compromisos pendientes.
    - `Alt + C`: Calendario financiero.
    - `Alt + R`: Resumen anual y métricas comparativas.
    - `Alt + H`: Retorno al Dashboard / Inicio.
    - `Alt + G` / `Alt + I` / `Alt + A`: Vistas de Gastos, Ingresos y Ahorros.
    - `Alt + P`: Alternancia de Modo Privacidad.
    - `Escape`: Cierre unificado de cualquier modal o menú desplegable.
- **Navegación direccional con flechas (`↑`, `↓`, `←`, `→`):**
  - **Barra de navegación (*Navbar*):** Desplazamiento fluido horizontal entre el logo, la píldora de cotización en tiempo real del dólar y los accesos directos; salto directo de la píldora de dólar a **Gastos** con `→` y regreso con `←`, y descenso directo al contenido principal con `↓`.
  - **Modales:** Alternancia y activación inmediata de pestañas (*Tabs*) con `←` y `→`; avance y retroceso entre campos con `↓` y `↑`.
  - **Tablas de gastos e ingresos:** Desplazamiento entre filas con `↓`/`↑` y entre botones de acción (*Pagar*, *Editar*, *Eliminar*) con `←`/`→`.
  - **Calendario financiero:** Recorrido día a día con `←`/`→`, salto de semanas completas con `↑`/`↓`, selección con `Enter` o `Espacio`, y ascenso automático a la barra de navegación (*Navbar*) al presionar `↑` desde la primera semana del mes o desde los controles superiores.
  - **Protección de texto:** Desplazamiento natural del cursor al escribir en campos de texto sin saltos no deseados.
- **Ciclo y atrapamiento de Foco (*Focus Trap*):**
  - Hook accesible [useFocusTrap.js](file:///c:/Users/dani_/Desktop/Registro%20contable/RegistroContable/src/hooks/useFocusTrap.js) que mantiene la tabulación dentro del modal y devuelve el foco al botón de origen al cerrarlo.
- **Compatibilidad con lectores de pantalla (NVDA, VoiceOver, JAWS):**
  - Regiones en vivo `aria-live="polite"` y `role="status"` en notificaciones toast.
  - Etiquetas contextuales `aria-label` en tablas financieras informando nombre y monto de cada transacción.
  - Diálogos WAI-ARIA completos con `role="dialog"`, `aria-modal="true"` y títulos asociados por `id`.
- **Adaptaciones visuales y sensoriales:**
  - Soporte para `@media (prefers-reduced-motion: reduce)` para usuarios sensibles a animaciones.
  - Estados comunicados con texto e íconos redundantes para daltonismo (protanopía y deuteranopía).

### 8. Modo demo interactivo
- Acceso inmediato con un clic sin registro previo con datos precargados, simulador de estados de suscripción (45 días, 5 días, vencido, Pro activo) y persistencia en `localStorage`.

---

## Estructura del repositorio

```text
RegistroContable/
├── dist/                              # Artefactos compilados para producción
├── functions/                         # Cloud Functions (Backend Node.js)
│   ├── .env                           # Credenciales privadas de producción (Mercado Pago)
│   ├── index.js                       # Endpoints: createCheckoutSession, webhook, cancel
│   └── package.json                   # Dependencias serverless (mercadopago, firebase-admin)
├── public/                            # Archivos estáticos servidos por Hosting
│   ├── fintrack-icon.svg              # Isotipo vectorial de la marca
│   └── manifest.json                  # Manifiesto PWA para instalación móvil y de escritorio
├── src/
│   ├── components/                    # Componentes modulares y reutilizables
│   │   ├── charts/                    # Gráficos interactivos Chart.js
│   │   │   ├── ExpenseCategoryChart.jsx
│   │   │   └── MonthlyComparisonChart.jsx
│   │   ├── CustomizeModal.jsx         # Modal de personalización de temas y fondos
│   │   ├── FinTrackLogo.jsx           # Isotipo y logotipo vectorial oficial
│   │   ├── FloatingActionButton.jsx   # Botón flotante de acción rápida (+ Movimiento)
│   │   ├── Footer.jsx                 # Pie de página adaptable
│   │   ├── Loader.jsx                 # Indicadores de carga y skeletons
│   │   ├── LoginModal.jsx             # Autenticación con Google, Email y Modo Demo
│   │   ├── MonthYearSelect.jsx        # Controles segmentados de fecha
│   │   ├── Navbar.jsx                 # Barra de navegación, dólar en vivo y menú de usuario
│   │   ├── PowerBiExportModal.jsx     # Exportador de datasets y fórmulas DAX
│   │   ├── QuickMovementModal.jsx     # Modal universal para carga rápida de movimientos
│   │   ├── ScreenLockModal.jsx        # Bloqueo de pantalla temporal
│   │   ├── SecurityAuditModal.jsx     # Bitácora de auditoría y copias de seguridad
│   │   ├── SecurityConfirmModal.jsx   # Modal de confirmación para acciones críticas
│   │   ├── SubscriptionModal.jsx      # Modal de suscripciones, planes y Mercado Pago
│   │   └── VencimientosModal.jsx      # Modal de control y pago de facturas pendientes
│   ├── context/                       # Gestión de estado global con React Context API
│   │   ├── AuthContext.jsx            # Sesión, normalización de usuario y Modo Demo
│   │   ├── BalanceContext.jsx         # Sincronización reactiva de saldos y ahorros
│   │   ├── PowerBiExportContext.jsx   # Estado de apertura del exportador Power BI
│   │   ├── PrivacyContext.jsx         # Alternancia de privacidad y máscara de importes
│   │   ├── QuickMovementContext.jsx   # Control del modal rápido universal
│   │   ├── SecurityContext.jsx        # Gestión de confirmaciones y bloqueo de pantalla
│   │   ├── SubscriptionContext.jsx    # Monitoreo reactivo del plan y estado de prueba
│   │   ├── ThemeContext.jsx           # Paletas de colores, modo oscuro y fondos
│   │   ├── ToastContext.jsx           # Notificaciones toast flotantes no intrusivas
│   │   └── VencimientosContext.jsx    # Listener en tiempo real de facturas y servicios
│   ├── hooks/
│   │   ├── useArrowNavigation.js      # Hook para navegación espacial y direccional por flechas
│   │   ├── useDolar.js                # Hook reactivo de cotizaciones del dólar argentino
│   │   └── useFocusTrap.js            # Hook de ciclo de foco, navegación y retorno en modales
│   ├── pages/                         # Vistas con carga perezosa (React.lazy)
│   │   ├── Ahorro.jsx                 # Gestión de metas y monedas de ahorro
│   │   ├── Calendario.jsx             # Calendario mensual y distribución de compromisos
│   │   ├── ConsultarGasto.jsx         # Exploración, filtros, edición y borrado de gastos
│   │   ├── ConsultarIngreso.jsx       # Exploración, edición y ahorro automático en ingresos
│   │   ├── Home.jsx                   # Dashboard analítico con métricas principales
│   │   ├── NuevoGasto.jsx             # Formulario detallado de gastos y vencimientos
│   │   ├── NuevoIngreso.jsx           # Formulario de ingresos con asignación de ahorro
│   │   └── Resumen.jsx                # Matriz financiera anual comparativa mes a mes
│   ├── services/                      # Capa de datos y servicios externos
│   │   ├── auditService.js            # Registro criptográfico de auditoría
│   │   ├── backupService.js           # Generación de snapshots y respaldo de datos
│   │   ├── cryptoService.js           # Encriptación ligera para almacenamiento seguro
│   │   ├── dbService.js               # Conexión reactiva con Firebase Firestore
│   │   ├── demoData.js                # Almacenamiento local para simulación de Demo
│   │   ├── dolarService.js            # Consumo de API de cotizaciones cambiarias
│   │   ├── firebase.js                # Inicialización modular de Firebase
│   │   └── subscriptionService.js     # Cliente HTTP para Cloud Functions de pago
│   ├── utils/                         # Funciones auxiliares puras
│   │   ├── categories.js              # Catálogo de categorías con iconos y colores
│   │   ├── exportUtils.js             # Exportadores a Excel (CSV con BOM) y PDF
│   │   ├── formatters.js              # Formateadores monetarios, fechas y sanitización
│   │   └── powerBiExport.js           # Generador de modelos tabulares y DAX
│   ├── App.css                        # Estilos globales, temas y reglas @media print
│   ├── App.jsx                        # Enrutador con React Router y Suspense
│   └── main.jsx                       # Punto de entrada de la aplicación
├── .firebaserc                        # Alias de proyecto en Firebase (`registrocontable32`)
├── firebase.json                      # Configuración de Hosting, Firestore y Functions
├── firestore.rules                    # Reglas de seguridad estrictas en Firestore
├── index.html                         # Documento raíz con fuentes optimizadas y meta PWA
├── package.json                       # Dependencias y scripts del frontend
└── vite.config.js                     # Configuración de Vite con Rollup Code-Splitting
```

---


##  Principios de diseño e identidad visual

1. **Numerales tabulares:** Todo importe monetario utiliza la propiedad CSS `font-feature-settings: "tnum"` para garantizar alineación decimal exacta en balances y tablas.
2. **Iconografía vectorial coherente:** Exclusividad de Bootstrap Icons para mantener un peso visual homogéneo, sin emojis Unicode invasivos.
3. **Contraste y accesibilidad (WCAG AA):** Cada combinación de tema claro, pastel o tema oscuro cumple con un contraste superior a 4.5:1 para lectura sin esfuerzo.
4. **Diseño adaptable (Mobile-First):** Controles táctiles con altura mínima de 44px, navegación colapsable en drawer lateral para pantallas pequeñas y vistas de tabla con scroll horizontal suave.

---

## Licencia

Este proyecto fue desarrollado bajo estándares de código limpio y arquitectura escalable. Todos los derechos reservados.
