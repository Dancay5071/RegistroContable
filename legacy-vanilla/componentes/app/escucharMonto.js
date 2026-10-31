// escucharMonto.js
import { onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { settingsDoc, settingDoc } from '../utilidades/firebase.js';

export function escucharMontoActual() {
  onSnapshot(settingsDoc, (docSnapshot) => {
    
    const montoDisplayElement = document.getElementById("montoActual");
    if (docSnapshot.exists() && montoDisplayElement) {
      const newMontoActual = docSnapshot.data().montoActual;
      
      const displayMonto = isNaN(newMontoActual) ? 0 : newMontoActual;
      montoDisplayElement.textContent = `Monto Actual: $${displayMonto.toFixed(2)}`;
    } else {
      console.log("No se encontró el documento o el elemento de visualización"); // Verificar problemas de obtención
    }
  });
};


export function escucharAhorro() { 
  onSnapshot(settingDoc, (docSnapshot) => { 
    const ahorroDisplayElement = document.getElementById("totalAhorros"); 
    if (docSnapshot.exists() && ahorroDisplayElement) { 
      const data = docSnapshot.data(); 
      
      const newAhorroActual = data.totalAhorros;
      
      const displayAhorro = isNaN(newAhorroActual) ? 0 : newAhorroActual; 
      ahorroDisplayElement.textContent = `Ahorro Actual: $${displayAhorro.toFixed(2)}`; 
    } else { 
      console.log("No se encontró el documento o el elemento de visualización"); 
    } 
  }); 
};
