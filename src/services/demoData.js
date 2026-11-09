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
      totalAhorros: 85000.00,
      totalAhorrosUSD: 350.00,
      totalAhorrosEUR: 0.00
    },
    gastosPorMes: {
      [`${currentMonthName}_${currentYear}`]: [
        { descripcion: "Supermercado mensual", monto: 48500.00, categoria: "Supermercado", fecha: new Date().toISOString() },
        { descripcion: "Factura de Luz (Edenor)", monto: 14200.00, categoria: "Servicios", fecha: new Date().toISOString() },
        { descripcion: "Internet y cable fibra", monto: 18900.00, categoria: "Servicios", fecha: new Date().toISOString() },
        { descripcion: "Combustible vehículo", monto: 25000.00, categoria: "Transporte", fecha: new Date().toISOString() },
        { descripcion: "Farmacia y medicamentos", monto: 8600.00, categoria: "Salud", fecha: new Date().toISOString() }
      ],
      [`${prevMonthName}_${currentYear}`]: [
        { descripcion: "Supermercado", monto: 52000.00, categoria: "Supermercado", fecha: new Date().toISOString() },
        { descripcion: "Servicios varios", monto: 22000.00, categoria: "Servicios", fecha: new Date().toISOString() },
        { descripcion: "Salida restaurante", monto: 19500.00, categoria: "Comida", fecha: new Date().toISOString() }
      ]
    },
    ingresosPorMes: {
      [`${currentMonthName}_${currentYear}`]: [
        { descripcion: "Sueldo mensual principal", monto: 243000.00, ahorro: 27000.00, categoria: "Sueldo", fecha: new Date().toISOString() },
        { descripcion: "Proyecto freelance diseño", monto: 58500.00, ahorro: 6500.00, categoria: "Freelance", fecha: new Date().toISOString() }
      ],
      [`${prevMonthName}_${currentYear}`]: [
        { descripcion: "Sueldo mensual principal", monto: 243000.00, ahorro: 27000.00, categoria: "Sueldo", fecha: new Date().toISOString() }
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
    },
    ahorrosDetallados: [
      { id: "aho_1", tipo: "ahorro", monto: 50000.00, moneda: "ARS", categoria: "Emergencia", descripcion: "Reserva de seguridad", mes: currentMonthName, anio: currentYear, fecha: new Date().toISOString() },
      { id: "aho_2", tipo: "ahorro", monto: 35000.00, moneda: "ARS", categoria: "Vacaciones", descripcion: "Fondo vacaciones verano", mes: currentMonthName, anio: currentYear, fecha: new Date().toISOString() },
      { id: "aho_3", tipo: "ahorro", monto: 350.00, moneda: "USD", categoria: "Vacaciones", descripcion: "Billetes dólar para viaje", mes: currentMonthName, anio: currentYear, fecha: new Date().toISOString() }
    ]
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

export function getDemoBalances() {
  const store = getDemoStore();
  return store.balances || { montoActual: 0, totalAhorros: 0 };
}

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
  const gastoConMeta = {
    ...gasto,
    categoria: gasto.categoria || "Otros",
    fecha: gasto.fecha || new Date().toISOString()
  };
  store.gastosPorMes[clave].push(gastoConMeta);
  store.balances.montoActual = Math.max(0, (store.balances.montoActual || 0) - gasto.monto);
  saveDemoStore(store);
}

