// ======================================================================
// ARQUIVO: firebase-config.js (VERSÃO ÚNICA E CENTRALIZADA)
// Projeto: pronti-app-37c6e
// ======================================================================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Configuração do projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBOfsPIr0VLCuZsIzOFPsdm6kdhLb1VvP8",
  authDomain: "pronti-app-37c6e.firebaseapp.com",
  projectId: "pronti-app-37c6e",
  storageBucket: "pronti-app-37c6e.appspot.com",
  messagingSenderId: "736700619274",
  appId: "1:736700619274:web:557aa247905e56fa7e5df3"
};

// Inicializa o app somente uma vez (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Inicializa serviços
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Configura o GoogleAuthProvider forçando escolha de conta
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account',
});

// Define persistência local para login (opcional, mas recomendado)
setPersistence(auth, browserLocalPersistence);

// Exporta as instâncias para uso nos outros arquivos
export { app, db, auth, storage, provider };
