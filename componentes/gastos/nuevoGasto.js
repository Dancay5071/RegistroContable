import {  addDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { gastosCollection } from '../utilidades/firebase.js';


// Función para agregar un Gasto
async function agregarGasto() {
  const descripcion = document.getElementById("descripcionGasto").value;
  const monto = parseFloat(document.getElementById("montoGasto").value);
  const data = { descripcion, monto };
  const alertaDiv = document.getElementById("alertaGasto");

  try {
    await addDoc(gastosCollection, data);

    // cartel de éxito y oculta después de 5 segundos
    alertaDiv.className = "alert alert-success";
    alertaDiv.textContent = "Gasto agregado con éxito.";
    alertaDiv.classList.remove("d-none");

    setTimeout(() => {
      alertaDiv.classList.add("d-none");
    }, 5000);
  } catch (error) {
    console.error("Error al agregar gasto:", error);

    // cartel de error y oculta después de 5 segundos
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Error al agregar gasto. Inténtalo de nuevo.";
    alertaDiv.classList.remove("d-none");

    setTimeout(() => {
      alertaDiv.classList.add("d-none");
    }, 5000);
  }
  // Limpiar formulario
    document.getElementById("inputGroupSelect01").value = 'Selecciona el mes';
    document.getElementById("descripcionGasto").value = '';
    document.getElementById("montoGasto").value = '';
}



  // botón de actualizar
  const actualizarGasto = document.getElementById("actualizarGasto");
  if (actualizarGasto) {
    actualizarGasto.addEventListener("click", agregarGasto);
  } else {
    console.error("No se encontró el botón de actualizar en el DOM");
  }

