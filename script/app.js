
let ingresos = JSON.parse(localStorage.getItem('ingresos')) || [];
let gastos = JSON.parse(localStorage.getItem('gastos')) || [];
let montoActual = parseFloat(localStorage.getItem('montoActual')) || 0;
let ingresosPorMes = JSON.parse(localStorage.getItem('ingresosPorMes')) || {};
let gastosPorMes = JSON.parse(localStorage.getItem('gastosPorMes')) || {};
let totalAhorros = parseFloat(localStorage.getItem('totalAhorros')) || 0;
let ahorrosPorMes = JSON.parse(localStorage.getItem('ahorrosPorMes')) || {};
let yearSeleccionado = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', function() {
    const yearSelect = document.getElementById('inputGroupSelectYear');
    const currentYear = new Date().getFullYear();
    const startYear = 2024;
    const endYear = currentYear + 2;

    for (let year = startYear; year <= endYear; year++) {
        let option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }

    yearSelect.addEventListener('change', function() {
        yearSeleccionado = parseInt(yearSelect.value, 10);
        actualizarMontoActual();
    });

    actualizarMontoActual();
});

function agregarIngreso() {
  let mes = document.getElementById("inputGroupSelect01").value;
  let porcentajeAhorro = parseFloat(document.getElementById("inputGroupSelectPorcentaje").value);

  if (mes === '' || mes === 'Selecciona el mes') {
      alert('Por favor, selecciona un mes.');
      return;
  }

  let descIngreso = document.getElementById("descripcionIngreso").value.trim();
  let input = document.getElementById("montoIngreso");
  let ingreso = parseFloat(input.value);

  if (isNaN(ingreso) || ingreso <= 0) {
      alert('Por favor, ingresa un monto válido.');
      return;
  }

  // Calcular y registrar el ahorro
  let ahorro = (ingreso * porcentajeAhorro) / 100;
  let ingresoNeto = ingreso - ahorro; // Monto después de deducir el ahorro

  // Actualizar ingresos por mes
  let claveMesAño = `${mes}-${yearSeleccionado}`;
  if (!ingresosPorMes[claveMesAño]) {
      ingresosPorMes[claveMesAño] = [];
  }

  ingresosPorMes[claveMesAño].push({ descripcion: descIngreso, monto: ingresoNeto });
  montoActual += ingresoNeto; // Solo sumar el monto neto al total actual

  // Actualizar ahorros por mes
  if (!ahorrosPorMes[claveMesAño]) {
      ahorrosPorMes[claveMesAño] = 0;
  }
  ahorrosPorMes[claveMesAño] += ahorro;

  // Actualizar valores en localStorage
  localStorage.setItem('ingresosPorMes', JSON.stringify(ingresosPorMes));
  localStorage.setItem('montoActual', montoActual.toString());
  localStorage.setItem('totalAhorros', (totalAhorros + ahorro).toString());
  localStorage.setItem('ahorrosPorMes', JSON.stringify(ahorrosPorMes));

  actualizarMontoActual(); // Actualizar el monto y el ahorro en el DOM

  // Limpiar campos
  document.getElementById("inputGroupSelect01").value = 'Selecciona el mes';
  document.getElementById("descripcionIngreso").value = '';
  document.getElementById("montoIngreso").value = '';
  document.getElementById("inputGroupSelectPorcentaje").value = '0';
}

function obtenerIngresosPorMes(mes) {
  return ingresosPorMes[`${mes}-${yearSeleccionado}`] || [];
}


function consultarIngreso() {
    let mes = document.getElementById("inputGroupSelect01").value;
    let resultadosDiv = document.getElementById('resultadosIngresos');

    if (mes === '' || mes === 'Selecciona el mes') {
        alert('Por favor, selecciona un mes.');
        return;
    }

    let ingresos = obtenerIngresosPorMes(mes);
    resultadosDiv.innerHTML = '';

    let contenido = `<table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <td><h4>Ingresos de ${mes} ${yearSeleccionado}</h4></td>
                            </tr>   
                        </thead>`;

    if (ingresos.length === 0) {
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
                    </tr>
                </thead>
                <tbody>
        `;

        let sumaIngresos = 0;

        ingresos.forEach(ingreso => {
            tabla += `
                <tr>
                    <td><i class="bi bi-dot"></i></td>
                    <td>${ingreso.descripcion}</td>
                    <td>$${ingreso.monto.toFixed(2)}</td>
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
                    </tr>
                </tfoot>
            </table>
        `;

        resultadosDiv.innerHTML = contenido + tabla;
    }

    document.getElementById("inputGroupSelect01").value = '';
}

function actualizarMontoActual() {
  montoActual = parseFloat(localStorage.getItem('montoActual')) || 0;
  totalAhorros = parseFloat(localStorage.getItem('totalAhorros')) || 0;

  document.getElementById('montoActual').innerHTML = 'Monto actual: $' + montoActual.toFixed(2);
  document.getElementById('totalAhorros').innerHTML = 'Total de ahorros: $' + totalAhorros.toFixed(2);

}
function extraerAhorro() {
  let cantidadAextraer = prompt("¿Cuánto deseas extraer del ahorro?", "0");
  cantidadAextraer = parseFloat(cantidadAextraer);

  if (isNaN(cantidadAextraer) || cantidadAextraer <= 0) {
      alert('Por favor, ingresa una cantidad válida.');
      return;
  }

  if (cantidadAextraer > totalAhorros) {
      alert('No tienes suficiente ahorro para extraer esa cantidad.');
      return;
  }

  totalAhorros -= cantidadAextraer;
  localStorage.setItem('totalAhorros', totalAhorros.toString());

  // Actualizar el resultado de ahorros en el DOM
  actualizarMontoActual();
}