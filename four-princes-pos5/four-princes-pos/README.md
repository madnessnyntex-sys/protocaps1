# Four Princes — Popularity and Stock Tracker

A web-based POS and inventory system for **Four Princes**, a dry goods clothing
shop in Rizal Street, Barangay Sabang I, Allen, Northern Samar. Built to match
the architecture in the defense script: **Flask (Python) + MySQL** on the
backend, **PHP/HTML/CSS/JavaScript** on the frontend, following the Agile
methodology's four phases (Planning → Design → Development → Testing/Review).

Every sale automatically updates stock, and the system ranks products from
most to least popular based on what's actually being sold — not assumption.

---

## 1. Architecture

Three tiers, matching the system architecture diagram in the manuscript:

| Tier | Technology | Folder |
|---|---|---|
| Presentation | PHP, HTML, CSS, JavaScript | `frontend/` |
| Application | Flask REST API | `backend/` |
| Data | MySQL | `backend/schema.sql` |

The Flask backend is split into **six blueprints**, matching the six
functional modules from the process model:

```
backend/blueprints/
├── auth.py         FR: authentication, authorization, staff accounts
├── products.py     FR: category & product management
├── stock.py        FR: real-time stock monitoring, movement history
├── sales.py        FR: sales recording, stock validation/deduction
├── popularity.py   FR: best-sellers, slow-movers, restock-priority, dead stock
└── dashboard.py     FR: KPI/reporting dashboard
```

The database has exactly the **six tables** from the data dictionary:
`users`, `categories`, `products`, `stock_movements`, `sales`, `sale_items`.

Technology choices match the manuscript's stated rationale: Flask (lightweight,
simple), Flask-SQLAlchemy (models → schema), MySQL (reliable, open-source),
PyJWT (stateless, signed identity+role token per request), Werkzeug (salted
password hashing, not plaintext), Flask-CORS (controls which frontend origins
may call the API).

---

## 2. Project structure

```
four-princes-pos/
├── .vscode/                  Editor config (extensions, debugger, task)
├── backend/
│   ├── app.py                 Flask app factory, registers all blueprints
│   ├── config.py               Reads DB URL / secret key from environment
│   ├── extensions.py            db + cors singletons
│   ├── models.py                 The 6 SQLAlchemy models
│   ├── auth_utils.py              JWT + role-based access decorators
│   ├── seed.py                    Demo data: 2 accounts, 5 categories, 16 products
│   ├── schema.sql                  Hand-written MySQL equivalent of models.py
│   ├── requirements.txt
│   ├── .env.example
│   └── blueprints/                 The 6 blueprints listed above
└── frontend/
    ├── config.php              API_BASE_URL, shop name/address
    ├── login.php / dashboard.php / products.php / stock.php /
    │   sales.php / popularity.php / users.php
    ├── includes/                header.php, sidebar.php, footer.php
    └── assets/
        ├── css/style.css         Design system (navy/gold)
        └── js/                    api.js, format.js, auth-guard.js,
                                     + one file per page
```

---

## 3. Quick start in VS Code

This gets you a running system in a few minutes using the built-in SQLite
fallback — no MySQL install required yet. Open the `four-princes-pos` folder
in VS Code (`File → Open Folder…`). VS Code will prompt you to install the
recommended extensions (Python, PHP Intelephense) — accept that prompt.

