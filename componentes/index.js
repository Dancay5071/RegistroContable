import { auth } from '../componentes/utilidades/firebase.js';
import { renderNavbar } from "../componentes/navbar/navbar.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { escucharMontoActual} from "../componentes/app/escucharMonto.js";

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



  