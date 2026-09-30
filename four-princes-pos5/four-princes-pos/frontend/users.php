<?php
$pageTitle = "Manage Staff";
$activePage = "users";
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>
<div class="main">
  <header class="topbar">
    <h1>Manage Staff Accounts</h1>
    <div class="topbar-actions">
      <button class="btn btn-primary" id="openUserModalBtn" type="button">+ New Account</button>
    </div>
  </header>
  <main class="content">
    <section class="panel">
      <table class="data-table">
        <thead><tr><th>Username</th><th>Full Name</th><th>Role</th><th>Status</th><th></th></tr></thead>
        <tbody id="usersBody"><tr><td colspan="5" class="empty-row"><div class="spinner"></div></td></tr></tbody>
      </table>
    </section>
  </main>
</div>

<div class="modal-overlay" id="userModal" hidden>
  <div class="modal">
    <h2 id="userModalTitle">New Account</h2>
    <form id="userForm">
      <input type="hidden" id="userId">
      <label for="userUsername">Username</label>
      <input type="text" id="userUsername" required>
      <label for="userFullName">Full Name</label>
      <input type="text" id="userFullName" required>
      <label for="userRole">Role</label>
      <select id="userRole">
        <option value="staff">Staff</option>
        <option value="admin">Administrator</option>
      </select>
      <label for="userPassword" id="passwordLabel">Password</label>
      <input type="password" id="userPassword" placeholder="Leave blank to keep current password">
      <label class="checkbox-label"><input type="checkbox" id="userActive" checked> Active</label>
      <div id="userError" class="form-error" hidden></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal="userModal">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Account</button>
      </div>
    </form>
  </div>
</div>

<script src="assets/js/api.js"></script>
<script src="assets/js/format.js"></script>
<script src="assets/js/auth-guard.js"></script>
<script src="assets/js/users.js"></script>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
