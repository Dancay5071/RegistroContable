import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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

export { app, db, auth, ingresosCollection};