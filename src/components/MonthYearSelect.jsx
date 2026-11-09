// src/components/MonthYearSelect.jsx
import React from "react";
import { MESES } from "../utils/formatters";

export default function MonthYearSelect({ mes, setMes, anio, setAnio, labelMes = "Mes:" }) {
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="input-group mb-3">
      {labelMes && <label className="input-group-text">{labelMes}</label>}
      <select 
        className="form-select" 
        value={mes} 
        onChange={(e) => setMes(e.target.value)}
        id="mesSelect"
      >
        {MESES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <div className="input-group-append" style={{ marginLeft: "0.5rem" }}>
        <select 
          className="form-select select-year" 
          value={anio} 
          onChange={(e) => setAnio(Number(e.target.value))}
          id="anioSelect"
          style={{ minWidth: "105px" }}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

