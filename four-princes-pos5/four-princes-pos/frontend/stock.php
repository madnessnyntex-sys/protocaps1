<?php
$pageTitle = "Stock";
$activePage = "stock";
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>
<div class="main">
  <header class="topbar">
    <h1>Stock Monitoring</h1>
  </header>
  <main class="content">
    <section class="alert-summary">
      <div class="alert-chip alert-chip-warning">&#9888; <span id="lowStockCount">0</span> low stock</div>
      <div class="alert-chip alert-chip-danger">&#10005; <span id="outStockCount">0</span> out of stock</div>
    </section>

    <section class="filter-bar">
      <input type="text" id="searchInput" placeholder="Search by name or SKU&hellip;">
      <select id="statusFilter">
        <option value="">All statuses</option>
        <option value="in_stock">In stock</option>
        <option value="low_stock">Low stock</option>
        <option value="out_of_stock">Out of stock</option>
      </select>
    </section>

    <section class="panel">
      <table class="data-table">
        <thead>
          <tr><th>Product</th><th>SKU</th><th>Current Stock</th><th>Reorder Level</th><th>Status</th><th></th></tr>
        </thead>
        <tbody id="stockBody"><tr><td colspan="6" class="empty-row"><div class="spinner"></div></td></tr></tbody>
      </table>
    </section>
  </main>
</div>

<div class="modal-overlay" id="adjustModal" hidden>
  <div class="modal">
    <h2>Adjust Stock</h2>
    <p class="muted-note" id="adjustProductName"></p>
    <form id="adjustForm">
      <input type="hidden" id="adjustProductId">
      <label for="adjustType">Movement Type</label>
      <select id="adjustType">
        <option value="restock">Restock (delivery received)</option>
        <option value="adjustment">Adjustment (correction, damage, etc.)</option>
      </select>
      <label for="adjustQuantity">Quantity Change</label>
      <input type="number" id="adjustQuantity" placeholder="e.g. 20 to add, -3 to remove" required>
      <p class="field-hint">Use a positive number to add stock, a negative number to remove it.</p>
      <label for="adjustNotes">Notes</label>
      <textarea id="adjustNotes" rows="2" placeholder="Optional note for the history log"></textarea>
      <div id="adjustError" class="form-error" hidden></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal="adjustModal">Cancel</button>
        <button type="submit" class="btn btn-primary">Confirm Adjustment</button>
      </div>
    </form>
  </div>
</div>

<div class="modal-overlay" id="historyModal" hidden>
  <div class="modal modal-lg">
    <h2>Movement History</h2>
    <p class="muted-note" id="historyProductName"></p>
    <table class="data-table">
      <thead><tr><th>Date</th><th>Type</th><th>Change</th><th>Resulting Stock</th><th>By</th><th>Notes</th></tr></thead>
      <tbody id="historyBody"></tbody>
    </table>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" data-close-modal="historyModal">Close</button>
    </div>
  </div>
</div>

<script src="assets/js/api.js"></script>
<script src="assets/js/format.js"></script>
<script src="assets/js/auth-guard.js"></script>
<script src="assets/js/stock.js"></script>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
