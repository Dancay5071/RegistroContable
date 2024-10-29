/// app.js
import { initAuthUI } from "../servicios/auth.js"; // Importa tu lógica de autenticación desde el módulo auth.js
import { db, auth } from "../utilidades/firebase.js"; // Importa Firebase si lo necesitas

const navbarContainer = document.getElementById("navbar-container");

async function loadNavbar() {
  const { renderNavbar } = await import("../navbar/navbar.js");
  renderNavbar(navbarContainer);
}


// Llamar a las funciones de inicialización
document.addEventListener("DOMContentLoaded", async () => {
  initAuthUI(); // Configura la interfaz de autenticación
  
  // Cargar y renderizar el navbar
  await loadNavbar();
});
