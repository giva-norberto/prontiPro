// ======================================================================
//             LOGIN.JS (VERSÃO CORRIGIDA PARA USAR FIREBASE COMPAT)
// ======================================================================

// ❌ REMOVEMOS OS IMPORTS, pois o Firebase já foi carregado no HTML.
// import { signInWithPopup, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
// import { auth, provider } from "./firebase-config.js"; 

window.addEventListener('DOMContentLoaded', ( ) => {
    // ✅ DEFINIMOS 'auth' e 'provider' usando o objeto 'firebase' global que o HTML criou.
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    // Captura dos elementos do DOM (mantida)
    const btnLoginGoogle = document.getElementById('btn-login-google');
    const loginForm = document.getElementById('login-form');
    const loginStatusDiv = document.getElementById('login-status');

    // Lógica do Login com Google
    if (btnLoginGoogle) {
        btnLoginGoogle.addEventListener('click', async () => {
            btnLoginGoogle.disabled = true;
            if (loginStatusDiv) loginStatusDiv.textContent = "";

            try {
                // ✅ Usamos a sintaxe "compat" para a função de login
                await auth.signInWithPopup(provider);
                
                // Redirecionamento após sucesso
                window.location.href = 'selecionar-empresa.html';

            } catch (error) {
                console.error("Erro no login com Google:", error);
                if (loginStatusDiv && error.code !== 'auth/popup-closed-by-user') {
                    loginStatusDiv.textContent = 'Não foi possível fazer login com o Google.';
                }
                btnLoginGoogle.disabled = false;
            }
        });
    }

    // Lógica do Login com E-mail e Senha
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (loginStatusDiv) loginStatusDiv.textContent = "";

            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-senha').value;

            try {
                // ✅ Usamos a sintaxe "compat" para a função de login
                await auth.signInWithEmailAndPassword(email, password);

                // Redirecionamento após sucesso
                window.location.href = 'selecionar-empresa.html';

            } catch (error) {
                console.error("Erro no login manual:", error.code);
                if (loginStatusDiv) {
                    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        loginStatusDiv.textContent = 'E-mail ou senha inválidos.';
                    } else {
                        loginStatusDiv.textContent = 'Ocorreu um erro. Tente novamente.';
                    }
                }
                submitButton.disabled = false;
            }
        });
    }
});
