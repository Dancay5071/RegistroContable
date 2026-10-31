# Registro Contable (Migración a React)

Aplicación web de gestión contable personal y familiar migrada a **React** con **Vite**, **Bootstrap 5**, **React Router** y **Firebase** (Firestore y Authentication).

---

## 🚀 Tecnologías Utilizadas

- **React 19**
- **Vite** (bundler ultrarrápido y servidor de desarrollo)
- **React Router 7** (navegación SPA con rutas protegidas)
- **Firebase 10** (Authentication y Firestore en tiempo real con `onSnapshot`)
- **Bootstrap 5** & **Bootstrap Icons**

---

## 📁 Estructura del Proyecto

```text
RegistroContable/
├── dist/                          # Build para producción
├── public/                        # Archivos estáticos e imágenes (logo, favicon, fondo)
│   └── imagen/
│       ├── fondo.jpg
│       ├── home.png
│       └── RC.png
├── src/
│   ├── components/                # Componentes reutilizables
│   │   ├── BalanceDisplay.jsx     # Badge reactivo de saldo y ahorros
│   │   ├── Footer.jsx             # Pie de página con créditos
│   │   ├── Loader.jsx             # Spinner de carga
│   │   ├── LoginModal.jsx         # Modal de inicio de sesión
│   │   ├── MonthYearSelect.jsx    # Selector de mes y año
│   │   └── Navbar.jsx             # Barra de navegación principal y logout
│   ├── context/                   # Estados globales
│   │   ├── AuthContext.jsx        # Sesión con Firebase Auth (login/logout/user)
│   │   └── BalanceContext.jsx     # Saldos en tiempo real con onSnapshot
│   ├── pages/                     # Módulos y vistas principales
│   │   ├── Home.jsx               # Pantalla de inicio con fecha y bienvenida
│   │   ├── NuevoGasto.jsx         # Registro de nuevo gasto
│   │   ├── ConsultarGasto.jsx     # Listado, edición y eliminación de gastos
│   │   ├── NuevoIngreso.jsx       # Registro de ingreso y % destinado a ahorro
│   │   ├── ConsultarIngreso.jsx   # Listado, edición y eliminación de ingresos
│   │   ├── Ahorro.jsx             # Consulta anual, extracciones y depósitos
│   │   └── Resumen.jsx            # Tabla comparativa financiera anual
│   ├── services/
│   │   └── firebase.js            # Conexión modular a Firebase y helpers
│   ├── utils/
│   │   └── formatters.js          # Formateo de números, moneda ($) y fechas
│   ├── App.jsx                    # Enrutador y layout principal
│   ├── App.css                    # Estilos visuales personalizados
│   └── main.jsx                   # Entrada principal
├── legacy-vanilla/                # Respaldo completo del código original en Vanilla JS
├── index.html
├── vite.config.js
└── package.json
```

---

## ⚡ Comandos Disponibles

En la terminal (dentro de la carpeta `RegistroContable`):

```bash
# Iniciar servidor de desarrollo local
npm run dev

# Generar versión optimizada para producción
npm run build

# Previsualizar el build de producción localmente
npm run preview
```

---

## ✨ Características y Mejoras Implementadas

1. **Arquitectura SPA (Single Page Application)**:
   - Navegación instantánea sin recarga de página entre Gastos, Ingresos, Ahorros y Resumen.
2. **Contexto Global y Reactividad**:
   - `AuthContext`: Administra el estado de autenticación y modales de forma limpia sin manipular el DOM manualmente.
   - `BalanceContext`: Sincroniza en tiempo real el monto disponible (`montoActual`) y el total de ahorros (`totalAhorros`) con Firestore.
3. **Rutas Protegidas**:
   - Si no se ha iniciado sesión, se solicita autenticación antes de acceder a los datos contables.
4. **Respaldo Seguro**:
   - Todo el código original en Vanilla JS está respaldado en la carpeta `legacy-vanilla/` y en la rama git `vanilla-original`.

