// ======================================================================
// ARQUIVO: vitrini-firebase.js (VERSÃO CORRIGIDA PARA O PROJETO PETS)
// Projeto: prontipro-96d26
// Esta versão usa as chaves "hardcoded" (escritas direto)
// para evitar o erro "import.meta.env is undefined".
// ======================================================================

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Configuração do Firebase para o projeto prontipro-96d26 (Pets)
// Estas são as chaves que você me passou e que estão corretas.
const firebaseConfig = {
  apiKey: "AIzaSyBxGAvU6lUWvmx-C6a98DTOdA3bfywuy7A",
  authDomain: "prontipro-96d26.firebaseapp.com",
  projectId: "prontipro-96d26",
  storageBucket: "prontipro-96d26.appspot.com",
  messagingSenderId: "700778884814",
  appId: "1:700778884814:web:c4dc06a048e25960f7aa9f"
};

// Inicialização Singleton do App
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Instâncias dos serviços Firebase
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// ✅ CORREÇÃO IMPORTANTE:
// Adiciona o Client ID do Google que consertamos mais cedo.
// Isso evita o erro 401 (deleted_client) no login com Google.
provider.setCustomParameters({
  client_id: "700778884814-krc5p10jhgaeal9tf0hll8v73u837o1e.apps.googleusercontent.com",
  prompt: "select_account"
});

// Define a persistência do login
setPersistence(auth, browserLocalPersistence);

// Exporta as instâncias para o restante do seu app
export { app, auth, db, storage, provider };
