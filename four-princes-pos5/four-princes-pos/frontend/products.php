<?php
$pageTitle = "Products";
$activePage = "products";
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>
<div class="main">
  <header class="topbar">
    <h1>Products &amp; Categories</h1>
    <div class="topbar-actions">
      <button class="btn btn-secondary" id="openCategoryModalBtn" type="button">+ Category</button>
      <button class="btn btn-primary" id="openProductModalBtn" type="button">+ Product</button>
    </div>
  </header>
  <main class="content">
    <section class="filter-bar">
      <input type="text" id="searchInput" placeholder="Search by name or SKU&hellip;">
      <select id="categoryFilter"><option value="">All categories</option></select>
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
          <tr>
            <th>Product</th><th>SKU</th><th>Category</th>
            <th>Price</th><th>Cost</th><th>Stock</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody id="productsBody"><tr><td colspan="8" class="empty-row"><div class="spinner"></div></td></tr></tbody>
      </table>
    </section>
  </main>
</div>

<!-- Category Modal -->
<div class="modal-overlay" id="categoryModal" hidden>
  <div class="modal">
    <h2>New Category</h2>
    <form id="categoryForm">
      <label for="categoryName">Name</label>
      <input type="text" id="categoryName" required>
      <label for="categoryDescription">Description</label>
      <textarea id="categoryDescription" rows="2"></textarea>
      <div id="categoryError" class="form-error" hidden></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal="categoryModal">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Category</button>
      </div>
    </form>
  </div>
</div>

<!-- Product Modal -->
<div class="modal-overlay" id="productModal" hidden>
  <div class="modal">
    <h2 id="productModalTitle">New Product</h2>
    <form id="productForm">
      <input type="hidden" id="productId">
      <div class="form-grid">
        <div><label for="productName">Product Name</label><input type="text" id="productName" required></div>
        <div><label for="productSku">SKU</label><input type="text" id="productSku" required></div>
        <div><label for="productCategory">Category</label><select id="productCategory"><option value="">&mdash; None &mdash;</option></select></div>
        <div><label for="productSize">Size</label><input type="text" id="productSize" placeholder="e.g. M, 32, Free Size"></div>
        <div><label for="productColor">Color</label><input type="text" id="productColor"></div>
        <div><label for="productPrice">Price (&#8369;)</label><input type="number" id="productPrice" step="0.01" min="0" required></div>
        <div><label for="productCost">Cost (&#8369;)</label><input type="number" id="productCost" step="0.01" min="0" required></div>
        <div><label for="productReorderLevel">Reorder Level</label><input type="number" id="productReorderLevel" min="0" value="5" required></div>
        <div id="initialStockField"><label for="productInitialStock">Initial Stock</label><input type="number" id="productInitialStock" min="0" value="0"></div>
      </div>
      <div id="productError" class="form-error" hidden></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-danger" id="deactivateProductBtn" data-admin-only hidden>Deactivate</button>
        <button type="button" class="btn btn-ghost" data-close-modal="productModal">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Product</button>
      </div>
    </form>
  </div>
</div>

<script src="assets/js/api.js"></script>
<script src="assets/js/format.js"></script>
<script src="assets/js/auth-guard.js"></script>
<script src="assets/js/products.js"></script>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
