// auth.js
import { auth } from "../utilidades/firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { renderNavbar } from "../navbar/navbar.js";

async function cargarNavbarYAuth() {
  const navbarContainer = document.getElementById("navbar-container");

  if (!navbarContainer) {
    console.warn("Contenedor de navbar no encontrado");
    return;
  }

  await renderNavbar(navbarContainer);

  // Verifica si todos los elementos necesarios están en el DOM antes de inicializar la autenticación
  const checkElementsLoaded = () => {
    const navbar = document.getElementById("navbar");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const loginForm = document.getElementById("loginForm");

    if (navbar && loginBtn && logoutBtn && loginForm) {
      initAuthUI();
    } else {
      console.warn("Algunos elementos no fueron encontrados en el DOM, reintentando...");
      setTimeout(checkElementsLoaded, 100); // Vuelve a intentar en 100ms
    }
  };

  checkElementsLoaded();
}

export function initAuthUI() {
  const navbar = document.getElementById("navbar");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginForm = document.getElementById("loginForm");

  const montoActual = document.getElementById("montoActual");
  const ahorro = document.getElementById("ahorro");
  const totalAhorros = document.getElementById("totalAhorros");

  if (!navbar || !loginBtn || !logoutBtn || !loginForm) {
    console.error("Algunos elementos no fueron encontrados en el DOM.");
    return;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      navbar.classList.remove("d-none");
      loginBtn.classList.add("d-none");
      montoActual?.classList.remove("d-none");
      ahorro?.classList.remove("d-none");
      totalAhorros?.classList.remove("d-none");
    } else {
      navbar.classList.add("d-none");
      loginBtn.classList.remove("d-none");
      montoActual?.classList.add("d-none");
      ahorro?.classList.add("d-none");
      totalAhorros?.classList.add("d-none");
    }
  });

  document.getElementById("loginSubmit")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = loginForm["email"].value;
    const password = loginForm["password"].value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const modal = bootstrap.Modal.getInstance(document.getElementById("loginModal"));
      modal.hide();
    } catch (error) {
      console.error("Error al iniciar sesión:", error.message);
      alert("Error al iniciar sesión: " + error.message);
    }
  });

  logoutBtn.addEventListener("click", cerrarSesion);
}

function cerrarSesion() {
  signOut(auth)
    .then(() => {
      window.location.href = "/index.html";
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error);
      alert("Hubo un problema al cerrar sesión. Inténtalo de nuevo.");
    });
}

document.addEventListener("DOMContentLoaded", cargarNavbarYAuth);
