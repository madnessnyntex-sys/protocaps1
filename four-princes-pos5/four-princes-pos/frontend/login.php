<?php require_once __DIR__ . '/config.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Log in &middot; <?php echo SHOP_NAME; ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
<script>const API_BASE_URL = "<?php echo API_BASE_URL; ?>";</script>
</head>
<body class="login-body">
  <div class="login-card">
    <div class="login-brand">
      <span class="brand-mark brand-mark-lg">FP</span>
      <h1><?php echo SHOP_NAME; ?></h1>
      <p>Popularity &amp; Stock Tracker</p>
    </div>
    <form id="loginForm">
      <label for="username">Username</label>
      <input type="text" id="username" name="username" autocomplete="username" required autofocus>
      <label for="password">Password</label>
      <input type="password" id="password" name="password" autocomplete="current-password" required>
      <div id="loginError" class="form-error" hidden></div>
      <button type="submit" class="btn btn-primary btn-block" style="margin-top: 18px;">Log in</button>
    </form>
    <p class="login-hint">Default admin: <code>admin / admin123</code> &mdash; change this after your first login.</p>
  </div>
  <script src="assets/js/api.js"></script>
  <script src="assets/js/login.js"></script>
</body>
</html>
