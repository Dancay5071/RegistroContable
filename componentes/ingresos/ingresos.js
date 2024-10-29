// agregar y consultar ingresos

import { db } from '../utilidades/firebase.js';
import { collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const ingresosCollection = collection(db, 'ingresos');

export async function agregarIngreso(data) {
  try {
    await addDoc(ingresosCollection, data);
    console.log("Ingreso agregado con éxito.");
  } catch (error) {
    console.error("Error al agregar ingreso:", error);
  }
}

export async function consultarIngreso(mes, yearSeleccionado, resultadosDiv) {
  const ingresosQuery = query(
    ingresosCollection,
    where("mes", "==", mes),
    where("year", "==", yearSeleccionado)
  );

  try {
    const querySnapshot = await getDocs(ingresosQuery);
    let ingresosMes = [];
    let sumaIngresos = 0;

    querySnapshot.forEach((doc) => {
      let ingreso = doc.data();
      ingresosMes.push(ingreso);
    });

    // Cargar ingresos en el DOM
    resultadosDiv.innerHTML = renderIngresosTable(ingresosMes, mes, yearSeleccionado, sumaIngresos);
  } catch (error) {
    console.error("Error al consultar los ingresos:", error);
    alert("Ocurrió un error al consultar los ingresos.");
  }
}
// 
export function setupYearSelect() {
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
  
  export function tablaDeIngresos(ingresosMes, mes, yearSeleccionado, sumaIngresos) {
    let contenido = `<table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <td><h4>Ingresos de ${mes} ${yearSeleccionado}</h4></td>
                            </tr>   
                        </thead>`;
    let tabla = `
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th scope="col"></th>
            <th>Descripción</th>
            <th>Monto</th>
            <th></th> 
          </tr>
        </thead>
        <tbody>`;
  
    ingresosMes.forEach((ingreso, index) => {
      tabla += `
        <tr>
          <td><i class="bi bi-dot"></i></td>
          <td>${ingreso.descripcion}</td>
          <td>$${ingreso.monto.toFixed(2)}</td>
          <td>
            <button type="button" class="btn btn-outline-dark" data-bs-toggle="tooltip" data-bs-placement="top" title="Editar" onclick="editarIngreso(${index})"><i class="bi bi-pencil-fill"></i></button>
            <button type="button" class="btn btn-outline-dark" data-bs-toggle="tooltip" data-bs-placement="top" title="Eliminar" onclick="eliminarIngreso(${index})"><i class="bi bi-x"></i></button>
          </td>
        </tr>`;
      sumaIngresos += ingreso.monto;
    });
  
    tabla += `
        </tbody>
        <tfoot class="table-dark">
          <tr>
            <td>Total</td>
            <td></td>
            <td>$${sumaIngresos.toFixed(2)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>`;
  
    return contenido + tabla;
  }
  