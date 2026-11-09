import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const PrivacyContext = createContext();

export function PrivacyProvider({ children }) {
  const [isPrivate, setIsPrivate] = useState(() => {
    try {
      return localStorage.getItem("fintrack_privacy_mode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("fintrack_privacy_mode", isPrivate ? "true" : "false");
    } catch (e) {
      console.warn("No se pudo guardar la preferencia de privacidad:", e);
    }

    if (isPrivate) {
      document.documentElement.setAttribute("data-privacy", "true");
    } else {
      document.documentElement.removeAttribute("data-privacy");
    }
  }, [isPrivate]);

  const togglePrivacy = useCallback(() => {
    setIsPrivate((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        togglePrivacy();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePrivacy]);

  const maskAmount = useCallback((formattedText) => {
    if (!isPrivate) return formattedText;
    return "••••••";
  }, [isPrivate]);

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy, maskAmount }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error("usePrivacy debe usarse dentro de un PrivacyProvider");
  }
  return context;
}

