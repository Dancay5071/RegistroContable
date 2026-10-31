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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, BarController);

export default function MonthlyComparisonChart({ 
  ingresosMensuales = [], 
  gastosMensuales = [], 
  ahorrosMensuales = [],
  anio = new Date().getFullYear()
}) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

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
            backgroundColor: "rgba(36, 104, 69, 0.75)",
            borderColor: "#1e633f",
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: "Gastos",
            data: gastosMensuales,
            backgroundColor: "rgba(178, 53, 53, 0.75)",
            borderColor: "#991b1b",
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: "Ahorros",
            data: ahorrosMensuales,
            backgroundColor: "rgba(196, 109, 3, 0.75)",
            borderColor: "#854d0e",
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
              color: "#1e293b",
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11,
                weight: "600"
              }
            }
          },
          tooltip: {
            backgroundColor: "#1e293b",
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
              color: "#475569",
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
            }
          },
          y: {
            grid: {
              color: "rgba(222, 212, 194, 0.5)"
            },
            ticks: {
              color: "#475569",
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
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
  }, [ingresosMensuales, gastosMensuales, ahorrosMensuales, anio]);

  return (
    <div className="position-relative w-100" style={{ height: "260px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

