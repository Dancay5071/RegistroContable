import { 
  db 
} from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  increment, 
  serverTimestamp 
} from "firebase/firestore";
import { MESES } from "../utils/formatters";

export function listenUserBalances(userId, callback) {
  if (!userId) return () => {};

  const balancesDoc = doc(db, "users", userId, "config", "balances");

  return onSnapshot(balancesDoc, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        montoActual: Number(data.montoActual || 0),
        totalAhorros: Number(data.totalAhorros || data.totalAhorrosARS || 0),
        totalAhorrosUSD: Number(data.totalAhorrosUSD || 0),
        totalAhorrosEUR: Number(data.totalAhorrosEUR || 0)
      });
    } else {
      setDoc(balancesDoc, { 
        montoActual: 0, 
        totalAhorros: 0,
        totalAhorrosUSD: 0,
        totalAhorrosEUR: 0
      }, { merge: true });
      callback({ montoActual: 0, totalAhorros: 0, totalAhorrosUSD: 0, totalAhorrosEUR: 0 });
    }
  }, (error) => {
    console.error("Error al escuchar balances del usuario:", error);
    callback({ montoActual: 0, totalAhorros: 0, totalAhorrosUSD: 0, totalAhorrosEUR: 0 });
  });
}

export async function addGastoUser(userId, { mes, anio, descripcion, monto, categoria = "Otros", fechaVencimiento, estadoPago = "pagado" }) {
  const clave = `${mes}_${anio}`;
  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  const payload = {
    tipo: "gasto",
    descripcion: descripcion.trim(),
    categoria: categoria || "Otros",
    monto: Number(monto),
    mes,
    anio: Number(anio),
    claveMesAnio: clave,
    estadoPago: estadoPago || (fechaVencimiento ? "pendiente" : "pagado"),
    createdAt: serverTimestamp()
  };
  if (fechaVencimiento) {
    payload.fechaVencimiento = fechaVencimiento;
  }

  const docRef = await addDoc(transaccionesRef, payload);

  if (payload.estadoPago === "pagado") {
    await setDoc(balancesRef, {
      montoActual: increment(-monto)
    }, { merge: true });

    await setDoc(resumenRef, {
      totalGastos: increment(monto)
    }, { merge: true });
  }

  return docRef.id;
}

export async function pagarGastoPendienteUser(userId, id, gasto) {
  const transaccionRef = doc(db, "users", userId, "transacciones", id);
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const clave = gasto.claveMesAnio || `${gasto.mes}_${gasto.anio}`;
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  await updateDoc(transaccionRef, {
    estadoPago: "pagado",
    fechaPago: serverTimestamp()
  });

  await setDoc(balancesRef, {
    montoActual: increment(-Number(gasto.monto))
  }, { merge: true });

  await setDoc(resumenRef, {
    totalGastos: increment(Number(gasto.monto))
  }, { merge: true });
}

export function listenGastosPendientesUser(userId, callback) {
  if (!userId) return () => {};
  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const q = query(
    transaccionesRef,
    where("estadoPago", "==", "pendiente")
  );

  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.tipo === "gasto") {
        items.push({ id: d.id, ...data });
      }
    });
    callback(items);
  }, (err) => {
    console.error("Error al escuchar gastos pendientes:", err);
    callback([]);
  });
}

export async function getGastosPendientesUser(userId) {
  if (!userId) return [];
  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const q = query(
    transaccionesRef,
    where("estadoPago", "==", "pendiente")
  );
  const snap = await getDocs(q);
  const items = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data.tipo === "gasto") {
      items.push({ id: d.id, ...data });
    }
  });
  return items;
}

export async function getGastosUser(userId, mes, anio) {
  const clave = `${mes}_${anio}`;
  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const q = query(
    transaccionesRef,
    where("tipo", "==", "gasto"),
    where("claveMesAnio", "==", clave)
  );

  const snap = await getDocs(q);
  const items = [];
  snap.forEach((d) => {
    items.push({ id: d.id, ...d.data() });
  });

  items.sort((a, b) => {
    const timeA = a.fecha ? new Date(a.fecha).getTime() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
    const timeB = b.fecha ? new Date(b.fecha).getTime() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
    return timeB - timeA;
  });

  return items;
}

