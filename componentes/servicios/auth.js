// auth.js
import { auth } from "../utilidades/firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

export function initAuthUI() {
  const navbar = document.getElementById("navbar");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginForm = document.getElementById("#loginForm"); // Asegúrate de que este ID sea correcto

  if (!navbar || !loginBtn || !logoutBtn || !loginForm) {
    console.error("Elementos no encontrados en el DOM.");
    return;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      navbar.classList.remove('d-none');
      loginBtn.classList.add('d-none');
    } else {
      navbar.classList.add('d-none');
      loginBtn.classList.remove('d-none');
    }
  });

  document.getElementById('loginSubmit').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = loginForm['email'].value; // Asegúrate de que estos nombres de campo sean correctos
    const password = loginForm['password'].value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      modal.hide();
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      alert('Error al iniciar sesión: ' + error.message); // Muestra el mensaje de error específico
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      alert('Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error.message);
      alert('Error al cerrar sesión: ' + error.message); // Muestra el mensaje de error específico
    }
  });
}

// Asegúrate de llamar a esta función después de que el DOM esté listo
document.addEventListener('DOMContentLoaded', initAuthUI);
