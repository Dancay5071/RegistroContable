import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { logActivity } from "../services/auditService";

const SecurityContext = createContext(null);

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

export function SecurityProvider({ children }) {
  const { user, isDemo, logout } = useAuth();
  const [isLocked, setIsLocked] = useState(() => {
    try {
      return sessionStorage.getItem("fintrack_screen_locked") === "true";
    } catch {
      return false;
    }
  });

  const [quickPin, setQuickPinState] = useState(() => {
    try {
      return localStorage.getItem("fintrack_security_pin") || "";
    } catch {
      return "";
    }
  });

  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [tabShieldEnabled, setTabShieldState] = useState(() => {
    try {
      return localStorage.getItem("fintrack_tab_shield") !== "false";
    } catch {
      return true;
    }
  });
  const [isTabHidden, setIsTabHidden] = useState(false);
  const timerRef = useRef(null);

  const setTabShieldEnabled = useCallback((enabled) => {
    setTabShieldState(enabled);
    try {
      localStorage.setItem("fintrack_tab_shield", enabled ? "true" : "false");
    } catch (e) {
      console.warn("Error al guardar preferencia de escudo de pestaña:", e);
    }
  }, []);

  useEffect(() => {
    if (!tabShieldEnabled || !user) {
      setIsTabHidden(false);
      return;
    }

    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [tabShieldEnabled, user]);

  const openAuditModal = useCallback(() => setIsAuditModalOpen(true), []);
  const closeAuditModal = useCallback(() => setIsAuditModalOpen(false), []);

  const lockScreen = useCallback(() => {
    if (!user) return;
    setIsLocked(true);
    try {
      sessionStorage.setItem("fintrack_screen_locked", "true");
      logActivity(user?.uid, isDemo, {
        action: "BLOQUEO_PANTALLA",
        category: "SEGURIDAD",
        details: "Pantalla bloqueada por seguridad"
      });
    } catch (e) {
      console.warn("Error al guardar estado de bloqueo:", e);
    }
  }, [user, isDemo]);

  const unlockScreen = useCallback((inputPinOrPass) => {
    if (!inputPinOrPass) return false;

    if (quickPin && inputPinOrPass === quickPin) {
      setIsLocked(false);
      sessionStorage.removeItem("fintrack_screen_locked");
      logActivity(user?.uid, isDemo, {
        action: "DESBLOQUEO_PANTALLA",
        category: "SEGURIDAD",
        details: "Pantalla desbloqueada con PIN"
      });
      return true;
    }

    if (!quickPin && (inputPinOrPass.length >= 4 || isDemo)) {
      setIsLocked(false);
      sessionStorage.removeItem("fintrack_screen_locked");
      logActivity(user?.uid, isDemo, {
        action: "DESBLOQUEO_PANTALLA",
        category: "SEGURIDAD",
        details: "Pantalla desbloqueada correctamente"
      });
      return true;
    }

    return false;
  }, [quickPin, isDemo, user]);

  const setQuickPin = useCallback((pin) => {
    setQuickPinState(pin);
    try {
      if (pin) {
        localStorage.setItem("fintrack_security_pin", pin);
      } else {
        localStorage.removeItem("fintrack_security_pin");
      }
    } catch (e) {
      console.warn("Error al guardar PIN:", e);
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!user || isLocked) return;

    timerRef.current = setTimeout(() => {
      lockScreen();
    }, INACTIVITY_TIMEOUT_MS);
  }, [user, isLocked, lockScreen]);

  useEffect(() => {
    if (!user || isLocked) return;

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    const handleActivity = () => resetInactivityTimer();

    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));
    resetInactivityTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, [user, isLocked, resetInactivityTimer]);

  const requestConfirmation = useCallback(({ title, message, impact, confirmText = "Confirmar", danger = true, onConfirm }) => {
    setConfirmModalConfig({
      title,
      message,
      impact,
      confirmText,
      danger,
      onConfirm
    });
  }, []);

  const closeConfirmation = useCallback(() => {
    setConfirmModalConfig(null);
  }, []);

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        lockScreen,
        unlockScreen,
        quickPin,
        setQuickPin,
        requestConfirmation,
        closeConfirmation,
        confirmModalConfig,
        isAuditModalOpen,
        openAuditModal,
        closeAuditModal,
        tabShieldEnabled,
        setTabShieldEnabled,
        isTabHidden
      }}
    >
      {isTabHidden && tabShieldEnabled && user && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100" 
          style={{
            zIndex: 99998,
            backgroundColor: "rgba(15, 23, 42, 0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)"
          }}
        />
      )}
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error("useSecurity debe usarse dentro de un SecurityProvider");
  }
  return context;
}
