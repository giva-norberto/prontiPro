// ======================================================================
// ARQUIVO: firebase-config.js (VERSÃO FINAL, PADRONIZADA E CORRIGIDA)
// ======================================================================

// ✅ Importação direta da CDN do Firebase (versão 10.13.2)
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// ✅ Configuração do projeto (prontipro-96d26)
const firebaseConfig = {
    apiKey: "AIzaSyAoMzmcLv9BvDPln-OUg3kB4jxy8HlxJQE",
    authDomain: "prontipro-96d26.firebaseapp.com",
    projectId: "prontipro-96d26",
    storageBucket: "prontipro-96d26.appspot.com", // ✅ formato correto do bucket
    messagingSenderId: "700778884814",
    appId: "1:700778884814:web:c4dc06a048e25960f7aa9f"
};

// ✅ Função singleton para evitar inicializações múltiplas
const getFirebaseApp = () => {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
};

// Inicializa a instância única
const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// Configurações adicionais para login Google
provider.setCustomParameters({ prompt: "select_account" });
setPersistence(auth, browserLocalPersistence);

// ✅ Exporta as instâncias para uso em todo o app
export { app, db, auth, storage, provider };
