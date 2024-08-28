
let ingresos = JSON.parse(localStorage.getItem('ingresos')) || [];
let gastos = JSON.parse(localStorage.getItem('gastos')) || [];
let montoActual = parseFloat(localStorage.getItem('montoActual'));

let ingresosPorMes = JSON.parse(localStorage.getItem('ingresosPorMes')) || {};
let gastosPorMes = JSON.parse(localStorage.getItem('gastosPorMes')) || {};

document.getElementById('montoActual').innerHTML = 'Monto actual: $' + montoActual.toFixed(2);

function agregarIngreso() {
    
    let mes = document.getElementById("inputGroupSelect01").value;
    
    if (mes === 'Selecciona el mes') {
        alert('Por favor, selecciona un mes.');
        return;
    }

    let descIngreso = document.getElementById("descripcionIngreso").value.trim();
    let input = document.getElementById("montoIngreso");
    let ingreso = parseFloat(input.value);


    if (!ingresosPorMes[mes]) {
        ingresosPorMes[mes] = [];
    }

    console.log(mes);
    console.log(descIngreso);
    console.log(ingreso);


    ingresosPorMes[mes].push({ descripcion: descIngreso, monto: ingreso });
    montoActual += ingreso;


    localStorage.setItem('ingresosPorMes', JSON.stringify(ingresosPorMes));
    localStorage.setItem('montoActual', montoActual.toString());

    document.getElementById('montoActual').innerHTML = 'Monto actual: $' + montoActual.toFixed(2);

   
    document.getElementById("inputGroupSelect01").value = 'Selecciona el mes';
    document.getElementById("descripcionIngreso").value = '';
    document.getElementById("montoIngreso").value = '';
}

function obtenerIngresosPorMes(mes) {
    return ingresosPorMes[mes] || [];
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

    
    if (!gastosPorMes[mes]) {
        gastosPorMes[mes] = [];
    }

    gastosPorMes[mes].push({ descripcion: descGasto, monto: gasto });
    montoActual -= gasto;

    localStorage.setItem('gastosPorMes', JSON.stringify(gastosPorMes));
    localStorage.setItem('montoActual', montoActual.toString());


    document.getElementById('montoActual').innerHTML = 'Monto actual: $' + montoActual.toFixed(2);

    document.getElementById("inputGroupSelect01").value = 'Selecciona el mes';
    document.getElementById("descripcionGasto").value = '';
    document.getElementById("montoGasto").value = '';
}

function obtenerGastosPorMes(mes) {
    return gastosPorMes[mes] || [];
}

function consultarIngreso(){

    let mes = document.getElementById("inputGroupSelect01").value;
    let resultadosDiv = document.getElementById('resultadosIngresos');

    if (mes === 'Selecciona el mes') {
        alert('Por favor, selecciona un mes.');
        return;
    }

    let ingresos = obtenerIngresosPorMes(mes);
    resultadosDiv.innerHTML = ''; 

    if (ingresos.length === 0) {
        resultadosDiv.innerHTML = '<p>El mes seleccionado no posee ingresos registrados.</p>';
    } else {
        let tabla = '<table class="table table-striped table-hover"><thead><tr><th>Descripción</th><th>Monto</th></tr></thead><tbody>';

        ingresos.forEach(ingreso => {
            tabla += `<tr><td>${ingreso.descripcion}</td><td>$${ingreso.monto.toFixed(2)}</td></tr>`;
        });

        tabla += '</tbody></table>';
        resultadosDiv.innerHTML = tabla;
    }
    document.getElementById("inputGroupSelect01").value = 'Selecciona el mes';
}

function consultarGasto() {

    let mes = document.getElementById("inputGroupSelect01").value;
    let resultadosDiv = document.getElementById('resultadosGastos');

    if (mes === '' || mes === 'Selecciona el mes') {
        alert('Por favor, selecciona un mes.');
        return;
    }

    let gastos = obtenerGastosPorMes(mes);
    resultadosDiv.innerHTML = '';

    let contenido = `<table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th><h4>Gastos de ${mes}</h4></th>
                            </tr>   
                        </thead>`;

    if (gastos.length === 0) {
        resultadosDiv.innerHTML = contenido + '<p>El mes seleccionado no posee gastos registrados.</p>';
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

        gastos.forEach(gasto => {
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
}