// src/App.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BalanceProvider } from "./context/BalanceContext";
import { ToastProvider } from "./context/ToastContext";
import { QuickMovementProvider } from "./context/QuickMovementContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import QuickMovementModal from "./components/QuickMovementModal";
import CustomizeModal from "./components/CustomizeModal";
import FloatingActionButton from "./components/FloatingActionButton";
import Loader from "./components/Loader";

// Code Splitting (Carga diferida para máxima velocidad)
const Home = lazy(() => import("./pages/Home"));
const NuevoGasto = lazy(() => import("./pages/NuevoGasto"));
const ConsultarGasto = lazy(() => import("./pages/ConsultarGasto"));
const NuevoIngreso = lazy(() => import("./pages/NuevoIngreso"));
const ConsultarIngreso = lazy(() => import("./pages/ConsultarIngreso"));
const Ahorro = lazy(() => import("./pages/Ahorro"));
const Resumen = lazy(() => import("./pages/Resumen"));

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
          <h4 className="fw-bold mb-2">Acceso Restringido</h4>
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
  return (
    <div className="app-wrapper">
      <div className="fondo"></div>
      <Navbar />
      <main className="d-flex flex-column flex-grow-1">
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <LoginModal />
      <QuickMovementModal />
      <CustomizeModal />
      <FloatingActionButton />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <BalanceProvider>
            <ToastProvider>
              <QuickMovementProvider>
                <MainLayout />
              </QuickMovementProvider>
            </ToastProvider>
          </BalanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
