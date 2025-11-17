// ======================================================================
// ARQUIVO: firebase-config.js (CDN • PRONTO PARA PRODUÇÃO)
// Projeto: ProntiPro Pet / Clone do Pronti
// ======================================================================

// Firebase CDN v10.13.2 (módulos ES)
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Configuração do Firebase (você pode atualizar sem risco)
const firebaseConfig = {
  apiKey: "AIzaSyBxGAvU6lUWvmx-C6a98DTOdA3bfywuy7A",
  authDomain: "prontipro-96d26.firebaseapp.com",
  projectId: "prontipro-96d26",
  storageBucket: "prontipro-96d26.firebasestorage.app",
  messagingSenderId: "700778884814",
  appId: "1:700778884814:web:c4dc06a048e25960f7aa9f"
};

// ✨ Singleton para evitar erro "app already initialized"
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Instâncias exportadas
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// Mantém sessão logada
setPersistence(auth, browserLocalPersistence);

// Login Google com seleção de conta
provider.setCustomParameters({ prompt: "select_account" });

// Exporta para uso em qualquer arquivo
export { app, auth, db, storage, provider };

