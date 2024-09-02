class Gasto extends Dato{
    static contadorGasto = 0;

    constructor(descripcion, monto){
        super(descripcion, monto);
        this._id = ++Gasto.contadorGasto;
    }
    get id(){
        return this._id;
    }
}
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
    }
});
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
                                <td><h4>Gastos de ${mes}</h4></td>
                            </tr>   
                        </thead>`;

    if (gastos.length === 0) {
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