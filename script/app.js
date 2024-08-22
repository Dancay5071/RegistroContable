

let ingresos = JSON.parse(localStorage.getItem('ingresos')) || [];
let montoActual = parseFloat(localStorage.getItem('montoActual')) || 0;
let gastos = JSON.parse(localStorage.getItem('gastos')) || [];

// Función para agregar un ingreso
function agregarIngreso() {
    let input = document.getElementById("montoIngreso");
    let ingreso = parseFloat(input.value);

    if (!isNaN(ingreso) && ingreso > 0) {
        ingresos.push(ingreso); // Agrega el ingreso al array
        montoActual += ingreso; // Actualiza el monto actual

        // Actualiza localStorage
        localStorage.setItem('ingresos', JSON.stringify(ingresos));
        localStorage.setItem('montoActual', montoActual);

        // Actualiza la lista de ingresos en la página
        let listaIngreso = document.getElementById("listaIngresos");
        listaIngreso.innerHTML = "";

        ingresos.forEach(function(ingreso) {
            let item = document.createElement("li");
            item.textContent = ingreso;
            listaIngreso.appendChild(item);
        });

        // Limpia el campo de input después de agregar el ingreso
        input.value = "";

        // Actualiza el monto actual en la página
        document.getElementById('montoActual').innerHTML = 'Monto actual: $ ' + montoActual.toFixed(2);
    } else {
        alert("Por favor, ingrese un monto válido.");
    }
}

// Función para agregar un gasto
function agregarGasto() {
    let input = document.getElementById("montoGasto");
    let gasto = parseFloat(input.value);

    if (!isNaN(gasto) && gasto > 0) {
        gastos.push(gasto); // Agrega el gasto al array
        montoActual -= gasto; // Actualiza el monto actual

        // Actualiza localStorage
        localStorage.setItem('gastos', JSON.stringify(gastos));
        localStorage.setItem('montoActual', montoActual);

        // Actualiza la lista de gastos en la página
        let listaGasto = document.getElementById("listaGastos");
        listaGasto.innerHTML = "";

        gastos.forEach(function(gasto) {
            let item = document.createElement("li");
            item.textContent = gasto;
            listaGasto.appendChild(item);
        });

        // Limpia el campo de input después de agregar el gasto
        input.value = "";

        // Actualiza el monto actual en la página
        document.getElementById('montoActual').innerHTML = 'Monto actual: $ ' + montoActual.toFixed(2);
    } else {
        alert("Por favor, ingrese un monto válido.");
    }
}

// Inicializa la lista de ingresos, gastos y monto actual cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('montoActual').innerHTML = 'Monto actual: $ ' + montoActual.toFixed(2);

    let listaIngreso = document.getElementById("listaIngresos");
    ingresos.forEach(function(ingreso) {
        let item = document.createElement("li");
        item.textContent = ingreso;
        listaIngreso.appendChild(item);
    });

    let listaGasto = document.getElementById("listaGastos");
    gastos.forEach(function(gasto) {
        let item = document.createElement("li");
        item.textContent = gasto;
        listaGasto.appendChild(item);
    });
});