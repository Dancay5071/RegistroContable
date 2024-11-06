import { escucharAhorro } from "../app/escucharMonto.js";
import { db, actualizarAhorroActual, ahorrosPorMes, gastosPorMes, settingDoc } from "../utilidades/firebase.js";
import { doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded disparado"); 
    escucharAhorro();
});

window.extraerAhorro = extraerAhorro;

async function extraerAhorro() {
  let cantidadAextraer = prompt("¿Cuánto deseas extraer del ahorro?", "0");
  cantidadAextraer = parseFloat(cantidadAextraer);

  if (isNaN(cantidadAextraer) || cantidadAextraer <= 0) {
      alert('Por favor, ingresa una cantidad válida.');
      return;
  }

  try {
      // Obtener el ahorro total actual desde Firebase
      const ahorroSnapshot = await getDoc(settingDoc);
      const totalAhorros = ahorroSnapshot.exists() ? ahorroSnapshot.data().totalAhorros : 0;

      if (cantidadAextraer > totalAhorros) {
          alert('No tienes suficiente ahorro para extraer esa cantidad.');
          return;
      }

      // Restar el monto extraído del ahorro total y actualizar Firebase
      await actualizarAhorroActual(-cantidadAextraer);

      // Actualizar el ahorro por mes en Firebase
      const mesExtraccion = new Date().toLocaleString('default', { month: 'long' });
      const yearSeleccionado = new Date().getFullYear();
      const claveMesAño = `${mesExtraccion}-${yearSeleccionado}`;
      const ahorroMesDoc = doc(ahorrosPorMes, claveMesAño);

      const ahorroMesSnapshot = await getDoc(ahorroMesDoc);
      let ahorroMes = ahorroMesSnapshot.exists() ? ahorroMesSnapshot.data().ahorro || 0 : 0;

      // Si el documento no existe, usar `setDoc` para crear el documento con el valor inicial
      if (!ahorroMesSnapshot.exists()) {
          await setDoc(ahorroMesDoc, { ahorro: ahorroMes - cantidadAextraer });
      } else {
          await updateDoc(ahorroMesDoc, { ahorro: ahorroMes - cantidadAextraer });
      }

      console.log("Nuevo total de ahorros:", totalAhorros - cantidadAextraer);
      console.log("Ahorros por mes:", claveMesAño, ahorroMes - cantidadAextraer);

  } catch (error) {
      console.error("Error al extraer ahorro:", error);
  }
}

export { extraerAhorro};
