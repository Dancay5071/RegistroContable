// src/components/LoginModal.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login, loginAsDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      setEmail("");
      setPassword("");
      closeLoginModal();
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      let mensaje = "Error al iniciar sesión.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        mensaje = "Credenciales incorrectas. Verifica tu email y contraseña.";
      } else if (err.code === "auth/invalid-email") {
        mensaje = "El correo electrónico no es válido.";
      } else if (err.message) {
        mensaje = err.message;
      }
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    closeLoginModal();
  };

  return (
    <>
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        role="dialog" 
        aria-labelledby="loginModalLabel" 
        aria-modal="true"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content text-dark shadow-lg">
            <div className="modal-header">
              <h5 className="modal-title" id="loginModalLabel">Iniciar Sesión</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={closeLoginModal} 
                aria-label="Cerrar"
                disabled={loading}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                <div className="mb-3">
                  <label htmlFor="modalEmail" className="form-label">
                    Correo Electrónico
                  </label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="modalEmail" 
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="modalPassword" className="form-label">
                    Contraseña
                  </label>
                  <input 
                    type="password" 
                    className="form-control" 
                    id="modalPassword" 
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="d-grid gap-2 mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-outline-success" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Iniciando...
                      </>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </button>
                </div>

                <hr className="my-3" />

                <div className="text-center">
                  <p className="small text-muted mb-2">¿Quieres explorar la aplicación sin registrarte?</p>
                  <button 
                    type="button" 
                    className="btn btn-warning w-100 fw-semibold"
                    onClick={handleDemoLogin}
                  >
                    <i className="bi bi-rocket-takeoff-fill me-2"></i>
                    Ingresar en Modo Demo
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={closeLoginModal}
                  disabled={loading}
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
