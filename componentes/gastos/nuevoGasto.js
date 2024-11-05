import { addDoc, arrayUnion, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {  actualizarMontoActual, gastosCollection, gastosPorMes} from '../utilidades/firebase.js';
import { escucharMontoActual, } from "../app/escucharMonto.js";

//mostrar monto actualizado

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded disparado"); 
  escucharMontoActual();
});

async function agregarGasto() {
  const descripcion = document.getElementById("descripcionGasto").value;
  const monto = parseFloat(document.getElementById("montoGasto").value);
  const alertaDiv = document.getElementById("alertaGasto");

  if (!descripcion || isNaN(monto)) {
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Por favor, completa todos los campos correctamente.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
    return;
  }

 
  const data = { descripcion, monto };
  const month = document.getElementById("inputGroupSelect01").value;
  const year = new Date().getFullYear();

  if (month === "Selecciona el mes") {
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Por favor, selecciona un mes.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
    return;
  }

  const claveMesAño = `${month}_${year}`;

  try {
    await addDoc(gastosCollection, data);
    await actualizarMontoActual(-monto);
    
    const gastosMesDoc = doc(gastosPorMes, claveMesAño);

    await setDoc(gastosMesDoc, { gastos: arrayUnion(data) }, { merge: true });

    alertaDiv.className = "alert alert-success";
    alertaDiv.textContent = "gasto agregado con éxito.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
  } catch (error) {
    console.error("Error al agregar gasto:", error);
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Error al agregar gasto. Inténtalo de nuevo.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
  }

  document.getElementById("inputGroupSelect01").value = "Selecciona el mes";
  document.getElementById("descripcionGasto").value = "";
  document.getElementById("montoGasto").value = "";

}

document.getElementById("actualizarGasto").addEventListener("click", agregarGasto);
