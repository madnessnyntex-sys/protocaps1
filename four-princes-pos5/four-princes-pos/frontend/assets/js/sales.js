let catalog = [];
let cart = []; // { product_id, name, sku, price, quantity, maxStock }
let paymentMethod = 'cash';

async function loadCatalog() {
  catalog = await Api.get('/products?active=true');
  renderCatalog();
}

function renderCatalog() {
  const search = document.getElementById('posSearch').value.toLowerCase();
  const filtered = catalog.filter(p => p.status !== 'out_of_stock' &&
    (!search || p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search)));

  const grid = document.getElementById('posGrid');
  grid.innerHTML = filtered.length ? filtered.map(p => `
    <button class="pos-tile" type="button" data-id="${p.id}">
      <span class="pos-tile-name">${p.name}</span>
      <span class="pos-tile-meta">${p.sku}${p.size ? ' \u00b7 ' + p.size : ''}${p.color ? ' \u00b7 ' + p.color : ''}</span>
      <span class="pos-tile-price">${peso(p.price)}</span>
      <span class="pos-tile-stock">${p.current_stock} in stock</span>
    </button>
  `).join('') : '<p class="empty-row">No matching products.</p>';

  grid.querySelectorAll('.pos-tile').forEach(tile => {
    tile.addEventListener('click', () => addToCart(parseInt(tile.dataset.id, 10)));
  });
}

function addToCart(productId) {
  const product = catalog.find(p => p.id === productId);
  const existing = cart.find(item => item.product_id === productId);
  const currentQty = existing ? existing.quantity : 0;

  if (currentQty + 1 > product.current_stock) {
    alert(`Only ${product.current_stock} of "${product.name}" left in stock.`);
    return;
  }

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      product_id: product.id, name: product.name, sku: product.sku,
      price: product.price, quantity: 1, maxStock: product.current_stock,
    });
  }
  renderCart();
}

function changeQuantity(productId, delta) {
  const item = cart.find(i => i.product_id === productId);
  if (!item) return;
  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    cart = cart.filter(i => i.product_id !== productId);
  } else if (newQty > item.maxStock) {
    alert(`Only ${item.maxStock} of "${item.name}" left in stock.`);
    return;
  } else {
    item.quantity = newQty;
  }
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.product_id !== productId);
  renderCart();
}

function calcSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderCart() {
  const container = document.getElementById('cartItems');
  container.innerHTML = cart.length ? cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-sku">${item.sku} \u00b7 ${peso(item.price)} each</span>
      </div>
      <div class="cart-item-qty">
        <button type="button" data-qty-minus="${item.product_id}">\u2212</button>
        <span>${item.quantity}</span>
        <button type="button" data-qty-plus="${item.product_id}">+</button>
      </div>
      <div class="cart-item-subtotal">${peso(item.price * item.quantity)}</div>
      <button type="button" class="cart-item-remove" data-remove="${item.product_id}">&#10005;</button>
    </div>
  `).join('') : '<p class="empty-row">Cart is empty. Click a product to add it.</p>';

  container.querySelectorAll('[data-qty-plus]').forEach(b =>
    b.addEventListener('click', () => changeQuantity(parseInt(b.dataset.qtyPlus, 10), 1)));
  container.querySelectorAll('[data-qty-minus]').forEach(b =>
    b.addEventListener('click', () => changeQuantity(parseInt(b.dataset.qtyMinus, 10), -1)));
  container.querySelectorAll('[data-remove]').forEach(b =>
    b.addEventListener('click', () => removeFromCart(parseInt(b.dataset.remove, 10))));

  updateTotals();
}

function updateTotals() {
  const subtotal = calcSubtotal();
  const discount = parseFloat(document.getElementById('cartDiscount').value || '0');
  const total = Math.max(subtotal - discount, 0);
  document.getElementById('cartSubtotal').textContent = peso(subtotal);
  document.getElementById('cartTotal').textContent = peso(total);

  if (paymentMethod === 'cash') {
    const tendered = parseFloat(document.getElementById('amountTendered').value || '0');
    document.getElementById('changeAmount').textContent = peso(Math.max(tendered - total, 0));
  }
}

document.getElementById('cartDiscount').addEventListener('input', updateTotals);
document.getElementById('amountTendered').addEventListener('input', updateTotals);
document.getElementById('posSearch').addEventListener('input', renderCatalog);

document.querySelectorAll('.payment-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    paymentMethod = btn.dataset.method;
    document.getElementById('cashFields').style.display = paymentMethod === 'cash' ? '' : 'none';
    updateTotals();
  });
});

document.getElementById('clearCartBtn').addEventListener('click', () => {
  if (cart.length && !confirm('Clear the current sale?')) return;
  cart = [];
  document.getElementById('cartDiscount').value = 0;
  document.getElementById('amountTendered').value = '';
  document.getElementById('saleError').hidden = true;
  renderCart();
});

document.getElementById('completeSaleBtn').addEventListener('click', async function () {
  const errorBox = document.getElementById('saleError');
  errorBox.hidden = true;

  if (!cart.length) {
    errorBox.textContent = 'Add at least one product to the cart first.';
    errorBox.hidden = false;
    return;
  }

  const subtotal = calcSubtotal();
  const discount = parseFloat(document.getElementById('cartDiscount').value || '0');
  const total = Math.max(subtotal - discount, 0);
  const payload = {
    items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
    payment_method: paymentMethod,
    discount: discount,
  };
  if (paymentMethod === 'cash') {
    payload.amount_tendered = parseFloat(document.getElementById('amountTendered').value || '0');
    if (payload.amount_tendered < total) {
      errorBox.textContent = 'Amount tendered is less than the total due.';
      errorBox.hidden = false;
      return;
    }
  }

  this.disabled = true;
  try {
    const sale = await Api.post('/sales', payload);
    showReceipt(sale);
    cart = [];
    document.getElementById('cartDiscount').value = 0;
    document.getElementById('amountTendered').value = '';
    renderCart();
    await loadCatalog();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  } finally {
    this.disabled = false;
  }
});

function showReceipt(sale) {
  const lines = sale.items.map(i => `
    <div class="receipt-line">
      <span>${i.quantity}x ${i.product_name}</span>
      <span>${peso(i.subtotal)}</span>
    </div>
  `).join('');

  const voidedNotice = sale.status === 'voided'
    ? '<p style="text-align:center; color: var(--color-danger); font-weight:700;">VOIDED</p><hr>'
    : '';

  document.getElementById('receiptContent').innerHTML = `
    <div class="receipt">
      <h2>${SHOP_NAME_JS}</h2>
      <p class="receipt-address">${SHOP_ADDRESS_JS}</p>
      <hr>
      ${voidedNotice}
      <p>Invoice: <strong>${sale.invoice_number}</strong></p>
      <p>Date: ${new Date(sale.created_at).toLocaleString('en-PH')}</p>
      <p>Cashier: ${sale.cashier_name || ''}</p>
      <hr>
      ${lines}
      <hr>
      <div class="receipt-line"><span>Subtotal</span><span>${peso(sale.subtotal)}</span></div>
      <div class="receipt-line"><span>Discount</span><span>${peso(sale.discount)}</span></div>
      <div class="receipt-line receipt-total"><span>Total</span><span>${peso(sale.total_amount)}</span></div>
      <div class="receipt-line"><span>Payment</span><span>${sale.payment_method}</span></div>
      ${sale.amount_tendered != null ? `<div class="receipt-line"><span>Tendered</span><span>${peso(sale.amount_tendered)}</span></div>` : ''}
      ${sale.change_amount != null ? `<div class="receipt-line"><span>Change</span><span>${peso(sale.change_amount)}</span></div>` : ''}
      <hr>
      <p class="receipt-thanks">Thank you for shopping with us!</p>
    </div>
  `;

  const voidBtn = document.getElementById('voidSaleBtn');
  voidBtn.dataset.saleId = sale.id;
  voidBtn.style.display = sale.status === 'voided' ? 'none' : '';

  openModal('receiptModal');
}

document.getElementById('printReceiptBtn').addEventListener('click', () => window.print());

document.getElementById('voidSaleBtn').addEventListener('click', async function () {
  const saleId = this.dataset.saleId;
  if (!confirm('Void this sale? The stock for each item will be restored. This cannot be undone.')) return;
  this.disabled = true;
  try {
    await Api.post(`/sales/${saleId}/void`, {});
    closeModal('receiptModal');
    if (!document.getElementById('historyView').hidden) await loadHistory();
  } catch (err) {
    alert(err.message);
  } finally {
    this.disabled = false;
  }
});

// ---------------------------------------------------------------- History

async function loadHistory() {
  const tbody = document.getElementById('historyBody');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-row"><div class="spinner"></div></td></tr>';

  const start = document.getElementById('historyStartDate').value;
  const end = document.getElementById('historyEndDate').value;
  const params = new URLSearchParams();
  if (start) params.set('start', start);
  if (end) params.set('end', end);

  try {
    const sales = await Api.get(`/sales${params.toString() ? '?' + params.toString() : ''}`);
    tbody.innerHTML = sales.length ? sales.map(s => `
      <tr>
        <td>${s.invoice_number}</td>
        <td>${formatDateTime(s.created_at)}</td>
        <td>${s.cashier_name || '\u2014'}</td>
        <td>${peso(s.total_amount)}</td>
        <td>${s.payment_method === 'cash' ? 'Cash' : 'Digital'}</td>
        <td>${s.status === 'voided' ? '<span class="badge badge-danger">Voided</span>' : '<span class="badge badge-success">Completed</span>'}</td>
        <td><button class="btn-link" type="button" data-view-sale="${s.id}">View</button></td>
      </tr>
    `).join('') : '<tr><td colspan="7" class="empty-row">No sales found for this range.</td></tr>';

    tbody.querySelectorAll('[data-view-sale]').forEach(btn =>
      btn.addEventListener('click', () => viewSale(btn.dataset.viewSale)));
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">${err.message}</td></tr>`;
  }
}

async function viewSale(saleId) {
  try {
    const sale = await Api.get(`/sales/${saleId}`);
    showReceipt(sale);
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('historyTodayBtn').addEventListener('click', () => {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('historyStartDate').value = today;
  document.getElementById('historyEndDate').value = today;
  loadHistory();
});

document.getElementById('historyClearBtn').addEventListener('click', () => {
  document.getElementById('historyStartDate').value = '';
  document.getElementById('historyEndDate').value = '';
  loadHistory();
});

document.getElementById('historyStartDate').addEventListener('change', loadHistory);
document.getElementById('historyEndDate').addEventListener('change', loadHistory);

// ---------------------------------------------------------------- View toggle

document.querySelectorAll('.view-toggle .toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    document.getElementById('posView').hidden = view !== 'pos';
    document.getElementById('historyView').hidden = view !== 'history';
    if (view === 'history') loadHistory();
  });
});

loadCatalog();

// Deep-link support: dashboard.php links here with ?view=history
if (new URLSearchParams(window.location.search).get('view') === 'history') {
  document.querySelector('.toggle-btn[data-view="history"]').click();
}
