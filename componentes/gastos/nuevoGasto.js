//nuevoGasto.js
import { addDoc, arrayUnion, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {  actualizarMontoActual, gastosCollection, gastosPorMes} from '../utilidades/firebase.js';
import { escucharMontoActual, } from "../app/escucharMonto.js";
import { selectoresFecha } from "../index.js"

//mostrar monto, mes y año actualizado

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded disparado"); 
  escucharMontoActual();
  selectoresFecha(true);
});

async function agregarGasto() {
  const descripcion = document.getElementById("descripcionGasto").value;
  const monto = parseFloat(document.getElementById("montoGasto").value);
  const alertaDiv = document.getElementById("alertaGasto");
  const loader = document.getElementById("loader");
  const monthSelect = document.getElementById("mesSelect");

  loader.style.display = "block";

  if (!descripcion || isNaN(monto)) {
    mostrarAlerta("Por favor, completa todos los campos correctamente.", "danger", alertaDiv);
    loader.style.display = "none";
    return;
  }

  const month = monthSelect.value;
  

  const year = document.getElementById("anioSelect").value;
  const claveMesAño = `${month}_${year}`;
  const data = { descripcion, monto };

  try {
    await addDoc(gastosCollection, data);
    await actualizarMontoActual(-monto);

    const gastosMesDoc = doc(gastosPorMes, claveMesAño);
    await setDoc(gastosMesDoc, { gastos: arrayUnion(data) }, { merge: true });

    mostrarAlerta("Gasto agregado con éxito.", "success", alertaDiv);
  } catch (error) {
    console.error("Error al agregar gasto:", error);
    mostrarAlerta("Error al agregar gasto. Inténtalo de nuevo.", "danger", alertaDiv);
  } finally {
    loader.style.display = "none";
    resetFormulario();
  }
}

function mostrarAlerta(mensaje, tipo, alertaDiv) {
  alertaDiv.className = `alert alert-${tipo}`;
  alertaDiv.textContent = mensaje;
  alertaDiv.classList.remove("d-none");
  setTimeout(() => alertaDiv.classList.add("d-none"), 1000);
}

function resetFormulario() {
  document.getElementById("descripcionGasto").value = "";
  document.getElementById("montoGasto").value = "";
}


document.getElementById("actualizarGasto").addEventListener("click", agregarGasto);
