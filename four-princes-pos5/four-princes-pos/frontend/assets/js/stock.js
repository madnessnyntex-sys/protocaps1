let allStock = [];

function renderStock() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const rows = allStock.filter(p => {
    if (search && !(p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search))) return false;
    if (status && p.status !== status) return false;
    return true;
  });

  const body = document.getElementById('stockBody');
  body.innerHTML = rows.length ? rows.map(p => `
    <tr>
      <td>${p.name}${p.size ? ` <span class="muted-note">(${p.size}${p.color ? ', ' + p.color : ''})</span>` : ''}</td>
      <td>${p.sku}</td>
      <td><strong>${p.current_stock}</strong></td>
      <td>${p.reorder_level}</td>
      <td>${statusBadge(p.status)}</td>
      <td>
        <button class="btn-link" type="button" data-adjust="${p.id}">Adjust</button>
        &nbsp;&middot;&nbsp;
        <button class="btn-link" type="button" data-history="${p.id}">History</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="6" class="empty-row">No products match your filters.</td></tr>';

  body.querySelectorAll('[data-adjust]').forEach(btn => btn.addEventListener('click', () => openAdjustModal(btn.dataset.adjust)));
  body.querySelectorAll('[data-history]').forEach(btn => btn.addEventListener('click', () => openHistoryModal(btn.dataset.history)));
}

async function loadStock() {
  allStock = await Api.get('/stock');
  document.getElementById('lowStockCount').textContent = allStock.filter(p => p.status === 'low_stock').length;
  document.getElementById('outStockCount').textContent = allStock.filter(p => p.status === 'out_of_stock').length;
  renderStock();
}

function openAdjustModal(productId) {
  const p = allStock.find(x => x.id == productId);
  document.getElementById('adjustProductName').textContent = p.name;
  document.getElementById('adjustProductId').value = p.id;
  document.getElementById('adjustType').value = 'restock';
  document.getElementById('adjustQuantity').value = '';
  document.getElementById('adjustNotes').value = '';
  document.getElementById('adjustError').hidden = true;
  openModal('adjustModal');
}

document.getElementById('adjustForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('adjustError');
  const quantityChange = parseInt(document.getElementById('adjustQuantity').value, 10);

  if (!quantityChange) {
    errorBox.textContent = 'Enter a non-zero quantity.';
    errorBox.hidden = false;
    return;
  }

  try {
    await Api.post('/stock/adjust', {
      product_id: document.getElementById('adjustProductId').value,
      quantity_change: quantityChange,
      movement_type: document.getElementById('adjustType').value,
      notes: document.getElementById('adjustNotes').value.trim(),
    });
    closeModal('adjustModal');
    await loadStock();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});

async function openHistoryModal(productId) {
  const p = allStock.find(x => x.id == productId);
  document.getElementById('historyProductName').textContent = p.name;
  document.getElementById('historyBody').innerHTML = '<tr><td colspan="6" class="empty-row"><div class="spinner"></div></td></tr>';
  openModal('historyModal');

  const movements = await Api.get(`/stock/movements?product_id=${productId}`);
  document.getElementById('historyBody').innerHTML = movements.length ? movements.map(m => `
    <tr>
      <td>${formatDateTime(m.created_at)}</td>
      <td>${m.movement_type}</td>
      <td>${m.quantity_change > 0 ? '+' : ''}${m.quantity_change}</td>
      <td>${m.resulting_stock}</td>
      <td>${m.created_by_name || '\u2014'}</td>
      <td>${m.notes || '\u2014'}</td>
    </tr>
  `).join('') : '<tr><td colspan="6" class="empty-row">No movements recorded.</td></tr>';
}

document.getElementById('searchInput').addEventListener('input', renderStock);
document.getElementById('statusFilter').addEventListener('change', renderStock);

loadStock();
setInterval(loadStock, 30000);
