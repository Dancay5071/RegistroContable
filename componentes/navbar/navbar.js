// navbar.js
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { auth } from "../utilidades/firebase.js";

export async function renderNavbar(container) {
  try {
    const response = await fetch("/componentes/navbar/navbar.html");
    if (!response.ok) throw new Error("No se pudo cargar el archivo navbar.html");

    const navbarHTML = await response.text();
    container.innerHTML = navbarHTML;

    // Remueve la clase 'd-none' del navbar si está oculta
    const navbar = document.getElementById("navbar");
    if (navbar) {
      navbar.classList.remove("d-none");
    } else {
      console.warn("Elemento con ID 'navbar' no encontrado en el archivo HTML");
    }
  } catch (error) {
    console.error("Error al cargar el navbar:", error);
  }
}

// Función para configurar el evento de cerrar sesión
export function setupLogoutListener() {
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