export async function updateGastoUser(userId, id, { mes, anio, descripcion, monto, montoAnterior, categoria, fechaVencimiento, estadoPago, estadoPagoAnterior }) {
  const clave = `${mes}_${anio}`;
  const transaccionRef = doc(db, "users", userId, "transacciones", id);
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  const prevPaid = (estadoPagoAnterior || "pagado") === "pagado";
  const nextPaid = (estadoPago || (prevPaid ? "pagado" : "pendiente")) === "pagado";

  const updatePayload = {
    descripcion: descripcion.trim(),
    monto: Number(monto),
    updatedAt: serverTimestamp()
  };
  if (categoria) updatePayload.categoria = categoria;
  if (fechaVencimiento !== undefined) updatePayload.fechaVencimiento = fechaVencimiento;
  if (estadoPago) updatePayload.estadoPago = estadoPago;

  await updateDoc(transaccionRef, updatePayload);

  if (prevPaid && nextPaid) {
    const diferencia = Number(monto) - Number(montoAnterior);
    if (diferencia !== 0) {
      await updateDoc(balancesRef, { montoActual: increment(-diferencia) });
      await updateDoc(resumenRef, { totalGastos: increment(diferencia) });
    }
  } else if (!prevPaid && nextPaid) {
    await updateDoc(balancesRef, { montoActual: increment(-Number(monto)) });
    await updateDoc(resumenRef, { totalGastos: increment(Number(monto)) });
  } else if (prevPaid && !nextPaid) {
    await updateDoc(balancesRef, { montoActual: increment(Number(montoAnterior)) });
    await updateDoc(resumenRef, { totalGastos: increment(-Number(montoAnterior)) });
  }
}

export async function deleteGastoUser(userId, id, { mes, anio, monto, estadoPago = "pagado" }) {
  const clave = `${mes}_${anio}`;
  const transaccionRef = doc(db, "users", userId, "transacciones", id);
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  await deleteDoc(transaccionRef);

  if (estadoPago === "pagado") {
    await updateDoc(balancesRef, {
      montoActual: increment(Number(monto))
    });

    await updateDoc(resumenRef, {
      totalGastos: increment(-Number(monto))
    });
  }
}

export async function addIngresoUser(userId, { mes, anio, descripcion, montoBruto, porcentajeAhorro = 0, montoAhorro = 0, categoria = "Sueldo" }) {
  const clave = `${mes}_${anio}`;
  const bruto = Number(montoBruto) || 0;
  let ahorro = 0;
  let porcentajeFinal = 0;

  if (montoAhorro !== undefined && montoAhorro !== null && Number(montoAhorro) > 0) {
    ahorro = Math.min(bruto, Number(montoAhorro));
    porcentajeFinal = bruto > 0 ? (ahorro / bruto) * 100 : 0;
  } else {
    porcentajeFinal = Number(porcentajeAhorro || 0);
    ahorro = Math.min(bruto, (bruto * porcentajeFinal) / 100);
  }

  const ingresoNeto = Math.max(0, bruto - ahorro);

  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  const docRef = await addDoc(transaccionesRef, {
    tipo: "ingreso",
    descripcion: descripcion.trim(),
    categoria: categoria || "Sueldo",
    monto: ingresoNeto,
    montoBruto: bruto,
    ahorro,
    porcentajeAhorro: Number(porcentajeFinal.toFixed(1)),
    mes,
    anio: Number(anio),
    claveMesAnio: clave,
    createdAt: serverTimestamp()
  });

  await setDoc(balancesRef, {
    montoActual: increment(ingresoNeto),
    totalAhorros: increment(ahorro)
  }, { merge: true });

  await setDoc(resumenRef, {
    totalIngresos: increment(ingresoNeto),
    totalAhorros: increment(ahorro)
  }, { merge: true });

  return docRef.id;
}

export async function getIngresosUser(userId, mes, anio) {
  const clave = `${mes}_${anio}`;
  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const q = query(
    transaccionesRef,
    where("tipo", "==", "ingreso"),
    where("claveMesAnio", "==", clave)
  );

  const snap = await getDocs(q);
  const items = [];
  snap.forEach((d) => {
    items.push({ id: d.id, ...d.data() });
  });

  items.sort((a, b) => {
    const timeA = a.fecha ? new Date(a.fecha).getTime() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
    const timeB = b.fecha ? new Date(b.fecha).getTime() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
    return timeB - timeA;
  });

  return items;
}