export function updateDemoGasto(mes, anio, index, nuevoGasto) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  const lista = store.gastosPorMes[clave] || [];
  if (index >= 0 && index < lista.length) {
    const diff = nuevoGasto.monto - lista[index].monto;
    lista[index] = { ...lista[index], ...nuevoGasto };
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

  const montoBruto = Number(ingreso.montoBruto || ingreso.monto || 0);
  let ahorro = 0;
  let porcentajeFinal = 0;

  if (ingreso.montoAhorro !== undefined && ingreso.montoAhorro !== null && Number(ingreso.montoAhorro) > 0) {
    ahorro = Math.min(montoBruto, Number(ingreso.montoAhorro));
    porcentajeFinal = montoBruto > 0 ? (ahorro / montoBruto) * 100 : 0;
  } else if (ingreso.ahorro !== undefined && ingreso.ahorro !== null && Number(ingreso.ahorro) > 0) {
    ahorro = Math.min(montoBruto, Number(ingreso.ahorro));
    porcentajeFinal = Number(ingreso.porcentajeAhorro || (montoBruto > 0 ? (ahorro / montoBruto) * 100 : 0));
  } else {
    porcentajeFinal = Number(ingreso.porcentajeAhorro || 0);
    ahorro = Math.min(montoBruto, (montoBruto * porcentajeFinal) / 100);
  }

  const ingresoNeto = Math.max(0, montoBruto - ahorro);

  const ingresoConMeta = {
    ...ingreso,
    monto: ingresoNeto,
    montoBruto,
    ahorro,
    porcentajeAhorro: Number(porcentajeFinal.toFixed(1)),
    categoria: ingreso.categoria || "Sueldo",
    fecha: ingreso.fecha || new Date().toISOString()
  };
  store.ingresosPorMes[clave].push(ingresoConMeta);

  store.balances.montoActual = (store.balances.montoActual || 0) + ingresoNeto;
  if (ahorro > 0) {
    store.balances.totalAhorros = (store.balances.totalAhorros || 0) + ahorro;
    if (!store.ahorrosPorMes[clave]) {
      store.ahorrosPorMes[clave] = { totalAhorros: 0 };
    }
    store.ahorrosPorMes[clave].totalAhorros += ahorro;
  }

  saveDemoStore(store);
  return ingresoConMeta;
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

export function addDemoAhorro(mes, anio, monto, moneda = "ARS", categoria = "Emergencia", descripcion = "") {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  if (!store.ahorrosPorMes[clave]) {
    store.ahorrosPorMes[clave] = { totalAhorros: 0 };
  }

  if (moneda === "USD") {
    store.balances.totalAhorrosUSD = (store.balances.totalAhorrosUSD || 0) + monto;
  } else if (moneda === "EUR") {
    store.balances.totalAhorrosEUR = (store.balances.totalAhorrosEUR || 0) + monto;
  } else {
    store.ahorrosPorMes[clave].totalAhorros += monto;
    store.balances.totalAhorros = (store.balances.totalAhorros || 0) + monto;
  }

  if (!store.ahorrosDetallados) store.ahorrosDetallados = [];
  store.ahorrosDetallados.unshift({
    id: `aho_${Date.now()}`,
    tipo: "ahorro",
    monto,
    moneda,
    categoria,
    descripcion: descripcion.trim() || `Aporte a ${categoria}`,
    mes,
    anio,
    fecha: new Date().toISOString()
  });

  saveDemoStore(store);
}

export function addDemoExtraccion(mes, anio, monto, moneda = "ARS", categoria = "Emergencia", descripcion = "") {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  if (!store.extraccionPorMes[clave]) {
    store.extraccionPorMes[clave] = [];
  }
  store.extraccionPorMes[clave].push({
    monto: -monto,
    fecha: new Date().toISOString()
  });

  if (moneda === "USD") {
    store.balances.totalAhorrosUSD = Math.max(0, (store.balances.totalAhorrosUSD || 0) - monto);
  } else if (moneda === "EUR") {
    store.balances.totalAhorrosEUR = Math.max(0, (store.balances.totalAhorrosEUR || 0) - monto);
  } else {
    store.balances.totalAhorros = Math.max(0, (store.balances.totalAhorros || 0) - monto);
  }

  if (!store.ahorrosDetallados) store.ahorrosDetallados = [];
  store.ahorrosDetallados.unshift({
    id: `ext_${Date.now()}`,
    tipo: "extraccion",
    monto,
    moneda,
    categoria,
    descripcion: descripcion.trim() || `Extracción de ${categoria}`,
    mes,
    anio,
    fecha: new Date().toISOString()
  });

  saveDemoStore(store);
}

export function getDemoDetalleAhorros() {
  const store = getDemoStore();
  return store.ahorrosDetallados || [];
}

export function updateDemoAhorro(id, { descripcion, monto, moneda, categoria }) {
  const store = getDemoStore();
  if (!store.ahorrosDetallados) return null;

  const idx = store.ahorrosDetallados.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const item = store.ahorrosDetallados[idx];
  const oldMonto = Number(item.monto);
  const newMonto = Number(monto);
  const oldMoneda = item.moneda || "ARS";
  const newMoneda = moneda || "ARS";
  const esExtraccion = item.tipo === "extraccion";

  const getBalKey = (m) => m === "USD" ? "totalAhorrosUSD" : m === "EUR" ? "totalAhorrosEUR" : "totalAhorros";

  const revertDiff = esExtraccion ? oldMonto : -oldMonto;
  store.balances[getBalKey(oldMoneda)] = Math.max(0, (store.balances[getBalKey(oldMoneda)] || 0) + revertDiff);

  const applyDiff = esExtraccion ? -newMonto : newMonto;
  store.balances[getBalKey(newMoneda)] = Math.max(0, (store.balances[getBalKey(newMoneda)] || 0) + applyDiff);

  store.ahorrosDetallados[idx] = {
    ...item,
    descripcion: descripcion.trim(),
    monto: newMonto,
    moneda: newMoneda,
    categoria,
    updatedAt: new Date().toISOString()
  };

  saveDemoStore(store);
  return store.ahorrosDetallados[idx];
}

export function deleteDemoAhorro(id) {
  const store = getDemoStore();
  if (!store.ahorrosDetallados) return;

  const idx = store.ahorrosDetallados.findIndex((a) => a.id === id);
  if (idx === -1) return;

  const item = store.ahorrosDetallados[idx];
  const monto = Number(item.monto);
  const moneda = item.moneda || "ARS";
  const esExtraccion = item.tipo === "extraccion";
  const getBalKey = (m) => m === "USD" ? "totalAhorrosUSD" : m === "EUR" ? "totalAhorrosEUR" : "totalAhorros";

  const revertDiff = esExtraccion ? monto : -monto;
  store.balances[getBalKey(moneda)] = Math.max(0, (store.balances[getBalKey(moneda)] || 0) + revertDiff);

  store.ahorrosDetallados.splice(idx, 1);
  saveDemoStore(store);
}

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

export function getDemoUltimasTransacciones(limitCount = 5) {
  const store = getDemoStore();
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const currentMonthName = MESES[currentMonthIdx];
  const clave = `${currentMonthName}_${currentYear}`;

  const transacciones = [];

  const gastos = store.gastosPorMes[clave] || [];
  gastos.forEach((g) => {
    transacciones.push({
      tipo: "gasto",
      descripcion: g.descripcion,
      monto: g.monto,
      categoria: g.categoria || "Otros",
      mes: currentMonthName,
      anio: currentYear,
      createdAt: g.fecha || new Date().toISOString()
    });
  });

  const ingresos = store.ingresosPorMes[clave] || [];
  ingresos.forEach((i) => {
    transacciones.push({
      tipo: "ingreso",
      descripcion: i.descripcion,
      monto: i.monto,
      categoria: i.categoria || "Sueldo",
      mes: currentMonthName,
      anio: currentYear,
      createdAt: i.fecha || new Date().toISOString()
    });
  });

  transacciones.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return transacciones.slice(0, limitCount);
}

