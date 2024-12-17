//ahorro.js
import { escucharAhorro } from "../app/escucharMonto.js";
import { actualizarAhorroActual, ahorrosPorMes, settingDoc, extraccionPorMes, extraccionCollection} from "../utilidades/firebase.js";
import { doc, getDoc, updateDoc, setDoc, addDoc, arrayUnion, increment } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded disparado"); 
    escucharAhorro();
    setupYearSelect()
});

const monto = parseFloat(document.getElementById("montoAgregar").value); // Para ahorro
const month = document.getElementById("inputMesAgregar").value; 

function setupYearSelect() {
    const yearSelect = document.getElementById("inputGroupSelectYear");
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
  document.addEventListener("DOMContentLoaded", () => {
    setMesActual();
  });
  
  document.getElementById("modalExtraccion").addEventListener("shown.bs.modal", () => {
    setMesActual();
  });
  
  function setMesActual() {
    const mesActual = new Date().toLocaleString('es-ES', { month: 'long' }); 
    const selectMes = document.getElementById("inputGroupSelect01");
  
    for (let option of selectMes.options) {
      if (option.textContent.toLowerCase() === mesActual.toLowerCase()) {
        option.selected = true;
        break;
      }
    }
  }
  
  async function actualizarTotalAhorros() {
    const ahorroDoc = await getDoc(settingDoc);
    document.getElementById("totalAhorros").textContent = 
       `Total Ahorros: $${formatoNumber(ahorroDoc.data().totalAhorros)}`;
}
window.agregarAhorro = agregarAhorro;

async function agregarAhorro() {
  
  const alertaDiv = document.getElementById("alertaAgregar");

  const monto = parseFloat(document.getElementById("montoAgregar").value);
  const month = document.getElementById("inputMesAgregar").value;
  console.log("Monto:", monto);
  console.log("Mes:", month);
  
  if (isNaN(monto) || monto <= 0 || month === "Selecciona el mes") {
      console.log("Error en los campos. Monto o mes no válidos.");
      alertaDiv.className = "alert alert-danger";
      alertaDiv.textContent = "Por favor, completa todos los campos correctamente.";
      alertaDiv.classList.remove("d-none");
      setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
      return;
  }
  

  const year = document.getElementById("inputGroupSelectYear").value;
  const claveMesAño = `${month}_${year}`;
  const data = { monto: monto, fecha: new Date() };

  try {
    // Guardar el ahorro en Firestore
    const ahorroMesDoc = doc(ahorrosPorMes, claveMesAño);
    await setDoc(ahorroMesDoc, { totalAhorros: increment(monto) }, { merge: true });

    // Actualizar el total de ahorros global
    await actualizarAhorroActual(monto);

    alertaDiv.className = "alert alert-success";
    alertaDiv.textContent = "Ahorro agregado con éxito.";

    // Cerrar el modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarAhorro'));
    modal.hide();
  } catch (error) {
    console.error("Error al agregar ahorro:", error);
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Error al agregar el ahorro.";
  } finally {
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);

    // Limpiar los campos del modal
    document.getElementById("montoAgregar").value = "";
    document.getElementById("inputGroupSelect01").value = "Selecciona el mes";
  }
  await actualizarTotalAhorros(); 
};



window.extraerAhorro = extraerAhorro;

async function extraerAhorro() {
  const monto = parseFloat(document.getElementById("montoExtraccion").value);
  const alertaDiv = document.getElementById("alertaExtraccion");
  const month = document.getElementById("inputGroupSelect01").value;

  if (isNaN(monto) || monto <= 0 || month === "Selecciona el mes") {
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Por favor, completa todos los campos correctamente.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
    return;
  }

  const year = new Date().getFullYear();
  const claveMesAño = `${month}_${year}`;
  const data = { monto: -monto, fecha: new Date() };

  try {
    // Guardar en Firestore
    await addDoc(extraccionCollection, data);
    await actualizarAhorroActual(-monto);
    const extraccionMesDoc = doc(extraccionPorMes, claveMesAño);
    
    await setDoc(extraccionMesDoc, { extraccion: arrayUnion(data) }, { merge: true });

    
    alertaDiv.className = "alert alert-success";
    alertaDiv.textContent = "Extracción registrada con éxito.";

    // Cerrar el modal después de registrar la extracción
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalExtraccion'));
    modal.hide();
  } catch (error) {
    console.error("Error al registrar la extracción:", error);
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Error al registrar la extracción.";
  } finally {
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);

    // Limpiar los campos del modal
    document.getElementById("montoExtraccion").value = "";
    document.getElementById("inputGroupSelect01").value = "Selecciona el mes";
  }
  
  await actualizarTotalAhorros(); 
};

  window.consultarAhorro = consultarAhorro;
  
async function consultarAhorro(meses) {
    const loader = document.getElementById("loader");
    loader.style.display = "block";

    const year = document.getElementById("inputGroupSelectYear").value;
    const tabla = document.getElementById("tabla-ahorro");
    let totalAnual = 0;

    let contenido = `
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Mes</th>`;
  
   
    meses.forEach(mes => {
        contenido += `<th scope="col">${mes}</th>`;
    });

    contenido += `</tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Ahorros</th>`;

    for (const mes of meses) {
        const claveMesAño = `${mes}_${year}`;
        const docRef = doc(ahorrosPorMes, claveMesAño);
        const extraccionRef = doc(extraccionPorMes, claveMesAño);
        let ahorros = 0, extracciones = 0;

        try {
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                ahorros = data.totalAhorros || 0;
            }

            const snapExtracciones = await getDoc(extraccionRef);
            if (snapExtracciones.exists()) {
                const dataExtracciones = snapExtracciones.data();
                extracciones = dataExtracciones.extraccion?.reduce((sum, ext) => sum - ext.monto, 0) || 0;
            }

        } catch (error) {
            console.error(`Error al obtener datos del mes ${mes}:`, error);
        }

        const ahorrosNetos = ahorros - extracciones;
        totalAnual += ahorrosNetos;

        
        contenido += `<td>$${formatoNumber(ahorrosNetos)}</td>`;
    }

    contenido += `
          </tr>
        </tbody>
      </table>`;

    tabla.innerHTML = contenido;
    loader.style.display = "none";
}

      

function formatoNumber(number) {
    if (isNaN(number)) return number;
    let [integerPart, decimalPart] = number.toFixed(2).split('.');
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${integerPart},${decimalPart}`;
  }

export {agregarAhorro, extraerAhorro, consultarAhorro};
