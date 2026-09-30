function peso(amount) {
  return '\u20B1' + Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const STATUS_LABELS = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' };
const STATUS_CLASS = { in_stock: 'badge-success', low_stock: 'badge-warning', out_of_stock: 'badge-danger' };

function statusBadge(status) {
  return `<span class="badge ${STATUS_CLASS[status]}">${STATUS_LABELS[status]}</span>`;
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = false;
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}

function closeAnyOpenModal() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    if (!overlay.hidden) overlay.hidden = true;
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // Explicit Cancel / Close / X buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  // Clicking the dark backdrop (outside the white card) also closes it
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.hidden = true;
    });
  });
});

// The Escape key always closes whichever modal is currently open
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeAnyOpenModal();
});
