// src/services/demoData.js
import { MESES } from "../utils/formatters";

const STORAGE_KEY = "registro_contable_demo_data_v1";

function generarDatosIniciales() {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const currentMonthName = MESES[currentMonthIdx];
  const prevMonthName = MESES[(currentMonthIdx - 1 + 12) % 12];

  return {
    balances: {
      montoActual: 154800.50,
      totalAhorros: 85000.00
    },
    gastosPorMes: {
      [`${currentMonthName}_${currentYear}`]: [
        { descripcion: "Supermercado mensual", monto: 48500.00 },
        { descripcion: "Factura de Luz (Edenor)", monto: 14200.00 },
        { descripcion: "Internet y cable fibra", monto: 18900.00 },
        { descripcion: "Combustible vehículo", monto: 25000.00 },
        { descripcion: "Farmacia y medicamentos", monto: 8600.00 }
      ],
      [`${prevMonthName}_${currentYear}`]: [
        { descripcion: "Supermercado", monto: 52000.00 },
        { descripcion: "Servicios varios", monto: 22000.00 },
        { descripcion: "Salida restaurante", monto: 19500.00 }
      ]
    },
    ingresosPorMes: {
      [`${currentMonthName}_${currentYear}`]: [
        { descripcion: "Sueldo mensual principal", monto: 243000.00, ahorro: 27000.00 },
        { descripcion: "Proyecto independiente / Freelance", monto: 58500.00, ahorro: 6500.00 }
      ],
      [`${prevMonthName}_${currentYear}`]: [
        { descripcion: "Sueldo mensual principal", monto: 243000.00, ahorro: 27000.00 }
      ]
    },
    ahorrosPorMes: {
      [`${currentMonthName}_${currentYear}`]: { totalAhorros: 33500.00 },
      [`${prevMonthName}_${currentYear}`]: { totalAhorros: 27000.00 },
      [`Enero_${currentYear}`]: { totalAhorros: 25000.00 },
      [`Febrero_${currentYear}`]: { totalAhorros: 20000.00 }
    },
    extraccionPorMes: {
      [`${prevMonthName}_${currentYear}`]: [
        { monto: -15000.00, fecha: new Date().toISOString() }
      ]
    }
  };
}

export function getDemoStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generarDatosIniciales();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error al leer demo data:", error);
    return generarDatosIniciales();
  }
}

export function saveDemoStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("demo-store-updated", { detail: data }));
  } catch (error) {
    console.error("Error al guardar demo data:", error);
  }
}

export function resetDemoData() {
  const fresh = generarDatosIniciales();
  saveDemoStore(fresh);
  return fresh;
}

// Helpers para saldos
export function getDemoBalances() {
  const store = getDemoStore();
  return store.balances || { montoActual: 0, totalAhorros: 0 };
}

export function updateDemoBalances(deltaMonto = 0, deltaAhorro = 0) {
  const store = getDemoStore();
  store.balances.montoActual = Math.max(0, (store.balances.montoActual || 0) + deltaMonto);
  store.balances.totalAhorros = Math.max(0, (store.balances.totalAhorros || 0) + deltaAhorro);
  saveDemoStore(store);
  return store.balances;
}

// Helpers para Gastos
export function getDemoGastos(mes, anio) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  return store.gastosPorMes[clave] || [];
}

export function addDemoGasto(mes, anio, gasto) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  if (!store.gastosPorMes[clave]) {
    store.gastosPorMes[clave] = [];
  }
  store.gastosPorMes[clave].push(gasto);
  store.balances.montoActual = Math.max(0, (store.balances.montoActual || 0) - gasto.monto);
  saveDemoStore(store);
}

export function updateDemoGasto(mes, anio, index, nuevoGasto) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  const lista = store.gastosPorMes[clave] || [];
  if (index >= 0 && index < lista.length) {
    const diff = nuevoGasto.monto - lista[index].monto;
    lista[index] = nuevoGasto;
    store.balances.montoActual = Math.max(0, (store.balances.montoActual || 0) - diff);
    saveDemoStore(store);
  }
}

export function deleteDemoGasto(mes, anio, index) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  const lista = store.gastosPorMes[clave] || [];
  if (index >= 0 && index < lista.length) {
    const eliminado = lista[index];
    lista.splice(index, 1);
    store.balances.montoActual = (store.balances.montoActual || 0) + eliminado.monto;
    saveDemoStore(store);
  }
}

// Helpers para Ingresos
export function getDemoIngresos(mes, anio) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  return store.ingresosPorMes[clave] || [];
}

