// src/components/charts/MonthlyComparisonChart.jsx
import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  BarController
} from "chart.js";
import { MESES, formatoMoneda, formatoNumber } from "../../utils/formatters";
import { useTheme } from "../../context/ThemeContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, BarController);

export default function MonthlyComparisonChart({ 
  ingresosMensuales = [], 
  gastosMensuales = [], 
  ahorrosMensuales = [],
  anio = new Date().getFullYear()
}) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const { theme } = useTheme();

  const isDark = theme === "dark";
  const labelColor = isDark ? "#f1f5f9" : "#1e293b";
  const tickColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(222, 212, 194, 0.5)";

  // Abreviar nombres de meses: Ene, Feb, Mar...
  const labels = MESES.map((m) => m.substring(0, 3));

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");

    chartInstanceRef.current = new ChartJS(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Ingresos",
            data: ingresosMensuales,
            backgroundColor: isDark ? "rgba(16, 185, 129, 0.85)" : "rgba(36, 104, 69, 0.75)",
            borderColor: isDark ? "#34d399" : "#1e633f",
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: "Gastos",
            data: gastosMensuales,
            backgroundColor: isDark ? "rgba(244, 63, 94, 0.85)" : "rgba(178, 53, 53, 0.75)",
            borderColor: isDark ? "#fb7185" : "#991b1b",
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: "Ahorros",
            data: ahorrosMensuales,
            backgroundColor: isDark ? "rgba(251, 191, 36, 0.85)" : "rgba(196, 109, 3, 0.75)",
            borderColor: isDark ? "#fcd34d" : "#854d0e",
            borderWidth: 1.5,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 12,
              padding: 14,
              color: labelColor,
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11,
                weight: "600"
              }
            }
          },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#1e293b",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const val = context.raw || 0;
                return ` ${context.dataset.label}: ${formatoMoneda(val)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: tickColor,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: "600" }
            }
          },
          y: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: tickColor,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: "600" },
              callback: (value) => `$${formatoNumber(value)}`
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [ingresosMensuales, gastosMensuales, ahorrosMensuales, anio, theme]);

  return (
    <div className="position-relative w-100" style={{ height: "260px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

