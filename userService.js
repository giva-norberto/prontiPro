// ======================================================================
//  userService.js (VERSÃO PETS - PADRONIZADA)
//  Conectado ao vitrini-firebase.js (Variáveis de Ambiente)
//  Contém: Patch Anti-Loop, Check de Assinatura e Evento de UI
// =====================================================================

import {
    collection, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp, query, where, documentId
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// ✅ MUDANÇA AQUI: Importando do arquivo padronizado do projeto
import { db, auth } from './vitrini-firebase.js';

let cachedSessionProfile = null;
let isProcessing = false;

// --- Função: Garante doc do usuário e trial, sempre com nome/email ---
export async function ensureUserAndTrialDoc() {
    // Nenhuma alteração nesta função
    try {
        const user = auth.currentUser;
        if (!user) return;
        const userRef = doc(db, "usuarios", user.uid);
        let userSnap = await getDoc(userRef);

        // console.log("[DEBUG] Documento do usuário antes:", userSnap.exists() ? userSnap.data() : "não existe");

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                nome: user.displayName || user.email || 'Usuário',
                email: user.email || '',
                trialStart: serverTimestamp(),
                isPremium: false,
            });
            // console.log("[DEBUG] Criado doc do usuário!");
        } else {
            const userData = userSnap.data();
            let updateObj = {};
            if (!userData.nome) updateObj.nome = user.displayName || user.email || 'Usuário';
            if (!userData.email) updateObj.email = user.email || '';
            if (!userData.trialStart) updateObj.trialStart = serverTimestamp();
            if (Object.keys(updateObj).length) {
                await updateDoc(userRef, updateObj);
                // console.log("[DEBUG] Atualizado doc do usuário:", updateObj);
            }
        }
    } catch (error) {
        console.error("❌ [ensureUserAndTrialDoc] Erro:", error);
    }
}

// --- Função: Checa status de plano/trial corretamente ---
async function checkUserStatus(user, empresaData) {
    try {
        if (!user) return { hasActivePlan: false, isTrialActive: true, trialDaysRemaining: 0 };

        // 1) Verificação direta no documento do usuário (mantida)
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) return { hasActivePlan: false, isTrialActive: true, trialDaysRemaining: 0 };
        const userData = userSnap.data();
        if (!userData) return { hasActivePlan: false, isTrialActive: true, trialDaysRemaining: 0 };
        if (userData.isPremium === true) return { hasActivePlan: true, isTrialActive: false, trialDaysRemaining: 0 };

        // 2) Verificações adicionais usando dados da empresa
        const toMillis = (value) => {
            if (!value) return NaN;
            try {
                if (typeof value.toDate === 'function') return value.toDate().getTime();
                if (value && typeof value.seconds === 'number') return value.seconds * 1000;
                const d = new Date(value);
                return isNaN(d.getTime()) ? NaN : d.getTime();
            } catch (e) {
                return NaN;
            }
        };

        const now = Date.now();

        try {
            // 2a) Validade da assinatura na empresa
            const assinaturaValidaAte = empresaData?.assinaturaValidaAte || empresaData?.assinatura_valida_ate || null;
            if (empresaData?.assinaturaAtiva === true && assinaturaValidaAte) {
                const tv = toMillis(assinaturaValidaAte);
                if (!isNaN(tv) && tv > now) {
                    return { hasActivePlan: true, isTrialActive: false, trialDaysRemaining: 0 };
                }
            }

            // 2b) Próximo pagamento
            const proximoPag = empresaData?.proximoPagamento || empresaData?.proximo_pagamento || null;
            if (proximoPag) {
                const tp = toMillis(proximoPag);
                if (!isNaN(tp) && tp > now) {
                    return { hasActivePlan: true, isTrialActive: false, trialDaysRemaining: 0 };
                }
            }
        } catch (e) {
            console.warn("[DEBUG] Erro durante checagens por empresa em checkUserStatus:", e);
        }

        // 3) Checagem de trial do usuário
        let trialDurationDays = empresaData?.freeEmDias ?? 15;
        let trialDaysRemaining = 0;
        let isTrialActive = false;

        if (userData.trialStart?.seconds) {
            const startDate = new Date(userData.trialStart.seconds * 1000);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + trialDurationDays);
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            if (endDate >= hoje) {
                isTrialActive = true;
                trialDaysRemaining = Math.ceil((endDate - hoje) / (1000 * 60 * 60 * 24));
            }
        } else {
            isTrialActive = true;
            trialDaysRemaining = trialDurationDays;
        }

        return { hasActivePlan: false, isTrialActive, trialDaysRemaining };
    } catch (error) {
        console.error("❌ [checkUserStatus] Erro:", error);
        return { hasActivePlan: false, isTrialActive: true, trialDaysRemaining: 0 };
    }
}

