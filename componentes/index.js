import { auth } from '../componentes/utilidades/firebase.js';
import { renderNavbar } from "../componentes/navbar/navbar.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { escucharMontoActual} from "../componentes/app/escucharMonto.js";

function selectoresFecha(mesActual = true) {
  const mesSelect = document.getElementById("mesSelect");
  const yearSelect = document.getElementById("anioSelect");
  const fechaActual = new Date();

  let mes = mesActual ? fechaActual.getMonth() : fechaActual.getMonth() - 1;
  let año = fechaActual.getFullYear();

  // Ajustar mes y año si es necesario
  if (mes < 0) {
    mes = 11;
    año -= 1;
  }

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
 
  // Actualizar opciones del selector de meses
  mesSelect.innerHTML = meses.map((mesNombre, index) => 
    `<option value="${mesNombre}" ${index === mes ? "selected" : ""}>${mesNombre}</option>`
  ).join("");

  // Limpiar opciones existentes del selector de años
  yearSelect.innerHTML = "";
  for (let i = año - 1; i <= año + 1; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;

    // Seleccionar el año por defecto
    if (i === año) {
      option.selected = true;
    }

    yearSelect.appendChild(option);
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  const navbarContainer = document.getElementById("navbar-container");

  if (navbarContainer) {
    await renderNavbar(navbarContainer);
    setupLogoutListener();
    escucharMontoActual();
  } else {
    console.warn("No se encontró el contenedor del navbar en el DOM");
  }
});

// cerrar sesión
function setupLogoutListener() {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", cerrarSesion);
  } else {
    console.warn("No se encontró el botón de cerrar sesión en el DOM.");
  }
}

function cerrarSesion() {
  signOut(auth)
    .then(() => {
      console.log("Sesión cerrada con éxito");
      window.location.href = "/index.html";
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error);
      alert("Hubo un problema al cerrar sesión. Inténtalo de nuevo.");
    });
}
export{selectoresFecha};



  