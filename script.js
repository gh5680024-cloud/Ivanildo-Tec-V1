// ===== Ivanildo Tec — Estoque & Projetos =====
// Dados salvos no localStorage do navegador (persistem entre acessos).

const STORAGE_PRODUCTS = 'ivanildoTec_products';
const STORAGE_PROJECTS = 'ivanildoTec_projects';

let products = loadFromStorage(STORAGE_PRODUCTS, []);
let projects = loadFromStorage(STORAGE_PROJECTS, []);

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('Erro ao ler localStorage:', e);
    return fallback;
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
}
function saveProjects() {
  localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(projects));
}

function formatMoney(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------- Elementos ----------
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

// ---------- Abas ----------
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.toggle('is-active', b === btn));
    views.forEach(v => v.classList.toggle('is-active', v.id === `${tab}Secao` || v.id === `${tab}Section`));
  });
});

// ---------- Modais (abrir/fechar genérico) ----------
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

  const lowCount = products.filter(p => p.qty <= p.minQty).length;
  stockSummary.textContent = `${products.length} produto${products.length > 1 ? 's' : ''} cadastrado${products.length > 1 ? 's' : ''}` +
    (lowCount > 0 ? ` · ${lowCount} em estoque baixo` : '');

  products.forEach(p => {
    const isLow = p.qty <= p.minQty;
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
        <div><dt>Mínimo</dt><dd>${p.minQty}</dd></div>
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
    document.getElementById('productMinQty').value = p.minQty;
  } else {
    productModalTitle.textContent = 'Adicionar produto';
    productForm.reset();
    document.getElementById('productId').value = '';
  }
  productModal.classList.add('is-open');
}

document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());

productForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const name = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const qty = parseInt(document.getElementById('productQty').value, 10);
  const minQty = parseInt(document.getElementById('productMinQty').value, 10);

  if (id) {
    const p = products.find(pr => pr.id === id);
    Object.assign(p, { name, category, price, qty, minQty });
  } else {
    products.push({ id: cryptoId(), name, category, price, qty, minQty });
  }

  saveProducts();
  renderProducts();
  productModal.classList.remove('is-open');
});

function deleteProduct(id) {
  const p = products.find(pr => pr.id === id);
  if (!p) return;
  if (!confirm(`Excluir "${p.name}" do estoque?`)) return;
  products = products.filter(pr => pr.id !== id);
  saveProducts();
  renderProducts();
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
      items.push({ id, name: product.name, price: product.price, qty });
    }
  });
  return items;
}

function updateBudgetPreview() {
  const items = getSelectedItems();
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  budgetPreview.textContent = formatMoney(total);
}

projectForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('projectName').value.trim();
  const client = document.getElementById('clientName').value.trim();
  const items = getSelectedItems();

  if (items.length === 0) {
    alert('Selecione pelo menos um produto usado no projeto.');
    return;
  }

  for (const item of items) {
    const product = products.find(p => p.id === item.id);
    if (!product || item.qty > product.qty) {
      alert(`Quantidade indisponível de "${item.name}" em estoque.`);
      return;
    }
  }

  // Baixa automática no estoque
  items.forEach(item => {
    const product = products.find(p => p.id === item.id);
    product.qty -= item.qty;
  });
  saveProducts();
  renderProducts();

  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  projects.unshift({
    id: cryptoId(),
    name,
    client,
    date: new Date().toLocaleDateString('pt-BR'),
    items,
    total
  });
  saveProjects();
  renderProjects();

  projectModal.classList.remove('is-open');
});

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

  const totalFaturado = projects.reduce((sum, p) => sum + p.total, 0);
  projectsSummary.textContent = `${projects.length} projeto${projects.length > 1 ? 's' : ''} · total ${formatMoney(totalFaturado)}`;

  projects.forEach(proj => {
    const row = document.createElement('article');
    row.className = 'project-row';
    row.innerHTML = `
      <div class="project-row-main">
        <h3>${escapeHtml(proj.name)}</h3>
        <p class="muted">Cliente: ${escapeHtml(proj.client)} · ${proj.date}</p>
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
  projectDetailsTitle.textContent = proj.name;
  projectDetailsContent.innerHTML = `
    <p class="muted">Cliente: <strong>${escapeHtml(proj.client)}</strong> · ${proj.date}</p>
    <ul class="details-list">
      ${proj.items.map(it => `<li><span>${it.qty}× ${escapeHtml(it.name)}</span><span>${formatMoney(it.price * it.qty)}</span></li>`).join('')}
    </ul>
    <div class="details-total">
      <span>Orçamento total</span>
      <strong>${formatMoney(proj.total)}</strong>
    </div>
  `;
  projectDetailsModal.classList.add('is-open');
}

// ---------- Utilitários ----------
function cryptoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------- Init ----------
renderProducts();
renderProjects();
