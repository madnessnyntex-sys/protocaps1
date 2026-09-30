<?php
$pageTitle = "Dashboard";
$activePage = "dashboard";
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>
<div class="main">
  <header class="topbar">
    <h1>Dashboard</h1>
    <div class="topbar-actions">
      <span class="today-date" id="todayDate"></span>
    </div>
  </header>
  <main class="content">
    <section class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-label">Today's Revenue</span>
        <span class="kpi-value" id="kpiTodayRevenue">&#8369;0.00</span>
        <span class="kpi-sub" id="kpiTodayCount">0 transactions</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">This Week's Revenue</span>
        <span class="kpi-value" id="kpiWeekRevenue">&#8369;0.00</span>
      </div>
      <div class="kpi-card kpi-warning">
        <span class="kpi-label">Low Stock Items</span>
        <span class="kpi-value" id="kpiLowStock">0</span>
        <a href="stock.php" class="kpi-link">View stock</a>
      </div>
      <div class="kpi-card kpi-danger">
        <span class="kpi-label">Out of Stock Items</span>
        <span class="kpi-value" id="kpiOutStock">0</span>
        <a href="stock.php" class="kpi-link">View stock</a>
      </div>
    </section>

    <section class="panel-grid">
      <div class="panel">
        <h2>Top Selling Products</h2>
        <p class="muted-note">Last 7 days</p>
        <table class="data-table">
          <thead><tr><th>Product</th><th>SKU</th><th>Qty Sold</th></tr></thead>
          <tbody id="topProductsBody"><tr><td colspan="3" class="empty-row"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
      <div class="panel">
        <h2 style="display:flex; justify-content:space-between; align-items:center;">
          Recent Sales
          <a href="sales.php?view=history" style="font-size:12.5px; font-weight:600; color:var(--color-primary); text-decoration:none;">View all</a>
        </h2>
        <p class="muted-note">Last 10 transactions</p>
        <table class="data-table">
          <thead><tr><th>Invoice</th><th>Cashier</th><th>Total</th><th>Time</th></tr></thead>
          <tbody id="recentSalesBody"><tr><td colspan="4" class="empty-row"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </section>
  </main>
</div>
<script src="assets/js/api.js"></script>
<script src="assets/js/format.js"></script>
<script src="assets/js/auth-guard.js"></script>
<script src="assets/js/dashboard.js"></script>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
