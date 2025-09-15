// ======================================================================
// ARQUIVO: vitrini-firebase.js (VERSÃO FINAL PARA O NOVO PROJETO)
// Projeto: prontipro-96d26
// ======================================================================

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Configuração do novo projeto Firebase usando variáveis de ambiente (Vercel + Vite)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Função Singleton: Garante que o app seja inicializado apenas uma vez
const getFirebaseApp = () => {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
};

// Inicializa instâncias a partir da instância única
const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// Configuração especial para sempre mostrar a tela de seleção de conta do Google
provider.setCustomParameters({
  prompt: 'select_account'
});

// Define a persistência do login (mantém o usuário logado entre sessões)
setPersistence(auth, browserLocalPersistence);

// Exporta instâncias para uso em outros arquivos do projeto
export { app, db, auth, storage, provider };
