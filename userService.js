// ======================================================================
//      USER-SERVICE.JS (VERSÃO ATUALIZADA PARA O NOVO PROJETO)
// ======================================================================

import {
    collection, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp, query, where, documentId
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { db, auth } from './firebase-config.js';

// --- Variáveis de Controle ---
let cachedSessionProfile = null;
let activeAccessCheck = null;

// --- Constantes Configuráveis ---
const ADMIN_UID = "BX6Q7HrVMrcCBqe72r7K76EBPkX2"; // ✅ MELHORIA: ID do admin centralizado.

// ======================================================================
// FUNÇÕES AUXILIARES (PRESERVADAS 100% CONFORME SOLICITADO)
// ======================================================================

export async function ensureUserAndTrialDoc() {
    // ... seu código original, sem alterações ...
    try {
        const user = auth.currentUser;
        if (!user) return;
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                nome: user.displayName || user.email || 'Usuário',
                email: user.email || '',
                trialStart: serverTimestamp(),
                isPremium: false,
            });
        } else if (!userSnap.data().trialStart) {
            await updateDoc(userRef, {
                trialStart: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error("❌ Erro em ensureUserAndTrialDoc:", error);
    }
}

async function checkUserStatus(user, empresaData) {
    // ... seu código original, sem alterações ...
    try {
        if (!user) return { hasActivePlan: false, isTrialActive: true };
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return { hasActivePlan: false, isTrialActive: true };
        const userData = userSnap.data();
        if (!userData) return { hasActivePlan: false, isTrialActive: true };
        if (userData.isPremium === true) return { hasActivePlan: true, isTrialActive: false };
        if (!userData.trialStart?.seconds) return { hasActivePlan: false, isTrialActive: true };
        let trialDurationDays = 15;
        if (empresaData && typeof empresaData.freeEmDias === 'number') {
            trialDurationDays = empresaData.freeEmDias;
        }
        const startDate = new Date(userData.trialStart.seconds * 1000);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + trialDurationDays);
        return { hasActivePlan: false, isTrialActive: endDate > new Date() };
    } catch (error) {
        console.error("❌ Erro em checkUserStatus:", error);
        return { hasActivePlan: false, isTrialActive: true };
    }
}

export async function getEmpresasDoUsuario(user) {
    // ... seu código original, sem alterações ...
    if (!user) return [];
    const empresasEncontradas = new Map();
    try {
        const qDono = query(collection(db, "empresarios"), where("donoId", "==", user.uid));
        const snapshotDono = await getDocs(qDono);
        snapshotDono.forEach(doc => {
            if (!empresasEncontradas.has(doc.id)) {
                empresasEncontradas.set(doc.id, { id: doc.id, ...doc.data() });
            }
        });
    } catch (e) { console.error("❌ Erro ao buscar empresas (dono):", e); }
    try {
        const mapaRef = doc(db, "mapaUsuarios", user.uid);
        const mapaSnap = await getDoc(mapaRef);
        if (mapaSnap.exists() && mapaSnap.data().empresas && mapaSnap.data().empresas.length > 0) {
            const idsDeEmpresas = mapaSnap.data().empresas;
            if (idsDeEmpresas.length === 0) return Array.from(empresasEncontradas.values());
            const empresasRef = collection(db, "empresarios");
            const q = query(empresasRef, where(documentId(), "in", idsDeEmpresas));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(doc => {
                if (!empresasEncontradas.has(doc.id)) {
                    empresasEncontradas.set(doc.id, { id: doc.id, ...doc.data() });
                }
            });
        }
    } catch(e) { console.error("❌ Erro ao buscar empresas (mapa):", e); }
    return Array.from(empresasEncontradas.values());
}

// ✅ NOVO: Helper que "promisifica" o onAuthStateChanged para uso com async/await.
function getCurrentUser() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
}

