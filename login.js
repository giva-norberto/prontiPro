// ======================================================================
//             LOGIN.JS (VERSÃO DE TESTE COM REDIRECT)
// ======================================================================

// ✅ ADICIONADO 'signInWithRedirect' para o teste
import { signInWithPopup, signInWithRedirect, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { auth, provider } from "./firebase-config.js"; 

window.addEventListener('DOMContentLoaded', ( ) => {
    const btnLoginGoogle = document.getElementById('btn-login-google');
    const loginForm = document.getElementById('login-form');
    const loginStatusDiv = document.getElementById('login-status');

    // Lógica do Login com Google
    if (btnLoginGoogle) {
        btnLoginGoogle.addEventListener('click', async () => {
            btnLoginGoogle.disabled = true;
            if (loginStatusDiv) loginStatusDiv.textContent = "";

            try {
                // =================================================================
                // ✅ TESTE: Trocamos o pop-up pelo redirecionamento
                await signInWithRedirect(auth, provider);
                // =================================================================

            } catch (error) {
                // Este bloco de erro provavelmente não será alcançado com redirect,
                // mas o mantemos por segurança.
                console.error("Erro no início do login com Google Redirect:", error);
                if (loginStatusDiv) {
                    loginStatusDiv.textContent = 'Não foi possível iniciar o login com o Google.';
                }
                btnLoginGoogle.disabled = false;
            }
        });
    }

    // Lógica do Login com E-mail e Senha (sem alterações)
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (loginStatusDiv) loginStatusDiv.textContent = "";

            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-senha').value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
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
