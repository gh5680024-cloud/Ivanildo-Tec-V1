// ===== Ivanildo Tec — Estoque & Projetos (Supabase) =====

const SUPABASE_URL = 'https://onquavfpeweqlcqeyyar.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JmfrdYagJLA8t8TqyIr7eg_At42pHXq';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let products = [];
let projects = [];
let realtimeChannels = [];

// ---------- Elementos ----------
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const userEmailEl = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

const tabBtns = document.querySelectorAll('.tab-btn');
const views = document.querySelectorAll('.view');

const productsGrid = document.getElementById('productsGrid');
const productsEmpty = document.getElementById('productsEmpty');
const stockSummary = document.getElementById('stockSummary');

const projectsList = document.getElementById('projectsList');
const projectsEmpty = document.getElementById('projectsEmpty');
const projectsSummary = document.getElementById('projectsSummary');

const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const productModalTitle = document.getElementById('productModalTitle');

const projectModal = document.getElementById('projectModal');
const projectForm = document.getElementById('projectForm');
const projectProductsList = document.getElementById('projectProductsList');
const budgetPreview = document.getElementById('budgetPreview');

const projectDetailsModal = document.getElementById('projectDetailsModal');
const projectDetailsTitle = document.getElementById('projectDetailsTitle');
const projectDetailsContent = document.getElementById('projectDetailsContent');

// ---------- Utilitários ----------
function formatMoney(value) {
  return (Number(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ============================================================
// AUTENTICAÇÃO
// ============================================================

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Entrando...';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Entrar';

  if (error) {
    loginError.textContent = 'Email ou senha incorretos.';
    loginError.style.display = 'block';
  }
});

logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session) {
    showApp(session);
  } else {
    showLogin();
  }
});

function showLogin() {
  authScreen.style.display = 'flex';
  appScreen.style.display = 'none';
  loginForm.reset();
  unsubscribeRealtime();
}

async function showApp(session) {
  authScreen.style.display = 'none';
  appScreen.style.display = 'block';
  userEmailEl.textContent = session.user.email;
  await loadProducts();
  await loadProjects();
  subscribeRealtime();
}

// Verifica se já existe uma sessão salva ao abrir a página
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (session) showApp(session);
  else showLogin();
});

// ============================================================
// TEMPO REAL — reflete mudanças feitas por qualquer usuário
// ============================================================

function subscribeRealtime() {
  unsubscribeRealtime();

  const ch1 = supabaseClient
    .channel('produtos-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => loadProducts())
    .subscribe();

  const ch2 = supabaseClient
    .channel('projetos-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projetos' }, () => loadProjects())
    .subscribe();

  const ch3 = supabaseClient
    .channel('projeto-itens-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projeto_itens' }, () => loadProjects())
    .subscribe();

  realtimeChannels = [ch1, ch2, ch3];
}

function unsubscribeRealtime() {
  realtimeChannels.forEach(ch => supabaseClient.removeChannel(ch));
  realtimeChannels = [];
}

// ---------- Abas ----------
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.toggle('is-active', b === btn));
    views.forEach(v => v.classList.toggle('is-active', v.id === `${tab}Section`));
  });
});

// ---------- Modais ----------
document.querySelectorAll('[data-close]').forEach(el => {
  el.addEventListener('click', () => {
    document.getElementById(el.dataset.close).classList.remove('is-open');
  });
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('is-open');
  });
});

// ============================================================
// PRODUTOS
// ============================================================

async function loadProducts() {
  const { data, error } = await supabaseClient.from('produtos').select('*').order('name');
  if (error) {
    console.error('Erro ao carregar produtos:', error);
    return;
  }
  products = data;
  renderProducts();
}

