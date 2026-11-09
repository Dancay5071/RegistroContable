import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { logActivity } from "../services/auditService";
import FinTrackLogo from "./FinTrackLogo";

export default function LoginModal() {
  const { 
    isLoginModalOpen, 
    closeLoginModal, 
    login, 
    register, 
    loginWithGoogle, 
    resetPassword, 
    loginAsDemo 
  } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) clearInterval(timer);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  if (!isLoginModalOpen) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setError("");
    setSuccessMessage("");
    setMode("login");
  };

  const handleClose = () => {
    resetForm();
    closeLoginModal();
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score++;

    if (score <= 1) return { score: 25, label: "Débil (mín 6 caracteres)", color: "bg-danger" };
    if (score <= 3) return { score: 65, label: "Moderada (añade números o mayúsculas)", color: "bg-warning" };
    return { score: 100, label: "Fuerte y Segura", color: "bg-success" };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        const userCred = await login(email, password);
        setFailedAttempts(0);
        await logActivity(userCred?.user?.uid, false, {
          action: "INICIO_SESION",
          category: "SEGURIDAD",
          details: `Inicio de sesión exitoso (${email})`
        });
        handleClose();
      } else if (mode === "register") {
        if (password !== confirmPassword) {
          setError("Las contraseñas no coinciden.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("La contraseña debe tener al menos 6 caracteres.");
          setLoading(false);
          return;
        }
        const userCred = await register(email, password);
        await logActivity(userCred?.user?.uid, false, {
          action: "REGISTRO_USUARIO",
          category: "SEGURIDAD",
          details: `Cuenta registrada exitosamente (${email})`
        });
        handleClose();
      } else if (mode === "forgot") {
        await resetPassword(email);
        setSuccessMessage("Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error de autenticación:", err);
      let mensaje = "Ocurrió un error inesperado.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 4) {
          setLockoutSeconds(30);
          mensaje = "Demasiados intentos fallidos consecutivos. Por seguridad, espera 30 segundos para volver a intentar.";
        } else {
          mensaje = `Credenciales incorrectas. Intento ${nextAttempts} de 4 antes del bloqueo temporal.`;
        }
      } else if (err.code === "auth/email-already-in-use") {
        mensaje = "Este correo electrónico ya está registrado.";
      } else if (err.code === "auth/invalid-email") {
        mensaje = "El correo electrónico no es válido.";
      } else if (err.code === "auth/weak-password") {
        mensaje = "La contraseña es muy débil. Debe tener al menos 6 caracteres.";
      } else if (err.message) {
        mensaje = err.message;
      }
      setError(mensaje);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const userCred = await loginWithGoogle();
      await logActivity(userCred?.user?.uid, false, {
        action: "INICIO_SESION_GOOGLE",
        category: "SEGURIDAD",
        details: "Inicio de sesión exitoso con cuenta Google"
      });
      handleClose();
    } catch (err) {
      console.error("Error con Google:", err);
      const errStr = `${err?.code || ""} ${err?.message || ""}`.toLowerCase();
      if (errStr.includes("operation-not-allowed")) {
        setError("El inicio de sesión con Google aún no está habilitado en tu Firebase Console. Debes ir a Firebase Console > Authentication > Sign-in method y habilitar 'Google'. Mientras tanto, puedes crear una cuenta con correo y contraseña o explorar en Modo Demo.");
      } else if (err?.code === "auth/popup-closed-by-user") {
      } else {
        setError("Error al iniciar sesión con Google: " + (err?.message || err));
      }
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    logActivity(null, true, {
      action: "LOGIN_DEMO",
      category: "SEGURIDAD",
      details: "Exploración de la aplicación en Modo Demo"
    });
    loginAsDemo();
    handleClose();
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      role="dialog" 
      aria-labelledby="loginModalLabel" 
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content text-dark shadow-lg border-0">
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2" id="loginModalLabel">
              <FinTrackLogo size={26} showText={false} />
              <span>
                {mode === "login" && "Iniciar Sesión en FinTrack"}
                {mode === "register" && "Crear Cuenta en FinTrack"}
                {mode === "forgot" && "Recuperar Contraseña"}
              </span>
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose} 
              aria-label="Cerrar"
              disabled={loading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body pt-3">
              {mode !== "forgot" && (
                <>
                  <button 
                    type="button" 
                    className="btn btn-outline-dark w-100 mb-3 d-flex align-items-center justify-content-center gap-2 py-2 shadow-sm bg-white"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continuar con Google</span>
                  </button>

                  <div className="d-flex align-items-center my-3">
                    <hr className="flex-grow-1" />
                    <span className="px-2 text-muted small">o con correo</span>
                    <hr className="flex-grow-1" />
                  </div>
                </>
              )}

              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="alert alert-success py-2 small" role="alert">
                  {successMessage}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label small fw-semibold">Correo Electrónico</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {mode !== "forgot" && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label small fw-semibold">Contraseña</label>
                    {mode === "login" && (
                      <button 
                        type="button" 
                        className="btn btn-link p-0 small text-decoration-none"
                        onClick={() => { setError(""); setMode("forgot"); }}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="input-group">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="form-control" 
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading || lockoutSeconds > 0}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Ocultar" : "Mostrar"}
                      tabIndex="-1"
                    >
                      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                  </div>

                  {mode === "register" && password.length > 0 && (
                    <div className="mt-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted" style={{ fontSize: "0.72rem" }}>Seguridad de contraseña:</span>
                        <span className="small fw-semibold" style={{ fontSize: "0.72rem" }}>
                          {getPasswordStrength(password).label}
                        </span>
                      </div>
                      <div className="progress" style={{ height: "4px" }}>
                        <div 
                          className={`progress-bar ${getPasswordStrength(password).color}`} 
                          role="progressbar" 
                          style={{ width: `${getPasswordStrength(password).score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === "register" && (
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Confirmar Contraseña</label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="form-control" 
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading || lockoutSeconds > 0}
                  />
                </div>
              )}

              <div className="d-grid gap-2 mt-4">
                <button 
                  type="submit" 
                  className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-success'} fw-semibold`}
                  disabled={loading || lockoutSeconds > 0}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Procesando...
                    </>
                  ) : lockoutSeconds > 0 ? (
                    `Bloqueo de seguridad (${lockoutSeconds}s)`
                  ) : (
                    mode === "login" ? "Iniciar Sesión" :
                    mode === "register" ? "Crear Cuenta" :
                    "Enviar enlace de recuperación"
                  )}
                </button>
              </div>

              <div className="text-center mt-3">
                {mode === "login" ? (
                  <p className="small mb-0 text-muted">
                    ¿No tienes una cuenta?{" "}
                    <button 
                      type="button" 
                      className="btn btn-link p-0 small fw-bold text-decoration-none"
                      onClick={() => { setError(""); setMode("register"); }}
                    >
                      Regístrate gratis
                    </button>
                  </p>
                ) : (
                  <p className="small mb-0 text-muted">
                    ¿Ya tienes cuenta?{" "}
                    <button 
                      type="button" 
                      className="btn btn-link p-0 small fw-bold text-decoration-none"
                      onClick={() => { setError(""); setMode("login"); }}
                    >
                      Inicia sesión
                    </button>
                  </p>
                )}
              </div>

              <hr className="my-3" />

              <div className="text-center">
                <button 
                  type="button" 
                  className="btn btn-warning btn-sm w-100 fw-semibold text-white shadow-sm"
                  onClick={handleDemoLogin}
                >
                  <i className="bi bi-eye me-1"></i>
                  Ingresar en Modo Demo (sin registrarse)
                </button>
              </div>
            </div>

            <div className="modal-footer border-top-0 pt-0">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={handleClose}
                disabled={loading}
              >
                Cerrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
