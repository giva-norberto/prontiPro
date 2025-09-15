// ======================================================================
// ARQUIVO: firebase-config.js (VERSÃO ÚNICA, CENTRAL E VALIDADA)
// Projeto: prontipro
// ID do projeto: prontipro-96d26
// ======================================================================

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Configuração do seu novo projeto Firebase (prontipro-96d26).
const firebaseConfig = {
    apiKey: "AIzaSyAoMzmcLv9BvDPln-OUg3kB4jxy8HlxJQE",
    authDomain: "prontipro-96d26.firebaseapp.com",
    projectId: "prontipro-96d26",
    storageBucket: "prontipro-96d26.appspot.com",
    messagingSenderId: "700778884814",
    appId: "1:700778884814:web:c4dc06a048e25960f7aa9f"
};

// Função Singleton: Garante que o app seja inicializado apenas uma vez.
const getFirebaseApp = () => {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
};

// Inicializa e exporta tudo a partir da instância única
const app = getFirebaseApp();
const auth = getAuth(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// Configuração especial para sempre mostrar a tela de seleção de conta do Google.
provider.setCustomParameters({
    prompt: 'select_account'
});

// ==================================================
// ✅ CORREÇÃO APLICADA AQUI
// Conecta ao banco de dados com nome "prontipro" para manter a consistência.
const db = getFirestore(app, "prontipro");
// ==================================================

// Define a persistência do login (mantém o usuário logado).
setPersistence(auth, browserLocalPersistence);

// Exporta as instâncias para serem usadas em outros arquivos
export { app, db, auth, storage, provider };
