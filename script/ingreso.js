class Ingreso extends Dato {
    static contadorIngresos = 0;

    constructor(descripcion, monto) {
        super(descripcion, monto);
        this._id = ++Ingreso.contadorIngresos;
    }

    get id() {
        return this._id;
    }
}
function agregarIngreso() {
    
    let mes = document.getElementById("inputGroupSelect01").value;

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

    
    if (!ingresosPorMes[mes]) {
        ingresosPorMes[mes] = [];
    }

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
function consultarIngreso(){

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
                                <td><h4>Ingresos de ${mes}</h4></td>
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