// ======================================================================
//      FUNÇÃO PRINCIPAL 'verificarAcesso' (REVISADA E OTIMIZADA)
// ======================================================================
export async function verificarAcesso() {
    if (cachedSessionProfile) return cachedSessionProfile;
    if (activeAccessCheck) return activeAccessCheck; // Evita múltiplas chamadas simultâneas

    // ✅ MELHORIA: Lógica encapsulada em uma função async auto-executável
    // para um controle mais limpo com try/finally.
    const accessCheckPromise = (async () => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const paginasPublicas = ['login.html', 'cadastro.html'];

        // 1. O usuário está logado?
        const user = await getCurrentUser();
        if (!user) {
            if (!paginasPublicas.includes(currentPage)) {
                window.location.replace('login.html');
            }
            throw new Error("Usuário não autenticado.");
        }

        // A partir daqui, TEMOS um usuário logado.
        await ensureUserAndTrialDoc();
        
        // 2. Quantas empresas este usuário possui?
        const empresas = await getEmpresasDoUsuario(user);

        // ✅ MELHORIA: Lógica unificada. Se não tem exatamente 1 empresa, vai para a seleção.
        if (empresas.length !== 1) {
            if (currentPage !== 'selecionar-empresa.html') {
                window.location.replace('selecionar-empresa.html');
            }
            throw new Error("Seleção de empresa necessária.");
        }
        
        // 3. Se chegamos aqui, ele tem EXATAMENTE UMA empresa.
        const empresaUnica = empresas[0];
        localStorage.setItem('empresaAtivaId', empresaUnica.id);

        if (currentPage === 'selecionar-empresa.html') {
            window.location.replace('index.html');
            throw new Error("Redirecionando para o painel principal.");
        }

        // 4. Validação da empresa e da assinatura.
        const empresaDoc = await getDoc(doc(db, "empresarios", empresaUnica.id));
        if (!empresaDoc.exists()) {
            localStorage.removeItem('empresaAtivaId');
            window.location.replace('selecionar-empresa.html');
            throw new Error("Empresa ativa não encontrada.");
        }

        const empresaData = empresaDoc.data();
        const { hasActivePlan, isTrialActive } = await checkUserStatus(user, empresaData);

        if (!hasActivePlan && !isTrialActive) {
            if (currentPage !== 'assinatura.html') {
                window.location.replace('assinatura.html');
            }
            throw new Error("Assinatura ou período de teste expirado.");
        }

        // 5. Monta o perfil de sessão e libera o acesso.
        const isAdmin = user.uid === ADMIN_UID;
        const isOwner = empresaData.donoId === user.uid;
        
        let perfilDetalhado = empresaData;
        let papel = 'dono';

        if (!isOwner && !isAdmin) {
            const profSnap = await getDoc(doc(db, "empresarios", empresaUnica.id, "profissionais", user.uid));
            if (!profSnap.exists() || profSnap.data().status !== 'ativo') {
                localStorage.removeItem('empresaAtivaId');
                window.location.replace('login.html');
                throw new Error("Acesso de profissional revogado ou inativo.");
            }
            perfilDetalhado = profSnap.data();
            papel = 'funcionario';
        }
        
        cachedSessionProfile = {
            user,
            empresaId: empresaUnica.id,
            perfil: perfilDetalhado,
            isOwner: isOwner || isAdmin,
            isAdmin: isAdmin,

            papel
        };
        
        return cachedSessionProfile;
    })();

    activeAccessCheck = accessCheckPromise;

    try {
        return await activeAccessCheck;
    } catch (error) {
        // Loga apenas erros inesperados, não os de fluxo de redirecionamento.
        const mensagensDeFluxo = ["Usuário não autenticado", "Seleção de empresa necessária", "Redirecionando para o painel", "Empresa ativa não encontrada", "Assinatura ou período de teste expirado", "Acesso de profissional revogado"];
        if (!mensagensDeFluxo.some(msg => error.message.includes(msg))) {
            console.error("❌ Erro inesperado em verificarAcesso:", error);
        }
        // Re-lança o erro para que a chamada original possa tratá-lo se necessário.
        throw error;
    } finally {
        activeAccessCheck = null;
    }
}


// --- Funções de Controle de Cache (Preservadas) ---
export function clearCache() {
    cachedSessionProfile = null;
}

export async function getTodasEmpresas() {
    // ... seu código original, sem alterações ...
    const empresasCol = collection(db, "empresarios");
    const snap = await getDocs(empresasCol);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
