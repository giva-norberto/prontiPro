// ======================================================================
// ARQUIVO: servicos.js (VERSÃO FINAL CONDICIONAL)
// ======================================================================

import { collection, doc, getDoc, deleteDoc, onSnapshot, query } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { db, auth } from "./firebase-config.js";
import { showCustomConfirm, showAlert } from "./vitrini-utils.js";

// --- Mapeamento de Elementos do DOM ---
const listaServicosDiv = document.getElementById('lista-servicos');
const btnAddServico = document.querySelector('.btn-new');
const btnPromocoes = document.getElementById('btnPromocoes');

// --- Variáveis de Estado ---
let empresaId = null;
let isDono = false;
let isPet = false; // Flag crucial para o layout e lógica
const adminUID = "BX6Q7HrVMrcCBqe72r7K76EBPkX2";

// Obtém o empresaId da empresa ativa do localStorage
function getEmpresaIdAtiva() {
    return localStorage.getItem("empresaAtivaId") || null;
}

// --- Inicialização e Autenticação ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            empresaId = getEmpresaIdAtiva();
            if (!empresaId) {
                if (listaServicosDiv) listaServicosDiv.innerHTML = '<p style="color:red;">Nenhuma empresa ativa selecionada.</p>';
                return;
            }

            const empresaRef = doc(db, "empresarios", empresaId);
            const empresaSnap = await getDoc(empresaRef);
            
            if (empresaSnap.exists()) {
                const empresaData = empresaSnap.data();
                isDono = (empresaData.donoId === user.uid) || (user.uid === adminUID);
                
                // Define se a empresa é PET ou não.
                isPet = (empresaData.tipoEmpresa === 'pets'); 
            }

            // Controlar visibilidade de AMBOS os botões
            if (btnAddServico) {
                btnAddServico.style.display = isDono ? 'inline-flex' : 'none';
            }
            if (btnPromocoes) {
                btnPromocoes.style.display = isDono ? 'inline-flex' : 'none';
            }

            iniciarListenerDeServicos();

        } catch (error) {
            console.error("Erro durante a inicialização:", error);
            if(listaServicosDiv) listaServicosDiv.innerHTML = `<p style="color:red;">Ocorreu um erro crítico ao carregar a página.</p>`;
        }
    } else {
        window.location.href = 'login.html';
    }
});

// --- Listener em Tempo Real (usando a coleção correta) ---
function iniciarListenerDeServicos() {
    if (!empresaId) return;
    if (listaServicosDiv) listaServicosDiv.innerHTML = '<p>Carregando serviços...</p>';

    // Usa a coleção 'servicos_pet' se for empresa PET, ou 'servicos' se for Salão.
    const colecaoServico = isPet ? "servicos_pet" : "servicos";
    const servicosCol = collection(db, "empresarios", empresaId, colecaoServico);
    const q = query(servicosCol);

    onSnapshot(q, (snapshot) => {
        // O renderizarServicos agora usa a flag 'isPet' global
        const servicos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarServicos(servicos);
    }, (error) => {
        console.error("Erro ao carregar serviços em tempo real:", error);
        if (listaServicosDiv) listaServicosDiv.innerHTML = '<p style="color:red;">Erro ao carregar os serviços.</p>';
    });
}

// --- Renderização Final (chama a renderServicoCard) ---
function renderizarServicos(servicos) {
    if (!listaServicosDiv) return;

    if (!servicos || servicos.length === 0) {
        listaServicosDiv.innerHTML = `<p style="color: #fff; font-weight: 500;">Nenhum serviço cadastrado. ${isDono ? 'Clique em "Adicionar Novo Serviço" para começar.' : ''}</p>`;
        return;
    }

    const agrupados = {};
    servicos.forEach(servico => {
        const cat = (servico.categoria && servico.categoria.trim()) ? servico.categoria.trim() : "Outros";
        if (!agrupados[cat]) agrupados[cat] = [];
        agrupados[cat].push(servico);
    });

    const categoriasOrdenadas = Object.keys(agrupados).sort((a, b) => a.localeCompare(b, "pt-BR"));

    // Chama renderServicoCard para cada serviço, passando a flag isPet
    listaServicosDiv.innerHTML = categoriasOrdenadas.map(cat => {
        const servicosCategoria = agrupados[cat].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        
        return `
            <div class="categoria-bloco">
                <h2 class="categoria-titulo">${sanitizeHTML(cat)}</h2>
                ${servicosCategoria.map(servico => renderServicoCard(servico, isPet)).join("")}
            </div>
        `;
    }).join("");
}

