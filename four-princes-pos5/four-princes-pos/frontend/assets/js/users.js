// This page is admin-only. auth-guard.js already hides the sidebar link for
// staff, but guard the page itself too in case someone navigates here directly.
if (Api.getUser().role !== 'admin') {
  window.location.href = 'dashboard.php';
}

let allUsers = [];
const loggedInUserId = Api.getUser().id;

async function loadUsers() {
  allUsers = await Api.get('/auth/users');
  document.getElementById('usersBody').innerHTML = allUsers.map(u => `
    <tr>
      <td>${u.username}</td>
      <td>${u.full_name}</td>
      <td>${u.role === 'admin' ? 'Administrator' : 'Staff'}</td>
      <td><span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">${u.is_active ? 'Active' : 'Disabled'}</span></td>
      <td><button class="btn-link" type="button" data-edit="${u.id}">Edit</button></td>
    </tr>
  `).join('');

  document.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEdit(btn.dataset.edit)));
}

function openEdit(id) {
  const u = allUsers.find(x => x.id == id);
  document.getElementById('userModalTitle').textContent = 'Edit Account';
  document.getElementById('userId').value = u.id;
  document.getElementById('userUsername').value = u.username;
  document.getElementById('userUsername').disabled = true;
  document.getElementById('userFullName').value = u.full_name;
  document.getElementById('userRole').value = u.role;
  document.getElementById('userPassword').value = '';
  document.getElementById('passwordLabel').textContent = 'New Password';
  document.getElementById('userActive').checked = u.is_active;
  document.getElementById('userActive').disabled = (u.id === loggedInUserId);
  document.getElementById('userError').hidden = true;
  openModal('userModal');
}

document.getElementById('openUserModalBtn').addEventListener('click', () => {
  document.getElementById('userForm').reset();
  document.getElementById('userModalTitle').textContent = 'New Account';
  document.getElementById('userId').value = '';
  document.getElementById('userUsername').disabled = false;
  document.getElementById('passwordLabel').textContent = 'Password';
  document.getElementById('userActive').checked = true;
  document.getElementById('userActive').disabled = false;
  document.getElementById('userError').hidden = true;
  openModal('userModal');
});

document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('userError');
  const id = document.getElementById('userId').value;
  const password = document.getElementById('userPassword').value;

  try {
    if (id) {
      const payload = {
        full_name: document.getElementById('userFullName').value.trim(),
        role: document.getElementById('userRole').value,
        is_active: document.getElementById('userActive').checked,
      };
      if (password) payload.password = password;
      await Api.patch(`/auth/users/${id}`, payload);
    } else {
      if (!password || password.length < 6) {
        errorBox.textContent = 'Password must be at least 6 characters.';
        errorBox.hidden = false;
        return;
      }
      await Api.post('/auth/users', {
        username: document.getElementById('userUsername').value.trim(),
        password,
        full_name: document.getElementById('userFullName').value.trim(),
        role: document.getElementById('userRole').value,
      });
    }
    closeModal('userModal');
    await loadUsers();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});

loadUsers();
