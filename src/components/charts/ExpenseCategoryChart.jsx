import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController
} from "chart.js";
import { formatoMoneda } from "../../utils/formatters";
import { getCategoriaGasto } from "../../utils/categories";
import { useTheme } from "../../context/ThemeContext";

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController);

export default function ExpenseCategoryChart({ gastos = [], mes = "", anio = "" }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const { theme } = useTheme();

  const isDark = theme === "dark";
  const legendColor = isDark ? "#f1f5f9" : "#1e293b";

  const categoriasMap = {};
  (gastos || []).forEach((g) => {
    const catId = g.categoria || "Otros";
    categoriasMap[catId] = (categoriasMap[catId] || 0) + (Number(g.monto) || 0);
  });

  const labels = Object.keys(categoriasMap);
  const dataValues = Object.values(categoriasMap);
  const total = dataValues.reduce((a, b) => a + b, 0);

  const backgroundColors = labels.map((catId) => {
    const cat = getCategoriaGasto(catId);
    return cat.bg || "#e2e8f0";
  });

  const borderColors = labels.map((catId) => {
    const cat = getCategoriaGasto(catId);
    return cat.color || "#475569";
  });

  useEffect(() => {
    if (!canvasRef.current || labels.length === 0) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");

    chartInstanceRef.current = new ChartJS(ctx, {
      type: "doughnut",
      data: {
        labels: labels.map((l) => getCategoriaGasto(l).nombre),
        datasets: [
          {
            data: dataValues,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 2,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
              padding: 12,
              color: legendColor,
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11,
                weight: "600"
              }
            }
          },
          tooltip: {
            backgroundColor: "#1e293b",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const val = context.raw || 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${formatoMoneda(val)} (${pct}%)`;
              }
            }
          }
        },
        cutout: "68%"
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [gastos, theme]);

  if (labels.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-4 text-center h-100">
        <i className="bi bi-pie-chart fs-1 mb-2 opacity-75" style={{ color: "var(--text-muted)" }}></i>
        <p className="small mb-0" style={{ color: "var(--text-muted)" }}>
          Sin gastos registrados en {mes} {anio} para graficar.
        </p>
      </div>
    );
  }

  return (
    <div className="position-relative w-100" style={{ height: "260px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

