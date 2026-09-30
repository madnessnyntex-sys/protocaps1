<?php
$pageTitle = "Sales";
$activePage = "sales";
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>
<script>
  const SHOP_NAME_JS = <?php echo json_encode(SHOP_NAME); ?>;
  const SHOP_ADDRESS_JS = <?php echo json_encode(SHOP_ADDRESS); ?>;
</script>
<div class="main">
  <header class="topbar">
    <h1>Sales</h1>
    <div class="topbar-actions">
      <div class="view-toggle">
        <button type="button" class="toggle-btn active" data-view="pos">New Sale</button>
        <button type="button" class="toggle-btn" data-view="history">History</button>
      </div>
    </div>
  </header>
  <main class="content">
    <div id="posView" class="pos-layout">
      <section class="pos-catalog">
        <input type="text" id="posSearch" placeholder="Search product name or SKU&hellip;" autofocus>
        <div class="pos-grid" id="posGrid"></div>
      </section>

      <section class="pos-cart">
        <h2>Current Sale</h2>
        <div class="cart-items" id="cartItems">
          <p class="empty-row">Cart is empty. Click a product to add it.</p>
        </div>
        <div class="cart-summary">
          <div class="cart-row"><span>Subtotal</span><span id="cartSubtotal">&#8369;0.00</span></div>
          <div class="cart-row">
            <span>Discount (&#8369;)</span>
            <input type="number" id="cartDiscount" min="0" step="0.01" value="0">
          </div>
          <div class="cart-row cart-total"><span>Total</span><span id="cartTotal">&#8369;0.00</span></div>
        </div>

        <div class="cart-payment">
          <label>Payment Method</label>
          <div class="payment-toggle">
            <button type="button" class="payment-btn active" data-method="cash">Cash</button>
            <button type="button" class="payment-btn" data-method="digital">Digital (GCash, etc.)</button>
          </div>
          <div id="cashFields">
            <label for="amountTendered">Amount Tendered (&#8369;)</label>
            <input type="number" id="amountTendered" min="0" step="0.01">
            <div class="cart-row"><span>Change</span><span id="changeAmount">&#8369;0.00</span></div>
          </div>
        </div>

        <div id="saleError" class="form-error" hidden></div>
        <button class="btn btn-primary btn-block btn-lg" id="completeSaleBtn" type="button" style="margin-top: 14px;">Complete Sale</button>
        <button class="btn btn-ghost btn-block" id="clearCartBtn" type="button" style="margin-top: 8px;">Clear Cart</button>
      </section>
    </div>

    <div id="historyView" hidden>
      <section class="filter-bar">
        <input type="date" id="historyStartDate">
        <input type="date" id="historyEndDate">
        <button class="btn btn-secondary" id="historyTodayBtn" type="button">Today</button>
        <button class="btn btn-ghost" id="historyClearBtn" type="button">Show All</button>
      </section>
      <section class="panel">
        <table class="data-table">
          <thead>
            <tr><th>Invoice</th><th>Date &amp; Time</th><th>Cashier</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr>
          </thead>
          <tbody id="historyBody"><tr><td colspan="7" class="empty-row"><div class="spinner"></div></td></tr></tbody>
        </table>
      </section>
    </div>
  </main>
</div>

<div class="modal-overlay" id="receiptModal" hidden>
  <div class="modal modal-receipt">
    <div id="receiptContent"></div>
    <div class="modal-actions no-print">
      <button type="button" class="btn btn-ghost" data-close-modal="receiptModal">Close</button>
      <button type="button" class="btn btn-danger" id="voidSaleBtn" data-admin-only>Void This Sale</button>
      <button type="button" class="btn btn-primary" id="printReceiptBtn">Print</button>
    </div>
  </div>
</div>

<script src="assets/js/api.js"></script>
<script src="assets/js/format.js"></script>
<script src="assets/js/auth-guard.js"></script>
<script src="assets/js/sales.js"></script>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
