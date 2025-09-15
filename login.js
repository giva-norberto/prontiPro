// ======================================================================
//             LOGIN.JS (VERSÃO FINAL E CORRIGIDA)
// ======================================================================

// Importa as funções necessárias do Firebase Auth usando a abordagem modular.
import { signInWithPopup, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
// Importa as instâncias 'auth' e 'provider' do seu arquivo de configuração central.
import { auth, provider } from "./firebase-config.js"; 

// Garante que o script só rode depois que a página estiver totalmente carregada.
window.addEventListener('DOMContentLoaded', ( ) => {
    // Captura os elementos da página com os quais vamos interagir.
    const btnLoginGoogle = document.getElementById('btn-login-google');
    const loginForm = document.getElementById('login-form');
    const loginStatusDiv = document.getElementById('login-status');

    // Lógica do Login com Google
    if (btnLoginGoogle) {
        btnLoginGoogle.addEventListener('click', async () => {
            // Desabilita o botão para evitar cliques múltiplos e limpa mensagens de erro antigas.
            btnLoginGoogle.disabled = true;
            if (loginStatusDiv) loginStatusDiv.textContent = "";

            try {
                // Usa o método de pop-up para o login com Google.
                await signInWithPopup(auth, provider);
                
                // Após o sucesso, redireciona o usuário para a página principal do app.
                window.location.href = 'selecionar-empresa.html';

            } catch (error) {
                console.error("Erro no login com Google:", error);
                // Mostra uma mensagem de erro amigável, a menos que o usuário tenha fechado o pop-up intencionalmente.
                if (loginStatusDiv && error.code !== 'auth/popup-closed-by-user') {
                    loginStatusDiv.textContent = 'Não foi possível fazer login com o Google.';
                }
                // Reabilita o botão em caso de erro.
                btnLoginGoogle.disabled = false;
            }
        });
    }

    // Lógica do Login com E-mail e Senha
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            // Impede o envio padrão do formulário, que recarregaria a página.
            event.preventDefault();
            if (loginStatusDiv) loginStatusDiv.textContent = "";

            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;

            // Pega os valores dos campos de e-mail and senha.
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-senha').value;

            try {
                // Tenta fazer o login com e-mail e senha.
                await signInWithEmailAndPassword(auth, email, password);

                // Após o sucesso, redireciona para a página principal.
                window.location.href = 'selecionar-empresa.html';

            } catch (error) {
                console.error("Erro no login manual:", error.code);
                // Mostra mensagens de erro específicas para falhas comuns de login.
                if (loginStatusDiv) {
                    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        loginStatusDiv.textContent = 'E-mail ou senha inválidos.';
                    } else {
                        loginStatusDiv.textContent = 'Ocorreu um erro. Tente novamente.';
                    }
                }
                // Reabilita o botão em caso de erro.
                submitButton.disabled = false;
            }
        });
    }
});
