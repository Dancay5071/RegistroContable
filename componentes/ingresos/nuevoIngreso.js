
import {  addDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { ingresosCollection } from '../utilidades/firebase.js';


// Función para agregar un ingreso
async function agregarIngreso() {
  const descripcion = document.getElementById("descripcionIngreso").value;
  const monto = parseFloat(document.getElementById("montoIngreso").value);
  const porcentaje = parseFloat(document.getElementById("inputGroupSelectPorcentaje").value);
  const data = { descripcion, monto, porcentaje };
  const alertaDiv = document.getElementById("alertaIngreso");

  try {
    await addDoc(ingresosCollection, data);

    // Muestra el cartel de éxito y oculta después de 5 segundos
    alertaDiv.className = "alert alert-success";
    alertaDiv.textContent = "Ingreso agregado con éxito.";
    alertaDiv.classList.remove("d-none");

    setTimeout(() => {
      alertaDiv.classList.add("d-none");
    }, 5000);
  } catch (error) {
    console.error("Error al agregar ingreso:", error);

    // Muestra el cartel de error y oculta después de 5 segundos
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Error al agregar ingreso. Inténtalo de nuevo.";
    alertaDiv.classList.remove("d-none");

    setTimeout(() => {
      alertaDiv.classList.add("d-none");
    }, 5000);
  }
  // Limpiar formulario
    document.getElementById("inputGroupSelect01").value = 'Selecciona el mes';
    document.getElementById("descripcionIngreso").value = '';
    document.getElementById("montoIngreso").value = '';
    document.getElementById("inputGroupSelectPorcentaje").value = '0';
}



  // Agregar el evento de clic para el botón de actualizar
  const actualizarIngreso = document.getElementById("actualizarIngreso");
  if (actualizarIngreso) {
    actualizarIngreso.addEventListener("click", agregarIngreso);
  } else {
    console.error("No se encontró el botón de actualizar en el DOM");
  }

