/// app.js
import { initAuthUI } from "../servicios/auth.js";


const appContainer = document.getElementById("navbar-container");


async function loadNavbar() {
  
  const { renderNavbar } = await import("../navbar/navbar.js");
  await renderNavbar(appContainer); 

  initAuthUI(); 
}

document.addEventListener("DOMContentLoaded", loadNavbar);