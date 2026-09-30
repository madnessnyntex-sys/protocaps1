<aside class="sidebar">
  <div class="sidebar-brand">
    <span class="brand-mark">FP</span>
    <div>
      <div class="brand-name"><?php echo SHOP_NAME; ?></div>
      <div class="brand-sub">POS &amp; Inventory</div>
    </div>
  </div>
  <nav class="sidebar-nav">
    <a href="dashboard.php" class="<?php echo $activePage === 'dashboard' ? 'active' : ''; ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
      <span>Dashboard</span>
    </a>
    <a href="sales.php" class="<?php echo $activePage === 'sales' ? 'active' : ''; ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
      <span>Sales</span>
    </a>
    <a href="stock.php" class="<?php echo $activePage === 'stock' ? 'active' : ''; ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
      <span>Stock</span>
    </a>
    <a href="products.php" class="<?php echo $activePage === 'products' ? 'active' : ''; ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 11 3.8a2 2 0 0 0-1.4-.6L3 3v6.6a2 2 0 0 0 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l4.6-4.6a2 2 0 0 0 0-2.6z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>
      <span>Products</span>
    </a>
    <a href="popularity.php" class="<?php echo $activePage === 'popularity' ? 'active' : ''; ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
      <span>Popularity</span>
    </a>
    <a href="users.php" data-admin-only class="<?php echo $activePage === 'users' ? 'active' : ''; ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <span>Manage Staff</span>
    </a>
    <a href="backup.php" data-admin-only class="<?php echo $activePage === 'backup' ? 'active' : ''; ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      <span>Backup</span>
    </a>
  </nav>
  <div class="sidebar-footer">
    <div class="sidebar-user">
      <div class="avatar" data-user-initial></div>
      <div>
        <div class="sidebar-user-name" data-user-name>&mdash;</div>
        <div class="sidebar-user-role" data-user-role>&mdash;</div>
      </div>
    </div>
    <button class="btn-link" id="logoutBtn" type="button">Log out</button>
  </div>
</aside>
