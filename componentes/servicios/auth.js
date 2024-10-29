// auth.js (sin el DOMContentLoaded)
import { auth } from "../utilidades/firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

export function initAuthUI() {
  const navbar = document.getElementById("navbar");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginForm = document.getElementById("loginForm");

  const montoActual = document.getElementById("montoActual");
  const ahorro = document.getElementById("ahorro");
  const totalAhorros = document.getElementById("totalAhorros");


  if (!navbar) console.error("Navbar no encontrado.");
  if (!loginBtn) console.error("Botón de inicio de sesión no encontrado.");
  if (!logoutBtn) console.error("Botón de cerrar sesión no encontrado.");
  if (!loginForm) console.error("Formulario de inicio de sesión no encontrado.");

  if (!navbar || !loginBtn || !logoutBtn || !loginForm) {
    console.error("Algunos elementos no fueron encontrados en el DOM.");
    return;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      navbar.classList.remove('d-none');
      loginBtn.classList.add('d-none');

      montoActual.classList.remove('d-none');
      ahorro.classList.remove('d-none');
      totalAhorros.classList.remove('d-none');
    } else {
      navbar.classList.add('d-none');
      loginBtn.classList.remove('d-none');

      montoActual.classList.add('d-none');
      ahorro.classList.add('d-none');
      totalAhorros.classList.add('d-none');
    }
  });

  document.getElementById('loginSubmit').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = loginForm['email'].value;
    const password = loginForm['password'].value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      modal.hide();
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      alert('Error al iniciar sesión: ' + error.message);
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      alert('Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error.message);
      alert('Error al cerrar sesión: ' + error.message);
    }
  });
}
