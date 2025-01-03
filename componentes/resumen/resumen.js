
import { db, gastosPorMes, ingresosPorMes, ahorrosPorMes } from "../utilidades/firebase.js"; 
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  setupYearSelect();
});

function setupYearSelect() {
  const yearSelect = document.getElementById("anioSelect");
  if (yearSelect) {
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = `
      <option value="${currentYear - 1}">${currentYear - 1}</option>
      <option value="${currentYear}" selected>${currentYear}</option>
      <option value="${currentYear + 1}">${currentYear + 1}</option>
    `;
  } else {
    console.error("El elemento yearSelect no está presente en el DOM.");
  }
}

window.resumenAnual = resumenAnual;

async function resumenAnual() {
  const loader = document.getElementById('loader');
  const resumenAnual = document.getElementById('resumenAnual');

  // Mostrar el loader y limpiar el contenido previo
  loader.style.display = 'block';
  resumenAnual.innerHTML = '';

  let year = new Date().getFullYear();
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  let contenido = `
      <table class="table table-striped table-hover">
          <thead>
              <tr>
                  <th>Meses</th>
                  ${meses.map(mes => `<th>${mes}</th>`).join('')}
                  <th>Total Anual</th>
              </tr>
          </thead>
          <tbody>
  `;

  let totalAnualIngresos = 0;
  let totalAnualGastos = 0;
  let totalAnualAhorros = 0;
  let totalRestoMensual = 0;

  let ingresosMensuales = [];
  let gastosMensuales = [];
  let ahorrosMensuales = [];
  let restosMensuales = [0]; 

  //  obtener los ingresos y gastos para cada mes
  for (let mes of meses) {
     let claveMesAño = `${mes}_${year}`;
     let ingresosMesDoc = doc(ingresosPorMes, claveMesAño); 
     let gastosMesDoc = doc(gastosPorMes, claveMesAño); 
     let ahorrosMesDoc = doc(ahorrosPorMes, claveMesAño);

     // Obtener ingresos para cada mes
     try { 
      const ingresosSnap = await getDoc(ingresosMesDoc); 
      let ingresosMes = ingresosSnap.exists() ? ingresosSnap.data().ingresos || [] : []; 
      let sumaIngresos = ingresosMes.reduce((acc, ingreso) => acc + ingreso.monto, 0); 
      ingresosMensuales.push(sumaIngresos); 
      totalAnualIngresos += sumaIngresos; 
    } catch (error) { 
      console.error(`Error al obtener ingresos para ${mes}:`, error);
      ingresosMensuales.push(0); 
    }

    // Obtener gastos para cada mes
    try { 
      const gastosSnap = await getDoc(gastosMesDoc); 
      let gastosMes = gastosSnap.exists() ? gastosSnap.data().gastos || [] : []; 
      let sumaGastos = gastosMes.reduce((acc, gasto) => acc + gasto.monto, 0); 
      gastosMensuales.push(sumaGastos); 
      totalAnualGastos += sumaGastos; 
    } catch (error) { 
      console.error(`Error al obtener gastos para ${mes}:`, error); 
      gastosMensuales.push(0); 
    }
    
    // Obtener ahorros para c/ mes
    try { 
      const ahorrosSnap = await getDoc(ahorrosMesDoc); 
      let totalAhorrosMes = ahorrosSnap.exists() ? ahorrosSnap.data().totalAhorros || 0 : 0; 
      ahorrosMensuales.push(totalAhorrosMes); 
      totalAnualAhorros += totalAhorrosMes; 
    } catch (error) { 
      console.error(`Error al obtener ahorros para ${mes}:`, error); 
      ahorrosMensuales.push(0); 
    }
    
  }

  contenido += `<tr><td>Resto Mes Anterior</td>`;
for (let i = 0; i < meses.length; i++) {
  let ingresoMes = ingresosMensuales[i] || 0;
  let gastoMes = gastosMensuales[i] || 0;
  
  let restoMesAnterior = i === 0 
    ? restosMensuales[0] 
    : ingresosMensuales[i - 1] - gastosMensuales[i - 1] + restosMensuales[i - 1];
    
  restosMensuales[i] = restoMesAnterior;
  
  
  contenido += `<td>$${formatoNumber(restoMesAnterior)}</td>`;
}
contenido += `<td>-</td></tr>`;



  // Fila de "Ingresos"
  contenido += `<tr><td>Ingresos</td>`;
  for (let i = 0; i < meses.length; i++) {
    contenido += `<td>$${formatoNumber(ingresosMensuales[i])}</td>`;
  }
  contenido += `<td>$${formatoNumber(totalAnualIngresos)}</td></tr>`;

  // Fila de "Gastos"
  contenido += `<tr><td>Gastos</td>`;
  for (let i = 0; i < meses.length; i++) {
    contenido += `<td>$${formatoNumber(gastosMensuales[i])}</td>`;
  }
  contenido += `<td>$${formatoNumber(totalAnualGastos)}</td></tr>`;
  // Fila de "Ahorros"
  contenido += `<tr><td>Ahorros</td>`;
for (let i = 0; i < meses.length; i++) {
  contenido += `<td>$${formatoNumber(ahorrosMensuales[i])}</td>`;
}
contenido += `<td>$${formatoNumber(totalAnualAhorros)}</td></tr>`;

  contenido += `<tr><td>Resto Total</td>`;
for (let i = 0; i < meses.length; i++) {
  let ingresoMes = ingresosMensuales[i] || 0;
  let gastoMes = gastosMensuales[i] || 0;
  let restoMesAnterior = restosMensuales[i] || 0;

  // Calcular el resto mensual actual
  let restoMesActual = ingresoMes - gastoMes + restoMesAnterior;

  // Actualizar el array para reflejar el nuevo resto
  restosMensuales[i + 1] = restoMesActual;

  contenido += `<td>$${formatoNumber(restoMesActual)}</td>`;
}
contenido += `<td>-</td></tr>`;

  
  contenido += `</tbody></table>`;

  resumenAnual.innerHTML = contenido;

  // Ocultar el loader
  loader.style.display = 'none';
}

function formatoNumber(number) {
  if (isNaN(number)) return number;
  let [integerPart, decimalPart] = number.toFixed(2).split('.');
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${integerPart},${decimalPart}`;
}