export async function updateIngresoUser(userId, id, { mes, anio, descripcion, monto, montoAnterior, categoria }) {
  const clave = `${mes}_${anio}`;
  const transaccionRef = doc(db, "users", userId, "transacciones", id);
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  const diferencia = Number(monto) - Number(montoAnterior);

  const updatePayload = {
    descripcion: descripcion.trim(),
    monto: Number(monto),
    updatedAt: serverTimestamp()
  };
  if (categoria) updatePayload.categoria = categoria;

  await updateDoc(transaccionRef, updatePayload);

  if (diferencia !== 0) {
    await updateDoc(balancesRef, {
      montoActual: increment(diferencia)
    });
    await updateDoc(resumenRef, {
      totalIngresos: increment(diferencia)
    });
  }
}

export async function deleteIngresoUser(userId, id, { mes, anio, monto }) {
  const clave = `${mes}_${anio}`;
  const transaccionRef = doc(db, "users", userId, "transacciones", id);
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  await deleteDoc(transaccionRef);

  await updateDoc(balancesRef, {
    montoActual: increment(-Number(monto))
  });

  await updateDoc(resumenRef, {
    totalIngresos: increment(-Number(monto))
  });
}

export async function addAhorroDirectoUser(userId, { mes, anio, monto, moneda = "ARS", categoria = "Emergencia", descripcion = "" }) {
  const clave = `${mes}_${anio}`;
  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  await addDoc(transaccionesRef, {
    tipo: "ahorro",
    monto: Number(monto),
    moneda,
    categoria,
    descripcion: descripcion.trim() || `Ahorro en ${categoria}`,
    mes,
    anio: Number(anio),
    claveMesAnio: clave,
    createdAt: serverTimestamp()
  });

  const balanceUpdate = {};
  if (moneda === "USD") {
    balanceUpdate.totalAhorrosUSD = increment(Number(monto));
  } else if (moneda === "EUR") {
    balanceUpdate.totalAhorrosEUR = increment(Number(monto));
  } else {
    balanceUpdate.totalAhorros = increment(Number(monto));
  }

  await setDoc(balancesRef, balanceUpdate, { merge: true });

  if (moneda === "ARS") {
    await setDoc(resumenRef, {
      totalAhorros: increment(Number(monto))
    }, { merge: true });
  }
}

export async function addExtraccionUser(userId, { mes, anio, monto, moneda = "ARS", categoria = "Emergencia", descripcion = "" }) {
  const clave = `${mes}_${anio}`;
  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  await addDoc(transaccionesRef, {
    tipo: "extraccion",
    monto: Number(monto),
    moneda,
    categoria,
    descripcion: descripcion.trim() || `Extracción de ${categoria}`,
    mes,
    anio: Number(anio),
    claveMesAnio: clave,
    createdAt: serverTimestamp()
  });

  const balanceUpdate = {};
  if (moneda === "USD") {
    balanceUpdate.totalAhorrosUSD = increment(-Number(monto));
  } else if (moneda === "EUR") {
    balanceUpdate.totalAhorrosEUR = increment(-Number(monto));
  } else {
    balanceUpdate.totalAhorros = increment(-Number(monto));
  }

  await setDoc(balancesRef, balanceUpdate, { merge: true });

  if (moneda === "ARS") {
    await setDoc(resumenRef, {
      totalExtracciones: increment(Number(monto))
    }, { merge: true });
  }
}

export async function getDetalleAhorrosUser(userId) {
  if (!userId) return [];
  try {
    const transaccionesRef = collection(db, "users", userId, "transacciones");
    const snap = await getDocs(transaccionesRef);
    const ahorros = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.tipo === "ahorro" || data.tipo === "extraccion") {
        ahorros.push({ id: d.id, ...data });
      }
    });

    ahorros.sort((a, b) => {
      const timeA = a.fecha ? new Date(a.fecha).getTime() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
      const timeB = b.fecha ? new Date(b.fecha).getTime() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
      return timeB - timeA;
    });

    return ahorros;
  } catch (error) {
    console.error("Error al obtener detalle de ahorros:", error);
    return [];
  }
}

