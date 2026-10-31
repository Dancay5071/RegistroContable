//consultarGasto.js
import { doc, getDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { gastosPorMes, actualizarMontoActual } from "../utilidades/firebase.js";
import { escucharMontoActual } from "../app/escucharMonto.js";
import { selectoresFecha } from "../index.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded disparado"); 
  escucharMontoActual();
  selectoresFecha(true);
});

window.consultarGasto = consultarGasto;

async function consultarGasto() {
    const loader = document.getElementById("loader");
    loader.style.display = "block"; 
    let mes = document.getElementById("mesSelect").value;
    let resultadosDiv = document.getElementById('resultadosGastos');

    let year = document.getElementById("anioSelect").value;
    let claveMesAño = `${mes}_${year}`;
    let gastosMesDoc = doc(gastosPorMes, claveMesAño);

    try {
        const docSnap = await getDoc(gastosMesDoc);
        let gastosMes = docSnap.exists() ? docSnap.data().gastos || [] : [];

        resultadosDiv.innerHTML = '';

        let contenido = `<table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <td><h4>Gastos de ${mes} ${year}</h4></td>
                                </tr>   
                            </thead>`;

        if (gastosMes.length === 0) {
            resultadosDiv.innerHTML = contenido + `<thead>
                                <tr>
                                    <td><p>El mes seleccionado no posee gastos</p></td>
                                </tr>   
                            </thead>`;
        } else {
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
                    <tbody>
            `;

            let sumaGastos = 0;

            gastosMes.forEach((gasto, index) => {
                tabla += `
                    <tr>
                        <td><i class="bi bi-dot"></i></td>
                        <td>${gasto.descripcion}</td>
                        <td>$${gasto.monto.toFixed(2)}</td>
                        <td>
                            <button type="button" class="btn btn-outline-dark" data-bs-toggle="tooltip" data-bs-placement="top" title="Editar" onclick="editarGasto(${index})"><i class="bi bi-pencil-fill"></i></button>
                            <button type="button" class="btn btn-outline-dark" data-bs-toggle="tooltip" data-bs-placement="top" title="Eliminar" onclick="eliminarGasto(${index})"><i class="bi bi-x"></i></button>
                        </td>
                    </tr>
                `;
                sumaGastos += gasto.monto;
            });

            tabla += `
                    </tbody>
                    <tfoot class="table-dark">
                        <tr>
                            <td>Total</td>
                            <td></td>
                            <td>$${sumaGastos.toFixed(2)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            `;

            resultadosDiv.innerHTML = contenido + tabla;
        }
        
    } catch (error) {
        console.error("Error al obtener gastoS:", error);
    }
    finally{
        loader.style.display = "none";
    }
}


window.editarGasto = editarGasto;
async function editarGasto(index) {
    let mes = document.getElementById("mesSelect").value;
    let year = document.getElementById("anioSelect").value;
    let claveMesAño = `${mes}_${year}`;
    let gastosMesDoc = doc(gastosPorMes, claveMesAño);

    try {
        const docSnap = await getDoc(gastosMesDoc);
        let gastosMes = docSnap.exists() ? docSnap.data().gastos || [] : [];
        let gasto = gastosMes[index];

        if (!gasto) {
            alert('gasto no encontrado.');
            return;
        }

        document.getElementById('editarDescripcion').value = gasto.descripcion;
        document.getElementById('editarMonto').value = gasto.monto.toFixed(2);
        document.getElementById('editarIndex').value = index;

        let editarGastoModal = new bootstrap.Modal(document.getElementById('editarGastoModal'));
        editarGastoModal.show();
    } catch (error) {
        console.error("Error al obtener gasto para editar:", error);
    }
}
window.guardarEdicionGasto = guardarEdicionGasto;
async function guardarEdicionGasto() {
    const loader = document.getElementById("loader");
    loader.style.display = "block"; 
  let mes = document.getElementById("mesSelect").value;
  let year = document.getElementById("anioSelect").value;
  let claveMesAño = `${mes}_${year}`;
  let gastosMesDoc = doc(gastosPorMes, claveMesAño);

  let index = parseInt(document.getElementById('editarIndex').value, 10);
  let descripcion = document.getElementById('editarDescripcion').value.trim();
  let monto = parseFloat(document.getElementById('editarMonto').value);

  if (isNaN(monto) || monto <= 0) {
      alert('Por favor, ingresa un monto válido.');
      loader.style.display = "none"; 
      return;
  }

  try {
      const docSnap = await getDoc(gastosMesDoc);
      let gastosMes = docSnap.exists() ? docSnap.data().gastos || [] : [];

      if (index >= 0 && index < gastosMes.length) {
          let gastoAntiguo = gastosMes[index];
          let diferencia = monto - gastoAntiguo.monto;  

          gastosMes[index] = { descripcion: descripcion, monto: monto };

          await updateDoc(gastosMesDoc, {
            gastos: gastosMes
          });

          if (diferencia > 0) {
              actualizarMontoActual(-diferencia);  
          } else {
              actualizarMontoActual(-diferencia);  
          }

          consultarGasto();
          let editarGastoModal = bootstrap.Modal.getInstance(document.getElementById('editarGastoModal'));
          editarGastoModal.hide();
      } else {
          alert('Índice de gasto no válido.');
      }
  } catch (error) {
      console.error("Error al guardar edición de gasto:", error);
  }
  finally {
    loader.style.display = "none"; 
}
}

window.eliminarGasto = eliminarGasto;
async function eliminarGasto(index) {
    const loader = document.getElementById("loader");
    loader.style.display = "block"; 
  let mes = document.getElementById("mesSelect").value;
  let year = document.getElementById("anioSelect").value;
  let claveMesAño = `${mes}_${year}`;
  let gastosMesDoc = doc(gastosPorMes, claveMesAño);

  try {
      const docSnap = await getDoc(gastosMesDoc);
      let gastosMes = docSnap.exists() ? docSnap.data().gastos || [] : [];

      if (confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
          let gastoEliminado = gastosMes[index];
          let montoEliminado = gastoEliminado.monto;

          gastosMes.splice(index, 1);

          await updateDoc(gastosMesDoc, {
            gastos: gastosMes.length > 0 ? gastosMes : deleteField()
          });

          actualizarMontoActual(+montoEliminado);

          consultarGasto();
      }
  } catch (error) {
      console.error("Error al eliminar gasto:", error);
  }finally {
    loader.style.display = "none"; 
}
} 
