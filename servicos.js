// ======================================================================
// ARQUIVO: servicos.js (VERSÃO ORGANIZADA — SERVIÇOS + SERVIÇOS_PET)
// ======================================================================
import {
  collection,
  doc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { db, auth } from "./firebase-config.js";
import { showCustomConfirm, showAlert } from "./vitrini-utils.js";

// --- Mapeamento de Elementos do DOM ---
const listaServicosDiv = document.getElementById('lista-servicos'); // contêiner principal
const btnAddServico = document.querySelector('.btn-new');           // botão genérico (normal)
const btnPromocoes = document.getElementById('btnPromocoes');      // botão promoções (opcional)
const tituloServicosContainer = document.getElementById('titulo-servicos'); // opcional

// --- Estado ---
let empresaId = null;
let isDono = false;
const adminUID = "BX6Q7HrVMrcCBqe72r7K76EBPkX2"; // mantenha ou altere

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
      isDono = (empresaSnap.data().donoId === user.uid) || (user.uid === adminUID);
    } else {
      isDono = (user.uid === adminUID);
    }

    // controlar visibilidade dos botões
    if (btnAddServico) btnAddServico.style.display = isDono ? 'inline-flex' : 'none';
    if (btnPromocoes) btnPromocoes.style.display = isDono ? 'inline-flex' : 'none';

    iniciarListeners();

  } catch (err) {
    console.error("Erro init servicos:", err);
    if (listaServicosDiv) listaServicosDiv.innerHTML = `<p style="color:red;">Erro ao inicializar serviços.</p>`;
  }
});

// --- Listeners em tempo real para AMBAS coleções ---
let unsubscribeServicos = null;
let unsubscribeServicosPet = null;

