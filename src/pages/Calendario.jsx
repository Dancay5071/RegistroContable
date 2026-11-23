import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePrivacy } from "../context/PrivacyContext";
import { useQuickMovement } from "../context/QuickMovementContext";
import { useVencimientos } from "../context/VencimientosContext";
import { getDemoGastos, getDemoIngresos } from "../services/demoData";
import { getGastosUser, getIngresosUser } from "../services/dbService";
import {
  MESES,
  DIAS_SEMANA,
  formatoMoneda,
  getDiasEnMes,
  getPrimerDiaSemana,
  formatoFechaLarga,
  getDiasRestantes,
  formatoFechaVencimiento
} from "../utils/formatters";
import { getCategoriaGasto, getCategoriaIngreso } from "../utils/categories";
import Loader from "../components/Loader";

const NOMBRES_DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function Calendario() {
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const { isPrivate, maskAmount } = usePrivacy();
  const { openQuickModal, movementCounter } = useQuickMovement();
  const { marcarComoPagado, openVencimientosModal } = useVencimientos();

  const hoy = new Date();
  const hoyAnio = hoy.getFullYear();
  const hoyMesIdx = hoy.getMonth();
  const hoyDia = hoy.getDate();

  const [mesIdx, setMesIdx] = useState(hoyMesIdx);
  const [anio, setAnio] = useState(hoyAnio);
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoyDia);
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const [gastos, setGastos] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(false);

  const mesNombre = MESES[mesIdx];

  const cargarMovimientos = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (isDemo) {
        const gList = getDemoGastos(mesNombre, anio);
        const iList = getDemoIngresos(mesNombre, anio);
        setGastos(gList || []);
        setIngresos(iList || []);
      } else {
        const [gList, iList] = await Promise.all([
          getGastosUser(user.uid, mesNombre, anio),
          getIngresosUser(user.uid, mesNombre, anio)
        ]);
        setGastos(gList || []);
        setIngresos(iList || []);
      }
    } catch (err) {
      console.error("Error al cargar movimientos en calendario:", err);
      showToast("Error al cargar eventos del calendario: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, mesNombre, anio, showToast]);

  useEffect(() => {
    cargarMovimientos();
  }, [cargarMovimientos, movementCounter]);

  const handleMesAnterior = () => {
    if (mesIdx === 0) {
      setMesIdx(11);
      setAnio((prev) => prev - 1);
    } else {
      setMesIdx((prev) => prev - 1);
    }
    setDiaSeleccionado(1);
  };

  const handleMesSiguiente = () => {
    if (mesIdx === 11) {
      setMesIdx(0);
      setAnio((prev) => prev + 1);
    } else {
      setMesIdx((prev) => prev + 1);
    }
    setDiaSeleccionado(1);
  };

  const handleIrAHoy = () => {
    setMesIdx(hoyMesIdx);
    setAnio(hoyAnio);
    setDiaSeleccionado(hoyDia);
  };

  const eventosPorDia = useMemo(() => {
    const mapa = {};
    const totalDias = getDiasEnMes(mesIdx, anio);
    for (let d = 1; d <= totalDias; d++) {
      mapa[d] = [];
    }

    const extraerDia = (item, esVencimiento = false) => {
      if (esVencimiento && item.fechaVencimiento) {
        const partes = item.fechaVencimiento.split("-");
        if (partes.length === 3) {
          const y = Number(partes[0]);
          const m = Number(partes[1]) - 1;
          const d = Number(partes[2]);
          if (y === anio && m === mesIdx) return d;
        }
      }
      if (item.fecha) {
        const parseada = new Date(item.fecha);
        if (!isNaN(parseada.getTime())) {
          if (parseada.getFullYear() === anio && parseada.getMonth() === mesIdx) {
            return parseada.getDate();
          }
        }
      }
      if (item.createdAt) {
        let parseada = null;
        if (typeof item.createdAt.toDate === "function") {
          parseada = item.createdAt.toDate();
        } else if (typeof item.createdAt === "string") {
          parseada = new Date(item.createdAt);
        }
        if (parseada && !isNaN(parseada.getTime())) {
          if (parseada.getFullYear() === anio && parseada.getMonth() === mesIdx) {
            return parseada.getDate();
          }
        }
      }
      return 1;
    };

    gastos.forEach((g) => {
      const esPendiente = g.estadoPago === "pendiente";
      const dia = extraerDia(g, esPendiente || Boolean(g.fechaVencimiento));
      if (mapa[dia]) {
        mapa[dia].push({
          ...g,
          tipoEvento: esPendiente ? "vencimiento" : "gasto",
          dia
        });
      }
    });

    ingresos.forEach((ing) => {
      const dia = extraerDia(ing, false);
      if (mapa[dia]) {
        mapa[dia].push({
          ...ing,
          tipoEvento: "ingreso",
          dia
        });
      }
    });

    return mapa;
  }, [gastos, ingresos, mesIdx, anio]);

  const { totalIngresos, totalGastosPagados, totalVencimientosPendientes, balanceNeto, totalEventos } = useMemo(() => {
    let tIng = 0;
    let tGasto = 0;
    let tVenc = 0;
    let count = 0;

    Object.values(eventosPorDia).forEach((lista) => {
      lista.forEach((ev) => {
        count++;
        const monto = Number(ev.monto || ev.montoBruto || 0);
        if (ev.tipoEvento === "ingreso") {
          tIng += monto;
        } else if (ev.tipoEvento === "vencimiento") {
          tVenc += monto;
        } else {
          tGasto += monto;
        }
      });
    });

    return {
      totalIngresos: tIng,
      totalGastosPagados: tGasto,
      totalVencimientosPendientes: tVenc,
      balanceNeto: tIng - tGasto,
      totalEventos: count
    };
  }, [eventosPorDia]);

  const totalDiasMes = getDiasEnMes(mesIdx, anio);
  const primerDiaOffset = getPrimerDiaSemana(mesIdx, anio);
  const celdasTotales = Math.ceil((primerDiaOffset + totalDiasMes) / 7) * 7;

  const eventosDiaSeleccionado = useMemo(() => {
    const lista = eventosPorDia[diaSeleccionado] || [];
    if (filtroTipo === "todos") return lista;
    if (filtroTipo === "vencimientos") return lista.filter((e) => e.tipoEvento === "vencimiento");
    if (filtroTipo === "gastos") return lista.filter((e) => e.tipoEvento === "gasto");
    if (filtroTipo === "ingresos") return lista.filter((e) => e.tipoEvento === "ingreso");
    return lista;
  }, [eventosPorDia, diaSeleccionado, filtroTipo]);

  const fechaSeleccionadaStr = useMemo(() => {
    const mStr = String(mesIdx + 1).padStart(2, "0");
    const dStr = String(diaSeleccionado).padStart(2, "0");
    return `${anio}-${mStr}-${dStr}`;
  }, [anio, mesIdx, diaSeleccionado]);

  useEffect(() => {
    const handleCalendarKeys = (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT");
      if (isInput) return;
      if (document.querySelector(".modal.show, [role='dialog']")) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        setDiaSeleccionado((prev) => (prev < totalDiasMes ? prev + 1 : 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setDiaSeleccionado((prev) => (prev > 1 ? prev - 1 : totalDiasMes));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setDiaSeleccionado((prev) => Math.min(totalDiasMes, prev + 7));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setDiaSeleccionado((prev) => Math.max(1, prev - 7));
      }
    };

    window.addEventListener("keydown", handleCalendarKeys);
    return () => window.removeEventListener("keydown", handleCalendarKeys);
  }, [totalDiasMes]);

  return (
    <div className="fade-in d-flex flex-column align-items-center flex-grow-1 p-3">
      <div className="container d-flex flex-column align-items-center" style={{ maxWidth: "1120px" }}>

        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between w-100 mb-3 gap-2">
          <div>
            <h2 className="h4 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <i className="bi bi-calendar3 text-primary"></i>
              Calendario Financiero
            </h2>
            <span className="text-muted small">
              Visualiza tus vencimientos, ingresos y gastos programados día a día.
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold shadow-sm"
              onClick={handleIrAHoy}
              title="Volver al día actual"
            >
              <i className="bi bi-geo-alt me-1 text-danger"></i> Hoy
            </button>
            <button
              type="button"
              className="btn btn-sm btn-success rounded-pill px-3 fw-semibold shadow-sm d-flex align-items-center gap-1"
              onClick={() => openQuickModal("gasto")}
            >
              <i className="bi bi-plus-lg"></i>
              <span>Nuevo Movimiento</span>
            </button>
          </div>
        </div>

        <div className="row g-2 w-100 mb-4">
          <div className="col-6 col-md-3">
            <div className="p-3 rounded-4 border shadow-sm h-100" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted fw-semibold">Ingresos</span>
                <i className="bi bi-arrow-up-circle-fill text-success fs-5"></i>
              </div>
              <div className={`h5 fw-bold mb-0 text-success ${isPrivate ? "privacy-masked" : ""}`}>
                {maskAmount(formatoMoneda(totalIngresos))}
              </div>
              <span className="text-muted" style={{ fontSize: "0.72rem" }}>Cobros de {mesNombre}</span>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 rounded-4 border shadow-sm h-100" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted fw-semibold">Gastos Pagados</span>
                <i className="bi bi-arrow-down-circle-fill text-danger fs-5"></i>
              </div>
              <div className={`h5 fw-bold mb-0 text-danger ${isPrivate ? "privacy-masked" : ""}`}>
                {maskAmount(formatoMoneda(totalGastosPagados))}
              </div>
              <span className="text-muted" style={{ fontSize: "0.72rem" }}>Salidas registradas</span>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="p-3 rounded-4 border shadow-sm h-100 cursor-pointer transition-all"
              style={{
                backgroundColor: totalVencimientosPendientes > 0 ? "var(--badge-warning-bg)" : "var(--bg-card)",
                borderColor: totalVencimientosPendientes > 0 ? "var(--badge-warning-border)" : "var(--border-subtle)"
              }}
              onClick={openVencimientosModal}
              title="Clic para ver o saldar compromisos pendientes"
            >
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted fw-semibold">Vencimientos</span>
                <i className="bi bi-bell-fill text-warning fs-5"></i>
              </div>
              <div className={`h5 fw-bold mb-0 text-warning ${isPrivate ? "privacy-masked" : ""}`}>
                {maskAmount(formatoMoneda(totalVencimientosPendientes))}
              </div>
              <span className="text-muted" style={{ fontSize: "0.72rem" }}>Facturas por pagar</span>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 rounded-4 border shadow-sm h-100" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted fw-semibold">Balance Neto</span>
                <i className={`bi ${balanceNeto >= 0 ? 'bi-check-circle-fill text-primary' : 'bi-dash-circle-fill text-danger'} fs-5`}></i>
              </div>
              <div className={`h5 fw-bold mb-0 ${balanceNeto >= 0 ? 'text-primary' : 'text-danger'} ${isPrivate ? "privacy-masked" : ""}`}>
                {maskAmount(formatoMoneda(balanceNeto))}
              </div>
              <span className="text-muted" style={{ fontSize: "0.72rem" }}>Resultado del período</span>
            </div>
          </div>
        </div>

        <div className="w-100 d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 p-2 rounded-4 border shadow-sm" style={{ backgroundColor: "var(--bg-card)" }}>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0"
              style={{ width: "32px", height: "32px" }}
              onClick={handleMesAnterior}
              title="Mes anterior"
              aria-label="Mes anterior"
            >
              <i className="bi bi-chevron-left"></i>
            </button>

            <span className="h6 fw-bold text-dark mb-0 px-2 select-none">
              {mesNombre} {anio}
            </span>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0"
              style={{ width: "32px", height: "32px" }}
              onClick={handleMesSiguiente}
              title="Mes siguiente"
              aria-label="Mes siguiente"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          <div className="d-flex flex-wrap align-items-center p-1 rounded-4 gap-1" style={{ backgroundColor: "var(--bg-card-alt)", border: "1px solid var(--border-subtle)" }}>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${filtroTipo === "todos" ? "btn-primary text-white shadow-sm" : "text-muted"}`}
              onClick={() => setFiltroTipo("todos")}
            >
              Todos ({totalEventos})
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${filtroTipo === "vencimientos" ? "btn-warning text-dark shadow-sm" : "text-muted"}`}
              onClick={() => setFiltroTipo("vencimientos")}
            >
              🔔 Vencimientos
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${filtroTipo === "gastos" ? "btn-danger text-white shadow-sm" : "text-muted"}`}
              onClick={() => setFiltroTipo("gastos")}
            >
              🔻 Gastos
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${filtroTipo === "ingresos" ? "btn-success text-white shadow-sm" : "text-muted"}`}
              onClick={() => setFiltroTipo("ingresos")}
            >
              🔺 Ingresos
            </button>
          </div>
        </div>

        <div className="row g-3 w-100 mb-4">
          <div className="col-12 col-lg-8">
            <div className="principal p-3 p-md-4 rounded-4 shadow-sm border h-100">

              <div className="row g-1 text-center mb-2 pb-2 border-bottom">
                {NOMBRES_DIAS_CORTOS.map((diaNom) => (
                  <div key={diaNom} className="col text-muted small fw-bold text-uppercase" style={{ fontSize: "0.75rem" }}>
                    {diaNom}
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="py-5 text-center">
                  <Loader message="Cargando calendario..." />
                </div>
              ) : (
                <div className="row g-1">
                  {Array.from({ length: celdasTotales }).map((_, idx) => {
                    const diaNum = idx - primerDiaOffset + 1;
                    const esDiaValido = diaNum >= 1 && diaNum <= totalDiasMes;
                    const esHoy = esDiaValido && anio === hoyAnio && mesIdx === hoyMesIdx && diaNum === hoyDia;
                    const esSeleccionado = esDiaValido && diaNum === diaSeleccionado;

                    const eventos = esDiaValido ? (eventosPorDia[diaNum] || []) : [];
                    const vencimientosEnDia = eventos.filter((e) => e.tipoEvento === "vencimiento");
                    const gastosEnDia = eventos.filter((e) => e.tipoEvento === "gasto");
                    const ingresosEnDia = eventos.filter((e) => e.tipoEvento === "ingreso");

                    let sumaDia = 0;
                    eventos.forEach((ev) => {
                      const m = Number(ev.monto || ev.montoBruto || 0);
                      if (ev.tipoEvento === "ingreso") sumaDia += m;
                      else if (ev.tipoEvento === "gasto") sumaDia -= m;
                    });

                    if (!esDiaValido) {
                      return (
                        <div
                          key={`empty_${idx}`}
                          className="col-12/7 calendar-cell-col"
                          style={{ width: "14.285%" }}
                        >
                          <div
                            className="p-1 rounded-3 calendar-cell opacity-25"
                            style={{ minHeight: "84px", backgroundColor: "transparent" }}
                          ></div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`dia_${diaNum}`}
                        className="calendar-cell-col"
                        style={{ width: "14.285%" }}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label={`Día ${diaNum} de ${mesNombre} de ${anio}. ${eventos.length} eventos.`}
                          aria-pressed={esSeleccionado}
                          className={`p-1 p-md-2 rounded-3 border calendar-cell cursor-pointer transition-all d-flex flex-column justify-content-between ${esHoy ? 'calendar-cell-today' : ''} ${esSeleccionado ? 'calendar-cell-selected shadow-sm' : ''}`}
                          style={{
                            minHeight: "84px",
                            backgroundColor: esSeleccionado ? "var(--bg-card-alt)" : "var(--bg-card)",
                            borderColor: esSeleccionado ? "var(--border-focus)" : "var(--border-subtle)"
                          }}
                          onClick={() => setDiaSeleccionado(diaNum)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setDiaSeleccionado(diaNum);
                            }
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span
                              className={`small fw-bold d-inline-flex align-items-center justify-content-center rounded-circle ${esHoy ? 'bg-primary text-white' : 'text-dark'}`}
                              style={{ width: "24px", height: "24px", fontSize: "0.75rem" }}
                            >
                              {diaNum}
                            </span>

                            {eventos.length > 0 && (
                              <div className="d-flex align-items-center gap-1">
                                {vencimientosEnDia.length > 0 && (
                                  <span className="dot dot-amber" title={`${vencimientosEnDia.length} vencimientos`}></span>
                                )}
                                {ingresosEnDia.length > 0 && (
                                  <span className="dot dot-green" title={`${ingresosEnDia.length} ingresos`}></span>
                                )}
                                {gastosEnDia.length > 0 && (
                                  <span className="dot dot-red" title={`${gastosEnDia.length} gastos`}></span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="d-flex flex-column gap-1 overflow-hidden" style={{ maxHeight: "48px" }}>
                            {eventos.slice(0, 2).map((ev, eIdx) => {
                              const esVenc = ev.tipoEvento === "vencimiento";
                              const esIng = ev.tipoEvento === "ingreso";
                              let badgeClass = "badge-gasto-pastel";
                              if (esVenc) badgeClass = "badge-warning-pastel";
                              else if (esIng) badgeClass = "badge-success-pastel";

                              return (
                                <div
                                  key={ev.id || eIdx}
                                  className={`calendar-event-pill text-truncate px-1 py-0 rounded small ${badgeClass}`}
                                  style={{ fontSize: "0.65rem", lineHeight: "1.2" }}
                                  title={`${ev.descripcion}: ${formatoMoneda(ev.monto || ev.montoBruto)}`}
                                >
                                  {esVenc ? "🔔 " : (esIng ? "+$" : "-$")}
                                  {Math.round((ev.monto || ev.montoBruto) / 1000)}k
                                </div>
                              );
                            })}

                            {eventos.length > 2 && (
                              <span className="text-muted text-center" style={{ fontSize: "0.62rem" }}>
                                +{eventos.length - 2} más
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="principal p-3 p-md-4 rounded-4 shadow-sm border h-100 d-flex flex-column">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <div>
                  <h5 className="h6 text-muted text-uppercase fw-bold mb-0 tracking-wider">
                    Detalle del Día
                  </h5>
                  <span className="fw-bold text-dark small">
                    {formatoFechaLarga(fechaSeleccionadaStr)}
                  </span>
                </div>
                <span className="badge px-2 py-1 rounded-pill small border" style={{ backgroundColor: "var(--bg-card-alt)", color: "var(--text-main)" }}>
                  {eventosDiaSeleccionado.length} {eventosDiaSeleccionado.length === 1 ? 'movimiento' : 'movimientos'}
                </span>
              </div>

              <div className="flex-grow-1 overflow-auto" style={{ maxHeight: "380px" }}>
                {eventosDiaSeleccionado.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
                      style={{ width: "54px", height: "54px", backgroundColor: "var(--bg-card-alt)", color: "var(--text-muted)" }}
                    >
                      <i className="bi bi-calendar2-check fs-3"></i>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Sin movimientos este día</h6>
                    <p className="text-muted small mb-3">
                      No hay cobros, salidas ni vencimientos programados para esta fecha.
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success rounded-pill px-3 fw-semibold shadow-sm"
                      onClick={() => openQuickModal("gasto")}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Agregar movimiento
                    </button>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {eventosDiaSeleccionado.map((ev, idx) => {
                      const esVenc = ev.tipoEvento === "vencimiento";
                      const esIng = ev.tipoEvento === "ingreso";
                      const cat = esIng ? getCategoriaIngreso(ev.categoria) : getCategoriaGasto(ev.categoria);
                      const monto = Number(ev.monto || ev.montoBruto || 0);

                      let badgeText = "Gasto Pagado";
                      let badgeClass = "badge-danger-pastel";
                      if (esVenc) {
                        const dias = getDiasRestantes(ev.fechaVencimiento);
                        if (dias !== null && dias < 0) {
                          badgeText = `¡Vencido (${Math.abs(dias)}d)!`;
                          badgeClass = "bg-danger text-white";
                        } else if (dias === 0) {
                          badgeText = "¡Vence Hoy!";
                          badgeClass = "bg-warning text-dark fw-bold";
                        } else {
                          badgeText = `Vence en ${dias} días`;
                          badgeClass = "badge-warning-pastel";
                        }
                      } else if (esIng) {
                        badgeText = "Ingreso Percibido";
                        badgeClass = "badge-success-pastel";
                      }

                      return (
                        <div
                          key={ev.id || idx}
                          className="p-3 rounded-3 border d-flex flex-column gap-2"
                          style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-subtle)" }}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: "32px", height: "32px", backgroundColor: cat.bg, color: cat.color }}
                              >
                                <i className={`bi ${cat.icon}`}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark small">{ev.descripcion}</div>
                                <span
                                  className="badge px-2 py-0 rounded-pill"
                                  style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.border}`, fontSize: "0.68rem" }}
                                >
                                  {cat.nombre}
                                </span>
                              </div>
                            </div>

                            <div className="text-end">
                              <div className={`fw-bold ${esIng ? 'text-success' : 'text-danger'} ${isPrivate ? "privacy-masked" : ""}`}>
                                {esIng ? "+" : "-"}{maskAmount(formatoMoneda(monto))}
                              </div>
                              <span className={`badge px-2 py-0 rounded-pill small ${badgeClass}`} style={{ fontSize: "0.68rem" }}>
                                {badgeText}
                              </span>
                            </div>
                          </div>

                          {esVenc && (
                            <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-1">
                              <span className="text-muted small" style={{ fontSize: "0.72rem" }}>
                                Vence: <strong>{formatoFechaVencimiento(ev.fechaVencimiento)}</strong>
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-success rounded-pill px-3 fw-semibold shadow-sm"
                                onClick={() => marcarComoPagado(ev)}
                              >
                                <i className="bi bi-check2-circle me-1"></i> Pagar Ahora
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 border-top mt-3 d-flex align-items-center justify-content-between">
                <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                  <i className="bi bi-info-circle me-1"></i> Selecciona otro día en el calendario para ver su detalle.
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-success rounded-pill px-3 fw-semibold"
                  onClick={() => openQuickModal("gasto")}
                >
                  <i className="bi bi-plus-lg me-1"></i> Añadir
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
