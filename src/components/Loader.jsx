// src/components/Loader.jsx
import React from "react";

export default function Loader({ message = "Cargando datos..." }) {
  return (
    <div id="loader" className="my-3 text-center">
      <p className="mb-2">{message}</p>
      <div className="spinner-border text-light" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  );
}

