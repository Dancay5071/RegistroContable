let meses = new Array ("Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Dieciembre");
let diasSemana = new Array ("Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado");
let d = new Date();
let diaDeHoy = (diasSemana[d.getDay()] + ", " + d.getDate() + " de " + meses[d.getMonth()] + " de " + d.getFullYear());

document.getElementById('diaDeHoy').innerHTML = 'Hoy es ' + diaDeHoy;
