
import { auth } from '../utilidades/firebase.js';
import { renderNavbar } from "../navbar/navbar.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";



function inicializarSelectoresFecha() {
  const mesSelect = document.getElementById("mesGasto");
  const yearSelect = document.getElementById("añoGasto");

  // Obtener el mes y el año actuales
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth(); 
  const añoActual = fechaActual.getFullYear();

  // Seleccionar el mes actual en el selector
  mesSelect.selectedIndex = mesActual + 1; // +1 porque la lista de opciones inicia en 0

  // Llenar dinámicamente el selector de años (por ejemplo, mostrar desde añoActual - 5 hasta añoActual + 5)
  yearSelect.innerHTML = ""; // Limpiar opciones existentes
  for (let i = añoActual - 1; i <= añoActual + 1; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;

    // Seleccionar el año actual por defecto
    if (i === añoActual) {
      option.selected = true;
    }

    yearSelect.appendChild(option);
  }
}


// Función para cerrar sesión
function setupLogoutListener() {
  const logoutBtn = document.getElementById("logout-btn"); 
  if (logoutBtn) {
    logoutBtn.addEventListener("click", cerrarSesion);
  } else {
    console.warn("No se encontró el botón de cerrar sesión en el DOM.");
  }
}

// Función para cerrar sesión
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
document.addEventListener("DOMContentLoaded", async () => {
  const navbarContainer = document.getElementById("navbar-container");

  if (navbarContainer) {
    await renderNavbar(navbarContainer);
    setupYearSelect();
    setupLogoutListener();
  } else {
    console.warn("No se encontró el contenedor del navbar en el DOM");
  }
});