// --- Render cartão de serviço (Função de Layout) ---
function renderServicoCard(servico, isPet) {
  const nome = sanitizeHTML(servico.nome);
  const desc = sanitizeHTML(servico.descricao || "");
  
  // Preço e duração padrão (serão usados para serviços Salão/Normal)
  const precoBase = servico.preco || 0; 
  const duracaoBase = servico.duracao || 0; 

  let petInfoHtml = "";
  let showFooterDetails = true; // Exibir preço/duração no rodapé (padrão Salão)
  
  if (isPet) {
    // SE FOR PET: Novo Layout
    
    if (Array.isArray(servico.precos) && servico.precos.length > 0) {
      
      // Desativa o resumo de preço/duração no rodapé (Layout Novo PET)
      showFooterDetails = false; 

      // Constrói o HTML detalhado por porte
      const precosPorPorteHtml = `
        <div class="servico-pet-info">
          <h4>Preços por Porte:</h4>
          <div class="servico-preco-por-porte">
            ${servico.precos.map(p => 
              `<div>
                <strong>${sanitizeHTML(p.porte)}:</strong> ${formatarPreco(p.preco || 0)}
                ${p.duracao ? ` • ${p.duracao} min` : ""}
              </div>`
            ).join("")}
          </div>
        </div>`;
      
      petInfoHtml = precosPorPorteHtml; // O bloco extra PET é preenchido
    } 
  }
  
  // Monta o bloco de Preço/Duração para o rodapé (só se showFooterDetails for true, ou seja, Salão)
  const precoFormatado = formatarPreco(precoBase);
  const duracaoFormatada = duracaoBase;

  const priceDurationHtml = showFooterDetails ? 
    `<div>
      <span class="servico-preco">${precoFormatado}</span>
      <span class="servico-duracao"> • ${duracaoFormatada} min</span>
    </div>` : '<div></div>'; 

  // Botões de Ação
  const acoes = isDono ? `
    <div class="servico-acoes">
      <button class="btn-acao btn-editar" data-id="${servico.id}" data-type="${isPet ? 'pet' : 'normal'}">Editar</button>
      <button class="btn-acao btn-excluir" data-id="${servico.id}" data-type="${isPet ? 'pet' : 'normal'}">Excluir</button>
    </div>` : "";

  // Monta o Rodapé (sempre exibe os botões de ação e o bloco de preço/duração condicional)
  const footerHtml = `<div class="servico-footer">${priceDurationHtml}${acoes}</div>`;

  return `
    <div class="servico-card" data-id="${servico.id}" data-type="${isPet ? 'pet' : 'normal'}">
      <div class="servico-header">
        <h3 class="servico-titulo">${nome}</h3>
      </div>
      <p class="servico-descricao">${desc}</p>
      
      ${petInfoHtml}
      
      ${footerHtml} 
    </div>
  `;
}

// --- Funções de Ação e Utilitários ---
async function excluirServico(servicoId) {
    if (!isDono) {
        await showAlert("Acesso Negado", "Apenas o dono pode excluir serviços.");
        return;
    }
    const confirmado = await showCustomConfirm("Confirmar Exclusão", "Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.");
    if (!confirmado) return;

    try {
        // Usa a coleção correta para excluir.
        const colecaoServico = isPet ? "servicos_pet" : "servicos";
        const servicoRef = doc(db, "empresarios", empresaId, colecaoServico, servicoId);
        await deleteDoc(servicoRef);
        console.log("Serviço excluído com sucesso!");
        await showAlert("Sucesso", "Serviço excluído com sucesso.");
    } catch (error) {
        console.error("Erro ao excluir serviço:", error);
        await showAlert("Erro", "Ocorreu um erro ao excluir o serviço: " + error.message);
    }
}

function formatarPreco(preco) {
    try {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco || 0);
    } catch (e) {
        return "R$ 0,00";
    }
}

function sanitizeHTML(str) {
    if (!str) return "";
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// --- Event Listeners ---
if (listaServicosDiv) {
    listaServicosDiv.addEventListener('click', function(e) {
        const target = e.target.closest('.btn-acao');
        if (!target) return;
        const id = target.dataset.id;
        // Pega o tipo de serviço (pet ou normal) do data-type do botão
        const tipo = target.dataset.type || 'normal'; 
        if (!id) return;

        if (target.classList.contains('btn-editar')) {
            // Redireciona para a tela de edição correta (novo-servico-pet.html ou novo-servico.html)
            if (tipo === 'pet') {
                window.location.href = `novo-servico-pet.html?id=${id}`;
            } else {
                window.location.href = `novo-servico.html?id=${id}`;
            }
        }
        if (target.classList.contains('btn-excluir')) {
            excluirServico(id);
        }
    });
}

if (btnAddServico) {
    btnAddServico.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isDono) {
            showAlert("Acesso Negado", "Apenas o dono pode adicionar serviços.");
        } else {
            // Direciona para a tela de criação correta (Pet ou Salão)
            const url = isPet ? 'novo-servico-pet.html' : 'novo-servico.html';
            window.location.href = url;
        }
    });
}

if (btnPromocoes) {
    btnPromocoes.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isDono) {
            showAlert("Acesso Negado", "Apenas o dono pode gerenciar promoções.");
        } else {
            window.location.href = 'promocoes.html';
        }
    });
}
