// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BalanceProvider } from "./context/BalanceContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import Loader from "./components/Loader";

// Páginas
import Home from "./pages/Home";
import NuevoGasto from "./pages/NuevoGasto";
import ConsultarGasto from "./pages/ConsultarGasto";
import NuevoIngreso from "./pages/NuevoIngreso";
import ConsultarIngreso from "./pages/ConsultarIngreso";
import Ahorro from "./pages/Ahorro";
import Resumen from "./pages/Resumen";

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
        <div className="principal text-center p-4 rounded text-white shadow">
          <h4 className="mb-3">Acceso Restringido</h4>
          <p className="mb-3">Debes iniciar sesión para acceder a esta sección.</p>
          <button className="btn btn-success" onClick={openLoginModal}>
            Iniciar sesión
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
      </main>
      <Footer />
      <LoginModal />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <BalanceProvider>
          <MainLayout />
        </BalanceProvider>
      </AuthProvider>
    </Router>
  );
}

