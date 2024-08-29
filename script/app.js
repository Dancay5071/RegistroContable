
let ingresos = JSON.parse(localStorage.getItem('ingresos')) || [];
let gastos = JSON.parse(localStorage.getItem('gastos')) || [];
let montoActual = parseFloat(localStorage.getItem('montoActual'));

let ingresosPorMes = JSON.parse(localStorage.getItem('ingresosPorMes')) || {};
let gastosPorMes = JSON.parse(localStorage.getItem('gastosPorMes')) || {};

document.getElementById('montoActual').innerHTML = 'Monto actual: $' + montoActual.toFixed(2);

document.addEventListener('DOMContentLoaded', function() {
    const selectElement = document.getElementById('inputGroupSelect01');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const now = new Date();
    const currentMonthIndex = now.getMonth(); 
    
    selectElement.value = months[currentMonthIndex];
  });