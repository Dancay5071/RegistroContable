//consultarIngreso.js
import { doc, getDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { ingresosPorMes, actualizarMontoActual } from "../utilidades/firebase.js";

window.consultarIngreso = consultarIngreso;

async function consultarIngreso() {
    let mes = document.getElementById("inputGroupSelect01").value;
    let resultadosDiv = document.getElementById('resultadosIngresos');

    if (mes === '' || mes === 'Selecciona el mes') {
        alert('Por favor, selecciona un mes.');
        return;
    }

    
    let year = new Date().getFullYear();
    let claveMesAño = `${mes}_${year}`;
    let ingresosMesDoc = doc(ingresosPorMes, claveMesAño);

    try {
        const docSnap = await getDoc(ingresosMesDoc);
        let ingresosMes = docSnap.exists() ? docSnap.data().ingresos || [] : [];

        resultadosDiv.innerHTML = '';

        let contenido = `<table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <td><h4>Ingresos de ${mes} ${year}</h4></td>
                                </tr>   
                            </thead>`;

        if (ingresosMes.length === 0) {
            resultadosDiv.innerHTML = contenido + `<thead>
                                <tr>
                                    <td><p>El mes seleccionado no posee ingresos</p></td>
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

            let sumaIngresos = 0;

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
                    </tr>
                `;
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
                </table>
            `;

            resultadosDiv.innerHTML = contenido + tabla;
        }
        
    } catch (error) {
        console.error("Error al obtener ingresos:", error);
    }
}

// Actualiza la función editarIngreso para trabajar con Firestore
window.editarIngreso = editarIngreso;
async function editarIngreso(index) {
    let mes = document.getElementById("inputGroupSelect01").value;
    let year = new Date().getFullYear();
    let claveMesAño = `${mes}_${year}`;
    let ingresosMesDoc = doc(ingresosPorMes, claveMesAño);

    try {
        const docSnap = await getDoc(ingresosMesDoc);
        let ingresosMes = docSnap.exists() ? docSnap.data().ingresos || [] : [];
        let ingreso = ingresosMes[index];

        if (!ingreso) {
            alert('Ingreso no encontrado.');
            return;
        }

        document.getElementById('editarDescripcion').value = ingreso.descripcion;
        document.getElementById('editarMonto').value = ingreso.monto.toFixed(2);
        document.getElementById('editarIndex').value = index;

        let editarIngresoModal = new bootstrap.Modal(document.getElementById('editarIngresoModal'));
        editarIngresoModal.show();
    } catch (error) {
        console.error("Error al obtener ingreso para editar:", error);
    }
}
window.guardarEdicionIngreso = guardarEdicionIngreso;
async function guardarEdicionIngreso() {
  let mes = document.getElementById("inputGroupSelect01").value;
  let year = new Date().getFullYear();
  let claveMesAño = `${mes}_${year}`;
  let ingresosMesDoc = doc(ingresosPorMes, claveMesAño);

  let index = parseInt(document.getElementById('editarIndex').value, 10);
  let descripcion = document.getElementById('editarDescripcion').value.trim();
  let monto = parseFloat(document.getElementById('editarMonto').value);

  
  if (isNaN(monto) || monto <= 0) {
      alert('Por favor, ingresa un monto válido.');
      return;
  }

  try {
      const docSnap = await getDoc(ingresosMesDoc);
      let ingresosMes = docSnap.exists() ? docSnap.data().ingresos || [] : [];

      if (index >= 0 && index < ingresosMes.length) {
          let ingresoAntiguo = ingresosMes[index];
          let difference = monto - ingresoAntiguo.monto;  

          ingresosMes[index] = { descripcion: descripcion, monto: monto };

          await updateDoc(ingresosMesDoc, {
              ingresos: ingresosMes
          });

          consultarIngreso();
          actualizarMontoActual(difference);  

          let editarIngresoModal = bootstrap.Modal.getInstance(document.getElementById('editarIngresoModal'));
          editarIngresoModal.hide();
      } else {
          alert('Índice de ingreso no válido.');
      }
  } catch (error) {
      console.error("Error al guardar edición de ingreso:", error);
  }
}


window.eliminarIngreso = eliminarIngreso;
async function eliminarIngreso(index) {
  let mes = document.getElementById("inputGroupSelect01").value;
  let year = new Date().getFullYear();
  let claveMesAño = `${mes}_${year}`;
  let ingresosMesDoc = doc(ingresosPorMes, claveMesAño);

  try {
      const docSnap = await getDoc(ingresosMesDoc);
      let ingresosMes = docSnap.exists() ? docSnap.data().ingresos || [] : [];

      if (confirm('¿Estás seguro de que deseas eliminar este ingreso?')) {
      
          let ingresoEliminado = ingresosMes[index];
          let montoEliminado = ingresoEliminado.monto;

         
          ingresosMes.splice(index, 1);

         
          await updateDoc(ingresosMesDoc, {
              ingresos: ingresosMes.length > 0 ? ingresosMes : deleteField()
          });

          
          actualizarMontoActual(-montoEliminado);  

          
          consultarIngreso();
      }
  } catch (error) {
      console.error("Error al eliminar ingreso:", error);
  }
}

