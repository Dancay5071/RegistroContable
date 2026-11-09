import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";

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
  const timerRef = useRef(null);

  const lockScreen = useCallback(() => {
    if (!user) return;
    setIsLocked(true);
    try {
      sessionStorage.setItem("fintrack_screen_locked", "true");
    } catch (e) {
      console.warn("Error al guardar estado de bloqueo:", e);
    }
  }, [user]);

  const unlockScreen = useCallback((inputPinOrPass) => {
    if (!inputPinOrPass) return false;

    if (quickPin && inputPinOrPass === quickPin) {
      setIsLocked(false);
      sessionStorage.removeItem("fintrack_screen_locked");
      return true;
    }

    if (!quickPin && (inputPinOrPass.length >= 4 || isDemo)) {
      setIsLocked(false);
      sessionStorage.removeItem("fintrack_screen_locked");
      return true;
    }

    return false;
  }, [quickPin, isDemo]);

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
        confirmModalConfig
      }}
    >
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
