// escucharMonto.js
import { onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { settingsDoc, settingDoc } from '../utilidades/firebase.js';

export function escucharMontoActual() {
  onSnapshot(settingsDoc, (docSnapshot) => {
    console.log("escucharMontoActual se ejecutó"); // Para verificar que la función se ejecuta
    const montoDisplayElement = document.getElementById("montoActual");
    if (docSnapshot.exists() && montoDisplayElement) {
      const newMontoActual = docSnapshot.data().montoActual;
      console.log("Monto obtenido desde Firebase:", newMontoActual); // Verificar el valor de `montoActual`
      
      const displayMonto = isNaN(newMontoActual) ? 0 : newMontoActual;
      montoDisplayElement.textContent = `Monto Actual: $${displayMonto.toFixed(2)}`;
    } else {
      console.log("No se encontró el documento o el elemento de visualización"); // Verificar problemas de obtención
    }
  });
};


export function escucharAhorro() { 
  onSnapshot(settingDoc, (docSnapshot) => { 
    console.log("escucharAhorro se ejecutó"); 
    const ahorroDisplayElement = document.getElementById("totalAhorros"); 
    if (docSnapshot.exists() && ahorroDisplayElement) { 
      const data = docSnapshot.data(); 
      console.log("Datos del documento", data); 
      
      const newAhorroActual = data.totalAhorros;
      console.log("Ahorro obtenido desde Firebase:", newAhorroActual);

      const displayAhorro = isNaN(newAhorroActual) ? 0 : newAhorroActual; 
      ahorroDisplayElement.textContent = `Ahorro Actual: $${displayAhorro.toFixed(2)}`; 
    } else { 
      console.log("No se encontró el documento o el elemento de visualización"); 
    } 
  }); 
};
