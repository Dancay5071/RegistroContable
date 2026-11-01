// src/context/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export const THEMES = [
  { 
    id: "pastel", 
    nombre: "Pastel Cálido", 
    primario: "#246845", 
    fondo: "#f5f1e8", 
    acento: "#c46d03", 
    preview: "linear-gradient(135deg, #f5f1e8 0%, #e8dfcf 100%)",
    isDark: false 
  },
  { 
    id: "dark", 
    nombre: "Dark FinTech", 
    primario: "#10b981", 
    fondo: "#0b0f19", 
    acento: "#fbbf24", 
    preview: "linear-gradient(135deg, #0b0f19 0%, #1e293b 100%)",
    isDark: true 
  },
  { 
    id: "mint", 
    nombre: "Menta Nórdica", 
    primario: "#059669", 
    fondo: "#edf6f1", 
    acento: "#0d9488", 
    preview: "linear-gradient(135deg, #edf6f1 0%, #d1e7dd 100%)",
    isDark: false 
  },
  { 
    id: "ocean", 
    nombre: "Océano Azul", 
    primario: "#0284c7", 
    fondo: "#edf3f8", 
    acento: "#15803d", 
    preview: "linear-gradient(135deg, #edf3f8 0%, #cfe2ff 100%)",
    isDark: false 
  },
  { 
    id: "lavender", 
    nombre: "Lavanda Moderna", 
    primario: "#7c3aed", 
    fondo: "#f3f0f9", 
    acento: "#16a34a", 
    preview: "linear-gradient(135deg, #f3f0f9 0%, #e2d9f3 100%)",
    isDark: false 
  }
];

export const BACKGROUNDS = [
  { id: "mesh", nombre: "Gradiente Mesh", desc: "Suave y dinámico en 4 esquinas", icon: "bi-circle-half" },
  { id: "dots", nombre: "Puntos Sutiles", desc: "Textura geométrica fintech", icon: "bi-grid-3x3-gap" },
  { id: "solid", nombre: "Liso Minimalista", desc: "Color puro sin degradados", icon: "bi-square" },
  { id: "custom", nombre: "Foto Personalizada", desc: "Sube tu propia imagen con filtro protector", icon: "bi-image" }
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("fintrack_theme") || "pastel";
  });

  const [bgType, setBgTypeState] = useState(() => {
    return localStorage.getItem("fintrack_bg_type") || "mesh";
  });

  const [customBg, setCustomBgState] = useState(() => {
    return localStorage.getItem("fintrack_custom_bg") || "";
  });

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  // Sincronizar atributos en el elemento <html> y variables CSS en tiempo real
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-bg", bgType);

    if (bgType === "custom" && customBg) {
      root.style.setProperty("--custom-bg-image", `url('${customBg}')`);
    } else {
      root.style.removeProperty("--custom-bg-image");
    }
  }, [theme, bgType, customBg]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("fintrack_theme", newTheme);
  };

  const setBgType = (newBgType) => {
    setBgTypeState(newBgType);
    localStorage.setItem("fintrack_bg_type", newBgType);
  };

  const setCustomBg = (dataUrl) => {
    setCustomBgState(dataUrl);
    setBgTypeState("custom");
    localStorage.setItem("fintrack_bg_type", "custom");
    if (dataUrl) {
      try {
        localStorage.setItem("fintrack_custom_bg", dataUrl);
      } catch (e) {
        console.warn("No se pudo persistir la imagen en localStorage por tamaño:", e);
      }
    } else {
      localStorage.removeItem("fintrack_custom_bg");
    }
  };

  const resetAppearance = () => {
    setTheme("pastel");
    setBgType("mesh");
    setCustomBg("");
  };

  const openCustomizeModal = () => setIsCustomizeModalOpen(true);
  const closeCustomizeModal = () => setIsCustomizeModalOpen(false);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        bgType,
        setBgType,
        customBg,
        setCustomBg,
        resetAppearance,
        isCustomizeModalOpen,
        openCustomizeModal,
        closeCustomizeModal
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  }
  return context;
}

