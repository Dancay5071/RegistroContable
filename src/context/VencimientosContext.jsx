import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { useQuickMovement } from "./QuickMovementContext";
import { getDemoGastosPendientes, pagarDemoGasto } from "../services/demoData";
import { listenGastosPendientesUser, pagarGastoPendienteUser } from "../services/dbService";
import { logActivity } from "../services/auditService";
import { getDiasRestantes, formatoMoneda } from "../utils/formatters";

const VencimientosContext = createContext(null);

export function VencimientosProvider({ children }) {
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const { movementCounter, notifyMovementSaved } = useQuickMovement();

  const [vencimientos, setVencimientos] = useState([]);
  const [loadingVencimientos, setLoadingVencimientos] = useState(false);
  const [isVencimientosModalOpen, setIsVencimientosModalOpen] = useState(false);

  const cargarVencimientos = useCallback(() => {
    if (!user) {
      setVencimientos([]);
      return;
    }

    if (isDemo) {
      const demoItems = getDemoGastosPendientes();
      setVencimientos(demoItems);
    }
  }, [user, isDemo]);

  useEffect(() => {
    if (!user) {
      setVencimientos([]);
      return;
    }

    if (isDemo) {
      cargarVencimientos();
      const handleStoreUpdate = () => cargarVencimientos();
      window.addEventListener("demo-store-updated", handleStoreUpdate);
      return () => window.removeEventListener("demo-store-updated", handleStoreUpdate);
    } else {
      setLoadingVencimientos(true);
      const unsubscribe = listenGastosPendientesUser(user.uid, (items) => {
        setVencimientos(items || []);
        setLoadingVencimientos(false);
      });
      return () => unsubscribe();
    }
  }, [user, isDemo, movementCounter, cargarVencimientos]);

  const vencimientosOrdenados = useMemo(() => {
    return [...vencimientos].sort((a, b) => {
      const diasA = getDiasRestantes(a.fechaVencimiento);
      const diasB = getDiasRestantes(b.fechaVencimiento);
      if (diasA === null && diasB === null) return 0;
      if (diasA === null) return 1;
      if (diasB === null) return -1;
      return diasA - diasB;
    });
  }, [vencimientos]);

  const { vencidos, porVencer, futuros, totalPendiente, totalVencido, totalPorVencer } = useMemo(() => {
    const vList = [];
    const pvList = [];
    const fList = [];
    let tPend = 0;
    let tVenc = 0;
    let tPV = 0;

    vencimientosOrdenados.forEach((g) => {
      const monto = Number(g.monto || 0);
      tPend += monto;
      const dias = getDiasRestantes(g.fechaVencimiento);

      if (dias === null) {
        pvList.push(g);
        tPV += monto;
      } else if (dias < 0) {
        vList.push(g);
        tVenc += monto;
      } else if (dias <= 7) {
        pvList.push(g);
        tPV += monto;
      } else {
        fList.push(g);
      }
    });

    return {
      vencidos: vList,
      porVencer: pvList,
      futuros: fList,
      totalPendiente: tPend,
      totalVencido: tVenc,
      totalPorVencer: tPV
    };
  }, [vencimientosOrdenados]);

  const marcarComoPagado = useCallback(async (gasto) => {
    if (!gasto) return;

    try {
      if (isDemo) {
        pagarDemoGasto(gasto.mes, gasto.anio, gasto.index, gasto.id);
      } else {
        await pagarGastoPendienteUser(user.uid, gasto.id, gasto);
      }

      await logActivity(user?.uid, isDemo, {
        action: "PAGO_VENCIMIENTO",
        category: "GASTOS",
        details: `Vencimiento pagado: ${gasto.descripcion} (${gasto.categoria || 'Servicio'})`,
        amount: gasto.monto,
        currency: "ARS"
      });

      showToast(`¡Pago registrado con éxito! ${formatoMoneda(gasto.monto)} descontado del disponible.`, "success");
      if (notifyMovementSaved) notifyMovementSaved();
      if (isDemo) cargarVencimientos();
    } catch (err) {
      console.error("Error al marcar gasto como pagado:", err);
      showToast("Error al registrar el pago: " + err.message, "error");
    }
  }, [user, isDemo, showToast, notifyMovementSaved, cargarVencimientos]);

  const openVencimientosModal = useCallback(() => setIsVencimientosModalOpen(true), []);
  const closeVencimientosModal = useCallback(() => setIsVencimientosModalOpen(false), []);

  const value = {
    vencimientos: vencimientosOrdenados,
    vencidos,
    porVencer,
    futuros,
    totalPendiente,
    totalVencido,
    totalPorVencer,
    totalAlertas: vencidos.length + porVencer.length,
    loadingVencimientos,
    isVencimientosModalOpen,
    openVencimientosModal,
    closeVencimientosModal,
    marcarComoPagado,
    recargarVencimientos: cargarVencimientos
  };

  return (
    <VencimientosContext.Provider value={value}>
      {children}
    </VencimientosContext.Provider>
  );
}

export function useVencimientos() {
  const ctx = useContext(VencimientosContext);
  if (!ctx) {
    throw new Error("useVencimientos debe ser utilizado dentro de un VencimientosProvider");
  }
  return ctx;
}
