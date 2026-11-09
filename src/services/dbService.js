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

export async function addGastoUser(userId, { mes, anio, descripcion, monto, categoria = "Otros" }) {
  const clave = `${mes}_${anio}`;
  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  const docRef = await addDoc(transaccionesRef, {
    tipo: "gasto",
    descripcion: descripcion.trim(),
    categoria: categoria || "Otros",
    monto: Number(monto),
    mes,
    anio: Number(anio),
    claveMesAnio: clave,
    createdAt: serverTimestamp()
  });

  await setDoc(balancesRef, {
    montoActual: increment(-monto)
  }, { merge: true });

  await setDoc(resumenRef, {
    totalGastos: increment(monto)
  }, { merge: true });

  return docRef.id;
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

  return items;
}

export async function updateGastoUser(userId, id, { mes, anio, descripcion, monto, montoAnterior, categoria }) {
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
      montoActual: increment(-diferencia)
    });
    await updateDoc(resumenRef, {
      totalGastos: increment(diferencia)
    });
  }
}

export async function deleteGastoUser(userId, id, { mes, anio, monto }) {
  const clave = `${mes}_${anio}`;
  const transaccionRef = doc(db, "users", userId, "transacciones", id);
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  await deleteDoc(transaccionRef);

  await updateDoc(balancesRef, {
    montoActual: increment(Number(monto))
  });

  await updateDoc(resumenRef, {
    totalGastos: increment(-Number(monto))
  });
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
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
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
