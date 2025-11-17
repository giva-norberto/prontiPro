// ======================================================================
// ARQUIVO: firebase-config.js (CDN • PRONTO PARA PRODUÇÃO)
// Projeto: ProntiPro Pet / Clone do Pronti
// ======================================================================

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// ===============================
// 🔥 CONFIGURAÇÃO FIREBASE
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyBxGAvU6lUWvmx-C6a98DTOdA3bfywuy7A",
  authDomain: "prontipro-96d26.firebaseapp.com",
  projectId: "prontipro-96d26",
  storageBucket: "prontipro-96d26.firebasestorage.app",
  messagingSenderId: "700778884814",
  appId: "1:700778884814:web:c4dc06a048e25960f7aa9f"
};

// ===============================
// ⚡ EVITA ERRO "App already exists"
// ===============================
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ===============================
// 🔑 GOOGLE AUTH CORRIGIDO
// ===============================
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// *** CLIENT ID ATUALIZADO E VÁLIDO ***
provider.setCustomParameters({
  client_id: "700778884814-dkuff93guqp6b02278j5v9b8u18l2mvd.apps.googleusercontent.com",
  prompt: "select_account"
});

// Mantém a sessão
setPersistence(auth, browserLocalPersistence);

// ===============================
const db = getFirestore(app);
const storage = getStorage(app);

// Exporta tudo
export { app, auth, db, storage, provider };
