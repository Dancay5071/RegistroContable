// src/services/dbService.js
/**
 * Capa de Backend para Firestore con Aislamiento Multiusuario y Operaciones Atómicas.
 * Todos los datos se organizan bajo:
 *   users/{userId}/config/balances
 *   users/{userId}/transacciones/{transaccionId}
 *   users/{userId}/resumenesMensuales/{mes_anio}
 */

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

// 1. Escuchar saldos en tiempo real para el usuario autenticado
export function listenUserBalances(userId, callback) {
  if (!userId) return () => {};

  const balancesDoc = doc(db, "users", userId, "config", "balances");

  return onSnapshot(balancesDoc, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        montoActual: Number(data.montoActual || 0),
        totalAhorros: Number(data.totalAhorros || 0)
      });
    } else {
      // Si es un usuario nuevo, inicializar balances en 0
      setDoc(balancesDoc, { montoActual: 0, totalAhorros: 0 }, { merge: true });
      callback({ montoActual: 0, totalAhorros: 0 });
    }
  }, (error) => {
    console.error("Error al escuchar balances del usuario:", error);
    callback({ montoActual: 0, totalAhorros: 0 });
  });
}

// 2. Registrar nuevo Gasto
export async function addGastoUser(userId, { mes, anio, descripcion, monto, categoria = "Otros" }) {
  const clave = `${mes}_${anio}`;
  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  // 1. Guardar documento individual de la transacción
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

  // 2. Actualizar saldo disponible atómicamente con increment()
  await setDoc(balancesRef, {
    montoActual: increment(-monto)
  }, { merge: true });

  // 3. Actualizar resumen mensual agregado
  await setDoc(resumenRef, {
    totalGastos: increment(monto)
  }, { merge: true });

  return docRef.id;
}

// 3. Consultar Gastos del Mes
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

// 4. Editar Gasto
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

// 5. Eliminar Gasto
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

// 6. Registrar nuevo Ingreso
export async function addIngresoUser(userId, { mes, anio, descripcion, montoBruto, porcentajeAhorro, categoria = "Sueldo" }) {
  const clave = `${mes}_${anio}`;
  const ahorro = (Number(montoBruto) * Number(porcentajeAhorro)) / 100;
  const ingresoNeto = Number(montoBruto) - ahorro;

  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  const docRef = await addDoc(transaccionesRef, {
    tipo: "ingreso",
    descripcion: descripcion.trim(),
    categoria: categoria || "Sueldo",
    monto: ingresoNeto,
    montoBruto: Number(montoBruto),
    ahorro,
    porcentajeAhorro: Number(porcentajeAhorro),
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

// 7. Consultar Ingresos del Mes
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

// 8. Editar Ingreso
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

// 9. Eliminar Ingreso
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

// 10. Ahorros: Agregar Ahorro Directo
export async function addAhorroDirectoUser(userId, { mes, anio, monto }) {
  const clave = `${mes}_${anio}`;
  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  await addDoc(transaccionesRef, {
    tipo: "ahorro",
    monto: Number(monto),
    mes,
    anio: Number(anio),
    claveMesAnio: clave,
    createdAt: serverTimestamp()
  });

  await setDoc(balancesRef, {
    totalAhorros: increment(Number(monto))
  }, { merge: true });

  await setDoc(resumenRef, {
    totalAhorros: increment(Number(monto))
  }, { merge: true });
}

// 11. Ahorros: Extraer Ahorro
export async function addExtraccionUser(userId, { mes, anio, monto }) {
  const clave = `${mes}_${anio}`;
  const transaccionesRef = collection(db, "users", userId, "transacciones");
  const balancesRef = doc(db, "users", userId, "config", "balances");
  const resumenRef = doc(db, "users", userId, "resumenesMensuales", clave);

  await addDoc(transaccionesRef, {
    tipo: "extraccion",
    monto: Number(monto),
    mes,
    anio: Number(anio),
    claveMesAnio: clave,
    createdAt: serverTimestamp()
  });

  await setDoc(balancesRef, {
    totalAhorros: increment(-Number(monto))
  }, { merge: true });

  await setDoc(resumenRef, {
    totalExtracciones: increment(Number(monto))
  }, { merge: true });
}

// 12. Ahorros: Consultar Año
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

// 13. Resumen Anual Agregado
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

// 14. Obtener últimas transacciones combinadas (para el Dashboard)
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

