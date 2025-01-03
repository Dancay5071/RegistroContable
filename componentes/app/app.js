// app.js
import { initAuthUI } from "../servicios/auth.js";
import { escucharAhorro, escucharMontoActual } from "../app/escucharMonto.js";

document.addEventListener("DOMContentLoaded", () => {
  escucharMontoActual();
  escucharAhorro();
});

const appContainer = document.getElementById("navbar-container");

async function loadNavbar() {
  
  const { renderNavbar } = await import("../navbar/navbar.js");
  await renderNavbar(appContainer); 

  initAuthUI(); 
}

document.addEventListener("DOMContentLoaded", loadNavbar);
