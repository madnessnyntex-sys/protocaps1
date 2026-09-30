(function () {
  const token = Api.getToken();
  const user = Api.getUser();
  if (!token || !user) {
    window.location.href = 'login.php';
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (user.role !== 'admin') {
      document.querySelectorAll('[data-admin-only]').forEach(el => { el.style.display = 'none'; });
    }
    document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = user.full_name; });
    document.querySelectorAll('[data-user-role]').forEach(el => {
      el.textContent = user.role === 'admin' ? 'Administrator' : 'Staff';
    });
    document.querySelectorAll('[data-user-initial]').forEach(el => {
      el.textContent = user.full_name.charAt(0).toUpperCase();
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        Api.clearSession();
        window.location.href = 'login.php';
      });
    }
  });
})();
