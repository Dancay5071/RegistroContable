import React, { useRef, useState } from "react";
import { useTheme, THEMES, BACKGROUNDS } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

export default function CustomizeModal() {
  const {
    theme,
    setTheme,
    bgType,
    setBgType,
    customBg,
    setCustomBg,
    resetAppearance,
    isCustomizeModalOpen,
    closeCustomizeModal
  } = useTheme();

  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [processingImage, setProcessingImage] = useState(false);

  if (!isCustomizeModalOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Por favor selecciona un archivo de imagen válido.", "warning");
      return;
    }

    setProcessingImage(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 1000;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setCustomBg(compressedDataUrl);
        setProcessingImage(false);
        showToast("Fondo personalizado aplicado con éxito.", "success");
      };
      img.src = event.target.result;
    };

    reader.onerror = () => {
      setProcessingImage(false);
      showToast("Error al leer la imagen seleccionada.", "error");
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveCustomBg = () => {
    setCustomBg("");
    setBgType("mesh");
    showToast("Imagen de fondo eliminada.", "info");
  };

  const handleReset = () => {
    resetAppearance();
    showToast("Apariencia restablecida a los valores por defecto.", "info");
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      role="dialog" 
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className="modal-header border-bottom pb-3">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded-circle bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-palette2 fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0 text-dark">Personalizar Apariencia</h5>
                <span className="text-muted small">Elige tu paleta favorita y el fondo que más te inspire</span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={closeCustomizeModal}
              aria-label="Cerrar"
            ></button>
          </div>

          <div className="modal-body p-4">
            <div className="mb-4">
              <label className="form-label small fw-bold text-uppercase text-muted tracking-wider d-block mb-3">
                1. Paleta de Colores
              </label>
              <div className="row g-2">
                {THEMES.map((t) => {
                  const isActive = theme === t.id;
                  return (
                    <div key={t.id} className="col-12 col-sm-6 col-md-4">
                      <button
                        type="button"
                        className={`btn w-100 p-3 rounded-3 text-start border d-flex flex-column justify-content-between h-100 transition-all ${
                          isActive ? "border-2 shadow-sm" : "border-1 opacity-85"
                        }`}
                        style={{
                          backgroundColor: t.fondo,
                          borderColor: isActive ? t.primario : "var(--border-subtle)",
                          boxShadow: isActive ? `0 0 0 2px ${t.primario}` : undefined
                        }}
                        onClick={() => setTheme(t.id)}
                      >
                        <div className="d-flex align-items-center justify-content-between w-100 mb-2">
                          <span 
                            className="fw-bold small" 
                            style={{ color: t.isDark ? "#ffffff" : "#1e293b" }}
                          >
                            {t.nombre}
                          </span>
                          {isActive && (
                            <span 
                              className="badge rounded-circle p-1 d-flex align-items-center justify-content-center"
                              style={{ backgroundColor: t.primario, color: "#ffffff", width: "20px", height: "20px" }}
                            >
                              <i className="bi bi-check" style={{ fontSize: "0.85rem" }}></i>
                            </span>
                          )}
                        </div>

                        <div className="d-flex align-items-center gap-1 mt-auto">
                          <span className="rounded-circle" style={{ width: "16px", height: "16px", backgroundColor: t.primario }} title="Primario"></span>
                          <span className="rounded-circle" style={{ width: "16px", height: "16px", backgroundColor: t.acento }} title="Acento"></span>
                          <span className="rounded-circle border" style={{ width: "16px", height: "16px", backgroundColor: t.fondo }} title="Fondo"></span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="my-4 opacity-25" />

            <div>
              <label className="form-label small fw-bold text-uppercase text-muted tracking-wider d-block mb-3">
                2. Estilo de Fondo
              </label>

              <div className="row g-2 mb-3">
                {BACKGROUNDS.map((b) => {
                  const isActive = bgType === b.id;
                  return (
                    <div key={b.id} className="col-6 col-md-3">
                      <button
                        type="button"
                        className={`btn w-100 p-2 p-md-3 rounded-3 text-center d-flex flex-column align-items-center justify-content-center h-100 ${
                          isActive 
                            ? "btn-outline-primary border-2 fw-bold shadow-sm" 
                            : "btn-outline-secondary opacity-75"
                        }`}
                        onClick={() => setBgType(b.id)}
                      >
                        <i className={`bi ${b.icon} fs-4 mb-1`}></i>
                        <span className="small">{b.nombre}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {bgType === "custom" && (
                <div className="p-3 rounded-3 border mt-3 fade-in" style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-subtle)" }}>
                  <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                    <div>
                      <h6 className="fw-bold mb-1 small text-dark">Subir imagen desde tu dispositivo</h6>
                      <p className="text-muted small mb-0">
                        Se aplica un filtro protector inteligente para que los números siempre sean 100% legibles.
                      </p>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="d-none" 
                      />
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm fw-semibold shadow-sm d-flex align-items-center gap-1"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={processingImage}
                      >
                        <i className="bi bi-upload"></i>
                        <span>{processingImage ? "Procesando..." : "Elegir foto"}</span>
                      </button>

                      {customBg && (
                        <button 
                          type="button" 
                          className="btn btn-outline-danger btn-sm"
                          onClick={handleRemoveCustomBg}
                          title="Quitar foto y usar gradiente"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  {customBg && (
                    <div className="mt-3 d-flex align-items-center gap-3">
                      <div 
                        className="rounded-3 border shadow-sm" 
                        style={{ 
                          width: "90px", 
                          height: "56px", 
                          backgroundImage: `url('${customBg}')`,
                          backgroundSize: "cover",
                          backgroundPosition: "center"
                        }}
                      ></div>
                      <span className="text-success small fw-semibold">
                        <i className="bi bi-check-circle-fill me-1"></i> Imagen activa y optimizada
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer border-top d-flex justify-content-between">
            <button 
              type="button" 
              className="btn btn-link text-muted p-0 small text-decoration-none"
              onClick={handleReset}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Restablecer por defecto
            </button>
            <button 
              type="button" 
              className="btn btn-primary px-4 fw-semibold shadow-sm"
              onClick={closeCustomizeModal}
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

