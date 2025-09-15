// ======================================================================
// ARQUIVO: firebase-config.js (VERSÃO FINAL, PADRONIZADA E PRONTA PARA VITE + VERCEL)
// Projeto: ProntiPro-nova
// ======================================================================

// ✅ Importação modular do Firebase via CDN (versão 10.13.2)
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// ✅ Configuração do Firebase via variáveis de ambiente do Vite
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// ✅ Função Singleton para evitar inicializações múltiplas
const getFirebaseApp = () => {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
};

// Inicializa instâncias únicas
const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// Configuração adicional para login Google
provider.setCustomParameters({ prompt: "select_account" });
setPersistence(auth, browserLocalPersistence);

// ✅ Exporta as instâncias para uso em todo o projeto
export { app, db, auth, storage, provider };
