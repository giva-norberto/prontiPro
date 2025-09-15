// ======================================================================
// ARQUIVO: firebase-config.js (VERSÃO "TESTE DE CONFIANÇA")
// ======================================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

// CONFIGURAÇÃO FIXA PARA IGNORAR O CACHE DA VERCEL
const firebaseConfig = {
    // COLE A CHAVE 'ProntiPro-nova' AQUI:
    apiKey: "SUA_CHAVE_DA_VERDADE_AQUI", 
    
    authDomain: "prontipro-96d26.firebaseapp.com",
    projectId: "prontipro-96d26",
    storageBucket: "prontipro-96d26.firebasestorage.app", 
    messagingSenderId: "700778884814",
    appId: "1:700778884814:web:c4dc06a048e25960f7aa9f"
};

// O resto do código permanece o mesmo
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

provider.setCustomParameters({ prompt: 'select_account' });
setPersistence(auth, browserLocalPersistence);

export { app, db, auth, storage, provider };
