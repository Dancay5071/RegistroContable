//nuevoIngreso.js
import { addDoc, arrayUnion, increment, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { actualizarMontoActual, actualizarAhorroActual, ingresosCollection, ingresosPorMes, ahorrosPorMes  } from "../utilidades/firebase.js";

async function agregarIngreso() {
  const descripcion = document.getElementById("descripcionIngreso").value;
  const monto = parseFloat(document.getElementById("montoIngreso").value);
  const porcentajeAhorro = parseFloat(document.getElementById("inputGroupSelectPorcentaje").value);
  const alertaDiv = document.getElementById("alertaIngreso");
  const loader = document.getElementById("loader"); 
  loader.style.display = "block"; 

  if (!descripcion || isNaN(monto) || isNaN(porcentajeAhorro)) {
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Por favor, completa todos los campos correctamente.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
    loader.style.display = "none";
    return;
  }

  const ahorro = (monto * porcentajeAhorro) / 100;
  const ingresoNeto = monto - ahorro;
  const data = { descripcion, monto: ingresoNeto, ahorro };
  const month = document.getElementById("inputGroupSelect01").value;
  const year = new Date().getFullYear();

  if (month === "Selecciona el mes") {
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Por favor, selecciona un mes.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
    loader.style.display = "none";
    return;
  }

  const claveMesAño = `${month}_${year}`;

  try {
    await addDoc(ingresosCollection, data);
    await actualizarMontoActual(ingresoNeto);
    await actualizarAhorroActual(ahorro);

    const ingresosMesDoc = doc(ingresosPorMes, claveMesAño);
    const ahorrosMesDoc = doc(ahorrosPorMes, claveMesAño);

    await setDoc(ingresosMesDoc, { ingresos: arrayUnion(data) }, { merge: true });
    await setDoc(ahorrosMesDoc, { totalAhorros: increment(ahorro) }, { merge: true });

    alertaDiv.className = "alert alert-success";
    alertaDiv.textContent = "Ingreso agregado con éxito.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
  } catch (error) {
    console.error("Error al agregar ingreso:", error);
    alertaDiv.className = "alert alert-danger";
    alertaDiv.textContent = "Error al agregar ingreso. Inténtalo de nuevo.";
    alertaDiv.classList.remove("d-none");
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
  }
  finally {
    loader.style.display = "none"; 
    setTimeout(() => alertaDiv.classList.add("d-none"), 5000);
    document.getElementById("inputGroupSelect01").value = "Selecciona el mes";
    document.getElementById("descripcionIngreso").value = "";
    document.getElementById("montoIngreso").value = "";
  }
  
}

document.getElementById("actualizarIngreso").addEventListener("click", agregarIngreso);
 