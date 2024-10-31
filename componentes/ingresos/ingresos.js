import { auth } from '../utilidades/firebase.js';
import { renderNavbar } from "../navbar/navbar.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";


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

// Función para configurar el evento de cerrar sesión
function setupLogoutListener() {
  const logoutBtn = document.getElementById("logout-btn"); // Asegúrate de que el botón exista en el HTML
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
      // Opcional: Redirige al usuario a la página de inicio después de cerrar sesión
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