export function addDemoIngreso(mes, anio, ingreso) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  if (!store.ingresosPorMes[clave]) {
    store.ingresosPorMes[clave] = [];
  }
  store.ingresosPorMes[clave].push(ingreso);

  // Actualizar monto actual e increment de ahorro
  store.balances.montoActual = (store.balances.montoActual || 0) + ingreso.monto;
  if (ingreso.ahorro > 0) {
    store.balances.totalAhorros = (store.balances.totalAhorros || 0) + ingreso.ahorro;
    if (!store.ahorrosPorMes[clave]) {
      store.ahorrosPorMes[clave] = { totalAhorros: 0 };
    }
    store.ahorrosPorMes[clave].totalAhorros += ingreso.ahorro;
  }
  saveDemoStore(store);
}

export function updateDemoIngreso(mes, anio, index, nuevoIngreso) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  const lista = store.ingresosPorMes[clave] || [];
  if (index >= 0 && index < lista.length) {
    const diff = nuevoIngreso.monto - lista[index].monto;
    lista[index] = nuevoIngreso;
    store.balances.montoActual = (store.balances.montoActual || 0) + diff;
    saveDemoStore(store);
  }
}

export function deleteDemoIngreso(mes, anio, index) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  const lista = store.ingresosPorMes[clave] || [];
  if (index >= 0 && index < lista.length) {
    const eliminado = lista[index];
    lista.splice(index, 1);
    store.balances.montoActual = Math.max(0, (store.balances.montoActual || 0) - eliminado.monto);
    saveDemoStore(store);
  }
}

// Helpers para Ahorros
export function getDemoAhorrosPorMes(anio) {
  const store = getDemoStore();
  return MESES.map((mes) => {
    const clave = `${mes}_${anio}`;
    const ahorros = store.ahorrosPorMes[clave]?.totalAhorros || 0;
    const extracciones = (store.extraccionPorMes[clave] || []).reduce(
      (sum, ext) => sum + (ext.monto < 0 ? -ext.monto : ext.monto), 
      0
    );
    return {
      mes,
      monto: ahorros - extracciones
    };
  });
}

export function addDemoAhorro(mes, anio, monto) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  if (!store.ahorrosPorMes[clave]) {
    store.ahorrosPorMes[clave] = { totalAhorros: 0 };
  }
  store.ahorrosPorMes[clave].totalAhorros += monto;
  store.balances.totalAhorros = (store.balances.totalAhorros || 0) + monto;
  saveDemoStore(store);
}

export function addDemoExtraccion(mes, anio, monto) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  if (!store.extraccionPorMes[clave]) {
    store.extraccionPorMes[clave] = [];
  }
  store.extraccionPorMes[clave].push({
    monto: -monto,
    fecha: new Date().toISOString()
  });
  store.balances.totalAhorros = Math.max(0, (store.balances.totalAhorros || 0) - monto);
  saveDemoStore(store);
}

// Helper para Resumen
export function getDemoResumenAnual(anio) {
  const store = getDemoStore();
  const ingresosMensuales = [];
  const gastosMensuales = [];
  const ahorrosMensuales = [];
  const restosMesAnterior = [];
  const restosTotales = [];

  let totalAnualIngresos = 0;
  let totalAnualGastos = 0;
  let totalAnualAhorros = 0;

  for (let i = 0; i < MESES.length; i++) {
    const mes = MESES[i];
    const clave = `${mes}_${anio}`;

    const ingresosList = store.ingresosPorMes[clave] || [];
    const sumaIngresos = ingresosList.reduce((acc, x) => acc + (x.monto || 0), 0);
    ingresosMensuales.push(sumaIngresos);
    totalAnualIngresos += sumaIngresos;

    const gastosList = store.gastosPorMes[clave] || [];
    const sumaGastos = gastosList.reduce((acc, x) => acc + (x.monto || 0), 0);
    gastosMensuales.push(sumaGastos);
    totalAnualGastos += sumaGastos;

    const totalAhorroMes = store.ahorrosPorMes[clave]?.totalAhorros || 0;
    ahorrosMensuales.push(totalAhorroMes);
    totalAnualAhorros += totalAhorroMes;

    let restoAnterior = 0;
    if (i === 0) {
      restoAnterior = 0;
    } else {
      restoAnterior = ingresosMensuales[i - 1] - gastosMensuales[i - 1] + restosMesAnterior[i - 1];
    }
    restosMesAnterior.push(restoAnterior);

    const restoTotal = sumaIngresos - sumaGastos + restoAnterior;
    restosTotales.push(restoTotal);
  }

  return {
    ingresosMensuales,
    gastosMensuales,
    ahorrosMensuales,
    restosMesAnterior,
    restosTotales,
    totalAnualIngresos,
    totalAnualGastos,
    totalAnualAhorros
  };
}