// --- Função robusta: busca empresas ATIVAS do usuário ---
export async function getEmpresasDoUsuario(user) {
    if (!user) return [];
    const empresasUnicas = new Map();
    try {
        const qDono = query(
            collection(db, "empresarios"),
            where("donoId", "==", user.uid),
            where("status", "==", "ativo")
        );
        const snapshotDono = await getDocs(qDono);
        snapshotDono.forEach(doc => {
            empresasUnicas.set(doc.id, { id: doc.id, ...doc.data() });
        });
    } catch (e) {
        console.error("❌ [getEmpresasDoUsuario] Erro ao buscar empresas como dono:", e);
    }
    try {
        const mapaRef = doc(db, "mapaUsuarios", user.uid);
        const mapaSnap = await getDoc(mapaRef);
        if (mapaSnap.exists() && Array.isArray(mapaSnap.data().empresas)) {
            const idsDeEmpresas = mapaSnap.data().empresas.filter(id => !empresasUnicas.has(id));
            for (let i = 0; i < idsDeEmpresas.length; i += 10) {
                const chunk = idsDeEmpresas.slice(i, i + 10);
                const q = query(
                    collection(db, "empresarios"),
                    where(documentId(), "in", chunk),
                    where("status", "==", "ativo")
                );
                const snap = await getDocs(q);
                snap.forEach(doc => empresasUnicas.set(doc.id, { id: doc.id, ...doc.data() }));
            }
        }
    } catch(e) {
        console.error("❌ [getEmpresasDoUsuario] Erro ao buscar empresas pelo mapa:", e);
    }
    return Array.from(empresasUnicas.values());
}

