const Api = {
  baseUrl: typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5000/api',

  getToken() {
    return localStorage.getItem('fp_token');
  },

  setSession(token, user) {
    localStorage.setItem('fp_token', token);
    localStorage.setItem('fp_user', JSON.stringify(user));
  },

  getUser() {
    const raw = localStorage.getItem('fp_user');
    return raw ? JSON.parse(raw) : null;
  },

  clearSession() {
    localStorage.removeItem('fp_token');
    localStorage.removeItem('fp_user');
  },

  async request(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(this.baseUrl + path, Object.assign({}, options, { headers }));
    } catch (networkErr) {
      throw new Error('Could not reach the server. Is the Flask backend running?');
    }

    let body;
    try {
      body = await res.json();
    } catch (e) {
      body = null;
    }

    // Only force a re-login when we HAD a session and it was rejected
    // (expired/invalid token) -- not when this is simply a failed login
    // attempt, which also returns 401 but with no token to begin with.
    if (res.status === 401 && token) {
      this.clearSession();
      window.location.href = 'login.php';
      return Promise.reject(new Error('Session expired'));
    }

    if (!res.ok) {
      const message = (body && body.error) || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return body;
  },

  get(path) { return this.request(path, { method: 'GET' }); },
  post(path, data) { return this.request(path, { method: 'POST', body: JSON.stringify(data) }); },
  put(path, data) { return this.request(path, { method: 'PUT', body: JSON.stringify(data) }); },
  patch(path, data) { return this.request(path, { method: 'PATCH', body: JSON.stringify(data) }); },
  delete(path) { return this.request(path, { method: 'DELETE' }); },
};
