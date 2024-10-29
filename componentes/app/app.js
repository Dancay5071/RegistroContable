/// app.js
import { initAuthUI } from "../servicios/auth.js";
import { db, auth } from "../utilidades/firebase.js";

const appContainer = document.getElementById("navbar-container");

// Cargar y renderizar el navbar
async function loadNavbar() {
  const { renderNavbar } = await import("../navbar/navbar.js");
  await renderNavbar(appContainer); // Espera a que el navbar se cargue completamente

  initAuthUI(); 
}

document.addEventListener("DOMContentLoaded", loadNavbar);