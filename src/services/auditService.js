import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { downloadCSV } from "../utils/exportUtils";

const LOCAL_STORAGE_KEY_DEMO = "fintrack_audit_logs_demo";

function getDeviceInfo() {
  try {
    const ua = navigator.userAgent;
    let browser = "Navegador Web";
    if (ua.includes("Firefox/")) browser = "Firefox";
    else if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome/")) browser = "Chrome";
    else if (ua.includes("Safari/")) browser = "Safari";

    let os = "Dispositivo";
    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    return `${browser} (${os})`;
  } catch {
    return "Dispositivo Web";
  }
}

function getLocalLogs(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLogs(key, logs) {
  try {
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.warn("Error al guardar logs de auditoría en localStorage:", e);
  }
}

export async function logActivity(userId, isDemo, { action, category = "GENERAL", details, amount = null, currency = "ARS" }) {
  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action,
    category,
    details: details || action,
    amount: amount !== null && amount !== undefined ? Number(amount) : null,
    currency,
    device: getDeviceInfo(),
    timestamp: new Date().toISOString()
  };

  const localKey = isDemo || !userId ? LOCAL_STORAGE_KEY_DEMO : `fintrack_audit_logs_${userId}`;
  const existingLocal = getLocalLogs(localKey);
  saveLocalLogs(localKey, [logEntry, ...existingLocal]);

  window.dispatchEvent(new CustomEvent("fintrack-audit-new", { detail: logEntry }));

  if (!isDemo && userId) {
    try {
      const auditRef = collection(db, "users", userId, "auditLog");
      await addDoc(auditRef, {
        ...logEntry,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("No se pudo sincronizar el log con Firestore:", err);
    }
  }

  return logEntry;
}

export async function getAuditLogs(userId, isDemo, limitCount = 60) {
  const localKey = isDemo || !userId ? LOCAL_STORAGE_KEY_DEMO : `fintrack_audit_logs_${userId}`;
  const localLogs = getLocalLogs(localKey);

  if (isDemo || !userId) {
    return localLogs.slice(0, limitCount);
  }

  try {
    const auditRef = collection(db, "users", userId, "auditLog");
    const q = query(auditRef, orderBy("createdAt", "desc"), limit(limitCount));
    const snap = await getDocs(q);

    if (snap.empty) {
      return localLogs.slice(0, limitCount);
    }

    const firestoreLogs = [];
    snap.forEach((d) => {
      const data = d.data();
      const isoDate = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.timestamp || new Date().toISOString());
      firestoreLogs.push({
        id: d.id,
        ...data,
        timestamp: isoDate
      });
    });

    saveLocalLogs(localKey, firestoreLogs);
    return firestoreLogs;
  } catch (err) {
    console.warn("Fallo al leer auditLog de Firestore, usando caché local:", err);
    return localLogs.slice(0, limitCount);
  }
}

export async function clearAuditLogs(userId, isDemo) {
  const localKey = isDemo || !userId ? LOCAL_STORAGE_KEY_DEMO : `fintrack_audit_logs_${userId}`;
  try {
    localStorage.removeItem(localKey);
  } catch {}

  if (!isDemo && userId) {
    try {
      const auditRef = collection(db, "users", userId, "auditLog");
      const snap = await getDocs(auditRef);
      const deletePromises = [];
      snap.forEach((d) => {
        deletePromises.push(deleteDoc(doc(db, "users", userId, "auditLog", d.id)));
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn("Error al vaciar logs en Firestore:", err);
    }
  }

  window.dispatchEvent(new CustomEvent("fintrack-audit-cleared"));
}

export function exportAuditLogsCSV(logs) {
  if (!logs || logs.length === 0) return;

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = ["Fecha y Hora", "Categoría", "Acción", "Detalles", "Monto", "Dispositivo"];
  const rows = logs.map((l) => {
    const fecha = l.timestamp ? new Date(l.timestamp).toLocaleString("es-AR") : "-";
    const montoStr = l.amount !== null && l.amount !== undefined ? `${l.amount} ${l.currency || 'ARS'}` : "-";
    return [
      escapeCSV(fecha),
      escapeCSV(l.category || "GENERAL"),
      escapeCSV(l.action || "-"),
      escapeCSV(l.details || "-"),
      escapeCSV(montoStr),
      escapeCSV(l.device || "-")
    ].join(",");
  });

  const csvContent = [headers.map(escapeCSV).join(","), ...rows].join("\r\n");
  const filename = `FinTrack_Auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(filename, csvContent);
}

