let allCategories = [];
let allProducts = [];
const currentUser = Api.getUser();

async function loadCategories() {
  allCategories = await Api.get('/categories');
  const options = allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('categoryFilter').innerHTML = '<option value="">All categories</option>' + options;
  document.getElementById('productCategory').innerHTML = '<option value="">\u2014 None \u2014</option>' + options;
}

function renderProducts() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const categoryId = document.getElementById('categoryFilter').value;
  const status = document.getElementById('statusFilter').value;

  const rows = allProducts.filter(p => {
    if (search && !(p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search))) return false;
    if (categoryId && String(p.category_id) !== categoryId) return false;
    if (status && p.status !== status) return false;
    return true;
  });

  const body = document.getElementById('productsBody');
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="8" class="empty-row">No products match your filters.</td></tr>';
    return;
  }

  body.innerHTML = rows.map(p => `
    <tr>
      <td>
        ${p.name}
        ${(p.size || p.color) ? `<div class="muted-note">${[p.size, p.color].filter(Boolean).join(' \u00b7 ')}</div>` : ''}
      </td>
      <td>${p.sku}</td>
      <td>${p.category_name || '\u2014'}</td>
      <td>${peso(p.price)}</td>
      <td>${peso(p.cost)}</td>
      <td>${p.current_stock}</td>
      <td>${statusBadge(p.status)}</td>
      <td><button class="btn-link" type="button" data-edit="${p.id}">Edit</button></td>
    </tr>
  `).join('');

  body.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.edit));
  });
}

async function loadProducts() {
  allProducts = await Api.get('/products?active=true');
  renderProducts();
}

function openEditModal(id) {
  const p = allProducts.find(x => x.id == id);
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  document.getElementById('productId').value = p.id;
  document.getElementById('productName').value = p.name;
  document.getElementById('productSku').value = p.sku;
  document.getElementById('productCategory').value = p.category_id || '';
  document.getElementById('productSize').value = p.size || '';
  document.getElementById('productColor').value = p.color || '';
  document.getElementById('productPrice').value = p.price;
  document.getElementById('productCost').value = p.cost;
  document.getElementById('productReorderLevel').value = p.reorder_level;
  document.getElementById('initialStockField').style.display = 'none';
  document.getElementById('deactivateProductBtn').hidden = currentUser.role !== 'admin';
  document.getElementById('deactivateProductBtn').dataset.id = p.id;
  document.getElementById('productError').hidden = true;
  openModal('productModal');
}

document.getElementById('openProductModalBtn').addEventListener('click', () => {
  document.getElementById('productForm').reset();
  document.getElementById('productModalTitle').textContent = 'New Product';
  document.getElementById('productId').value = '';
  document.getElementById('initialStockField').style.display = '';
  document.getElementById('deactivateProductBtn').hidden = true;
  document.getElementById('productError').hidden = true;
  openModal('productModal');
});

document.getElementById('openCategoryModalBtn').addEventListener('click', () => {
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryError').hidden = true;
  openModal('categoryModal');
});

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('categoryError');
  try {
    await Api.post('/categories', {
      name: document.getElementById('categoryName').value.trim(),
      description: document.getElementById('categoryDescription').value.trim(),
    });
    closeModal('categoryModal');
    await loadCategories();
    renderProducts();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('productError');
  const id = document.getElementById('productId').value;
  const payload = {
    name: document.getElementById('productName').value.trim(),
    sku: document.getElementById('productSku').value.trim(),
    category_id: document.getElementById('productCategory').value || null,
    size: document.getElementById('productSize').value.trim(),
    color: document.getElementById('productColor').value.trim(),
    price: parseFloat(document.getElementById('productPrice').value),
    cost: parseFloat(document.getElementById('productCost').value),
    reorder_level: parseInt(document.getElementById('productReorderLevel').value, 10),
  };
  if (!id) payload.initial_stock = parseInt(document.getElementById('productInitialStock').value || '0', 10);

  try {
    if (id) {
      await Api.put(`/products/${id}`, payload);
    } else {
      await Api.post('/products', payload);
    }
    closeModal('productModal');
    await loadProducts();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});

document.getElementById('deactivateProductBtn').addEventListener('click', async function () {
  if (!confirm('Deactivate this product? It will be hidden from the catalog and POS, but its sales history stays intact.')) return;
  try {
    await Api.delete(`/products/${this.dataset.id}`);
    closeModal('productModal');
    await loadProducts();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('searchInput').addEventListener('input', renderProducts);
document.getElementById('categoryFilter').addEventListener('change', renderProducts);
document.getElementById('statusFilter').addEventListener('change', renderProducts);

(async function init() {
  await loadCategories();
  await loadProducts();
})();
