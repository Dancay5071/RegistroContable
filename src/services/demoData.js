import { MESES } from "../utils/formatters";

const STORAGE_KEY = "fintrack_demo_data_v2";
const LEGACY_STORAGE_KEY = "fintrack_demo_data_v1";

function generarDatosIniciales() {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const now = new Date();
  const todayDay = now.getDate();

  const formatOffsetDate = (days) => {
    const target = new Date(now);
    target.setDate(target.getDate() + days);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, "0");
    const d = String(target.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = (y, mIdx, day) => `${y}-${pad(mIdx + 1)}-${pad(day)}`;

  const gastosPorMes = {};
  const ingresosPorMes = {};
  const ahorrosPorMes = {};
  const extraccionPorMes = {};

  const monthlyBaseProfiles = [
    { inflationFactor: 0.82, extraFreelance: false, bonus: false },
    { inflationFactor: 0.84, extraFreelance: true, freelanceAmount: 180000, bonus: false },
    { inflationFactor: 0.86, extraFreelance: false, bonus: false },
    { inflationFactor: 0.89, extraFreelance: true, freelanceAmount: 220000, bonus: false },
    { inflationFactor: 0.92, extraFreelance: false, bonus: false },
    { inflationFactor: 0.95, extraFreelance: true, freelanceAmount: 240000, bonus: true, bonusDesc: "Aguinaldo SAC 1ra cuota", bonusMonto: 580000 },
    { inflationFactor: 0.97, extraFreelance: false, bonus: false },
    { inflationFactor: 1.00, extraFreelance: true, freelanceAmount: 260000, bonus: false },
    { inflationFactor: 1.03, extraFreelance: false, bonus: false },
    { inflationFactor: 1.06, extraFreelance: true, freelanceAmount: 290000, bonus: false },
    { inflationFactor: 1.10, extraFreelance: true, freelanceAmount: 220000, bonus: false },
    { inflationFactor: 1.14, extraFreelance: false, bonus: true, bonusDesc: "Aguinaldo SAC 2da cuota", bonusMonto: 660000 }
  ];

  [currentYear - 1, currentYear].forEach((y) => {
    const isPrevYear = y < currentYear;
    const yearInflation = isPrevYear ? 0.75 : 1.0;

    for (let m = 0; m < 12; m++) {
      const mesNombre = MESES[m];
      const clave = `${mesNombre}_${y}`;
      const profile = monthlyBaseProfiles[m];
      const f = profile.inflationFactor * yearInflation;

      const baseSalaryGross = Math.round(1150000 * f);
      const baseSalarySavings = Math.round(baseSalaryGross * 0.12);
      const baseSalaryNet = baseSalaryGross - baseSalarySavings;

      const mIngresos = [
        {
          id: `demo_ing_${y}_${m}_1`,
          descripcion: "Sueldo mensual principal",
          monto: baseSalaryNet,
          montoBruto: baseSalaryGross,
          ahorro: baseSalarySavings,
          porcentajeAhorro: 12,
          categoria: "Sueldo",
          mes: mesNombre,
          anio: y,
          fecha: dateStr(y, m, 1)
        }
      ];

      let totalMesAhorros = baseSalarySavings;

      if (profile.extraFreelance) {
        const freeGross = Math.round(profile.freelanceAmount * yearInflation);
        const freeSavings = Math.round(freeGross * 0.10);
        const freeNet = freeGross - freeSavings;
        totalMesAhorros += freeSavings;
        mIngresos.push({
          id: `demo_ing_${y}_${m}_2`,
          descripcion: "Proyecto consultoría digital",
          monto: freeNet,
          montoBruto: freeGross,
          ahorro: freeSavings,
          porcentajeAhorro: 10,
          categoria: "Freelance",
          mes: mesNombre,
          anio: y,
          fecha: dateStr(y, m, 14)
        });
      }

      if (profile.bonus) {
        const bGross = Math.round(profile.bonusMonto * yearInflation);
        const bSavings = Math.round(bGross * 0.15);
        const bNet = bGross - bSavings;
        totalMesAhorros += bSavings;
        mIngresos.push({
          id: `demo_ing_${y}_${m}_bonus`,
          descripcion: profile.bonusDesc,
          monto: bNet,
          montoBruto: bGross,
          ahorro: bSavings,
          porcentajeAhorro: 15,
          categoria: "Sueldo",
          mes: mesNombre,
          anio: y,
          fecha: dateStr(y, m, 18)
        });
      }

      ingresosPorMes[clave] = mIngresos;
      ahorrosPorMes[clave] = { totalAhorros: totalMesAhorros };

      const mGastos = [];
      const isPastMonth = isPrevYear || m < currentMonthIdx;
      const isCurrentMonth = !isPrevYear && m === currentMonthIdx;

      const addGasto = ({ id, desc, monto, cat, day, dueOffset, forcePending = false }) => {
        const roundedMonto = Math.round(monto * f);
        const fechaGasto = dateStr(y, m, day);
        let estado = "pagado";
        let fechaVenc = null;

        if (isPastMonth) {
          estado = "pagado";
          if (dueOffset !== undefined) fechaVenc = dateStr(y, m, Math.max(1, day + dueOffset));
        } else if (isCurrentMonth) {
          if (forcePending || day >= todayDay || dueOffset !== undefined) {
            estado = (forcePending || day >= todayDay) ? "pendiente" : "pagado";
            fechaVenc = dueOffset !== undefined ? formatOffsetDate(dueOffset) : dateStr(y, m, day);
          }
        } else {
          estado = "pendiente";
          fechaVenc = dateStr(y, m, day);
        }

        mGastos.push({
          id: `demo_g_${y}_${m}_${id}`,
          descripcion: desc,
          monto: roundedMonto,
          categoria: cat,
          estadoPago: estado,
          fecha: fechaGasto,
          mes: mesNombre,
          anio: y,
          ...(fechaVenc ? { fechaVencimiento: fechaVenc } : {})
        });
      };

      addGasto({ id: "alquiler", desc: "Alquiler departamento", monto: 290000, cat: "Vivienda", day: 5 });
      addGasto({ id: "super_1", desc: "Supermercado primera quincena", monto: 85000, cat: "Supermercado", day: 4 });
      addGasto({ id: "super_2", desc: "Supermercado segunda quincena", monto: 92000, cat: "Supermercado", day: 19 });
      addGasto({ id: "luz", desc: "Factura de Luz (Edenor)", monto: 23500, cat: "Servicios", day: 15, dueOffset: isCurrentMonth ? 3 : 5 });
      addGasto({ id: "internet", desc: "Internet Fibra 500MB", monto: 26800, cat: "Servicios", day: 18, dueOffset: isCurrentMonth ? 6 : 7 });
      addGasto({ id: "combustible", desc: "Combustible YPF Infinia", monto: 38000, cat: "Transporte", day: 8 });
      addGasto({ id: "seguro", desc: "Seguro Automotor La Caja", monto: 19500, cat: "Transporte", day: 10, dueOffset: isCurrentMonth ? -2 : 3, forcePending: isCurrentMonth });
      addGasto({ id: "prepaga", desc: "Medicina Prepaga", monto: 54000, cat: "Salud", day: 12, dueOffset: isCurrentMonth ? -1 : 4, forcePending: isCurrentMonth });
      addGasto({ id: "salida", desc: "Salida restaurante / cena", monto: 36000, cat: "Comida", day: 21 });
      addGasto({ id: "servicios_stream", desc: "Suscripciones streaming", monto: 14500, cat: "Ocio", day: 11 });

      if (m % 3 === 0) {
        addGasto({ id: "farmacia", desc: "Farmacia y cuidado personal", monto: 21000, cat: "Salud", day: 16 });
      }
      if (m % 4 === 1) {
        addGasto({ id: "ropa", desc: "Indumentaria y calzado", monto: 45000, cat: "Compras", day: 23 });
      }
      if (m % 6 === 2) {
        addGasto({ id: "curso", desc: "Curso desarrollo profesional", monto: 35000, cat: "Educacion", day: 25 });
      }

      gastosPorMes[clave] = mGastos;
    }
  });

  extraccionPorMes[`${MESES[3]}_${currentYear}`] = [
    { monto: -60000.00, fecha: dateStr(currentYear, 3, 20) }
  ];
  extraccionPorMes[`${MESES[8]}_${currentYear}`] = [
    { monto: -45000.00, fecha: dateStr(currentYear, 8, 15) }
  ];

  return {
    balances: {
      montoActual: 485600.50,
      totalAhorros: 1280000.00,
      totalAhorrosUSD: 1850.00,
      totalAhorrosEUR: 650.00
    },
    gastosPorMes,
    ingresosPorMes,
    ahorrosPorMes,
    extraccionPorMes,
    ahorrosDetallados: [
      { id: "aho_1", tipo: "ahorro", monto: 450000.00, moneda: "ARS", categoria: "Emergencia", descripcion: "Fondo de emergencia en Plazo Fijo UVA", mes: MESES[currentMonthIdx], anio: currentYear, fecha: new Date().toISOString() },
      { id: "aho_2", tipo: "ahorro", monto: 380000.00, moneda: "ARS", categoria: "Vehiculo", descripcion: "Ahorro cambio de vehículo", mes: MESES[currentMonthIdx], anio: currentYear, fecha: new Date().toISOString() },
      { id: "aho_3", tipo: "ahorro", monto: 270000.00, moneda: "ARS", categoria: "Vacaciones", descripcion: "Fondo vacaciones verano Brasil", mes: MESES[currentMonthIdx], anio: currentYear, fecha: new Date().toISOString() },
      { id: "aho_4", tipo: "ahorro", monto: 180000.00, moneda: "ARS", categoria: "Tecnologia", descripcion: "Renovación equipo portátil MacBook", mes: MESES[currentMonthIdx], anio: currentYear, fecha: new Date().toISOString() },
      { id: "aho_5", tipo: "ahorro", monto: 1250.00, moneda: "USD", categoria: "Inversiones", descripcion: "Dólar billete físico resguardo de valor", mes: MESES[currentMonthIdx], anio: currentYear, fecha: new Date().toISOString() },
      { id: "aho_6", tipo: "ahorro", monto: 600.00, moneda: "USD", categoria: "Inversiones", descripcion: "Dólar MEP en cuenta comitente (CEDEARs)", mes: MESES[currentMonthIdx], anio: currentYear, fecha: new Date().toISOString() },
      { id: "aho_7", tipo: "ahorro", monto: 650.00, moneda: "EUR", categoria: "Vacaciones", descripcion: "Fondo billetes euros viaje a Europa", mes: MESES[currentMonthIdx], anio: currentYear, fecha: new Date().toISOString() },
      { id: "aho_ext_1", tipo: "extraccion", monto: 60000.00, moneda: "ARS", categoria: "Vehiculo", descripcion: "Service integral 50.000 km y cubiertas", mes: MESES[3], anio: currentYear, fecha: dateStr(currentYear, 3, 20) },
      { id: "aho_ext_2", tipo: "extraccion", monto: 45000.00, moneda: "ARS", categoria: "Tecnologia", descripcion: "Compra de monitor externo 27 pulgadas", mes: MESES[8], anio: currentYear, fecha: dateStr(currentYear, 8, 15) }
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
  const list = store.gastosPorMes[clave] || [];
  return [...list].sort((a, b) => {
    const timeA = a.fecha ? new Date(a.fecha).getTime() : 0;
    const timeB = b.fecha ? new Date(b.fecha).getTime() : 0;
    return timeB - timeA;
  });
}

export function addDemoGasto(mes, anio, gasto) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  if (!store.gastosPorMes[clave]) {
    store.gastosPorMes[clave] = [];
  }
  const gastoConMeta = {
    id: gasto.id || `demo_gasto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...gasto,
    categoria: gasto.categoria || "Otros",
    estadoPago: gasto.estadoPago || (gasto.fechaVencimiento ? "pendiente" : "pagado"),
    fecha: gasto.fecha || new Date().toISOString()
  };
  store.gastosPorMes[clave].push(gastoConMeta);
  if (gastoConMeta.estadoPago === "pagado") {
    store.balances.montoActual = Math.max(0, (store.balances.montoActual || 0) - gasto.monto);
  }
  saveDemoStore(store);
}

export function updateDemoGasto(mes, anio, target, nuevoGasto) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  const lista = store.gastosPorMes[clave] || [];
  let index = typeof target === "number" ? target : lista.findIndex((g) => g.id === target);
  if (index < 0 && nuevoGasto?.id) {
    index = lista.findIndex((g) => g.id === nuevoGasto.id);
  }
  if (index >= 0 && index < lista.length) {
    const prev = lista[index];
    const prevPaid = prev.estadoPago === "pagado";
    const nextPaid = (nuevoGasto.estadoPago || prev.estadoPago) === "pagado";
    lista[index] = { ...prev, ...nuevoGasto };
    if (prevPaid && nextPaid) {
      const diff = Number(nuevoGasto.monto) - Number(prev.monto);
      store.balances.montoActual = Math.max(0, (store.balances.montoActual || 0) - diff);
    } else if (!prevPaid && nextPaid) {
      store.balances.montoActual = Math.max(0, (store.balances.montoActual || 0) - Number(nuevoGasto.monto));
    } else if (prevPaid && !nextPaid) {
      store.balances.montoActual = (store.balances.montoActual || 0) + Number(prev.monto);
    }
    saveDemoStore(store);
  }
}

export function pagarDemoGasto(mes, anio, index, gastoId) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  const lista = store.gastosPorMes[clave] || [];
  let targetIndex = index;
  if (gastoId && (targetIndex === undefined || targetIndex === null || !lista[targetIndex] || lista[targetIndex].id !== gastoId)) {
    targetIndex = lista.findIndex((g) => g.id === gastoId);
  }
  if (targetIndex >= 0 && targetIndex < lista.length) {
    const item = lista[targetIndex];
    if (item.estadoPago !== "pagado") {
      item.estadoPago = "pagado";
      item.fechaPago = new Date().toISOString();
      store.balances.montoActual = Math.max(0, (store.balances.montoActual || 0) - Number(item.monto || 0));
      saveDemoStore(store);
    }
  }
}

export function getDemoGastosPendientes() {
  const store = getDemoStore();
  const pendientes = [];
  Object.keys(store.gastosPorMes || {}).forEach((clave) => {
    const partes = clave.split("_");
    const mes = partes[0];
    const anio = Number(partes[1]);
    const lista = store.gastosPorMes[clave] || [];
    lista.forEach((gasto, idx) => {
      if (gasto.estadoPago === "pendiente") {
        pendientes.push({
          ...gasto,
          mes,
          anio,
          claveMesAnio: clave,
          index: idx
        });
      }
    });
  });
  return pendientes;
}

export function deleteDemoGasto(mes, anio, target) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  const lista = store.gastosPorMes[clave] || [];
  const index = typeof target === "number" ? target : lista.findIndex((g) => g.id === target);
  if (index >= 0 && index < lista.length) {
    const eliminado = lista[index];
    lista.splice(index, 1);
    if (eliminado.estadoPago === "pagado") {
      store.balances.montoActual = (store.balances.montoActual || 0) + eliminado.monto;
    }
    saveDemoStore(store);
  }
}

export function getDemoIngresos(mes, anio) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  const list = store.ingresosPorMes[clave] || [];
  return [...list].sort((a, b) => {
    const timeA = a.fecha ? new Date(a.fecha).getTime() : 0;
    const timeB = b.fecha ? new Date(b.fecha).getTime() : 0;
    return timeB - timeA;
  });
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

export function updateDemoIngreso(mes, anio, target, nuevoIngreso) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  const lista = store.ingresosPorMes[clave] || [];
  let index = typeof target === "number" ? target : lista.findIndex((i) => i.id === target);
  if (index < 0 && nuevoIngreso?.id) {
    index = lista.findIndex((i) => i.id === nuevoIngreso.id);
  }
  if (index >= 0 && index < lista.length) {
    const diff = nuevoIngreso.monto - lista[index].monto;
    lista[index] = nuevoIngreso;
    store.balances.montoActual = (store.balances.montoActual || 0) + diff;
    saveDemoStore(store);
  }
}

export function deleteDemoIngreso(mes, anio, target) {
  const store = getDemoStore();
  const clave = `${mes}_${anio}`;
  const lista = store.ingresosPorMes[clave] || [];
  const index = typeof target === "number" ? target : lista.findIndex((i) => i.id === target);
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
  const list = store.ahorrosDetallados || [];
  return [...list].sort((a, b) => {
    const timeA = a.fecha ? new Date(a.fecha).getTime() : 0;
    const timeB = b.fecha ? new Date(b.fecha).getTime() : 0;
    return timeB - timeA;
  });
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

export function getDemoAllTransacciones() {
  const store = getDemoStore();
  const list = [];

  if (store.gastosPorMes) {
    Object.entries(store.gastosPorMes).forEach(([clave, gastos]) => {
      const parts = clave.split("_");
      const mes = parts[0] || "";
      const anio = Number(parts[1]) || new Date().getFullYear();
      (gastos || []).forEach((g, idx) => {
        list.push({
          id: g.id || `demo_g_${clave}_${idx}`,
          tipo: "gasto",
          descripcion: g.descripcion || "",
          monto: Number(g.monto || 0),
          categoria: g.categoria || "Otros",
          mes: g.mes || mes,
          anio: Number(g.anio || anio),
          fecha: g.fecha,
          fechaVencimiento: g.fechaVencimiento,
          estadoPago: g.estadoPago || "pagado",
          moneda: "ARS"
        });
      });
    });
  }

  if (store.ingresosPorMes) {
    Object.entries(store.ingresosPorMes).forEach(([clave, ingresos]) => {
      const parts = clave.split("_");
      const mes = parts[0] || "";
      const anio = Number(parts[1]) || new Date().getFullYear();
      (ingresos || []).forEach((i, idx) => {
        list.push({
          id: i.id || `demo_i_${clave}_${idx}`,
          tipo: "ingreso",
          descripcion: i.descripcion || "",
          monto: Number(i.monto || 0),
          montoBruto: Number(i.montoBruto || i.monto || 0),
          ahorro: Number(i.ahorro || 0),
          categoria: i.categoria || "Sueldo",
          mes: i.mes || mes,
          anio: Number(i.anio || anio),
          fecha: i.fecha,
          moneda: "ARS"
        });
      });
    });
  }

  if (store.ahorrosDetallados) {
    (store.ahorrosDetallados || []).forEach((a, idx) => {
      list.push({
        id: a.id || `demo_a_${idx}`,
        tipo: a.tipo || "ahorro",
        descripcion: a.descripcion || "Fondo de Ahorro",
        monto: Number(a.monto || 0),
        moneda: a.moneda || "ARS",
        categoria: a.categoria || "Ahorro General",
        mes: a.mes || "",
        anio: Number(a.anio || new Date().getFullYear()),
        fecha: a.fecha
      });
    });
  }

  return list;
}

export function getDemoSubscription() {
  const store = getDemoStore();
  if (store.subscription) {
    return store.subscription;
  }
  const now = new Date();
  const trialStart = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  const trialEnd = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
  const demoSub = {
    status: "trial",
    plan: "free_trial",
    isPro: true,
    isTrialActive: true,
    isExpired: false,
    daysLeft: 45,
    percentUsed: 25,
    trialStartDate: trialStart.toISOString(),
    trialEndDate: trialEnd.toISOString(),
    label: "Prueba Pro (45 días restantes)",
    badgeText: "45 días de prueba",
    badgeVariant: "primary"
  };
  store.subscription = demoSub;
  saveDemoStore(store);
  return demoSub;
}

export function setDemoSubscription(mode = "trial_45") {
  const store = getDemoStore();
  const now = new Date();
  let updated;
  if (mode === "active") {
    updated = {
      status: "active",
      plan: "pro_annual",
      isPro: true,
      isTrialActive: false,
      isExpired: false,
      daysLeft: null,
      percentUsed: 100,
      trialStartDate: null,
      trialEndDate: null,
      label: "Plan Pro Activo",
      badgeText: "Pro Activo",
      badgeVariant: "success"
    };
  } else if (mode === "expiring_5") {
    const trialStart = new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000);
    const trialEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    updated = {
      status: "trial",
      plan: "free_trial",
      isPro: true,
      isTrialActive: true,
      isExpired: false,
      daysLeft: 5,
      percentUsed: 92,
      trialStartDate: trialStart.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      label: "Prueba Pro (5 días restantes)",
      badgeText: "5 días de prueba",
      badgeVariant: "warning"
    };
  } else if (mode === "expired") {
    const trialStart = new Date(now.getTime() - 62 * 24 * 60 * 60 * 1000);
    const trialEnd = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    updated = {
      status: "expired",
      plan: "free_trial",
      isPro: false,
      isTrialActive: false,
      isExpired: true,
      daysLeft: 0,
      percentUsed: 100,
      trialStartDate: trialStart.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      label: "Periodo de prueba finalizado",
      badgeText: "Prueba Vencida",
      badgeVariant: "danger"
    };
  } else {
    const trialStart = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const trialEnd = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
    updated = {
      status: "trial",
      plan: "free_trial",
      isPro: true,
      isTrialActive: true,
      isExpired: false,
      daysLeft: 45,
      percentUsed: 25,
      trialStartDate: trialStart.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      label: "Prueba Pro (45 días restantes)",
      badgeText: "45 días de prueba",
      badgeVariant: "primary"
    };
  }
  store.subscription = updated;
  saveDemoStore(store);
  return updated;
}

