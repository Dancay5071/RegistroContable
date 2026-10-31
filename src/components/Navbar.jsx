// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isDemo, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [gastosOpen, setGastosOpen] = useState(false);
  const [ingresosOpen, setIngresosOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Hubo un problema al cerrar sesión. Inténtalo de nuevo.");
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    setGastosOpen(false);
    setIngresosOpen(false);
  };

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary" id="navbar">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/" onClick={closeMenu}>
          <img src="/imagen/RC.png" alt="Logo" style={{ height: "30px" }} />
        </Link>

        {isDemo && (
          <span className="badge bg-warning text-dark d-none d-md-inline-flex align-items-center gap-1 ms-2">
            <i className="bi bi-rocket-takeoff-fill"></i> Modo Demo
          </span>
        )}

        <button 
          className="navbar-toggler" 
          type="button" 
          onClick={() => setIsOpen(!isOpen)}
          aria-controls="navbarSupportedContent" 
          aria-expanded={isOpen} 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`} id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {/* Dropdown Gastos */}
            <li 
              className={`nav-item dropdown ${gastosOpen ? "show" : ""}`}
              onMouseEnter={() => setGastosOpen(true)}
              onMouseLeave={() => setGastosOpen(false)}
            >
              <button 
                className="nav-link dropdown-toggle btn btn-link" 
                type="button"
                onClick={() => setGastosOpen(!gastosOpen)}
                aria-expanded={gastosOpen}
              >
                Gastos
              </button>
              <ul className={`dropdown-menu ${gastosOpen ? "show" : ""}`}>
                <li>
                  <NavLink 
                    className="dropdown-item" 
                    to="/gastos/nuevo"
                    onClick={closeMenu}
                  >
                    Nuevo
                  </NavLink>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <NavLink 
                    className="dropdown-item" 
                    to="/gastos/consultar"
                    onClick={closeMenu}
                  >
                    Consultar
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Dropdown Ingresos */}
            <li 
              className={`nav-item dropdown ${ingresosOpen ? "show" : ""}`}
              onMouseEnter={() => setIngresosOpen(true)}
              onMouseLeave={() => setIngresosOpen(false)}
            >
              <button 
                className="nav-link dropdown-toggle btn btn-link" 
                type="button"
                onClick={() => setIngresosOpen(!ingresosOpen)}
                aria-expanded={ingresosOpen}
              >
                Ingresos
              </button>
              <ul className={`dropdown-menu ${ingresosOpen ? "show" : ""}`}>
                <li>
                  <NavLink 
                    className="dropdown-item" 
                    to="/ingresos/nuevo"
                    onClick={closeMenu}
                  >
                    Nuevo
                  </NavLink>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <NavLink 
                    className="dropdown-item" 
                    to="/ingresos/consultar"
                    onClick={closeMenu}
                  >
                    Consultar
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Ahorros */}
            <li className="nav-item">
              <NavLink 
                className="nav-link" 
                to="/ahorros"
                onClick={closeMenu}
              >
                Ahorros
              </NavLink>
            </li>

            {/* Resumen */}
            <li className="nav-item">
              <NavLink 
                className="nav-link" 
                to="/resumen"
                onClick={closeMenu}
              >
                Resumen
              </NavLink>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-2 ms-auto mt-2 mt-lg-0">
            {isDemo && (
              <span className="badge bg-warning text-dark d-inline-flex d-md-none align-items-center gap-1">
                <i className="bi bi-rocket-takeoff-fill"></i> Demo
              </span>
            )}
            <button 
              className="btn btn-outline-danger" 
              type="button"
              onClick={handleLogout}
            >
              {isDemo ? "Salir del Demo" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
