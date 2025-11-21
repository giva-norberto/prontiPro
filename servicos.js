// ======================================================================
// ARQUIVO: servicos.js (VERSÃO ORGANIZADA — SERVIÇOS + SERVIÇOS_PET)
// ======================================================================
import {
  collection,
  doc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { db, auth } from "./firebase-config.js";
import { showCustomConfirm, showAlert } from "./vitrini-utils.js";

// --- Mapeamento de Elementos do DOM ---
const listaServicosDiv = document.getElementById('lista-servicos'); 
const btnAddServico = document.querySelector('.btn-new');           
const btnPromocoes = document.getElementById('btnPromocoes');      
const tituloServicosContainer = document.getElementById('titulo-servicos'); 

// --- Estado ---
let empresaId = null;
let isDono = false;
let tipoEmpresa = null; // ✅ ADIÇÃO NECESSÁRIA PARA O BOTÃO
const adminUID = "BX6Q7HrVMrcCBqe72r7K76EBPkX2";

function getEmpresaIdAtiva() {
  return localStorage.getItem("empresaAtivaId") || null;
}

// --- Inicialização e Auth ---
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
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
      tipoEmpresa = empresaData.tipoEmpresa; // ✅ CORREÇÃO AQUI: Carrega o tipo da empresa
      isDono = (empresaData.donoId === user.uid) || (user.uid === adminUID);
    } else {
      isDono = (user.uid === adminUID);
    }

    if (btnAddServico) btnAddServico.style.display = isDono ? 'inline-flex' : 'none';
    if (btnPromocoes) btnPromocoes.style.display = isDono ? 'inline-flex' : 'none';

    iniciarListeners();

  } catch (err) {
    console.error("Erro init servicos:", err);
    if (listaServicosDiv) listaServicosDiv.innerHTML = `<p style="color:red;">Erro ao inicializar serviços.</p>`;
  }
});

// --- Listeners em tempo real para ambas coleções ---
let unsubscribeServicos = null;
let unsubscribeServicosPet = null;

function iniciarListeners() {
  if (!empresaId) return;
  if (listaServicosDiv) listaServicosDiv.innerHTML = '<p>Carregando serviços...</p>';

  const servicosCol = collection(db, "empresarios", empresaId, "servicos");
  const servicosPetCol = collection(db, "empresarios", empresaId, "servicos_pet");

  const q1 = query(servicosCol);
  const q2 = query(servicosPetCol);

  if (unsubscribeServicos) unsubscribeServicos();
  if (unsubscribeServicosPet) unsubscribeServicosPet();

  unsubscribeServicos = onSnapshot(q1, (snap) => {
    const servicos = snap.docs.map(d => ({ id: d.id, ...d.data(), __type: 'normal' }));
    mergeAndRender(servicos, null);
  }, (err) => {
    console.error("Erro realtime servicos:", err);
    if (listaServicosDiv) listaServicosDiv.innerHTML = '<p style="color:red;">Erro ao carregar serviços.</p>';
  });

  unsubscribeServicosPet = onSnapshot(q2, (snap) => {
    const servicosPet = snap.docs.map(d => ({ id: d.id, ...d.data(), __type: 'pet' }));
    mergeAndRender(null, servicosPet);
  }, (err) => {
    console.error("Erro realtime servicos_pet:", err);
    if (listaServicosDiv) listaServicosDiv.innerHTML = '<p style="color:red;">Erro ao carregar serviços PET.</p>';
  });
}

// --- Buffer local ---
let bufferServicos = [];
let bufferServicosPet = [];

function mergeAndRender(servicos = null, servicosPet = null) {
  if (servicos !== null) bufferServicos = servicos;
  if (servicosPet !== null) bufferServicosPet = servicosPet;
  renderizarTudo(bufferServicos || [], bufferServicosPet || []);
}

// --- Renderização principal ---
function renderizarTudo(servicos, servicosPet) {
  if (!listaServicosDiv) return;

  if ((!servicos || servicos.length === 0) && (!servicosPet || servicosPet.length === 0)) {
    listaServicosDiv.innerHTML = `<p style="color: #fff; font-weight: 500;">Nenhum serviço cadastrado. ${isDono ? 'Clique em "Adicionar Novo Serviço" para começar.' : ''}</p>`;
    return;
  }

  const agruparPorCategoria = (items) => {
    const agrup = {};
    items.forEach(s => {
      const cat = (s.categoria && s.categoria.trim()) ? s.categoria.trim() : "Outros";
      if (!agrup[cat]) agrup[cat] = [];
      agrup[cat].push(s);
    });
    Object.keys(agrup).forEach(cat => {
      agrup[cat].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
    });
    return agrup;
  };

  const agrupNormais = agruparPorCategoria(servicos || []);
  const agrupPets = agruparPorCategoria(servicosPet || []);

  const renderCategoriaBlocos = (agrup, isPetSection) => {
    const cats = Object.keys(agrup).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return cats.map(cat => {
      const cards = agrup[cat].map(s => renderServicoCard(s, isPetSection)).join("");
      return `<div class="categoria-bloco">
                <h2 class="categoria-titulo">${sanitizeHTML(cat)}</h2>
                ${cards}
              </div>`;
    }).join("");
  };

  const htmlNormais = Object.keys(agrupNormais).length ? `<section class="sec-servicos-normais">
      <h1 class="sec-titulo">Serviços</h1>
      ${renderCategoriaBlocos(agrupNormais, false)}
    </section>` : '';

  const htmlPets = Object.keys(agrupPets).length ? `<section class="sec-servicos-pet">
      <h1 class="sec-titulo">Serviços PET</h1>
      ${renderCategoriaBlocos(agrupPets, true)}
    </section>` : '';

  listaServicosDiv.innerHTML = htmlPets + htmlNormais;
}

