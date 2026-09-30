<?php
$pageTitle = "Backup";
$activePage = "backup";
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>
<div class="main">
  <header class="topbar">
    <h1>Backup</h1>
    <div class="topbar-actions">
      <button class="btn btn-primary" id="createBackupBtn" type="button">Download Backup</button>
    </div>
  </header>
  <main class="content">
    <section class="panel" style="margin-bottom: 16px;">
      <p class="muted-note">
        One click saves a complete copy of your product catalog, stock history, and sales
        records straight to your computer's Downloads folder. Keep copies somewhere other
        than this computer too (a USB drive, cloud storage, email to yourself) so a hardware
        failure can't take your records with it. To bring old data back, click Restore next
        to any backup below, or drag in a file you saved earlier. Either way, a safety copy
        of your current data is made automatically first.
      </p>
    </section>

    <div id="backupError" class="form-error" hidden></div>

    <section class="panel">
      <table class="data-table">
        <thead><tr><th>File</th><th>Size</th><th>Created</th><th></th></tr></thead>
        <tbody id="backupsBody"><tr><td colspan="4" class="empty-row"><div class="spinner"></div></td></tr></tbody>
      </table>
    </section>

    <section class="panel" style="margin-top: 16px;">
      <h2>Restore from a File</h2>
      <p class="muted-note">
        For a backup you saved somewhere other than this list above (a USB
        drive, an email attachment, an older install) — drag it here, or
        click to browse.
      </p>
      <div class="drop-zone" id="restoreDropZone">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p class="drop-zone-title">Drag a backup file here</p>
        <p class="muted-note">or click to browse &middot; .db or .sql files</p>
      </div>
      <input type="file" id="restoreFileInput" accept=".db,.sql" hidden>
    </section>
  </main>
</div>

<div class="modal-overlay" id="restoreConfirmModal" hidden>
  <div class="modal">
    <h2>Restore from backup?</h2>
    <p id="restoreFileName" style="font-weight: 600; margin: 10px 0 4px;"></p>
    <p class="muted-note">
      This replaces everything currently in the system with the contents of
      this file. A safety copy of your current data will be saved
      automatically first, so this can be undone if it turns out to be the
      wrong file.
    </p>
    <div id="restoreError" class="form-error" hidden></div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" data-close-modal="restoreConfirmModal">Cancel</button>
      <button type="button" class="btn btn-danger" id="confirmRestoreBtn">Yes, Restore This Backup</button>
    </div>
  </div>
</div>

<script src="assets/js/api.js"></script>
<script src="assets/js/format.js"></script>
<script src="assets/js/auth-guard.js"></script>
<script src="assets/js/backup.js"></script>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
