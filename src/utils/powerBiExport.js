import { MESES, DIAS_SEMANA } from "./formatters";

function escapeCSV(val, delimiter) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function formatDecimal(val, isSpanishLocale) {
  const num = Number(val) || 0;
  if (isSpanishLocale) {
    return num.toFixed(2).replace(".", ",");
  }
  return num.toFixed(2);
}

function parseItemDate(item) {
  if (item.fecha) {
    const d = new Date(item.fecha);
    if (!isNaN(d.getTime())) return d;
  }
  if (item.fechaVencimiento) {
    const d = new Date(item.fechaVencimiento);
    if (!isNaN(d.getTime())) return d;
  }
  if (item.createdAt?.toDate) {
    return item.createdAt.toDate();
  }
  if (item.createdAt) {
    const d = new Date(item.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (item.mes && item.anio) {
    const mesIdx = MESES.indexOf(item.mes);
    return new Date(Number(item.anio), mesIdx >= 0 ? mesIdx : 0, 15);
  }
  return new Date();
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function normalizeTransactions(transacciones = [], dolarBlue = 1550) {
  const blue = Number(dolarBlue) > 0 ? Number(dolarBlue) : 1550;

  return transacciones.map((item, idx) => {
    const date = parseItemDate(item);
    const fechaISO = formatDateISO(date);
    const anio = date.getFullYear();
    const mesNum = date.getMonth() + 1;
    const mesNombre = MESES[date.getMonth()] || "Sin Mes";
    const dia = date.getDate();
    const diaSemana = DIAS_SEMANA[date.getDay()] || "N/A";
    const trimestre = `Q${Math.floor(date.getMonth() / 3) + 1}`;
    const semestre = date.getMonth() < 6 ? "S1" : "S2";
    const esFinDeSemana = (date.getDay() === 0 || date.getDay() === 6) ? "SI" : "NO";

    let tipoMovimiento = "Gasto";
    let flujoCaja = "Negativo";
    if (item.tipo === "ingreso") {
      tipoMovimiento = "Ingreso";
      flujoCaja = "Positivo";
    } else if (item.tipo === "ahorro") {
      tipoMovimiento = "Ahorro (Depósito)";
      flujoCaja = "Neutro / Reserva";
    } else if (item.tipo === "extraccion") {
      tipoMovimiento = "Ahorro (Extracción)";
      flujoCaja = "Neutro / Reserva";
    } else if (item.tipo === "gasto") {
      tipoMovimiento = "Gasto";
      flujoCaja = item.estadoPago === "pendiente" ? "Compromiso Pendiente" : "Negativo";
    }

    const monedaOriginal = item.moneda || "ARS";
    const montoOriginal = Number(item.monto || 0);

    let montoARS = 0;
    let montoUSD = 0;
    let cotizacionAplicada = 1.0;

    if (monedaOriginal === "ARS") {
      montoARS = montoOriginal;
      montoUSD = blue > 0 ? (montoOriginal / blue) : 0;
      cotizacionAplicada = 1.0;
    } else if (monedaOriginal === "USD") {
      montoARS = montoOriginal * blue;
      montoUSD = montoOriginal;
      cotizacionAplicada = blue;
    } else if (monedaOriginal === "EUR") {
      const euroEnArs = blue * 1.08;
      montoARS = montoOriginal * euroEnArs;
      montoUSD = montoOriginal * 1.08;
      cotizacionAplicada = euroEnArs;
    } else {
      montoARS = montoOriginal * blue;
      montoUSD = montoOriginal;
      cotizacionAplicada = blue;
    }

    let estadoPago = "N/A";
    if (item.tipo === "gasto") {
      estadoPago = item.estadoPago === "pendiente" ? "Pendiente" : "Pagado";
    }

    const fechaVencimiento = item.fechaVencimiento || "";
    const esVencimiento = Boolean(item.fechaVencimiento) ? "SI" : "NO";
    let diasParaVencimiento = "";
    if (item.fechaVencimiento) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const vDate = new Date(item.fechaVencimiento + "T00:00:00");
      const diff = Math.round((vDate - today) / (1000 * 60 * 60 * 24));
      diasParaVencimiento = isNaN(diff) ? "" : diff;
    }

    return {
      id: item.id || `TX_${anio}_${mesNum}_${idx + 1}`,
      fecha: fechaISO,
      anio,
      mesNum,
      mesNombre,
      trimestre,
      semestre,
      dia,
      diaSemana,
      esFinDeSemana,
      tipoMovimiento,
      flujoCaja,
      categoria: item.categoria || "Sin categoría",
      descripcion: item.descripcion || "",
      montoOriginal,
      monedaOriginal,
      cotizacionAplicada,
      montoARS,
      montoUSD,
      estadoPago,
      fechaVencimiento,
      esVencimiento,
      diasParaVencimiento
    };
  });
}

export function generatePowerBiFlatCSV(transacciones = [], dolarBlue = 1550, delimiter = ";") {
  const isSpanish = delimiter === ";";
  const normalized = normalizeTransactions(transacciones, dolarBlue);

  const headers = [
    "ID_Transaccion",
    "Fecha",
    "Anio",
    "Mes_Numero",
    "Mes_Nombre",
    "Trimestre",
    "Semestre",
    "Dia",
    "Dia_Semana",
    "Es_Fin_De_Semana",
    "Tipo_Movimiento",
    "Flujo_Caja",
    "Categoria",
    "Descripcion",
    "Monto_Original",
    "Moneda_Original",
    "Tipo_Cambio_ARS",
    "Monto_ARS_Equivalente",
    "Monto_USD_Equivalente",
    "Estado_Pago",
    "Fecha_Vencimiento",
    "Es_Vencimiento",
    "Dias_Para_Vencimiento"
  ];

  const rows = normalized.map((r) => {
    return [
      escapeCSV(r.id, delimiter),
      escapeCSV(r.fecha, delimiter),
      r.anio,
      r.mesNum,
      escapeCSV(r.mesNombre, delimiter),
      escapeCSV(r.trimestre, delimiter),
      escapeCSV(r.semestre, delimiter),
      r.dia,
      escapeCSV(r.diaSemana, delimiter),
      escapeCSV(r.esFinDeSemana, delimiter),
      escapeCSV(r.tipoMovimiento, delimiter),
      escapeCSV(r.flujoCaja, delimiter),
      escapeCSV(r.categoria, delimiter),
      escapeCSV(r.descripcion, delimiter),
      formatDecimal(r.montoOriginal, isSpanish),
      escapeCSV(r.monedaOriginal, delimiter),
      formatDecimal(r.cotizacionAplicada, isSpanish),
      formatDecimal(r.montoARS, isSpanish),
      formatDecimal(r.montoUSD, isSpanish),
      escapeCSV(r.estadoPago, delimiter),
      escapeCSV(r.fechaVencimiento, delimiter),
      escapeCSV(r.esVencimiento, delimiter),
      r.diasParaVencimiento !== "" ? r.diasParaVencimiento : ""
    ].join(delimiter);
  });

  return [headers.join(delimiter), ...rows].join("\r\n");
}

export function generateStarSchemaFactCSV(transacciones = [], dolarBlue = 1550, delimiter = ";") {
  const isSpanish = delimiter === ";";
  const normalized = normalizeTransactions(transacciones, dolarBlue);

  const headers = [
    "ID_Transaccion",
    "Fecha",
    "ID_Categoria",
    "Tipo_Movimiento",
    "Monto_Original",
    "Moneda_Original",
    "Tipo_Cambio_ARS",
    "Monto_ARS_Equivalente",
    "Monto_USD_Equivalente",
    "Estado_Pago",
    "Fecha_Vencimiento",
    "Es_Vencimiento"
  ];

  const rows = normalized.map((r) => {
    return [
      escapeCSV(r.id, delimiter),
      escapeCSV(r.fecha, delimiter),
      escapeCSV(r.categoria.toLowerCase().replace(/\s+/g, "_"), delimiter),
      escapeCSV(r.tipoMovimiento, delimiter),
      formatDecimal(r.montoOriginal, isSpanish),
      escapeCSV(r.monedaOriginal, delimiter),
      formatDecimal(r.cotizacionAplicada, isSpanish),
      formatDecimal(r.montoARS, isSpanish),
      formatDecimal(r.montoUSD, isSpanish),
      escapeCSV(r.estadoPago, delimiter),
      escapeCSV(r.fechaVencimiento, delimiter),
      escapeCSV(r.esVencimiento, delimiter)
    ].join(delimiter);
  });

  return [headers.join(delimiter), ...rows].join("\r\n");
}

export function generateStarSchemaDimCategoriasCSV(transacciones = [], delimiter = ";") {
  const catSet = new Set();
  (transacciones || []).forEach(t => {
    if (t.categoria) catSet.add(t.categoria.trim());
  });

  const headers = ["ID_Categoria", "Nombre_Categoria", "Tipo_Movimiento_Sugerido", "Grupo_Financiero"];
  const rows = Array.from(catSet).sort().map(cat => {
    const id = cat.toLowerCase().replace(/\s+/g, "_");
    const grupo = ["Supermercado", "Servicios", "Alquiler", "Impuestos"].includes(cat) ? "Fijo / Esencial" : "Variable / Estilo de Vida";
    return [
      escapeCSV(id, delimiter),
      escapeCSV(cat, delimiter),
      escapeCSV("Operativo", delimiter),
      escapeCSV(grupo, delimiter)
    ].join(delimiter);
  });

  return [headers.join(delimiter), ...rows].join("\r\n");
}

export function generateStarSchemaDimTiempoCSV(transacciones = [], delimiter = ";") {
  const normalized = normalizeTransactions(transacciones);
  const dateSet = new Set();
  normalized.forEach(n => dateSet.add(n.fecha));

  const headers = ["Fecha", "Anio", "Mes_Num", "Mes_Nombre", "Trimestre", "Semestre", "Dia", "Dia_Semana", "Es_Fin_De_Semana"];
  const rows = Array.from(dateSet).sort().map(f => {
    const d = new Date(f + "T00:00:00");
    const anio = d.getFullYear();
    const mesNum = d.getMonth() + 1;
    const mesNombre = MESES[d.getMonth()] || "";
    const dia = d.getDate();
    const diaSemana = DIAS_SEMANA[d.getDay()] || "";
    const trimestre = `Q${Math.floor(d.getMonth() / 3) + 1}`;
    const semestre = d.getMonth() < 6 ? "S1" : "S2";
    const esFin = (d.getDay() === 0 || d.getDay() === 6) ? "SI" : "NO";
    return [
      escapeCSV(f, delimiter),
      anio,
      mesNum,
      escapeCSV(mesNombre, delimiter),
      escapeCSV(trimestre, delimiter),
      escapeCSV(semestre, delimiter),
      dia,
      escapeCSV(diaSemana, delimiter),
      escapeCSV(esFin, delimiter)
    ].join(delimiter);
  });

  return [headers.join(delimiter), ...rows].join("\r\n");
}

export function triggerDownload(filename, textContent) {
  const blob = new Blob(["\uFEFF" + textContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const DAX_MEASURES = [
  {
    id: "total_ingresos",
    nombre: "Total Ingresos",
    categoria: "Flujo de Fondos",
    descripcion: "Suma consolidada de todos los ingresos percibidos en pesos argentinos equivalentes.",
    formula: `Total Ingresos = 
CALCULATE(
    SUM(Fact_Transacciones[Monto_ARS_Equivalente]),
    Fact_Transacciones[Tipo_Movimiento] = "Ingreso"
)`
  },
  {
    id: "total_gastos",
    nombre: "Total Gastos Pagados",
    categoria: "Flujo de Fondos",
    descripcion: "Gastos efectivamente liquidados y pagados, excluyendo compromisos futuros.",
    formula: `Total Gastos Pagados = 
CALCULATE(
    SUM(Fact_Transacciones[Monto_ARS_Equivalente]),
    Fact_Transacciones[Tipo_Movimiento] = "Gasto",
    Fact_Transacciones[Estado_Pago] = "Pagado"
)`
  },
  {
    id: "vencimientos_pendientes",
    nombre: "Vencimientos Pendientes",
    categoria: "Pasivos & Compromisos",
    descripcion: "Total de facturas, vencimientos y servicios aún pendientes de pago.",
    formula: `Vencimientos Pendientes = 
CALCULATE(
    SUM(Fact_Transacciones[Monto_ARS_Equivalente]),
    Fact_Transacciones[Tipo_Movimiento] = "Gasto",
    Fact_Transacciones[Estado_Pago] = "Pendiente"
)`
  },
  {
    id: "cash_flow_neto",
    nombre: "Cash Flow Neto (Superávit/Déficit)",
    categoria: "Rentabilidad",
    descripcion: "Diferencia neta entre los ingresos percibidos y los gastos liquidados.",
    formula: `Cash Flow Neto = [Total Ingresos] - [Total Gastos Pagados]`
  },
  {
    id: "tasa_ahorro",
    nombre: "Tasa de Ahorro (%)",
    categoria: "Rentabilidad",
    descripcion: "Porcentaje de los ingresos que permanece como excedente o reserva.",
    formula: `Tasa de Ahorro = 
DIVIDE([Cash Flow Neto], [Total Ingresos], 0)`
  },
  {
    id: "gasto_promedio_diario",
    nombre: "Gasto Promedio Diario (Burn Rate)",
    categoria: "Eficiencia",
    descripcion: "Consumo diario promedio sobre las fechas con transacciones activas.",
    formula: `Gasto Promedio Diario = 
DIVIDE(
    [Total Gastos Pagados],
    DISTINCTCOUNT(Fact_Transacciones[Fecha]),
    0
)`
  },
  {
    id: "variacion_mom",
    nombre: "Variación MoM Gastos (%)",
    categoria: "Inteligencia Temporal",
    descripcion: "Crecimiento o reducción porcentual de egresos respecto al mes inmediatamente anterior.",
    formula: `Variacion MoM Gastos = 
VAR GastoActual = [Total Gastos Pagados]
VAR GastoMesAnterior = CALCULATE(
    [Total Gastos Pagados],
    DATEADD(Dim_Tiempo[Fecha], -1, MONTH)
)
RETURN
DIVIDE(GastoActual - GastoMesAnterior, GastoMesAnterior, 0)`
  },
  {
    id: "cash_flow_usd",
    nombre: "Cash Flow en Dólares (USD)",
    categoria: "Bimonetario",
    descripcion: "Resultado financiero neto convertido y calculado en moneda dura (USD).",
    formula: `Cash Flow USD = 
CALCULATE(
    SUM(Fact_Transacciones[Monto_USD_Equivalente]),
    Fact_Transacciones[Tipo_Movimiento] = "Ingreso"
) - CALCULATE(
    SUM(Fact_Transacciones[Monto_USD_Equivalente]),
    Fact_Transacciones[Tipo_Movimiento] = "Gasto",
    Fact_Transacciones[Estado_Pago] = "Pagado"
)`
  }
];

export const POWER_QUERY_M_TEMPLATE = `let
    RutaArchivo = "C:\\FinTrack\\FinTrack_PowerBI_Dataset.csv",
    Origen = Csv.Document(File.Contents(RutaArchivo),[Delimiter=";", Columns=23, Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    EncabezadosPromovidos = Table.PromoteHeaders(Origen, [PromoteAllScalars=true]),
    TipoCambiado = Table.TransformColumnTypes(EncabezadosPromovidos,{
        {"ID_Transaccion", type text},
        {"Fecha", type date},
        {"Anio", Int64.Type},
        {"Mes_Numero", Int64.Type},
        {"Mes_Nombre", type text},
        {"Trimestre", type text},
        {"Semestre", type text},
        {"Dia", Int64.Type},
        {"Dia_Semana", type text},
        {"Es_Fin_De_Semana", type text},
        {"Tipo_Movimiento", type text},
        {"Flujo_Caja", type text},
        {"Categoria", type text},
        {"Descripcion", type text},
        {"Monto_Original", type number},
        {"Moneda_Original", type text},
        {"Tipo_Cambio_ARS", type number},
        {"Monto_ARS_Equivalente", type number},
        {"Monto_USD_Equivalente", type number},
        {"Estado_Pago", type text},
        {"Fecha_Vencimiento", type text},
        {"Es_Vencimiento", type text},
        {"Dias_Para_Vencimiento", type text}
    })
in
    TipoCambiado`;