function iniciarListeners() {
  if (!empresaId) return;
  if (listaServicosDiv) listaServicosDiv.innerHTML = '<p>Carregando serviços...</p>';

  const servicosCol = collection(db, "empresarios", empresaId, "servicos");
  const servicosPetCol = collection(db, "empresarios", empresaId, "servicos_pet");

  const q1 = query(servicosCol); // você pode adicionar orderBy(servicosCol, 'nome') se quiser
  const q2 = query(servicosPetCol);

  if (unsubscribeServicos) unsubscribeServicos();
  if (unsubscribeServicosPet) unsubscribeServicosPet();

  unsubscribeServicos = onSnapshot(q1, (snap) => {
    const servicos = snap.docs.map(d => ({ id: d.id, ...d.data(), __type: 'normal' }));
    // obtém também pet (se já tiver sido carregado, renderiza combinando)
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

// --- Buffer local para combinar chamadas independentes ---
let bufferServicos = [];
let bufferServicosPet = [];

function mergeAndRender(servicos = null, servicosPet = null) {
  if (servicos !== null) bufferServicos = servicos;
  if (servicosPet !== null) bufferServicosPet = servicosPet;

  // Quando nenhum dos dois estiver carregado: mostra carregando
  if (!bufferServicos && !bufferServicosPet) {
    if (listaServicosDiv) listaServicosDiv.innerHTML = '<p>Carregando serviços...</p>';
    return;
  }

  renderizarTudo(bufferServicos || [], bufferServicosPet || []);
}

// --- Renderização das duas seções ---
function renderizarTudo(servicos, servicosPet) {
  if (!listaServicosDiv) return;

  // Se ambos vazios
  if ((!servicos || servicos.length === 0) && (!servicosPet || servicosPet.length === 0)) {
    listaServicosDiv.innerHTML = `<p style="color: #fff; font-weight: 500;">Nenhum serviço cadastrado. ${isDono ? 'Clique em "Adicionar Novo Serviço" para começar.' : ''}</p>`;
    return;
  }

  // Função de agrupar e ordenar (reutilizável)
  const agruparPorCategoria = (items) => {
    const agrup = {};
    items.forEach(s => {
      const cat = (s.categoria && s.categoria.trim()) ? s.categoria.trim() : "Outros";
      if (!agrup[cat]) agrup[cat] = [];
      agrup[cat].push(s);
    });
    // ordenar serviços dentro da categoria por nome
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

  // Monta HTML final separando as seções
  const htmlNormais = Object.keys(agrupNormais).length ? `<section class="sec-servicos-normais">
      <h1 class="sec-titulo">Serviços</h1>
      ${renderCategoriaBlocos(agrupNormais, false)}
    </section>` : '';

  const htmlPets = Object.keys(agrupPets).length ? `<section class="sec-servicos-pet">
      <h1 class="sec-titulo">Serviços PET</h1>
      ${renderCategoriaBlocos(agrupPets, true)}
    </section>` : '';

  listaServicosDiv.innerHTML = htmlPets + htmlNormais; // PETs primeiro (opcional)
}

// --- Render cartão do serviço (normal ou pet) ---
function renderServicoCard(servico, isPet) {
  // Campos comuns
  const nome = sanitizeHTML(servico.nome);
  const desc = sanitizeHTML(servico.descricao || "");
  const preco = formatarPreco(servico.preco);
  const duracao = servico.duracao || 0;

  // Campos PET (se existirem)
  let petInfoHtml = "";
  if (isPet) {
    const tipoAnimal = servico.tipoAnimal ? sanitizeHTML(servico.tipoAnimal) : "—";
    // porte pode ser array ou string
    const porte = Array.isArray(servico.portes) ? servico.portes.join(", ") : (servico.porte || "");
    const tempoExtra = servico.tempoExtraOpcional ? ` • Extra: ${servico.tempoExtraOpcional} min` : "";
    let precoPorPorteHtml = "";
    // Preço por porte (se existir)
    if (servico.precoPequeno || servico.precoMedio || servico.precoGrande || servico.precoGigante) {
      const parts = [];
      if (servico.precoPequeno) parts.push(`P: ${formatarPreco(servico.precoPequeno)}`);
      if (servico.precoMedio) parts.push(`M: ${formatarPreco(servico.precoMedio)}`);
      if (servico.precoGrande) parts.push(`G: ${formatarPreco(servico.precoGrande)}`);
      if (servico.precoGigante) parts.push(`GG: ${formatarPreco(servico.precoGigante)}`);
      precoPorPorteHtml = `<div class="servico-preco-por-porte">${parts.join(" • ")}</div>`;
    }

    petInfoHtml = `
      <div class="servico-pet-info">
        <div class="servico-tags">🐾 ${tipoAnimal} ${porte ? " • " + sanitizeHTML(porte) : ""}</div>
        ${precoPorPorteHtml}
        <div class="servico-duracao-pet">${duracao} min ${tempoExtra}</div>
      </div>
    `;
  }

  // Ações (editar/excluir) só para dono/admin
  const acoes = isDono ? `
    <div class="servico-acoes">
      <button class="btn-acao btn-editar" data-id="${servico.id}" data-type="${isPet ? 'pet' : 'normal'}">Editar</button>
      <button class="btn-acao btn-excluir" data-id="${servico.id}" data-type="${isPet ? 'pet' : 'normal'}">Excluir</button>
    </div>` : "";

  // Composição final do card
  return `
    <div class="servico-card" data-id="${servico.id}" data-type="${isPet ? 'pet' : 'normal'}">
      <div class="servico-header">
        <h3 class="servico-titulo">${nome}</h3>
      </div>
      <p class="servico-descricao">${desc}</p>
      <div class="servico-footer">
        <div>
          <span class="servico-preco">${preco}</span>
          <span class="servico-duracao"> • ${duracao} min</span>
        </div>
        ${acoes}
      </div>
      ${petInfoHtml}
    </div>
  `;
}

// --- Ações: excluir ---
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

// --- Event Listeners (editar/excluir/novo) ---
if (listaServicosDiv) {
  listaServicosDiv.addEventListener('click', function(e) {
    const target = e.target.closest('.btn-acao');
    if (!target) return;
    const id = target.dataset.id;
    const tipo = target.dataset.type || 'normal';
    if (!id) return;

    if (target.classList.contains('btn-editar')) {
      // redireciona para o formulário adequado
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
    // se quiser botões separados no UI (novo normal / novo pet) você pode usar data-attributes no HTML
    if (!isDono) {
      showAlert("Acesso Negado", "Apenas o dono pode adicionar serviços.");
    } else {
      // por padrão redireciona para a criação de serviço normal;
      // caso queira abrir lista de escolha (Normal / PET), troque por um modal
      window.location.href = 'novo-servico.html';
    }
  });
}

// botão promoções (se existir)
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
