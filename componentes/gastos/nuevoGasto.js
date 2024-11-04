import { doc, addDoc, getDoc, setDoc, updateDoc, arrayUnion, increment, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { gastosCollection, gastosPorMes, settingsDoc } from '../utilidades/firebase.js';


async function actualizarMontoActual(nuevoGasto) {
  try {
    const montoDoc = await getDoc(settingsDoc);
    const montoActual = montoDoc.exists() ? montoDoc.data().montoActual : 0;
    await updateDoc(settingsDoc, { montoActual: montoActual - nuevoGasto });
  } catch (error) {
    console.error("Error al actualizar monto actual:", error);
  }
}
// Función para agregar un Gasto
async function agregarGasto() {
  const descripcion = document.getElementById("descripcionGasto").value;
  const monto = parseFloat(document.getElementById("montoGasto").value);
  const data = { descripcion, monto };
  const alertaDiv = document.getElementById("alertaGasto");

  if (!descripcion || isNaN(monto)) {
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Por favor, completa todos los campos correctamente.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
    return;
  }
  
  let month = document.getElementById("inputGroupSelect01").value;
  const year = new Date().getFullYear();
  if (month === 'Selecciona el mes') {
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Por favor, selecciona un mes.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
    return;
  }

  const claveMesAño = `${month}_${year}`;

  try {
    await addDoc(gastosCollection, data);
    await actualizarMontoActual(monto);

    const gastosMesDoc = doc(gastosPorMes, claveMesAño);

    await setDoc(gastosMesDoc, { 
      gastos: arrayUnion(data) 
    });

    
    alertaDiv.className = "alert alert-success";
    alertaDiv.textContent = "Gasto agregado con éxito.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);

  } catch (error) {
    console.error("Error al agregar gasto:", error);
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Error al agregar gasto. Inténtalo de nuevo.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
  }
  // Limpiar formulario
    document.getElementById("inputGroupSelect01").value = 'Selecciona el mes';
    document.getElementById("descripcionGasto").value = '';
    document.getElementById("montoGasto").value = '';
}

onSnapshot(settingsDoc, (docSnapshot) => {
  const montoDisplayElement = document.getElementById("montoActual");
  if (docSnapshot.exists()) {
    const newMontoActual = docSnapshot.data().montoActual;
    montoDisplayElement.textContent = `Monto Actual: $${newMontoActual.toFixed(2)}`;
  }
});

document.getElementById("actualizarGasto").addEventListener("click", agregarGasto);

