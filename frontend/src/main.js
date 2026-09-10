/**
 * JN PALABRAS - APP.JS
 * Controlador principal: enrutador SPA, 6 dashboards, test de elegibilidad,
 * Kanban Drag & Drop, notificaciones, matching y toda la lógica de interfaz.
 */

import { DB } from './db.js';
import { getIcon } from './icons.js';

// ──────────────────────────────────────────────────────────────────
// ESTADO GLOBAL
// ──────────────────────────────────────────────────────────────────
const State = {
  currentUser: null,
  currentView: 'public',   // 'public' | 'login' | 'app'
  currentDashboard: null,
  currentSidebar: null,
  eligibilityStep: 0,
  eligibilityAnswers: {},
  dragging: null,
  notifOpen: false,
  selectedCandidato: null,
  modalOpen: null,
  cvActiveTab: 'edit',
  cvSelectedCandId: null,
  cvDraft: null,
};

// ──────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function timeAgo(dateStr) {
  const d = new Date(dateStr), now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)     return 'hace un momento';
  if (diff < 3600)   return `hace ${Math.floor(diff/60)} min`;
  if (diff < 86400)  return `hace ${Math.floor(diff/3600)} h`;
  return `hace ${Math.floor(diff/86400)} días`;
}

function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style:'currency', currency, maximumFractionDigits:0 }).format(amount);
}

function getInitials(name) {
  return name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase();
}

function getAvatarColor(name) {
  const colors = ['#0f172a','#1e293b','#334155','#475569','#064e3b','#1e3a5f','#4c1d95','#7c2d12'];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

function showToast(title, message, type = 'info', duration = 4000) {
  const container = $('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-icon">${getIcon(type)}</div><div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(16px)'; setTimeout(()=>toast.remove(), 400); }, duration);
}

function openModal(id) {
  const overlay = $(id);
  if (overlay) { overlay.classList.add('visible'); State.modalOpen = id; }
}

function closeModal(id) {
  const overlay = $(id);
  if (overlay) { overlay.classList.remove('visible'); State.modalOpen = null; }
}

// ──────────────────────────────────────────────────────────────────
// NAVEGACIÓN / ENRUTADOR
// ──────────────────────────────────────────────────────────────────
function showPublic() {
  $('public-site').style.display = 'block';
  $('app-shell').classList.remove('active');
  $('login-screen').classList.remove('active');
  document.body.className = '';
  State.currentView = 'public';
}

function showLogin() {
  $('public-site').style.display = 'none';
  $('app-shell').classList.remove('active');
  $('login-screen').classList.add('active');
  document.body.className = '';
  State.currentView = 'login';
}

function showApp() {
  $('public-site').style.display = 'none';
  $('login-screen').classList.remove('active');
  $('app-shell').classList.add('active');
  State.currentView = 'app';
  renderAppShell();
}

// ──────────────────────────────────────────────────────────────────
// AUTENTICACIÓN
// ──────────────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const correo = $('login-email').value.trim();
  const pass   = $('login-pass').value.trim();
  
  if (!correo || !pass) {
    showToast('Campos requeridos', 'Por favor ingresa tu correo y contraseña.', 'warning');
    return;
  }

  let user = await DB.findUsuario(correo, pass);
  
  if (user) {
    State.currentUser = user;
    State.currentSidebar = null;
    DB.setSession(user);
    showToast('Bienvenido/a', `Hola ${user.nombre.split(' ')[0]}! Has iniciado sesión como ${user.rol}.`, 'success');
    showApp();
  } else {
    showToast('Error de acceso', 'Correo o contraseña incorrectos.', 'error');
    $('login-email').style.borderColor = 'var(--danger)';
  }
}

function handleLogout() {
  State.currentUser = null;
  State.currentSidebar = null;
  DB.clearSession();
  showPublic();
  showToast('Sesión cerrada', 'Has cerrado sesión exitosamente.', 'info');
}

// ──────────────────────────────────────────────────────────────────
// APP SHELL RENDER
// ──────────────────────────────────────────────────────────────────
function renderAppShell() {
  const user = State.currentUser;
  if (!user) { showLogin(); return; }

  ensureNotifClickListener();

  // Configurar Tema Visual por Rol
  document.body.className = `theme-${user.rol.toLowerCase()}`;

  // Header
  const notifCount = DB.getNotifNoLeidas(user.id);
  $('app-header-content').innerHTML = `
    <div class="app-logo">
      <img src="/logo.png" alt="JN Palabras" class="app-logo-img" style="height:32px;width:32px;object-fit:contain;border-radius:50%;">
      <span class="app-logo-name">JN Palabras</span>
    </div>

    <div class="header-actions">
      <!-- Notificaciones -->
      <div class="relative">
        <button class="header-icon-btn" onclick="toggleNotifPanel()" id="notif-btn" aria-label="Notificaciones">
          ${getIcon('bell')}
          ${notifCount > 0 ? `<span class="notification-dot"></span>` : ''}
        </button>
        <div class="notif-panel" id="notif-panel">
          ${renderNotifPanel(user.id)}
        </div>
      </div>
      <!-- Usuario -->
      <div class="role-switcher" title="Usuario activo">
        <div class="role-avatar" style="background:${getAvatarColor(user.nombre)}">${getInitials(user.nombre)}</div>
        <div class="role-info">
          <div class="role-name">${user.nombre.split(' ').slice(0,2).join(' ')}</div>
          <div class="role-label" style="display:flex;align-items:center;gap:4px;">${getRolIcon(user.rol)} ${user.rol}</div>
        </div>
      </div>
      <button onclick="handleLogout()" class="btn btn-outline btn-sm">Salir</button>
    </div>
  `;

  // Sidebar + contenido
  renderSidebar(user.rol);
  renderDashboard(user.rol);
}

// Cerrar panel notif al hacer clic fuera — registrado una sola vez
let _notifClickListenerAdded = false;
function ensureNotifClickListener() {
  if (_notifClickListenerAdded) return;
  _notifClickListenerAdded = true;
  document.addEventListener('click', e => {
    const panel = $('notif-panel');
    const btn   = $('notif-btn');
    if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
      panel.classList.remove('open');
      State.notifOpen = false;
    }
  });
}

function getRolIcon(rol) {
  return getIcon(rol) || getIcon('Candidato');
}

function getRolColor(rol) {
  return { Admin:'var(--gold-600)',Asesor:'var(--info)',Profesor:'#8b5cf6',Candidato:'var(--success)',Empresa:'var(--slate-600)',Socio:'#ec4899' }[rol]||'var(--slate-600)';
}

// ──────────────────────────────────────────────────────────────────
// NOTIFICACIONES
// ──────────────────────────────────────────────────────────────────
function renderNotifPanel(userId) {
  const notifs = DB.getNotificaciones(userId);
  const tipoIcono = {
    Documento_Aprobado: getIcon('success'), 
    Documento_Rechazado: getIcon('error'), 
    Entrevista_Agendada: getIcon('calendar'),
    Visado_Aprobado: getIcon('passport'), 
    Nueva_Calificacion: getIcon('fileText'), 
    Nuevo_Candidato: getIcon('newTag'),
    Oferta_Nueva: getIcon('briefcase'), 
    Comision_Registrada: getIcon('coins'), 
    Alerta_Rendimiento: getIcon('warning'), 
    Sistema: getIcon('bell')
  };
  return `
    <div class="notif-header">
      <span class="notif-title">Notificaciones</span>
      <button onclick="marcarNotifLeidas('${userId}')" class="btn btn-sm btn-outline" style="padding:.25rem .5rem;font-size:.7rem;">Marcar leídas</button>
    </div>
    <div class="notif-list">
      ${notifs.length === 0
        ? `<div class="empty-state" style="padding:24px;"><div class="empty-icon">${getIcon('bellOff')}</div><div class="empty-desc">Sin notificaciones nuevas</div></div>`
        : notifs.map(n => `
          <div class="notif-item ${n.leida ? '' : 'unread'}">
            <div class="notif-item-icon">${tipoIcono[n.tipo] || getIcon('bell')}</div>
            <div>
              <div class="notif-item-title">${n.titulo}</div>
              <div class="notif-item-time">${timeAgo(n.fecha)}</div>
            </div>
          </div>
        `).join('')
      }
    </div>
    <div class="notif-footer">
      <button class="btn btn-sm btn-outline w-full" style="width:100%;">Ver todas</button>
    </div>
  `;
}

function toggleNotifPanel() {
  const panel = $('notif-panel');
  State.notifOpen = !State.notifOpen;
  panel.classList.toggle('open', State.notifOpen);
}

function marcarNotifLeidas(userId) {
  DB.marcarTodasLeidas(userId);
  $('notif-panel').innerHTML = renderNotifPanel(userId);
  renderAppShell(); // Actualiza el contador
  showToast('Notificaciones', 'Todas marcadas como leídas.', 'success');
}

// ──────────────────────────────────────────────────────────────────
// SIDEBAR
// ──────────────────────────────────────────────────────────────────
const SIDEBAR_MENUS = {
  Admin: [
    { id:'admin-overview',    icon: getIcon('fileText'), label:'Resumen General'     },
    { id:'admin-users',       icon: getIcon('Admin'),    label:'Gestión de Usuarios'  },
    { id:'admin-candidatos',  icon: getIcon('Candidato'),label:'Todos los Candidatos' },
    { id:'admin-cms',         icon: getIcon('fileText'), label:'CMS Web Pública'      },
    { id:'admin-comisiones',  icon: getIcon('coins'),    label:'Control Comisiones'   },
    { id:'admin-empresas',    icon: getIcon('Empresa'),  label:'Empresas / Clínicas'  },
  ],
  Asesor: [
    { id:'asesor-kanban',     icon: getIcon('Asesor'),   label:'Kanban Candidatos'   },
    { id:'asesor-expedientes',icon: getIcon('clipboard'),label:'Expedientes'         },
    { id:'asesor-cv-builder', icon: getIcon('fileText'), label:'Hojas de Vida (CV)'  },
    { id:'asesor-matching',   icon: getIcon('search'),   label:'Matching IA'         },
    { id:'asesor-notas',      icon: getIcon('clipboard'),label:'Notas de Seguimiento'},
  ],
  Profesor: [
    { id:'prof-grupos',    icon: getIcon('Profesor'),  label:'Mis Grupos'         },
    { id:'prof-califs',    icon: getIcon('fileText'),  label:'Calificaciones'       },
    { id:'prof-alertas',   icon: getIcon('warning'),   label:'Alertas Rendimiento'  },
    { id:'prof-materiales',icon: getIcon('fileText'),  label:'Materiales'          },
  ],
  Candidato: [
    { id:'cand-roadmap',   icon: getIcon('passport'),  label:'Mi Hoja de Ruta'    },
    { id:'cand-cv',        icon: getIcon('fileText'),  label:'Mi Hoja de Vida (CV)'},
    { id:'cand-documentos',icon: getIcon('clipboard'), label:'Mis Documentos'     },
    { id:'cand-aula',      icon: getIcon('Profesor'),  label:'Mi Aula Virtual'    },
    { id:'cand-ofertas',   icon: getIcon('briefcase'), label:'Ofertas y Entrevistas'},
  ],
  Empresa: [
    { id:'emp-candidatos', icon: getIcon('search'),    label:'Buscar Candidatos'   },
    { id:'emp-vacantes',   icon: getIcon('briefcase'), label:'Mis Vacantes'        },
    { id:'emp-entrevistas',icon: getIcon('calendar'),  label:'Entrevistas'         },
    { id:'emp-feedback',   icon: getIcon('success'),   label:'Feedback'            },
  ],
  Socio: [
    { id:'socio-registro',   icon: getIcon('Socio'),    label:'Registrar Candidato' },
    { id:'socio-referidos',  icon: getIcon('network'),  label:'Mis Referidos'       },
    { id:'socio-comisiones', icon: getIcon('coins'),    label:'Mis Comisiones'      },
    { id:'socio-toolkit',    icon: getIcon('briefcase'),label:'Caja de Herramientas'},
  ]
};

function renderSidebar(rol) {
  const items = SIDEBAR_MENUS[rol] || [];
  const firstItem = items[0]?.id;
  State.currentSidebar = State.currentSidebar || firstItem;

  $('sidebar-content').innerHTML = `
    <div class="sidebar-section">
      <div class="sidebar-label">${rol}</div>
      ${items.map(item => `
        <div class="sidebar-link ${State.currentSidebar === item.id ? 'active' : ''}"
             onclick="navigateTo('${item.id}')">
          <span class="sidebar-icon" style="display:inline-flex;align-items:center;">${item.icon}</span>
          ${item.label}
        </div>
      `).join('')}
    </div>
    <div style="margin-top:auto;padding:0 16px 16px;">
      <div class="divider-dark"></div>
      <div class="sidebar-link" onclick="showPublic()">
        <span class="sidebar-icon" style="display:inline-flex;align-items:center;">${getIcon('globe')}</span> Web Pública
      </div>
    </div>
  `;
}

function navigateTo(id) {
  State.currentSidebar = id;
  renderSidebar(State.currentUser.rol);
  renderDashboard(State.currentUser.rol, id);
}

// ──────────────────────────────────────────────────────────────────
// DASHBOARD ROUTER
// ──────────────────────────────────────────────────────────────────
function renderDashboard(rol, view = null) {
  const id = view || State.currentSidebar || SIDEBAR_MENUS[rol]?.[0]?.id;
  const container = $('main-content');
  if (!container) return;

  const renders = {
    // Admin
    'admin-overview':   renderAdminOverview,
    'admin-users':      renderAdminUsers,
    'admin-candidatos': renderAdminCandidatos,
    'admin-cms':        renderAdminCms,
    'admin-comisiones': renderAdminComisiones,
    'admin-empresas':   renderAdminEmpresas,
    // Asesor
    'asesor-kanban':      renderAsesorKanban,
    'asesor-expedientes': renderAsesorExpedientes,
    'asesor-cv-builder':  renderAsesorCVBuilder,
    'asesor-matching':    renderAsesorMatching,
    'asesor-notas':       renderAsesorNotas,
    // Profesor
    'prof-grupos':    renderProfGrupos,
    'prof-califs':    renderProfCalificaciones,
    'prof-alertas':   renderProfAlertas,
    'prof-materiales':renderProfMateriales,
    // Candidato
    'cand-roadmap':   renderCandRoadmap,
    'cand-cv':        renderCandCV,
    'cand-documentos':renderCandDocumentos,
    'cand-aula':      renderCandAula,
    'cand-ofertas':   renderCandOfertas,
    // Empresa
    'emp-candidatos': renderEmpCandidatos,
    'emp-vacantes':   renderEmpVacantes,
    'emp-entrevistas':renderEmpEntrevistas,
    'emp-feedback':   renderEmpFeedback,
    // Socio
    'socio-registro':   renderSocioRegistro,
    'socio-referidos':  renderSocioReferidos,
    'socio-comisiones': renderSocioComisiones,
    'socio-toolkit':    renderSocioToolkit,
  };

  const fn = renders[id];
  if (fn) {
    container.innerHTML = '<div class="animate-fadeInUp">' + fn() + '</div>';
    // Post-render hooks
    if (id === 'asesor-kanban') initKanban();
    if (id === 'emp-vacantes')  initVacanteForm();
    if (id === 'admin-users')   initUserForm();
  }
}

