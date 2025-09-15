// ======================================================================
// ARQUIVO: firebase-config.js (VERSÃO FINAL, PADRONIZADA E CORRIGIDA)
// ======================================================================

// ✅ ATUALIZAÇÃO 1: Importando diretamente da CDN do Google, como no seu projeto que funciona.
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Configuração correta do seu projeto NOVO (prontipro-96d26 )
const firebaseConfig = {
    // ✅ ATUALIZAÇÃO 2: Usando a chave de API correta e definitiva do seu projeto.
    apiKey: "AIzaSyAoMzmcLv9BvDPln-OUg3kB4jxy8HlxJQE", 
    
    authDomain: "prontipro-96d26.firebaseapp.com",
    projectId: "prontipro-96d26",
    storageBucket: "prontipro-96d26.firebasestorage.app", 
    messagingSenderId: "700778884814",
    appId: "1:700778884814:web:c4dc06a048e25960f7aa9f"
};

// ✅ ATUALIZAÇÃO 3: Usando a função Singleton para evitar inicializações múltiplas, como no seu projeto que funciona.
const getFirebaseApp = () => {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
};

// Inicializa tudo a partir da instância única
const app = getFirebaseApp();
const auth = getAuth(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Configurações que já estavam corretas
provider.setCustomParameters({ prompt: 'select_account' });
setPersistence(auth, browserLocalPersistence);

// Exporta as instâncias para serem usadas em todo o aplicativo
export { app, db, auth, storage, provider };
