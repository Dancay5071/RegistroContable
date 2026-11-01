# FinTrack — Finanzas Personales & Ahorro Inteligente

Aplicación web progresiva (PWA) de gestión financiera personal desarrollada en **React 19** con **Vite**, **Bootstrap 5**, **Chart.js** y **Firebase** (Firestore en tiempo real y Authentication).

---

## Tecnologías Utilizadas

- **React 19** (SPA con `React.lazy` y `Suspense` para carga ultrarrápida)
- **Vite** (Bundler optimizado con división de código en chunks)
- **Chart.js** (Gráficos interactivos de donas de categorías y barras comparativas anuales)
- **Firebase 10** (Authentication con Google/Email y Firestore en tiempo real con `onSnapshot`)
- **Bootstrap 5 & Bootstrap Icons** (Sistema de diseño pastel con alto contraste)
- **PWA & Web Manifest** (Instalable en teléfonos Android e iOS)

---

## Estructura del Proyecto

```text
RegistroContable/
├── dist/                          # Build optimizado para producción
├── public/                        # Archivos estáticos públicos
│   ├── fintrack-icon.svg          # Isotipo vectorial de la marca
│   └── manifest.json              # Manifiesto para Progressive Web App (PWA)
├── src/
│   ├── components/                # Componentes reutilizables
│   │   ├── charts/                # Visualizadores interactivos Chart.js
│   │   │   ├── ExpenseCategoryChart.jsx
│   │   │   └── MonthlyComparisonChart.jsx
│   │   ├── FinTrackLogo.jsx       # Logotipo e isotipo vectorial
│   │   ├── FloatingActionButton.jsx
│   │   ├── Footer.jsx             # Pie de página
│   │   ├── Loader.jsx             # Spinners de carga
│   │   ├── LoginModal.jsx         # Modal de autenticación y Modo Demo
│   │   ├── MonthYearSelect.jsx    # Selectores de período
│   │   ├── Navbar.jsx             # Barra de navegación principal y saldos
│   │   └── QuickMovementModal.jsx # Modal universal de registro rápido
│   ├── context/                   # Estados globales de React
│   │   ├── AuthContext.jsx        # Gestión de sesión, Firebase Auth y Modo Demo
│   │   ├── BalanceContext.jsx     # Balances en tiempo real multimoneda
│   │   ├── QuickMovementContext.jsx
│   │   └── ToastContext.jsx       # Notificaciones Toast sin alerts intrusivos
│   ├── pages/                     # Vistas y pantallas
│   │   ├── Home.jsx               # Dashboard analítico con KPIs y gráficos
│   │   ├── NuevoGasto.jsx         # Registro individual de gasto
│   │   ├── ConsultarGasto.jsx     # Búsqueda, filtros y exportación Excel/PDF
│   │   ├── NuevoIngreso.jsx       # Registro de ingresos y ahorro programado
│   │   ├── ConsultarIngreso.jsx   # Historial y exportación de ingresos
│   │   ├── Ahorro.jsx             # Ahorro multimoneda (ARS/USD/EUR/USDT) y metas
│   │   └── Resumen.jsx            # Matriz comparativa de 12 meses
│   ├── services/
│   │   ├── dbService.js           # Consultas y escrituras en Firestore
│   │   ├── demoData.js            # Base de datos local para Modo Demo
│   │   └── firebase.js            # Conexión modular a Firebase
│   ├── utils/
│   │   ├── categories.js          # Catálogos de categorías con iconos
│   │   ├── exportUtils.js         # Exportador nativo a Excel (CSV UTF-8) y PDF
│   │   └── formatters.js          # Formato de monedas, números y fechas
│   ├── App.jsx                    # Enrutador principal y code splitting
│   ├── App.css                    # Sistema de estilos y reglas @media print
│   └── main.jsx                   # Punto de entrada
├── .github/workflows/             # Despliegue CI/CD continuo a Firebase Hosting
├── firebase.json                  # Configuración de hosting y reglas
├── firestore.rules                # Reglas de seguridad por usuario
├── index.html                     # HTML principal con metaetiquetas PWA
└── vite.config.js                 # Configuración de Vite y chunking
```

---

## Comandos Disponibles

```bash
# Iniciar servidor de desarrollo local
npm run dev

# Generar versión de producción (en /dist)
npm run build

# Previsualizar el build de producción localmente
npm run preview
```

---

## Funcionalidades Principales

1. **Dashboard Financiero Completo**: KPIs de saldos disponibles y ahorros, gráfico de dona por categoría de gastos y evolución mensual.
2. **Modal Rápido Universal (`+ Movimiento`)**: Registro ágil en un solo clic de gastos, ingresos o ahorros con atajos numéricos y vista previa de importes.
3. **Ahorros Multimoneda & Categorizados**: Soporte para ARS ($), USD (US$), EUR (€) y USDT (₮) con metas de ahorro (Emergencia, Vacaciones, Vehículo, Vivienda, etc.).
4. **Exportación Profesional a Excel y PDF**: Descarga directa de archivos `.csv` compatibles con Microsoft Excel y modo de impresión limpio para reportes en PDF.
5. **Modo Demo Interactivo**: Permite probar todas las funcionalidades con datos simulados y persistencia local sin registrarse.
