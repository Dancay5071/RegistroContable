import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success", duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-container-custom">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`toast-custom toast-${t.type} fade-in`}
            role="alert"
          >
            <div className="d-flex align-items-center gap-2">
              {t.type === "success" && <i className="bi bi-check-circle-fill text-success fs-5"></i>}
              {t.type === "error" && <i className="bi bi-x-circle-fill text-danger fs-5"></i>}
              {t.type === "warning" && <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>}
              {t.type === "info" && <i className="bi bi-info-circle-fill text-info fs-5"></i>}
              <span className="toast-message">{t.message}</span>
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white ms-auto"
              onClick={() => removeToast(t.id)}
              aria-label="Cerrar"
            ></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe ser usado dentro de un ToastProvider");
  }
  return context;
}

