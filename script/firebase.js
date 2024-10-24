window.agregarIngreso = agregarIngreso;

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";



const firebaseConfig = {
  apiKey: "AIzaSyDLmkvM8O3zbXyP_hvrq3M77NuqwCTJ4Fk",
  authDomain: "registrocontable32.firebaseapp.com",
  projectId: "registrocontable32",
  storageBucket: "registrocontable32.appspot.com",
  messagingSenderId: "914035079269",
  appId: "1:914035079269:web:7020216b520c16ccd9ee8c"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const navbar = document.getElementById('navbar');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginForm = document.querySelector('#loginForm');

//Colecciones

const ingresosCollection = collection(db, 'ingresos');
const gastosCollection = collection(db,'gastos');
const ahorrosCollection = collection(db,'ahorros');

//Login

document.addEventListener('DOMContentLoaded', function () {
onAuthStateChanged(auth, (user) => {
  if (user) {
      navbar.classList.remove('d-none');
      loginBtn.classList.add('d-none');
  } else {
      navbar.classList.add('d-none');
      loginBtn.classList.remove('d-none');
  }
});


document.getElementById('#loginSubmit').addEventListener('click', async (e) => {
  e.preventDefault();
  const email = loginForm['email'].value;
  const password = loginForm['password'].value;
  try {
      await signInWithEmailAndPassword(auth, email, password);
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      modal.hide();
  } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      alert('Error al iniciar sesión');
  }
});


logoutBtn.addEventListener('click', async () => {
  try {
      await signOut(auth);
      alert('Sesión cerrada');
  } catch (error) {
      console.error('Error al cerrar sesión:', error.message);
  }
});
});

//Seleccion de año

document.addEventListener('DOMContentLoaded', function () {
  const yearSelect = document.getElementById("inputGroupSelectYear");
  if (yearSelect) {
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      const nextYear = currentYear + 1;
      
      yearSelect.innerHTML = `
          <option value="${previousYear}">${previousYear}</option>
          <option value="${currentYear}" selected>${currentYear}</option>
          <option value="${nextYear}">${nextYear}</option>
      `;
  } else {
      console.error("El elemento yearSelect no está presente en el DOM.");
  }
});



let ingresosPorMes = {};  
let ahorrosPorMes = {};  
let montoActual = 0;      
let totalAhorros = 0;     

//Ingresos

async function agregarIngreso() {
  let mes = document.getElementById("inputGroupSelect01").value;
  let yearSeleccionado = document.getElementById("inputGroupSelectYear").value; 
  let porcentajeAhorro = parseFloat(document.getElementById("inputGroupSelectPorcentaje").value);
  let descIngreso = document.getElementById("descripcionIngreso").value.trim();
  let ingreso = parseFloat(document.getElementById("montoIngreso").value);

  if (mes === '' || mes === 'Selecciona el mes') {
    alert('Por favor, selecciona un mes.');
    return;
  }

  if (yearSeleccionado === '' || yearSeleccionado === 'Selecciona el año') {
    alert('Por favor, selecciona un año.');
    return;
  }

  if (isNaN(ingreso) || ingreso <= 0) {
    alert('Por favor, ingresa un monto válido.');
    return;
  }

  let ahorro = (ingreso * porcentajeAhorro) / 100;
  let ingresoNeto = ingreso - ahorro;
  let claveMesAño = `${mes}-${yearSeleccionado}`;

  if (!ingresosPorMes[claveMesAño]) {
    ingresosPorMes[claveMesAño] = [];
  }
  
  ingresosPorMes[claveMesAño].push({ descripcion: descIngreso, monto: ingresoNeto });
  montoActual += ingresoNeto;

  if (!ahorrosPorMes[claveMesAño]) {
    ahorrosPorMes[claveMesAño] = 0;
  }

  ahorrosPorMes[claveMesAño] += ahorro;
  totalAhorros += ahorro;

  const ingresoData = {
    mes: mes,
    descripcion: descIngreso,
    monto: ingresoNeto,
    ahorro: ahorro,
    year: yearSeleccionado
  };

  try {
    await addDoc(ingresosCollection, ingresoData);
    console.log("Ingreso agregado con éxito.");
  } catch (error) {
    console.error("Error al agregar ingreso:", error);
  }

  document.getElementById("inputGroupSelect01").value = 'Selecciona el mes';
  document.getElementById("descripcionIngreso").value = '';
  document.getElementById("montoIngreso").value = '';
  document.getElementById("inputGroupSelectPorcentaje").value = '0';
}

// Consultar ingreso

export async function consultarIngreso() {
  let mes = document.getElementById("inputGroupSelect01").value;
  let yearSeleccionado = document.getElementById("inputGroupSelectYear").value;  // Captura el año seleccionado
  let resultadosDiv = document.getElementById('resultadosIngresos');

  if (mes === '' || mes === 'Selecciona el mes') {
    alert('Por favor, selecciona un mes.');
    return;
  }

  if (yearSeleccionado === '' || yearSeleccionado === 'Selecciona el año') {
    alert('Por favor, selecciona un año.');
    return;
  }

  resultadosDiv.innerHTML = '';

  let contenido = `<table class="table table-striped table-hover">
                      <thead>
                          <tr>
                              <td><h4>Ingresos de ${mes} ${yearSeleccionado}</h4></td>
                          </tr>   
                      </thead>`;

  const ingresosQuery = query(
    ingresosCollection,
    where("mes", "==", mes),
    where("year", "==", yearSeleccionado)
  );

  try {
    const querySnapshot = await getDocs(ingresosQuery);
    let ingresosMes = [];
    let sumaIngresos = 0;

    querySnapshot.forEach((doc) => {
      let ingreso = doc.data();
      ingresosMes.push(ingreso);
    });

    if (ingresosMes.length === 0) {
      resultadosDiv.innerHTML = contenido + `
        <thead>
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
              <th></th> 
            </tr>
          </thead>
          <tbody>`;

      ingresosMes.forEach((ingreso, index) => {
        tabla += `
          <tr>
            <td><i class="bi bi-dot"></i></td>
            <td>${ingreso.descripcion}</td>
            <td>$${ingreso.monto.toFixed(2)}</td>
            <td>
              <button type="button" class="btn btn-outline-dark" data-bs-toggle="tooltip" data-bs-placement="top" title="Editar" onclick="editarIngreso(${index})"><i class="bi bi-pencil-fill"></i></button>
              <button type="button" class="btn btn-outline-dark" data-bs-toggle="tooltip" data-bs-placement="top" title="Eliminar" onclick="eliminarIngreso(${index})"><i class="bi bi-x"></i></button>
            </td>
          </tr>`;
        sumaIngresos += ingreso.monto;
      });

      tabla += `
          </tbody>
          <tfoot class="table-dark">
            <tr>
              <td>Total</td>
              <td></td>
              <td>$${sumaIngresos.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>`;

      resultadosDiv.innerHTML = contenido + tabla;
    }

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(tooltipTriggerEl => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });

    document.getElementById("inputGroupSelect01").value = mes;

  } catch (error) {
    console.error("Error al consultar los ingresos:", error);
    alert("Ocurrió un error al consultar los ingresos.");
  }
}


export { db, auth };
