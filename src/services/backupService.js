import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";
import { getDemoStore, saveDemoStore } from "./demoData";
import { logActivity } from "./auditService";

function calculateChecksum(dataStr) {
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export async function createFullBackup(user, isDemo) {
  let balances = { montoActual: 0, totalAhorros: 0, totalAhorrosUSD: 0, totalAhorrosEUR: 0 };
  let transacciones = [];
  let resumenesMensuales = {};

  if (isDemo || !user) {
    const demo = getDemoStore();
    balances = {
      montoActual: Number(demo.balances?.montoActual || 0),
      totalAhorros: Number(demo.balances?.totalAhorros || 0),
      totalAhorrosUSD: Number(demo.balances?.totalAhorrosUSD || 0),
      totalAhorrosEUR: Number(demo.balances?.totalAhorrosEUR || 0)
    };

    Object.entries(demo.gastosPorMes || {}).forEach(([clave, lista]) => {
      const [mes, anioStr] = clave.split("_");
      lista.forEach((g, idx) => {
        transacciones.push({
          id: `demo_gasto_${clave}_${idx}`,
          tipo: "gasto",
          descripcion: g.descripcion,
          monto: Number(g.monto),
          categoria: g.categoria || "Otros",
          mes,
          anio: Number(anioStr),
          claveMesAnio: clave,
          fecha: g.fecha || new Date().toISOString()
        });
      });
    });

    Object.entries(demo.ingresosPorMes || {}).forEach(([clave, lista]) => {
      const [mes, anioStr] = clave.split("_");
      lista.forEach((ing, idx) => {
        transacciones.push({
          id: `demo_ingreso_${clave}_${idx}`,
          tipo: "ingreso",
          descripcion: ing.descripcion,
          monto: Number(ing.monto),
          ahorro: Number(ing.ahorro || 0),
          categoria: ing.categoria || "Sueldo",
          mes,
          anio: Number(anioStr),
          claveMesAnio: clave,
          fecha: ing.fecha || new Date().toISOString()
        });
      });
    });

    (demo.ahorrosDetallados || []).forEach((aho, idx) => {
      transacciones.push({
        id: aho.id || `demo_aho_${idx}`,
        tipo: aho.tipo || "ahorro",
        descripcion: aho.descripcion || "Ahorro",
        monto: Number(aho.monto),
        moneda: aho.moneda || "ARS",
        categoria: aho.categoria || "Emergencia",
        mes: aho.mes,
        anio: Number(aho.anio),
        claveMesAnio: `${aho.mes}_${aho.anio}`,
        fecha: aho.fecha || new Date().toISOString()
      });
    });
  } else {
    const balancesRef = doc(db, "users", user.uid, "config", "balances");
    const balSnap = await getDoc(balancesRef);
    if (balSnap.exists()) {
      balances = balSnap.data();
    }

    const transRef = collection(db, "users", user.uid, "transacciones");
    const transSnap = await getDocs(transRef);
    transSnap.forEach((d) => {
      const data = d.data();
      const cleanData = { ...data, id: d.id };
      if (cleanData.createdAt?.toDate) {
        cleanData.fecha = cleanData.createdAt.toDate().toISOString();
        delete cleanData.createdAt;
      }
      if (cleanData.updatedAt?.toDate) {
        cleanData.updatedAt = cleanData.updatedAt.toDate().toISOString();
      }
      transacciones.push(cleanData);
    });

    const resRef = collection(db, "users", user.uid, "resumenesMensuales");
    const resSnap = await getDocs(resRef);
    resSnap.forEach((d) => {
      resumenesMensuales[d.id] = d.data();
    });
  }

  const userEmail = user?.email || (isDemo ? "demo@fintrack.app" : "usuario@fintrack.app");
  const now = new Date();
  const dateStr = now.toISOString();

  const backupData = {
    app: "FinTrack",
    version: "1.0",
    createdAt: dateStr,
    user: userEmail,
    stats: {
      totalTransacciones: transacciones.length,
      gastosCount: transacciones.filter((t) => t.tipo === "gasto").length,
      ingresosCount: transacciones.filter((t) => t.tipo === "ingreso").length,
      ahorrosCount: transacciones.filter((t) => t.tipo === "ahorro" || t.tipo === "extraccion").length
    },
    balances,
    transacciones,
    resumenesMensuales
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  backupData.checksum = calculateChecksum(jsonString);

  await logActivity(user?.uid, isDemo, {
    action: "EXPORTAR_RESPALDO",
    category: "RESPALDOS",
    details: `Copia de seguridad generada (${transacciones.length} transacciones respaldadas)`
  });

  return {
    filename: `FinTrack_Backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.json`,
    jsonContent: JSON.stringify(backupData, null, 2),
    stats: backupData.stats,
    createdAt: dateStr
  };
}

export function downloadBackupFile(filename, jsonContent) {
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseAndValidateBackup(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== "object") {
      return { valid: false, error: "El archivo no contiene un objeto JSON válido." };
    }

    if (data.app !== "FinTrack") {
      return { valid: false, error: "El archivo seleccionado no es una copia de seguridad oficial de FinTrack." };
    }

    if (!data.balances || typeof data.balances !== "object") {
      return { valid: false, error: "Estructura de balances ausente o inválida en el respaldo." };
    }

    if (!Array.isArray(data.transacciones)) {
      return { valid: false, error: "Lista de transacciones ausente o corrupta." };
    }

    const gastos = data.transacciones.filter((t) => t.tipo === "gasto").length;
    const ingresos = data.transacciones.filter((t) => t.tipo === "ingreso").length;
    const ahorros = data.transacciones.filter((t) => t.tipo === "ahorro" || t.tipo === "extraccion").length;

    return {
      valid: true,
      stats: {
        total: data.transacciones.length,
        gastos,
        ingresos,
        ahorros,
        createdAt: data.createdAt || "Fecha desconocida",
        user: data.user || "Desconocido",
        balances: data.balances
      },
      data
    };
  } catch (err) {
    return { valid: false, error: `Error de sintaxis JSON: ${err.message}` };
  }
}

export async function restoreFullBackup(user, isDemo, backupData) {
  const { balances, transacciones, resumenesMensuales } = backupData;

  if (isDemo || !user) {
    const freshDemo = {
      balances: {
        montoActual: Number(balances.montoActual || 0),
        totalAhorros: Number(balances.totalAhorros || 0),
        totalAhorrosUSD: Number(balances.totalAhorrosUSD || 0),
        totalAhorrosEUR: Number(balances.totalAhorrosEUR || 0)
      },
      gastosPorMes: {},
      ingresosPorMes: {},
      ahorrosPorMes: {},
      extraccionPorMes: {},
      ahorrosDetallados: []
    };

    (transacciones || []).forEach((t) => {
      const clave = t.claveMesAnio || `${t.mes}_${t.anio}`;
      if (t.tipo === "gasto") {
        if (!freshDemo.gastosPorMes[clave]) freshDemo.gastosPorMes[clave] = [];
        freshDemo.gastosPorMes[clave].push({
          descripcion: t.descripcion,
          monto: Number(t.monto),
          categoria: t.categoria || "Otros",
          fecha: t.fecha || new Date().toISOString()
        });
      } else if (t.tipo === "ingreso") {
        if (!freshDemo.ingresosPorMes[clave]) freshDemo.ingresosPorMes[clave] = [];
        freshDemo.ingresosPorMes[clave].push({
          descripcion: t.descripcion,
          monto: Number(t.monto),
          ahorro: Number(t.ahorro || 0),
          categoria: t.categoria || "Sueldo",
          fecha: t.fecha || new Date().toISOString()
        });
      } else if (t.tipo === "ahorro" || t.tipo === "extraccion") {
        freshDemo.ahorrosDetallados.push({
          id: t.id || `aho_${Math.random()}`,
          tipo: t.tipo,
          monto: Number(t.monto),
          moneda: t.moneda || "ARS",
          categoria: t.categoria || "Emergencia",
          descripcion: t.descripcion || "",
          mes: t.mes,
          anio: Number(t.anio),
          fecha: t.fecha || new Date().toISOString()
        });
      }
    });

    saveDemoStore(freshDemo);
  } else {
    const userId = user.uid;
    const balancesRef = doc(db, "users", userId, "config", "balances");
    await setDoc(balancesRef, balances, { merge: false });

    const transRef = collection(db, "users", userId, "transacciones");
    const oldTransSnap = await getDocs(transRef);
    const deleteBatch = writeBatch(db);
    oldTransSnap.forEach((d) => {
      deleteBatch.delete(d.ref);
    });
    await deleteBatch.commit();

    const chunkSize = 400;
    for (let i = 0; i < transacciones.length; i += chunkSize) {
      const chunk = transacciones.slice(i, i + chunkSize);
      const insertBatch = writeBatch(db);
      chunk.forEach((t) => {
        const itemRef = doc(collection(db, "users", userId, "transacciones"));
        const { id, ...dataToSave } = t;
        insertBatch.set(itemRef, dataToSave);
      });
      await insertBatch.commit();
    }

    if (resumenesMensuales && typeof resumenesMensuales === "object") {
      const resBatch = writeBatch(db);
      Object.entries(resumenesMensuales).forEach(([clave, rData]) => {
        const rRef = doc(db, "users", userId, "resumenesMensuales", clave);
        resBatch.set(rRef, rData);
      });
      await resBatch.commit();
    }
  }

  await logActivity(user?.uid, isDemo, {
    action: "RESTAURAR_RESPALDO",
    category: "RESPALDOS",
    details: `Respaldo restaurado con éxito (${transacciones.length} registros aplicados)`
  });

  window.dispatchEvent(new CustomEvent("fintrack-backup-restored"));
}