**Terminal 1 — backend.** Open a terminal (`` Ctrl+` ``) and run:

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python seed.py          # creates the database + demo accounts/catalog
python app.py            # starts the API on http://localhost:5000
```

Then, in VS Code's status bar, click the Python interpreter selector and
choose the one inside `backend/venv` — this makes the `Flask: Four Princes
API` entry in the Run and Debug panel (F5) work too, if you want breakpoints.

**Terminal 2 — frontend.** Split the terminal (the split-icon in the terminal
panel, or `` Ctrl+Shift+5 ``) and run:

```bash
cd frontend
php -S localhost:8000
```

(Or: Command Palette → **Tasks: Run Task** → **Run PHP Frontend Server**,
which does the same thing.)

**Open the app:** go to `http://localhost:8000/login.php` in your browser.

```
Admin  → username: admin  / password: admin123
Staff  → username: staff  / password: staff123
```

Change both passwords after your first login (topbar → your account, or via
Manage Staff as admin).

---

## 4. Switching to MySQL

The steps above use a local SQLite file so you can see the whole system
running immediately. To match the thesis's documented database (MySQL), and
before your final deployment/defense:

1. Get a MySQL server running. Easiest on Windows: install
   [XAMPP](https://www.apachefriends.org/) and start **MySQL** from the XAMPP
   Control Panel (you don't need to start Apache — the PHP built-in server
   above handles that).
2. In `backend/`, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` — the default already matches a stock XAMPP install
   (`root` user, no password):
   ```
   DATABASE_URL=mysql+pymysql://root:@localhost/four_princes_pos
   ```
4. Create the empty database once (via phpMyAdmin, or the MySQL CLI):
   ```sql
   CREATE DATABASE four_princes_pos;
   ```
5. Re-run `python seed.py` — it will now create all 6 tables in MySQL and
   load the demo data there instead of SQLite.

> **Note:** MySQL 8's default authentication method needs Python's
> `cryptography` package, which is already listed in `requirements.txt`
> (added after testing this exact setup against a real MySQL 8 server —
> without it you'd hit a `RuntimeError` about `caching_sha2_password` on
> your very first request). If you installed dependencies before reading
> this, just run `pip install -r requirements.txt` again.

`backend/schema.sql` is the hand-written SQL equivalent of `models.py`,
included for your data dictionary documentation — you don't need to run it
by hand unless you want to create the schema without seeding demo data.

---

## 5. Default accounts & security notes

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Administrator |
| `staff` | `staff123` | Staff |

- **Change both before real use.** These exist so the panel/your adviser can
  log in immediately; leaving them in place on a real deployment is a
  security risk.
- `SECRET_KEY` in `.env` signs login tokens — set it to a long random value
  before deploying anywhere reachable outside your own machine.
- `CORS_ORIGINS=*` is fine for a single-shop LAN setup but should be
  tightened to the frontend's exact address for a public deployment.

---

## 6. Feature walkthrough

**Authentication & roles.** JWT-based login (8-hour session). Two roles:
Administrator and Staff.

**Products & Categories** (`products.php`). Add/edit products with size,
color, price, cost, and reorder level, organized into categories. Both roles
can add and edit; deactivating a product or category is admin-only so a
day-to-day catalog entry mistake by staff can't quietly remove a line
item — deactivated items keep their sales history intact, they just drop out
of the active catalog and POS.

**Stock** (`stock.php`). Every product's status is computed live:
🟢 **in stock** (above reorder level) · 🟡 **low stock** (at or below reorder
level) · 🔴 **out of stock** (zero). Manual adjustments (restock or
correction) are logged with a signed quantity, the resulting stock level, who
made it, and an optional note — full history is one click away per product.

**Sales / POS** (`sales.php`). Click products into a cart, adjust quantities,
apply a flat discount, choose cash or digital payment (cash shows live
change calculation), and complete the sale. The backend re-validates stock
server-side at checkout — even if two people are ringing up the same item at
once — and rejects the sale with a clear message if there isn't enough left,
rather than allowing stock to go negative. A printable receipt appears after
each sale.

The same page has a **History** tab (toggle at the top) for looking back at
past transactions: filter by date range or jump straight to today, click any
row to reopen its full receipt, and print it again if needed. Admins get a
**Void** button on that receipt view, which reverses the sale and restores
the stock it deducted — staff can browse history but can't void, matching
the same admin-only rule as everywhere else destructive. The dashboard's
"Recent Sales" panel links straight into this tab.

**Popularity** (`popularity.php`) — the thesis's core differentiator over a
plain inventory system. For a selectable period (7/30/90 days):
- **Best sellers** — ranked by quantity actually sold, not assumption
- **Slow movers** — selling, but well below the median
- **Restock priority** — popular items that are simultaneously low/out of
  stock, i.e. the ones actually worth reordering first
- **Dead stock** — active items with no sales at all in the last 30 days
  (configurable via the `dead_stock_days` query param)

**Dashboard** (`dashboard.php`). Today's and this week's revenue, low/out-of-
stock counts, top 5 products this week, and the last 10 transactions.
Refreshes automatically every 30 seconds.

**Manage Staff** (`users.php`, admin only). Create staff/admin accounts,
change roles, deactivate accounts, reset passwords.

**Backup** (`backup.php`, admin only). One click creates a complete,
downloadable copy of your data — a file copy for SQLite, a real `mysqldump`
for MySQL. Keep copies somewhere other than this computer (USB drive, cloud
storage, email to yourself) so a hardware failure can't take your sales
records with it.

To bring data back, either click **Restore** next to any backup already
listed on the page, or drag a file you saved elsewhere onto the drop zone
further down (for a backup from a USB drive, an email attachment, or an
older install). Restoring **replaces everything currently in the system**
with the contents of that backup, so every restore — either way —
automatically creates its own safety backup of whatever was live *right
before* the change; if the wrong one gets picked, the previous state is one
more restore away, not gone. Files are validated before anything is touched
(correct extension for your database type, and for SQLite, a real SQLite
file header) and both paths require an explicit confirmation click.

---

## 7. Permissions

| Action | Staff | Admin |
|---|:---:|:---:|
| Ring up sales | ✅ | ✅ |
| View dashboard, stock, popularity | ✅ | ✅ |
| Add / edit products & categories | ✅ | ✅ |
| Adjust stock (restock / correction) | ✅ | ✅ |
| **Deactivate** a product or category | ❌ | ✅ |
| **Void** a completed sale | ❌ | ✅ |
| Edit an existing category's name | ❌ | ✅ |
| Create / manage staff accounts | ❌ | ✅ |
| Create, download, or delete backups | ❌ | ✅ |

The reasoning: day-to-day catalog and stock work shouldn't need an admin
standing over every shift, but *reversing* something already committed
(deleting a line item, voiding a sale, changing who has access) is gated so
one action requires deliberate admin sign-off. Every stock change is still
attributed to whoever made it either way, via `stock_movements.created_by`.

---

## 8. API reference

All routes below are prefixed with `/api` and (except login) require
`Authorization: Bearer <token>`.

| Method | Route | Notes |
|---|---|---|
| POST | `/auth/login` | Returns `{ token, user }` |
| GET | `/auth/me` | Current user |
| PATCH | `/auth/me/password` | Self-service password change |
| GET/POST | `/auth/users` | Admin only |
| PATCH | `/auth/users/<id>` | Admin only |
| GET/POST | `/categories` | POST allowed for staff+admin |
| PUT/DELETE | `/categories/<id>` | Admin only |
| GET/POST | `/products` | `?search=&category_id=&status=&active=` |
| PUT/DELETE | `/products/<id>` | DELETE (deactivate) is admin only |
| GET | `/stock` | Live levels + computed status |
| GET | `/stock/alerts` | Low/out-of-stock summary |
| POST | `/stock/adjust` | `{ product_id, quantity_change, movement_type, notes }` |
| GET | `/stock/movements` | `?product_id=` |
| POST | `/sales` | `{ items[], payment_method, discount, amount_tendered }` |
| GET | `/sales` | `?start=YYYY-MM-DD&end=YYYY-MM-DD` |
| GET | `/sales/<id>` | Full receipt detail |
| POST | `/sales/<id>/void` | Admin only, restores stock |
| GET | `/popularity` | `?days=` or `?start=&end=`, `?dead_stock_days=` |
| GET | `/dashboard/summary` | KPI payload for the dashboard |
| GET | `/backup` | Admin only, lists existing backups |
| POST | `/backup` | Admin only, creates a new backup (SQLite copy or `mysqldump`) |
| GET | `/backup/<filename>/download` | Admin only |
| DELETE | `/backup/<filename>` | Admin only |
| POST | `/backup/restore` | Admin only, multipart file upload (`.db` or `.sql`); always creates a safety backup first |
| POST | `/backup/<filename>/restore` | Admin only, restores from a backup already on the server; same safety-backup-first guarantee |

---

## 9. Out of scope (by design)

Matching the manuscript's stated scope and limitations, this is a **single-
shop**, browser-based internal tool. It deliberately does **not** include:
barcode/QR scanning hardware, an online storefront or customer-facing
checkout, or multi-branch support.

---

## 10. Troubleshooting

- **"Could not reach the server" on login** — the Flask backend isn't
  running, or `API_BASE_URL` in `frontend/config.php` doesn't match where
  it's actually running.
- **CORS error in the browser console** — confirm Flask is running and
  `CORS_ORIGINS` in `.env` includes your frontend's origin (`*` covers any
  origin, which is fine for local/LAN use).
- **`ModuleNotFoundError` when running `app.py`** — the virtual environment
  isn't activated, or `pip install -r requirements.txt` hasn't been run
  inside it.
- **MySQL connection refused** — MySQL isn't running (start it from the
  XAMPP Control Panel), or `DATABASE_URL` in `.env` has the wrong
  host/user/password.
- **"mysqldump was not found" when creating a backup** — MySQL's `bin`
  folder isn't on your system PATH. For XAMPP, add `C:\xampp\mysql\bin`
  the same way you added PHP's folder in section 3, then restart the
  backend.

## 11. Suggestions for future work

A few natural next steps beyond the current scope, worth a mention in your
recommendations chapter: switching monetary calculations from `float` to
Python's `Decimal` type for stricter rounding guarantees at scale; adding
barcode scanner support (a scanner that types + Enter would work with the
POS search box with no backend changes); and a low-stock email/SMS alert for
the owner instead of requiring someone to check the dashboard.
