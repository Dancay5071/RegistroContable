//firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

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
const ingresosCollection = collection(db, 'ingresos');
const gastosCollection = collection(db, 'gastos');
const ingresosPorMes = collection(db, 'ingresosPorMes');
const gastosPorMes = collection(db, 'gastosPorMes');
const ahorrosPorMes = collection(db, 'ahorrosPorMes');
const settingsDoc = doc(db, "settings", "montoActual");
const settingDoc = doc(db, "setting", "totalAhorros");

// Inicializar y actualizar el montoActual en Firebase
async function inicializarMontoActual() {
  const settingsSnapshot = await getDoc(settingsDoc);
  if (!settingsSnapshot.exists()) {
    await setDoc(settingsDoc, { montoActual: 0 });
  }
}

async function actualizarMontoActual(nuevoMonto) {
  try {
      if (isNaN(nuevoMonto)) {
          console.error("Error: nuevoMonto no es un número válido");
          return;
      }

      const montoDoc = await getDoc(settingsDoc);
      const montoActual = montoDoc.exists() && !isNaN(montoDoc.data().montoActual) 
                          ? montoDoc.data().montoActual 
                          : 0;
      
      await updateDoc(settingsDoc, { montoActual: montoActual + nuevoMonto });
  } catch (error) {
      console.error("Error al actualizar monto actual:", error);
  }
}
//Inicializar y actualizar totalAhorros en Firebase
async function inicializarAhorroActual() {
  const settingSnapshot = await getDoc(settingDoc);
  if (!settingSnapshot.exists()) {
    await setDoc(settingDoc, { totalAhorros: 0 });
  }
}

async function actualizarAhorroActual(ahorro) {
  try {
    if (isNaN(ahorro)) {
      console.error("Error: nuevoAhorro no es un número válido");
      return;
    }
    
    const ahorroDoc = await getDoc(settingDoc);
    const ahorroActual = ahorroDoc.exists() && !isNaN(ahorroDoc.data().totalAhorros) 
                        ? ahorroDoc.data().totalAhorros
                        : 0;

    await updateDoc(settingDoc, { totalAhorros: ahorroActual + ahorro });
  } catch (error) {
    console.error("Error al actualizar ahorro actual:", error);
  }
}
// Llamada inicial
inicializarMontoActual();
inicializarAhorroActual()


export { app, db, auth, ingresosCollection, gastosCollection, gastosPorMes, ingresosPorMes, ahorrosPorMes, settingsDoc, settingDoc, actualizarMontoActual, actualizarAhorroActual };