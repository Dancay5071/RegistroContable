
import { query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { ingresosCollection } from '../utilidades/firebase.js'; 


export async function consultarIngreso() {
  const mes = document.getElementById("inputGroupSelect01").value;
  const yearSeleccionado = document.getElementById("inputGroupSelectYear").value;
  const resultadosDiv = document.getElementById("resultadosIngresos");

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
      sumaIngresos += ingreso.monto;
    });

    resultadosDiv.innerHTML = tablaDeIngresos(ingresosMes, mes, yearSeleccionado, sumaIngresos);
  } catch (error) {
    console.error("Error al consultar los ingresos:", error);
    alert("Ocurrió un error al consultar los ingresos.");
  }
}
  export function tablaDeIngresos(ingresosMes, mes, yearSeleccionado, sumaIngresos) {
    let tabla = `
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <td colspan="4"><h4>Ingresos de ${mes} ${yearSeleccionado}</h4></td>
          </tr>
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
  
    return tabla;
  }
  