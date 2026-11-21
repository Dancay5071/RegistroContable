import React, { useState, useEffect } from "react";
import { useSubscription } from "../context/SubscriptionContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { createSubscriptionCheckout, cancelSubscriptionAutoRenew } from "../services/subscriptionService";

export default function SubscriptionModal() {
  const { 
    subscription, 
    isSubscriptionModalOpen, 
    closeSubscriptionModal,
    changeDemoSubscriptionMode
  } = useSubscription();
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();

  const [billingCycle, setBillingCycle] = useState("annual");
  const [selectedPlan, setSelectedPlan] = useState("annual");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSubscriptionModalOpen) {
        closeSubscriptionModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubscriptionModalOpen, closeSubscriptionModal]);

  if (!isSubscriptionModalOpen) return null;

  const handleCheckout = async (planKey) => {
    setSelectedPlan(planKey);
    const planName = planKey === "annual" ? "Plan Anual Pro" : "Plan Mensual Pro";

    if (isDemo) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        changeDemoSubscriptionMode("active");
        showToast(`¡Suscripción al ${planName} simulada con éxito! Has activado FinTrack Pro en Modo Demo.`, "success");
      }, 600);
      return;
    }

    if (!user) {
      showToast("Debes iniciar sesión para suscribirte", "warning");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createSubscriptionCheckout({
        userId: user.uid,
        userEmail: user.email,
        planType: planKey
      });

      if (result?.initPoint) {
        window.location.href = result.initPoint;
      } else {
        showToast("Sesión de pago generada exitosamente", "success");
      }
    } catch (err) {
      console.error("Error en checkout:", err);
      showToast(`Servicio de pago: ${err.message || "Recuerda desplegar tus Cloud Functions con tu clave de Mercado Pago."}`, "warning");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelAutoRenew = async () => {
    if (isDemo) {
      changeDemoSubscriptionMode("trial_45");
      showToast("Cancelación de renovación simulada. Tu cuenta volvió al periodo de prueba en Modo Demo.", "info");
      return;
    }

    if (!user) return;
    setIsProcessing(true);
    try {
      const res = await cancelSubscriptionAutoRenew(user.uid);
      showToast(res.message || "Renovación automática cancelada.", "info");
    } catch (err) {
      showToast(err.message || "Error al solicitar cancelación.", "warning");
    } finally {
      setIsProcessing(false);
    }
  };

  const isExpired = subscription?.isExpired;
  const isTrial = subscription?.status === "trial";
  const isActive = subscription?.status === "active";
  const daysLeft = subscription?.daysLeft ?? 60;
  const percentUsed = subscription?.percentUsed ?? 0;

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      role="dialog" 
      aria-modal="true"
      style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        width: "100vw", 
        height: "100vh", 
        zIndex: 2000, 
        backgroundColor: "rgba(15, 23, 42, 0.75)", 
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        overflowY: "auto"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSubscriptionModal();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg my-4" style={{ maxWidth: "800px" }}>
        <div 
          className="modal-content border-0 rounded-4 shadow-lg p-4 p-md-5 position-relative"
          style={{ 
            backgroundColor: "var(--bg-card)",
            color: "var(--text-main)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="btn-close position-absolute top-0 end-0 m-3 m-md-4"
            onClick={closeSubscriptionModal}
            aria-label="Cerrar ventana"
          ></button>

        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle mb-3 subscription-icon-wrapper">
            <i className="bi bi-stars fs-1 text-warning"></i>
          </div>
          <div className="badge rounded-pill subscription-pill-badge mb-2 px-3 py-1 fw-bold">
            FINTRACK PRO
          </div>
          <h2 className="fw-bold mb-2">Tu tranquilidad financiera comienza aquí</h2>
          <p className="text-muted small mx-auto" style={{ maxWidth: "540px" }}>
            Controla cada peso, anticipa vencimientos y visualiza tu patrimonio con análisis inteligentes.
          </p>
        </div>

        <div className={`p-3 rounded-4 mb-4 border ${isExpired ? 'subscription-status-expired' : (isActive ? 'subscription-status-active' : 'subscription-status-trial')}`}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${isExpired ? 'bi-exclamation-triangle-fill text-danger' : (isActive ? 'bi-patch-check-fill text-success' : 'bi-clock-history text-primary')} fs-5`}></i>
              <span className="fw-bold small">{subscription?.label || "Estado de Suscripción"}</span>
            </div>
            <span className={`badge rounded-pill ${isExpired ? 'bg-danger text-white' : (isActive ? 'bg-success text-white' : (daysLeft <= 7 ? 'bg-warning text-dark' : 'bg-primary text-white'))}`}>
              {subscription?.badgeText}
            </span>
          </div>

          {isTrial && (
            <div>
              <div className="d-flex justify-content-between text-muted small mb-1" style={{ fontSize: "0.78rem" }}>
                <span>60 días de prueba gratuita</span>
                <span>{daysLeft} {daysLeft === 1 ? "día restante" : "días restantes"}</span>
              </div>
              <div className="progress subscription-progress" style={{ height: "6px" }}>
                <div 
                  className={`progress-bar rounded-pill ${daysLeft <= 7 ? 'bg-warning' : 'bg-primary'}`} 
                  style={{ width: `${percentUsed}%` }}
                ></div>
              </div>
            </div>
          )}

          {isExpired && (
            <p className="small text-danger mb-0 mt-1">
              Tu periodo de prueba ha expirado. Tus datos continúan seguros y accesibles para consulta o descarga. Activa un plan para habilitar la carga de nuevos movimientos.
            </p>
          )}

          {isActive && (
            <p className="small text-success mb-0 mt-1">
              Tu suscripción está al día. Tienes acceso completo e ilimitado a todas las herramientas profesionales.
            </p>
          )}

          {isDemo && (
            <div className="mt-3 pt-2 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
              <span className="small text-muted" style={{ fontSize: "0.75rem" }}>
                <i className="bi bi-gear me-1"></i> Simulador de Prueba (Modo Demo):
              </span>
              <div className="btn-group btn-group-sm">
                <button 
                  className={`btn btn-xs ${daysLeft === 45 ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => changeDemoSubscriptionMode("trial_45")}
                >
                  45 días
                </button>
                <button 
                  className={`btn btn-xs ${daysLeft === 5 ? 'btn-warning' : 'btn-outline-secondary'}`}
                  onClick={() => changeDemoSubscriptionMode("expiring_5")}
                >
                  5 días
                </button>
                <button 
                  className={`btn btn-xs ${isExpired ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => changeDemoSubscriptionMode("expired")}
                >
                  Vencido
                </button>
                <button 
                  className={`btn btn-xs ${isActive ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => changeDemoSubscriptionMode("active")}
                >
                  Pro Activo
                </button>
              </div>
            </div>
          )}
        </div>

        {isActive ? (
          <div>
            <div className="p-4 rounded-4 border bg-card mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3 flex-wrap gap-2">
                <div>
                  <span className="badge rounded-pill bg-success text-white mb-1">
                    <i className="bi bi-patch-check-fill me-1"></i> FINTRACK PRO ACTIVO
                  </span>
                  <h4 className="fw-bold mb-0 text-dark">
                    {subscription?.plan === "pro_annual" ? "Plan Anual Pro" : "Plan Mensual Pro"}
                  </h4>
                </div>
                <div className="text-sm-end">
                  <div className="fs-4 fw-bold text-success">
                    {subscription?.plan === "pro_annual" ? "$32.000 ARS" : "$3.900 ARS"}
                  </div>
                  <span className="small text-muted">
                    {subscription?.plan === "pro_annual" ? "Facturación anual (-32% OFF)" : "Facturación mensual"}
                  </span>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded-3 border bg-card-alt">
                    <span className="small text-muted d-block">Estado de la suscripción</span>
                    <strong className="text-success small d-flex align-items-center gap-1 mt-1">
                      <span className="dot dot-dolar-pulse"></span> Activa y al día
                    </strong>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded-3 border bg-card-alt">
                    <span className="small text-muted d-block">Próxima renovación</span>
                    <strong className="text-dark small d-block mt-1">
                      {subscription?.nextBillingDate 
                        ? new Date(subscription.nextBillingDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
                        : "Automática con Mercado Pago"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="border-top pt-3">
                <span className="small text-muted fw-bold d-block mb-2">Herramientas profesionales activas:</span>
                <div className="row g-2 small text-muted">
                  <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Carga ilimitada de movimientos y gastos</span>
                  </div>
                  <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Multidivisa en tiempo real (ARS, USD, EUR)</span>
                  </div>
                  <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Exportación Power BI y Excel Hub</span>
                  </div>
                  <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Auditoría de datos y respaldos continuos</span>
                  </div>
                </div>
              </div>
            </div>

            {subscription?.plan !== "pro_annual" && (
              <div className="p-3 rounded-4 border border-warning bg-card mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <strong className="small d-block text-dark">¿Deseas ahorrar con el Plan Anual?</strong>
                  <span className="small text-muted">Paga $32.000 al año (equivale a $2.666/mes) y obtén 2 meses gratis.</span>
                </div>
                <button
                  className="btn btn-warning text-dark btn-sm rounded-pill px-3 fw-bold shadow-sm"
                  onClick={() => handleCheckout("annual")}
                  disabled={isProcessing}
                >
                  Mejorar a Plan Anual
                </button>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center pt-2 border-top flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-link text-muted small p-0 text-decoration-none"
                onClick={handleCancelAutoRenew}
                disabled={isProcessing}
              >
                <i className="bi bi-x-circle me-1"></i> Cancelar renovación automática
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm rounded-pill px-4"
                onClick={closeSubscriptionModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-center mb-4">
              <div className="subscription-billing-switch p-1 rounded-pill d-inline-flex border">
                <button
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold ${billingCycle === "monthly" ? "btn-primary shadow-sm" : "text-muted"}`}
                  onClick={() => setBillingCycle("monthly")}
                  type="button"
                >
                  Facturación Mensual
                </button>
                <button
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold position-relative ${billingCycle === "annual" ? "btn-primary shadow-sm" : "text-muted"}`}
                  onClick={() => setBillingCycle("annual")}
                  type="button"
                >
                  Facturación Anual
                  <span className="badge rounded-pill bg-warning text-dark ms-1" style={{ fontSize: "0.68rem" }}>
                    -32% OFF
                  </span>
                </button>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-md-6">
                <div 
                  className={`pricing-card p-4 rounded-4 h-100 border position-relative d-flex flex-column ${billingCycle === "monthly" || selectedPlan === "monthly" ? "border-primary active-plan" : ""}`}
                  onClick={() => setSelectedPlan("monthly")}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-muted small">PLAN MENSUAL</span>
                    <span className="badge bg-secondary bg-opacity-25 text-secondary rounded-pill small">Flexible</span>
                  </div>
                  <div className="d-flex align-items-baseline gap-1 mb-2">
                    <span className="fs-1 fw-bold">$3.900</span>
                    <span className="text-muted small">ARS / mes</span>
                  </div>
                  <p className="text-muted small mb-4">
                    Máxima libertad mes a mes. Cancela cuando quieras sin contratos ni penalidades.
                  </p>
                  <ul className="list-unstyled d-flex flex-column gap-2 small mb-4 flex-grow-1">
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2-circle text-success fs-5"></i>
                      <span>Movimientos y gastos ilimitados</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2-circle text-success fs-5"></i>
                      <span>Multidivisa (ARS, USD Blue, Oficial, MEP, EUR)</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2-circle text-success fs-5"></i>
                      <span>Alertas y calendario de vencimientos</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2-circle text-success fs-5"></i>
                      <span>Exportación a Power BI y Excel Hub</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2-circle text-success fs-5"></i>
                      <span>Modo Privacidad y bloqueo de pantalla</span>
                    </li>
                  </ul>
                  <button
                    className={`btn w-100 rounded-pill py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 ${selectedPlan === "monthly" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => handleCheckout("monthly")}
                    disabled={isProcessing}
                  >
                    {isProcessing && selectedPlan === "monthly" ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <span>Elegir Plan Mensual</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div 
                  className={`pricing-card p-4 rounded-4 h-100 border position-relative d-flex flex-column popular-plan ${billingCycle === "annual" || selectedPlan === "annual" ? "border-primary active-plan" : ""}`}
                  onClick={() => setSelectedPlan("annual")}
                >
                  <div className="position-absolute top-0 end-0 m-3">
                    <span className="badge rounded-pill bg-warning text-dark fw-bold px-2 py-1 shadow-sm" style={{ fontSize: "0.72rem" }}>
                      MÁS POPULAR • 2 MESES GRATIS
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-primary small">PLAN ANUAL PRO</span>
                  </div>
                  <div className="d-flex align-items-baseline gap-1 mb-1">
                    <span className="fs-1 fw-bold">$32.000</span>
                    <span className="text-muted small">ARS / año</span>
                  </div>
                  <div className="text-success small fw-semibold mb-2">
                    Equivale a solo $2.666 / mes (Ahorras $14.800)
                  </div>
                  <p className="text-muted small mb-4">
                    El plan favorito para quienes buscan orden patrimonial continuo al mejor costo.
                  </p>
                  <ul className="list-unstyled d-flex flex-column gap-2 small mb-4 flex-grow-1">
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2-circle text-success fs-5"></i>
                      <span><strong>Todo lo del Plan Mensual</strong></span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2-circle text-success fs-5"></i>
                      <span>Ahorro asegurado de 2 meses de suscripción</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2-circle text-success fs-5"></i>
                      <span>Auditoría de datos y respaldos continuos</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2-circle text-success fs-5"></i>
                      <span>Acceso anticipado a nuevas herramientas</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2-circle text-success fs-5"></i>
                      <span>Soporte prioritario directo</span>
                    </li>
                  </ul>
                  <button
                    className={`btn w-100 rounded-pill py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 ${selectedPlan === "annual" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => handleCheckout("annual")}
                    disabled={isProcessing}
                  >
                    {isProcessing && selectedPlan === "annual" ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <span>Comenzar con Plan Anual</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="subscription-guarantee p-3 rounded-4 border d-flex flex-wrap align-items-center justify-content-around gap-3 text-center">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-shield-check text-success fs-4"></i>
                <span className="small text-muted">Pago 100% protegido por Mercado Pago</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-x-circle text-primary fs-4"></i>
                <span className="small text-muted">Cancela cuando quieras con 1 clic</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-cloud-arrow-down text-info fs-4"></i>
                <span className="small text-muted">Tus datos siempre disponibles para exportar</span>
              </div>
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                className="btn btn-link text-muted small text-decoration-none"
                onClick={closeSubscriptionModal}
              >
                Continuar usando FinTrack
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
