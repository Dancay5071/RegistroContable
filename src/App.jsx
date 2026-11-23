import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BalanceProvider } from "./context/BalanceContext";
import { PrivacyProvider } from "./context/PrivacyContext";
import { SecurityProvider, useSecurity } from "./context/SecurityContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { QuickMovementProvider, useQuickMovement } from "./context/QuickMovementContext";
import { VencimientosProvider, useVencimientos } from "./context/VencimientosContext";
import { PowerBiExportProvider, usePowerBiExport } from "./context/PowerBiExportContext";
import { SubscriptionProvider, useSubscription } from "./context/SubscriptionContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import QuickMovementModal from "./components/QuickMovementModal";
import VencimientosModal from "./components/VencimientosModal";
import CustomizeModal from "./components/CustomizeModal";
import SecurityConfirmModal from "./components/SecurityConfirmModal";
import ScreenLockModal from "./components/ScreenLockModal";
import SecurityAuditModal from "./components/SecurityAuditModal";
import PowerBiExportModal from "./components/PowerBiExportModal";
import SubscriptionModal from "./components/SubscriptionModal";
import FloatingActionButton from "./components/FloatingActionButton";
import Loader from "./components/Loader";

const Home = lazy(() => import("./pages/Home"));
const NuevoGasto = lazy(() => import("./pages/NuevoGasto"));
const ConsultarGasto = lazy(() => import("./pages/ConsultarGasto"));
const NuevoIngreso = lazy(() => import("./pages/NuevoIngreso"));
const ConsultarIngreso = lazy(() => import("./pages/ConsultarIngreso"));
const Ahorro = lazy(() => import("./pages/Ahorro"));
const Resumen = lazy(() => import("./pages/Resumen"));
const Calendario = lazy(() => import("./pages/Calendario"));

import "./App.css";

