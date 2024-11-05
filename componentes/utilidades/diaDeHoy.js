//fecha actual
let meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
let diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
let d = new Date();

function actualizarFecha() {
    let formatoCompleto = diasSemana[d.getDay()] + ", " + d.getDate() + " de " + meses[d.getMonth()] + " del " + d.getFullYear();
    let formatoCorto = d.getDate() + " de " + meses[d.getMonth()] + " de " + d.getFullYear(); 

    if (window.innerWidth < 768) { // Cambiar el tamaño según lo necesites
        document.getElementById('diaDeHoy').innerHTML =  formatoCorto;
    } else {
        document.getElementById('diaDeHoy').innerHTML =  formatoCompleto;
    }
}

actualizarFecha();

window.addEventListener('resize', actualizarFecha);


