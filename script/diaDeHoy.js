let meses = new Array ("Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Dieciembre");
let diasSemana = new Array ("Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado");
let d = new Date();
let diaDeHoy = (diasSemana[d.getDay()] + ", " + d.getDate() + " de " + meses[d.getMonth()] + " del " + d.getFullYear());

document.getElementById('diaDeHoy').innerHTML = 'Hoy es ' + diaDeHoy;

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }
    });
    calendar.render();
});