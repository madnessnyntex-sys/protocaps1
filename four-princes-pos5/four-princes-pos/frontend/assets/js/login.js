// If already logged in, skip straight to the dashboard.
if (Api.getToken()) {
  window.location.href = 'dashboard.php';
}

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const errorBox = document.getElementById('loginError');
  errorBox.hidden = true;

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const result = await Api.post('/auth/login', { username, password });
    Api.setSession(result.token, result.user);
    window.location.href = 'dashboard.php';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
    submitBtn.disabled = false;
  }
});