export async function updateAhorroUser(userId, id, oldItem, { descripcion, monto, moneda = "ARS", categoria }) {
  const transaccionRef = doc(db, "users", userId, "transacciones", id);
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const clave = `${oldItem.mes}_${oldItem.anio}`;
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  const oldMonto = Number(oldItem.monto);
  const newMonto = Number(monto);
  const oldMoneda = oldItem.moneda || "ARS";
  const newMoneda = moneda || "ARS";
  const esExtraccion = oldItem.tipo === "extraccion";

  await updateDoc(transaccionRef, {
    descripcion: descripcion.trim(),
    monto: newMonto,
    moneda: newMoneda,
    categoria,
    updatedAt: serverTimestamp()
  });

  const getBalField = (m) => m === "USD" ? "totalAhorrosUSD" : m === "EUR" ? "totalAhorrosEUR" : "totalAhorros";
  const balanceUpdate = {};

  if (oldMoneda === newMoneda) {
    const diff = esExtraccion ? -(newMonto - oldMonto) : (newMonto - oldMonto);
    if (diff !== 0) {
      balanceUpdate[getBalField(newMoneda)] = increment(diff);
    }
  } else {
    const oldDiff = esExtraccion ? oldMonto : -oldMonto;
    const newDiff = esExtraccion ? -newMonto : newMonto;
    balanceUpdate[getBalField(oldMoneda)] = increment(oldDiff);
    balanceUpdate[getBalField(newMoneda)] = increment(newDiff);
  }

  if (Object.keys(balanceUpdate).length > 0) {
    await setDoc(balancesRef, balanceUpdate, { merge: true });
  }

  if (oldMoneda === "ARS" || newMoneda === "ARS") {
    const resumenUpdate = {};
    if (oldMoneda === "ARS" && newMoneda === "ARS") {
      const diff = newMonto - oldMonto;
      if (esExtraccion) {
        resumenUpdate.totalExtracciones = increment(diff);
      } else {
        resumenUpdate.totalAhorros = increment(diff);
      }
    } else if (oldMoneda === "ARS") {
      if (esExtraccion) {
        resumenUpdate.totalExtracciones = increment(-oldMonto);
      } else {
        resumenUpdate.totalAhorros = increment(-oldMonto);
      }
    } else if (newMoneda === "ARS") {
      if (esExtraccion) {
        resumenUpdate.totalExtracciones = increment(newMonto);
      } else {
        resumenUpdate.totalAhorros = increment(newMonto);
      }
    }
    if (Object.keys(resumenUpdate).length > 0) {
      await setDoc(resumenRef, resumenUpdate, { merge: true });
    }
  }
}

export async function deleteAhorroUser(userId, id, item) {
  const transaccionRef = doc(db, "users", userId, "transacciones", id);
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const clave = `${item.mes}_${item.anio}`;
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  await deleteDoc(transaccionRef);

  const monto = Number(item.monto);
  const moneda = item.moneda || "ARS";
  const esExtraccion = item.tipo === "extraccion";
  const getBalField = (m) => m === "USD" ? "totalAhorrosUSD" : m === "EUR" ? "totalAhorrosEUR" : "totalAhorros";

  const diff = esExtraccion ? monto : -monto;
  await setDoc(balancesRef, { [getBalField(moneda)]: increment(diff) }, { merge: true });

  if (moneda === "ARS") {
    const field = esExtraccion ? "totalExtracciones" : "totalAhorros";
    await setDoc(resumenRef, { [field]: increment(-monto) }, { merge: true });
  }
}

export async function getAhorrosYearUser(userId, anio) {
  const netosPorMes = [];

  for (const mes of MESES) {
    const clave = `${mes}_${anio}`;
    const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);
    const snap = await getDoc(resumenRef);

    let ahorros = 0;
    let extracciones = 0;

    if (snap.exists()) {
      const data = snap.data();
      ahorros = Number(data.totalAhorros || 0);
      extracciones = Number(data.totalExtracciones || 0);
    }

    netosPorMes.push({
      mes,
      monto: ahorros - extracciones
    });
  }

  return netosPorMes;
}

