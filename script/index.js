import {signOut} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


const ingresosCollection = collection(db, 'ingresos');

function agregarIngreso() {
    // ... (tu código actual para obtener los datos del formulario)
  
    // Crear un objeto con los datos del ingreso
    const ingresoData = {
      mes: mes,
      descripcion: descIngreso,
      monto: ingresoNeto,
      ahorro: ahorro,
      year: yearSeleccionado // Asegúrate de incluir el año
    };
  
    // Agregar el documento a la colección
    addDoc(ingresosCollection, ingresoData)
      .then((docRef) => {
        console.log("Ingreso agregado con ID:", docRef.id);
        // Actualizar el monto actual y el total de ahorros (si es necesario)
        // ...
      })
      .catch((error) => {
        console.error("Error al agregar ingreso:", error);
      });
  
    // ... (tu código actual para limpiar el formulario)
  }
  

