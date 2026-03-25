import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(buildAdminHTML());
});

function buildAdminHTML(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Panel — PresupuestosPro</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f1a;color:#e0e0e0;min-height:100vh}
a{color:#C9952A}
input,select,textarea{background:#1e1e30;border:1px solid #333;color:#e0e0e0;padding:8px 12px;border-radius:6px;width:100%;font-size:14px;outline:none}
input:focus,select:focus{border-color:#C9952A}
button{cursor:pointer;border:none;border-radius:6px;padding:8px 16px;font-size:14px;font-weight:600;transition:opacity .15s}
button:hover{opacity:.85}
.btn-gold{background:#C9952A;color:#1a1a2e}
.btn-ghost{background:transparent;border:1px solid #444;color:#aaa}
.btn-ghost:hover{border-color:#C9952A;color:#C9952A}
.btn-danger{background:#c0392b;color:#fff}
.btn-sm{padding:4px 10px;font-size:12px}
/* Login */
#login-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh}
.login-box{background:#1a1a2e;border:1px solid #2a2a40;border-radius:12px;padding:40px;width:100%;max-width:380px}
.login-box h1{font-size:22px;color:#C9952A;margin-bottom:6px}
.login-box p{color:#888;font-size:13px;margin-bottom:24px}
/* Layout */
#app{display:none;min-height:100vh}
.topbar{background:#1a1a2e;border-bottom:1px solid #2a2a40;padding:12px 24px;display:flex;align-items:center;justify-content:space-between}
.topbar-brand{font-size:18px;font-weight:800;color:#C9952A;letter-spacing:.5px}
.topbar-user{font-size:12px;color:#666}
.layout{display:flex;min-height:calc(100vh - 49px)}
.sidebar{width:200px;background:#131320;border-right:1px solid #1e1e30;padding:16px 0;flex-shrink:0}
.nav-item{display:block;padding:10px 20px;color:#888;font-size:14px;cursor:pointer;border-left:3px solid transparent;transition:all .15s}
.nav-item:hover{color:#e0e0e0;background:#1a1a2e}
.nav-item.active{color:#C9952A;border-left-color:#C9952A;background:#1a1a2e}
.content{flex:1;padding:24px;overflow-y:auto}
/* Cards */
.card{background:#1a1a2e;border:1px solid #2a2a40;border-radius:10px;padding:20px;margin-bottom:20px}
.card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.card-title{font-size:15px;font-weight:700;color:#C9952A}
/* Tables */
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:8px 12px;color:#888;border-bottom:1px solid #2a2a40;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
td{padding:10px 12px;border-bottom:1px solid #1e1e30;vertical-align:top}
tr:last-child td{border-bottom:none}
tr:hover td{background:#1e1e2a}
/* Form */
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.form-row.one{grid-template-columns:1fr}
.form-group label{display:block;font-size:12px;color:#888;margin-bottom:4px;font-weight:600;letter-spacing:.3px}
/* Badge */
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600}
.badge-green{background:#1a3a1a;color:#4caf50}
.badge-red{background:#3a1a1a;color:#f44336}
.badge-yellow{background:#3a2a00;color:#ff9800}
/* Tabs */
.page{display:none}
.page.active{display:block}
/* Copy btn */
.copy-key{font-family:monospace;font-size:12px;background:#131320;padding:3px 8px;border-radius:4px;cursor:pointer;border:1px solid #333;color:#C9952A;display:inline-block}
.copy-key:hover{border-color:#C9952A}
/* Modal */
.modal-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;align-items:center;justify-content:center}
.modal-backdrop.open{display:flex}
.modal-box{background:#1a1a2e;border:1px solid #2a2a40;border-radius:12px;padding:24px;width:100%;max-width:460px}
.modal-box h3{font-size:16px;font-weight:700;margin-bottom:20px;color:#C9952A}
.modal-footer{display:flex;gap:8px;justify-content:flex-end;margin-top:20px}
/* Machines table inside */
.machines-wrap{background:#131320;border-radius:6px;padding:12px;margin-top:8px}
.machines-wrap table th{color:#666}
/* Toast */
.toast-wrap{position:fixed;bottom:24px;right:24px;display:flex;flex-direction:column;gap:8px;z-index:999}
.toast{padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;animation:slideIn .2s ease}
.toast-ok{background:#1a3a1a;color:#4caf50;border:1px solid #2a5a2a}
.toast-err{background:#3a1a1a;color:#f44336;border:1px solid #5a2a2a}
@keyframes slideIn{from{transform:translateX(60px);opacity:0}to{transform:none;opacity:1}}
.text-dim{color:#666;font-size:12px}
.mt8{margin-top:8px}
.gap8{gap:8px}
.flex{display:flex;align-items:center}
</style>
</head>
<body>

<!-- LOGIN -->
<div id="login-wrap">
  <div class="login-box">
    <h1>Admin Panel</h1>
    <p>PresupuestosPro — Gestión de Licencias</p>
    <div class="form-group" style="margin-bottom:12px">
      <label>Admin Key</label>
      <input id="key-input" type="password" placeholder="Ingresá tu Admin Key" onkeydown="if(event.key==='Enter')doLogin()">
    </div>
    <button class="btn-gold" style="width:100%" onclick="doLogin()">Ingresar</button>
    <div id="login-err" style="color:#f44336;font-size:12px;margin-top:8px;display:none"></div>
  </div>
</div>

<!-- APP -->
<div id="app">
  <div class="topbar">
    <div class="topbar-brand">⚡ PresupuestosPro Admin</div>
    <div class="flex gap8">
      <span class="topbar-user" id="app-url-display"></span>
      <button class="btn-ghost btn-sm" onclick="doLogout()">Salir</button>
    </div>
  </div>
  <div class="layout">
    <div class="sidebar">
      <div class="nav-item active" onclick="showPage('clientes',this)">👤 Clientes</div>
      <div class="nav-item" onclick="showPage('licencias',this)">🔑 Licencias</div>
    </div>
    <div class="content">

      <!-- CLIENTES -->
      <div id="page-clientes" class="page active">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Clientes</span>
            <button class="btn-gold btn-sm" onclick="openModal('modal-cliente')">+ Nuevo Cliente</button>
          </div>
          <table id="tbl-clientes">
            <thead><tr><th>Nombre</th><th>Email</th><th>Empresa</th><th>ID</th><th>Alta</th><th></th></tr></thead>
            <tbody><tr><td colspan="6" class="text-dim">Cargando...</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- LICENCIAS -->
      <div id="page-licencias" class="page">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Licencias</span>
            <button class="btn-gold btn-sm" onclick="openModal('modal-licencia')">+ Nueva Licencia</button>
          </div>
          <table id="tbl-licencias">
            <thead><tr><th>Cliente</th><th>License Key</th><th>Expira</th><th>Dispositivos</th><th>Estado</th><th></th></tr></thead>
            <tbody><tr><td colspan="6" class="text-dim">Cargando...</td></tr></tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- MODAL CREAR CLIENTE -->
<div class="modal-backdrop" id="modal-cliente">
  <div class="modal-box">
    <h3>Nuevo Cliente</h3>
    <div class="form-row">
      <div class="form-group"><label>Nombre *</label><input id="c-name" placeholder="Nombre completo"></div>
      <div class="form-group"><label>Email *</label><input id="c-email" type="email" placeholder="email@ejemplo.com"></div>
    </div>
    <div class="form-row one">
      <div class="form-group"><label>Empresa</label><input id="c-company" placeholder="Nombre de la empresa (opcional)"></div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modal-cliente')">Cancelar</button>
      <button class="btn-gold" onclick="createCustomer()">Crear Cliente</button>
    </div>
  </div>
</div>

<!-- MODAL CREAR LICENCIA -->
<div class="modal-backdrop" id="modal-licencia">
  <div class="modal-box">
    <h3>Nueva Licencia</h3>
    <div class="form-row one">
      <div class="form-group"><label>Cliente *</label>
        <select id="l-customer"><option value="">Seleccioná un cliente...</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Días de validez</label><input id="l-days" type="number" value="365" min="1"></div>
      <div class="form-group"><label>Dispositivos máximos</label><input id="l-devices" type="number" value="1" min="1"></div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modal-licencia')">Cancelar</button>
      <button class="btn-gold" onclick="createLicense()">Crear Licencia</button>
    </div>
  </div>
</div>

<!-- MODAL DISPOSITIVOS -->
<div class="modal-backdrop" id="modal-devices">
  <div class="modal-box" style="max-width:520px">
    <h3 id="modal-devices-title">Dispositivos</h3>
    <div id="modal-devices-body"></div>
    <div class="form-row" style="margin-top:16px">
      <div class="form-group"><label>Max dispositivos</label><input id="dev-max" type="number" min="1"></div>
      <div class="form-group" style="display:flex;align-items:flex-end">
        <button class="btn-gold" style="width:100%" onclick="updateMaxDevices()">Actualizar</button>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Extender licencia (días desde hoy)</label><input id="dev-renew-days" type="number" min="1" value="365" placeholder="Ej: 365"></div>
      <div class="form-group" style="display:flex;align-items:flex-end">
        <button class="btn-ghost" style="width:100%;border-color:#C9952A;color:#C9952A" onclick="renewLicense()">Renovar</button>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modal-devices')">Cerrar</button>
      <button class="btn-danger btn-sm" onclick="revokeLicense()" style="margin-right:auto">Revocar Licencia</button>
    </div>
  </div>
</div>

<!-- TOAST -->
<div class="toast-wrap" id="toast-wrap"></div>

<script>
let ADMIN_KEY = '';
let currentLicenseKey = '';
let currentMaxDevices = 1;

// ─── AUTH ────────────────────────────────────────────────────────────────────
async function doLogin() {
  const key = document.getElementById('key-input').value.trim();
  if (!key) return;
  const err = document.getElementById('login-err');
  err.style.display = 'none';
  try {
    const r = await apiFetch('/api/customers', {}, key);
    if (!r.ok) throw new Error('Key inválida');
    ADMIN_KEY = key;
    sessionStorage.setItem('adminKey', key);
    document.getElementById('login-wrap').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    loadAll();
  } catch(e) {
    err.textContent = 'Admin Key incorrecta.';
    err.style.display = 'block';
  }
}

function doLogout() {
  ADMIN_KEY = '';
  sessionStorage.removeItem('adminKey');
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-wrap').style.display = 'flex';
  document.getElementById('key-input').value = '';
}

// Auto-login si hay key guardada
window.addEventListener('load', () => {
  const saved = sessionStorage.getItem('adminKey');
  if (saved) {
    document.getElementById('key-input').value = saved;
    doLogin();
  }
});

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
function showPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  el.classList.add('active');
  if (name === 'licencias') loadLicencias();
  if (name === 'clientes') loadClientes();
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}, key = null) {
  const k = key || ADMIN_KEY;
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k },
    ...opts,
  });
  return res;
}

async function apiJSON(path, opts = {}) {
  const r = await apiFetch(path, opts);
  return r.json();
}

// ─── LOAD ALL ─────────────────────────────────────────────────────────────────
function loadAll() {
  loadClientes();
}

// ─── CLIENTES ────────────────────────────────────────────────────────────────
async function loadClientes() {
  const data = await apiJSON('/api/customers');
  const tbody = document.querySelector('#tbl-clientes tbody');
  if (!data.customers?.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-dim">Sin clientes aún.</td></tr>';
    return;
  }
  tbody.innerHTML = data.customers.map(c => \`
    <tr>
      <td><strong>\${esc(c.name)}</strong></td>
      <td>\${esc(c.email)}</td>
      <td>\${esc(c.company || '—')}</td>
      <td><span class="text-dim" style="font-size:11px;font-family:monospace">\${c.id.slice(0,8)}...</span></td>
      <td class="text-dim">\${fmtDate(c.created_at)}</td>
      <td>
        <button class="btn-ghost btn-sm" onclick="filterLicensesByCustomer('\${esc(c.id)}','\${esc(c.name)}')">Ver licencias</button>
      </td>
    </tr>
  \`).join('');

  // Actualizar selector de licencias
  const sel = document.getElementById('l-customer');
  sel.innerHTML = '<option value="">Seleccioná un cliente...</option>' +
    data.customers.map(c => \`<option value="\${esc(c.id)}">\${esc(c.name)} \${c.company ? '('+esc(c.company)+')' : ''}</option>\`).join('');
}

async function createCustomer() {
  const name = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const company = document.getElementById('c-company').value.trim();
  if (!name || !email) return toast('Nombre y email son obligatorios', 'err');
  const data = await apiJSON('/api/customer/create', {
    method: 'POST',
    body: JSON.stringify({ name, email, company: company || undefined }),
  });
  if (!data.ok) return toast(data.error || 'Error al crear cliente', 'err');
  toast('Cliente creado', 'ok');
  closeModal('modal-cliente');
  document.getElementById('c-name').value = '';
  document.getElementById('c-email').value = '';
  document.getElementById('c-company').value = '';
  loadClientes();
}

// ─── LICENCIAS ───────────────────────────────────────────────────────────────
let _filterCustomerId = null;

async function loadLicencias() {
  const url = _filterCustomerId ? '/api/licenses?customerId=' + _filterCustomerId : '/api/licenses';
  const data = await apiJSON(url);
  const tbody = document.querySelector('#tbl-licencias tbody');
  if (!data.licenses?.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-dim">Sin licencias aún.</td></tr>';
    return;
  }
  tbody.innerHTML = data.licenses.map(l => {
    const expired = new Date(l.expires_at) < new Date();
    const active = l.is_active === 1 && !expired;
    const badge = active ? '<span class="badge badge-green">Activa</span>'
      : !l.is_active ? '<span class="badge badge-red">Revocada</span>'
      : '<span class="badge badge-yellow">Expirada</span>';
    return \`
      <tr>
        <td><strong>\${esc(l.customer_name)}</strong></td>
        <td>
          <span class="copy-key" onclick="copyKey('\${esc(l.license_key)}')" title="Click para copiar">\${esc(l.license_key)}</span>
        </td>
        <td>\${fmtDate(l.expires_at)}</td>
        <td>\${l.devices_count} / \${l.max_devices}</td>
        <td>\${badge}</td>
        <td>
          <button class="btn-ghost btn-sm" onclick="openDevices('\${esc(l.license_key)}','\${esc(l.customer_name)}',\${l.max_devices})">Dispositivos</button>
        </td>
      </tr>
    \`;
  }).join('');
}

async function createLicense() {
  const customerId = document.getElementById('l-customer').value;
  const days = parseInt(document.getElementById('l-days').value) || 365;
  const max_devices = parseInt(document.getElementById('l-devices').value) || 1;
  if (!customerId) return toast('Seleccioná un cliente', 'err');
  const data = await apiJSON('/api/license/create', {
    method: 'POST',
    body: JSON.stringify({ customerId, days, max_devices }),
  });
  if (!data.ok) return toast(data.error || 'Error al crear licencia', 'err');
  toast('Licencia creada — ' + data.license.licenseKey, 'ok');
  closeModal('modal-licencia');
  showPage('licencias', document.querySelectorAll('.nav-item')[1]);
}

function filterLicensesByCustomer(id, name) {
  _filterCustomerId = id;
  showPage('licencias', document.querySelectorAll('.nav-item')[1]);
  document.querySelector('#page-licencias .card-title').textContent = 'Licencias — ' + name;
  loadLicencias();
}

// ─── DISPOSITIVOS ─────────────────────────────────────────────────────────────
async function openDevices(licenseKey, customerName, maxDevices) {
  currentLicenseKey = licenseKey;
  currentMaxDevices = maxDevices;
  document.getElementById('modal-devices-title').textContent = 'Dispositivos — ' + customerName;
  document.getElementById('dev-max').value = maxDevices;
  await refreshDevices();
  openModal('modal-devices');
}

async function refreshDevices() {
  const body = document.getElementById('modal-devices-body');
  body.innerHTML = '<p class="text-dim">Cargando...</p>';
  const data = await apiJSON('/api/license/machines?licenseKey=' + encodeURIComponent(currentLicenseKey));
  if (!data.machines?.length) {
    body.innerHTML = '<p class="text-dim">Sin dispositivos registrados.</p>';
    return;
  }
  body.innerHTML = '<div class="machines-wrap"><table>' +
    '<thead><tr><th>Machine ID</th><th>Registrado</th><th></th></tr></thead><tbody>' +
    data.machines.map(m => \`
      <tr>
        <td style="font-family:monospace;font-size:12px">\${esc(m.machine_id)}</td>
        <td class="text-dim">\${fmtDate(m.created_at)}</td>
        <td><button class="btn-danger btn-sm" onclick="removeMachine('\${esc(m.machine_id)}')">Eliminar</button></td>
      </tr>
    \`).join('') +
    '</tbody></table></div>';
}

async function removeMachine(machineId) {
  if (!confirm('¿Eliminar dispositivo "' + machineId + '"?')) return;
  const data = await apiJSON('/api/license/remove-machine', {
    method: 'POST',
    body: JSON.stringify({ licenseKey: currentLicenseKey, machineId }),
  });
  if (!data.ok) return toast(data.error || 'Error', 'err');
  toast('Dispositivo eliminado', 'ok');
  refreshDevices();
  loadLicencias();
}

async function updateMaxDevices() {
  const max = parseInt(document.getElementById('dev-max').value);
  if (!max || max < 1) return toast('Ingresá un número válido', 'err');
  const data = await apiJSON('/api/license/update-max-devices', {
    method: 'POST',
    body: JSON.stringify({ licenseKey: currentLicenseKey, max_devices: max }),
  });
  if (!data.ok) return toast(data.error || 'Error', 'err');
  toast('Máximo de dispositivos actualizado', 'ok');
  loadLicencias();
}

async function renewLicense() {
  const days = parseInt(document.getElementById('dev-renew-days').value);
  if (!days || days < 1) return toast('Ingresá una cantidad de días válida', 'err');
  const data = await apiJSON('/api/license/renew', {
    method: 'POST',
    body: JSON.stringify({ licenseKey: currentLicenseKey, days }),
  });
  if (!data.ok) return toast(data.error || 'Error', 'err');
  toast('Licencia renovada hasta ' + fmtDate(data.expiresAt), 'ok');
  loadLicencias();
}

async function revokeLicense() {
  if (!confirm('¿Revocar esta licencia? El cliente no podrá iniciar sesión.')) return;
  const data = await apiJSON('/api/license/revoke', {
    method: 'POST',
    body: JSON.stringify({ licenseKey: currentLicenseKey }),
  });
  if (!data.ok) return toast(data.error || 'Error', 'err');
  toast('Licencia revocada', 'ok');
  closeModal('modal-devices');
  loadLicencias();
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
function copyKey(key) {
  navigator.clipboard.writeText(key).then(() => toast('Copiado: ' + key, 'ok'));
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Cerrar modal al click fuera
document.querySelectorAll('.modal-backdrop').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric' });
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toast(msg, type = 'ok') {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
</script>
</body>
</html>`;
}

export default router;
