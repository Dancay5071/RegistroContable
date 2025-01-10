//ahorro.js
import { escucharAhorro } from "../app/escucharMonto.js";
import { actualizarAhorroActual, ahorrosPorMes, settingDoc, extraccionPorMes, extraccionCollection} from "../utilidades/firebase.js";
import { doc, getDoc, updateDoc, setDoc, addDoc, arrayUnion, increment } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { selectoresFecha } from "../index.js";

document.addEventListener("DOMContentLoaded", () => {
    escucharAhorro();
    selectoresFecha(true)
});
  
  async function actualizarTotalAhorros() {
    const ahorroDoc = await getDoc(settingDoc);
    document.getElementById("totalAhorros").textContent = 
       `Total Ahorros: $${formatoNumber(ahorroDoc.data().totalAhorros)}`;
}
window.agregarAhorro = agregarAhorro;

async function agregarAhorro() {
  const alertaDiv = document.getElementById("alertaAgregar");
  const monto = parseFloat(document.getElementById("montoAgregar").value);
  const month = document.getElementById("mesSelect").value;

  if (isNaN(monto) || monto <= 0) {
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Por favor, completa todos los campos correctamente.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
    return;
  }

  const data = { monto: monto, fecha: new Date() };

  try {
    // Guardar el ahorro en Firestore usando el mes como clave
    const ahorroMesDoc = doc(ahorrosPorMes, month);
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
  }

  await actualizarTotalAhorros();
}


window.extraerAhorro = extraerAhorro;

async function extraerAhorro() {
  const monto = parseFloat(document.getElementById("montoExtraccion").value);
  const alertaDiv = document.getElementById("alertaExtraccion");
  const month = document.getElementById("mesSelect").value;

  if (isNaN(monto) || monto <= 0 ) {
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Por favor, completa todos los campos correctamente.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
    return;
  }

  const year = document.getElementById("anioSelect").value;
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
  }
  
  await actualizarTotalAhorros(); 
};

  window.consultarAhorro = consultarAhorro;
  
async function consultarAhorro(meses) {
    const loader = document.getElementById("loader");
    loader.style.display = "block";

    const year = document.getElementById("anioSelect").value;
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