function ProtectedRoute({ children }) {
  const { user, loading, openLoginModal } = useAuth();

  if (loading) {
    return (
      <div className="d-flex flex-grow-1 align-items-center justify-content-center">
        <Loader message="Verificando sesión..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fade-in d-flex flex-column align-items-center justify-content-center flex-grow-1 p-3">
        <div className="principal text-center p-5 rounded-4 shadow-sm border" style={{ maxWidth: "480px" }}>
          <i className="bi bi-shield-lock text-warning fs-1 mb-3 d-block"></i>
          <h4 className="fw-bold mb-2">Acceso restringido</h4>
          <p className="text-muted small mb-4">Debes iniciar sesión con tu cuenta o ingresar en Modo Demo para ver tus finanzas.</p>
          <button className="btn btn-success px-4 py-2 fw-semibold" onClick={openLoginModal}>
            <i className="bi bi-box-arrow-in-right me-1"></i> Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return children;
}

function MainLayout() {
  const navigate = useNavigate();
  const { user, isLoginModalOpen, closeLoginModal } = useAuth();
  const { showToast } = useToast();
  const { isOpen: isQuickOpen, openQuickModal, closeQuickModal } = useQuickMovement();
  const { isVencimientosModalOpen, openVencimientosModal, closeVencimientosModal } = useVencimientos();
  const { isSubscriptionModalOpen, closeSubscriptionModal } = useSubscription();
  const { isCustomizeModalOpen, closeCustomizeModal } = useTheme();
  const { confirmModalConfig, closeConfirmation, isAuditModalOpen, closeAuditModal } = useSecurity();
  const { isExportOpen, closePowerBiExport } = usePowerBiExport();

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (confirmModalConfig) {
          closeConfirmation();
        } else if (isQuickOpen) {
          closeQuickModal();
        } else if (isVencimientosModalOpen) {
          closeVencimientosModal();
        } else if (isSubscriptionModalOpen) {
          closeSubscriptionModal();
        } else if (isCustomizeModalOpen) {
          closeCustomizeModal();
        } else if (isAuditModalOpen) {
          closeAuditModal();
        } else if (isExportOpen) {
          closePowerBiExport();
        } else if (isLoginModalOpen) {
          closeLoginModal();
        }
        return;
      }

      const anyModalOpen = Boolean(
        confirmModalConfig ||
        isQuickOpen ||
        isVencimientosModalOpen ||
        isSubscriptionModalOpen ||
        isCustomizeModalOpen ||
        isAuditModalOpen ||
        isExportOpen ||
        isLoginModalOpen
      );

      if (e.altKey && !e.ctrlKey && !e.metaKey && !anyModalOpen) {
        const key = e.key.toLowerCase();
        if (key === "n" && user) {
          e.preventDefault();
          openQuickModal("gasto");
        } else if (key === "v" && user) {
          e.preventDefault();
          openVencimientosModal();
        } else if (key === "c" && user) {
          e.preventDefault();
          navigate("/calendario");
        } else if (key === "r" && user) {
          e.preventDefault();
          navigate("/resumen");
        } else if (key === "h" && user) {
          e.preventDefault();
          navigate("/");
        } else if (key === "g" && user) {
          e.preventDefault();
          navigate("/gastos/consultar");
        } else if (key === "i" && user) {
          e.preventDefault();
          navigate("/ingresos/consultar");
        } else if (key === "a" && user) {
          e.preventDefault();
          navigate("/ahorros");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    user,
    navigate,
    confirmModalConfig,
    closeConfirmation,
    isQuickOpen,
    openQuickModal,
    closeQuickModal,
    isVencimientosModalOpen,
    openVencimientosModal,
    closeVencimientosModal,
    isSubscriptionModalOpen,
    closeSubscriptionModal,
    isCustomizeModalOpen,
    closeCustomizeModal,
    isAuditModalOpen,
    closeAuditModal,
    isExportOpen,
    closePowerBiExport,
    isLoginModalOpen,
    closeLoginModal
  ]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const plan = params.get("plan");

    if (payment === "success") {
      showToast(`¡Pago procesado con éxito! Tu suscripción FinTrack Pro (${plan === "annual" ? "Plan Anual" : "Plan Mensual"}) ya está activa.`, "success");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === "failure") {
      showToast("El pago no pudo procesarse. Puedes intentar con otro medio de pago.", "warning");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === "pending") {
      showToast("Tu pago se encuentra en proceso de acreditación por Mercado Pago.", "info");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [showToast]);

  return (
    <div className="app-wrapper">
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <div className="fondo"></div>
      <Navbar />
      <main id="main-content" tabIndex="-1" className="d-flex flex-column flex-grow-1">
        <Suspense fallback={<Loader message="Cargando módulo..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/gastos/nuevo" 
              element={
                <ProtectedRoute>
                  <NuevoGasto />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/gastos/consultar" 
              element={
                <ProtectedRoute>
                  <ConsultarGasto />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ingresos/nuevo" 
              element={
                <ProtectedRoute>
                  <NuevoIngreso />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ingresos/consultar" 
              element={
                <ProtectedRoute>
                  <ConsultarIngreso />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ahorros" 
              element={
                <ProtectedRoute>
                  <Ahorro />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resumen" 
              element={
                <ProtectedRoute>
                  <Resumen />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendario" 
              element={
                <ProtectedRoute>
                  <Calendario />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <LoginModal />
      <QuickMovementModal />
      <VencimientosModal />
      <CustomizeModal />
      <SecurityConfirmModal />
      <ScreenLockModal />
      <SecurityAuditModal />
      <PowerBiExportModal />
      <SubscriptionModal />
      <FloatingActionButton />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <BalanceProvider>
              <PrivacyProvider>
                <SecurityProvider>
                  <ToastProvider>
                    <QuickMovementProvider>
                      <VencimientosProvider>
                        <PowerBiExportProvider>
                          <MainLayout />
                        </PowerBiExportProvider>
                      </VencimientosProvider>
                    </QuickMovementProvider>
                  </ToastProvider>
                </SecurityProvider>
              </PrivacyProvider>
            </BalanceProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
