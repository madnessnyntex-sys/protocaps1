// Admin-only page - guard against direct navigation by staff.
if (Api.getUser().role !== 'admin') {
  window.location.href = 'dashboard.php';
}

// Two ways to choose what to restore feed into the same confirmation modal:
// pendingRestoreFile (a local file, from drag/browse) or pendingRestoreFilename
// (a backup already sitting on the server, picked from the list). Only one
// is ever set at a time.
let pendingRestoreFile = null;
let pendingRestoreFilename = null;

function isValidBackupFilename(name) {
  const lower = name.toLowerCase();
  return lower.endsWith('.db') || lower.endsWith('.sql');
}

function openRestoreConfirm(displayName) {
  document.getElementById('restoreFileName').textContent = displayName;
  document.getElementById('restoreError').hidden = true;
  const btn = document.getElementById('confirmRestoreBtn');
  btn.disabled = false;
  btn.textContent = 'Yes, Restore This Backup';
  openModal('restoreConfirmModal');
}

function selectExistingBackupForRestore(filename, sizeBytes) {
  pendingRestoreFilename = filename;
  pendingRestoreFile = null;
  openRestoreConfirm(`${filename} (${formatBytes(sizeBytes)})`);
}

function handleFileSelected(file) {
  if (!isValidBackupFilename(file.name)) {
    alert('Please choose a .db or .sql backup file.');
    return;
  }
  pendingRestoreFile = file;
  pendingRestoreFilename = null;
  openRestoreConfirm(`${file.name} (${formatBytes(file.size)})`);
}

// ---------------------------------------------------------------- Backup list

async function loadBackups() {
  const errorBox = document.getElementById('backupError');
  errorBox.hidden = true;
  try {
    const backups = await Api.get('/backup');
    document.getElementById('backupsBody').innerHTML = backups.length
      ? backups.map(b => `
          <tr>
            <td>${b.filename}</td>
            <td>${formatBytes(b.size_bytes)}</td>
            <td>${formatDateTime(b.created_at)}</td>
            <td>
              <button class="btn-link" type="button" data-restore="${b.filename}" data-size="${b.size_bytes}">Restore</button>
              &nbsp;&middot;&nbsp;
              <button class="btn-link" type="button" data-download="${b.filename}">Download</button>
              &nbsp;&middot;&nbsp;
              <button class="btn-link" type="button" data-delete="${b.filename}">Delete</button>
            </td>
          </tr>
        `).join('')
      : '<tr><td colspan="4" class="empty-row">No backups yet. Click "Download Backup" above to make your first one.</td></tr>';

    document.querySelectorAll('[data-restore]').forEach(btn =>
      btn.addEventListener('click', () => selectExistingBackupForRestore(btn.dataset.restore, parseInt(btn.dataset.size, 10))));
    document.querySelectorAll('[data-download]').forEach(btn =>
      btn.addEventListener('click', () => downloadBackup(btn.dataset.download)));
    document.querySelectorAll('[data-delete]').forEach(btn =>
      btn.addEventListener('click', () => deleteBackup(btn.dataset.delete)));
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
}

document.getElementById('createBackupBtn').addEventListener('click', async function () {
  const errorBox = document.getElementById('backupError');
  errorBox.hidden = true;
  this.disabled = true;
  this.textContent = 'Preparing backup\u2026';
  try {
    const backup = await Api.post('/backup', {});
    await downloadBackup(backup.filename);
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  } finally {
    await loadBackups();
    this.disabled = false;
    this.textContent = 'Download Backup';
  }
});

async function downloadBackup(filename) {
  const errorBox = document.getElementById('backupError');
  try {
    const res = await fetch(`${Api.baseUrl}/backup/${encodeURIComponent(filename)}/download`, {
      headers: { Authorization: `Bearer ${Api.getToken()}` },
    });
    if (!res.ok) {
      let message = `Could not download this backup (${res.status}).`;
      try {
        const body = await res.json();
        if (body && body.error) message = body.error;
      } catch (e) { /* response wasn't JSON, keep the default message */ }
      throw new Error(message);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
}

async function deleteBackup(filename) {
  if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;
  const errorBox = document.getElementById('backupError');
  try {
    await Api.delete(`/backup/${encodeURIComponent(filename)}`);
    await loadBackups();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
}

// ---------------------------------------------------------------- Restore from a file

const dropZone = document.getElementById('restoreDropZone');

['dragenter', 'dragover'].forEach(eventName => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drop-zone-active');
  });
});

['dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drop-zone-active');
  });
});

dropZone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFileSelected(file);
});

dropZone.addEventListener('click', () => document.getElementById('restoreFileInput').click());

document.getElementById('restoreFileInput').addEventListener('change', (e) => {
  if (e.target.files[0]) handleFileSelected(e.target.files[0]);
  e.target.value = ''; // allow selecting the same file again later
});

// Safety net: if a file gets dropped just outside the zone, stop the browser
// from navigating away to display it instead of silently losing the drop.
['dragover', 'drop'].forEach(eventName => {
  document.addEventListener(eventName, (e) => e.preventDefault());
});

// ---------------------------------------------------------------- Shared confirm

document.getElementById('confirmRestoreBtn').addEventListener('click', async function () {
  if (!pendingRestoreFile && !pendingRestoreFilename) return;
  const errorBox = document.getElementById('restoreError');
  errorBox.hidden = true;
  this.disabled = true;
  this.textContent = 'Restoring\u2026';

  try {
    let res;
    if (pendingRestoreFile) {
      const formData = new FormData();
      formData.append('file', pendingRestoreFile);
      res = await fetch(`${Api.baseUrl}/backup/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${Api.getToken()}` },
        body: formData,
      });
    } else {
      res = await fetch(`${Api.baseUrl}/backup/${encodeURIComponent(pendingRestoreFilename)}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${Api.getToken()}` },
      });
    }

    let body;
    try { body = await res.json(); } catch (e) { body = null; }
    if (!res.ok) throw new Error((body && body.error) || `Restore failed (${res.status}).`);

    closeModal('restoreConfirmModal');
    pendingRestoreFile = null;
    pendingRestoreFilename = null;
    alert(
      `Restore complete. Your previous data was saved as "${body.safety_backup}" ` +
      `in the backup list, just in case. The page will reload now.`
    );
    window.location.reload();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
    this.disabled = false;
    this.textContent = 'Yes, Restore This Backup';
  }
});

loadBackups();
