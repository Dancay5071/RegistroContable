
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
    
    if (mes === 'Selecciona el mes') {
        alert('Por favor, selecciona un mes.');
        return;
    }

    let descGasto = document.getElementById("descripcionGasto").value.trim();
    let input = document.getElementById("montoGasto");
    let gasto = parseFloat(input.value);


    if (!gastosPorMes[mes]) {
        gastosPorMes[mes] = [];
    }

    console.log(mes);
    console.log(descGasto);
    console.log(gasto);


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

    
