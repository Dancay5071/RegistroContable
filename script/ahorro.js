function obtenerTotalIngresosPorMes(mes) {
    let ingresosPorMes = JSON.parse(localStorage.getItem('ingresosPorMes')) || {};
    let ingresos = ingresosPorMes[mes] || [];
    return ingresos.reduce((total, ingreso) => total + ingreso.monto, 0);
}


function obtenerTotalGastosPorMes(mes) {
    let gastosPorMes = JSON.parse(localStorage.getItem('gastosPorMes')) || {};
    let gastos = gastosPorMes[mes] || [];
    return gastos.reduce((total, gasto) => total + gasto.monto, 0);
}

function guardarAhorro() {
    let mes = document.getElementById("inputGroupSelect01").value;
    let porcentaje = parseFloat(document.getElementById("inputGroupSelectPorcentaje").value);

    if (mes === '' || mes === 'Selecciona el mes') {
        alert('Por favor, selecciona un mes.');
        return;
    }

    if (isNaN(porcentaje) || porcentaje <= 0) {
        alert('Por favor, selecciona un porcentaje válido.');
        return;
    }

    
    let sumaIngresos = obtenerTotalIngresosPorMes(mes);
    let sumaGastos = obtenerTotalGastosPorMes(mes);

    
    let ahorro = sumaIngresos * (porcentaje / 100);

    
    if (ahorro > sumaIngresos - sumaGastos) {
        alert('El ahorro no puede exceder el monto disponible después de gastos.');
        return;
    }

    
    localStorage.setItem('ahorroMes', JSON.stringify({ mes, ahorro }));

    
    alert(`Ahorro de ${mes}: $${ahorro.toFixed(2)}`);
    console.log(`Ahorro de ${mes}: $${ahorro.toFixed(2)}`);
}


document.getElementById('guardarAhorro').addEventListener('click', guardarAhorro);