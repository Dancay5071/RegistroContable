import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { usePrivacy } from "../context/PrivacyContext";
import { useSecurity } from "../context/SecurityContext";
import { useVencimientos } from "../context/VencimientosContext";
import { usePowerBiExport } from "../context/PowerBiExportContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useCurrency } from "../context/CurrencyContext";
import { useDolar } from "../hooks/useDolar";
import { logActivity } from "../services/auditService";
import FinTrackLogo from "./FinTrackLogo";

export default function Navbar() {
  const { user, isDemo, logout } = useAuth();
  const { openCustomizeModal } = useTheme();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { lockScreen, openAuditModal } = useSecurity();
  const { blue, oficial, mep, refresh: refreshDolar } = useDolar();
  const { vencidos, porVencer, openVencimientosModal } = useVencimientos();
  const { openPowerBiExport } = usePowerBiExport();
  const { subscription, openSubscriptionModal } = useSubscription();
  const { monedaPrincipal, monedaInfo, openCurrencyModal } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logActivity(user?.uid, isDemo, {
        action: "CIERRE_SESION",
        category: "SEGURIDAD",
        details: "Cierre de sesión de usuario"
      });
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Hubo un problema al cerrar sesión.");
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    setUserMenuOpen(false);
  };

  const nombreUsuario = user?.displayName || (isDemo ? "Daniela" : (user?.email?.split("@")[0] || "Usuario"));
  const inicial = nombreUsuario.charAt(0).toUpperCase();
  const userPhoto = !isDemo ? user?.photoURL : null;
  const alertasCount = (vencidos?.length || 0) + (porVencer?.length || 0);
  const hasVencidos = (vencidos?.length || 0) > 0;

  return (
    <nav className="navbar navbar-expand-lg" id="navbar">
      <div className="container-fluid">
        <div className="d-flex align-items-center gap-1 gap-sm-2">
          <Link className="navbar-brand d-flex align-items-center me-1" to="/" onClick={closeMenu}>
            <FinTrackLogo size={30} showText={true} />
          </Link>

          {blue?.venta > 0 && (
            <button 
              type="button"
              className="navbar-dolar-pill d-flex align-items-center gap-1 gap-sm-2 text-nowrap"
              title={`Cotizaciones en tiempo real:\n• Dólar Blue: Compra $${blue.compra.toLocaleString('es-AR')} | Venta $${blue.venta.toLocaleString('es-AR')}\n• Dólar Oficial: Compra $${oficial.compra.toLocaleString('es-AR')} | Venta $${oficial.venta.toLocaleString('es-AR')}\n• MEP: $${mep.venta.toLocaleString('es-AR')}\n\nHaz clic para actualizar`}
              aria-label={`Cotización Dólar Blue: venta $${blue.venta.toLocaleString('es-AR')}. Presiona Enter para actualizar cotizaciones.`}
              onClick={() => refreshDolar()}
            >
              <span className="dot dot-dolar-pulse"></span>
              <span className="small fw-semibold text-muted d-none d-sm-inline">USD</span>
              <strong className="text-dolar-value">${blue.venta.toLocaleString("es-AR")}</strong>
            </button>
          )}

          <button
            type="button"
            className="navbar-dolar-pill d-none d-sm-flex align-items-center gap-1 border-0 shadow-sm text-nowrap"
            style={{ cursor: "pointer", background: "var(--bg-card)" }}
            onClick={openCurrencyModal}
            title={`Moneda principal: ${monedaInfo?.nombre}. Clic para cambiar divisas.`}
            aria-label={`Moneda principal: ${monedaInfo?.nombre}`}
          >
            <span>{monedaInfo?.flag}</span>
            <span className="small fw-bold text-dark">{monedaPrincipal}</span>
          </button>
        </div>

        <div className="d-flex align-items-center gap-1 gap-sm-2 ms-auto d-lg-none">
          <button
            type="button"
            className="navbar-dolar-pill d-flex d-sm-none align-items-center gap-1 border-0 shadow-sm text-nowrap py-1 px-2"
            style={{ cursor: "pointer", background: "var(--bg-card)", fontSize: "0.75rem" }}
            onClick={openCurrencyModal}
            title={`Moneda: ${monedaInfo?.nombre}`}
            aria-label={`Moneda: ${monedaInfo?.nombre}`}
          >
            <span>{monedaInfo?.flag}</span>
            <span className="fw-bold text-dark">{monedaPrincipal}</span>
          </button>

          <button
            className="btn btn-notification-bell d-flex align-items-center justify-content-center rounded-circle shadow-sm position-relative"
            type="button"
            onClick={openVencimientosModal}
            aria-label={alertasCount > 0 ? `${alertasCount} vencimientos pendientes` : "Sin vencimientos pendientes"}
            title={alertasCount > 0 ? `${alertasCount} vencimientos pendientes (Alt + V)` : "Sin vencimientos (Alt + V)"}
          >
            <i className={`bi ${alertasCount > 0 ? "bi-bell-fill" : "bi-bell"} ${hasVencidos ? "text-danger" : (alertasCount > 0 ? "text-warning" : "text-muted")}`}></i>
            {alertasCount > 0 && (
              <span className={`bell-badge-count ${hasVencidos ? 'bg-danger text-white bell-pulse-red' : 'bg-warning text-dark'}`}>
                {alertasCount}
              </span>
            )}
          </button>

          <button 
            className="navbar-toggler border-0 p-1" 
            type="button" 
            onClick={() => setIsOpen(!isOpen)}
            aria-controls="navbarSupportedContent" 
            aria-expanded={isOpen} 
            aria-label="Toggle navigation"
          >
            <i className={`bi ${isOpen ? "bi-x-lg" : "bi-list"} fs-2`}></i>
          </button>
        </div>

        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`} id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-1">
            <li className="nav-item">
              <NavLink className="nav-link" to="/gastos/consultar" onClick={closeMenu}>
                <i className="bi bi-arrow-down-circle text-danger me-1"></i> Gastos
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className="nav-link" to="/ingresos/consultar" onClick={closeMenu}>
                <i className="bi bi-arrow-up-circle text-success me-1"></i> Ingresos
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className="nav-link" to="/ahorros" onClick={closeMenu}>
                <i className="bi bi-piggy-bank me-1 text-warning"></i> Ahorros
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className="nav-link" to="/resumen" onClick={closeMenu}>
                <i className="bi bi-bar-chart-line me-1 text-primary"></i> Resumen
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className="nav-link" to="/calendario" onClick={closeMenu}>
                <i className="bi bi-calendar3 me-1 text-info"></i> Calendario
              </NavLink>
            </li>
          </ul>

          <div className="d-none d-lg-flex align-items-center gap-2 ms-lg-3">
            {subscription && (
              <button
                className={`btn btn-subscription-badge d-flex align-items-center gap-1 rounded-pill px-2 py-1 shadow-sm subscription-${subscription.badgeVariant}`}
                type="button"
                onClick={openSubscriptionModal}
                title="Estado de tu cuenta FinTrack (Clic para ver planes)"
              >
                <i className={`bi ${subscription.isExpired ? 'bi-exclamation-triangle-fill text-danger' : (subscription.status === 'active' ? 'bi-patch-check-fill text-success' : 'bi-clock-history text-primary')}`}></i>
                <span className="subscription-badge-text fw-semibold small">{subscription.badgeText}</span>
              </button>
            )}

            <button
              className="btn btn-notification-bell d-flex align-items-center justify-content-center rounded-circle shadow-sm position-relative"
              type="button"
              onClick={openVencimientosModal}
              title={alertasCount > 0 ? `${alertasCount} vencimientos pendientes (Alt + V)` : "Sin vencimientos pendientes (Alt + V)"}
              aria-label={alertasCount > 0 ? `${alertasCount} vencimientos pendientes` : "Sin vencimientos pendientes"}
            >
              <i className={`bi ${alertasCount > 0 ? "bi-bell-fill" : "bi-bell"} ${hasVencidos ? "text-danger" : (alertasCount > 0 ? "text-warning" : "text-muted")}`}></i>
              {alertasCount > 0 && (
                <span className={`bell-badge-count ${hasVencidos ? 'bg-danger text-white bell-pulse-red' : 'bg-warning text-dark'}`}>
                  {alertasCount}
                </span>
              )}
            </button>

            <button
              className={`btn btn-privacy-toggle d-flex align-items-center justify-content-center rounded-circle shadow-sm ${isPrivate ? 'active' : ''}`}
              type="button"
              onClick={togglePrivacy}
              title={isPrivate ? "Mostrar saldos (Alt + P)" : "Ocultar saldos (Modo Privacidad - Alt + P)"}
              aria-label="Alternar privacidad de saldos"
            >
              <i className={`bi ${isPrivate ? "bi-eye-slash-fill text-warning" : "bi-eye"}`}></i>
            </button>

            <div className="position-relative" ref={userMenuRef}>
              <button
                className="btn btn-user-profile d-flex align-items-center gap-2 rounded-pill px-2 py-1 shadow-sm"
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title="Opciones de cuenta y personalización"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label="Menú de opciones de cuenta y personalización"
              >
                {userPhoto && !imgError ? (
                  <img 
                    src={userPhoto} 
                    alt={nombreUsuario} 
                    referrerPolicy="no-referrer"
                    className="user-avatar-img"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="user-avatar-badge">{inicial}</span>
                )}
                <span className="user-name-text fw-semibold small">{nombreUsuario}</span>
                <i className="bi bi-chevron-down text-muted" style={{ fontSize: "0.75rem" }}></i>
              </button>

              {userMenuOpen && (
                <ul 
                  className="dropdown-menu dropdown-menu-end shadow-lg rounded-4 p-2 border show" 
                  style={{ minWidth: "220px", position: "absolute", top: "115%", right: 0, zIndex: 1050 }}
                >
                  <li className="px-3 py-2 border-bottom mb-1">
                    <div className="d-flex align-items-center gap-2">
                      {userPhoto && !imgError ? (
                        <img 
                          src={userPhoto} 
                          alt={nombreUsuario} 
                          referrerPolicy="no-referrer"
                          className="user-avatar-img"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <span className="user-avatar-badge">{inicial}</span>
                      )}
                      <div>
                        <div className="fw-bold small dropdown-user-name">{nombreUsuario}</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {isDemo ? "Modo Demo Activo" : (user?.email || user?.providerData?.[0]?.email || "daniela.cabrera5071@gmail.com")}
                        </div>
                      </div>
                    </div>
                    {subscription && (
                      <div className="mt-2 pt-2 border-top">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="text-muted fw-semibold" style={{ fontSize: "0.7rem" }}>
                            {subscription.isAdmin ? "CUENTA ADMIN" : (subscription.status === "active" ? "PLAN PRO" : "PRUEBA 60 DÍAS")}
                          </span>
                          <span className={`badge rounded-pill ${subscription.isExpired ? 'bg-danger text-white' : (subscription.status === 'active' ? 'bg-success text-white' : (subscription.daysLeft <= 7 ? 'bg-warning text-dark' : 'bg-primary text-white'))}`} style={{ fontSize: "0.68rem" }}>
                            {subscription.badgeText}
                          </span>
                        </div>
                        {subscription.status === "trial" && !subscription.isAdmin && (
                          <div className="progress my-1" style={{ height: "4px" }}>
                            <div 
                              className={`progress-bar ${subscription.daysLeft <= 7 ? 'bg-warning' : 'bg-primary'}`} 
                              style={{ width: `${subscription.percentUsed}%` }}
                            ></div>
                          </div>
                        )}
                        <button 
                          className="btn btn-sm btn-outline-primary w-100 rounded-pill py-1 mt-1 fw-semibold d-flex align-items-center justify-content-center gap-1"
                          style={{ fontSize: "0.74rem" }}
                          onClick={() => { setUserMenuOpen(false); openSubscriptionModal(); }}
                        >
                          <i className="bi bi-shield-check"></i>
                          <span>{subscription.isAdmin ? "Gestionar Cuenta Admin" : (subscription.status === "active" ? "Gestionar Plan" : "Ver Planes Pro")}</span>
                        </button>
                      </div>
                    )}
                  </li>

                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center justify-content-between py-2 rounded-3 user-menu-item"
                      onClick={() => { togglePrivacy(); setUserMenuOpen(false); }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <i className={`bi ${isPrivate ? "bi-eye-slash-fill text-warning" : "bi-eye text-primary"}`}></i>
                        <span>Modo Privacidad</span>
                      </div>
                      <span className={`badge rounded-pill ${isPrivate ? 'bg-warning text-dark' : 'bg-secondary bg-opacity-25 text-secondary'}`} style={{ fontSize: "0.68rem" }}>
                        {isPrivate ? "Activo" : "Off"}
                      </span>
                    </button>
                  </li>

                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center justify-content-between py-2 rounded-3 user-menu-item"
                      onClick={() => { setUserMenuOpen(false); openCurrencyModal(); }}
                      title="Configurar moneda principal y divisas de Latinoamérica"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-cash-coin text-success"></i>
                        <span>Moneda y Divisas</span>
                      </div>
                      <span className="badge bg-light text-secondary border small">
                        {monedaInfo?.flag} {monedaPrincipal}
                      </span>
                    </button>
                  </li>

                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 user-menu-item"
                      onClick={() => { setUserMenuOpen(false); openCustomizeModal(); }}
                    >
                      <i className="bi bi-palette2 text-primary"></i>
                      <span>Personalizar Tema</span>
                    </button>
                  </li>

                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 user-menu-item"
                      onClick={() => { setUserMenuOpen(false); lockScreen(); }}
                      title="Bloquear pantalla temporalmente"
                    >
                      <i className="bi bi-shield-lock text-warning"></i>
                      <span>Bloquear Pantalla</span>
                    </button>
                  </li>

                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 user-menu-item"
                      onClick={() => { setUserMenuOpen(false); openAuditModal(); }}
                      title="Copias de seguridad y bitácora de auditoría"
                    >
                      <i className="bi bi-shield-shaded text-success"></i>
                      <span>Auditoría y Respaldos</span>
                    </button>
                  </li>

                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 user-menu-item"
                      onClick={() => { setUserMenuOpen(false); openPowerBiExport(); }}
                      title="Exportar dataset y fórmulas DAX para Microsoft Power BI y Excel"
                    >
                      <i className="bi bi-file-earmark-bar-graph-fill text-warning"></i>
                      <span>Power BI y Excel Hub</span>
                    </button>
                  </li>

                  <li><hr className="dropdown-divider my-1 opacity-50" /></li>

                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-danger"
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      <span>{isDemo ? "Salir del Demo" : "Cerrar sesión"}</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>

          <div className="d-lg-none mt-3 pt-3 border-top">
            <div className="d-flex align-items-center gap-2 mb-3 px-2">
              {userPhoto && !imgError ? (
                <img 
                  src={userPhoto} 
                  alt={nombreUsuario} 
                  referrerPolicy="no-referrer"
                  className="user-avatar-img"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="user-avatar-badge">{inicial}</span>
              )}
              <div>
                <div className="fw-bold small dropdown-user-name">{nombreUsuario}</div>
                <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                  {isDemo ? "Modo Demo" : user?.email}
                </div>
              </div>
            </div>

            {subscription && (
              <div className="subscription-drawer-card p-2 rounded-3 mb-2 border">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="fw-semibold small">{subscription.label}</span>
                  <span className={`badge rounded-pill ${subscription.isExpired ? 'bg-danger text-white' : (subscription.status === 'active' ? 'bg-success text-white' : (subscription.daysLeft <= 7 ? 'bg-warning text-dark' : 'bg-primary text-white'))}`} style={{ fontSize: "0.72rem" }}>
                    {subscription.badgeText}
                  </span>
                </div>
                {subscription.status === "trial" && (
                  <div className="progress my-1" style={{ height: "4px" }}>
                    <div 
                      className={`progress-bar ${subscription.daysLeft <= 7 ? 'bg-warning' : 'bg-primary'}`} 
                      style={{ width: `${subscription.percentUsed}%` }}
                    ></div>
                  </div>
                )}
                <button
                  className="btn btn-primary btn-sm w-100 rounded-pill mt-2 py-1 fw-semibold d-flex align-items-center justify-content-center gap-1"
                  onClick={() => { closeMenu(); openSubscriptionModal(); }}
                >
                  <i className="bi bi-shield-check"></i>
                  <span>Ver Planes y Suscripción</span>
                </button>
              </div>
            )}

            <div className="d-flex flex-column gap-2">
              <button
                className={`btn ${isPrivate ? 'btn-warning text-dark' : 'btn-outline-secondary'} btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-pill py-2`}
                onClick={() => { togglePrivacy(); closeMenu(); }}
              >
                <i className={`bi ${isPrivate ? "bi-eye-slash-fill" : "bi-eye"}`}></i>
                <span>{isPrivate ? "Saldos Ocultos (Toca para ver)" : "Modo Privacidad (Ocultar saldos)"}</span>
              </button>

              <button
                className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-between rounded-pill py-2 px-3"
                onClick={() => { closeMenu(); openCurrencyModal(); }}
              >
                <span className="d-flex align-items-center gap-2">
                  <i className="bi bi-cash-coin text-success"></i>
                  <span>Moneda y Divisas</span>
                </span>
                <span className="badge bg-light text-secondary border small">
                  {monedaInfo?.flag} {monedaPrincipal}
                </span>
              </button>

              <button
                className={`btn ${alertasCount > 0 ? (hasVencidos ? 'btn-danger' : 'btn-warning text-dark') : 'btn-outline-secondary'} btn-sm w-100 d-flex align-items-center justify-content-between rounded-pill py-2 px-3`}
                onClick={() => { closeMenu(); openVencimientosModal(); }}
              >
                <span className="d-flex align-items-center gap-2">
                  <i className={`bi ${alertasCount > 0 ? "bi-bell-fill" : "bi-bell"}`}></i>
                  <span>Vencimientos y Facturas</span>
                </span>
                {alertasCount > 0 && (
                  <span className="badge rounded-pill bg-light text-dark fw-bold">
                    {alertasCount}
                  </span>
                )}
              </button>

              <div className="row g-2">
                <div className="col-6">
                  <button
                    className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-1 rounded-3 py-2"
                    onClick={() => { closeMenu(); openCustomizeModal(); }}
                  >
                    <i className="bi bi-palette2 text-primary"></i>
                    <span className="small">Tema</span>
                  </button>
                </div>
                <div className="col-6">
                  <button
                    className="btn btn-outline-warning text-dark btn-sm w-100 d-flex align-items-center justify-content-center gap-1 rounded-3 py-2"
                    onClick={() => { closeMenu(); lockScreen(); }}
                  >
                    <i className="bi bi-shield-lock text-warning"></i>
                    <span className="small">Bloquear</span>
                  </button>
                </div>
                <div className="col-6">
                  <button
                    className="btn btn-outline-success btn-sm w-100 d-flex align-items-center justify-content-center gap-1 rounded-3 py-2"
                    onClick={() => { closeMenu(); openAuditModal(); }}
                  >
                    <i className="bi bi-shield-shaded text-success"></i>
                    <span className="small">Auditoría</span>
                  </button>
                </div>
                <div className="col-6">
                  <button
                    className="btn btn-outline-warning text-dark btn-sm w-100 d-flex align-items-center justify-content-center gap-1 rounded-3 py-2 fw-semibold"
                    onClick={() => { closeMenu(); openPowerBiExport(); }}
                  >
                    <i className="bi bi-file-earmark-bar-graph-fill text-warning"></i>
                    <span className="small">Power BI</span>
                  </button>
                </div>
              </div>

              <button 
                className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-pill py-2" 
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>{isDemo ? "Salir del Demo" : "Cerrar sesión"}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}