// ======================================================================
// FUNÇÃO GUARDA PRINCIPAL: Valida sessão, empresa ativa, plano, permissões
// ======================================================================
export async function verificarAcesso() {
    if (cachedSessionProfile) {
        return cachedSessionProfile;
    }
    if (isProcessing) throw new Error("Race condition detectada.");
    isProcessing = true;

    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            try {
                const currentPage = window.location.pathname.split('/').pop() || 'index.html';
                const paginasPublicas = ['login.html', 'cadastro.html', 'recuperar-senha.html'];
                // Página da vitrine adicionada para controle de acesso
                const paginasDeVitrine = ['vitrine.html'];

                if (!user) {
                    if (!paginasPublicas.includes(currentPage) && !paginasDeVitrine.includes(currentPage)) {
                        window.location.replace('login.html');
                    }
                    isProcessing = false;
                    return reject(new Error("Utilizador não autenticado."));
                }
                
                await ensureUserAndTrialDoc();
                const ADMIN_UID = "BX6Q7HrVMrcCBqe72r7K76EBPkX2";
                const isAdmin = user.uid === ADMIN_UID;
                let empresaAtivaId = localStorage.getItem('empresaAtivaId');
                let empresaDocSnap = null;
                let empresas = await getEmpresasDoUsuario(user);

                if (empresaAtivaId && !empresas.some(e => e.id === empresaAtivaId)) { empresaAtivaId = null; }

                if (empresaAtivaId) {
                    empresaDocSnap = await getDoc(doc(db, "empresarios", empresaAtivaId));
                    if (!empresaDocSnap.exists() || empresaDocSnap.data().status !== "ativo") {
                        localStorage.removeItem('empresaAtivaId');
                        empresaAtivaId = null;
                        empresaDocSnap = null;
                    }
                }

                if (!empresaDocSnap) {
                    if (empresas.length === 0) {
                        cachedSessionProfile = {
                            user,
                            empresaId: null,
                            perfil: { nome: user.displayName || user.email || 'Usuário', email: user.email || '', papel: 'novo' },
                            isOwner: false,
                            isAdmin: isAdmin,
                            papel: 'novo',
                            empresas: []
                        };
                        if (currentPage !== 'meuperfil.html') {
                            window.location.replace('meuperfil.html');
                        }
                        isProcessing = false;
                        return reject(new Error("Nenhuma empresa associada."));
                    } else if (empresas.length === 1) {
                        empresaAtivaId = empresas[0].id;
                        localStorage.setItem('empresaAtivaId', empresaAtivaId);
                        empresaDocSnap = await getDoc(doc(db, "empresarios", empresaAtivaId));
                    } else if (empresas.length > 1) {
                        cachedSessionProfile = {
                            user,
                            empresaId: null,
                            perfil: { nome: user.displayName || user.email || 'Usuário', email: user.email || '', papel: 'multi' },
                            isOwner: false,
                            isAdmin: isAdmin,
                            papel: 'multi',
                            empresas
                        };
                        if (currentPage !== 'selecionar-empresa.html') window.location.replace('selecionar-empresa.html');
                        isProcessing = false;
                        return reject(new Error("Múltiplas empresas, seleção necessária."));
                    } else if (isAdmin) {
                        cachedSessionProfile = {
                            user,
                            empresaId: null,
                            perfil: { nome: "Administrador", email: user.email || '', papel: "admin" },
                            isOwner: false,
                            isAdmin: true,
                            papel: 'admin',
                            empresas: []
                        };
                        isProcessing = false;
                        return resolve(cachedSessionProfile);
                    }
                }

                if (!empresaDocSnap || !empresaDocSnap.exists()) {
                    isProcessing = false;
                    return reject(new Error("Empresa não encontrada."));
                }

                const empresaData = empresaDocSnap.data();
                const statusAssinatura = await checkUserStatus(user, empresaData);
                let perfilDetalhado, papel;
                const isOwner = empresaData.donoId === user.uid;

                if (isOwner) {
                    perfilDetalhado = { ...empresaData, nome: user.displayName || user.email || 'Usuário', ehDono: true, status: 'ativo', email: user.email || '' };
                    papel = 'dono';
                } else if (isAdmin) {
                    perfilDetalhado = { ...empresaData, nome: "Administrador", ehDono: false, status: 'ativo', email: user.email || '' };
                    papel = 'admin';
                } else {
                    const profSnap = await getDoc(doc(db, "empresarios", empresaAtivaId, "profissionais", user.uid));
                    if (!profSnap.exists() || profSnap.data().status !== 'ativo') {
                        localStorage.removeItem('empresaAtivaId');
                        window.location.replace('login.html');
                        isProcessing = false;
                        return reject(new Error("Acesso de profissional revogado ou pendente."));
                    }
                    perfilDetalhado = { ...profSnap.data(), ehDono: false };
                    papel = 'funcionario';
                }

                const sessionProfile = {
                    user,
                    empresaId: empresaAtivaId,
                    perfil: perfilDetalhado,
                    isOwner,
                    isAdmin,
                    papel,
                    empresas,
                    statusAssinatura
                };

                // --- INÍCIO: PATCH CIRÚRGICO ANTI-LOOP ---
                let assinaturaVerifiedTs = 0;
                let assinaturaRedirectTs = 0;
                try {
                    assinaturaVerifiedTs = Number(sessionStorage.getItem('assinatura_verified_ts') || 0);
                    assinaturaRedirectTs = Number(sessionStorage.getItem('assinatura_redirect_ts') || 0);
                } catch (e) { /* ignore */ }
                const now = Date.now();
                const ASSINATURA_SKIP_WINDOW_MS = 15000;

                try {
                    if (sessionProfile?.statusAssinatura?.hasActivePlan) {
                        try {
                            sessionStorage.setItem('assinatura_verified_ts', String(now));
                        } catch (e) { /* ignore */ }
                    }
                } catch (e) { /* ignore */ }

                const skipRedirectToAssinatura = (
                    (assinaturaVerifiedTs && (now - assinaturaVerifiedTs) < ASSINATURA_SKIP_WINDOW_MS) ||
                    (assinaturaRedirectTs && (now - assinaturaRedirectTs) < ASSINATURA_SKIP_WINDOW_MS)
                );
                // --- FIM: PATCH CIRÚRGICO ANTI-LOOP ---

                if (!isAdmin && !statusAssinatura.hasActivePlan && !statusAssinatura.isTrialActive && currentPage !== 'assinatura.html' && !skipRedirectToAssinatura) {
                    try {
                        sessionStorage.setItem('assinatura_redirect_ts', String(Date.now()));
                    } catch (e) { /* ignore */ }
                    window.location.replace('assinatura.html');
                    cachedSessionProfile = sessionProfile;
                    isProcessing = false;
                    return reject(new Error("Assinatura expirada."));
                }

                // Se o usuário for dono/admin e estiver na vitrine, manda pro painel principal
                if ((sessionProfile.isOwner || sessionProfile.isAdmin) && paginasDeVitrine.includes(currentPage)) {
                    window.location.replace('painel.html'); 
                }

                cachedSessionProfile = sessionProfile;
                
                // Dispara evento global de sessão pronta
                window.dispatchEvent(new CustomEvent('sessionProfileReady', { detail: sessionProfile }));

                isProcessing = false;
                resolve(sessionProfile);

            } catch (error) {
                console.error("[DEBUG] Erro geral verificarAcesso:", error);
                isProcessing = false;
                reject(error);
            }
        });
    });
}

export function clearCache() {
    cachedSessionProfile = null;
    isProcessing = false;
}

export async function getTodasEmpresas() {
    const empresasCol = collection(db, "empresarios");
    const snap = await getDocs(empresasCol);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