// ──────────────────────────────────────────────────────────────────
// ★ DASHBOARD 1: SUPER ADMINISTRADOR
// ──────────────────────────────────────────────────────────────────
function renderAdminOverview() {
  const kpis = DB.getKpis();
  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Panel de Administración</h1>
        <p class="page-subtitle">Vista ejecutiva en tiempo real — JN Palabras Heidelberg</p>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm">📊 Exportar</button>
        <button class="btn btn-primary btn-sm">+ Nuevo Usuario</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-4" style="gap:16px;">
      <div class="kpi-card kpi-gold animate-fadeInUp">
        <div class="kpi-icon">🩺</div>
        <div class="kpi-label">Total Candidatos</div>
        <div class="kpi-value">${kpis.total_candidatos}</div>
        <div class="kpi-change up">▲ ${kpis.nuevos_este_mes} este mes</div>
      </div>
      <div class="kpi-card kpi-success animate-fadeInUp delay-100">
        <div class="kpi-icon">✅</div>
        <div class="kpi-label">Tasa de Colocación</div>
        <div class="kpi-value">${kpis.tasa_colocacion}%</div>
        <div class="kpi-change up">▲ 3.2% vs mes anterior</div>
      </div>
      <div class="kpi-card kpi-info animate-fadeInUp delay-200">
        <div class="kpi-icon">💼</div>
        <div class="kpi-label">Vacantes Activas</div>
        <div class="kpi-value">${kpis.vacantes_activas}</div>
        <div class="kpi-change up">▲ 1 nueva esta semana</div>
      </div>
      <div class="kpi-card kpi-danger animate-fadeInUp delay-300">
        <div class="kpi-icon">💰</div>
        <div class="kpi-label">Ingresos Proyectados</div>
        <div class="kpi-value">${formatCurrency(kpis.ingresos_proyectados)}</div>
        <div class="kpi-change up">▲ Proyección Q3 2025</div>
      </div>
    </div>

    <!-- Segunda fila de KPIs -->
    <div class="grid grid-4" style="gap:16px;">
      <div class="kpi-card kpi-gold">
        <div class="kpi-icon">🏥</div>
        <div class="kpi-label">Hospitales Clientes</div>
        <div class="kpi-value">${kpis.empresas_clientes}</div>
        <div class="kpi-change up">▲ Alemania</div>
      </div>
      <div class="kpi-card kpi-success">
        <div class="kpi-icon">🛂</div>
        <div class="kpi-label">Colocados Exitosamente</div>
        <div class="kpi-value">${kpis.colocados}</div>
        <div class="kpi-change up">▲ Contratos firmados</div>
      </div>
      <div class="kpi-card kpi-info">
        <div class="kpi-icon">🤝</div>
        <div class="kpi-label">Socios de Captación</div>
        <div class="kpi-value">${DB.getSocios().length}</div>
        <div class="kpi-change up">Agencias activas</div>
      </div>
      <div class="kpi-card kpi-danger">
        <div class="kpi-icon">💳</div>
        <div class="kpi-label">Ingresos Cobrados</div>
        <div class="kpi-value">${formatCurrency(kpis.ingresos_cobrados)}</div>
        <div class="kpi-change up">▲ Comisiones pagadas</div>
      </div>
    </div>

    <!-- Pipeline por estado -->
    <div class="card">
      <div class="card-header">
        <h3 style="font-size:1rem;font-weight:700;color:var(--slate-900);">📌 Pipeline de Candidatos por Estado</h3>
      </div>
      <div class="card-body">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${DB.get().kanban_columns.map(col => {
            const count = DB.getCandidatosByEstado(col.id).length;
            return `
              <div style="flex:1;min-width:120px;text-align:center;padding:16px;background:var(--slate-50);border-radius:var(--radius-md);border:1px solid var(--slate-200);">
                <div style="font-size:1.5rem;font-weight:800;color:${col.color};">${count}</div>
                <div style="font-size:.75rem;font-weight:600;color:var(--slate-600);margin-top:4px;">${col.icon} ${col.label}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Últimas actividades -->
    <div class="grid grid-2">
      <div class="card">
        <div class="card-header"><h3 style="font-size:1rem;font-weight:700;">🕐 Actividad Reciente</h3></div>
        <div class="card-body" style="padding:0;">
          ${DB.getNotificaciones('u-admin-001').slice(0,5).map(n => `
            <div class="notif-item" style="border-bottom:1px solid var(--slate-50);">
              <div class="notif-item-icon">${n.tipo==='Nuevo_Candidato'?'🆕':n.tipo==='Comision_Registrada'?'💰':'🔔'}</div>
              <div>
                <div class="notif-item-title">${n.titulo}</div>
                <div class="notif-item-time">${timeAgo(n.fecha)}</div>
              </div>
            </div>
          `).join('') || '<div class="empty-state" style="padding:24px;"><div class="empty-icon">🔕</div></div>'}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3 style="font-size:1rem;font-weight:700;">🏥 Vacantes Activas</h3></div>
        <div class="card-body" style="padding:0;">
          ${DB.getVacantes().filter(v=>v.estado==='Abierta').map(v => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--slate-50);">
              <div>
                <div style="font-size:.875rem;font-weight:600;color:var(--slate-900);">${v.titulo}</div>
                <div style="font-size:.75rem;color:var(--slate-500);">${v.empresa} · ${v.nivel_aleman} mínimo</div>
              </div>
              <span class="badge badge-success">${v.vacantes} plaza${v.vacantes>1?'s':''}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderAdminUsers() {
  const users = DB.getUsuarios();
  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestión de Usuarios</h1>
        <p class="page-subtitle">CRUD completo de cuentas del sistema</p>
      </div>
      <button class="btn btn-primary" onclick="openModal('modal-new-user')">+ Nuevo Usuario</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="search-bar" style="max-width:280px;">
          <span class="search-bar-icon">🔍</span>
          <input class="form-input" placeholder="Buscar usuario..." id="user-search" oninput="filterTable(this,'user-table-body')">
        </div>
        <span class="badge badge-slate">${users.length} usuarios</span>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha alta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="user-table-body">
            ${users.map(u => `
              <tr>
                <td>
                  <div class="td-avatar">
                    <div class="avatar" style="background:${getAvatarColor(u.nombre)}">${getInitials(u.nombre)}</div>
                    <div>
                      <div class="td-name">${u.nombre}</div>
                    </div>
                  </div>
                </td>
                <td>${u.correo}</td>
                <td><span class="badge" style="background:${getRolColor(u.rol)}22;color:${getRolColor(u.rol)}">${getRolIcon(u.rol)} ${u.rol}</span></td>
                <td><span class="badge ${u.activo?'badge-success':'badge-slate'}">${u.activo?'Activo':'Inactivo'}</span></td>
                <td>${u.fecha_creacion||'—'}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-outline btn-sm" onclick="editUser('${u.id}')">✏️</button>
                    ${u.id !== State.currentUser.id ? `<button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteUser('${u.id}')">🗑️</button>` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Nuevo Usuario -->
    <div class="modal-overlay" id="modal-new-user">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">➕ Nuevo Usuario</h3>
          <button class="modal-close" onclick="closeModal('modal-new-user')">✕</button>
        </div>
        <div class="modal-body">
          <form id="new-user-form" style="display:flex;flex-direction:column;gap:16px;">
            <div class="form-group">
              <label class="form-label">Nombre completo</label>
              <input class="form-input" id="nu-nombre" placeholder="Nombre y apellidos" required>
            </div>
            <div class="form-group">
              <label class="form-label">Correo electrónico</label>
              <input class="form-input" type="email" id="nu-correo" placeholder="correo@ejemplo.com" required>
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña temporal</label>
              <input class="form-input" id="nu-pass" placeholder="Contraseña inicial" required>
            </div>
            <div class="form-group">
              <label class="form-label">Rol</label>
              <select class="form-select" id="nu-rol">
                <option>Admin</option><option>Asesor</option><option>Profesor</option>
                <option>Candidato</option><option>Empresa</option><option>Socio</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal('modal-new-user')">Cancelar</button>
          <button class="btn btn-primary" onclick="createUser()">Crear Usuario</button>
        </div>
      </div>
    </div>
  `;
}

function initUserForm() {}

function createUser() {
  const nombre = $('nu-nombre')?.value.trim();
  const correo = $('nu-correo')?.value.trim();
  const pass   = $('nu-pass')?.value.trim();
  const rol    = $('nu-rol')?.value;
  if (!nombre || !correo || !pass) { showToast('Error', 'Completa todos los campos.', 'error'); return; }
  DB.createUsuario({ nombre, correo, contrasena: pass, rol, avatar: getInitials(nombre) });
  closeModal('modal-new-user');
  showToast('Usuario creado', `${nombre} fue registrado como ${rol}.`, 'success');
  navigateTo('admin-users');
}

function deleteUser(id) {
  if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
  DB.deleteUsuario(id);
  showToast('Usuario eliminado', 'El usuario fue eliminado del sistema.', 'warning');
  navigateTo('admin-users');
}

function editUser(id) { showToast('Editar usuario', 'Función disponible en la siguiente fase del MVP.', 'info'); }

function filterTable(input, tbodyId) {
  const val = input.value.toLowerCase();
  const rows = $$(`#${tbodyId} tr`);
  rows.forEach(row => { row.style.display = row.textContent.toLowerCase().includes(val) ? '' : 'none'; });
}

function renderAdminCandidatos() {
  const candidatos = DB.getCandidatos();
  return `
    <div class="page-header">
      <div><h1 class="page-title">Todos los Candidatos</h1><p class="page-subtitle">Vista global del pipeline</p></div>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="search-bar" style="max-width:300px;">
          <span class="search-bar-icon">🔍</span>
          <input class="form-input" placeholder="Buscar candidato..." oninput="filterTable(this,'cand-table-body')">
        </div>
        <span class="badge badge-gold">${candidatos.length} candidatos</span>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Candidato</th><th>País</th><th>Especialidad</th><th>Alemán</th><th>Estado Proceso</th><th>Homologación</th></tr></thead>
          <tbody id="cand-table-body">
            ${candidatos.map(c => `
              <tr>
                <td><div class="td-avatar"><div class="avatar" style="background:${getAvatarColor(c.nombre)}">${getInitials(c.nombre)}</div><div class="td-name">${c.nombre}</div></div></td>
                <td><span style="font-size:1rem;">${countryFlag(c.pais)}</span> ${c.pais}</td>
                <td>${c.especialidad}</td>
                <td><span class="badge badge-info">${c.nivel_aleman}</span></td>
                <td><span class="badge" style="background:${getEstadoColor(c.estado_proceso)}22;color:${getEstadoColor(c.estado_proceso)}">${c.estado_proceso}</span></td>
                <td><span class="badge ${c.estado_homologacion==='Aprobado'?'badge-success':c.estado_homologacion==='Rechazado'?'badge-danger':'badge-warning'}">${c.estado_homologacion}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminCms() {
  return `
    <div class="page-header">
      <div><h1 class="page-title">CMS Web Pública</h1><p class="page-subtitle">Gestiona el contenido visible en el sitio web corporativo</p></div>
      <button class="btn btn-primary" onclick="saveCms()">💾 Publicar Cambios</button>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div class="card-header"><h3 style="font-size:1rem;font-weight:700;">🖼️ Hero Principal</h3></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:16px;">
          <div class="form-group"><label class="form-label">Título principal</label>
            <input class="form-input" value="Tu Carrera Médica, al Corazón de Europa" id="cms-hero-title"></div>
          <div class="form-group"><label class="form-label">Subtítulo</label>
            <textarea class="form-textarea" id="cms-hero-sub">El puente más sólido para médicos y enfermeros que quieren ejercer en Alemania con seguridad, integración real y acompañamiento experto.</textarea></div>
          <div class="form-group"><label class="form-label">CTA Principal</label>
            <input class="form-input" value="Realiza el Test de Elegibilidad" id="cms-hero-cta"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3 style="font-size:1rem;font-weight:700;">📝 Testimonios</h3></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
          ${[
            { nombre:'Dr. Miguel R.', texto:'En 14 meses pasé de Colombia a trabajar en el Klinikum Stuttgart.' },
            { nombre:'Dra. Ana S.',   texto:'El equipo de JN Palabras me guió en cada paso del proceso.' }
          ].map((t,i) => `
            <div style="background:var(--slate-50);border-radius:var(--radius-md);padding:12px;border:1px solid var(--slate-200);">
              <textarea class="form-textarea" style="min-height:60px;" id="cms-test-${i}">${t.texto}</textarea>
              <input class="form-input" style="margin-top:8px;" value="${t.nombre}" id="cms-test-name-${i}">
            </div>
          `).join('')}
          <button class="btn btn-outline btn-sm">+ Añadir testimonio</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3 style="font-size:1rem;font-weight:700;">📰 Blog / Noticias</h3></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
          ${['Nuevas regulaciones de la Anerkennung 2025','Feria de empleo médico en Frankfurt','Guía completa del Fachsprachenprüfung'].map((t,i) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:var(--slate-50);border-radius:var(--radius-md);border:1px solid var(--slate-200);">
              <span style="font-size:.875rem;font-weight:600;color:var(--slate-900);">${t}</span>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-outline btn-sm">✏️</button>
                <button class="btn btn-outline btn-sm" style="color:var(--danger);">🗑️</button>
              </div>
            </div>
          `).join('')}
          <button class="btn btn-outline-gold btn-sm">+ Nueva Entrada</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3 style="font-size:1rem;font-weight:700;">⚙️ Ajustes Generales</h3></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:16px;">
          <div class="form-group"><label class="form-label">Correo de contacto público</label>
            <input class="form-input" value="info@jnpalabras.com"></div>
          <div class="form-group"><label class="form-label">Teléfono WhatsApp</label>
            <input class="form-input" value="+49 6221 000 000"></div>
          <div class="form-group"><label class="form-label">Aviso de GDPR/DSGVO</label>
            <textarea class="form-textarea" style="min-height:80px;">Utilizamos sus datos exclusivamente para fines de intermediación laboral conforme al Reglamento (UE) 2016/679 (RGPD).</textarea></div>
        </div>
      </div>
    </div>
  `;
}

function saveCms() { showToast('CMS actualizado', 'Los cambios han sido publicados en la web pública.', 'success'); }

function renderAdminComisiones() {
  const socios = DB.getSocios();
  return `
    <div class="page-header">
      <div><h1 class="page-title">Control de Comisiones</h1><p class="page-subtitle">Estado de pagos a socios de captación por candidatos colocados</p></div>
    </div>
    ${socios.map(s => {
      const coms = DB.getComisionesBySocio(s.id);
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div style="font-size:1rem;font-weight:700;color:var(--slate-900);">🤝 ${s.nombre}</div>
              <div style="font-size:.8125rem;color:var(--slate-500);">${s.pais} · ${s.porcentaje}% comisión · ${s.tipo_acuerdo}</div>
            </div>
            <div style="display:flex;gap:12px;">
              <div style="text-align:center;">
                <div style="font-size:1.25rem;font-weight:800;color:var(--gold-600);">${formatCurrency(s.comisiones_acumuladas)}</div>
                <div style="font-size:.7rem;color:var(--slate-500);">Acumulado</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:1.25rem;font-weight:800;color:var(--success);">${formatCurrency(s.comisiones_cobradas)}</div>
                <div style="font-size:.7rem;color:var(--slate-500);">Cobrado</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:1.25rem;font-weight:800;color:var(--danger);">${formatCurrency(s.comisiones_pendientes)}</div>
                <div style="font-size:.7rem;color:var(--slate-500);">Pendiente</div>
              </div>
            </div>
          </div>
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead><tr><th>Candidato</th><th>Empresa</th><th>Monto</th><th>Estado</th><th>Fecha Devengamiento</th><th>Fecha Pago</th></tr></thead>
              <tbody>
                ${coms.map(c => `
                  <tr>
                    <td class="td-name">${c.candidato}</td>
                    <td>${c.empresa}</td>
                    <td style="font-weight:700;color:var(--gold-600);">${formatCurrency(c.monto, c.moneda)}</td>
                    <td><span class="badge ${c.estado==='Pagada'?'badge-success':c.estado==='Devengada'?'badge-warning':'badge-slate'}">${c.estado}</span></td>
                    <td>${c.fecha_devengamiento||'—'}</td>
                    <td>${c.fecha_pago||'Pendiente'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function renderAdminEmpresas() {
  return `
    <div class="page-header">
      <div><h1 class="page-title">Empresas / Clínicas</h1><p class="page-subtitle">Hospitales clientes en Alemania</p></div>
    </div>
    <div class="grid grid-3">
      ${DB.get().empresas.map(e => `
        <div class="card card-hover">
          <div class="card-body">
            <div style="font-size:2rem;margin-bottom:12px;">🏥</div>
            <div style="font-size:1rem;font-weight:700;color:var(--slate-900);margin-bottom:4px;">${e.nombre}</div>
            <div style="font-size:.8125rem;color:var(--slate-500);margin-bottom:12px;">${e.tipo} · ${e.region}</div>
            <div style="display:flex;flex-direction:column;gap:6px;font-size:.875rem;color:var(--slate-600);">
              <div>👤 ${e.contacto}</div>
              <div>📧 ${e.correo}</div>
              <div>🛏️ ${e.camas} camas</div>
            </div>
            <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--slate-100);">
              <span class="badge ${e.activo?'badge-success':'badge-slate'}">${e.activo?'Activa':'Inactiva'}</span>
              <span class="badge badge-info" style="margin-left:8px;">${DB.getVacantesByEmpresa(e.id).length} vacante(s)</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────────
// ★ DASHBOARD 2: ASESOR
// ──────────────────────────────────────────────────────────────────
function renderAsesorKanban() {
  const { kanban_columns, candidatos } = DB.get();
  return `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;background:var(--theme-sidebar-bg);padding:24px;border-radius:var(--radius-lg);margin-bottom:24px;color:#fff;">
      <div>
        <h1 style="font-size:1.5rem;font-weight:800;color:var(--theme-sidebar-text);margin-bottom:4px;">Tablero Kanban</h1>
        <p style="font-size:.875rem;color:var(--theme-sidebar-text);opacity:0.8;">Pipeline de integración de candidatos</p>
      </div>
      <div style="display:flex;gap:12px;">
        <button class="btn" style="background:var(--theme-accent);color:var(--theme-btn-primary-text);" onclick="showToast('Kanban','Filtros avanzados (Demo)','info')">⚙️ Filtrar Vista</button>
        <button class="btn btn-outline" style="color:var(--theme-sidebar-text);border-color:var(--theme-sidebar-hover);" onclick="showToast('Kanban','Exportando a CSV...','success')">📥 Exportar</button>
      </div>
    </div>
    <div class="kanban-board" id="kanban-board">
      ${kanban_columns.map(col => {
        const cards = candidatos.filter(c => c.estado_proceso === col.id);
        return `
          <div class="kanban-col" data-col="${col.id}" id="col-${col.id.replace(/\s+/g,'-')}">
            <div class="kanban-col-header">
              <span class="kanban-col-title">${col.icon} ${col.label}</span>
              <span class="kanban-col-count">${cards.length}</span>
            </div>
            <div class="kanban-drop-zone" data-col="${col.id}">
              ${cards.map(c => `
                <div class="kanban-card" draggable="true" data-id="${c.id}" data-col="${col.id}"
                     onclick="openCandidateDetail('${c.id}')">
                  <div class="kanban-card-name">${c.nombre}</div>
                  <div class="kanban-card-spec">${c.especialidad} · ${c.pais}</div>
                  <div class="kanban-card-footer">
                    <span class="badge badge-info" style="font-size:.65rem;">${c.nivel_aleman}</span>
                    <span style="font-size:.7rem;color:var(--slate-400);">${countryFlag(c.pais)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Modal Detalle Candidato -->
    <div class="modal-overlay" id="modal-candidato">
      <div class="modal" style="max-width:600px;">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-cand-title">Detalle del Candidato</h3>
          <button class="modal-close" onclick="closeModal('modal-candidato')">✕</button>
        </div>
        <div class="modal-body" id="modal-cand-body"></div>
      </div>
    </div>
  `;
}

function initKanban() {
  const board = $('kanban-board');
  if (!board) return;

  let draggedId = null, draggedFromCol = null;

  board.addEventListener('dragstart', e => {
    const card = e.target.closest('.kanban-card');
    if (!card) return;
    draggedId = card.dataset.id;
    draggedFromCol = card.dataset.col;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  board.addEventListener('dragend', e => {
    const card = e.target.closest('.kanban-card');
    if (card) card.classList.remove('dragging');
    $$('.kanban-drop-zone').forEach(z => z.classList.remove('dragover'));
  });

  board.addEventListener('dragover', e => {
    e.preventDefault();
    const zone = e.target.closest('.kanban-drop-zone');
    if (zone) { $$('.kanban-drop-zone').forEach(z => z.classList.remove('dragover')); zone.classList.add('dragover'); }
  });

  board.addEventListener('drop', e => {
    e.preventDefault();
    const zone = e.target.closest('.kanban-drop-zone');
    if (!zone || !draggedId) return;
    const newCol = zone.dataset.col;
    if (newCol && newCol !== draggedFromCol) {
      DB.updateCandidato(draggedId, { estado_proceso: newCol });
      const c = DB.getCandidatoById(draggedId);
      showToast('Candidato movido', `${c?.nombre} → ${newCol}`, 'success');
      if (newCol === 'Colocado') {
        showToast('🎉 ¡Colocación exitosa!', `${c?.nombre} ha sido colocado exitosamente en Alemania.`, 'success', 6000);
        DB.addNotificacion({ id_usuario_dest: c?.id_usuario || 'u-cand-001', tipo: 'Visado_Aprobado', titulo: '¡Felicitaciones! Estás colocado/a', mensaje: 'Has completado exitosamente el proceso de JN Palabras. ¡Bienvenido/a a Alemania!' });
      }
      navigateTo('asesor-kanban');
    }
  });
}

function openCandidateDetail(id) {
  const c = DB.getCandidatoById(id);
  const docs = DB.getDocumentos(id);
  const notas = DB.getNotas(id);
  State.selectedCandidato = id;

  $('modal-cand-title').textContent = `🩺 ${c.nombre}`;
  $('modal-cand-body').innerHTML = `
    <div style="display:flex;gap:16px;margin-bottom:20px;">
      <div class="avatar avatar-lg" style="background:${getAvatarColor(c.nombre)};flex-shrink:0;">${getInitials(c.nombre)}</div>
      <div>
        <div style="font-size:1.0625rem;font-weight:700;color:var(--slate-900);">${c.nombre}</div>
        <div style="font-size:.875rem;color:var(--slate-600);">${c.especialidad} · ${c.pais} ${countryFlag(c.pais)}</div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <span class="badge badge-info">${c.nivel_aleman}</span>
          <span class="badge badge-warning">${c.estado_proceso}</span>
          <span class="badge ${c.estado_homologacion==='Aprobado'?'badge-success':'badge-warning'}">${c.estado_homologacion}</span>
        </div>
      </div>
    </div>
    <div style="margin-bottom:18px;display:flex;gap:10px;">
      <button class="btn btn-primary btn-sm" style="flex:1;justify-content:center;" onclick="closeModal('modal-candidato');openCVForCandidate('${id}')">
        📄 Ver / Editar Hoja de Vida (Plantilla Oficial JN)
      </button>
    </div>
    <div style="margin-bottom:20px;">
      <div style="font-size:.8125rem;font-weight:700;color:var(--slate-700);margin-bottom:10px;letter-spacing:.04em;text-transform:uppercase;">📁 Documentos del Expediente</div>
      ${docs.map(d => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid var(--slate-200);border-radius:var(--radius-md);margin-bottom:8px;background:var(--slate-50);">
          <span style="font-size:1.25rem;">📄</span>
          <div style="flex:1;">
            <div style="font-size:.875rem;font-weight:600;color:var(--slate-900);">${d.nombre}</div>
            <div style="font-size:.75rem;color:var(--slate-500);">${d.categoria} · ${d.fecha||'Pendiente subida'}</div>
            ${d.comentario ? `<div style="font-size:.75rem;color:var(--danger);margin-top:4px;">💬 ${d.comentario}</div>` : ''}
          </div>
          <span class="badge ${d.estado==='Aprobado'?'badge-success':d.estado==='Rechazado'?'badge-danger':d.estado==='En Revisión'?'badge-warning':'badge-slate'}">${d.estado}</span>
          ${d.estado==='En Revisión'||d.estado==='Pendiente' ? `
            <div style="display:flex;gap:4px;">
              <button class="btn btn-success btn-sm" onclick="reviewDoc('${d.id}','Aprobado')">✓</button>
              <button class="btn btn-danger btn-sm" onclick="showRejectModal('${d.id}')">✗</button>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    <div>
      <div style="font-size:.8125rem;font-weight:700;color:var(--slate-700);margin-bottom:10px;letter-spacing:.04em;text-transform:uppercase;">📋 Notas de Seguimiento</div>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <input class="form-input" placeholder="Añadir nota rápida..." id="quick-note" style="flex:1;">
        <select class="form-select" id="quick-note-tipo" style="width:140px;">
          <option>Llamada</option><option>Email</option><option>Nota Interna</option><option>Hito</option>
        </select>
        <button class="btn btn-primary btn-sm" onclick="addQuickNote('${id}')">Guardar</button>
      </div>
      ${notas.map(n => `
        <div style="padding:10px;background:var(--slate-50);border-radius:var(--radius-md);border-left:3px solid var(--gold-500);margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:.75rem;font-weight:700;color:var(--gold-600);">${n.tipo}</span>
            <span style="font-size:.7rem;color:var(--slate-400);">${n.fecha}</span>
          </div>
          <div style="font-size:.875rem;color:var(--slate-700);">${n.contenido}</div>
        </div>
      `).join('') || '<div style="font-size:.875rem;color:var(--slate-400);">Sin notas todavía.</div>'}
    </div>
  `;
  openModal('modal-candidato');
}

function reviewDoc(docId, estado) {
  DB.updateDocumento(docId, { estado });
  showToast(estado==='Aprobado'?'Documento aprobado':'Documento rechazado', `El documento fue marcado como ${estado}.`, estado==='Aprobado'?'success':'warning');
  if (State.selectedCandidato) openCandidateDetail(State.selectedCandidato);
}

function showRejectModal(docId) {
  const comentario = prompt('Motivo de rechazo (se enviará al candidato):');
  if (comentario !== null) {
    DB.updateDocumento(docId, { estado:'Rechazado', comentario });
    showToast('Documento rechazado', 'El candidato ha sido notificado.', 'error');
    if (State.selectedCandidato) openCandidateDetail(State.selectedCandidato);
  }
}

function addQuickNote(id_cand) {
  const contenido = $('quick-note')?.value.trim();
  const tipo = $('quick-note-tipo')?.value;
  if (!contenido) return;
  DB.addNota({ id_candidato: id_cand, asesor: State.currentUser.nombre, tipo, contenido });
  showToast('Nota guardada', 'La nota fue registrada en el historial.', 'success');
  openCandidateDetail(id_cand);
}

function renderAsesorExpedientes() {
  return `
    <div class="page-header">
      <div><h1 class="page-title">Expedientes y Validación Documental</h1><p class="page-subtitle">Haz clic en un candidato para gestionar sus documentos</p></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${DB.getCandidatos().map(c => {
        const docs = DB.getDocumentos(c.id);
        const aprobados = docs.filter(d=>d.estado==='Aprobado').length;
        const pendientes = docs.filter(d=>d.estado==='Pendiente'||d.estado==='En Revisión').length;
        const rechazados = docs.filter(d=>d.estado==='Rechazado').length;
        return `
          <div class="card" style="cursor:pointer;" onclick="openCandidateDetail('${c.id}')">
            <div class="card-body" style="display:flex;align-items:center;gap:16px;">
              <div class="avatar avatar-lg" style="background:${getAvatarColor(c.nombre)}">${getInitials(c.nombre)}</div>
              <div style="flex:1;">
                <div style="font-size:1rem;font-weight:700;color:var(--slate-900);">${c.nombre}</div>
                <div style="font-size:.875rem;color:var(--slate-500);">${c.especialidad} · ${c.pais} · ${c.estado_proceso}</div>
              </div>
              <div style="display:flex;gap:8px;">
                <span class="badge badge-success">✓ ${aprobados}</span>
                ${pendientes>0?`<span class="badge badge-warning">⏳ ${pendientes}</span>`:''}
                ${rechazados>0?`<span class="badge badge-danger">✗ ${rechazados}</span>`:''}
              </div>
              <div class="progress-bar-base" style="width:120px;">
                <div class="progress-fill" style="width:${docs.length?Math.round(aprobados/docs.length*100):0}%"></div>
              </div>
              <span style="font-size:.8125rem;font-weight:700;color:var(--slate-700);">${docs.length?Math.round(aprobados/docs.length*100):0}%</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <!-- Reutilizar modal -->
    <div class="modal-overlay" id="modal-candidato">
      <div class="modal" style="max-width:600px;">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-cand-title">Detalle</h3>
          <button class="modal-close" onclick="closeModal('modal-candidato')">✕</button>
        </div>
        <div class="modal-body" id="modal-cand-body"></div>
      </div>
    </div>
  `;
}

function renderAsesorMatching() {
  const candidatos = DB.getCandidatos().filter(c => c.estado_proceso !== 'Colocado');
  const vacantes   = DB.getVacantes().filter(v => v.estado === 'Abierta');
  return `
    <div class="page-header">
      <div><h1 class="page-title">Motor de Matching IA</h1><p class="page-subtitle">Asocia perfiles aptos con vacantes activas en hospitales</p></div>
    </div>
    <div class="grid grid-2" style="gap:24px;align-items:start;">
      <div>
        <div style="font-size:.8125rem;font-weight:700;color:var(--slate-700);letter-spacing:.04em;text-transform:uppercase;margin-bottom:12px;">Seleccionar Candidato</div>
        <div style="display:flex;flex-direction:column;gap:8px;" id="match-cand-list">
          ${candidatos.map(c => `
            <div class="card" style="cursor:pointer;border:2px solid transparent;" id="mc-${c.id}" onclick="selectMatchCand('${c.id}')">
              <div class="card-body" style="padding:12px;display:flex;align-items:center;gap:12px;">
                <div class="avatar" style="background:${getAvatarColor(c.nombre)}">${getInitials(c.nombre)}</div>
                <div style="flex:1;">
                  <div style="font-size:.9rem;font-weight:700;">${c.nombre}</div>
                  <div style="font-size:.8rem;color:var(--slate-500);">${c.especialidad} · ${c.nivel_aleman}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div>
        <div style="font-size:.8125rem;font-weight:700;color:var(--slate-700);letter-spacing:.04em;text-transform:uppercase;margin-bottom:12px;">Seleccionar Vacante</div>
        <div style="display:flex;flex-direction:column;gap:8px;" id="match-vac-list">
          ${vacantes.map(v => `
            <div class="card" style="cursor:pointer;border:2px solid transparent;" id="mv-${v.id}" onclick="selectMatchVac('${v.id}')">
              <div class="card-body" style="padding:12px;">
                <div style="font-size:.9rem;font-weight:700;">${v.titulo}</div>
                <div style="font-size:.8rem;color:var(--slate-500);">${v.empresa} · ${v.nivel_aleman} · ${formatCurrency(v.sueldo_min)}-${formatCurrency(v.sueldo_max)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <div id="match-score-area" style="display:none;margin-top:20px;" class="card">
      <div class="card-body" style="text-align:center;padding:32px;">
        <div style="font-size:3rem;font-weight:900;color:var(--gold-600);" id="match-score">—</div>
        <div style="font-size:1rem;color:var(--slate-600);margin-bottom:16px;">Puntuación de Compatibilidad</div>
        <button class="btn btn-primary" onclick="ejecutarMatch()">🎯 Confirmar Matching</button>
      </div>
    </div>
  `;
}

let _matchCand = null, _matchVac = null;
function selectMatchCand(id) {
  _matchCand = id;
  $$('#match-cand-list .card').forEach(c => c.style.borderColor='transparent');
  $(`mc-${id}`).style.borderColor = 'var(--gold-500)';
  updateMatchScore();
}
function selectMatchVac(id) {
  _matchVac = id;
  $$('#match-vac-list .card').forEach(c => c.style.borderColor='transparent');
  $(`mv-${id}`).style.borderColor = 'var(--gold-500)';
  updateMatchScore();
}
function updateMatchScore() {
  if (!_matchCand || !_matchVac) return;
  const c = DB.getCandidatoById(_matchCand);
  const v = DB.getVacantes().find(vv => vv.id === _matchVac);
  const nivelMap = { A1:1,A2:2,B1:3,B2:4,C1:5,C2:6,FSP:6 };
  let score = 60;
  if ((nivelMap[c.nivel_aleman]||0) >= (nivelMap[v.nivel_aleman]||0)) score += 25;
  if (c.especialidad === v.especialidad) score += 15;
  $('match-score-area').style.display = 'block';
  $('match-score').textContent = score + '%';
  $('match-score').style.color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--gold-600)' : 'var(--danger)';
}
function ejecutarMatch() {
  if (!_matchCand || !_matchVac) return;
  DB.crearMatching(_matchCand, _matchVac);
  const c = DB.getCandidatoById(_matchCand);
  const v = DB.getVacantes().find(vv => vv.id === _matchVac);
  showToast('✅ Matching creado', `${c.nombre} ↔ ${v.titulo} (${v.empresa})`, 'success', 5000);
  _matchCand = null; _matchVac = null;
  navigateTo('asesor-matching');
}

function renderAsesorNotas() {
  const notas = DB.get().notas.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
  const tipoIcon = { Llamada:'📞', Email:'📧', 'Reunión Virtual':'🎥', 'Nota Interna':'📋', Alerta:'⚠️', Hito:'🏆' };
  return `
    <div class="page-header">
      <div><h1 class="page-title">Notas de Seguimiento</h1><p class="page-subtitle">Historial cronológico de todas las interacciones</p></div>
    </div>
    <div style="max-width:680px;">
      ${notas.map(n => {
        const c = DB.getCandidatoById(n.id_candidato);
        return `
          <div style="display:flex;gap:16px;margin-bottom:20px;">
            <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
              <div style="width:36px;height:36px;border-radius:50%;background:var(--gold-100);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">${tipoIcon[n.tipo]||'📋'}</div>
              <div style="width:2px;flex:1;background:var(--slate-200);margin-top:8px;"></div>
            </div>
            <div class="card" style="flex:1;margin-bottom:0;">
              <div class="card-body" style="padding:14px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                  <span style="font-size:.8125rem;font-weight:700;color:var(--gold-600);">${n.tipo}</span>
                  <span style="font-size:.75rem;color:var(--slate-400);">${n.fecha}</span>
                </div>
                <div style="font-size:.8125rem;font-weight:600;color:var(--slate-500);margin-bottom:4px;">Candidato: ${c?.nombre||'Desconocido'}</div>
                <div style="font-size:.9375rem;color:var(--slate-800);">${n.contenido}</div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────────
// ★ GENERADOR Y GESTOR DE HOJA DE VIDA (LEBENSLAUF JN PALABRAS)
// ──────────────────────────────────────────────────────────────────

function openCVForCandidate(id) {
  State.cvSelectedCandId = id;
  State.cvActiveTab = 'edit';
  State.cvDraft = null;
  navigateTo('asesor-cv-builder');
}

function renderAsesorCVBuilder() {
  const candidatos = DB.getCandidatos();
  if (!State.cvSelectedCandId && candidatos.length > 0) {
    State.cvSelectedCandId = candidatos[0].id;
  }
  
  const cand = DB.getCandidatoById(State.cvSelectedCandId) || candidatos[0];
  const cv = State.cvDraft || (cand ? DB.getCV(cand.id) : null);
  const activeTab = State.cvActiveTab || 'edit';

  return `
    <div class="cv-builder-header">
      <div>
        <h1 class="page-title">📄 Gestor de Hojas de Vida (Deutscher Lebenslauf)</h1>
        <p class="page-subtitle">Crea, edita y genera el currículum médico oficial de JN Palabras para presentar a hospitales alemanes</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <select class="form-select" style="min-width:240px;font-weight:600;" onchange="selectCandidateForCV(this.value)">
          ${candidatos.map(c => `
            <option value="${c.id}" ${c.id === cand?.id ? 'selected' : ''}>
              ${c.nombre} (${c.especialidad || 'Candidato'})
            </option>
          `).join('')}
        </select>
        <button class="btn btn-outline btn-sm" onclick="createNewCandidateCV()">
          ➕ Nuevo Candidato
        </button>
      </div>
    </div>

    <!-- Pestañas Formulario / Vista Previa -->
    <div class="cv-tabs-container">
      <button class="cv-tab-btn ${activeTab === 'edit' ? 'active' : ''}" onclick="switchCVTab('edit')">
        ✏️ Formulario de Edición (${cand?.nombre || 'Candidato'})
      </button>
      <button class="cv-tab-btn ${activeTab === 'preview' ? 'active' : ''}" onclick="switchCVTab('preview')">
        👁️ Vista Previa Oficial (Plantilla JN)
      </button>
    </div>

    ${activeTab === 'edit' ? renderCVForm(cand?.id, cv, true) : `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
        <div style="font-size:0.875rem;color:var(--slate-600);">
          Vista previa del formato oficial listo para exportar a PDF (Hoja A4 estándar para hospitales de Alemania).
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-outline btn-sm" onclick="switchCVTab('edit')">✏️ Volver a Editar</button>
          <button class="btn btn-primary btn-sm" onclick="printLebenslauf()">🖨️ Descargar / Imprimir en PDF</button>
        </div>
      </div>
      <div class="jn-cv-preview-container">
        ${renderLebenslaufOfficial(cv)}
      </div>
    `}
  `;
}

function renderCandCV() {
  const userId = State.currentUser?.id;
  const cand = DB.getCandidatos().find(c => c.id_usuario === userId) || DB.getCandidatos()[0];
  const cv = State.cvDraft || (cand ? DB.getCV(cand.id) : null);
  const activeTab = State.cvActiveTab || 'edit';

  return `
    <div class="cv-builder-header">
      <div>
        <h1 class="page-title">📄 Mi Hoja de Vida (Deutscher Lebenslauf)</h1>
        <p class="page-subtitle">Diligencia tu información médica y profesional para generar tu currículum oficial de JN Palabras</p>
      </div>
      <div style="display:flex;gap:10px;">
        ${activeTab === 'edit' ? `
          <button class="btn btn-primary" onclick="saveCVForm('${cand?.id}', false); switchCVTab('preview');">👁️ Guardar y Previsualizar</button>
        ` : `
          <button class="btn btn-primary" onclick="printLebenslauf()">🖨️ Descargar / Imprimir en PDF</button>
        `}
      </div>
    </div>

    <!-- Pestañas Formulario / Vista Previa -->
    <div class="cv-tabs-container">
      <button class="cv-tab-btn ${activeTab === 'edit' ? 'active' : ''}" onclick="switchCVTab('edit')">
        ✏️ Formulario de Edición
      </button>
      <button class="cv-tab-btn ${activeTab === 'preview' ? 'active' : ''}" onclick="switchCVTab('preview')">
        👁️ Vista Previa Oficial (Plantilla JN)
      </button>
    </div>

    ${activeTab === 'edit' ? renderCVForm(cand?.id, cv, false) : `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
        <div style="font-size:0.875rem;color:var(--slate-600);">
          Tu Hoja de Vida formateada según las normas y estándares de los hospitales y clínicas en Alemania.
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-outline btn-sm" onclick="switchCVTab('edit')">✏️ Volver a Editar</button>
          <button class="btn btn-primary btn-sm" onclick="printLebenslauf()">🖨️ Descargar / Imprimir en PDF</button>
        </div>
      </div>
      <div class="jn-cv-preview-container">
        ${renderLebenslaufOfficial(cv)}
      </div>
    `}
  `;
}

function renderCVForm(candId, cv, isAsesor) {
  if (!cv) cv = { personal:{}, profil:'', werdegang:[], ausbildung:[], sprachen:[] };
  const p = cv.personal || {};
  const werdegang = cv.werdegang || [];
  const ausbildung = cv.ausbildung || [];
  const sprachen = cv.sprachen || [];

  return `
    <form id="cv-form" onsubmit="event.preventDefault(); saveCVForm('${candId}', true);">
      
      <!-- 1. DATOS PERSONALES -->
      <div class="cv-form-card">
        <div class="cv-section-heading">👤 Angaben zur Person (Datos Personales y Contacto)</div>
        <div class="cv-section-sub">Información básica que se mostrará en la portada y en la tabla de datos personales</div>

        <div class="grid grid-3" style="gap:16px; margin-bottom:16px;">
          <div class="form-group">
            <label class="form-label" for="cv-vorname">Nombres (Vorname) *</label>
            <input class="form-input" id="cv-vorname" value="${p.vorname || ''}" placeholder="Ej: Maira Alejandra" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="cv-name">Apellidos (Name / Nachname) *</label>
            <input class="form-input" id="cv-name" value="${p.name || ''}" placeholder="Ej: Coronel López" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="cv-beruf">Profesión / Especialidad (Beruf) *</label>
            <input class="form-input" id="cv-beruf" value="${p.beruf || ''}" placeholder="Ej: Gesundheits- und Krankenschwester o Facharzt für..." required>
          </div>
        </div>

        <div class="grid grid-3" style="gap:16px; margin-bottom:16px;">
          <div class="form-group">
            <label class="form-label" for="cv-geburtsdatum">Fecha de Nacimiento (Geburtsdatum)</label>
            <input class="form-input" id="cv-geburtsdatum" value="${p.geburtsdatum || ''}" placeholder="DD/MM/AAAA (ej: 01/10/1994)">
          </div>
          <div class="form-group">
            <label class="form-label" for="cv-nationalitaet">Nacionalidad (Nationalität)</label>
            <input class="form-input" id="cv-nationalitaet" value="${p.nationalitaet || ''}" placeholder="Ej: kolumbianisch, mexikanisch">
          </div>
          <div class="form-group">
            <label class="form-label" for="cv-familienstand">Estado Civil (Familienstand)</label>
            <input class="form-input" id="cv-familienstand" value="${p.familienstand || ''}" placeholder="Ej: Ledig (Soltero/a), Verheiratet">
          </div>
        </div>

        <div class="grid grid-2" style="gap:16px; margin-bottom:16px;">
          <div class="form-group">
            <label class="form-label" for="cv-telefon">Teléfono (Telefon con prefijo internacional)</label>
            <input class="form-input" id="cv-telefon" value="${p.telefon || ''}" placeholder="Ej: (+57) 3127016458">
          </div>
          <div class="form-group">
            <label class="form-label" for="cv-email">Correo Electrónico (E-Mail)</label>
            <input class="form-input" type="email" id="cv-email" value="${p.email || ''}" placeholder="Ej: maira9426@hotmail.com">
          </div>
        </div>

        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label" for="cv-adresse">Dirección Completa (Adresse)</label>
          <input class="form-input" id="cv-adresse" value="${p.adresse || ''}" placeholder="Ej: Straße 27 #55b-35, Wohnung 306, Rionegro, Kolumbien">
        </div>

        <div class="form-group">
          <label class="form-label" for="cv-foto">Fotografía Profesional</label>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
            <input class="form-input" id="cv-foto" value="${p.foto || ''}" placeholder="URL de la fotografía o sube una imagen..." style="flex:1;min-width:220px;">
            <label class="btn btn-outline btn-sm" style="cursor:pointer;white-space:nowrap;">
              📁 Subir Imagen
              <input type="file" accept="image/*" style="display:none;" onchange="handleCvPhotoUpload(this)">
            </label>
          </div>
        </div>
      </div>

      <!-- 2. RESUMEN / PERFIL PROFESIONAL -->
      <div class="cv-form-card">
        <div class="cv-section-heading">📝 Profilzusammenfassung (Perfil Profesional / Carta de Presentación)</div>
        <div class="cv-section-sub">Breve introducción destacando trayectoria clínica, ética de trabajo y competencias en el área médica</div>
        <div class="form-group">
          <textarea class="form-input" id="cv-profil" rows="4" placeholder="Ich bin eine proaktive professionelle Fachkraft mit fundierter Erfahrung...">${cv.profil || ''}</textarea>
        </div>
      </div>

      <!-- 3. TRAYECTORIA LABORAL (BERUFLICHER WERDEGANG) -->
      <div class="cv-form-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:8px;">
          <div class="cv-section-heading" style="margin-bottom:0;">🏥 Beruflicher Werdegang (Experiencia Profesional / Clínica)</div>
          <button type="button" class="cv-add-item-btn" onclick="addWerdegangItem()">
            ➕ Añadir Experiencia
          </button>
        </div>
        <div class="cv-section-sub">Registra los cargos clínicos indicando período (DD/MM/AAAA – DD/MM/AAAA o AKTUELL), cargo/hospital y funciones</div>

        <div id="cv-werdegang-list">
          ${werdegang.map((w, idx) => `
            <div class="cv-item-box cv-werdegang-item">
              <button type="button" class="cv-item-remove-btn" onclick="removeWerdegangItem(${idx})">✕ Eliminar</button>
              <div class="grid grid-2" style="gap:12px;margin-bottom:10px;">
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label" style="font-size:0.75rem;">Período (DD/MM/AAAA – DD/MM/AAAA o AKTUELL)</label>
                  <input class="form-input item-zeitraum" value="${w.zeitraum || ''}" placeholder="Ej: 14/03/2019 – 26/07/2020">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label" style="font-size:0.75rem;">Cargo & Hospital (En mayúsculas)</label>
                  <input class="form-input item-titel" value="${w.titel || ''}" placeholder="Ej: KRANKENSCHWESTER INTENSIVMEDIZIN VON TOLIMA">
                </div>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Funciones y Procedimientos Clínicos</label>
                <textarea class="form-input item-beschreibung" rows="3" placeholder="Descripción de procedimientos, administración de medicamentos, UCI, etc...">${w.beschreibung || ''}</textarea>
              </div>
            </div>
          `).join('')}
        </div>
        ${werdegang.length === 0 ? `<div style="text-align:center;padding:20px;color:var(--slate-400);font-size:0.875rem;">No hay experiencias registradas. Haz clic en "➕ Añadir Experiencia".</div>` : ''}
      </div>

      <!-- 4. EDUCACIÓN (AUSBILDUNG UND QUALIFIKATION) -->
      <div class="cv-form-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:8px;">
          <div class="cv-section-heading" style="margin-bottom:0;">🎓 Ausbildung und Qualifikation (Educación y Formación)</div>
          <button type="button" class="cv-add-item-btn" onclick="addAusbildungItem()">
            ➕ Añadir Formación
          </button>
        </div>
        <div class="cv-section-sub">Títulos universitarios, convalidaciones médicas y colegios</div>

        <div id="cv-ausbildung-list">
          ${ausbildung.map((a, idx) => `
            <div class="cv-item-box cv-ausbildung-item">
              <button type="button" class="cv-item-remove-btn" onclick="removeAusbildungItem(${idx})">✕ Eliminar</button>
              <div class="grid grid-2" style="gap:12px;margin-bottom:0;">
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label" style="font-size:0.75rem;">Período (DD/MM/AAAA – DD/MM/AAAA)</label>
                  <input class="form-input item-zeitraum" value="${a.zeitraum || ''}" placeholder="Ej: 20/01/2012 – 27/06/2017">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label" style="font-size:0.75rem;">Título, Universidad e Institución</label>
                  <textarea class="form-input item-beschreibung" rows="2" placeholder="Ausbildung zur Krankenschwester,\nHochschule Popular del Cesar, Valledupar, Kolumbien">${a.beschreibung || ''}</textarea>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        ${ausbildung.length === 0 ? `<div style="text-align:center;padding:20px;color:var(--slate-400);font-size:0.875rem;">No hay formaciones registradas. Haz clic en "➕ Añadir Formación".</div>` : ''}
      </div>

      <!-- 5. IDIOMAS (SPRACHKENNTNISSE) -->
      <div class="cv-form-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:8px;">
          <div class="cv-section-heading" style="margin-bottom:0;">🗣️ Sprachkenntnisse (Idiomas)</div>
          <button type="button" class="cv-add-item-btn" onclick="addSprachenItem()">
            ➕ Añadir Idioma
          </button>
        </div>
        <div class="cv-section-sub">Nivel de idiomas y certificaciones oficiales (ej: Muttersprache, B2 Goethe-Zertifikat)</div>

        <div id="cv-sprachen-list">
          ${sprachen.map((s, idx) => `
            <div class="cv-item-box cv-sprachen-item" style="padding:12px 16px;">
              <button type="button" class="cv-item-remove-btn" onclick="removeSprachenItem(${idx})">✕ Eliminar</button>
              <div class="grid grid-2" style="gap:12px;margin-bottom:0;">
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label" style="font-size:0.75rem;">Idioma (Sprache)</label>
                  <input class="form-input item-sprache" value="${s.sprache || ''}" placeholder="Ej: Spanisch, Deutsch, Englisch">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label" style="font-size:0.75rem;">Nivel / Certificado (Niveau)</label>
                  <input class="form-input item-niveau" value="${s.niveau || ''}" placeholder="Ej: Muttersprache, B2 Goethe-Zertifikat, B1...">
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- BOTONES DE ACCIÓN INFERIORES -->
      <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;">
        <button type="button" class="btn btn-outline" onclick="switchCVTab('preview')">👁️ Previsualizar Plantilla</button>
        <button type="submit" class="btn btn-primary">💾 Guardar Hoja de Vida</button>
      </div>

    </form>
  `;
}

function renderLebenslaufOfficial(cv) {
  if (!cv) return `<div style="color:#fff;padding:40px;text-align:center;">No hay datos disponibles para previsualizar.</div>`;
  const p = cv.personal || {};
  const werdegang = cv.werdegang || [];
  const ausbildung = cv.ausbildung || [];
  const sprachen = cv.sprachen || [];

  return `
    <!-- PÁGINA 1: DECKBLATT (PORTADA) -->
    <div class="jn-cv-paper jn-cv-page-1">
      <div class="jn-cv-deckblatt">
        <img src="/logo.png" alt="JN Palabras" class="jn-cv-logo-img">
        <div class="jn-cv-deckblatt-name-label">Name:</div>
        <div class="jn-cv-deckblatt-name-val">${p.vorname || ''} ${p.name || ''}</div>
        <div class="jn-cv-deckblatt-beruf-label">Beruf:</div>
        <div class="jn-cv-deckblatt-beruf-val">${p.beruf || 'Gesundheits- und Krankenpfleger / Arzt'}</div>
      </div>
      <div class="jn-cv-page-footer">
        <strong>JN PALABRAS Consulting</strong><br>
        info@jnpalabras.com
      </div>
    </div>

    <!-- PÁGINA 2+: LEBENSLAUF INHALT -->
    <div class="jn-cv-paper jn-cv-page-2">
      <div class="jn-cv-page-header">
        <img src="/logo.png" alt="JN Palabras" class="jn-cv-mini-logo-img">
      </div>

      ${cv.profil ? `
        <div class="jn-cv-profil-summary">
          ${cv.profil.replace(/\n/g, '<br>')}
        </div>
      ` : ''}

      <div class="jn-cv-section-title">Angaben zur Person</div>
      <div class="jn-cv-personal-wrap">
        <div class="jn-cv-photo-box">
          ${p.foto ? `<img src="${p.foto}" alt="Foto" onerror="this.style.display='none';this.nextElementSibling.style.display='block';"><div class="jn-cv-photo-placeholder" style="display:none;">👤</div>` : `<div class="jn-cv-photo-placeholder">👤</div>`}
        </div>
        <table class="jn-cv-table" style="flex:1;">
          <tbody>
            <tr><td style="width:30%;font-weight:600;">Vorname</td><td>${p.vorname || '—'}</td></tr>
            <tr><td style="font-weight:600;">Name</td><td>${p.name || '—'}</td></tr>
            <tr><td style="font-weight:600;">Geburtsdatum</td><td>${p.geburtsdatum || '—'}</td></tr>
            <tr><td style="font-weight:600;">Adresse</td><td>${p.adresse || '—'}</td></tr>
            <tr><td style="font-weight:600;">Nationalität</td><td>${p.nationalitaet || '—'}</td></tr>
            <tr><td style="font-weight:600;">Familienstand</td><td>${p.familienstand || '—'}</td></tr>
            <tr><td style="font-weight:600;">Telefon</td><td>${p.telefon || '—'}</td></tr>
            <tr><td style="font-weight:600;">E-Mail</td><td>${p.email || '—'}</td></tr>
          </tbody>
        </table>
      </div>

      ${werdegang.length > 0 ? `
        <div class="jn-cv-section-title">Beruflicher Werdegang</div>
        <table class="jn-cv-table" style="margin-bottom:16px;">
          <tbody>
            ${werdegang.map(w => `
              <tr>
                <td class="jn-cv-table-date-col">${w.zeitraum || ''}</td>
                <td class="jn-cv-table-content-col">
                  <div class="jn-cv-werdegang-title">${w.titel || ''}</div>
                  <div class="jn-cv-werdegang-desc">${(w.beschreibung || '').replace(/\n/g, '<br>')}</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      ${ausbildung.length > 0 ? `
        <div class="jn-cv-section-title">Ausbildung und Qualifikation</div>
        <table class="jn-cv-table" style="margin-bottom:16px;">
          <tbody>
            ${ausbildung.map(a => `
              <tr>
                <td class="jn-cv-table-date-col">${a.zeitraum || ''}</td>
                <td class="jn-cv-table-content-col">
                  <div class="jn-cv-werdegang-desc">${(a.beschreibung || '').replace(/\n/g, '<br>')}</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      ${sprachen.length > 0 ? `
        <div class="jn-cv-section-title">Sprachkenntnisse</div>
        <table class="jn-cv-table" style="margin-bottom:16px;">
          <tbody>
            ${sprachen.map(s => `
              <tr>
                <td style="width:30%;font-weight:600;">${s.sprache || ''}</td>
                <td>${s.niveau || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <div class="jn-cv-page-footer">
        <strong>JN PALABRAS Consulting</strong><br>
        info@jnpalabras.com
      </div>
    </div>
  `;
}

function collectCVFormData() {
  const vorname = $('cv-vorname')?.value.trim() || '';
  const name = $('cv-name')?.value.trim() || '';
  const beruf = $('cv-beruf')?.value.trim() || '';
  const geburtsdatum = $('cv-geburtsdatum')?.value.trim() || '';
  const nationalitaet = $('cv-nationalitaet')?.value.trim() || '';
  const familienstand = $('cv-familienstand')?.value.trim() || '';
  const telefon = $('cv-telefon')?.value.trim() || '';
  const email = $('cv-email')?.value.trim() || '';
  const adresse = $('cv-adresse')?.value.trim() || '';
  const foto = $('cv-foto')?.value.trim() || '';
  const profil = $('cv-profil')?.value.trim() || '';

  const werdegang = [];
  $$('.cv-werdegang-item').forEach(el => {
    const zeitraum = el.querySelector('.item-zeitraum')?.value.trim() || '';
    const titel = el.querySelector('.item-titel')?.value.trim() || '';
    const beschreibung = el.querySelector('.item-beschreibung')?.value.trim() || '';
    if (zeitraum || titel || beschreibung) werdegang.push({ zeitraum, titel, beschreibung });
  });

  const ausbildung = [];
  $$('.cv-ausbildung-item').forEach(el => {
    const zeitraum = el.querySelector('.item-zeitraum')?.value.trim() || '';
    const beschreibung = el.querySelector('.item-beschreibung')?.value.trim() || '';
    if (zeitraum || beschreibung) ausbildung.push({ zeitraum, beschreibung });
  });

  const sprachen = [];
  $$('.cv-sprachen-item').forEach(el => {
    const sprache = el.querySelector('.item-sprache')?.value.trim() || '';
    const niveau = el.querySelector('.item-niveau')?.value.trim() || '';
    if (sprache || niveau) sprachen.push({ sprache, niveau });
  });

  return {
    personal: { vorname, name, beruf, geburtsdatum, nationalitaet, familienstand, telefon, email, adresse, foto },
    profil,
    werdegang,
    ausbildung,
    sprachen
  };
}

function saveCVForm(candId, notify = true) {
  const data = collectCVFormData();
  State.cvDraft = data;
  if (candId) {
    DB.saveCV(candId, data);
    if (notify) {
      showToast('Hoja de Vida Guardada', 'La información del candidato ha sido actualizada y sincronizada en su expediente.', 'success');
    }
  }
}

function switchCVTab(tab) {
  if (State.cvActiveTab === 'edit' && $('cv-form')) {
    State.cvDraft = collectCVFormData();
  }
  State.cvActiveTab = tab;
  renderDashboard(State.currentUser.rol);
}

function selectCandidateForCV(candId) {
  State.cvSelectedCandId = candId;
  State.cvDraft = null;
  renderDashboard(State.currentUser.rol);
}

function createNewCandidateCV() {
  const nombre = prompt('Nombre completo del nuevo candidato:');
  if (!nombre) return;
  const nuevo = DB.createCandidato({
    nombre,
    especialidad: 'Medicina General',
    pais: 'Colombia',
    nivel_aleman: 'B1',
    estado_proceso: 'Lead Nuevo',
    estado_homologacion: 'Pendiente'
  });
  State.cvSelectedCandId = nuevo.id;
  State.cvDraft = null;
  showToast('Candidato Creado', `Se ha creado a ${nombre}. Ahora puedes completar su Hoja de Vida.`, 'success');
  renderDashboard(State.currentUser.rol);
}

function printLebenslauf() {
  window.print();
}

function handleCvPhotoUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      if ($('cv-foto')) $('cv-foto').value = e.target.result;
      showToast('Foto cargada', 'La fotografía se ha adjuntado al formulario.', 'info');
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function addWerdegangItem() {
  State.cvDraft = collectCVFormData();
  State.cvDraft.werdegang.push({ zeitraum: '', titel: '', beschreibung: '' });
  renderDashboard(State.currentUser.rol);
}

function removeWerdegangItem(index) {
  State.cvDraft = collectCVFormData();
  State.cvDraft.werdegang.splice(index, 1);
  renderDashboard(State.currentUser.rol);
}

function addAusbildungItem() {
  State.cvDraft = collectCVFormData();
  State.cvDraft.ausbildung.push({ zeitraum: '', beschreibung: '' });
  renderDashboard(State.currentUser.rol);
}

function removeAusbildungItem(index) {
  State.cvDraft = collectCVFormData();
  State.cvDraft.ausbildung.splice(index, 1);
  renderDashboard(State.currentUser.rol);
}

function addSprachenItem() {
  State.cvDraft = collectCVFormData();
  State.cvDraft.sprachen.push({ sprache: '', niveau: '' });
  renderDashboard(State.currentUser.rol);
}

function removeSprachenItem(index) {
  State.cvDraft = collectCVFormData();
  State.cvDraft.sprachen.splice(index, 1);
  renderDashboard(State.currentUser.rol);
}

// ──────────────────────────────────────────────────────────────────
// ★ DASHBOARD 3: PROFESOR
// ──────────────────────────────────────────────────────────────────
function renderProfGrupos() {
  const grupos = DB.getGruposByProfesor(State.currentUser.id);
  return `
    <div class="page-header" style="background:linear-gradient(135deg, var(--theme-sidebar-bg), #3b0764); color:#fff; padding:24px; border-radius:var(--radius-lg); margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--theme-sidebar-text); margin-bottom:4px;">Academia Virtual</div>
        <h1 style="font-size:1.5rem; font-weight:700; margin:0;">Mis Grupos de Clase</h1>
        <p style="font-size:0.875rem; color:var(--theme-sidebar-text); margin-top:4px;">Gestión de cursos de alemán asignados</p>
      </div>
      <div style="text-align:right;">
        <div style="font-size:1.5rem; font-weight:800; color:var(--theme-accent);">${grupos.length}</div>
        <div style="font-size:0.75rem; color:var(--theme-sidebar-text);">Grupos Activos</div>
      </div>
    </div>
    ${grupos.map(g => {
      const inscriptos = DB.getInscripcionesByGrupo(g.id);
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div style="font-size:1rem;font-weight:700;color:var(--slate-900);">${g.nombre}</div>
              <div style="font-size:.8125rem;color:var(--slate-500);">${g.horario} · ${g.modalidad} · <a href="${g.enlace}" target="_blank" style="color:var(--gold-600);">Enlace clase 🔗</a></div>
            </div>
            <span class="badge badge-info">Nivel ${g.nivel}</span>
          </div>
          <div class="card-body" style="padding:0;">
            <table class="data-table">
              <thead><tr><th>Alumno</th><th>País</th><th>Última Nota</th><th>Asistencia</th><th>Estado</th></tr></thead>
              <tbody>
                ${inscriptos.map(i => `
                  <tr>
                    <td><div class="td-avatar"><div class="avatar avatar-sm" style="background:${getAvatarColor(i.candidato?.nombre||'')}">${getInitials(i.candidato?.nombre||'?')}</div><div class="td-name">${i.candidato?.nombre||'Desconocido'}</div></div></td>
                    <td>${i.candidato?.pais||'—'}</td>
                    <td>
                      <span style="font-weight:700;color:${i.nota_ultima>=6?'var(--success)':'var(--danger)'};">${i.nota_ultima}/10</span>
                    </td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px;">
                        <div class="progress-bar-base" style="width:80px;"><div class="progress-fill ${i.asistencia<70?'':'success'}" style="width:${i.asistencia}%;${i.asistencia<70?'background:var(--danger);':''}"></div></div>
                        <span style="font-size:.8125rem;font-weight:700;">${i.asistencia}%</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge ${i.en_riesgo?'badge-danger':'badge-success'}">${i.en_riesgo?'⚠️ En Riesgo':'✅ Al Día'}</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function renderProfCalificaciones() {
  const grupos = DB.getGruposByProfesor(State.currentUser.id);
  return `
    <div class="page-header">
      <div><h1 class="page-title">Calificaciones y Asistencia</h1><p class="page-subtitle">Registro de exámenes A1–C1 y Fachsprachenprüfung</p></div>
    </div>
    ${grupos.map(g => {
      const inscriptos = DB.getInscripcionesByGrupo(g.id);
      return `
        <div class="card">
          <div class="card-header">
            <div style="font-size:1rem;font-weight:700;">${g.nombre}</div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-primary btn-sm" onclick="registrarExamen('${g.id}')">+ Registrar Examen</button>
            </div>
          </div>
          <div class="card-body" style="padding:0;">
            <table class="data-table">
              <thead><tr><th>Alumno</th><th>Especialidad</th><th>Nota Actual</th><th>Asistencia</th><th>Actualizar</th></tr></thead>
              <tbody>
                ${inscriptos.map(i => `
                  <tr>
                    <td class="td-name">${i.candidato?.nombre||'—'}</td>
                    <td>${i.candidato?.especialidad||'—'}</td>
                    <td>
                      <input type="number" min="0" max="10" step="0.1" value="${i.nota_ultima}"
                        style="width:64px;padding:4px 8px;border:1.5px solid var(--slate-300);border-radius:var(--radius-sm);font-weight:700;"
                        id="nota-${i.id}" onchange="updateNota('${i.id}', this.value)">
                    </td>
                    <td>
                      <input type="number" min="0" max="100" value="${i.asistencia}"
                        style="width:64px;padding:4px 8px;border:1.5px solid var(--slate-300);border-radius:var(--radius-sm);"
                        id="asist-${i.id}" onchange="updateAsistencia('${i.id}', this.value)">%
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline" onclick="guardarCalif('${i.id}')">💾</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function updateNota(id, val) { /* actualiza en tiempo real */ }
function updateAsistencia(id, val) { /* actualiza en tiempo real */ }
function guardarCalif(id) {
  const nota = parseFloat($(`nota-${id}`)?.value || 0);
  const asist = parseInt($(`asist-${id}`)?.value || 0);
  const en_riesgo = nota < 6 || asist < 70;
  DB.updateInscripcion(id, { nota_ultima: nota, asistencia: asist, en_riesgo });
  showToast('Calificación guardada', `Nota ${nota}/10 · Asistencia ${asist}%${en_riesgo?' · ⚠️ Marcado en riesgo':''}`, en_riesgo?'warning':'success');
}

function registrarExamen(grupoId) {
  showToast('Nuevo examen', 'Formulario de registro de examen disponible en próxima fase.', 'info');
}

function renderProfAlertas() {
  const inscripciones = DB.get().inscripciones;
  const enRiesgo = inscripciones.filter(i => i.en_riesgo).map(i => {
    const c = DB.getCandidatoById(i.id_candidato);
    const g = DB.getGrupos().find(gg => gg.id === i.id_grupo);
    return { ...i, candidato: c, grupo: g };
  });
  return `
    <div class="page-header">
      <div><h1 class="page-title">Alertas de Rendimiento</h1><p class="page-subtitle">Alumnos con notas bajas o asistencia deficiente</p></div>
    </div>
    ${enRiesgo.length === 0
      ? `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">Sin alertas activas</div><div class="empty-desc">Todos los alumnos están al día.</div></div>`
      : `<div style="display:flex;flex-direction:column;gap:12px;">
          ${enRiesgo.map(a => `
            <div class="card" style="border-left:4px solid var(--danger);">
              <div class="card-body" style="display:flex;align-items:center;gap:16px;">
                <div class="avatar avatar-lg" style="background:${getAvatarColor(a.candidato?.nombre||'')}">${getInitials(a.candidato?.nombre||'?')}</div>
                <div style="flex:1;">
                  <div style="font-size:1rem;font-weight:700;color:var(--slate-900);">${a.candidato?.nombre||'Desconocido'}</div>
                  <div style="font-size:.875rem;color:var(--slate-500);">Grupo: ${a.grupo?.nombre||'—'}</div>
                  <div style="display:flex;gap:8px;margin-top:6px;">
                    ${a.nota_ultima < 6  ? `<span class="badge badge-danger">📉 Nota: ${a.nota_ultima}/10</span>` : ''}
                    ${a.asistencia  < 70 ? `<span class="badge badge-danger">❌ Asist: ${a.asistencia}%</span>` : ''}
                  </div>
                </div>
                <button class="btn btn-outline btn-sm" onclick="notificarAsesorRiesgo('${a.id_candidato}')">📢 Notificar Asesor</button>
              </div>
            </div>
          `).join('')}
        </div>`
    }
  `;
}

function notificarAsesorRiesgo(id_cand) {
  const c = DB.getCandidatoById(id_cand);
  DB.addNotificacion({ id_usuario_dest:'u-asesor-001', tipo:'Alerta_Rendimiento', titulo:'⚠️ Alumno en riesgo', mensaje:`El profesor reporta rendimiento bajo de ${c?.nombre}. Revisar situación.` });
  showToast('Asesor notificado', `Se ha enviado alerta al asesor sobre ${c?.nombre}.`, 'warning');
}

function renderProfMateriales() {
  const grupos = DB.getGruposByProfesor(State.currentUser.id);
  return `
    <div class="page-header">
      <div><h1 class="page-title">Repositorio de Materiales</h1><p class="page-subtitle">Recursos para alumnos: PDFs, ejercicios, guías culturales</p></div>
      <button class="btn btn-primary" onclick="openModal('modal-material')">+ Subir Material</button>
    </div>
    ${grupos.map(g => {
      const mats = DB.getMateriales(g.id);
      const iconsTipo = { PDF:'📄', Ejercicio:'✏️', 'Guía Cultural':'🌍', Video:'🎬', 'Terminología Médica':'🩺', Audio:'🎧', Otro:'📁' };
      return `
        <div class="card">
          <div class="card-header"><div style="font-weight:700;">${g.nombre}</div><span class="badge badge-info">${mats.length} archivos</span></div>
          <div class="card-body">
            ${mats.length===0 ? '<div class="empty-state" style="padding:16px;"><div class="empty-desc">Sin materiales subidos.</div></div>' : ''}
            <div class="doc-grid">
              ${mats.map(m => `
                <div class="doc-card">
                  <div class="doc-card-icon">${iconsTipo[m.tipo]||'📁'}</div>
                  <div class="doc-card-name">${m.titulo}</div>
                  <div style="font-size:.75rem;color:var(--slate-400);">${m.tipo} · ${m.fecha}</div>
                  <div style="margin-top:10px;"><a href="${m.url}" target="_blank" class="btn btn-outline btn-sm w-full" style="width:100%;justify-content:center;">Abrir</a></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('')}

    <div class="modal-overlay" id="modal-material">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">📚 Subir Material</h3>
          <button class="modal-close" onclick="closeModal('modal-material')">✕</button>
        </div>
        <div class="modal-body">
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div class="form-group"><label class="form-label">Título del material</label><input class="form-input" id="mat-titulo" placeholder="Ej: Vocabulario médico B2"></div>
            <div class="form-group"><label class="form-label">Tipo</label>
              <select class="form-select" id="mat-tipo"><option>PDF</option><option>Ejercicio</option><option>Guía Cultural</option><option>Terminología Médica</option><option>Video</option></select>
            </div>
            <div class="form-group"><label class="form-label">Grupo</label>
              <select class="form-select" id="mat-grupo">${grupos.map(g=>`<option value="${g.id}">${g.nombre}</option>`).join('')}</select>
            </div>
            <div class="doc-upload-area" onclick="simulateUpload()">
              <div style="font-size:2rem;margin-bottom:8px;">📎</div>
              <div style="font-weight:600;color:var(--slate-700);">Haz clic para seleccionar archivo</div>
              <div style="font-size:.8125rem;color:var(--slate-400);margin-top:4px;">PDF, DOC, MP4 (máx. 50MB)</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal('modal-material')">Cancelar</button>
          <button class="btn btn-primary" onclick="subirMaterial()">📤 Subir</button>
        </div>
      </div>
    </div>
  `;
}

function subirMaterial() {
  const titulo = $('mat-titulo')?.value.trim();
  const tipo   = $('mat-tipo')?.value;
  const grupo  = $('mat-grupo')?.value;
  if (!titulo) { showToast('Error', 'Introduce un título.', 'error'); return; }
  DB.addMaterial({ id_grupo: grupo, titulo, tipo, url: '#' });
  closeModal('modal-material');
  showToast('Material subido', `"${titulo}" fue compartido con el grupo.`, 'success');
  navigateTo('prof-materiales');
}

function simulateUpload() { showToast('Subida simulada', 'En producción se integrará con almacenamiento seguro en UE (AWS Frankfurt).', 'info'); }

// ──────────────────────────────────────────────────────────────────
// ★ DASHBOARD 4: CANDIDATO
// ──────────────────────────────────────────────────────────────────
function renderCandRoadmap() {
  const userId = State.currentUser.id;
  const cand = DB.getCandidatos().find(c => c.id_usuario === userId) || DB.getCandidatos()[0];
  const steps = [
    { key:'Visa y Migración',   icon:'🛂', desc:'Homologación Anerkennung y trámites consulares.', done:true,    active:false },
    { key:'Idioma Alemán',      icon:'🗣️', desc:'Curso intensivo A1 → C1 / Fachsprachenprüfung.', done:false,   active:true  },
    { key:'Interculturalidad',  icon:'🌍', desc:'Coaching de adaptación sociocultural.', done:false,  active:false },
    { key:'Vida en Alemania',   icon:'🏘️', desc:'Vivienda, empadronamiento, seguros y cuentas.', done:false,active:false }
  ];
  const progreso = Math.round((steps.filter(s=>s.done).length / steps.length) * 100);

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Mi Hoja de Ruta</h1>
        <p class="page-subtitle">Tu plan personalizado de 4 pasos hacia Alemania</p>
      </div>
    </div>

    <!-- Candidato info -->
    <div class="card" style="background:linear-gradient(160deg,var(--theme-sidebar-bg),var(--theme-sidebar-hover));color:#fff;">
      <div class="card-body" style="display:flex;align-items:center;gap:20px;">
        <div class="avatar avatar-lg" style="background:var(--theme-accent);font-size:1.25rem;">${getInitials(cand.nombre)}</div>
        <div style="flex:1;">
          <div style="font-size:1.25rem;font-weight:800;color:#fff;">${cand.nombre}</div>
          <div style="font-size:.9rem;color:var(--slate-400);">${cand.especialidad} · ${cand.pais} ${countryFlag(cand.pais)}</div>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <span class="badge badge-gold">Nivel ${cand.nivel_aleman}</span>
            <span class="badge badge-warning">${cand.estado_proceso}</span>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:2.5rem;font-weight:900;color:var(--theme-accent);">${progreso}%</div>
          <div style="font-size:.8125rem;color:var(--theme-sidebar-text);">Completado</div>
        </div>
      </div>
      <div style="padding:0 24px 24px;">
        <div class="roadmap-bar">
          ${steps.map(s => `<div class="roadmap-segment ${s.done?'done':s.active?'active':''}"></div>`).join('')}
        </div>
      </div>
    </div>

    <div class="roadmap-steps">
      ${steps.map((s,i) => `
        <div class="roadmap-step ${s.done?'done':s.active?'active':'pending'} animate-fadeInUp" style="animation-delay:${i*100}ms;">
          <div class="roadmap-step-icon">${s.icon}</div>
          <div class="roadmap-step-title">Paso ${i+1}: ${s.key}</div>
          <div style="font-size:.8125rem;color:var(--slate-500);line-height:1.5;margin-bottom:10px;">${s.desc}</div>
          <div class="roadmap-step-status">
            ${s.done ? `<span class="badge badge-success">✅ Completado</span>` :
              s.active ? `<span class="badge badge-gold">⚡ En Progreso</span>` :
              `<span class="badge badge-slate">🔒 Pendiente</span>`}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Próximas acciones -->
    <div class="card">
      <div class="card-header"><h3 style="font-size:1rem;font-weight:700;">⚡ Próximas Acciones Requeridas</h3></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--warning-bg);border-radius:var(--radius-md);border-left:3px solid var(--warning);">
          <span style="font-size:1.25rem;">📄</span>
          <div><div style="font-weight:600;color:var(--slate-900);">Corregir Notas Académicas</div><div style="font-size:.8125rem;color:var(--slate-600);">Ver comentario del asesor en la sección de documentos.</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--info-bg);border-radius:var(--radius-md);border-left:3px solid var(--info);">
          <span style="font-size:1.25rem;">🗣️</span>
          <div><div style="font-weight:600;color:var(--slate-900);">Preparar Simulacro B2</div><div style="font-size:.8125rem;color:var(--slate-600);">Tu próximo examen es el 28 de julio. Tu clase es hoy a las 18:00 CET.</div></div>
        </div>
      </div>
    </div>
  `;
}

function renderCandDocumentos() {
  const cand = DB.getCandidatos().find(c => c.id_usuario === State.currentUser.id) || DB.getCandidatos()[0];
  const docs = DB.getDocumentos(cand.id);
  const cats = DB.get().doc_categorias;
  const getEstado = cat => {
    const doc = docs.find(d => d.categoria === cat);
    return doc ? { estado: doc.estado, comentario: doc.comentario, doc } : { estado: 'No subido', comentario:'', doc:null };
  };

  return `
    <div class="page-header">
      <div><h1 class="page-title">Bóveda de Documentos</h1><p class="page-subtitle">Sube y gestiona tus documentos requeridos de forma segura (GDPR)</p></div>
    </div>
    <div style="padding:12px 16px;background:var(--gold-100);border-radius:var(--radius-md);border-left:4px solid var(--gold-600);margin-bottom:8px;">
      <span style="font-size:.875rem;font-weight:600;color:var(--gold-700);">🔒 Todos tus documentos son encriptados y almacenados en servidores seguros en la Unión Europea (Fráncfort). Cumplimiento GDPR/DSGVO garantizado.</span>
    </div>
    <div class="doc-grid">
      ${cats.map(cat => {
        const { estado, comentario, doc } = getEstado(cat.cat);
        const estadoBadge = {
          'Aprobado': 'badge-success', 'Rechazado': 'badge-danger',
          'En Revisión': 'badge-warning', 'Pendiente': 'badge-slate', 'No subido': 'badge-slate'
        }[estado] || 'badge-slate';
        return `
          <div class="doc-card" onclick="uploadDocSimulate('${cand.id}','${cat.cat}')">
            <div class="doc-card-icon">${cat.icono}</div>
            <div class="doc-card-name">${cat.cat}</div>
            <div class="doc-card-status">
              <span class="badge ${estadoBadge}">${estado}</span>
            </div>
            ${comentario ? `<div style="font-size:.75rem;color:var(--danger);text-align:left;margin-bottom:8px;">💬 ${comentario}</div>` : ''}
            ${cat.requerido ? `<div style="font-size:.7rem;color:var(--slate-400);">Obligatorio</div>` : ''}
            <button class="btn btn-outline btn-sm w-full" style="margin-top:8px;width:100%;">
              ${estado==='No subido' ? '⬆️ Subir' : '🔄 Reemplazar'}
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function uploadDocSimulate(candId, categoria) {
  showToast('Simulando subida', `Documento "${categoria}" marcado como "En Revisión". En producción se conectará a un almacenamiento seguro en la UE.`, 'info', 5000);
  const existente = DB.getDocumentos(candId).find(d => d.categoria === categoria);
  if (!existente) {
    DB.addDocumento({ id_candidato: candId, nombre: `${categoria.replace(/\s+/g,'_')}.pdf`, categoria, tamano:'1.5 MB' });
    navigateTo('cand-documentos');
  }
}

function renderCandAula() {
  const grupos = DB.get().grupos;
  const mats   = DB.get().materiales;
  return `
    <div class="page-header">
      <div><h1 class="page-title">Mi Aula Virtual</h1><p class="page-subtitle">Accede a tus clases en vivo y materiales del profesor</p></div>
    </div>
    <div class="grid grid-2">
      ${grupos.slice(0,2).map(g => `
        <div class="card" style="border-top:3px solid var(--gold-500);">
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
              <div>
                <div style="font-size:1rem;font-weight:700;color:var(--slate-900);">${g.nombre}</div>
                <div style="font-size:.8125rem;color:var(--slate-500);">${g.horario}</div>
              </div>
              <span class="badge badge-info">Nivel ${g.nivel}</span>
            </div>
            <div style="display:flex;gap:8px;">
              <a href="${g.enlace}" target="_blank" class="btn btn-primary btn-sm" style="flex:1;justify-content:center;">🎥 Entrar a Clase</a>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="card">
      <div class="card-header"><h3 style="font-size:1rem;font-weight:700;">📚 Materiales Compartidos por el Profesor</h3></div>
      <div class="card-body">
        <div class="doc-grid">
          ${mats.slice(0,6).map(m => `
            <div class="doc-card">
              <div class="doc-card-icon">📄</div>
              <div class="doc-card-name">${m.titulo}</div>
              <div style="font-size:.75rem;color:var(--slate-400);margin-bottom:10px;">${m.tipo} · ${m.fecha}</div>
              <a href="${m.url}" class="btn btn-outline btn-sm w-full" style="width:100%;justify-content:center;">Descargar</a>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderCandOfertas() {
  const matchings   = DB.getMatchings();
  const entrevistas = DB.getEntrevistas();
  return `
    <div class="page-header">
      <div><h1 class="page-title">Mis Ofertas y Entrevistas</h1><p class="page-subtitle">Ofertas asignadas y estado de tus entrevistas con clínicas</p></div>
    </div>
    ${matchings.length===0 && entrevistas.length===0
      ? `<div class="empty-state"><div class="empty-icon">💼</div><div class="empty-title">Sin ofertas asignadas aún</div><div class="empty-desc">Tu asesor te asignará oportunidades laborales cuando completes los requisitos.</div></div>`
      : ''
    }
    ${entrevistas.map(e => `
      <div class="card" style="border-left:4px solid var(--gold-500);">
        <div class="card-body" style="display:flex;align-items:center;gap:20px;">
          <div style="font-size:2.5rem;">📅</div>
          <div style="flex:1;">
            <div style="font-size:1rem;font-weight:700;color:var(--slate-900);">${e.vacante}</div>
            <div style="font-size:.875rem;color:var(--slate-600);">${e.empresa}</div>
            <div style="font-size:.8125rem;color:var(--slate-500);margin-top:4px;">
              📅 ${new Date(e.fecha_propuesta).toLocaleDateString('es-ES',{dateStyle:'long'})} a las ${new Date(e.fecha_propuesta).toLocaleTimeString('es-ES',{timeStyle:'short'})} CET
            </div>
          </div>
          <div>
            <span class="badge ${e.estado==='Confirmada'?'badge-success':e.estado==='Propuesta'?'badge-warning':'badge-slate'}">${e.estado}</span>
            ${e.enlace ? `<div style="margin-top:8px;"><a href="${e.enlace}" target="_blank" class="btn btn-primary btn-sm">🎥 Unirse</a></div>` : ''}
          </div>
        </div>
      </div>
    `).join('')}
  `;
}

// ──────────────────────────────────────────────────────────────────
// ★ DASHBOARD 5: EMPRESA / HOSPITAL
// ──────────────────────────────────────────────────────────────────
function renderEmpCandidatos() {
  const candidatos = DB.getCandidatos().filter(c => ['Postulación','Entrevista Agendada','Trámite Visado'].includes(c.estado_proceso));
  const specialties = [...new Set(candidatos.map(c=>c.especialidad))];
  const levels      = ['B1','B2','C1'];

  return `
    <div class="page-header">
      <div><h1 class="page-title">Buscar Candidatos</h1><p class="page-subtitle">Perfiles anonimizados de talento médico internacional cualificado</p></div>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
      <div class="search-bar" style="flex:1;min-width:200px;"><span class="search-bar-icon">🔍</span>
        <input class="form-input" placeholder="Buscar por especialidad o nivel..." id="blind-search" oninput="filterBlindCards()">
      </div>
      <select class="form-select" style="width:180px;" id="blind-spec" onchange="filterBlindCards()">
        <option value="">Todas las especialidades</option>
        ${specialties.map(s=>`<option value="${s}">${s}</option>`).join('')}
      </select>
      <select class="form-select" style="width:140px;" id="blind-level" onchange="filterBlindCards()">
        <option value="">Cualquier nivel</option>
        ${levels.map(l=>`<option value="${l}">${l}</option>`).join('')}
      </select>
    </div>
    <div style="padding:10px 14px;background:var(--info-bg);border-radius:var(--radius-md);border-left:4px solid var(--info);margin-bottom:20px;">
      <span style="font-size:.875rem;color:#1d4ed8;">🛡️ Los datos de contacto e identidad del candidato son confidenciales hasta formalización del acuerdo comercial con JN Palabras.</span>
    </div>
    <div class="grid grid-3" id="blind-grid">
      ${candidatos.map((c,i) => `
        <div class="blind-card" data-spec="${c.especialidad}" data-level="${c.nivel_aleman}" id="bc-${c.id}">
          <div class="blind-card-id">ID: JNP-${String(i+1).padStart(4,'0')}</div>
          <div class="blind-avatar">${c.especialidad.charAt(0).toUpperCase()}</div>
          <div class="blind-spec">${c.especialidad}</div>
          <div class="blind-meta">Nivel alemán: <strong>${c.nivel_aleman}</strong> · Exp: ${c.anos_exp} años · ${c.pais}</div>
          <div class="blind-tags">
            <span class="badge badge-info">${c.nivel_aleman}</span>
            <span class="badge badge-gold">${c.estado_homologacion}</span>
            <span class="badge badge-slate">${c.anos_exp} años exp.</span>
          </div>
          <div class="blind-video" onclick="playVideo('${c.id}')">
            <div class="blind-video-icon">▶</div>
            <span class="blind-video-text">Video pitch en alemán (60 seg)</span>
          </div>
          <button class="btn btn-primary w-full" style="width:100%;justify-content:center;" onclick="solicitarEntrevista('${c.id}')">📅 Solicitar Entrevista</button>
        </div>
      `).join('')}
    </div>

    <div class="modal-overlay" id="modal-entrevista">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">📅 Solicitar Entrevista</h3>
          <button class="modal-close" onclick="closeModal('modal-entrevista')">✕</button>
        </div>
        <div class="modal-body">
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div class="form-group"><label class="form-label">Fecha propuesta</label>
              <input class="form-input" type="datetime-local" id="ent-fecha" value="${new Date(Date.now()+7*86400000).toISOString().slice(0,16)}"></div>
            <div class="form-group"><label class="form-label">Formato</label>
              <select class="form-select" id="ent-formato"><option>Videollamada</option><option>Presencial</option></select></div>
            <div class="form-group"><label class="form-label">Mensaje al asesor</label>
              <textarea class="form-textarea" id="ent-msg" placeholder="Aspectos a evaluar, disponibilidad adicional..."></textarea></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal('modal-entrevista')">Cancelar</button>
          <button class="btn btn-primary" onclick="confirmarEntrevista()">Enviar Solicitud</button>
        </div>
      </div>
    </div>
  `;
}

let _entrevistaCandId = null;
function playVideo(id) { showToast('Video pitch', 'En producción: video corto del candidato hablando en alemán (anónimo).', 'info'); }
function solicitarEntrevista(id) { _entrevistaCandId = id; openModal('modal-entrevista'); }
function confirmarEntrevista() {
  const fecha = $('ent-fecha')?.value;
  const c = _entrevistaCandId ? DB.getCandidatoById(_entrevistaCandId) : null;
  const emp = DB.get().empresas.find(e => e.id_usuario === State.currentUser.id) || DB.get().empresas[0];
  DB.addEntrevista({ id_matching: 'match-new', fecha_propuesta: fecha, estado:'Propuesta', empresa: emp?.nombre||'Hospital', candidato: c?.nombre||'Candidato', vacante:'Vacante solicitada', enlace:'https://meet.google.com/jnp-entrevista-new' });
  closeModal('modal-entrevista');
  showToast('✅ Entrevista solicitada', 'JN Palabras coordinará la entrevista y confirmará en 24h.', 'success', 5000);
}

function filterBlindCards() {
  const spec  = $('blind-spec')?.value.toLowerCase();
  const level = $('blind-level')?.value.toLowerCase();
  const query = $('blind-search')?.value.toLowerCase();
  $$('#blind-grid .blind-card').forEach(card => {
    const s = card.dataset.spec?.toLowerCase()||'';
    const l = card.dataset.level?.toLowerCase()||'';
    const match = (!spec||s.includes(spec)) && (!level||l===level) && (!query||s.includes(query)||l.includes(query));
    card.style.display = match ? '' : 'none';
  });
}

function renderEmpVacantes() {
  const emp = DB.get().empresas.find(e => e.id_usuario === State.currentUser.id) || DB.get().empresas[0];
  const vacantes = DB.getVacantesByEmpresa(emp.id);
  return `
    <div class="page-header" style="background:linear-gradient(to right, var(--theme-sidebar-bg), #065f46); color:#fff; padding:24px; border-radius:var(--radius-lg); margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--theme-sidebar-text); margin-bottom:4px;">Portal Corporativo</div>
        <h1 style="font-size:1.5rem; font-weight:700; margin:0;">Mis Vacantes</h1>
        <p style="font-size:0.875rem; color:var(--theme-sidebar-text); margin-top:4px;">Gestión de solicitudes de empleo para talento internacional</p>
      </div>
      <button class="btn" style="background:var(--theme-accent); color:var(--theme-btn-primary-text);" onclick="openModal('modal-vacante')">+ Nueva Vacante</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${vacantes.map(v => `
        <div class="card">
          <div class="card-body" style="display:flex;align-items:center;gap:20px;">
            <div style="flex:1;">
              <div style="font-size:1rem;font-weight:700;color:var(--slate-900);">${v.titulo}</div>
              <div style="font-size:.875rem;color:var(--slate-500);">${v.especialidad} · Nivel mín. ${v.nivel_aleman}${v.requiere_fsp?' · FSP requerida':''}</div>
              <div style="font-size:.875rem;color:var(--slate-600);margin-top:4px;">${formatCurrency(v.sueldo_min)}–${formatCurrency(v.sueldo_max)}/mes · ${v.tipo_contrato} · ${v.jornada}</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:1.5rem;font-weight:800;color:var(--gold-600);">${v.vacantes}</div>
              <div style="font-size:.75rem;color:var(--slate-500);">Plaza${v.vacantes>1?'s':''}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
              <span class="badge ${v.estado==='Abierta'?'badge-success':v.estado==='Pausada'?'badge-warning':'badge-slate'}">${v.estado}</span>
              <div style="display:flex;gap:4px;margin-top:4px;">
                <button class="btn btn-outline btn-sm" onclick="toggleVacante('${v.id}','${v.estado}')">
                  ${v.estado==='Abierta'?'⏸ Pausar':'▶ Abrir'}
                </button>
                <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteVacante('${v.id}')">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="modal-overlay" id="modal-vacante">
      <div class="modal" style="max-width:560px;">
        <div class="modal-header">
          <h3 class="modal-title">📋 Nueva Vacante</h3>
          <button class="modal-close" onclick="closeModal('modal-vacante')">✕</button>
        </div>
        <div class="modal-body">
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div class="form-group"><label class="form-label">Título del puesto</label><input class="form-input" id="vac-titulo" placeholder="Ej: Médico de Urgencias"></div>
            <div class="grid grid-2" style="gap:12px;">
              <div class="form-group"><label class="form-label">Especialidad</label>
                <select class="form-select" id="vac-spec">
                  <option>Medicina General</option><option>Cardiología</option><option>Pediatría</option>
                  <option>Anestesiología</option><option>Enfermería UCI</option><option>Neurología</option>
                </select>
              </div>
              <div class="form-group"><label class="form-label">Nivel alemán mínimo</label>
                <select class="form-select" id="vac-nivel"><option>B1</option><option>B2</option><option>C1</option></select>
              </div>
            </div>
            <div class="grid grid-2" style="gap:12px;">
              <div class="form-group"><label class="form-label">Sueldo mín. (€/mes)</label><input class="form-input" type="number" id="vac-smin" placeholder="4000"></div>
              <div class="form-group"><label class="form-label">Sueldo máx. (€/mes)</label><input class="form-input" type="number" id="vac-smax" placeholder="6000"></div>
            </div>
            <div class="grid grid-2" style="gap:12px;">
              <div class="form-group"><label class="form-label">Tipo contrato</label>
                <select class="form-select" id="vac-contrato"><option>Indefinido</option><option>Temporal</option></select>
              </div>
              <div class="form-group"><label class="form-label">Nº plazas</label><input class="form-input" type="number" id="vac-plazas" value="1" min="1"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal('modal-vacante')">Cancelar</button>
          <button class="btn btn-primary" onclick="crearVacante()">Publicar Vacante</button>
        </div>
      </div>
    </div>
  `;
}

function initVacanteForm() {}
function crearVacante() {
  const titulo = $('vac-titulo')?.value.trim();
  if (!titulo) { showToast('Error','El título es requerido.','error'); return; }
  const emp = DB.get().empresas.find(e=>e.id_usuario===State.currentUser.id)||DB.get().empresas[0];
  DB.createVacante({
    id_empresa: emp.id, empresa: emp.nombre, titulo,
    especialidad: $('vac-spec')?.value,
    nivel_aleman: $('vac-nivel')?.value,
    sueldo_min: parseInt($('vac-smin')?.value||0),
    sueldo_max: parseInt($('vac-smax')?.value||0),
    tipo_contrato: $('vac-contrato')?.value,
    jornada: 'Completa',
    vacantes: parseInt($('vac-plazas')?.value||1),
    estado: 'Abierta',
    requiere_fsp: true
  });
  closeModal('modal-vacante');
  showToast('Vacante creada', `"${titulo}" publicada exitosamente.`, 'success');
  navigateTo('emp-vacantes');
}

function toggleVacante(id, estado) {
  const nuevo = estado === 'Abierta' ? 'Pausada' : 'Abierta';
  DB.updateVacante(id, { estado: nuevo });
  showToast('Vacante actualizada', `Estado cambiado a ${nuevo}.`, 'info');
  navigateTo('emp-vacantes');
}

function deleteVacante(id) {
  if (!confirm('¿Eliminar esta vacante?')) return;
  DB.deleteVacante(id);
  showToast('Vacante eliminada', 'La vacante fue eliminada.', 'warning');
  navigateTo('emp-vacantes');
}

function renderEmpEntrevistas() {
  const ents = DB.getEntrevistas();
  return `
    <div class="page-header"><div><h1 class="page-title">Entrevistas</h1><p class="page-subtitle">Entrevistas programadas con candidatos de JN Palabras</p></div></div>
    ${ents.length===0
      ? `<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">Sin entrevistas programadas</div><div class="empty-desc">Solicita entrevistas desde el buscador de candidatos.</div></div>`
      : `<div style="display:flex;flex-direction:column;gap:12px;">${ents.map(e => `
          <div class="card">
            <div class="card-body" style="display:flex;align-items:center;gap:20px;">
              <div style="font-size:2.5rem;">📅</div>
              <div style="flex:1;">
                <div style="font-size:1rem;font-weight:700;">${e.vacante}</div>
                <div style="font-size:.875rem;color:var(--slate-500);">Candidato ID: JNP-0001 · ${e.empresa}</div>
                <div style="font-size:.8125rem;color:var(--slate-400);margin-top:4px;">📅 ${new Date(e.fecha_propuesta).toLocaleString('es-ES')}</div>
              </div>
              <span class="badge ${e.estado==='Confirmada'?'badge-success':'badge-warning'}">${e.estado}</span>
              ${e.enlace?`<a href="${e.enlace}" target="_blank" class="btn btn-primary btn-sm">🎥 Unirse</a>`:''}
            </div>
          </div>
        `).join('')}</div>`
    }
  `;
}

function renderEmpFeedback() {
  return `
    <div class="page-header"><div><h1 class="page-title">Feedback de Entrevistas</h1><p class="page-subtitle">Evalúa a los candidatos entrevistados para ayudar a JN Palabras</p></div></div>
    <div class="card" style="max-width:600px;">
      <div class="card-header"><h3 style="font-size:1rem;font-weight:700;">📝 Formulario de Evaluación</h3></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:16px;">
        <div class="form-group"><label class="form-label">Candidato entrevistado</label>
          <select class="form-select"><option>JNP-0001 – Anestesiólogo Senior</option></select></div>
        <div class="form-group"><label class="form-label">Calificación general (1–5 ⭐)</label>
          <div style="display:flex;gap:8px;" id="star-rating">
            ${[1,2,3,4,5].map(n => `<button onclick="setStars(${n})" id="star-${n}" style="font-size:1.75rem;color:var(--gold-300);background:none;border:none;cursor:pointer;">⭐</button>`).join('')}
          </div>
        </div>
        <div class="form-group"><label class="form-label">Nivel de alemán (impresión)</label>
          <select class="form-select"><option>Excelente (C1)</option><option>Bueno (B2)</option><option>Aceptable (B1)</option><option>Insuficiente</option></select></div>
        <div class="form-group"><label class="form-label">Decisión</label>
          <select class="form-select" id="emp-decision">
            <option>Contratado</option><option>Segunda Entrevista</option><option>Pendiente</option><option>Rechazado</option>
          </select></div>
        <div class="form-group"><label class="form-label">Comentarios (opcional)</label>
          <textarea class="form-textarea" id="emp-feedback-txt" placeholder="Competencias clínicas, comunicación, aptitud cultural..."></textarea></div>
        <button class="btn btn-primary" onclick="enviarFeedback()">Enviar Evaluación</button>
      </div>
    </div>
  `;
}

let _stars = 0;
function setStars(n) { _stars = n; [1,2,3,4,5].forEach(i => $(`star-${i}`).style.color = i<=n?'var(--gold-600)':'var(--gold-200)'); }
function enviarFeedback() { showToast('Evaluación enviada', 'JN Palabras ha sido notificado de tu decisión. ¡Gracias!', 'success', 5000); }

// ──────────────────────────────────────────────────────────────────
// ★ DASHBOARD 6: SOCIOS
// ──────────────────────────────────────────────────────────────────
function renderSocioRegistro() {
  return `
    <div class="page-header" style="background:linear-gradient(to bottom right, var(--theme-sidebar-bg), #7c2d12); color:#fff; padding:24px; border-radius:var(--radius-lg); margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; border-left:4px solid var(--theme-accent);">
      <div>
        <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--theme-sidebar-text); margin-bottom:4px;">Panel de Afiliados</div>
        <h1 style="font-size:1.5rem; font-weight:700; margin:0;">Registrar Candidato</h1>
        <p style="font-size:0.875rem; color:var(--theme-sidebar-text); margin-top:4px;">Introduce manualmente o carga en masa tus candidatos referidos</p>
      </div>
      <div>
        <button class="btn" style="background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2);" onclick="showToast('Enlace Copiado', 'Enlace de referido copiado al portapapeles', 'success')">🔗 Copiar Enlace de Afiliado</button>
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <button class="btn btn-primary" onclick="showTab('tab-manual','tab-masivo')">📝 Registro Manual</button>
      <button class="btn btn-outline" onclick="showTab('tab-masivo','tab-manual')">📊 Carga Masiva Excel</button>
    </div>
    <div id="tab-manual" class="card" style="max-width:680px;">
      <div class="card-header"><h3 style="font-size:1rem;font-weight:700;">📝 Registro Individual de Candidato</h3></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="form-group"><label class="form-label">Nombre completo</label><input class="form-input" id="sc-nombre" placeholder="Nombre completo"></div>
          <div class="form-group"><label class="form-label">País de origen</label><input class="form-input" id="sc-pais" placeholder="Colombia, México..."></div>
          <div class="form-group"><label class="form-label">Especialidad médica</label>
            <select class="form-select" id="sc-spec">
              <option>Medicina General</option><option>Cardiología</option><option>Pediatría</option>
              <option>Anestesiología</option><option>Enfermería UCI</option><option>Neurología</option><option>Otra</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Nivel de alemán actual</label>
            <select class="form-select" id="sc-nivel"><option>Ninguno</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option></select>
          </div>
          <div class="form-group"><label class="form-label">Correo electrónico</label><input class="form-input" type="email" id="sc-email" placeholder="candidato@email.com"></div>
          <div class="form-group"><label class="form-label">Teléfono / WhatsApp</label><input class="form-input" id="sc-tel" placeholder="+57 300 000 0000"></div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Notas adicionales</label>
            <textarea class="form-textarea" id="sc-notas" placeholder="Años de experiencia, certificaciones adicionales, disponibilidad..."></textarea>
          </div>
        </div>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="registrarCandidatoSocio()">✅ Registrar Candidato</button>
      </div>
    </div>
    <div id="tab-masivo" class="card" style="max-width:680px;display:none;">
      <div class="card-header"><h3 style="font-size:1rem;font-weight:700;">📊 Carga Masiva desde Excel</h3></div>
      <div class="card-body">
        <div class="doc-upload-area" onclick="simulateExcelUpload()">
          <div style="font-size:2.5rem;margin-bottom:8px;">📊</div>
          <div style="font-weight:600;color:var(--slate-700);">Arrastra tu archivo Excel (.xlsx) aquí</div>
          <div style="font-size:.8125rem;color:var(--slate-400);margin-top:6px;">Máximo 200 candidatos por archivo</div>
        </div>
        <div style="margin-top:16px;">
          <a href="#" class="btn btn-outline-gold btn-sm" onclick="downloadTemplate()">📥 Descargar Plantilla Excel</a>
        </div>
      </div>
    </div>
  `;
}

function showTab(show, hide) {
  $(show).style.display='block';
  $(hide).style.display='none';
}

function registrarCandidatoSocio() {
  const nombre = $('sc-nombre')?.value.trim();
  const pais   = $('sc-pais')?.value.trim();
  const spec   = $('sc-spec')?.value;
  const nivel  = $('sc-nivel')?.value;
  if (!nombre || !pais) { showToast('Error','Nombre y país son obligatorios.','error'); return; }
  const socio = DB.getSocioByUsuario(State.currentUser.id);
  DB.createCandidato({ nombre, pais, especialidad: spec, nivel_aleman: nivel, estado_proceso:'Lead Nuevo', estado_homologacion:'Pendiente', id_socio: State.currentUser.id, foto: getInitials(nombre), anos_exp: 0 });
  showToast('✅ Candidato registrado', `${nombre} fue enviado a JN Palabras como Lead Nuevo.`, 'success', 5000);
  $('sc-nombre').value=''; $('sc-pais').value='';
}

function simulateExcelUpload() { showToast('Carga Excel', 'La carga masiva por planilla está disponible en la versión con servidor.', 'info'); }
function downloadTemplate()     { showToast('Descarga', 'Plantilla Excel disponible para descarga en producción.', 'info'); }

function renderSocioReferidos() {
  const socio = DB.getSocioByUsuario(State.currentUser.id) || DB.getSocios()[0];
  const referidos = DB.getCandidatosBySocio(State.currentUser.id);
  const stageWidth = { 'Lead Nuevo':15,'Idioma':30,'Homologación':45,'Postulación':60,'Entrevista Agendada':75,'Trámite Visado':88,'Colocado':100 };

  return `
    <div class="page-header">
      <div><h1 class="page-title">Mis Referidos</h1><p class="page-subtitle">Estado en tiempo real de tus candidatos en el pipeline de JN Palabras</p></div>
    </div>
    <div class="grid grid-3" style="margin-bottom:24px;">
      <div class="kpi-card kpi-gold"><div class="kpi-icon">👥</div><div class="kpi-label">Referidos totales</div><div class="kpi-value">${referidos.length}</div></div>
      <div class="kpi-card kpi-success"><div class="kpi-icon">✅</div><div class="kpi-label">Colocados</div><div class="kpi-value">1</div></div>
      <div class="kpi-card kpi-info"><div class="kpi-icon">⏳</div><div class="kpi-label">En proceso</div><div class="kpi-value">${referidos.length-1}</div></div>
    </div>
    <div class="card">
      <div class="card-body" style="padding:0;">
        <div style="display:flex;flex-direction:column;gap:0;">
          ${referidos.map(c => `
            <div class="referral-item" style="border-radius:0;border-bottom:1px solid var(--slate-100);">
              <div class="avatar" style="background:${getAvatarColor(c.nombre)}">${getInitials(c.nombre)}</div>
              <div class="referral-info">
                <div class="referral-name">${c.nombre}</div>
                <div class="referral-spec">${c.especialidad} · ${c.pais}</div>
              </div>
              <div class="referral-progress">
                <div style="font-size:.75rem;font-weight:700;color:var(--slate-700);">${c.estado_proceso}</div>
                <div class="referral-stage-bar">
                  <div class="referral-stage-fill" style="width:${stageWidth[c.estado_proceso]||0}%;"></div>
                </div>
              </div>
              <span class="badge ${c.estado_proceso==='Colocado'?'badge-success':'badge-slate'}">${stageWidth[c.estado_proceso]||0}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderSocioComisiones() {
  const socio = DB.getSocioByUsuario(State.currentUser.id) || DB.getSocios()[0];
  const coms  = DB.getComisionesBySocio(socio.id);
  return `
    <div class="page-header">
      <div><h1 class="page-title">Mis Comisiones</h1><p class="page-subtitle">Transparencia total en tus ganancias por candidatos colocados</p></div>
    </div>
    <div class="grid grid-3" style="margin-bottom:24px;">
      <div class="commission-card" style="grid-column:1/-1;background:linear-gradient(135deg,var(--slate-900),var(--slate-800));">
        <div style="display:flex;gap:40px;flex-wrap:wrap;">
          <div><div class="commission-amount">${formatCurrency(socio.comisiones_acumuladas)}</div><div class="commission-label">Total Acumulado</div></div>
          <div><div class="commission-amount" style="color:var(--success);">${formatCurrency(socio.comisiones_cobradas)}</div><div class="commission-label">Cobrado</div></div>
          <div><div class="commission-amount" style="color:var(--warning);">${formatCurrency(socio.comisiones_pendientes)}</div><div class="commission-label">Pendiente de Cobro</div></div>
          <div><div class="commission-amount" style="color:var(--gold-400);">${socio.porcentaje}%</div><div class="commission-label">Tu % de Comisión</div></div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3 style="font-size:1rem;font-weight:700;">💰 Desglose de Comisiones</h3></div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Candidato</th><th>Empresa</th><th>Monto</th><th>Estado</th><th>Devengado</th><th>Pago</th></tr></thead>
          <tbody>
            ${coms.map(c => `
              <tr>
                <td class="td-name">${c.candidato}</td>
                <td>${c.empresa}</td>
                <td style="font-weight:700;color:var(--gold-600);">${formatCurrency(c.monto)}</td>
                <td><span class="badge ${c.estado==='Pagada'?'badge-success':c.estado==='Devengada'?'badge-warning':'badge-slate'}">${c.estado}</span></td>
                <td>${c.fecha_devengamiento}</td>
                <td>${c.fecha_pago||'Pendiente'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSocioToolkit() {
  const docs = [
    { titulo:'Criterios de Elegibilidad JN Palabras 2025', desc:'Guía de requisitos mínimos para candidatos médicos y de enfermería.', tipo:'PDF', icono:'📋' },
    { titulo:'Guía del Proceso Anerkennung (Homologación)', desc:'Paso a paso del reconocimiento de títulos médicos en Alemania.', tipo:'PDF', icono:'🎓' },
    { titulo:'Niveles de Alemán Requeridos por Especialidad', desc:'Tabla de referencia rápida A1-C1 + FSP por tipo de centro.', tipo:'PDF', icono:'🗣️' },
    { titulo:'Kit de Marketing para Agencias', desc:'Logos, banners y plantillas de redes sociales de JN Palabras.', tipo:'ZIP', icono:'🎨' },
    { titulo:'Contrato Marco de Colaboración', desc:'Plantilla del acuerdo de comisiones y confidencialidad.', tipo:'PDF', icono:'📜' },
    { titulo:'FAQ: Preguntas Frecuentes de Candidatos', desc:'Las 50 preguntas más comunes de médicos interesados en emigrar a Alemania.', tipo:'PDF', icono:'❓' }
  ];
  return `
    <div class="page-header">
      <div><h1 class="page-title">Caja de Herramientas</h1><p class="page-subtitle">Recursos oficiales de JN Palabras para captación efectiva en origen</p></div>
    </div>
    <div class="grid grid-3">
      ${docs.map(d => `
        <div class="card card-hover">
          <div class="card-body">
            <div style="font-size:2.25rem;margin-bottom:12px;">${d.icono}</div>
            <div style="font-size:.9375rem;font-weight:700;color:var(--slate-900);margin-bottom:6px;">${d.titulo}</div>
            <div style="font-size:.8125rem;color:var(--slate-500);line-height:1.6;margin-bottom:16px;">${d.desc}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span class="badge badge-slate">${d.tipo}</span>
              <button class="btn btn-outline-gold btn-sm" onclick="showToast('Descarga','Disponible en producción con servidor de archivos.','info')">⬇️ Descargar</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────────
// TEST DE ELEGIBILIDAD
// ──────────────────────────────────────────────────────────────────
const ELIGIBILITY_QUESTIONS = [
  {
    label:'Paso 1 de 4',
    question:'¿Cuál es tu especialidad o profesión principal?',
    options:[
      { value:'it', label:'Tecnología / IT (Desarrollo, Datos, Sistemas)', icon:'💻' },
      { value:'ingenieria', label:'Ingeniería (Mecánica, Eléctrica, Industrial)', icon:'⚙️' },
      { value:'salud', label:'Salud (Medicina, Enfermería, Terapia)', icon:'🏥' },
      { value:'otro', label:'Otras áreas (Administración, Finanzas, etc.)', icon:'💼' }
    ]
  },
  {
    label:'Paso 2 de 4',
    question:'¿Cuál es tu nivel de alemán actual?',
    options:[
      { value:'b2-c1', label:'B2 o superior (puedo comunicarme con fluidez)', icon:'🗣️' },
      { value:'b1', label:'B1 (nivel intermedio)', icon:'📖' },
      { value:'a1-a2', label:'A1 o A2 (nivel básico)', icon:'📝' },
      { value:'ninguno', label:'Sin conocimientos de alemán todavía', icon:'🔤' }
    ]
  },
  {
    label:'Paso 3 de 4',
    question:'¿En qué estado se encuentra tu título universitario?',
    options:[
      { value:'homologado', label:'Ya está homologado en España / UE', icon:'✅' },
      { value:'en-tramite', label:'En proceso de homologación (Anerkennung)', icon:'⏳' },
      { value:'sin-tramite', label:'No he iniciado el trámite aún', icon:'📋' },
      { value:'desconozco', label:'No conozco el proceso de homologación', icon:'❓' }
    ]
  },
  {
    label:'Paso 4 de 4',
    question:'¿Estás dispuesto/a a vivir y trabajar en Alemania en los próximos 18 meses?',
    options:[
      { value:'si-decidido', label:'Sí, es una prioridad para mí y mi familia', icon:'✈️' },
      { value:'si-dudas', label:'Sí, pero tengo dudas sobre el proceso', icon:'🤔' },
      { value:'explorando', label:'Estoy explorando opciones', icon:'🔭' },
      { value:'no', label:'No por ahora', icon:'❌' }
    ]
  }
];

function initEligibilityTest() {
  State.eligibilityStep = 0;
  State.eligibilityAnswers = {};
  renderEligibilityStep();
}

function renderEligibilityStep() {
  const step = State.eligibilityStep;
  const q    = ELIGIBILITY_QUESTIONS[step];
  const container = $('eligibility-content');
  if (!container || !q) return;

  container.innerHTML = `
    <div class="test-step-label">${q.label}</div>
    <div class="test-question">${q.question}</div>
    <div class="test-options">
      ${q.options.map(opt => `
        <div class="test-option" onclick="selectEligibilityOption('${opt.value}', this)">
          <span class="test-option-icon">${opt.icon}</span>
          <span>${opt.label}</span>
        </div>
      `).join('')}
    </div>
  `;
  // Actualizar barra de progreso
  const segments = $$('#eligibility-progress .test-progress-segment');
  segments.forEach((seg, i) => {
    seg.className = `test-progress-segment${i < step ? ' done' : i === step ? ' active' : ''}`;
  });
}

function selectEligibilityOption(value, el) {
  State.eligibilityAnswers[State.eligibilityStep] = value;
  // Highlight seleccionado
  $$('.test-option').forEach(o => o.classList.remove('selected'));
  if (el) el.classList.add('selected');

  setTimeout(() => {
    State.eligibilityStep++;
    if (State.eligibilityStep >= ELIGIBILITY_QUESTIONS.length) {
      showEligibilityResult();
    } else {
      renderEligibilityStep();
    }
  }, 400);
}

function showEligibilityResult() {
  const ans = State.eligibilityAnswers;
  const isEligible = ans[0] !== 'otro' && ans[3] !== 'no';
  const container  = $('eligibility-content');
  const segments   = $$('#eligibility-progress .test-progress-segment');
  segments.forEach(s => s.className = 'test-progress-segment done');

  if (isEligible) {
    container.innerHTML = `
      <div class="test-result-success">
        <div class="test-result-icon">🎉</div>
        <div class="test-result-title">¡Felicitaciones! Eres elegible</div>
        <div class="test-result-desc">
          Tu perfil cumple los criterios de JN Palabras para iniciar el proceso de emigración médica a Alemania.
          Uno de nuestros asesores se pondrá en contacto contigo en menos de 24 horas hábiles.
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary btn-lg" onclick="openRegistrationModal()">✅ Completar Mi Registro</button>
          <button class="btn btn-outline btn-lg" onclick="initEligibilityTest()">🔄 Reiniciar Test</button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="test-result-success">
        <div class="test-result-icon">💙</div>
        <div class="test-result-title">Por ahora no cumples todos los requisitos</div>
        <div class="test-result-desc">
          No te preocupes. Contáctanos directamente y analizaremos tu caso particular.
          En JN Palabras encontramos soluciones personalizadas para cada perfil profesional.
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary btn-lg" onclick="scrollToSection('contact')">📧 Contactar Asesor</button>
          <button class="btn btn-outline btn-lg" onclick="initEligibilityTest()">🔄 Reiniciar Test</button>
        </div>
      </div>
    `;
  }
}

function openRegistrationModal() {
  openModal('modal-registro-candidato');
}

// ──────────────────────────────────────────────────────────────────
// UTILIDADES WEB PÚBLICA
// ──────────────────────────────────────────────────────────────────
function countryFlag(pais) {
  const flags = { Colombia:'🇨🇴',México:'🇲🇽',Filipinas:'🇵🇭',Siria:'🇸🇾',Brasil:'🇧🇷',Perú:'🇵🇪',Ucrania:'🇺🇦',Argentina:'🇦🇷',España:'🇪🇸',Venezuela:'🇻🇪',Ecuador:'🇪🇨' };
  return flags[pais] || '🌍';
}

function getEstadoColor(estado) {
  return { 'Lead Nuevo':'var(--slate-500)','Idioma':'var(--info)','Homologación':'#8b5cf6','Postulación':'var(--gold-600)','Entrevista Agendada':'#ec4899','Trámite Visado':'var(--info)','Colocado':'var(--success)' }[estado] || 'var(--slate-500)';
}

function scrollToSection(id) {
  const el = $(id) || document.querySelector(`[data-section="${id}"]`);
  if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
}

function handleNavScroll() {
  const nav = $('public-nav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
}

function acceptGdpr() {
  $('gdpr-banner')?.remove();
  localStorage.setItem('jnp_gdpr', '1');
}

function rejectGdpr() {
  $('gdpr-banner')?.remove();
  showToast('GDPR', 'Solo se usarán cookies estrictamente necesarias.', 'info');
  localStorage.setItem('jnp_gdpr', '0');
}

// ──────────────────────────────────────────────────────────────────
// MODAL REGISTRO CANDIDATO (desde web pública)
// ──────────────────────────────────────────────────────────────────
function submitRegistration(e) {
  e?.preventDefault();
  const nombre = $('reg-nombre')?.value.trim();
  const pais   = $('reg-pais')?.value.trim();
  const correo = $('reg-correo')?.value.trim();
  const spec   = $('reg-spec')?.value;
  if (!nombre || !correo || !pais) { showToast('Error','Por favor completa todos los campos requeridos.','error'); return; }
  DB.createCandidato({ nombre, pais, especialidad:spec, nivel_aleman:$('reg-nivel')?.value||'Ninguno', estado_proceso:'Lead Nuevo', estado_homologacion:'Pendiente', foto: getInitials(nombre), anos_exp:0 });
  closeModal('modal-registro-candidato');
  showToast('🎉 ¡Registro exitoso!', `Bienvenido/a ${nombre.split(' ')[0]}! Tu asesor te contactará en 24h.`, 'success', 7000);
}

// ──────────────────────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();

  // Check sesión activa
  const session = DB.getSession();
  if (session) {
    State.currentUser = session;
    showApp();
  } else {
    showPublic();
  }

  // Navegación pública
  window.addEventListener('scroll', handleNavScroll);

  // Login form
  $('login-form')?.addEventListener('submit', handleLogin);

  // GDPR banner
  if (!localStorage.getItem('jnp_gdpr')) {
    $('gdpr-banner')?.classList.remove('hidden');
  } else {
    $('gdpr-banner')?.remove();
  }

  // Inicializar test de elegibilidad
  initEligibilityTest();

  // Smooth anchor links
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) { e.preventDefault(); el.scrollIntoView({behavior:'smooth'}); }
    });
  });

  // Cerrar modales con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && State.modalOpen) closeModal(State.modalOpen);
  });
});

// EXPOSE TO GLOBAL SCOPE FOR INLINE HTML HANDLERS
window.showLogin = showLogin;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.scrollToSection = scrollToSection;
window.showPublic = showPublic;
window.openModal = openModal;
window.closeModal = closeModal;
window.acceptGdpr = acceptGdpr;
window.rejectGdpr = rejectGdpr;
window.showToast = showToast;
window.submitRegistration = submitRegistration;
window.navigateTo = navigateTo;
window.toggleNotifPanel = toggleNotifPanel;
window.marcarNotifLeidas = marcarNotifLeidas;
window.showTab = showTab;
window.filterBlindCards = filterBlindCards;
window.initEligibilityTest = initEligibilityTest;
window.selectEligibilityOption = selectEligibilityOption;
window.openRegistrationModal = openRegistrationModal;
// Dashboard inline handlers
window.editUser = editUser;
window.deleteUser = deleteUser;
window.createUser = createUser;
window.filterTable = filterTable;
window.saveCms = saveCms;
window.openCandidateDetail = openCandidateDetail;
window.reviewDoc = reviewDoc;
window.showRejectModal = showRejectModal;
window.addQuickNote = addQuickNote;
window.selectMatchCand = selectMatchCand;
window.selectMatchVac = selectMatchVac;
window.ejecutarMatch = ejecutarMatch;
window.notificarAsesorRiesgo = notificarAsesorRiesgo;
window.guardarCalif = guardarCalif;
window.registrarExamen = registrarExamen;
window.subirMaterial = subirMaterial;
window.simulateUpload = simulateUpload;
window.uploadDocSimulate = uploadDocSimulate;
window.playVideo = playVideo;
window.solicitarEntrevista = solicitarEntrevista;
window.confirmarEntrevista = confirmarEntrevista;
window.toggleVacante = toggleVacante;
window.deleteVacante = deleteVacante;
window.crearVacante = crearVacante;
window.setStars = setStars;
window.enviarFeedback = enviarFeedback;
window.registrarCandidatoSocio = registrarCandidatoSocio;
window.simulateExcelUpload = simulateExcelUpload;
window.downloadTemplate = downloadTemplate;
// CV Builder handlers
window.openCVForCandidate = openCVForCandidate;
window.switchCVTab = switchCVTab;
window.saveCVForm = saveCVForm;
window.selectCandidateForCV = selectCandidateForCV;
window.createNewCandidateCV = createNewCandidateCV;
window.printLebenslauf = printLebenslauf;
window.handleCvPhotoUpload = handleCvPhotoUpload;
window.addWerdegangItem = addWerdegangItem;
window.removeWerdegangItem = removeWerdegangItem;
window.addAusbildungItem = addAusbildungItem;
window.removeAusbildungItem = removeAusbildungItem;
window.addSprachenItem = addSprachenItem;
window.removeSprachenItem = removeSprachenItem;

