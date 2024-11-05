import { renderNavbar } from "../navbar/navbar.js";

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
  

document.addEventListener("DOMContentLoaded", async () => {
  const navbarContainer = document.getElementById("navbar-container");

  if (navbarContainer) {
    await renderNavbar(navbarContainer);
    setupYearSelect();
  } else {
    console.warn("No se encontró el contenedor del navbar en el DOM");
  }
});

