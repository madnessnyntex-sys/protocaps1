<?php
$pageTitle = "Popularity";
$activePage = "popularity";
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>
<div class="main">
  <header class="topbar">
    <h1>Popularity &amp; Stock Insights</h1>
    <div class="topbar-actions">
      <select id="periodSelect">
        <option value="7">Last 7 days</option>
        <option value="30" selected>Last 30 days</option>
        <option value="90">Last 90 days</option>
      </select>
    </div>
  </header>
  <main class="content">
    <section class="panel-grid">
      <div class="panel">
        <h2>Best Sellers</h2>
        <p class="muted-note">Ranked by quantity sold this period</p>
        <table class="data-table">
          <thead><tr><th>Product</th><th>SKU</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
          <tbody id="bestSellersBody"><tr><td colspan="4" class="empty-row"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
      <div class="panel">
        <h2>Slow Movers</h2>
        <p class="muted-note">Selling, but well below the pack</p>
        <table class="data-table">
          <thead><tr><th>Product</th><th>SKU</th><th>Qty Sold</th></tr></thead>
          <tbody id="slowMoversBody"><tr><td colspan="3" class="empty-row"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
      <div class="panel">
        <h2>Restock Priority</h2>
        <p class="muted-note">Popular items running low or out of stock</p>
        <table class="data-table">
          <thead><tr><th>Product</th><th>SKU</th><th>Qty Sold</th><th>Stock</th><th>Status</th></tr></thead>
          <tbody id="restockBody"><tr><td colspan="5" class="empty-row"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
      <div class="panel">
        <h2>Dead Stock</h2>
        <p class="muted-note">No sales in the last <span id="deadStockDaysLabel">30</span> days</p>
        <table class="data-table">
          <thead><tr><th>Product</th><th>SKU</th><th>Stock on Hand</th></tr></thead>
          <tbody id="deadStockBody"><tr><td colspan="3" class="empty-row"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </section>
  </main>
</div>
<script src="assets/js/api.js"></script>
<script src="assets/js/format.js"></script>
<script src="assets/js/auth-guard.js"></script>
<script src="assets/js/popularity.js"></script>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
