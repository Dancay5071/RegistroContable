// componentes/navbar/navbar.js

export async function renderNavbar(container) {
  const response = await fetch("componentes/navbar/navbar.html");
    const navbarHTML = await response.text();
    container.innerHTML += navbarHTML;
  
    const navbar = document.getElementById("navbar");
  
  }