function renderProducts() {
  productsGrid.innerHTML = '';

  if (products.length === 0) {
    productsEmpty.style.display = 'flex';
    productsGrid.style.display = 'none';
    stockSummary.textContent = 'Nenhum produto cadastrado';
    return;
  }

  productsEmpty.style.display = 'none';
  productsGrid.style.display = 'grid';

  const lowCount = products.filter(p => p.qty <= p.min_qty).length;
  stockSummary.textContent = `${products.length} produto${products.length > 1 ? 's' : ''} cadastrado${products.length > 1 ? 's' : ''}` +
    (lowCount > 0 ? ` · ${lowCount} em estoque baixo` : '');

  products.forEach(p => {
    const isLow = p.qty <= p.min_qty;
    const card = document.createElement('article');
    card.className = 'product-card' + (isLow ? ' is-low' : '');
    card.innerHTML = `
      <div class="product-card-top">
        <h3>${escapeHtml(p.name)}</h3>
        ${isLow ? '<span class="low-badge">Estoque baixo</span>' : ''}
      </div>
      <p class="category-tag">${escapeHtml(p.category)}</p>
      <dl class="product-stats">
        <div><dt>Preço</dt><dd>${formatMoney(p.price)}</dd></div>
        <div><dt>Em estoque</dt><dd class="${isLow ? 'stat-low' : ''}">${p.qty}</dd></div>
        <div><dt>Mínimo</dt><dd>${p.min_qty}</dd></div>
      </dl>
      <div class="card-actions">
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${p.id}">Editar</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${p.id}">Excluir</button>
      </div>
    `;
    productsGrid.appendChild(card);
  });

  productsGrid.querySelectorAll('[data-action="edit"]').forEach(btn =>
    btn.addEventListener('click', () => openProductModal(btn.dataset.id)));
  productsGrid.querySelectorAll('[data-action="delete"]').forEach(btn =>
    btn.addEventListener('click', () => deleteProduct(btn.dataset.id)));
}

function openProductModal(id = null) {
  if (id) {
    const p = products.find(pr => pr.id === id);
    productModalTitle.textContent = 'Editar produto';
    document.getElementById('productId').value = p.id;
    document.getElementById('productName').value = p.name;
    document.getElementById('productCategory').value = p.category;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productQty').value = p.qty;
    document.getElementById('productMinQty').value = p.min_qty;
  } else {
    productModalTitle.textContent = 'Adicionar produto';
    productForm.reset();
    document.getElementById('productId').value = '';
  }
  productModal.classList.add('is-open');
}

document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const name = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const qty = parseInt(document.getElementById('productQty').value, 10);
  const min_qty = parseInt(document.getElementById('productMinQty').value, 10);

  const submitBtn = productForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  let error;
  if (id) {
    ({ error } = await supabaseClient
      .from('produtos')
      .update({ name, category, price, qty, min_qty, updated_at: new Date().toISOString() })
      .eq('id', id));
  } else {
    ({ error } = await supabaseClient.from('produtos').insert([{ name, category, price, qty, min_qty }]));
  }

  submitBtn.disabled = false;

  if (error) {
    alert('Erro ao salvar produto: ' + error.message);
    return;
  }

  productModal.classList.remove('is-open');
  loadProducts();
});

async function deleteProduct(id) {
  const p = products.find(pr => pr.id === id);
  if (!p) return;
  if (!confirm(`Excluir "${p.name}" do estoque?`)) return;

  const { error } = await supabaseClient.from('produtos').delete().eq('id', id);
  if (error) {
    alert('Erro ao excluir produto: ' + error.message);
    return;
  }
  loadProducts();
}

// ============================================================
// PROJETOS
// ============================================================

document.getElementById('addProjectBtn').addEventListener('click', () => {
  if (products.length === 0) {
    alert('Cadastre pelo menos um produto no estoque antes de criar um projeto.');
    return;
  }
  projectForm.reset();
  renderProjectProductsList();
  updateBudgetPreview();
  projectModal.classList.add('is-open');
});

function renderProjectProductsList() {
  projectProductsList.innerHTML = '';

  products.forEach(p => {
    const row = document.createElement('div');
    row.className = 'project-product-row';
    const outOfStock = p.qty <= 0;
    row.innerHTML = `
      <label class="checkbox-label ${outOfStock ? 'is-disabled' : ''}">
        <input type="checkbox" class="pp-check" data-id="${p.id}" ${outOfStock ? 'disabled' : ''}>
        <span>${escapeHtml(p.name)}</span>
        <span class="muted">${formatMoney(p.price)} · disponível: ${p.qty}</span>
      </label>
      <input type="number" class="pp-qty" data-id="${p.id}" min="1" max="${p.qty}" value="1" disabled>
    `;
    projectProductsList.appendChild(row);
  });

  projectProductsList.querySelectorAll('.pp-check').forEach(chk => {
    chk.addEventListener('change', () => {
      const qtyInput = projectProductsList.querySelector(`.pp-qty[data-id="${chk.dataset.id}"]`);
      qtyInput.disabled = !chk.checked;
      updateBudgetPreview();
    });
  });
  projectProductsList.querySelectorAll('.pp-qty').forEach(inp => {
    inp.addEventListener('input', updateBudgetPreview);
  });
}