export async function getResumenAnualUser(userId, anio) {
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
    const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);
    const snap = await getDoc(resumenRef);

    let ing = 0;
    let gas = 0;
    let aho = 0;

    if (snap.exists()) {
      const data = snap.data();
      ing = Number(data.totalIngresos || 0);
      gas = Number(data.totalGastos || 0);
      aho = Number(data.totalAhorros || 0);
    }

    ingresosMensuales.push(ing);
    gastosMensuales.push(gas);
    ahorrosMensuales.push(aho);

    totalAnualIngresos += ing;
    totalAnualGastos += gas;
    totalAnualAhorros += aho;

    let restoAnt = 0;
    if (i === 0) {
      restoAnt = 0;
    } else {
      restoAnt = ingresosMensuales[i - 1] - gastosMensuales[i - 1] + restosMesAnterior[i - 1];
    }
    restosMesAnterior.push(restoAnt);

    const restoTot = ing - gas + restoAnt;
    restosTotales.push(restoTot);
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

export async function getUltimasTransaccionesUser(userId, limitCount = 5) {
  if (!userId) return [];
  try {
    const transaccionesRef = collection(db, "users", userId, "transacciones");
    const snap = await getDocs(transaccionesRef);
    const items = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() });
    });

    items.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    return items.slice(0, limitCount);
  } catch (error) {
    console.error("Error al obtener últimas transacciones:", error);
    return [];
  }
}

export async function getAllUserTransacciones(userId) {
  if (!userId) return [];
  try {
    const transaccionesRef = collection(db, "users", userId, "transacciones");
    const snap = await getDocs(transaccionesRef);
    const items = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() });
    });
    return items;
  } catch (error) {
    console.error("Error al obtener todas las transacciones:", error);
    return [];
  }
}

export const ADMIN_EMAILS = [
  "daniela.cabrera5071@gmail.com"
];

export function isUserAdmin(email, user = null) {
  const candidateEmail = (email || user?.email || user?.providerData?.[0]?.email || "").toLowerCase().trim();
  if (candidateEmail && ADMIN_EMAILS.includes(candidateEmail)) {
    return true;
  }
  const name = (user?.displayName || "").toLowerCase().trim();
  if (name && (name === "daniela cabrera" || name.includes("daniela cabrera"))) {
    return true;
  }
  return false;
}

export function calculateSubscription(data = {}, userCreationTime = null, userEmail = null, userObj = null) {
  const TOTAL_TRIAL_DAYS = 60;
  const TOTAL_TRIAL_MS = TOTAL_TRIAL_DAYS * 24 * 60 * 60 * 1000;

  const isAdmin = isUserAdmin(userEmail, userObj) || data?.plan === "admin_unlimited" || data?.isAdmin === true;

  if (isAdmin) {
    return {
      status: "active",
      plan: "admin_unlimited",
      isPro: true,
      isTrialActive: false,
      isExpired: false,
      daysLeft: null,
      percentUsed: 100,
      trialStartDate: data?.trialStartDate || null,
      trialEndDate: null,
      label: "Cuenta Administrador",
      badgeText: "Admin Pro",
      badgeVariant: "success",
      isAdmin: true
    };
  }

  if (data?.status === "active") {
    return {
      status: "active",
      plan: data.plan || "pro_monthly",
      isPro: true,
      isTrialActive: false,
      isExpired: false,
      daysLeft: null,
      percentUsed: 100,
      trialStartDate: data.trialStartDate || null,
      trialEndDate: data.trialEndDate || null,
      label: "Plan Pro Activo",
      badgeText: "Pro Activo",
      badgeVariant: "success",
      isAdmin: false
    };
  }

  const now = new Date();
  const trialStart = data?.trialStartDate 
    ? new Date(data.trialStartDate) 
    : (userCreationTime ? new Date(userCreationTime) : now);
    
  const trialEnd = data?.trialEndDate 
    ? new Date(data.trialEndDate) 
    : new Date(trialStart.getTime() + TOTAL_TRIAL_MS);

  const diffMs = trialEnd.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const elapsedMs = Math.max(0, TOTAL_TRIAL_MS - diffMs);
  const percentUsed = Math.min(100, Math.max(0, Math.round((elapsedMs / TOTAL_TRIAL_MS) * 100)));

  const isExpired = diffMs <= 0 || data?.status === "expired";
  const isTrialActive = !isExpired;
  const isPro = isTrialActive;

  let badgeText = `${daysLeft} días de prueba`;
  let badgeVariant = "primary";

  if (isExpired) {
    badgeText = "Prueba Vencida";
    badgeVariant = "danger";
  } else if (daysLeft === 1) {
    badgeText = "1 día de prueba";
    badgeVariant = "warning";
  } else if (daysLeft <= 7) {
    badgeText = `${daysLeft} días de prueba`;
    badgeVariant = "warning";
  }

  return {
    status: isExpired ? "expired" : "trial",
    plan: data?.plan || "free_trial",
    isPro,
    isTrialActive,
    isExpired,
    daysLeft,
    percentUsed,
    trialStartDate: trialStart.toISOString(),
    trialEndDate: trialEnd.toISOString(),
    label: isExpired 
      ? "Periodo de prueba finalizado" 
      : (daysLeft === 1 ? "Último día de prueba" : `Prueba Pro (${daysLeft} días restantes)`),
    badgeText,
    badgeVariant,
    isAdmin: false
  };
}

