// ======================================================================
// ARQUIVO: firebase-config.js (VERSÃO FINAL, COMPLETA E CORRIGIDA)
// ======================================================================

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Configuração do Firebase com a apiKey CORRETA do seu projeto.
const firebaseConfig = {
    // ✅ CORREÇÃO CRÍTICA APLICADA AQUI:
    apiKey: "AIzaSyAoMzmcLv9BvDPln-OUg3kB4jxy8HlxJQE", 
    
    authDomain: "prontipro-96d26.firebaseapp.com",
    projectId: "prontipro-96d26",
    storageBucket: "prontipro-96d26.firebasestorage.app", 
    messagingSenderId: "700778884814",
    appId: "1:700778884814:web:c4dc06a048e25960f7aa9f"
};

// Função para garantir que o app seja inicializado apenas uma vez (boa prática ).
const getFirebaseApp = () => {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
};

// Inicializa e exporta os serviços do Firebase
const app = getFirebaseApp();
const auth = getAuth(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Configuração para sempre mostrar a tela de seleção de conta do Google.
provider.setCustomParameters({
    prompt: 'select_account'
});

// Define a persistência do login (mantém o usuário logado entre sessões).
setPersistence(auth, browserLocalPersistence);

// Exporta as instâncias para serem usadas em outros arquivos do seu projeto.
export { app, db, auth, storage, provider };