// --- Render cartão de serviço ---
// CORRIGIDO: Exibe info PET com array precos (porte, preço, duração)
function renderServicoCard(servico, isPet) {
  const nome = sanitizeHTML(servico.nome);
  const desc = sanitizeHTML(servico.descricao || "");
  
  // Assume o preço e duração padrão (para serviços Salão/Normal)
  let precoBase = servico.preco; 
  let duracaoBase = servico.duracao || 0; 

  let petInfoHtml = "";
  if (isPet) {
    // Se for PET, a informação principal virá do array 'precos'
    let precosPorPorteHtml = "";
    if (Array.isArray(servico.precos) && servico.precos.length > 0) {
      
      // CORREÇÃO DA VISUALIZAÇÃO: Usa o primeiro porte (pequeno) para o resumo principal
      precoBase = servico.precos[0].preco || 0;
      duracaoBase = servico.precos[0].duracao || 0;

      // Monta o HTML detalhado por porte (que aparece na parte de baixo do card)
      precosPorPorteHtml = `
        <div class="servico-preco-por-porte">
          ${servico.precos.map(p => 
            `<div>
              <strong>${sanitizeHTML(p.porte)}:</strong> ${formatarPreco(p.preco || 0)}
              ${p.duracao ? ` • ${p.duracao} min` : ""}
            </div>`
          ).join("")}
        </div>`;
    }
    petInfoHtml = `<div class="servico-pet-info">${precosPorPorteHtml}</div>`;
  }
  
  // Renderiza o preço e duração, usando a "Base" definida
  const precoFormatado = formatarPreco(precoBase);
  const duracaoFormatada = duracaoBase;

  const acoes = isDono ? `
    <div class="servico-acoes">
      <button class="btn-acao btn-editar" data-id="${servico.id}" data-type="${isPet ? 'pet' : 'normal'}">Editar</button>
      <button class="btn-acao btn-excluir" data-id="${servico.id}" data-type="${isPet ? 'pet' : 'normal'}">Excluir</button>
    </div>` : "";

  return `
    <div class="servico-card" data-id="${servico.id}" data-type="${isPet ? 'pet' : 'normal'}">
      <div class="servico-header">
        <h3 class="servico-titulo">${nome}</h3>
      </div>
      <p class="servico-descricao">${desc}</p>
      <div class="servico-footer">
        <div>
          <span class="servico-preco">${precoFormatado}</span>
          <span class="servico-duracao"> • ${duracaoFormatada} min</span>
        </div>
        ${acoes}
      </div>
      ${petInfoHtml}
    </div>
  `;
}

// --- Excluir serviço ---
async function excluirServico(servicoId, tipo) {
  if (!isDono) {
    await showAlert("Acesso Negado", "Apenas o dono pode excluir serviços.");
    return;
  }
  const confirmado = await showCustomConfirm("Confirmar Exclusão", "Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.");
  if (!confirmado) return;

  try {
    const caminho = tipo === 'pet' ? ["empresarios", empresaId, "servicos_pet", servicoId] : ["empresarios", empresaId, "servicos", servicoId];
    const servicoRef = doc(db, ...caminho);
    await deleteDoc(servicoRef);
    await showAlert("Sucesso", "Serviço excluído com sucesso.");
  } catch (err) {
    console.error("Erro ao excluir serviço:", err);
    await showAlert("Erro", "Não foi possível excluir o serviço: " + (err.message || err));
  }
}

// --- Utilitários ---
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
    const tipo = target.dataset.type || 'normal';
    if (!id) return;

    if (target.classList.contains('btn-editar')) {
      // Redireciona para a tela de edição correta
      if (tipo === 'pet') {
        window.location.href = `novo-servico-pet.html?id=${id}`;
      } else {
        window.location.href = `novo-servico.html?id=${id}`;
      }
    }
    if (target.classList.contains('btn-excluir')) {
      excluirServico(id, tipo);
    }
  });
}

if (btnAddServico) {
  btnAddServico.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isDono) {
      showAlert("Acesso Negado", "Apenas o dono pode adicionar serviços.");
    } else {
      // ✅ CORREÇÃO AQUI: Redirecionamento dinâmico baseado no tipo da empresa
      if (tipoEmpresa === 'pets') {
        window.location.href = 'novo-servico-pet.html';
      } else {
        window.location.href = 'novo-servico.html';
      }
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