function getSelectedItems() {
  const items = [];
  projectProductsList.querySelectorAll('.pp-check:checked').forEach(chk => {
    const id = chk.dataset.id;
    const qtyInput = projectProductsList.querySelector(`.pp-qty[data-id="${id}"]`);
    const qty = Math.max(0, parseInt(qtyInput.value, 10) || 0);
    const product = products.find(p => p.id === id);
    if (product && qty > 0) {
      items.push({ produto_id: id, name: product.name, price: product.price, qty });
    }
  });
  return items;
}

function updateBudgetPreview() {
  const items = getSelectedItems();
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  budgetPreview.textContent = formatMoney(total);
}

projectForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('projectName').value.trim();
  const client = document.getElementById('clientName').value.trim();
  const items = getSelectedItems();

  if (items.length === 0) {
    alert('Selecione pelo menos um produto usado no projeto.');
    return;
  }

  const submitBtn = projectForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Finalizando...';

  const { error } = await supabaseClient.rpc('finalizar_projeto', {
    p_name: name,
    p_client: client,
    p_items: items.map(it => ({ produto_id: it.produto_id, qty: it.qty }))
  });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Finalizar projeto';

  if (error) {
    alert('Não foi possível finalizar o projeto: ' + error.message);
    return;
  }

  projectModal.classList.remove('is-open');
  loadProducts();
  loadProjects();
});

async function loadProjects() {
  const { data, error } = await supabaseClient
    .from('projetos')
    .select('*, projeto_itens(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar projetos:', error);
    return;
  }
  projects = data;
  renderProjects();
}

function renderProjects() {
  projectsList.innerHTML = '';

  if (projects.length === 0) {
    projectsEmpty.style.display = 'flex';
    projectsList.style.display = 'none';
    projectsSummary.textContent = 'Nenhum projeto realizado';
    return;
  }

  projectsEmpty.style.display = 'none';
  projectsList.style.display = 'flex';

  const totalFaturado = projects.reduce((sum, p) => sum + Number(p.total), 0);
  projectsSummary.textContent = `${projects.length} projeto${projects.length > 1 ? 's' : ''} · total ${formatMoney(totalFaturado)}`;

  projects.forEach(proj => {
    const row = document.createElement('article');
    row.className = 'project-row';
    const date = new Date(proj.created_at).toLocaleDateString('pt-BR');
    row.innerHTML = `
      <div class="project-row-main">
        <h3>${escapeHtml(proj.name)}</h3>
        <p class="muted">Cliente: ${escapeHtml(proj.client)} · ${date}</p>
      </div>
      <div class="project-row-side">
        <strong>${formatMoney(proj.total)}</strong>
        <button class="btn btn-ghost btn-sm" data-id="${proj.id}">Ver detalhes</button>
      </div>
    `;
    projectsList.appendChild(row);
  });

  projectsList.querySelectorAll('button[data-id]').forEach(btn =>
    btn.addEventListener('click', () => showProjectDetails(btn.dataset.id)));
}

function showProjectDetails(id) {
  const proj = projects.find(p => p.id === id);
  if (!proj) return;
  const date = new Date(proj.created_at).toLocaleDateString('pt-BR');
  const itens = proj.projeto_itens || [];
  projectDetailsTitle.textContent = proj.name;
  projectDetailsContent.innerHTML = `
    <p class="muted">Cliente: <strong>${escapeHtml(proj.client)}</strong> · ${date}</p>
    <ul class="details-list">
      ${itens.map(it => `<li><span>${it.qty}× ${escapeHtml(it.produto_nome)}</span><span>${formatMoney(it.price * it.qty)}</span></li>`).join('')}
    </ul>
    <div class="details-total">
      <span>Orçamento total</span>
      <strong>${formatMoney(proj.total)}</strong>
    </div>
  `;
  projectDetailsModal.classList.add('is-open');
}
