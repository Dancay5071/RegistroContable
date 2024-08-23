
let ingresos = JSON.parse(localStorage.getItem('ingresos')) || [];
let montoActual = parseFloat(localStorage.getItem('montoActual'));
let gastos = JSON.parse(localStorage.getItem('gastos')) || [];

// Función para agregar un nuevo ingreso
function agregarIngreso() {
    // Obtiene los valores de los campos de entrada
    let descIngreso = document.getElementById("descripcionIngreso").value.trim();
    let input = document.getElementById("montoIngreso");
    let ingreso = parseFloat(input.value);

    console.log(descIngreso);
    console.log(ingreso);

    // Verifica si el monto ingresado es válido y la descripción no está vacía
    if (!isNaN(ingreso) && ingreso > 0 && descIngreso !== "") {
        // Agrega el nuevo ingreso al array de ingresos
        ingresos.push({ descripcion: descIngreso, monto: ingreso });
        montoActual += ingreso;

        // Actualiza el almacenamiento local
        localStorage.setItem('ingresos', JSON.stringify(ingresos));
        localStorage.setItem('montoActual', montoActual.toString());

        // Limpia los campos de entrada después de agregar el ingreso
        // Actualiza el monto actual en la página
        document.getElementById('montoActual').innerHTML = 'Monto actual: $' + montoActual.toFixed(2);
    } else {
        alert("Por favor, ingrese una descripción y un monto válido.");
    }
}

