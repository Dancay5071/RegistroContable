
let ingresos = JSON.parse(localStorage.getItem('ingresos')) || [];
let gastos = JSON.parse(localStorage.getItem('gastos')) || [];
let montoActual = parseFloat(localStorage.getItem('montoActual')) || 0;
let ingresosPorMes = JSON.parse(localStorage.getItem('ingresosPorMes')) || {};
let gastosPorMes = JSON.parse(localStorage.getItem('gastosPorMes')) || {};
let totalAhorros = parseFloat(localStorage.getItem('totalAhorros')) || 0;
let ahorrosPorMes = JSON.parse(localStorage.getItem('ahorrosPorMes')) || {};
let yearSeleccionado = new Date().getFullYear();




document.addEventListener('DOMContentLoaded', function() {
    
    const pageId = document.body.id;

    if (pageId === 'paginaAhorro' || pageId === 'paginaHome') {
        document.getElementById('totalAhorros').textContent = 'Total de ahorros: $' + totalAhorros.toFixed(2);
        actualizarMontoActual(); 
     }else{
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
            
            if (pageId === 'paginaResumen') {
                resumenAnual(); 
            }
        });

        yearSeleccionado = parseInt(yearSelect.value, 10);
        actualizarMontoActual();

        
        if (pageId === 'paginaResumen') {
            resumenAnual(); 
        }
    }
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

    let ahorro = (ingreso * porcentajeAhorro) / 100;
    let ingresoNeto = ingreso - ahorro; 

    let claveMesAño = `${mes}-${yearSeleccionado}`;
    if (!ingresosPorMes[claveMesAño]) {
        ingresosPorMes[claveMesAño] = [];
    }

    ingresosPorMes[claveMesAño].push({ descripcion: descIngreso, monto: ingresoNeto });
    montoActual += ingresoNeto; 

    if (!ahorrosPorMes[claveMesAño]) {
        ahorrosPorMes[claveMesAño] = 0;
    }
    ahorrosPorMes[claveMesAño] += ahorro;
    document.getElementById('totalAhorros').textContent = 'Total de ahorros: $' + totalAhorros.toFixed(2);

    localStorage.setItem('ingresosPorMes', JSON.stringify(ingresosPorMes));
    localStorage.setItem('montoActual', montoActual.toString());
    localStorage.setItem('totalAhorros', (totalAhorros + ahorro).toString());
    localStorage.setItem('ahorrosPorMes', JSON.stringify(ahorrosPorMes));

    actualizarMontoActual(); 
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

    let ingresosMes = obtenerIngresosPorMes(mes);
    resultadosDiv.innerHTML = '';

    let contenido = `<table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <td><h4>Ingresos de ${mes} ${yearSeleccionado}</h4></td>
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
                    </tr>
                </thead>
                <tbody>
        `;

        let sumaIngresos = 0;

        ingresosMes.forEach(ingreso => {
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

    document.getElementById('montoActual').textContent = 'Monto actual: $' + montoActual.toFixed(2);
    
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
    actualizarMontoActual();
}

function agregarGasto() {
    let mes = document.getElementById("inputGroupSelect01").value;

    if (mes === '' || mes === 'Selecciona el mes') {
        alert('Por favor, selecciona un mes.');
        return;
    }

    let descGasto = document.getElementById("descripcionGasto").value.trim();
    let input = document.getElementById("montoGasto");
    let gasto = parseFloat(input.value);

    if (isNaN(gasto) || gasto <= 0) {
        alert('Por favor, ingresa un monto válido.');
        return;
    }

    let claveMesAño = `${mes}-${yearSeleccionado}`;
    if (!gastosPorMes[claveMesAño]) {
        gastosPorMes[claveMesAño] = [];
    }

    gastosPorMes[claveMesAño].push({ descripcion: descGasto, monto: gasto });
    montoActual -= gasto; 

    localStorage.setItem('gastosPorMes', JSON.stringify(gastosPorMes));
    localStorage.setItem('montoActual', montoActual.toString());

    actualizarMontoActual(); 

    document.getElementById("inputGroupSelect01").value = 'Selecciona el mes';
    document.getElementById("descripcionGasto").value = '';
    document.getElementById("montoGasto").value = '';
}

function obtenerGastosPorMes(mes) {
    return gastosPorMes[`${mes}-${yearSeleccionado}`] || [];
}

function consultarGasto() {
    let mes = document.getElementById("inputGroupSelect01").value;
    let resultadosDiv = document.getElementById('resultadosGastos');

    if (mes === '' || mes === 'Selecciona el mes') {
        alert('Por favor, selecciona un mes.');
        return;
    }

    let gastosMes = obtenerGastosPorMes(mes);
    resultadosDiv.innerHTML = '';

    let contenido = `<table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <td><h4>Gastos de ${mes} ${yearSeleccionado}</h4></td>
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
                    </tr>
                </thead>
                <tbody>
        `;

        let sumaGastos = 0;

        gastosMes.forEach(gasto => {
            tabla += `
                <tr>
                    <td><i class="bi bi-dot"></i></td>
                    <td>${gasto.descripcion}</td>
                    <td>$${gasto.monto.toFixed(2)}</td>
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
                    </tr>
                </tfoot>
            </table>
        `;

        resultadosDiv.innerHTML = contenido + tabla;
    }

    document.getElementById("inputGroupSelect01").value = '';
    actualizarMontoActual();
}

function resumenAnual() {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    let resumenMeses = meses.map(mes => {
        let claveMesAño = `${mes}-${yearSeleccionado}`;
        
        let ingresosMes = obtenerIngresosPorMes(mes);
        let gastosMes = obtenerGastosPorMes(mes);
        let ahorrosMes = ahorrosPorMes[claveMesAño] || 0;

        let totalIngresosMes = ingresosMes.reduce((acc, ingreso) => acc + ingreso.monto, 0);
        let totalGastosMes = gastosMes.reduce((acc, gasto) => acc + gasto.monto, 0);

        return {
            mes,
            ingresos: totalIngresosMes,
            gastos: totalGastosMes,
            ahorros: ahorrosMes,
            restoTotal: totalIngresosMes - totalGastosMes
        };
    });

    
    let resumenDiv = document.getElementById('resumenAnual');
    resumenDiv.innerHTML = `<table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <td><h4> Resumen Anual ${yearSeleccionado}</h4></td>
                            </tr>   
                        </thead>
       <table class="table table-striped table-hover">
            <thead>
                <tr>
                    <th>Concepto</th>
                    ${meses.map(mes => `<th>${mes}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Ingresos</td>
                    ${resumenMeses.map(mesResumen => `<td>$${mesResumen.ingresos.toFixed(2)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Gastos</td>
                    ${resumenMeses.map(mesResumen => `<td>$${mesResumen.gastos.toFixed(2)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Ahorros</td>
                    ${resumenMeses.map(mesResumen => `<td>$${mesResumen.ahorros.toFixed(2)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Resto del mes</td>
                    ${resumenMeses.map(mesResumen => `<td>$${mesResumen.restoTotal.toFixed(2)}</td>`).join('')}
                </tr>
            </tbody>
        </table>
    `;
}