export function listenSubscriptionStatusUser(userId, userCreationTime, callback, userEmail = null, userObj = null) {
  if (!userId) return () => {};
  
  if (isUserAdmin(userEmail, userObj)) {
    const adminSub = calculateSubscription({ status: "active", plan: "admin_unlimited", isAdmin: true }, userCreationTime, userEmail, userObj);
    const subDocRef = doc(db, "users", userId, "config", "subscription");
    setDoc(subDocRef, {
      status: "active",
      plan: "admin_unlimited",
      isAdmin: true,
      updatedAt: serverTimestamp()
    }, { merge: true }).catch(() => {});
    callback(adminSub);
    return () => {};
  }

  const subDocRef = doc(db, "users", userId, "config", "subscription");

  return onSnapshot(subDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const sub = calculateSubscription(docSnap.data(), userCreationTime, userEmail, userObj);
      callback(sub);
    } else {
      const now = new Date();
      const trialStart = userCreationTime ? new Date(userCreationTime) : now;
      const trialEnd = new Date(trialStart.getTime() + 60 * 24 * 60 * 60 * 1000);
      const initialData = {
        status: "trial",
        trialStartDate: trialStart.toISOString(),
        trialEndDate: trialEnd.toISOString(),
        plan: "free_trial",
        createdAt: serverTimestamp()
      };
      setDoc(subDocRef, initialData, { merge: true }).catch(() => {});
      callback(calculateSubscription(initialData, userCreationTime, userEmail, userObj));
    }
  }, (err) => {
    console.error("Error al escuchar suscripción:", err);
    callback(calculateSubscription({}, userCreationTime, userEmail, userObj));
  });
}

export async function getSubscriptionStatusUser(userId, userCreationTime, userEmail = null) {
  if (!userId) return calculateSubscription({}, userCreationTime, userEmail);
  if (isUserAdmin(userEmail)) {
    return calculateSubscription({ status: "active", plan: "admin_unlimited", isAdmin: true }, userCreationTime, userEmail);
  }
  try {
    const subDocRef = doc(db, "users", userId, "config", "subscription");
    const docSnap = await getDoc(subDocRef);
    if (docSnap.exists()) {
      return calculateSubscription(docSnap.data(), userCreationTime, userEmail);
    }
    const now = new Date();
    const trialStart = userCreationTime ? new Date(userCreationTime) : now;
    const trialEnd = new Date(trialStart.getTime() + 60 * 24 * 60 * 60 * 1000);
    const initialData = {
      status: "trial",
      trialStartDate: trialStart.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      plan: "free_trial",
      createdAt: serverTimestamp()
    };
    await setDoc(subDocRef, initialData, { merge: true });
    return calculateSubscription(initialData, userCreationTime, userEmail);
  } catch (err) {
    console.error("Error al obtener suscripción:", err);
    return calculateSubscription({}, userCreationTime, userEmail);
  }
}
