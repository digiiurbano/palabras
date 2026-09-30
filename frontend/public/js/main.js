/**
 * JN PALABRAS - APP.JS
 * Controlador principal: enrutador SPA, 6 dashboards, test de elegibilidad,
 * Kanban Drag & Drop, notificaciones, matching y toda la lógica de interfaz.
 */



// ──────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────
// GUÍAS POR FASE (CHECKLISTS)
// ──────────────────────────────────────────────────────────────────
const PHASE_GUIDES = {
  'Lead Nuevo': [
    'Revisión inicial del CV y respuestas del test',
    'Asignación a un asesor de reclutamiento'
  ],
  '1er contacto, reclutamiento': [
    'Agendar y realizar llamada de primer contacto',
    'Explicar el proceso general y costos',
    'Solicitar documentación básica (Pasaporte, Títulos)'
  ],
  'Suficiencia del idioma': [
    'Evaluar nivel actual de alemán',
    'Inscripción en curso de alemán (si aplica)',
    'Obtener certificado B2 de alemán'
  ],
  'Entrevista Laboral y firma del contrato': [
    'Preparación para entrevista',
    'Agendar entrevista con empleador alemán',
    'Revisión y firma del contrato laboral'
  ],
  'Procesamiento de visa': [
    'Reunir documentos para visado',
    'Solicitar cita en la embajada',
    'Obtener aprobación de visa'
  ],
  'Fase Pre viaje': [
    'Comprar pasajes aéreos',
    'Organizar alojamiento inicial en Alemania',
    'Sesión de orientación pre-viaje'
  ],
  'En Destino': [
    'Llegada a Alemania y traslado al alojamiento',
    'Registro en la ciudad (Anmeldung)',
    'Abrir cuenta bancaria y seguro médico'
  ],
  'Inserción exitosa': [
    'Inicio de labores en el empleador',
    'Firma del acta de finalización del proceso',
    'Seguimiento a 1 mes de inicio'
  ]
};

window.togglePhaseChecklist = function(candidatoId, fase, index) {
  const c = DB.getCandidatoById(candidatoId);
  if (!c) return;
  if (!c.fase_checklists) c.fase_checklists = {};
  if (!c.fase_checklists[fase]) c.fase_checklists[fase] = [];
  
  c.fase_checklists[fase][index] = !c.fase_checklists[fase][index];
  DB.updateCandidato(candidatoId, { fase_checklists: c.fase_checklists });
  openCandidateDetail(candidatoId); // re-render
};

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
  kanbanView: 'kanban', // 'kanban' | 'list'
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

function formatDateTime(dateStr) {
  if (!dateStr || dateStr === '—' || dateStr === 'Pendiente') return dateStr || '—';
  try {
    const str = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-');
      return `${d}/${m}/${y}`;
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    const pad = n => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
}
window.formatDateTime = formatDateTime;

function formatDateOnly(dateStr) {
  if (!dateStr || dateStr === '—' || dateStr === 'Pendiente') return 'Oct 2023';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return 'Oct 2023';
  }
}
window.formatDateOnly = formatDateOnly;

function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style:'currency', currency, maximumFractionDigits:0 }).format(amount);
}

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).slice(0,2).map(n => n[0]).join('').toUpperCase();
}

function getAvatarColor(name) {
  if (!name) return '#0f172a';
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
  if (overlay) { 
    overlay.classList.add('visible'); 
    overlay.classList.add('open');
    State.modalOpen = id; 
  }
}

function closeModal(id) {
  const overlay = $(id);
  if (overlay) { 
    overlay.classList.remove('visible'); 
    overlay.classList.remove('open');
    State.modalOpen = null; 
    if (id && (id.startsWith('modal-add-candidate') || id.startsWith('modal-chat') || id.startsWith('modal-schedule') || id.startsWith('modal-candidate-dossier') || id.startsWith('modal-edit-candidate'))) {
      overlay.remove();
    }
  }
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
  try {
    localStorage.setItem('jnp_current_view', 'public');
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && typeof getRoleForView === 'function' && getRoleForView(hash)) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  } catch(e) {}
  
  const loginBtn = $('nav-login-btn');
  if (loginBtn) {
    if (State.currentUser) {
      loginBtn.textContent = 'Mi Perfil';
      loginBtn.onclick = () => showApp();
    } else {
      loginBtn.textContent = 'Iniciar Sesión';
      loginBtn.onclick = showLogin;
    }
  }
}

function showLogin() {
  $('public-site').style.display = 'none';
  $('app-shell').classList.remove('active');
  $('login-screen').classList.add('active');
  document.body.className = '';
  State.currentView = 'login';
  try {
    localStorage.setItem('jnp_current_view', 'login');
    if (window.location.hash !== '#login') {
      window.history.replaceState(null, '', '#login');
    }
  } catch(e) {}
}

function showApp(view = null) {
  $('public-site').style.display = 'none';
  $('login-screen').classList.remove('active');
  $('app-shell').classList.add('active');
  State.currentView = 'app';
  try {
    localStorage.setItem('jnp_current_view', 'app');
  } catch(e) {}
  renderAppShell(view);
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
    if (user && !State.activeRole) State.activeRole = (user.roles && user.roles.length > 0) ? user.roles[0] : 'Candidato';
    State.currentSidebar = null;
    try {
      localStorage.setItem('jnp_active_role', State.activeRole);
      localStorage.removeItem('jnp_current_sidebar');
    } catch(e) {}
    DB.setSession(user);
    showToast('Bienvenido/a', `Hola ${user.nombre.split(' ')[0]}! Has iniciado sesión como ${State.activeRole}.`, 'success');
    showApp();
  } else {
    showToast('Error de acceso', 'Correo o contraseña incorrectos.', 'error');
    $('login-email').style.borderColor = 'var(--danger)';
  }
}

function handleLogout() {
  State.currentUser = null;
  State.activeRole = null;
  State.currentSidebar = null;
  try {
    localStorage.removeItem('jnp_current_sidebar');
    localStorage.removeItem('jnp_active_role');
    localStorage.removeItem('jnp_current_view');
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
  } catch(e) {}
  DB.clearSession();
  showPublic();
  showToast('Sesión cerrada', 'Has cerrado sesión exitosamente.', 'info');
}

function editProfile() {
  const user = State.currentUser;
  if (!user) return;
  
  const elId = $('ep-id');
  const elNombre = $('ep-nombre');
  const elCorreo = $('ep-correo');
  const elPass = $('ep-pass');
  if (elId) elId.value = user.id;
  if (elNombre) elNombre.value = user.nombre || '';
  if (elCorreo) elCorreo.value = user.correo || '';
  if (elPass) elPass.value = '';
  
  openModal('modal-edit-profile');
}

async function saveProfile() {
  const id = $('ep-id').value;
  const nombre = $('ep-nombre').value.trim();
  const correo = $('ep-correo').value.trim();
  const pass = $('ep-pass').value.trim();
  
  if (!nombre || !correo) {
    showToast('Error', 'Completa los campos obligatorios.', 'error');
    return;
  }
  
  const updateData = { nombre, correo };
  if (pass) updateData.contrasena = pass;
  
  try {
    const updated = await DB.updateUsuario(id, updateData);
    if (updated && typeof updated === 'object') {
      State.currentUser = { ...State.currentUser, ...updated, nombre, correo };
    } else {
      State.currentUser.nombre = nombre;
      State.currentUser.correo = correo;
    }
    if (pass) State.currentUser.contrasena = pass;
    DB.setSession(State.currentUser);
    
    closeModal('modal-edit-profile');
    showToast('Éxito', 'Perfil actualizado correctamente.', 'success');
    renderAppShell();
  } catch(e) {
    console.error(e);
    showToast('Error', 'Ocurrió un error al actualizar el perfil.', 'error');
  }
}

// ──────────────────────────────────────────────────────────────────
// APP SHELL RENDER
// ──────────────────────────────────────────────────────────────────
function renderAppShell(view = null) {
  const user = State.currentUser;
  if (!user) { showLogin(); return; }

  ensureNotifClickListener();

  // Configurar Tema Visual por Rol
  document.body.className = `theme-${State.activeRole.toLowerCase().replace(/\s+/g, '-')}`;

  // Header
  const notifCount = DB.getNotifNoLeidas(user.id);
  const userRolesList = (Array.isArray(user?.roles) && user.roles.length > 0)
    ? user.roles
    : (user?.rol ? [user.rol] : [State.activeRole || 'Candidato']);

  const allRolesMeta = [
    { rol: 'Admin', icon: '🛡️' },
    { rol: 'Super Asesor', icon: '⭐' },
    { rol: 'Asesor', icon: '👨‍💼' },
    { rol: 'Profesor', icon: '🎓' },
    { rol: 'Candidato', icon: '🩺' },
    { rol: 'Empresa', icon: '🏥' },
    { rol: 'Socio', icon: '🤝' }
  ];

  const isAdmin = userRolesList.includes('Admin');
  let availableRoleOptions = isAdmin
    ? allRolesMeta
    : allRolesMeta.filter(r => userRolesList.includes(r.rol));

  if (availableRoleOptions.length === 0) {
    availableRoleOptions = [{ rol: State.activeRole || 'Candidato', icon: getRolIcon(State.activeRole) }];
  } else if (State.activeRole && !availableRoleOptions.some(r => r.rol === State.activeRole)) {
    const meta = allRolesMeta.find(r => r.rol === State.activeRole);
    availableRoleOptions.push(meta || { rol: State.activeRole, icon: getRolIcon(State.activeRole) });
  }

  $('app-header-content').innerHTML = `
    <div class="app-logo" onclick="navigateTo(SIDEBAR_MENUS[State.activeRole][0].id)" style="cursor: pointer;" aria-label="Ir al inicio del dashboard">
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
      <!-- Usuario con selector de rol desplegable personalizado -->
      <div class="role-switcher-container" style="position:relative;">
        <div class="role-switcher" onclick="toggleRoleDropdown(event)" title="Cambiar rol activo" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding:5px 12px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; transition:all 0.2s ease;">
          <div class="role-avatar" style="background:${getAvatarColor(user.nombre)}; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:0.75rem;">
            ${getInitials(user.nombre)}
          </div>
          <div class="role-info" style="display:flex; flex-direction:column; text-align:left;">
            <div class="role-name" style="font-size:0.8125rem; font-weight:700; color:#0f172a; line-height:1.1;">
              ${user.nombre.length > 22 ? user.nombre.split(' ').slice(0,2).join(' ') : user.nombre}
            </div>
            <div class="role-label" style="font-size:0.725rem; font-weight:600; color:#0284c7; display:flex; align-items:center; gap:3px;">
              <span>${getRolIcon(State.activeRole)} ${State.activeRole}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        <div id="custom-role-dropdown" class="custom-role-dropdown">
          <div style="font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; padding:4px 8px 4px 8px;">
            Cambiar Rol Activo
          </div>
          ${availableRoleOptions.map(r => `
            <div class="role-dropdown-item ${r.rol === State.activeRole ? 'active' : ''}" 
                 onclick="selectRoleFromDropdown('${r.rol}', event)" 
                 style="display:flex; align-items:center; justify-content:space-between; padding:7px 10px; border-radius:8px; cursor:pointer; font-size:0.8125rem; font-weight:600; color:${r.rol === State.activeRole ? '#0284c7' : '#334155'}; background:${r.rol === State.activeRole ? '#f0f9ff' : 'transparent'}; transition:all 0.15s ease;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:0.95rem;">${r.icon}</span>
                <span>${r.rol}</span>
              </div>
              ${r.rol === State.activeRole ? `<span style="font-weight:800; color:#0284c7;">✓</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      <div style="display:flex;gap:4px;">
        <button onclick="editProfile()" class="btn btn-outline btn-sm">Editar Perfil</button>
        <button onclick="handleLogout()" class="btn btn-outline btn-sm">Salir</button>
      </div>
    </div>
  `;

  // Sidebar + contenido
  renderSidebar(State.activeRole);
  renderDashboard(State.activeRole, view || State.currentSidebar);
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
  return getIcon(rol) || getIcon(rol ? rol.replace(/\s+/g, '_') : '') || getIcon('Candidato');
}

function getRolColor(rol) {
  return { 
    Admin: 'var(--gold-600)',
    'Super Asesor': '#0284c7',
    Super_Asesor: '#0284c7',
    Asesor: 'var(--info)',
    Profesor: '#8b5cf6',
    Candidato: 'var(--success)',
    Empresa: 'var(--slate-600)',
    Socio: '#ec4899' 
  }[rol] || '#0284c7';
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
  'Super Asesor': [
    { id:'super-leads',       icon: getIcon('newTag'),   label:'Bandeja de Leads'     },
    { id:'super-kanban',      icon: getIcon('Asesor'),   label:'Kanban General'       },
    { id:'super-asesores',    icon: getIcon('network'),  label:'Equipo de Asesores'   },
    { id:'super-candidatos',  icon: getIcon('Candidato'),label:'Todos los Candidatos' },
    { id:'super-matching',    icon: getIcon('search'),   label:'Matching IA'          },
  ],
  Asesor: [
    { id:'asesor-dashboard',  icon: getIcon('layout'),    label:'Dashboard'                           },
    { id:'asesor-kanban',     icon: getIcon('users'),     label:'Candidatos (Pipeline)'               },
    { id:'asesor-base-datos', icon: getIcon('Admin'),     label:'Base de Datos & Expedientes'         },
    { id:'asesor-cv-builder', icon: getIcon('fileText'),  label:'Hojas de Vida (CV) & Documentos'     },
    { id:'asesor-matching',   icon: getIcon('search'),    label:'Matching IA'                         },
    { id:'asesor-notas',      icon: getIcon('clipboard'), label:'Notas de Seguimiento'                },
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

function getRoleForView(viewId) {
  if (!viewId) return null;
  for (const [role, items] of Object.entries(SIDEBAR_MENUS)) {
    if (items.some(item => item.id === viewId)) {
      return role;
    }
  }
  return null;
}

function renderSidebar(rol) {
  const user = State.currentUser;
  const items = SIDEBAR_MENUS[rol] || [];
  const firstItem = items[0]?.id;
  const itemIds = items.map(i => i.id);
  if (!State.currentSidebar || !itemIds.includes(State.currentSidebar)) {
    State.currentSidebar = firstItem;
  }

  $('sidebar-content').innerHTML = `
    <div class="sidebar-section" style="margin-top: var(--space-4);">
      <div class="sidebar-label" style="color: rgba(255,255,255,0.5);">${rol}</div>
      ${items.map(item => `
        <div class="sidebar-link ${State.currentSidebar === item.id ? 'active' : ''}"
             onclick="navigateTo('${item.id}')">
          <span class="sidebar-icon" style="display:inline-flex;align-items:center;">${item.icon}</span>
          ${item.label}
        </div>
      `).join('')}
    </div>
    
    <div style="margin-top:auto; display:flex; flex-direction:column;">
      <!-- Perfil inferior -->
      <div class="sidebar-profile">
        <div class="sidebar-profile-avatar" style="background:${getAvatarColor(user ? user.nombre : '')}">${user ? getInitials(user.nombre) : 'U'}</div>
        <div class="sidebar-profile-info">
          <span class="sidebar-profile-name">${user ? (user.nombre.includes('Admin') ? 'Admin JN' : user.nombre.split(' ')[0]) : 'Usuario'}</span>
          <span class="sidebar-profile-role">${rol}</span>
        </div>
      </div>
    </div>
  `;
}

function navigateTo(id) {
  if (!id) return;
  State.currentSidebar = id;
  const roleForId = getRoleForView(id);
  if (roleForId && State.currentUser) {
    const userRoles = State.currentUser.roles || [];
    if (userRoles.includes(roleForId) || userRoles.includes('Admin')) {
      State.activeRole = roleForId;
      try { localStorage.setItem('jnp_active_role', roleForId); } catch(e) {}
    }
  }
  try {
    localStorage.setItem('jnp_current_sidebar', id);
    localStorage.setItem('jnp_current_view', 'app');
    if (window.location.hash !== '#' + id) {
      window.history.replaceState(null, '', '#' + id);
    }
  } catch(e) {}
  renderSidebar(State.activeRole);
  renderDashboard(State.activeRole, id);
}

// ──────────────────────────────────────────────────────────────────
// DASHBOARD ROUTER
// ──────────────────────────────────────────────────────────────────
async function renderDashboard(rol, view = null) {
  const allowedViews = SIDEBAR_MENUS[rol]?.map(menu => menu.id) || [];
  const hashView = window.location.hash.replace('#', '').trim();
  const savedView = localStorage.getItem('jnp_current_sidebar');

  let id = view || State.currentSidebar;
  if (!id || (!allowedViews.includes(id) && id !== 'candidato-perfil')) {
    if (hashView && (allowedViews.includes(hashView) || hashView === 'candidato-perfil')) id = hashView;
    else if (savedView && (allowedViews.includes(savedView) || savedView === 'candidato-perfil')) id = savedView;
    else id = allowedViews[0];
  }

  State.currentSidebar = id;
  try {
    localStorage.setItem('jnp_current_sidebar', id);
    localStorage.setItem('jnp_active_role', rol);
    localStorage.setItem('jnp_current_view', 'app');
    if (window.location.hash !== '#' + id) {
      window.history.replaceState(null, '', '#' + id);
    }
  } catch(e) {}

  const container = $('main-content');
  if (!container) return;

  const renders = {
    // Vista Estándar del Perfil del Candidato (Universal)
    'candidato-perfil': renderCandidateProfilePage,
    // Admin
    'admin-overview':   renderAdminOverview,
    'admin-users':      renderAdminUsers,
    'admin-candidatos': renderAdminCandidatos,
    'admin-cms':        renderAdminCms,
    'admin-comisiones': renderAdminComisiones,
    'admin-empresas':   renderAdminEmpresas,
    // Super Asesor
    'super-leads':      renderSuperLeads,
    'super-kanban':     renderSuperKanban,
    'super-asesores':   renderSuperAsesores,
    'super-candidatos': renderAdminCandidatos,
    'super-matching':   renderAsesorMatching,
    // Asesor
    'asesor-dashboard':   renderAsesorDashboard,
    'asesor-kanban':      renderAsesorKanban,
    'asesor-base-datos':  renderAdminCandidatos,
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
    try {
      const html = await fn();
      container.innerHTML = '<div class="animate-fadeInUp">' + html + '</div>';
      // Post-render hooks
      if (id === 'asesor-dashboard' || id === 'asesor-kanban' || id === 'super-kanban') initKanban();
      if (id === 'emp-vacantes')  initVacanteForm();
      if (id === 'admin-users')   initUserForm();
    } catch (e) {
      console.error("Error renderizando vista:", e);
      container.innerHTML = `<div class="p-8 text-center text-[var(--danger)]">Error al cargar la vista.</div>`;
    }
  }
}

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
  if (State.activeRole !== 'Admin') {
    return `<div class="p-8 text-center text-[var(--danger)]">Acceso denegado. Se requieren privilegios de Administrador.</div>`;
  }
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
                <td>
                  <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${(u.roles || []).map(r => `<span class="badge" style="background:${getRolColor(r)}22;color:${getRolColor(r)}">${getRolIcon(r)} ${r}</span>`).join('')}
                  </div>
                </td>
                <td><span class="badge ${u.activo?'badge-success':'badge-slate'}">${u.activo?'Activo':'Inactivo'}</span></td>
                <td>${formatDateTime(u.fecha_creacion)}</td>
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
              <label class="form-label">Roles (Selecciona uno o más)</label>
              <div style="display:flex;flex-wrap:wrap;gap:10px;">
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="nu-rol" value="Admin"> Admin</label>
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="nu-rol" value="Super Asesor"> Super Asesor</label>
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="nu-rol" value="Asesor"> Asesor</label>
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="nu-rol" value="Profesor"> Profesor</label>
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="nu-rol" value="Candidato"> Candidato</label>
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="nu-rol" value="Empresa" onchange="toggleRoleFields('nu')"> Empresa</label>
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="nu-rol" value="Socio" onchange="toggleRoleFields('nu')"> Socio</label>
              </div>
            </div>

            <!-- Campos dinámicos para Empresa -->
            <div id="nu-empresa-fields" style="display:none; padding:10px; background:#f8fafc; border-radius:6px; margin-top:10px; flex-direction:column;">
              <h4 style="margin:0 0 10px 0; font-size:14px; color:#334155;">🏢 Datos de la Institución / Clínica</h4>
              <input class="form-input" id="nu-empresa-nombre" placeholder="Nombre de la Clínica/Hospital" style="margin-bottom:8px">
              <select class="form-input" id="nu-empresa-tipo" style="margin-bottom:8px">
                <option value="">Tipo de Centro...</option>
                <option value="Hospital_Universitario">Hospital Universitario</option>
                <option value="Clinica_Privada">Clínica Privada</option>
                <option value="Centro_Medico">Centro Médico</option>
                <option value="Residencia">Residencia</option>
                <option value="Otro">Otro</option>
              </select>
              <input class="form-input" id="nu-empresa-region" placeholder="Región (Ej. Bayern)" style="margin-bottom:8px">
              <input class="form-input" id="nu-empresa-ciudad" placeholder="Ciudad" style="margin-bottom:8px">
              <input class="form-input" id="nu-empresa-telefono" placeholder="Teléfono Institucional">
            </div>

            <!-- Campos dinámicos para Socio -->
            <div id="nu-socio-fields" style="display:none; padding:10px; background:#f0fdf4; border-radius:6px; margin-top:10px; flex-direction:column;">
              <h4 style="margin:0 0 10px 0; font-size:14px; color:#166534;">🤝 Datos de la Agencia Aliada</h4>
              <input class="form-input" id="nu-socio-nombre" placeholder="Nombre de la Agencia" style="margin-bottom:8px">
              <input class="form-input" id="nu-socio-pais" placeholder="País de Operación" style="margin-bottom:8px">
              <input class="form-input" type="number" id="nu-socio-comision" placeholder="% Comisión (Ej. 10)" step="0.01" style="margin-bottom:8px">
              <input class="form-input" id="nu-socio-telefono" placeholder="Teléfono Institucional">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal('modal-new-user')">Cancelar</button>
          <button class="btn btn-primary" onclick="createUser()">Crear Usuario</button>
        </div>
      </div>
    </div>

    <!-- Modal Editar Usuario -->
    <div class="modal-overlay" id="modal-edit-user">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">✏️ Editar Usuario</h3>
          <button class="modal-close" onclick="closeModal('modal-edit-user')">✕</button>
        </div>
        <div class="modal-body">
          <form id="edit-user-form" style="display:flex;flex-direction:column;gap:16px;">
            <input type="hidden" id="eu-id">
            <div class="form-group">
              <label class="form-label">Nombre completo</label>
              <input class="form-input" id="eu-nombre" placeholder="Nombre y apellidos" required>
            </div>
            <div class="form-group">
              <label class="form-label">Correo electrónico</label>
              <input class="form-input" type="email" id="eu-correo" placeholder="correo@ejemplo.com" required>
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña (Opcional)</label>
              <input class="form-input" id="eu-pass" placeholder="Dejar en blanco para mantener la actual">
            </div>
            <div class="form-group">
              <label class="form-label">Roles (Selecciona uno o más)</label>
              <div style="display:flex;flex-wrap:wrap;gap:10px;">
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="eu-rol" value="Admin"> Admin</label>
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="eu-rol" value="Super Asesor"> Super Asesor</label>
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="eu-rol" value="Asesor"> Asesor</label>
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="eu-rol" value="Profesor"> Profesor</label>
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="eu-rol" value="Candidato"> Candidato</label>
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="eu-rol" value="Empresa" onchange="toggleRoleFields('eu')"> Empresa</label>
                <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" name="eu-rol" value="Socio" onchange="toggleRoleFields('eu')"> Socio</label>
              </div>
            </div>

            <!-- Campos dinámicos para Empresa -->
            <div id="eu-empresa-fields" style="display:none; padding:10px; background:#f8fafc; border-radius:6px; margin-top:10px; flex-direction:column;">
              <h4 style="margin:0 0 10px 0; font-size:14px; color:#334155;">🏢 Datos de la Institución / Clínica</h4>
              <input class="form-input" id="eu-empresa-nombre" placeholder="Nombre de la Clínica/Hospital" style="margin-bottom:8px">
              <select class="form-input" id="eu-empresa-tipo" style="margin-bottom:8px">
                <option value="">Tipo de Centro...</option>
                <option value="Hospital_Universitario">Hospital Universitario</option>
                <option value="Clinica_Privada">Clínica Privada</option>
                <option value="Centro_Medico">Centro Médico</option>
                <option value="Residencia">Residencia</option>
                <option value="Otro">Otro</option>
              </select>
              <input class="form-input" id="eu-empresa-region" placeholder="Región (Ej. Bayern)" style="margin-bottom:8px">
              <input class="form-input" id="eu-empresa-ciudad" placeholder="Ciudad" style="margin-bottom:8px">
              <input class="form-input" id="eu-empresa-telefono" placeholder="Teléfono Institucional">
            </div>

            <!-- Campos dinámicos para Socio -->
            <div id="eu-socio-fields" style="display:none; padding:10px; background:#f0fdf4; border-radius:6px; margin-top:10px; flex-direction:column;">
              <h4 style="margin:0 0 10px 0; font-size:14px; color:#166534;">🤝 Datos de la Agencia Aliada</h4>
              <input class="form-input" id="eu-socio-nombre" placeholder="Nombre de la Agencia" style="margin-bottom:8px">
              <input class="form-input" id="eu-socio-pais" placeholder="País de Operación" style="margin-bottom:8px">
              <input class="form-input" type="number" id="eu-socio-comision" placeholder="% Comisión (Ej. 10)" step="0.01" style="margin-bottom:8px">
              <input class="form-input" id="eu-socio-telefono" placeholder="Teléfono Institucional">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal('modal-edit-user')">Cancelar</button>
          <button class="btn btn-primary" onclick="saveUser()">Guardar Cambios</button>
        </div>
      </div>
    </div>
  `;
}

function initUserForm() {}

window.toggleRoleFields = function(prefix) {
  const isEmpresa = Array.from(document.querySelectorAll(`input[name="${prefix}-rol"]:checked`)).some(cb => cb.value === 'Empresa');
  const isSocio = Array.from(document.querySelectorAll(`input[name="${prefix}-rol"]:checked`)).some(cb => cb.value === 'Socio');
  
  const empFields = document.getElementById(`${prefix}-empresa-fields`);
  const socFields = document.getElementById(`${prefix}-socio-fields`);
  
  if(empFields) empFields.style.display = isEmpresa ? 'flex' : 'none';
  if(socFields) socFields.style.display = isSocio ? 'flex' : 'none';
};

async function createUser() {
  if (!State.currentUser.roles.includes('Admin')) { showToast('Error', 'No tienes permisos para esta acción.', 'error'); return; }
  const nombre = $('nu-nombre')?.value.trim();
  const correo = $('nu-correo')?.value.trim();
  const pass   = $('nu-pass')?.value.trim();
  
  const checkboxes = document.querySelectorAll('input[name="nu-rol"]:checked');
  const roles = Array.from(checkboxes).map(cb => cb.value);

  if (!nombre || !correo || !pass || roles.length === 0) { showToast('Error', 'Completa todos los campos y selecciona al menos un rol.', 'error'); return; }
  
  let payload = { nombre, correo, contrasena: pass, roles, avatar: getInitials(nombre) };
  
  if (roles.includes('Empresa')) {
    payload.empresa_data = {
      nombre_clinica: $('nu-empresa-nombre')?.value.trim(),
      tipo_centro: $('nu-empresa-tipo')?.value,
      region_alemania: $('nu-empresa-region')?.value.trim(),
      ciudad: $('nu-empresa-ciudad')?.value.trim(),
      telefono: $('nu-empresa-telefono')?.value.trim(),
      contacto_nombre: nombre,
      correo_contacto: correo
    };
  }
  if (roles.includes('Socio')) {
    payload.socio_data = {
      nombre_agencia: $('nu-socio-nombre')?.value.trim(),
      pais_operacion: $('nu-socio-pais')?.value.trim(),
      porcentaje_comision: $('nu-socio-comision')?.value || 10,
      telefono: $('nu-socio-telefono')?.value.trim(),
      contacto_nombre: nombre,
      correo_contacto: correo
    };
  }

  await DB.createUsuario(payload);
  closeModal('modal-new-user');
  showToast('Usuario creado', `${nombre} fue registrado con ${roles.length} rol(es).`, 'success');
  navigateTo('admin-users');
}

async function deleteUser(id) {
  if (State.activeRole !== 'Admin') { showToast('Error', 'No tienes permisos para esta acción.', 'error'); return; }
  if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
  await DB.deleteUsuario(id);
  showToast('Usuario eliminado', 'El usuario fue eliminado del sistema.', 'warning');
  navigateTo('admin-users');
}

function editUser(id) { 
  if (State.activeRole !== 'Admin') { showToast('Error', 'No tienes permisos para esta acción.', 'error'); return; }
  
  const usuarios = DB.getUsuarios();
  const user = usuarios.find(u => u.id === id);
  if (!user) { showToast('Error', 'Usuario no encontrado.', 'error'); return; }
  
  $('eu-id').value = user.id;
  $('eu-nombre').value = user.nombre;
  $('eu-correo').value = user.correo;
  $('eu-pass').value = '';
  
  const checkboxes = document.querySelectorAll('input[name="eu-rol"]');
  checkboxes.forEach(cb => {
    cb.checked = user.roles && user.roles.includes(cb.value);
  });
  
  // Populate dynamic fields if they exist
  if (user.empresa_data) {
    $('eu-empresa-nombre').value = user.empresa_data.nombre_clinica || '';
    $('eu-empresa-tipo').value = user.empresa_data.tipo_centro || '';
    $('eu-empresa-region').value = user.empresa_data.region_alemania || '';
    $('eu-empresa-ciudad').value = user.empresa_data.ciudad || '';
    $('eu-empresa-telefono').value = user.empresa_data.telefono || '';
  } else {
    $('eu-empresa-nombre').value = '';
    $('eu-empresa-tipo').value = '';
    $('eu-empresa-region').value = '';
    $('eu-empresa-ciudad').value = '';
    $('eu-empresa-telefono').value = '';
  }
  
  if (user.socio_data) {
    $('eu-socio-nombre').value = user.socio_data.nombre_agencia || '';
    $('eu-socio-pais').value = user.socio_data.pais_operacion || '';
    $('eu-socio-comision').value = user.socio_data.porcentaje_comision || '';
    $('eu-socio-telefono').value = user.socio_data.telefono || '';
  } else {
    $('eu-socio-nombre').value = '';
    $('eu-socio-pais').value = '';
    $('eu-socio-comision').value = '';
    $('eu-socio-telefono').value = '';
  }
  
  if (window.toggleRoleFields) window.toggleRoleFields('eu');
  
  openModal('modal-edit-user');
}

async function saveUser() {
  if (State.activeRole !== 'Admin') { showToast('Error', 'No tienes permisos para esta acción.', 'error'); return; }
  
  const id = $('eu-id').value;
  const nombre = $('eu-nombre').value.trim();
  const correo = $('eu-correo').value.trim();
  const pass = $('eu-pass').value.trim();
  
  const checkboxes = document.querySelectorAll('input[name="eu-rol"]:checked');
  const roles = Array.from(checkboxes).map(cb => cb.value);
  
  if (!nombre || !correo || roles.length === 0) {
    showToast('Error', 'Completa los campos obligatorios y selecciona al menos un rol.', 'error');
    return;
  }
  
  let updateData = { nombre, correo, roles };
  if (pass) updateData.contrasena = pass;
  
  if (roles.includes('Empresa')) {
    updateData.empresa_data = {
      nombre_clinica: $('eu-empresa-nombre')?.value.trim(),
      tipo_centro: $('eu-empresa-tipo')?.value,
      region_alemania: $('eu-empresa-region')?.value.trim(),
      ciudad: $('eu-empresa-ciudad')?.value.trim(),
      telefono: $('eu-empresa-telefono')?.value.trim(),
      contacto_nombre: nombre,
      correo_contacto: correo
    };
  }
  if (roles.includes('Socio')) {
    updateData.socio_data = {
      nombre_agencia: $('eu-socio-nombre')?.value.trim(),
      pais_operacion: $('eu-socio-pais')?.value.trim(),
      porcentaje_comision: $('eu-socio-comision')?.value || 10,
      telefono: $('eu-socio-telefono')?.value.trim(),
      contacto_nombre: nombre,
      correo_contacto: correo
    };
  }
  
  try {
    await DB.updateUsuario(id, updateData);
    const isSelf = State.currentUser && (
      State.currentUser.id === id || 
      (State.currentUser.correo && correo && State.currentUser.correo.toLowerCase() === correo.toLowerCase())
    );
    if (isSelf) {
      State.currentUser = { ...State.currentUser, ...updateData };
      DB.setSession(State.currentUser);
      renderAppShell();
    } else {
      navigateTo('admin-users'); // refrescar la vista
    }
    closeModal('modal-edit-user');
    showToast('Éxito', 'Usuario actualizado correctamente.', 'success');
  } catch(e) {
    console.error(e);
    showToast('Error', 'Ocurrió un error al actualizar el usuario.', 'error');
  }
}

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
          <thead><tr><th>Candidato</th><th>País</th><th>Especialidad</th><th>Alemán</th><th>Puntaje</th><th>Estado Proceso</th><th>Homologación</th></tr></thead>
          <tbody id="cand-table-body">
            ${candidatos.map(c => `
              <tr style="cursor:pointer;" onclick="openCandidateDetail('${c.id}')">
                <td><div class="td-avatar"><div class="avatar" style="background:${getAvatarColor(c.nombre)}">${getInitials(c.nombre)}</div><div class="td-name">${c.nombre}</div></div></td>
                <td><span style="font-size:1rem;">${countryFlag(c.pais)}</span> ${c.pais}</td>
                <td>${c.especialidad}</td>
                <td><span class="badge badge-info">${c.nivel_aleman}</span></td>
                <td><strong style="color:var(--gold-600);">${c.puntaje_elegibilidad ?? 'N/A'}</strong></td>
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
                    <td>${formatDateTime(c.fecha_devengamiento)}</td>
                    <td>${c.fecha_pago ? formatDateTime(c.fecha_pago) : 'Pendiente'}</td>
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
// ──────────────────────────────────────────────────────────────────
// ★ DASHBOARD 2: ASESOR — 4 BLOQUES FUNCIONALES (KPIS, KANBAN, AGENDA, SPEECH)
// ──────────────────────────────────────────────────────────────────
let _asesorKanbanScope = 'todos'; // 'mis' | 'todos'
let _currentSpeechCandidateId = null;
let _currentSpeechTab = 'saludo';
let _agendaFilter = 'todas'; // 'todas' | 'pendientes' | 'completadas'

const PIPELINE_8_FASES = [
  { id: "Lead Nuevo",                    label: "Lead Nuevo",                    iconName: "userPlus",      color: "#64748b" },
  { id: "1er Contacto / Reclutamiento",  label: "1er Contacto / Reclutamiento",  iconName: "phone",         color: "#2563eb" },
  { id: "Suficiencia de Idioma (A1-B2)", label: "Suficiencia de Idioma (A1-B2)", iconName: "messageSquare", color: "#7c3aed" },
  { id: "Entrevista y Contrato",         label: "Entrevista y Contrato",         iconName: "handshake",     color: "#db2777" },
  { id: "Procesamiento de Visa",         label: "Procesamiento de Visa",         iconName: "shieldCheck",   color: "#d97706" },
  { id: "Fase Pre-viaje",                label: "Fase Pre-viaje",                iconName: "plane",         color: "#0d9488" },
  { id: "En Destino",                    label: "En Destino",                    iconName: "mapPin",        color: "#ca8a04" },
  { id: "Inserción Exitosa",             label: "Inserción Exitosa",             iconName: "award",         color: "#16a34a" }
];

function normalizeCandidatePhase(rawEstado) {
  if (!rawEstado) return "Lead Nuevo";
  const s = rawEstado.toLowerCase().trim();
  if (s.includes("lead") || s.includes("nuevo")) return "Lead Nuevo";
  if (s.includes("1er") || s.includes("contacto") || s.includes("recluta")) return "1er Contacto / Reclutamiento";
  if (s.includes("idioma") || s.includes("suficiencia") || s.includes("alem")) return "Suficiencia de Idioma (A1-B2)";
  if (s.includes("entrevista") || s.includes("contrato") || s.includes("postula")) return "Entrevista y Contrato";
  if (s.includes("visa") || s.includes("visado") || s.includes("homologa")) return "Procesamiento de Visa";
  if (s.includes("pre") || s.includes("viaje") || s.includes("vuelo")) return "Fase Pre-viaje";
  if (s.includes("destino") || s.includes("llegada")) return "En Destino";
  if (s.includes("inserci") || s.includes("éxito") || s.includes("exitos") || s.includes("coloca")) return "Inserción Exitosa";
  return rawEstado;
}

function getLanguageBadgeHtml(nivel) {
  const n = (nivel || 'A1').toUpperCase().trim();
  const cls = n.toLowerCase();
  return `<span class="badge-language ${cls}" title="Nivel actual de idioma alemán"><span style="display:inline-flex; align-items:center; margin-right:3px;">${getIcon('globe', { size: 11 })}</span> ${n}</span>`;
}

// ── AGENDA Y TAREAS DEL ASESOR ─────────────────────────────────────
function getAdvisorAgendaTasks() {
  try {
    const raw = localStorage.getItem('jnp_advisor_tasks');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  const defaults = [
    {
      id: 't-1',
      tipo: 'llamada',
      candidatoId: 'cand-001',
      candidatoNombre: 'Luis Villacis',
      telefono: '+593 99 123 4567',
      hora: '10:00 AM',
      titulo: 'Llamada introductoria: diagnóstico de perfil y validación de título',
      completada: false
    },
    {
      id: 't-2',
      tipo: 'zoom',
      candidatoId: 'cand-002',
      candidatoNombre: 'Dra. Camila Morales',
      telefono: '+57 310 987 6543',
      hora: '11:30 AM',
      enlace: 'https://meet.google.com/jnp-aleman-med',
      titulo: 'Enviar enlace Google Meet y confirmar por WhatsApp para entrevista con Klinikum',
      completada: false
    },
    {
      id: 't-3',
      tipo: 'expediente',
      candidatoId: 'cand-003',
      candidatoNombre: 'Lic. Roberto Gómez',
      telefono: '+51 987 654 321',
      hora: '02:00 PM',
      titulo: 'Revisar certificado de idioma Goethe B1 cargado en la plataforma',
      completada: false
    },
    {
      id: 't-4',
      tipo: 'visa',
      candidatoId: 'cand-005',
      candidatoNombre: 'Lic. Andrés Paredes',
      telefono: '+593 98 765 4321',
      hora: '04:30 PM',
      titulo: 'Confirmar pago de tasas consulares y turno en embajada alemana',
      completada: true
    }
  ];
  try {
    localStorage.setItem('jnp_advisor_tasks', JSON.stringify(defaults));
  } catch(e) {}
  return defaults;
}

function saveAdvisorAgendaTasks(tasks) {
  try {
    localStorage.setItem('jnp_advisor_tasks', JSON.stringify(tasks));
  } catch(e) {}
}

function toggleAgendaTask(taskId) {
  const tasks = getAdvisorAgendaTasks();
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completada = !task.completada;
    saveAdvisorAgendaTasks(tasks);
    renderDashboard(State.activeRole, State.currentSidebar);
  }
}

function addNewAgendaTask() {
  const title = prompt('Descripción de la nueva tarea para hoy:');
  if (!title || !title.trim()) return;
  const hora = prompt('Hora programada (ej: 03:00 PM):', '03:00 PM') || 'Hoy';
  const tasks = getAdvisorAgendaTasks();
  tasks.unshift({
    id: 't-' + Date.now(),
    tipo: 'llamada',
    titulo: title.trim(),
    hora: hora.trim(),
    completada: false
  });
  saveAdvisorAgendaTasks(tasks);
  showToast('Tarea agregada', 'La tarea se añadió a tu agenda de hoy.', 'success');
  renderDashboard(State.activeRole, State.currentSidebar);
}

// ── SPEECH WIDGET & HERRAMIENTAS RÁPIDAS ────────────────────────────
function toggleSpeechWidget(forceOpen = null) {
  const drawer = $('speech-drawer-panel');
  const backdrop = $('speech-drawer-backdrop');
  if (!drawer || !backdrop) return;
  const isOpen = drawer.classList.contains('active');
  const shouldOpen = forceOpen !== null ? forceOpen : !isOpen;
  if (shouldOpen) {
    drawer.classList.add('active');
    backdrop.classList.add('active');
    if (!_currentSpeechCandidateId) {
      const cands = DB.getCandidatos();
      if (cands.length > 0) _currentSpeechCandidateId = cands[0].id;
    }
    updateSpeechDrawerView();
  } else {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
  }
}

function openSpeechWidgetForCandidate(candidatoId) {
  _currentSpeechCandidateId = candidatoId;
  toggleSpeechWidget(true);
}

function setSpeechTab(tabId) {
  _currentSpeechTab = tabId;
  $$('.speech-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  $$('.speech-script-box').forEach(box => {
    box.style.display = box.id === `script-tab-${tabId}` ? 'block' : 'none';
  });
}

function onSpeechCandidateSelect(candidatoId) {
  _currentSpeechCandidateId = candidatoId;
  updateSpeechDrawerView();
}

function updateSpeechDrawerView() {
  const c = DB.getCandidatoById(_currentSpeechCandidateId) || DB.getCandidatos()[0];
  if (!c) return;
  _currentSpeechCandidateId = c.id;

  const sel = $('speech-candidate-select');
  if (sel) sel.value = c.id;

  const quickHeader = $('speech-quick-candidate-info');
  if (quickHeader) {
    quickHeader.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="avatar" style="background:${getAvatarColor(c.nombre)}; width:40px; height:40px; font-size:0.9rem;">
            ${getInitials(c.nombre)}
          </div>
          <div>
            <div style="font-weight:700; color:var(--slate-900); font-size:0.95rem;">${c.nombre}</div>
            <div style="font-size:0.75rem; color:var(--slate-500); display:flex; align-items:center; gap:4px; margin-top:2px;">
              <span style="display:inline-flex; align-items:center;">${getIcon('mapPin', { size: 11, color: 'var(--slate-400)' })}</span>
              <span>${c.pais || 'N/A'} · ${c.especialidad || 'Salud'}</span>
            </div>
          </div>
        </div>
        <div style="text-align:right;">
          <span class="badge-language ${(c.nivel_aleman||'a1').toLowerCase()}"><span style="display:inline-flex; align-items:center; margin-right:3px;">${getIcon('globe', { size: 11 })}</span> ${c.nivel_aleman||'A1'}</span>
          <div style="font-size:0.75rem; color:var(--slate-600); margin-top:2px;">
            ${c.telefono ? `<a href="tel:${c.telefono}" style="color:var(--wine-800); text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:4px;"><span style="display:inline-flex; align-items:center;">${getIcon('phone', { size: 11 })}</span> ${c.telefono}</a>` : 'Sin teléfono'}
          </div>
        </div>
      </div>
    `;
  }

  const nombreSimple = c.nombre.split(' ')[0];
  const spec = c.especialidad;
  const pais = c.pais;

  const script1 = $('script-tab-saludo');
  if (script1) {
    script1.innerHTML = `
      <p style="margin-bottom:8px;"><strong>Apertura institucional:</strong></p>
      <p style="margin-bottom:8px;">"Hola <strong>${nombreSimple}</strong>, muy buenos días/tardes. Te saluda <strong>${State.currentUser ? State.currentUser.nombre.split(' ')[0] : 'tu asesor'}</strong> de <strong>JN Palabras</strong> desde Heidelberg, Alemania."</p>
      <p style="margin-bottom:8px;">"Nos comunicamos respecto a tu postulación como profesional de <strong>${spec}</strong> desde <strong>${pais}</strong>. Revisamos tu perfil y queremos conversar brevemente sobre los requisitos de homologación y empleo directo en clínicas alemanas."</p>
      <p style="color:var(--slate-500); font-size:0.8rem; font-style:italic;">💡 Objetivo: Generar confianza inmediata y validar si tiene 5 minutos para hablar.</p>
    `;
  }

  const script2 = $('script-tab-afirmativa');
  if (script2) {
    script2.innerHTML = `
      <p style="margin-bottom:8px;"><strong>Si responde con interés ("Sí, me interesa"):</strong></p>
      <p style="margin-bottom:8px;">"¡Excelente decisión, <strong>${nombreSimple}</strong>! En JN Palabras trabajamos con un programa integral de 4 pasos: validamos tu título universitario (Anerkennung), te capacitamos en alemán médico para el examen oficial FSP y coordinamos tu contrato laboral con hospital."</p>
      <p style="margin-bottom:8px;">"Para avanzar al siguiente paso formal, vamos a agendar tu <strong>sesión de diagnóstico técnico por Google Meet / Zoom</strong>. ¿Tienes disponibilidad mañana a las 10:00 AM o prefieres en la tarde?"</p>
      <p style="color:var(--slate-500); font-size:0.8rem; font-style:italic;">💡 Acción clave: Cerrar fecha y hora para el Meet y enviarle el enlace por WhatsApp.</p>
    `;
  }

  const script3 = $('script-tab-dudas');
  if (script3) {
    script3.innerHTML = `
      <p style="margin-bottom:8px;"><strong>Manejo de Objeciones y Reagendamiento:</strong></p>
      <p style="margin-bottom:8px;">• <em>Si no puede atender ahora:</em> "Comprendo perfectamente <strong>${nombreSimple}</strong>. ¿Te parece si te marco hoy a las 5:00 PM o mañana a las 10:00 AM por WhatsApp?"</p>
      <p style="margin-bottom:8px;">• <em>Si pregunta por costos:</em> "La gestión de colocación es respaldada por los hospitales contratantes en Alemania, y disponemos de planes de apoyo para el aprendizaje del idioma."</p>
      <p style="margin-bottom:8px;">• <em>Si no tiene nivel de alemán:</em> "No te preocupes, en JN Palabras te formamos desde nivel A1 hasta B2 con profesores especializados en el sector salud."</p>
    `;
  }

  const script4 = $('script-tab-cierre');
  if (script4) {
    script4.innerHTML = `
      <p style="margin-bottom:8px;"><strong>Cierre & Compromiso:</strong></p>
      <p style="margin-bottom:8px;">"Perfecto <strong>${nombreSimple}</strong>. Te enviamos la confirmación por WhatsApp con los datos de nuestra reunión. Por favor ten a mano tu documento de identidad y tu título profesional para la revisión inicial."</p>
      <p style="margin-bottom:8px;">"¡Muchísimas gracias por tu tiempo y bienvenido al proceso de JN Palabras!"</p>
    `;
  }

  const fNivel = $('speech-form-nivel');
  if (fNivel && c.nivel_aleman) fNivel.value = c.nivel_aleman;
  const fFase = $('speech-form-fase');
  if (fFase) fFase.value = normalizeCandidatePhase(c.estado_proceso);
}

async function saveCandidateDataFromSpeech() {
  if (!_currentSpeechCandidateId) return;
  const c = DB.getCandidatoById(_currentSpeechCandidateId);
  if (!c) return;

  const resultado = $('speech-form-resultado')?.value || 'Contactado';
  const nivel = $('speech-form-nivel')?.value || c.nivel_aleman;
  const fase = $('speech-form-fase')?.value || c.estado_proceso;
  const notaTexto = $('speech-form-nota')?.value.trim();
  const proximaCita = $('speech-form-cita')?.value;

  const updatePayload = {
    nivel_aleman: nivel,
    estado_proceso: fase
  };

  if (notaTexto || resultado) {
    const contenidoNota = `[Llamada / Speech: ${resultado}] ${notaTexto ? notaTexto : 'Actualización de contacto y avance de fase.'}`;
    DB.addNota({
      id_candidato: c.id,
      autor: State.currentUser ? State.currentUser.nombre : 'Asesor',
      contenido: contenidoNota
    });
  }

  if (proximaCita) {
    const tasks = getAdvisorAgendaTasks();
    tasks.unshift({
      id: 't-' + Date.now(),
      tipo: 'zoom',
      candidatoId: c.id,
      candidatoNombre: c.nombre,
      telefono: c.telefono,
      hora: new Date(proximaCita).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      titulo: `Reunión de seguimiento con ${c.nombre} (${resultado})`,
      completada: false
    });
    saveAdvisorAgendaTasks(tasks);
  }

  await DB.updateCandidato(c.id, updatePayload);
  showToast('Ficha guardada', `Datos de ${c.nombre.split(' ')[0]} actualizados correctamente.`, 'success');
  
  if ($('speech-form-nota')) $('speech-form-nota').value = '';
  
  renderDashboard(State.activeRole, State.currentSidebar);
  updateSpeechDrawerView();
}

function openQuickNoteModal(candidatoId) {
  const c = DB.getCandidatoById(candidatoId);
  if (!c) return;
  const nota = prompt(`Añadir nota rápida para ${c.nombre}:`);
  if (nota && nota.trim()) {
    DB.addNota({
      id_candidato: c.id,
      autor: State.currentUser ? State.currentUser.nombre : 'Asesor',
      contenido: nota.trim()
    });
    showToast('Nota registrada', `Nota añadida al expediente de ${c.nombre}.`, 'success');
    renderDashboard(State.activeRole, State.currentSidebar);
  }
}

// ── NOTIFICACIONES OPERATIVAS DEL ASESOR ─────────────────────────
function getAdvisorNotifications() {
  const currentUserId = State.currentUser ? State.currentUser.id : null;
  let notifs = DB.getNotificaciones(currentUserId);
  if (!notifs || notifs.length === 0) {
    notifs = [
      {
        id: 'notif-1',
        tipo: 'documento',
        iconName: 'fileCheck',
        iconClass: 'info',
        titulo: 'Nuevo Certificado B2 Subido',
        descripcion: 'Dra. Camila Morales ha cargado su certificado Goethe-Zertifikat B2 para homologación.',
        tiempo: 'Hace 25 min',
        candidatoId: 'cand-002'
      },
      {
        id: 'notif-2',
        tipo: 'clinica',
        iconName: 'shieldCheck',
        iconClass: 'success',
        titulo: 'Entrevista Confirmada por Klinikum',
        descripcion: 'Klinikum Stuttgart confirmó fecha de entrevista técnica para Luis Villacis.',
        tiempo: 'Hace 2 horas',
        candidatoId: 'cand-001'
      },
      {
        id: 'notif-3',
        tipo: 'visa',
        iconName: 'plane',
        iconClass: 'info',
        titulo: 'Cita en Embajada Alemana Asignada',
        descripcion: 'Se confirmó turno consular en Quito para visado de trabajo de Luis Villacis.',
        tiempo: 'Ayer',
        candidatoId: 'cand-001'
      },
      {
        id: 'notif-4',
        tipo: 'alerta',
        iconName: 'alertTriangle',
        iconClass: 'warning',
        titulo: 'Expediente Pendiente de Traducción',
        descripcion: 'Faltan 2 sellos apostillados en el título de Lic. Enfermería antes del envío.',
        tiempo: 'Hace 1 día',
        candidatoId: 'cand-001'
      }
    ];
  }
  return notifs;
}

// ── MENSAJES Y NOTAS RECIENTES DEL ASESOR ──────────────────────────
function getAdvisorRecentNotes() {
  const allNotes = (DB.get().notas || []).slice(0, 5);
  if (allNotes.length === 0) {
    return [
      {
        candidato: 'Luis Villacis',
        autor: 'Carlos Martínez',
        fecha: 'Hoy, 09:30 AM',
        texto: 'Llamada de validación de título. Candidato muy receptivo, confirma interés en iniciar curso de alemán médico intensivo.'
      },
      {
        candidato: 'Dra. Camila Morales',
        autor: 'Mariana Vega',
        fecha: 'Ayer, 04:15 PM',
        texto: 'Documentación para Anerkennung enviada a la oficina de Stuttgart. Esperando respuesta de equivalencia.'
      },
      {
        candidato: 'Prueba',
        autor: 'Carlos Martínez',
        fecha: 'Hace 2 días',
        texto: 'Perfil registrado para prueba de onboarding. Verificando datos iniciales y nivel de idioma.'
      }
    ];
  }
  return allNotes.map(n => {
    const cand = DB.getCandidatoById(n.id_candidato);
    return {
      candidato: cand ? cand.nombre : 'Candidato',
      autor: n.autor || 'Asesor',
      fecha: n.fecha ? new Date(n.fecha).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Reciente',
      texto: n.contenido
    };
  });
}

// ── FILTRO RÁPIDO EN VIVO PARA TABLERO KANBAN ──────────────────────
function filterKanbanCandidates(query) {
  const q = (query || '').toLowerCase().trim();
  const cards = document.querySelectorAll('.kanban-card');
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = (!q || text.includes(q)) ? 'block' : 'none';
  });
  const rows = document.querySelectorAll('.data-table tbody tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
}

// ── EXPORTACIÓN DE CANDIDATOS A CSV ────────────────────────────────
function exportKanbanCSV() {
  const candidatos = DB.getCandidatos();
  if (!candidatos || candidatos.length === 0) {
    showToast('Exportar', 'No hay candidatos para exportar.', 'warning');
    return;
  }
  const headers = ['Nombre', 'Especialidad', 'País', 'Nivel Alemán', 'Fase Proceso', 'Asesor Asignado', 'Teléfono', 'Email'];
  const rows = candidatos.map(c => [
    `"${(c.nombre || '').replace(/"/g, '""')}"`,
    `"${(c.especialidad || '').replace(/"/g, '""')}"`,
    `"${(c.pais || '').replace(/"/g, '""')}"`,
    `"${(c.nivel_aleman || 'A1').replace(/"/g, '""')}"`,
    `"${(normalizeCandidatePhase(c.estado_proceso) || '').replace(/"/g, '""')}"`,
    `"${(c.nombre_asesor || 'Sin asignar').replace(/"/g, '""')}"`,
    `"${(c.telefono || '').replace(/"/g, '""')}"`,
    `"${(c.correo || '').replace(/"/g, '""')}"`
  ]);
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `candidatos_jn_palabras_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Exportación completada', 'El archivo CSV de candidatos se ha descargado correctamente.', 'success');
}

// ── DRAWER DE SPEECH Y MODALES COMPARTIDOS ─────────────────────────
function renderAdvisorSpeechDrawerAndModals(allCandidatos) {
  return `
    <!-- WIDGET FLOTANTE & DRAWER: SPEECH & HERRAMIENTAS -->
    <div class="floating-speech-trigger" onclick="toggleSpeechWidget(true)" title="Abrir Speech de Llamada & Herramientas de Asesor">
      <span class="speech-icon" style="display:inline-flex; align-items:center;">${getIcon('headphones', { size: 18, color: '#ffffff' })}</span>
      <span class="speech-text">Speech de Llamada & Herramientas</span>
      <span class="speech-badge">Rápido</span>
    </div>

    <!-- Backdrop del Drawer -->
    <div class="speech-drawer-backdrop" id="speech-drawer-backdrop" onclick="toggleSpeechWidget(false)"></div>

    <!-- Panel Lateral Drawer -->
    <div class="speech-drawer-panel" id="speech-drawer-panel">
      <div class="speech-drawer-header">
        <div class="speech-drawer-title" style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-flex; align-items:center;">${getIcon('headphones', { size: 18, color: 'var(--wine-800)' })}</span> Speech de Llamada & Herramientas
        </div>
        <button class="speech-drawer-close" onclick="toggleSpeechWidget(false)" title="Cerrar panel">✕</button>
      </div>

      <div class="speech-drawer-content">
        <!-- Selector de Candidato -->
        <div>
          <label class="form-label" style="font-weight:700;">Seleccionar Candidato para la Llamada:</label>
          <select class="form-select" id="speech-candidate-select" onchange="onSpeechCandidateSelect(this.value)">
            ${allCandidatos.map(c => `
              <option value="${c.id}" ${c.id === _currentSpeechCandidateId ? 'selected' : ''}>
                ${c.nombre} (${c.pais} · ${c.especialidad} · ${c.nivel_aleman || 'A1'})
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Ficha Rápida del Candidato -->
        <div class="speech-cand-card" id="speech-quick-candidate-info">
          <!-- Dinámico -->
        </div>

        <!-- Pestañas del Script de Llamada -->
        <div>
          <div class="speech-tabs">
            <button class="speech-tab-btn ${_currentSpeechTab==='saludo'?'active':''}" data-tab="saludo" onclick="setSpeechTab('saludo')" style="display:inline-flex; align-items:center; gap:4px;">
              ${getIcon('messageSquare', { size: 12 })} 1. Saludo
            </button>
            <button class="speech-tab-btn ${_currentSpeechTab==='afirmativa'?'active':''}" data-tab="afirmativa" onclick="setSpeechTab('afirmativa')" style="display:inline-flex; align-items:center; gap:4px;">
              ${getIcon('check', { size: 12 })} 2. Respuesta Sí
            </button>
            <button class="speech-tab-btn ${_currentSpeechTab==='dudas'?'active':''}" data-tab="dudas" onclick="setSpeechTab('dudas')" style="display:inline-flex; align-items:center; gap:4px;">
              ${getIcon('clock', { size: 12 })} 3. Reagendar
            </button>
            <button class="speech-tab-btn ${_currentSpeechTab==='cierre'?'active':''}" data-tab="cierre" onclick="setSpeechTab('cierre')" style="display:inline-flex; align-items:center; gap:4px;">
              ${getIcon('fileCheck', { size: 12 })} 4. Cierre
            </button>
          </div>

          <div style="margin-top:12px;">
            <div class="speech-script-box" id="script-tab-saludo" style="display:${_currentSpeechTab==='saludo'?'block':'none'};"></div>
            <div class="speech-script-box" id="script-tab-afirmativa" style="display:${_currentSpeechTab==='afirmativa'?'block':'none'};"></div>
            <div class="speech-script-box" id="script-tab-dudas" style="display:${_currentSpeechTab==='dudas'?'block':'none'};"></div>
            <div class="speech-script-box" id="script-tab-cierre" style="display:${_currentSpeechTab==='cierre'?'block':'none'};"></div>
          </div>
        </div>

        <!-- Herramienta Directa: Ingresar Datos a Ficha del Candidato -->
        <div class="speech-form-box">
          <div class="speech-form-title" style="display:flex; align-items:center; gap:6px;">
            <span style="display:inline-flex; align-items:center;">${getIcon('edit', { size: 15, color: 'var(--wine-800)' })}</span> Actualizar Ficha del Candidato (Sin salir)
          </div>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div>
                <label class="form-label" style="font-size:0.75rem;">Resultado de Llamada</label>
                <select class="form-select form-select-sm" id="speech-form-resultado">
                  <option value="Interesado y Acepta">Interesado y Acepta</option>
                  <option value="Reagendado">Reagendar Llamada</option>
                  <option value="No Contesta / Buzón">No Contesta / Buzón</option>
                  <option value="No Cumple Requisitos">Descartado</option>
                </select>
              </div>

              <div>
                <label class="form-label" style="font-size:0.75rem;">Nivel Alemán Validado</label>
                <select class="form-select form-select-sm" id="speech-form-nivel">
                  <option value="A1">A1 (Inicial)</option>
                  <option value="A2">A2 (Básico)</option>
                  <option value="B1">B1 (Intermedio)</option>
                  <option value="B2">B2 (Médico Homologable)</option>
                  <option value="C1">C1 (Avanzado)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label" style="font-size:0.75rem;">Mover a Fase del Pipeline</label>
              <select class="form-select form-select-sm" id="speech-form-fase">
                ${PIPELINE_8_FASES.map(f => `
                  <option value="${f.id}">${f.label}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="form-label" style="font-size:0.75rem;">Nota / Resumen de la Conversación</label>
              <textarea class="form-input" id="speech-form-nota" rows="2" style="font-size:0.8125rem;" placeholder="Ej: Título verificado. Se compromete a enviar documentos y tomar curso de alemán B1..."></textarea>
            </div>

            <div>
              <label class="form-label" style="font-size:0.75rem;">Agendar Próxima Cita / Seguimiento (Opcional)</label>
              <input type="datetime-local" class="form-input form-input-sm" id="speech-form-cita">
            </div>

            <button class="btn btn-primary" style="width:100%; justify-content:center; margin-top:4px;" onclick="saveCandidateDataFromSpeech()">
              <span style="display:inline-flex; align-items:center; margin-right:6px;">${getIcon('save', { size: 14, color: '#ffffff' })}</span> Guardar en Ficha del Candidato
            </button>
          </div>
        </div>

      </div>
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

    <!-- Modal Nuevo Candidato Manual -->
    <div class="modal-overlay" id="modal-nuevo-candidato">
      <div class="modal" style="max-width:500px;">
        <div class="modal-header">
          <h3 class="modal-title" style="display:flex; align-items:center; gap:6px;">
            <span style="display:inline-flex; align-items:center;">${getIcon('userPlus', { size: 18 })}</span> Nuevo Candidato
          </h3>
          <button class="modal-close" onclick="closeModal('modal-nuevo-candidato')">✕</button>
        </div>
        <div class="modal-body">
          <form id="form-nuevo-candidato" style="display:flex;flex-direction:column;gap:16px;">
            <div class="form-group">
              <label class="form-label">Nombre completo</label>
              <input class="form-input" id="nc-nombre" required>
            </div>
            <div class="form-group">
              <label class="form-label">Especialidad</label>
              <input class="form-input" id="nc-especialidad" required>
            </div>
            <div class="form-group">
              <label class="form-label">País</label>
              <input class="form-input" id="nc-pais" required>
            </div>
            <div class="form-group">
              <label class="form-label">Nivel de Alemán</label>
              <select class="form-select" id="nc-aleman">
                <option>A1</option><option>A2</option><option>B1</option>
                <option>B2</option><option>C1</option><option>C2</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal('modal-nuevo-candidato')">Cancelar</button>
          <button class="btn btn-primary" onclick="guardarNuevoCandidato()">Guardar</button>
        </div>
      </div>
    </div>
  `;
}

// ── PANTALLA 1: DASHBOARD OPERATIVO DEL ASESOR ─────────────────────
function renderAsesorDashboard() {
  const allCandidatos = DB.getCandidatos();
  const tasks = getAdvisorAgendaTasks();
  const notifications = getAdvisorNotifications();
  const recentNotes = getAdvisorRecentNotes();

  // 1. Métricas Clave (KPIs)
  const leadsCount = allCandidatos.filter(c => normalizeCandidatePhase(c.estado_proceso) === 'Lead Nuevo').length;
  const callsTodayCount = tasks.filter(t => t.tipo === 'llamada' || t.tipo === 'zoom').length;
  const pendingCalls = tasks.filter(t => (t.tipo === 'llamada' || t.tipo === 'zoom') && !t.completada).length;
  const expedientesPorRevisar = allCandidatos.filter(c => (c.nivel_aleman === 'B1' || c.nivel_aleman === 'B2' || (c.documentos_subidos && c.documentos_subidos >= 2)) && normalizeCandidatePhase(c.estado_proceso) !== 'Inserción Exitosa').length;
  const finalStages = ['Procesamiento de Visa', 'Fase Pre-viaje', 'En Destino'];
  const enTramiteCount = allCandidatos.filter(c => finalStages.includes(normalizeCandidatePhase(c.estado_proceso))).length;

  // 2. Filtro de Tareas
  let filteredTasks = tasks;
  if (_agendaFilter === 'pendientes') filteredTasks = tasks.filter(t => !t.completada);
  if (_agendaFilter === 'completadas') filteredTasks = tasks.filter(t => t.completada);
  const pendingAgendaCount = tasks.filter(t => !t.completada).length;

  return `
    <!-- Cabecera Principal del Dashboard -->
    <div class="kanban-banner">
      <div>
        <h1 class="kanban-banner-title">Dashboard Operativo del Asesor</h1>
        <p class="kanban-banner-subtitle">Resumen ejecutivo de métricas, agenda del día, notificaciones operativas y notas</p>
      </div>
      <div class="kanban-banner-actions">
        <button class="btn" style="background:var(--gold-500); color:var(--wine-900); font-weight:700; border:none; display:inline-flex; align-items:center; gap:8px;" onclick="renderDashboard(State.activeRole, 'asesor-kanban')">
          <span style="display:inline-flex; align-items:center;">${getIcon('users', { size: 16, color: 'var(--wine-900)' })}</span>
          Ver Tablero de Candidatos & Pipeline
        </button>
      </div>
    </div>

    <!-- BLOQUE A: BARRA SUPERIOR DE KPIS CON ICONOS VECTORIALES -->
    <div class="asesor-kpis-grid">
      <!-- KPI 1: Nuevos Leads Asignados -->
      <div class="asesor-kpi-card">
        <div class="asesor-kpi-icon blue">
          ${getIcon('userPlus', { size: 22, color: '#2563eb' })}
        </div>
        <div class="asesor-kpi-info">
          <span class="asesor-kpi-label">Nuevos Leads Asignados</span>
          <span class="asesor-kpi-value">${leadsCount}</span>
          <span class="asesor-kpi-trend positive" style="display:inline-flex; align-items:center; gap:4px;">
            <span style="display:inline-flex; align-items:center;">${getIcon('trendingUp', { size: 13, color: '#16a34a' })}</span>
            12 Leads este mes · <span>+4 esta semana</span>
          </span>
        </div>
      </div>

      <!-- KPI 2: Citas / Llamadas Hoy -->
      <div class="asesor-kpi-card">
        <div class="asesor-kpi-icon amber">
          ${getIcon('calendar', { size: 22, color: '#d97706' })}
        </div>
        <div class="asesor-kpi-info">
          <span class="asesor-kpi-label">Citas / Llamadas Hoy</span>
          <span class="asesor-kpi-value">${callsTodayCount}</span>
          <span class="asesor-kpi-trend warning" style="display:inline-flex; align-items:center; gap:4px;">
            <span style="display:inline-flex; align-items:center;">${getIcon('clock', { size: 13, color: '#d97706' })}</span>
            ${pendingCalls} pendientes · ${callsTodayCount - pendingCalls} realizadas
          </span>
        </div>
      </div>

      <!-- KPI 3: Expedientes por Revisar -->
      <div class="asesor-kpi-card">
        <div class="asesor-kpi-icon purple">
          ${getIcon('fileCheck', { size: 22, color: '#7c3aed' })}
        </div>
        <div class="asesor-kpi-info">
          <span class="asesor-kpi-label">Expedientes por Validar</span>
          <span class="asesor-kpi-value">${expedientesPorRevisar}</span>
          <span class="asesor-kpi-trend info" style="display:inline-flex; align-items:center; gap:4px;">
            <span style="display:inline-flex; align-items:center;">${getIcon('alertTriangle', { size: 13, color: '#7c3aed' })}</span>
            Certificados B1/B2 y títulos listos
          </span>
        </div>
      </div>

      <!-- KPI 4: Candidatos en Trámite de Visa/Vuelo -->
      <div class="asesor-kpi-card">
        <div class="asesor-kpi-icon emerald">
          ${getIcon('plane', { size: 22, color: '#0d9488' })}
        </div>
        <div class="asesor-kpi-info">
          <span class="asesor-kpi-label">En Trámite Visa / Vuelo</span>
          <span class="asesor-kpi-value">${enTramiteCount}</span>
          <span class="asesor-kpi-trend positive" style="display:inline-flex; align-items:center; gap:4px;">
            <span style="display:inline-flex; align-items:center;">${getIcon('check', { size: 13, color: '#16a34a' })}</span>
            Fases 5-7 (Consulado y Llegada)
          </span>
        </div>
      </div>
    </div>

    <!-- RESUMEN DEL EMBUDO / PIPELINE FUNNEL -->
    <div class="pipeline-funnel-card">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <div>
          <h3 style="font-size:1.05rem; font-weight:800; color:var(--slate-900); margin:0; display:flex; align-items:center; gap:8px;">
            <span style="display:inline-flex; align-items:center;">${getIcon('layout', { size: 18, color: 'var(--wine-800)' })}</span>
            Distribución del Pipeline de Integración (8 Fases)
          </h3>
          <p style="font-size:0.8125rem; color:var(--slate-500); margin:2px 0 0 0;">Candidatos activos distribuidos en cada etapa del proceso hacia Alemania</p>
        </div>
        <button class="btn btn-sm btn-outline" onclick="renderDashboard(State.activeRole, 'asesor-kanban')">
          Abrir Tablero Completo →
        </button>
      </div>

      <div class="funnel-phases-row">
        ${PIPELINE_8_FASES.map((phase, idx) => {
          const count = allCandidatos.filter(c => normalizeCandidatePhase(c.estado_proceso) === phase.id).length;
          const pct = allCandidatos.length > 0 ? Math.round((count / allCandidatos.length) * 100) : 0;
          return `
            <div class="funnel-phase-stat" style="border-left: 3px solid ${phase.color};">
              <div class="funnel-phase-title">
                <span style="display:inline-flex; align-items:center;">${getIcon(phase.iconName, { size: 13, color: phase.color })}</span>
                <span>${idx + 1}. ${phase.label}</span>
              </div>
              <div style="display:flex; align-items:baseline; justify-content:space-between;">
                <span class="funnel-phase-number">${count}</span>
                <span style="font-size:0.75rem; color:var(--slate-500); font-weight:600;">${pct}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- BLOQUE PRINCIPAL EN 2 COLUMNAS (AGENDA + NOTIFICACIONES / MENSAJES) -->
    <div class="asesor-dashboard-grid">
      
      <!-- COLUMNA 1: MI AGENDA Y TAREAS DEL DÍA -->
      <div class="dashboard-panel-card">
        <div class="dashboard-panel-header">
          <div class="dashboard-panel-title">
            <span style="display:inline-flex; align-items:center;">${getIcon('calendar', { size: 20, color: 'var(--wine-800)' })}</span>
            <span>Mi Agenda y Tareas del Día</span>
            <span class="agenda-badge-count">${pendingAgendaCount} pendientes</span>
          </div>

          <button class="btn btn-sm btn-primary" onclick="addNewAgendaTask()" style="display:inline-flex; align-items:center; gap:4px;">
            ${getIcon('edit', { size: 12 })} Nueva Tarea
          </button>
        </div>

        <div style="margin-bottom:12px;">
          <div class="agenda-filters">
            <button class="agenda-filter-btn ${_agendaFilter==='todas'?'active':''}" onclick="_agendaFilter='todas';renderDashboard(State.activeRole,'asesor-dashboard');">
              Todas (${tasks.length})
            </button>
            <button class="agenda-filter-btn ${_agendaFilter==='pendientes'?'active':''}" onclick="_agendaFilter='pendientes';renderDashboard(State.activeRole,'asesor-dashboard');">
              Pendientes (${pendingAgendaCount})
            </button>
            <button class="agenda-filter-btn ${_agendaFilter==='completadas'?'active':''}" onclick="_agendaFilter='completadas';renderDashboard(State.activeRole,'asesor-dashboard');">
              Completadas (${tasks.length - pendingAgendaCount})
            </button>
          </div>
        </div>

        <div class="agenda-tasks-list">
          ${filteredTasks.length === 0 ? `
            <div style="text-align:center; padding:32px 16px; color:var(--slate-400); font-size:0.875rem;">
              No hay tareas pendientes en este filtro.
            </div>
          ` : filteredTasks.map(t => `
            <div class="agenda-task-card ${t.completada ? 'completed' : ''}">
              <div class="task-left">
                <div class="task-checkbox-custom" onclick="toggleAgendaTask('${t.id}')" title="Marcar como completada">
                  ${t.completada ? `<span style="display:inline-flex; align-items:center;">${getIcon('check', { size: 12, color: 'var(--wine-800)' })}</span>` : ''}
                </div>
                <div class="task-body">
                  <div class="task-title task-text">${t.titulo}</div>
                  <div class="task-sub">
                    <span class="task-time-pill" style="display:inline-flex; align-items:center; gap:3px;">
                      ${getIcon('clock', { size: 11 })} ${t.hora}
                    </span>
                    ${t.candidatoNombre ? `<span style="display:inline-flex; align-items:center; gap:3px;">${getIcon('user', { size: 11 })} <strong>${t.candidatoNombre}</strong></span>` : ''}
                    ${t.telefono ? `<span style="display:inline-flex; align-items:center; gap:3px;">${getIcon('phone', { size: 11 })} ${t.telefono}</span>` : ''}
                  </div>
                </div>
              </div>

              <div class="task-actions">
                ${t.candidatoId ? `
                  <button class="btn-task-action speech" onclick="openSpeechWidgetForCandidate('${t.candidatoId}')" title="Abrir Speech de Llamada">
                    <span style="display:inline-flex; align-items:center; gap:3px;">${getIcon('headphones', { size: 12 })} Speech</span>
                  </button>
                ` : ''}
                ${t.telefono ? `
                  <a class="btn-task-action whatsapp" href="https://wa.me/${t.telefono.replace(/[^0-9]/g,'')}" target="_blank" title="Enviar WhatsApp">
                    <span style="display:inline-flex; align-items:center; gap:3px;">${getIcon('whatsapp', { size: 12 })} WhatsApp</span>
                  </a>
                ` : ''}
                ${t.enlace ? `
                  <button class="btn-task-action" onclick="navigator.clipboard.writeText('${t.enlace}'); showToast('Copiado', 'Enlace de reunión copiado al portapapeles.', 'success');" title="Copiar enlace de Google Meet/Zoom">
                    <span style="display:inline-flex; align-items:center; gap:3px;">${getIcon('link', { size: 12 })} Meet</span>
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- COLUMNA 2: NOTIFICACIONES OPERATIVAS + MENSAJES RECIENTES -->
      <div style="display:flex; flex-direction:column; gap:20px;">
        
        <!-- PANEL DE NOTIFICACIONES Y ALERTAS -->
        <div class="dashboard-panel-card">
          <div class="dashboard-panel-header">
            <div class="dashboard-panel-title">
              <span style="display:inline-flex; align-items:center;">${getIcon('bell', { size: 18, color: 'var(--wine-800)' })}</span>
              <span>Notificaciones & Alertas</span>
            </div>
            <span style="font-size:0.75rem; color:var(--slate-500);">${notifications.length} recientes</span>
          </div>

          <div>
            ${notifications.map(n => `
              <div class="notification-card-item">
                <div class="notification-icon-wrap ${n.iconClass || 'info'}">
                  ${getIcon(n.iconName || 'bell', { size: 16 })}
                </div>
                <div class="notification-content">
                  <div class="notification-title">${n.titulo}</div>
                  <div class="notification-desc">${n.descripcion}</div>
                  <div class="notification-time" style="display:flex; align-items:center; gap:4px;">
                    <span style="display:inline-flex; align-items:center;">${getIcon('clock', { size: 10 })}</span> ${n.tiempo}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- PANEL DE MENSAJES Y NOTAS DE SEGUIMIENTO -->
        <div class="dashboard-panel-card">
          <div class="dashboard-panel-header">
            <div class="dashboard-panel-title">
              <span style="display:inline-flex; align-items:center;">${getIcon('clipboard', { size: 18, color: 'var(--wine-800)' })}</span>
              <span>Mensajes & Notas de Seguimiento</span>
            </div>
            <button class="btn btn-sm btn-outline" onclick="openQuickNoteModal('${allCandidatos[0]?.id || ''}')" style="display:inline-flex; align-items:center; gap:4px;">
              ${getIcon('edit', { size: 11 })} Nueva Nota
            </button>
          </div>

          <div>
            ${recentNotes.map(m => `
              <div class="recent-note-item">
                <div class="recent-note-header">
                  <div class="recent-note-cand" style="display:flex; align-items:center; gap:4px;">
                    <span style="display:inline-flex; align-items:center;">${getIcon('user', { size: 12, color: 'var(--wine-800)' })}</span>
                    ${m.candidato}
                  </div>
                  <div class="recent-note-date">${m.fecha}</div>
                </div>
                <div class="recent-note-text">${m.texto}</div>
                <div style="font-size:0.7rem; color:var(--slate-400); margin-top:2px;">
                  Registrado por: <strong>${m.autor}</strong>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>

    </div>

    <!-- DRAWER & MODALES -->
    ${renderAdvisorSpeechDrawerAndModals(allCandidatos)}
  `;
}

// ── PANTALLA 2: GESTIÓN DE CANDIDATOS & PIPELINE (TABLERO / TABLA) ─
function renderAsesorKanban() {
  const allCandidatos = DB.getCandidatos();
  const viewMode = State.kanbanView || 'kanban';

  let candidatos = allCandidatos;
  if (_asesorKanbanScope === 'mis' && State.currentUser) {
    const mis = allCandidatos.filter(c => c.id_asesor === State.currentUser.id);
    candidatos = mis.length > 0 ? mis : allCandidatos;
  }

  const misCount = State.currentUser ? allCandidatos.filter(c => c.id_asesor === State.currentUser.id).length : 0;

  let boardHtml = '';
  if (viewMode === 'kanban') {
    boardHtml = `
      <div class="kanban-8col-board" id="kanban-board">
        ${PIPELINE_8_FASES.map((col, index) => {
          const cards = candidatos.filter(c => normalizeCandidatePhase(c.estado_proceso) === col.id);
          return `
            <div class="kanban-8col" data-col="${col.id}" id="col-${col.id.replace(/\s+/g,'-')}">
              <div class="kanban-8col-header" style="border-top: 3px solid ${col.color};">
                <span class="kanban-8col-title">
                  <span style="display:inline-flex; align-items:center; margin-right:5px;">${getIcon(col.iconName, { size: 15, color: col.color })}</span>
                  ${index + 1}. ${col.label}
                </span>
                <span class="kanban-8col-count">${cards.length}</span>
              </div>
              <div class="kanban-drop-zone kanban-8col-dropzone" data-col="${col.id}">
                ${cards.map(c => `
                  <div class="kanban-card kanban-card-redesign" draggable="true" data-id="${c.id}" data-col="${col.id}">
                    
                    <div class="kanban-card-top" onclick="openCandidateDetail('${c.id}')" style="cursor:pointer;">
                      <div class="kanban-card-avatar" style="background:${getAvatarColor(c.nombre)};">
                        ${getInitials(c.nombre)}
                      </div>
                      <div class="kanban-card-info">
                        <div class="kanban-card-name" title="${c.nombre}">${c.nombre}</div>
                        <div class="kanban-card-meta" style="display:flex; align-items:center; gap:4px;">
                          <span style="display:inline-flex; align-items:center;">${getIcon('mapPin', { size: 11, color: 'var(--slate-400)' })}</span>
                          <span>${c.pais || 'No indicado'} · ${c.especialidad || 'Salud'}</span>
                        </div>
                      </div>
                    </div>

                    <div class="kanban-card-pills">
                      ${getLanguageBadgeHtml(c.nivel_aleman)}
                      
                      <div class="badge-advisor-small" title="Asesor asignado">
                        <span style="display:inline-flex; align-items:center; margin-right:3px;">${getIcon('user', { size: 11, color: 'var(--wine-800)' })}</span>
                        <span>${c.nombre_asesor ? c.nombre_asesor.split(' ')[0] : 'Sin asignar'}</span>
                      </div>
                    </div>

                    <!-- Menú de Acciones Rápidas en Tarjeta -->
                    <div class="kanban-card-hover-actions">
                      <button class="card-quick-btn" onclick="event.stopPropagation(); openCandidateDetail('${c.id}');" title="Ver Expediente Completo">
                        <span style="display:inline-flex; align-items:center; margin-right:3px;">${getIcon('eye', { size: 12 })}</span> Expediente
                      </button>
                      <button class="card-quick-btn speech-btn" onclick="event.stopPropagation(); openSpeechWidgetForCandidate('${c.id}');" title="Llamar con Speech Guiado">
                        <span style="display:inline-flex; align-items:center; margin-right:3px;">${getIcon('headphones', { size: 12 })}</span> Speech
                      </button>
                      <button class="card-quick-btn" onclick="event.stopPropagation(); openQuickNoteModal('${c.id}');" title="Añadir Nota Rápida">
                        <span style="display:inline-flex; align-items:center; margin-right:3px;">${getIcon('edit', { size: 12 })}</span> Nota
                      </button>
                    </div>

                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    boardHtml = `
      <div class="card">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Candidato</th>
                <th>País & Especialidad</th>
                <th>Nivel Alemán</th>
                <th>Asesor Asignado</th>
                <th>Fase del Pipeline</th>
                <th>Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody>
              ${candidatos.map(c => `
                <tr>
                  <td>
                    <div class="td-avatar" onclick="openCandidateDetail('${c.id}')" style="cursor:pointer;">
                      <div class="avatar" style="background:${getAvatarColor(c.nombre)}">${getInitials(c.nombre)}</div>
                      <div class="td-name">${c.nombre}</div>
                    </div>
                  </td>
                  <td>
                    <div style="display:flex; align-items:center; gap:5px;">
                      <span style="display:inline-flex; align-items:center;">${getIcon('mapPin', { size: 12, color: 'var(--slate-400)' })}</span>
                      <span>${c.pais || 'N/A'} · ${c.especialidad || 'Salud'}</span>
                    </div>
                  </td>
                  <td>${getLanguageBadgeHtml(c.nivel_aleman)}</td>
                  <td>
                    ${c.id_asesor ? `
                      <span class="badge badge-info" style="display:inline-flex; align-items:center; gap:4px;">
                        <span style="display:inline-flex; align-items:center;">${getIcon('user', { size: 11 })}</span> ${c.nombre_asesor}
                      </span>
                    ` : `
                      <span class="badge badge-danger" style="display:inline-flex; align-items:center; gap:4px;">
                        <span style="display:inline-flex; align-items:center;">${getIcon('alertTriangle', { size: 11 })}</span> Sin Asignar
                      </span>
                    `}
                  </td>
                  <td>
                    <span class="badge badge-warning">${normalizeCandidatePhase(c.estado_proceso)}</span>
                  </td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-sm btn-outline" onclick="openCandidateDetail('${c.id}')" title="Ver Expediente">
                        <span style="display:inline-flex; align-items:center;">${getIcon('eye', { size: 13 })}</span>
                      </button>
                      <button class="btn btn-sm btn-outline" onclick="openSpeechWidgetForCandidate('${c.id}')" title="Llamar con Speech">
                        <span style="display:inline-flex; align-items:center;">${getIcon('headphones', { size: 13 })}</span>
                      </button>
                      <button class="btn btn-sm btn-outline" onclick="openQuickNoteModal('${c.id}')" title="Añadir Nota">
                        <span style="display:inline-flex; align-items:center;">${getIcon('edit', { size: 13 })}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  return `
    <!-- Cabecera Principal del Pipeline de Candidatos -->
    <div class="kanban-banner">
      <div>
        <h1 class="kanban-banner-title">Gestión de Candidatos & Pipeline</h1>
        <p class="kanban-banner-subtitle">Pipeline integral de integración de 8 fases · JN Palabras Heidelberg</p>
      </div>
      <div class="kanban-banner-actions">
        ${State.currentUser && (State.activeRole === 'Asesor' || State.activeRole === 'Super Asesor' || State.activeRole === 'Admin') ? `
        <div style="display:flex; background:rgba(255,255,255,0.15); border-radius:8px; padding:2px;">
          <button class="btn btn-sm" style="${_asesorKanbanScope==='todos'?'background:rgba(255,255,255,0.25);color:#fff;':'color:rgba(255,255,255,0.7);background:transparent;'} border:none; padding:4px 10px; font-size:0.75rem;" onclick="_asesorKanbanScope='todos';renderDashboard(State.activeRole,'asesor-kanban');">
            Todos (${allCandidatos.length})
          </button>
          <button class="btn btn-sm" style="${_asesorKanbanScope==='mis'?'background:rgba(255,255,255,0.25);color:#fff;':'color:rgba(255,255,255,0.7);background:transparent;'} border:none; padding:4px 10px; font-size:0.75rem;" onclick="_asesorKanbanScope='mis';renderDashboard(State.activeRole,'asesor-kanban');">
            Mis Asignados (${misCount})
          </button>
        </div>
        ` : ''}
        <button class="btn btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.2);" onclick="toggleKanbanView()">
          <span style="margin-right:5px; display:inline-flex; align-items:center;">${getIcon('layout', { size: 14 })}</span> Vista ${viewMode === 'kanban' ? 'Lista' : 'Kanban'}
        </button>
        <button class="btn" style="background:var(--gold-500);color:var(--wine-900);font-weight:700;" onclick="openModal('modal-nuevo-candidato')">
          <span style="margin-right:5px; display:inline-flex; align-items:center;">${getIcon('userPlus', { size: 14, color: 'var(--wine-900)' })}</span> Agregar Candidato
        </button>
        <button class="btn btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.2);" onclick="exportKanbanCSV()">
          <span style="margin-right:5px; display:inline-flex; align-items:center;">${getIcon('download', { size: 14 })}</span> Exportar CSV
        </button>
      </div>
    </div>

    <!-- Barra de Búsqueda y Filtros en Tiempo Real -->
    <div style="margin-bottom:16px; display:flex; gap:12px; align-items:center;">
      <div style="flex:1; position:relative; display:flex; align-items:center;">
        <span style="position:absolute; left:12px; color:var(--slate-400); display:inline-flex; align-items:center;">${getIcon('search', { size: 16 })}</span>
        <input type="text" id="kanban-filter-search" class="form-input" style="padding-left:36px; border-radius:10px; background:#ffffff;" placeholder="Buscar candidato por nombre, especialidad o país..." oninput="filterKanbanCandidates(this.value)">
      </div>
    </div>

    <!-- Tablero Kanban de 8 Columnas o Tabla -->
    <div class="kanban-8col-wrapper">
      ${boardHtml}
    </div>

    <!-- DRAWER & MODALES -->
    ${renderAdvisorSpeechDrawerAndModals(allCandidatos)}
  `;
}

function toggleKanbanView() {
  State.kanbanView = State.kanbanView === 'list' ? 'kanban' : 'list';
  renderDashboard(State.activeRole, 'asesor-kanban');
}

async function guardarNuevoCandidato() {
  const nombre = $('nc-nombre').value.trim();
  const especialidad = $('nc-especialidad').value.trim();
  const pais = $('nc-pais').value.trim();
  const aleman = $('nc-aleman').value;
  
  if (!nombre || !especialidad || !pais) {
    showToast('Error', 'Completa todos los campos obligatorios', 'error');
    return;
  }
  
  await DB.createCandidato({
    nombre,
    especialidad,
    pais,
    nivel_aleman: aleman,
    estado_proceso: 'Postulación',
    estado_homologacion: 'Pendiente'
  });
  
  closeModal('modal-nuevo-candidato');
  showToast('Éxito', 'Candidato agregado exitosamente', 'success');
  renderDashboard(State.activeRole, 'asesor-kanban');
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateKanbanCounters(board) {
  const b = board || $('kanban-board');
  if (!b) return;
  b.querySelectorAll('.kanban-col').forEach(col => {
    const countBadge = col.querySelector('.kanban-col-count');
    const zone = col.querySelector('.kanban-drop-zone');
    if (countBadge && zone) {
      countBadge.textContent = zone.querySelectorAll('.kanban-card').length;
    }
  });
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
    try {
      e.dataTransfer.setData('text/plain', draggedId);
    } catch(err) {}
  });

  board.addEventListener('dragend', e => {
    const card = e.target.closest('.kanban-card');
    if (card) card.classList.remove('dragging');
    $$('.kanban-drop-zone').forEach(z => z.classList.remove('dragover'));
  });

  board.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const zone = e.target.closest('.kanban-drop-zone');
    if (zone) {
      $$('.kanban-drop-zone').forEach(z => { if (z !== zone) z.classList.remove('dragover'); });
      zone.classList.add('dragover');
    }
  });

  board.addEventListener('dragleave', e => {
    const zone = e.target.closest('.kanban-drop-zone');
    if (zone && !zone.contains(e.relatedTarget)) {
      zone.classList.remove('dragover');
    }
  });

  board.addEventListener('drop', async e => {
    e.preventDefault();
    $$('.kanban-drop-zone').forEach(z => z.classList.remove('dragover'));

    const zone = e.target.closest('.kanban-drop-zone');
    if (!zone || !draggedId) return;

    const newCol = zone.dataset.col;
    const prevCol = draggedFromCol;

    if (newCol && newCol !== prevCol) {
      const card = board.querySelector(`.kanban-card[data-id="${draggedId}"]`);
      if (card) {
        card.dataset.col = newCol;
        card.classList.remove('dragging');

        // Ubicar en la posición exacta soltada
        const afterElement = getDragAfterElement(zone, e.clientY);
        if (afterElement == null) {
          zone.appendChild(card);
        } else {
          zone.insertBefore(card, afterElement);
        }

        // Micro-animación fluida de respuesta inmediata
        card.classList.add('card-drop-pop');
        setTimeout(() => card.classList.remove('card-drop-pop'), 350);
      }

      // Actualizar contadores numéricos de columnas inmediatamente (0ms)
      updateKanbanCounters(board);

      // Sincronización asíncrona optimista en segundo plano
      try {
        await DB.updateCandidato(draggedId, { estado_proceso: newCol });
        const c = DB.getCandidatoById(draggedId);
        showToast('Candidato movido', `${c?.nombre || 'Candidato'} → ${newCol}`, 'success');
        if (newCol === 'Colocado') {
          showToast('🎉 ¡Colocación exitosa!', `${c?.nombre || 'Candidato'} ha sido colocado exitosamente en Alemania.`, 'success', 6000);
          DB.addNotificacion({
            id_usuario_dest: c?.id_usuario || 'u-cand-001',
            tipo: 'Visado_Aprobado',
            titulo: '¡Felicitaciones! Estás colocado/a',
            mensaje: 'Has completado exitosamente el proceso de JN Palabras. ¡Bienvenido/a a Alemania!'
          });
        }
      } catch (err) {
        console.error('Error al mover candidato:', err);
        // Rollback visual si la sincronización falla
        if (card && prevCol) {
          card.dataset.col = prevCol;
          const origZone = board.querySelector(`.kanban-drop-zone[data-col="${prevCol}"]`);
          if (origZone) origZone.appendChild(card);
          updateKanbanCounters(board);
        }
        showToast('Error', 'No se pudo sincronizar el cambio de estado.', 'error');
      }
    }
  });
}

function getCandidateAvatarIllustration(c) {
  const nombre = c ? (c.nombre || 'Candidato') : 'Candidato';
  const initials = getInitials(nombre);
  
  // Paleta de gradientes elegantes según identidad JN Palabras
  const avatarGradients = [
    'linear-gradient(135deg, #7a1524 0%, #a81c33 100%)', // Vino institucional
    'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', // Azul ultramar
    'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', // Verde esmeralda
    'linear-gradient(135deg, #854d0e 0%, #d97706 100%)', // Oro cálido
    'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)'  // Púrpura real
  ];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = (hash << 5) - hash + nombre.charCodeAt(i);
  const bgGradient = avatarGradients[Math.abs(hash) % avatarGradients.length];

  const hasPhotoUrl = c && c.foto && (c.foto.startsWith('http') || c.foto.startsWith('data:') || c.foto.startsWith('/'));

  if (hasPhotoUrl) {
    return `
      <div class="candidate-avatar-wrap" style="background:#f1f5f9;border:3px solid #ffffff;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
        <img src="${c.foto}" alt="${c.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:24px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div style="display:none;width:100%;height:100%;border-radius:24px;background:${bgGradient};align-items:center;justify-content:center;color:#ffffff;font-size:2.2rem;font-weight:800;font-family:var(--font-heading);">${initials}</div>
        <span class="candidate-status-dot" title="En línea / Activo en el programa"></span>
      </div>
    `;
  }

  return `
    <div class="candidate-avatar-wrap" style="background:${bgGradient};border:3px solid #ffffff;box-shadow:0 8px 24px rgba(0,0,0,0.08);color:#ffffff;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:2.2rem;font-weight:800;letter-spacing:1px;font-family:var(--font-heading);">${initials}</span>
      <span class="candidate-status-dot" title="En línea / Activo en el programa"></span>
    </div>
  `;
}

function getCandidateProcessSteps(estadoRaw) {
  const norm = (estadoRaw || '').toLowerCase();
  
  // Determinamos el índice activo (0: Migración, 1: Idioma, 2: Integración, 3: Vida Alemania)
  let activeIndex = 1; // Default: Idioma (como en la plantilla de referencia)
  
  if (norm.includes('lead') || norm.includes('contacto') || norm.includes('recluta')) {
    activeIndex = 0;
  } else if (norm.includes('idioma') || norm.includes('aleman') || norm.includes('b1') || norm.includes('b2') || norm.includes('a1') || norm.includes('a2')) {
    activeIndex = 1;
  } else if (norm.includes('entrevista') || norm.includes('contrato') || norm.includes('visa') || norm.includes('homolog')) {
    activeIndex = 2;
  } else if (norm.includes('pre-viaje') || norm.includes('viaje') || norm.includes('destino') || norm.includes('alemania') || norm.includes('inserc') || norm.includes('colocado')) {
    activeIndex = 3;
  }

  const steps = [
    {
      num: '01. MIGRACIÓN',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    },
    {
      num: '02. IDIOMA',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
    },
    {
      num: '03. INTEGRACIÓN',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
    },
    {
      num: '04. VIDA ALEMANIA',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"></path><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`
    }
  ];

  return { activeIndex, steps };
}

function renderCandidateProfileHTML(c) {
  const { activeIndex, steps } = getCandidateProcessSteps(c.estado_proceso);
  const progressPercent = activeIndex === 0 ? 12 : (activeIndex === 1 ? 42 : (activeIndex === 2 ? 72 : 100));

  // Formato de nombre y metadatos
  const nombre = c.nombre || 'Mateo Valencia';
  const displayName = nombre.replace(/\s+/, '<br>');
  const lastName = nombre.split(' ').slice(1).join('_') || 'Valencia';
  const especialidad = c.especialidad || 'Enfermero Profesional';
  const roleBadge = (especialidad.toLowerCase().includes('enferm') ? 'ENFERMERO<br>PROFESIONAL' : especialidad.toUpperCase());
  const subespecialidad = c.subespecialidad || 'Cuidados Intensivos';
  const idioma = c.nivel_aleman && !c.nivel_aleman.includes('Ver Test') ? `Alemán ${c.nivel_aleman} (En curso)` : 'Alemán B2 (En curso)';
  const ciudad = c.ciudad || 'Medellín';
  const pais = c.pais || 'Colombia';
  let fechaMiembro = 'Miembro desde Oct 2023';
  if (c.fecha_alta) {
    try {
      const d = new Date(c.fecha_alta);
      if (!isNaN(d.getTime())) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        fechaMiembro = `Miembro desde ${months[d.getMonth()]} ${d.getFullYear()}`;
      }
    } catch (e) {}
  }

  // Notas e Historial
  const notas = DB.getNotas ? DB.getNotas(c.id) : [];
  const latestNota = notas && notas.length > 0 ? notas[0] : null;
  const quoteText = latestNota ? latestNota.contenido : `El candidato muestra gran disposición para el aprendizaje del idioma. Su experiencia en ${subespecialidad} es un valor agregado muy fuerte para los hospitales en Heidelberg.`;
  const authorName = latestNota && latestNota.autor ? latestNota.autor : 'Dr. Hans Müller';
  const authorInitials = getInitials(authorName);

  return `
    <div class="candidate-profile-page">
      <!-- 1. Barra Superior del Perfil -->
      <div class="candidate-profile-topbar">
        <div class="candidate-profile-title-wrap">
          <button class="candidate-back-btn" onclick="closeCandidateProfile()" title="Volver al tablero">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h1 class="candidate-profile-title">Perfil del Candidato</h1>
        </div>
        <div class="candidate-topbar-actions">
          <button class="btn-pill-outline" onclick="exportCandidateProfilePDF('${c.id}')" title="Descargar o imprimir perfil en PDF">
            EXPORTAR PDF
          </button>
          <button class="btn-pill-primary" onclick="openEditCandidateModal('${c.id}')" title="Editar datos del candidato">
            EDITAR PERFIL
          </button>
        </div>
      </div>

      <!-- 2. Rejilla Principal de 2 Columnas -->
      <div class="candidate-profile-grid">
        <!-- Columna Izquierda (Principal) -->
        <div>
          <!-- Tarjeta Hero del Candidato -->
          <div class="candidate-hero-card">
            ${getCandidateAvatarIllustration(c)}
            <div class="candidate-hero-info">
              <div class="candidate-hero-header-row">
                <h2 class="candidate-hero-name">${displayName}</h2>
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
                  <button class="candidate-cv-pill-btn" onclick="openCandidateCVModal('${c.id}')" title="Ver Hoja de Vida / Curriculum Vitae">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span>Ver Hoja de Vida</span>
                  </button>
                  <div class="candidate-hero-role-badge">${roleBadge}</div>
                </div>
              </div>
              
              <div style="margin-bottom: 10px;">
                <span class="candidate-integrated-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  Candidato Integrado al Programa
                </span>
              </div>
              
              <div class="candidate-hero-meta-row">
                <span class="candidate-hero-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  ${ciudad}, ${pais}
                </span>
                <span class="candidate-hero-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  ${fechaMiembro}
                </span>
              </div>

              <div class="candidate-hero-pills">
                <div class="candidate-hero-pill">
                  <div class="candidate-hero-pill-label">IDIOMA</div>
                  <div class="candidate-hero-pill-val">${idioma}</div>
                </div>
                <div class="candidate-hero-pill">
                  <div class="candidate-hero-pill-label">ESPECIALIDAD</div>
                  <div class="candidate-hero-pill-val">${subespecialidad}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tarjeta de Estado del Proceso (Stepper Horizontal) -->
          <div class="candidate-standard-card">
            <div class="candidate-card-header-wine">ESTADO DEL PROCESO</div>
            <div class="candidate-stepper-container">
              <div class="candidate-stepper-line">
                <div class="candidate-stepper-line-active" style="width: ${progressPercent}%;"></div>
              </div>
              ${steps.map((st, idx) => {
                let circleClass = 'pending';
                let statusLabel = 'PENDIENTE';
                let statusClass = 'pending';

                if (idx < activeIndex) {
                  circleClass = 'completed';
                  statusLabel = 'COMPLETADO';
                  statusClass = 'completed';
                } else if (idx === activeIndex) {
                  circleClass = 'active';
                  statusLabel = 'EN PROCESO';
                  statusClass = 'in-progress';
                }

                return `
                  <div class="candidate-step-node">
                    <div class="candidate-step-circle ${circleClass}">
                      ${st.icon}
                    </div>
                    <div class="candidate-step-label">${st.num}</div>
                    <div class="candidate-step-status ${statusClass}">${statusLabel}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Tarjeta de Documentación Requerida (Grid 2x2) -->
          <div class="candidate-standard-card">
            <div class="candidate-docs-header">
              <div class="candidate-card-header-wine" style="margin-bottom:0;">DOCUMENTACIÓN REQUERIDA</div>
              <button class="candidate-upload-link" onclick="quickUploadDocForCandidate('${c.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                SUBIR NUEVO
              </button>
            </div>

            <div class="candidate-docs-grid">
              <!-- Doc 1: Pasaporte -->
              <div class="candidate-doc-item" onclick="openCandidateDossierModal('${c.id}', 'docs')" style="cursor:pointer;" title="Ver en expediente">
                <div class="candidate-doc-left">
                  <div class="candidate-doc-icon-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                  <div>
                    <div class="candidate-doc-title">Pasaporte_${lastName}.pdf</div>
                    <div class="candidate-doc-sub">Válido hasta: 12/2028</div>
                  </div>
                </div>
              </div>

              <!-- Doc 2: Diploma -->
              <div class="candidate-doc-item" onclick="openCandidateDossierModal('${c.id}', 'docs')" style="cursor:pointer;" title="Ver en expediente">
                <div class="candidate-doc-left">
                  <div class="candidate-doc-icon-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                  </div>
                  <div>
                    <div class="candidate-doc-title">Diploma_${(especialidad.replace(/\s+/g, '_'))}.pdf</div>
                    <div class="candidate-doc-sub">Certificado por Ministerio</div>
                  </div>
                </div>
              </div>

              <!-- Doc 3: Certificado Alemán (Esperando Validación) -->
              <div class="candidate-doc-item pending-validation" onclick="openCandidateDossierModal('${c.id}', 'docs')" style="cursor:pointer;" title="Ver en expediente">
                <div class="candidate-doc-left">
                  <div class="candidate-doc-icon-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                  </div>
                  <div>
                    <div class="candidate-doc-title">Certificado_Alemán_${c.nivel_aleman && !c.nivel_aleman.includes('Ver Test') ? c.nivel_aleman : 'A2'}.pdf</div>
                    <div class="candidate-doc-sub">ESPERANDO VALIDACIÓN</div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;" title="Pendiente de revisión">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
              </div>

              <!-- Doc 4: Seguro de Viaje (Omitir) -->
              <div class="candidate-doc-item dashed">
                <div class="candidate-doc-left">
                  <div class="candidate-doc-icon-wrap" style="background:#f8fafc;border-style:dashed;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  </div>
                  <div>
                    <div class="candidate-doc-title" style="color:#64748b;">Seguro de Viaje</div>
                    <div class="candidate-doc-sub">Requerido próximamente</div>
                  </div>
                </div>
                <button class="candidate-doc-omit-btn" onclick="omitCandidateDocStep('${c.id}')" title="Omitir este requisito temporalmente">OMITIR</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Derecha (Sidebar) -->
        <div>
          <!-- Acciones Rápidas (Caja Vino Tinto Oscuro) -->
          <div class="candidate-actions-box">
            <div class="candidate-actions-title">ACCIONES RÁPIDAS</div>
            <button class="candidate-action-btn-item" onclick="openCandidateChatModal('${c.id}')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              <span>Enviar Mensaje</span>
            </button>
            <button class="candidate-action-btn-item" onclick="openScheduleInterviewModal('${c.id}')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Agendar Entrevista</span>
            </button>
            <button class="candidate-action-btn-item" onclick="openCandidateDossierModal('${c.id}')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              <span>Ver Expediente Completo</span>
            </button>
          </div>

          <!-- Historial -->
          <div class="candidate-standard-card">
            <div class="candidate-card-header-wine">HISTORIAL</div>
            <div class="candidate-history-timeline">
              <div class="candidate-history-event">
                <div class="candidate-history-dot active"></div>
                <div class="candidate-history-time">HACE 2 HORAS</div>
                <div class="candidate-history-desc">Documentos de Visa aprobados</div>
                <div class="candidate-history-author">Por: Elena Martínez (Admin)</div>
              </div>
              <div class="candidate-history-event">
                <div class="candidate-history-dot"></div>
                <div class="candidate-history-time">AYER, 14:30</div>
                <div class="candidate-history-desc">Subió Certificado Alemán A2</div>
              </div>
              <div class="candidate-history-event">
                <div class="candidate-history-dot"></div>
                <div class="candidate-history-time">24 ENE, 2024</div>
                <div class="candidate-history-desc">Entrevista inicial aprobada</div>
              </div>
            </div>
          </div>

          <!-- Notas Internas -->
          <div class="candidate-standard-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <div class="candidate-card-header-wine" style="margin-bottom:0;">NOTAS INTERNAS ${notas.length > 0 ? `(${notas.length})` : ''}</div>
              <button class="btn btn-outline btn-xs" onclick="openAddCandidateNoteModal('${c.id}')" style="font-size:0.75rem;padding:5px 12px;border-radius:12px;font-weight:700;color:#801020;border-color:#801020;background:#ffffff;">+ Añadir Nota</button>
            </div>
            ${notas.length > 0 ? `
              <div style="display:flex;flex-direction:column;gap:10px;max-height:260px;overflow-y:auto;padding-right:4px;">
                ${notas.map(n => `
                  <div class="candidate-notes-quote-box" style="padding:14px;margin:0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                      <span style="font-size:0.7rem;font-weight:700;color:#801020;background:#fdf2f4;padding:2px 8px;border-radius:6px;">${n.tipo || 'Nota Interna'}</span>
                      <span style="font-size:0.7rem;color:#94a3b8;">${n.fecha_hora || n.fecha || ''}</span>
                    </div>
                    <p class="candidate-notes-quote-text" style="margin-bottom:8px;font-size:0.85rem;color:#334155;">
                      "${n.contenido}"
                    </p>
                    <div class="candidate-notes-quote-author">
                      <div class="candidate-notes-author-circle">${getInitials(n.autor || 'JN')}</div>
                      <div class="candidate-notes-author-name">${n.autor || 'Asesor'}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="candidate-notes-quote-box">
                <p class="candidate-notes-quote-text">
                  "${quoteText}"
                </p>
                <div class="candidate-notes-quote-author">
                  <div class="candidate-notes-author-circle">${authorInitials}</div>
                  <div class="candidate-notes-author-name">${authorName}</div>
                </div>
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCandidateProfilePage() {
  const id = State.viewingCandidateId || State.selectedCandidato;
  let c = DB.getCandidatoById(id);

  if (!c) {
    const list = DB.getCandidatos ? DB.getCandidatos() : [];
    if (list && list.length > 0) {
      c = list[0];
      State.viewingCandidateId = c.id;
      State.selectedCandidato = c.id;
    }
  }

  if (!c) {
    return `
      <div style="padding:60px 20px;text-align:center;">
        <h3 style="color:var(--wine-800);margin-bottom:14px;font-size:1.3rem;">No hay candidato seleccionado</h3>
        <p style="color:var(--slate-500);margin-bottom:24px;">Selecciona un candidato desde el Tablero Kanban o la Lista para ver su perfil estándar.</p>
        <button class="btn btn-primary" onclick="closeCandidateProfile()">Volver al Tablero</button>
      </div>
    `;
  }

  return renderCandidateProfileHTML(c);
}

function openCandidateDetail(id) {
  const c = DB.getCandidatoById(id);
  if (!c) {
    showToast('Aviso', 'No se encontró la información del candidato.', 'warning');
    return;
  }

  State.viewingCandidateId = id;
  State.selectedCandidato = id;
  
  if (State.currentSidebar !== 'candidato-perfil') {
    State.returnViewFromProfile = State.currentSidebar || 'asesor-kanban';
  }

  renderDashboard(State.activeRole, 'candidato-perfil');
}

function closeCandidateProfile() {
  const target = State.returnViewFromProfile || (State.activeRole === 'candidato' ? 'candidato-dashboard' : (State.activeRole === 'asesor' ? 'asesor-kanban' : 'admin-candidatos'));
  renderDashboard(State.activeRole, target);
}

function exportCandidateProfilePDF(id) {
  const c = DB.getCandidatoById(id);
  const nombre = c ? c.nombre.replace(/\\s+/g, '_') : 'Candidato';
  const originalTitle = document.title;
  document.title = `Perfil_Candidato_${nombre}_JN_Palabras`;
  window.print();
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

function openEditCandidateModal(id) {
  const c = DB.getCandidatoById(id);
  if (!c) return;

  const resp = c.respuestas_elegibilidad || {};

  const modalHtml = `
    <div class="modal-overlay visible open" id="modal-edit-candidate-quick" role="dialog" aria-modal="true" style="z-index:9999;" onclick="if(event.target===this) closeModal('modal-edit-candidate-quick')">
      <div class="modal modal-card" style="max-width:760px;width:95%;border-radius:24px;padding:28px;max-height:90vh;overflow-y:auto;background:#ffffff;">
        <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding:0 0 16px 0;border-bottom:1px solid #e2e8f0;">
          <div>
            <h3 style="font-family:var(--font-heading);color:var(--wine-800);font-size:1.35rem;margin:0;">Editar Perfil y Formulario de Aplicación</h3>
            <p style="font-size:0.85rem;color:var(--slate-500);margin:4px 0 0 0;">Candidato Integrado al Programa: <strong style="color:var(--slate-800);">${c.nombre}</strong></p>
          </div>
          <button class="modal-close" onclick="closeModal('modal-edit-candidate-quick')" style="background:none;border:none;font-size:1.3rem;cursor:pointer;">✕</button>
        </div>

        <!-- SECCIÓN 1: DATOS PERSONALES Y CONTACTO -->
        <div style="font-size:0.85rem;font-weight:800;letter-spacing:1px;color:#801020;text-transform:uppercase;margin-bottom:14px;border-bottom:1.5px solid #fdf2f4;padding-bottom:6px;">
          1. Datos Personales y Contacto
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px;">
          <div style="grid-column:span 2;">
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Nombre Completo</label>
            <input class="form-input" id="edit-cand-nombre" value="${c.nombre || ''}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Correo Electrónico</label>
            <input class="form-input" id="edit-cand-email" value="${c.correo || ''}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Teléfono / WhatsApp</label>
            <input class="form-input" id="edit-cand-tel" value="${c.telefono || ''}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Ciudad</label>
            <input class="form-input" id="edit-cand-ciudad" value="${c.ciudad || 'Medellín'}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">País</label>
            <input class="form-input" id="edit-cand-pais" value="${c.pais || 'Colombia'}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Edad (Años)</label>
            <input class="form-input" id="edit-cand-edad" type="number" value="${c.edad || '32'}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Estado Civil / Situación</label>
            <input class="form-input" id="edit-cand-marital" value="${resp.marital || 'Soltero/a'}">
          </div>
        </div>

        <!-- SECCIÓN 2: PERFIL PROFESIONAL Y FASE DEL PROCESO -->
        <div style="font-size:0.85rem;font-weight:800;letter-spacing:1px;color:#801020;text-transform:uppercase;margin-bottom:14px;border-bottom:1.5px solid #fdf2f4;padding-bottom:6px;">
          2. Perfil Médico y Estado en el Programa
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px;">
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Especialidad / Título</label>
            <input class="form-input" id="edit-cand-esp" value="${c.especialidad && !c.especialidad.includes('Ver Test') ? c.especialidad : 'Enfermero Profesional'}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Subespecialidad / Área</label>
            <input class="form-input" id="edit-cand-subesp" value="${c.subespecialidad || 'Cuidados Intensivos'}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Nivel de Alemán</label>
            <select class="form-select" id="edit-cand-aleman">
              <option value="A1" ${c.nivel_aleman==='A1'?'selected':''}>A1 (Principiante)</option>
              <option value="A2" ${c.nivel_aleman==='A2'?'selected':''}>A2 (Básico)</option>
              <option value="B1" ${c.nivel_aleman==='B1'?'selected':''}>B1 (Intermedio)</option>
              <option value="B2" ${c.nivel_aleman==='B2'||!c.nivel_aleman||c.nivel_aleman.includes('Ver Test')?'selected':''}>B2 (Requerido para Homologación)</option>
              <option value="C1" ${c.nivel_aleman==='C1'?'selected':''}>C1 (Avanzado / Médicos)</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Años de Experiencia Clínica</label>
            <input class="form-input" id="edit-cand-exp-years" type="number" value="${c.anos_exp !== undefined ? c.anos_exp : '4'}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Fase del Proceso (Pipeline)</label>
            <select class="form-select" id="edit-cand-fase">
              <option value="Lead Nuevo" ${c.estado_proceso==='Lead Nuevo'?'selected':''}>01. Lead Nuevo</option>
              <option value="1er Contacto / Reclutamiento" ${c.estado_proceso==='1er Contacto / Reclutamiento'?'selected':''}>02. 1er Contacto</option>
              <option value="Suficiencia de Idioma (A1-B2)" ${c.estado_proceso==='Suficiencia de Idioma (A1-B2)'||c.estado_proceso==='En Proceso'?'selected':''}>03. Suficiencia de Idioma</option>
              <option value="Entrevista y Contrato" ${c.estado_proceso==='Entrevista y Contrato'?'selected':''}>04. Entrevista y Contrato</option>
              <option value="Procesamiento de Visa" ${c.estado_proceso==='Procesamiento de Visa'?'selected':''}>05. Procesamiento de Visa</option>
              <option value="Fase Pre-viaje" ${c.estado_proceso==='Fase Pre-viaje'?'selected':''}>06. Fase Pre-viaje</option>
              <option value="En Destino" ${c.estado_proceso==='En Destino'?'selected':''}>07. En Destino</option>
              <option value="Inserción Exitosa" ${c.estado_proceso==='Inserción Exitosa'?'selected':''}>08. Inserción Exitosa</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Estado de Homologación</label>
            <select class="form-select" id="edit-cand-homolog">
              <option value="Pendiente" ${c.estado_homologacion==='Pendiente'||!c.estado_homologacion?'selected':''}>Pendiente</option>
              <option value="En Trámite" ${c.estado_homologacion==='En Trámite'||c.estado_homologacion==='En Proceso'?'selected':''}>En Trámite</option>
              <option value="Aprobado" ${c.estado_homologacion==='Aprobado'?'selected':''}>Aprobado Definitivo</option>
            </select>
          </div>
        </div>

        <!-- SECCIÓN 3: FORMULARIO DE APLICACIÓN INICIAL (ELEGIBILIDAD) -->
        <div style="font-size:0.85rem;font-weight:800;letter-spacing:1px;color:#801020;text-transform:uppercase;margin-bottom:14px;border-bottom:1.5px solid #fdf2f4;padding-bottom:6px;">
          3. Información del Formulario de Aplicación (Elegibilidad)
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;background:#f8fafc;padding:18px;border-radius:16px;border:1px solid #e2e8f0;">
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">¿Tiene título o carrera?</label>
            <input class="form-input" id="edit-app-degree" value="${resp.degree_check || 'Sí, tengo título o carrera'}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Sector Declarado</label>
            <input class="form-input" id="edit-app-sector" value="${resp.sector || 'Salud / Medicina'}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Profesión en Aplicación</label>
            <input class="form-input" id="edit-app-profession" value="${resp.profession || 'Enfermero/a Profesional'}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Nivel Educativo Máximo</label>
            <input class="form-input" id="edit-app-edu-level" value="${resp.education_level || 'Licenciatura'}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Rango de Experiencia</label>
            <input class="form-input" id="edit-app-experience" value="${resp.experience || '4 Años o más'}">
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Puntaje de Elegibilidad (0-30)</label>
            <input class="form-input" id="edit-app-score" type="number" value="${c.puntaje_elegibilidad !== undefined ? c.puntaje_elegibilidad : '26'}">
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px;">
          <button class="btn btn-outline" onclick="closeModal('modal-edit-candidate-quick')">Cancelar</button>
          <button class="btn btn-primary" onclick="saveCandidateProfileEdit('${c.id}')" style="background:#801020;border-color:#801020;padding:10px 24px;border-radius:12px;font-weight:700;">Guardar Cambios</button>
        </div>
      </div>
    </div>
  `;

  let existing = $('modal-edit-candidate-quick');
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveCandidateProfileEdit(id) {
  const nombre = $('edit-cand-nombre')?.value?.trim();
  const correo = $('edit-cand-email')?.value?.trim();
  const telefono = $('edit-cand-tel')?.value?.trim();
  const ciudad = $('edit-cand-ciudad')?.value?.trim();
  const pais = $('edit-cand-pais')?.value?.trim();
  const edad = $('edit-cand-edad')?.value?.trim();
  const marital = $('edit-cand-marital')?.value?.trim();

  const especialidad = $('edit-cand-esp')?.value?.trim();
  const subespecialidad = $('edit-cand-subesp')?.value?.trim();
  const nivel_aleman = $('edit-cand-aleman')?.value;
  const anos_exp = parseInt($('edit-cand-exp-years')?.value) || 0;
  const estado_proceso = $('edit-cand-fase')?.value;
  const estado_homologacion = $('edit-cand-homolog')?.value;

  const degree_check = $('edit-app-degree')?.value?.trim();
  const sector = $('edit-app-sector')?.value?.trim();
  const profession = $('edit-app-profession')?.value?.trim();
  const education_level = $('edit-app-edu-level')?.value?.trim();
  const experience = $('edit-app-experience')?.value?.trim();
  const puntaje_elegibilidad = parseInt($('edit-app-score')?.value) || 25;

  if (!nombre) {
    showToast('Error', 'El nombre es obligatorio', 'error');
    return;
  }

  const c = DB.getCandidatoById(id);
  const updatedRespuestas = {
    ...(c?.respuestas_elegibilidad || {}),
    degree_check,
    sector,
    profession,
    education_level,
    experience,
    marital
  };

  DB.updateCandidato(id, {
    nombre,
    correo,
    telefono,
    ciudad,
    pais,
    edad,
    especialidad,
    subespecialidad,
    nivel_aleman,
    anos_exp,
    estado_proceso,
    estado_homologacion,
    puntaje_elegibilidad,
    respuestas_elegibilidad: updatedRespuestas
  }).then(() => {
    showToast('Éxito', 'Perfil del candidato actualizado con éxito', 'success');
    closeModal('modal-edit-candidate-quick');
    const modalEl = $('modal-edit-candidate-quick');
    if (modalEl) modalEl.remove();
    renderDashboard(State.activeRole, 'candidato-perfil');
  }).catch(e => {
    showToast('Error', 'No se pudo guardar la información', 'error');
  });
}

/* ── MODAL CUADRO PARA AÑADIR NOTA INTERNA ── */
function openAddCandidateNoteModal(id) {
  const c = DB.getCandidatoById(id);
  if (!c) return;

  const modalHtml = `
    <div class="modal-overlay visible open" id="modal-add-candidate-note-dialog" role="dialog" aria-modal="true" style="z-index:9999;" onclick="if(event.target===this) closeModal('modal-add-candidate-note-dialog')">
      <div class="modal modal-card" style="max-width:520px;border-radius:24px;padding:28px;background:#ffffff;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <div>
            <h3 style="font-family:var(--font-heading);color:var(--wine-800);font-size:1.3rem;margin:0;">Añadir Nota Interna</h3>
            <p style="font-size:0.875rem;color:var(--slate-500);margin:4px 0 0 0;">Candidato: <strong style="color:var(--slate-800);">${c.nombre}</strong></p>
          </div>
          <button onclick="closeModal('modal-add-candidate-note-dialog')" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--slate-400);">✕</button>
        </div>

        <div style="display:flex;flex-direction:column;gap:14px;">
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Tipo de Nota / Categoría</label>
            <select class="form-select" id="new-note-cat" style="width:100%;">
              <option value="Nota de Seguimiento">📝 Nota de Seguimiento General</option>
              <option value="Revisión de Documento">📋 Revisión de Documentos / Homologación</option>
              <option value="Avance de Idioma">🗣️ Avance de Idioma Alemán</option>
              <option value="Llamada Telefónica">📞 Llamada Telefónica con Asesor</option>
              <option value="Trámite de Visa">🛂 Trámite de Visa / Vuelo</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Contenido de la Nota</label>
            <textarea class="form-input" id="new-note-body" rows="4" placeholder="Escribe aquí las observaciones, acuerdos o seguimiento del candidato..." style="width:100%;resize:vertical;font-size:0.9rem;border-radius:12px;padding:12px;"></textarea>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:22px;">
          <button class="btn btn-outline" onclick="closeModal('modal-add-candidate-note-dialog')">Cancelar</button>
          <button class="btn btn-primary" onclick="saveCandidateNoteFromModal('${c.id}')" style="background:#801020;border-color:#801020;padding:10px 20px;border-radius:12px;">Guardar Nota</button>
        </div>
      </div>
    </div>
  `;

  let existing = $('modal-add-candidate-note-dialog');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  setTimeout(() => {
    $('new-note-body')?.focus();
  }, 100);
}

function saveCandidateNoteFromModal(id) {
  const cat = $('new-note-cat')?.value || 'Nota Interna';
  const texto = $('new-note-body')?.value?.trim();

  if (!texto) {
    showToast('Aviso', 'Por favor ingresa el texto de la nota.', 'warning');
    return;
  }

  const autor = State.currentUser ? State.currentUser.nombre : 'Asesor JN Palabras';
  if (DB.addNota) {
    DB.addNota(id, {
      tipo: cat,
      contenido: texto,
      autor: autor,
      fecha: new Date().toISOString()
    });
  }

  showToast('Nota Guardada', 'La nota interna fue registrada correctamente.', 'success');
  closeModal('modal-add-candidate-note-dialog');
  const el = $('modal-add-candidate-note-dialog');
  if (el) el.remove();
  renderDashboard(State.activeRole, 'candidato-perfil');
}

function quickAddCandidateNote(id) {
  openAddCandidateNoteModal(id);
}

/* ── MODAL CHAT CON EL CANDIDATO ── */
function openCandidateChatModal(id) {
  const c = DB.getCandidatoById(id);
  if (!c) return;

  const currentUserName = State.currentUser ? State.currentUser.nombre : 'Asesor JN Palabras';
  const initials = getInitials(c.nombre);

  const modalHtml = `
    <div class="modal-overlay visible open" id="modal-chat-candidate-dialog" role="dialog" aria-modal="true" style="z-index:9999;" onclick="if(event.target===this) closeModal('modal-chat-candidate-dialog')">
      <div class="modal modal-card" style="max-width:580px;border-radius:24px;padding:0;overflow:hidden;display:flex;flex-direction:column;height:620px;background:#ffffff;">
        <!-- Header Chat -->
        <div style="background:#801020;color:#ffffff;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:42px;height:42px;border-radius:50%;background:#ffffff;color:#801020;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.1rem;">
              ${initials}
            </div>
            <div>
              <div style="font-weight:700;font-size:1.05rem;line-height:1.2;">${c.nombre}</div>
              <div style="font-size:0.75rem;opacity:0.9;display:flex;align-items:center;gap:6px;margin-top:2px;">
                <span style="width:8px;height:8px;background:#10b981;border-radius:50%;display:inline-block;"></span>
                Canal Directo Asesoría · WhatsApp & Portal
              </div>
            </div>
          </div>
          <button onclick="closeModal('modal-chat-candidate-dialog')" style="background:none;border:none;color:#ffffff;font-size:1.4rem;cursor:pointer;">✕</button>
        </div>

        <!-- Chat Stream -->
        <div class="candidate-chat-body" id="chat-messages-stream" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;">
          <!-- Mensaje del sistema -->
          <div style="text-align:center;margin:4px 0;">
            <span style="background:#e2e8f0;color:#64748b;font-size:0.72rem;font-weight:600;padding:4px 12px;border-radius:12px;">Candidato integrado al programa · Canal Seguro</span>
          </div>

          <!-- Mensaje del candidato -->
          <div class="chat-msg-bubble candidate">
            <div>Hola, quedo atento a cualquier indicación para el avance de mis documentos y la preparación de mi examen de alemán. ¡Muchas gracias!</div>
            <div class="chat-msg-time">Ayer 10:24 AM</div>
          </div>

          <!-- Mensaje del asesor -->
          <div class="chat-msg-bubble advisor">
            <div>¡Hola ${c.nombre.split(' ')[0]}! Estamos revisando tu expediente de ${c.especialidad && !c.especialidad.includes('Ver Test') ? c.especialidad : 'salud'}. Mantén tu preparación al día.</div>
            <div class="chat-msg-time" style="color:rgba(255,255,255,0.8);">Hoy 09:15 AM · Por ${currentUserName}</div>
          </div>
        </div>

        <!-- Quick chips -->
        <div style="padding:8px 16px;background:#f1f5f9;display:flex;gap:8px;overflow-x:auto;">
          <button type="button" class="btn btn-xs btn-outline" style="border-radius:12px;font-size:0.75rem;white-space:nowrap;" onclick="insertQuickChatMsg('Recordatorio: Por favor sube tu certificado B2 actualizado.')">📌 Recordar B2</button>
          <button type="button" class="btn btn-xs btn-outline" style="border-radius:12px;font-size:0.75rem;white-space:nowrap;" onclick="insertQuickChatMsg('Tu entrevista ha sido agendada con éxito.')">📅 Confirmar entrevista</button>
          <button type="button" class="btn btn-xs btn-outline" style="border-radius:12px;font-size:0.75rem;white-space:nowrap;" onclick="insertQuickChatMsg('Requerimos la copia apostillada de tu diploma universitario.')">📋 Pedir apostille</button>
        </div>

        <!-- Input Bar -->
        <div style="padding:16px;background:#ffffff;border-top:1px solid #e2e8f0;display:flex;gap:10px;align-items:center;">
          <input type="text" id="chat-input-text" placeholder="Escribe un mensaje para ${c.nombre}..." class="form-input" style="flex:1;border-radius:12px;font-size:0.9rem;" onkeydown="if(event.key==='Enter') sendCandidateChatMessage('${c.id}')">
          <button class="btn btn-primary" onclick="sendCandidateChatMessage('${c.id}')" style="background:#801020;border-color:#801020;border-radius:12px;padding:10px 18px;display:flex;align-items:center;gap:6px;">
            <span>Enviar</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  let existing = $('modal-chat-candidate-dialog');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  setTimeout(() => {
    $('chat-input-text')?.focus();
    const stream = $('chat-messages-stream');
    if (stream) stream.scrollTop = stream.scrollHeight;
  }, 100);
}

function insertQuickChatMsg(text) {
  const inp = $('chat-input-text');
  if (inp) {
    inp.value = text;
    inp.focus();
  }
}

function sendCandidateChatMessage(id) {
  const inp = $('chat-input-text');
  const txt = inp?.value?.trim();
  if (!txt) return;

  const stream = $('chat-messages-stream');
  const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const currentUserName = State.currentUser ? State.currentUser.nombre : 'Asesor JN Palabras';

  if (stream) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble advisor';
    bubble.innerHTML = `
      <div>${txt}</div>
      <div class="chat-msg-time" style="color:rgba(255,255,255,0.8);">${now} · Por ${currentUserName}</div>
    `;
    stream.appendChild(bubble);
    stream.scrollTop = stream.scrollHeight;
  }

  if (DB.addNota) {
    DB.addNota(id, {
      tipo: 'Mensaje Chat',
      contenido: `Mensaje directo enviado: "${txt}"`,
      autor: currentUserName,
      fecha: new Date().toISOString()
    });
  }

  inp.value = '';
  showToast('Mensaje Enviado', 'Mensaje entregado al candidato.', 'success');
}

function quickSendMessage(id) {
  openCandidateChatModal(id);
}

/* ── MODAL AGENDAR ENTREVISTA ── */
function openScheduleInterviewModal(id) {
  const c = DB.getCandidatoById(id);
  if (!c) return;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const defaultDateTime = tomorrow.toISOString().slice(0, 16);

  const modalHtml = `
    <div class="modal-overlay visible open" id="modal-schedule-interview-dialog" role="dialog" aria-modal="true" style="z-index:9999;" onclick="if(event.target===this) closeModal('modal-schedule-interview-dialog')">
      <div class="modal modal-card" style="max-width:560px;border-radius:24px;padding:28px;background:#ffffff;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <div>
            <h3 style="font-family:var(--font-heading);color:var(--wine-800);font-size:1.3rem;margin:0;">Agendar Entrevista</h3>
            <p style="font-size:0.875rem;color:var(--slate-500);margin:4px 0 0 0;">Candidato: <strong style="color:var(--slate-800);">${c.nombre}</strong></p>
          </div>
          <button onclick="closeModal('modal-schedule-interview-dialog')" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--slate-400);">✕</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div style="grid-column:span 2;">
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Tipo de Entrevista / Sesión</label>
            <select class="form-select" id="sched-type" style="width:100%;">
              <option value="Diagnóstico Inicial y Reclutamiento">🩺 Diagnóstico Inicial y Reclutamiento</option>
              <option value="Evaluación de Alemán B1/B2">🗣️ Evaluación de Nivel de Alemán B1/B2</option>
              <option value="Entrevista con Clínica en Alemania">🏥 Entrevista con Clínica / Hospital en Alemania</option>
              <option value="Simulación de Examen FSP/KP">📋 Simulación FSP (Fachsprachenprüfung)</option>
              <option value="Acompañamiento de Visado">🛂 Sesión de Visado y Plan de Viaje</option>
            </select>
          </div>

          <div style="grid-column:span 2;">
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Fecha y Hora</label>
            <input type="datetime-local" class="form-input" id="sched-datetime" value="${defaultDateTime}" style="width:100%;">
          </div>

          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Modalidad</label>
            <select class="form-select" id="sched-mode" style="width:100%;">
              <option value="Google Meet">💻 Google Meet (Videollamada)</option>
              <option value="Llamada Telefónica">📞 Llamada Telefónica</option>
              <option value="Presencial">🏢 Presencial Oficina</option>
            </select>
          </div>

          <div>
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Enlace de Reunión</label>
            <input type="text" class="form-input" id="sched-link" value="https://meet.google.com/jnp-interview" style="width:100%;">
          </div>

          <div style="grid-column:span 2;">
            <label class="form-label" style="font-size:0.8rem;font-weight:700;color:var(--slate-700);">Notas Preparatorias u Objetivos</label>
            <textarea class="form-input" id="sched-notes" rows="3" placeholder="Ej: Revisar certificación de título y evaluar soltura en diálogo médico..." style="width:100%;resize:vertical;font-size:0.9rem;border-radius:12px;padding:10px;"></textarea>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:22px;">
          <button class="btn btn-outline" onclick="closeModal('modal-schedule-interview-dialog')">Cancelar</button>
          <button class="btn btn-primary" onclick="saveScheduledInterview('${c.id}')" style="background:#801020;border-color:#801020;padding:10px 22px;border-radius:12px;">Confirmar y Agendar</button>
        </div>
      </div>
    </div>
  `;

  let existing = $('modal-schedule-interview-dialog');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveScheduledInterview(id) {
  const type = $('sched-type')?.value || 'Entrevista';
  const datetime = $('sched-datetime')?.value;
  const mode = $('sched-mode')?.value;
  const notes = $('sched-notes')?.value?.trim();

  if (!datetime) {
    showToast('Aviso', 'Por favor selecciona la fecha y hora.', 'warning');
    return;
  }

  const autor = State.currentUser ? State.currentUser.nombre : 'Asesor JN Palabras';
  const fechaFmt = new Date(datetime).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

  if (DB.addNota) {
    DB.addNota(id, {
      tipo: 'Entrevista',
      contenido: `Entrevista agendada: ${type} para el ${fechaFmt} (${mode}). ${notes ? 'Notas: ' + notes : ''}`,
      autor: autor,
      fecha: new Date().toISOString()
    });
  }

  showToast('Entrevista Agendada', `Reunión agendada para el ${fechaFmt}`, 'success');
  closeModal('modal-schedule-interview-dialog');
  const el = $('modal-schedule-interview-dialog');
  if (el) el.remove();
  renderDashboard(State.activeRole, 'candidato-perfil');
}

function quickScheduleInterview(id) {
  openScheduleInterviewModal(id);
}

/* ── MODAL EXPEDIENTE COMPLETO & HOJA DE VIDA ── */
function openCandidateCVModal(id) {
  openCandidateDossierModal(id, 'cv');
}

function openCandidateDossierModal(id, initialTab = 'cv') {
  const c = DB.getCandidatoById(id);
  if (!c) return;

  const especialidad = c.especialidad && !c.especialidad.includes('Ver Test') ? c.especialidad : 'Enfermero Profesional';
  const subesp = c.subespecialidad || 'Cuidados Intensivos';
  const nivelAleman = c.nivel_aleman && !c.nivel_aleman.includes('Ver Test') ? c.nivel_aleman : 'B2';
  const ciudad = c.ciudad || 'Medellín';
  const pais = c.pais || 'Colombia';
  const respuestas = c.respuestas_elegibilidad || {};
  const initials = getInitials(c.nombre);

  const modalHtml = `
    <div class="modal-overlay visible open" id="modal-candidate-dossier-dialog" role="dialog" aria-modal="true" style="z-index:9999;" onclick="if(event.target===this) closeModal('modal-candidate-dossier-dialog')">
      <div class="modal modal-card" style="max-width:860px;width:95%;border-radius:24px;padding:0;overflow:hidden;max-height:90vh;display:flex;flex-direction:column;background:#ffffff;">
        <!-- Header -->
        <div style="background:#801020;color:#ffffff;padding:20px 28px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:16px;">
            <div style="width:48px;height:48px;border-radius:16px;background:#ffffff;color:#801020;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.3rem;">
              ${initials}
            </div>
            <div>
              <div style="font-weight:800;font-size:1.3rem;line-height:1.2;font-family:var(--font-heading);">${c.nombre}</div>
              <div style="font-size:0.8rem;opacity:0.9;display:flex;align-items:center;gap:10px;margin-top:3px;">
                <span>${especialidad} · ${subesp}</span>
                <span>•</span>
                <span>${ciudad}, ${pais}</span>
                <span>•</span>
                <span style="background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:10px;">ID: ${c.id.slice(0,8)}</span>
              </div>
            </div>
          </div>
          <button onclick="closeModal('modal-candidate-dossier-dialog')" style="background:none;border:none;color:#ffffff;font-size:1.5rem;cursor:pointer;">✕</button>
        </div>

        <!-- Navigation Tabs -->
        <div style="display:flex;background:#ffffff;border-bottom:1px solid #e2e8f0;padding:0 24px;">
          <button class="dossier-tab-btn ${initialTab === 'cv' ? 'active' : ''}" id="tab-btn-cv" onclick="switchDossierTab('cv')">
            📄 Hoja de Vida / Resumen Profesional (CV)
          </button>
          <button class="dossier-tab-btn ${initialTab === 'docs' ? 'active' : ''}" id="tab-btn-docs" onclick="switchDossierTab('docs')">
            📁 Documentación Requerida
          </button>
        </div>

        <!-- Body / Content -->
        <div style="flex:1;overflow-y:auto;padding:26px;" id="dossier-tab-content">
          <!-- TAB 1: CV -->
          <div id="dossier-cv-pane" style="${initialTab === 'cv' ? 'display:block;' : 'display:none;'}">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
              <div>
                <div style="font-size:1.15rem;font-weight:800;color:#1e293b;">Curriculum Vitae Médico (Lebenslauf)</div>
                <div style="font-size:0.85rem;color:#64748b;margin-top:2px;">Candidato Integrado al Programa de Inserción Médica en Alemania · JN Palabras</div>
              </div>
              <button class="btn btn-outline btn-sm" onclick="window.print()" style="border-radius:12px;font-weight:700;display:flex;align-items:center;gap:6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Imprimir / Exportar CV
              </button>
            </div>

            <!-- CV Sections -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
              <!-- Columna 1 -->
              <div style="display:flex;flex-direction:column;gap:16px;">
                <div style="background:#ffffff;border:1px solid #f1f5f9;border-radius:16px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                  <div style="font-size:0.8rem;font-weight:800;letter-spacing:1px;color:#801020;text-transform:uppercase;margin-bottom:12px;">1. Datos Personales y Contacto</div>
                  <div style="display:grid;grid-template-columns:120px 1fr;gap:8px;font-size:0.875rem;">
                    <span style="color:#64748b;font-weight:600;">Nombre:</span> <span style="font-weight:700;color:#1e293b;">${c.nombre}</span>
                    <span style="color:#64748b;font-weight:600;">Edad:</span> <span>${c.edad || '32'} años</span>
                    <span style="color:#64748b;font-weight:600;">Nacionalidad:</span> <span>${pais}</span>
                    <span style="color:#64748b;font-weight:600;">Ubicación:</span> <span>${ciudad}, ${pais}</span>
                    <span style="color:#64748b;font-weight:600;">Correo:</span> <span>${c.correo || 'candidato@jnpalabras.com'}</span>
                    <span style="color:#64748b;font-weight:600;">Teléfono:</span> <span>${c.telefono || '+593 998306638'}</span>
                  </div>
                </div>

                <div style="background:#ffffff;border:1px solid #f1f5f9;border-radius:16px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                  <div style="font-size:0.8rem;font-weight:800;letter-spacing:1px;color:#801020;text-transform:uppercase;margin-bottom:12px;">2. Competencias Lingüísticas</div>
                  <div style="display:flex;flex-direction:column;gap:8px;font-size:0.875rem;">
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8fafc;border-radius:10px;">
                      <span style="font-weight:700;color:#1e293b;">🇩🇪 Idioma Alemán</span>
                      <span class="badge badge-info" style="font-weight:700;">Nivel ${nivelAleman} (Certificado en trámite)</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8fafc;border-radius:10px;">
                      <span style="font-weight:700;color:#1e293b;">🇪🇸 Idioma Español</span>
                      <span class="badge badge-success" style="font-weight:700;">Nativo / Materno</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Columna 2 -->
              <div style="display:flex;flex-direction:column;gap:16px;">
                <div style="background:#ffffff;border:1px solid #f1f5f9;border-radius:16px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                  <div style="font-size:0.8rem;font-weight:800;letter-spacing:1px;color:#801020;text-transform:uppercase;margin-bottom:12px;">3. Formación y Experiencia Clínica</div>
                  <div style="display:flex;flex-direction:column;gap:10px;font-size:0.875rem;">
                    <div>
                      <div style="font-weight:700;color:#1e293b;">Título Universitario: ${especialidad}</div>
                      <div style="font-size:0.8rem;color:#64748b;">Área Clínica de Enfoque: ${subesp}</div>
                    </div>
                    <div>
                      <div style="font-weight:700;color:#1e293b;">Años de Experiencia: ${c.anos_exp !== undefined ? c.anos_exp : '4'} años</div>
                      <div style="font-size:0.8rem;color:#64748b;">Estado de Homologación: <strong style="color:#801020;">${c.estado_homologacion || 'En Trámite'}</strong></div>
                    </div>
                    <div style="padding:10px;background:#fdf2f4;border-radius:10px;font-size:0.8rem;color:#801020;">
                      <strong>Objetivo en Alemania:</strong> Homologación profesional definitiva (Approbation / Anerkennung) y colocación en Hospital Universitario o Clínica en Baden-Württemberg / Heidelberg.
                    </div>
                  </div>
                </div>

                <div style="background:#ffffff;border:1px solid #f1f5f9;border-radius:16px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                  <div style="font-size:0.8rem;font-weight:800;letter-spacing:1px;color:#801020;text-transform:uppercase;margin-bottom:12px;">4. Datos del Formulario de Aplicación</div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.8rem;">
                    <div><span style="color:#64748b;">Título convalidable:</span> <strong style="color:#1e293b;">${respuestas.degree_check || 'Sí, titulado'}</strong></div>
                    <div><span style="color:#64748b;">Sector:</span> <strong style="color:#1e293b;">${respuestas.sector || 'Salud / Medicina'}</strong></div>
                    <div><span style="color:#64748b;">Nivel estudios:</span> <strong style="color:#1e293b;">${respuestas.education_level || 'Licenciatura'}</strong></div>
                    <div><span style="color:#64748b;">Puntaje obtenido:</span> <strong style="color:#16a34a;">${c.puntaje_elegibilidad || '26'} / 30 pts</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: DOCUMENTOS -->
          <div id="dossier-docs-pane" style="${initialTab === 'docs' ? 'display:block;' : 'display:none;'}">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
              <div>
                <div style="font-size:1.15rem;font-weight:800;color:#1e293b;">Expediente de Documentación Oficial</div>
                <div style="font-size:0.85rem;color:#64748b;margin-top:2px;">Checklist regulatorio para el trámite de homologación y visado de trabajo en Alemania</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="quickUploadDocForCandidate('${c.id}')" style="background:#801020;border-color:#801020;border-radius:12px;display:flex;align-items:center;gap:6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Subir Documento
              </button>
            </div>

            <div style="display:flex;flex-direction:column;gap:12px;">
              ${[
                { nombre: 'Pasaporte Vigente', desc: 'Válido hasta: 12/2028 · Escaneo a color 300dpi', estado: 'Aprobado', color: '#10b981' },
                { nombre: 'Título Universitario / Diploma', desc: 'Certificado por Ministerio de Educación y Apostillado', estado: 'Aprobado', color: '#10b981' },
                { nombre: 'Certificado de Calificaciones y Malla', desc: 'Desglose de horas prácticas y créditos de enfermería/medicina', estado: 'En Revisión', color: '#3b82f6' },
                { nombre: 'Certificado de Idioma Alemán B1/B2', desc: 'Certificado oficial Goethe-Institut / telc Deutsch B2', estado: 'Esperando Validación', color: '#f59e0b' },
                { nombre: 'Certificado de Antecedentes Penales', desc: 'Apostillado y con vigencia menor a 3 meses', estado: 'Aprobado', color: '#10b981' },
                { nombre: 'Certificado de Nacimiento Apostillado', desc: 'Traducido por traductor jurado en Alemania', estado: 'Aprobado', color: '#10b981' },
                { nombre: 'Seguro Médico de Viaje (Incoming-Versicherung)', desc: 'Requerido para la fase de solicitud de visa de trabajo', estado: 'Pendiente', color: '#94a3b8' }
              ].map(doc => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 2px 6px rgba(0,0,0,0.02);">
                  <div style="display:flex;align-items:center;gap:16px;">
                    <div style="width:40px;height:40px;border-radius:12px;background:#fdf2f4;color:#801020;display:flex;align-items:center;justify-content:center;">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <div>
                      <div style="font-weight:700;color:#1e293b;font-size:0.95rem;">${doc.nombre}</div>
                      <div style="font-size:0.8rem;color:#64748b;margin-top:2px;">${doc.desc}</div>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:14px;">
                    <span style="font-size:0.75rem;font-weight:700;padding:4px 12px;border-radius:12px;background:${doc.color}15;color:${doc.color};border:1px solid ${doc.color}30;">
                      ${doc.estado}
                    </span>
                    <button class="btn btn-outline btn-xs" onclick="showToast('Expediente', 'Visualizando documento: ${doc.nombre}', 'info')" style="border-radius:10px;">Ver</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 28px;display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:0.8rem;color:#64748b;">Expediente auditado conforme a los estándares de la Agencia Federal de Empleo de Alemania (ZAV).</div>
          <button class="btn btn-outline" onclick="closeModal('modal-candidate-dossier-dialog')">Cerrar</button>
        </div>
      </div>
    </div>
  `;

  let existing = $('modal-candidate-dossier-dialog');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function switchDossierTab(tab) {
  const cvPane = $('dossier-cv-pane');
  const docsPane = $('dossier-docs-pane');
  const cvBtn = $('tab-btn-cv');
  const docsBtn = $('tab-btn-docs');

  if (tab === 'cv') {
    if (cvPane) cvPane.style.display = 'block';
    if (docsPane) docsPane.style.display = 'none';
    if (cvBtn) cvBtn.classList.add('active');
    if (docsBtn) docsBtn.classList.remove('active');
  } else {
    if (cvPane) cvPane.style.display = 'none';
    if (docsPane) docsPane.style.display = 'block';
    if (cvBtn) cvBtn.classList.remove('active');
    if (docsBtn) docsBtn.classList.add('active');
  }
}

function openCandidateDetailModalLegacy(id) {
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
        <div style="font-size:.875rem;color:var(--slate-600);">${c.especialidad} · ${c.pais} ${countryFlag(c.pais)}${c.edad ? ` · ${c.edad} años` : ''}</div>
        ${c.correo ? `<div style="font-size:.875rem;color:var(--slate-500);margin-top:2px;">📧 ${c.correo}</div>` : ''}
        ${c.telefono ? `<div style="font-size:.875rem;color:var(--slate-500);margin-top:2px;">📱 ${c.telefono}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:8px;">
          <span class="badge badge-info">${c.nivel_aleman}</span>
          <span class="badge badge-warning">${c.estado_proceso}</span>
          <span class="badge ${c.estado_homologacion==='Aprobado'?'badge-success':'badge-warning'}">${c.estado_homologacion}</span>
          ${c.puntaje_elegibilidad !== undefined ? `<span class="badge badge-gold" title="Puntaje de Elegibilidad">Puntaje: ${c.puntaje_elegibilidad}</span>` : ''}
        </div>
      </div>
    </div>
    <div style="margin-bottom:18px;display:flex;gap:10px;">
      <button class="btn btn-primary btn-sm" style="flex:1;justify-content:center;" onclick="closeModal('modal-candidato');openCVForCandidate('${id}')">
        📄 Ver / Editar Hoja de Vida (Plantilla Oficial JN)
      </button>
      <button class="btn btn-danger btn-sm" onclick="deleteCandidateProfile('${id}')" style="justify-content:center;" title="Eliminar Candidato">
        <span style="display:flex; align-items:center;">${getIcon('trash')}</span>
      </button>
    </div>

    <!-- SECCIÓN DE ASESOR DESIGNADO -->
    <div style="margin-bottom:18px;background:var(--slate-50);padding:14px;border-radius:8px;border:1px solid var(--slate-200);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:0.8125rem;font-weight:700;color:var(--slate-700);letter-spacing:0.04em;text-transform:uppercase;">🎯 Asesor de Seguimiento:</span>
        <span class="badge ${c.id_asesor ? 'badge-info' : 'badge-warning'}">
          ${c.id_asesor ? `👤 ${c.nombre_asesor || 'Asignado'}` : '⚠️ Pendiente de Asignar'}
        </span>
      </div>
      ${(State.activeRole === 'Super Asesor' || State.activeRole === 'Admin') ? `
      <div style="display:flex;gap:8px;align-items:center;">
        <select class="form-select form-select-sm" id="modal-sel-asesor-${id}" style="flex:1;">
          <option value="">-- Sin Asignar / Desasignar --</option>
          ${DB.getAsesores().filter(u => (u.roles || []).includes('Asesor')).map(a => `
            <option value="${a.id}" ${c.id_asesor === a.id ? 'selected' : ''}>
              ${a.nombre} (${DB.getCandidatos().filter(x => x.id_asesor === a.id).length} asignados)
            </option>
          `).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="cambiarAsesorCandidato('${id}')">Designar Asesor</button>
      </div>
      ` : `
      <div style="font-size:0.85rem;color:var(--slate-600);">
        ${c.id_asesor ? `Asignado a: <strong>${c.nombre_asesor || 'Asesor'}</strong>` : 'El Super Asesor aún no ha asignado un asesor a este candidato.'}
      </div>
      `}
    </div>
    ${c.estado_proceso === 'Lead Nuevo' ? `
    <div style="margin-bottom:18px;display:flex;gap:10px;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid var(--slate-200);">
      <div style="flex:1;font-size:0.875rem;color:var(--slate-700);display:flex;align-items:center;">
        <strong>Acción requerida:</strong> Evaluar candidato
      </div>
      <button class="btn btn-success btn-sm" onclick="acceptCandidate('${id}')">Aceptar</button>
      <button class="btn btn-danger btn-sm" onclick="rejectCandidate('${id}')">Rechazar</button>
    </div>
    ` : ''}
    ${c.respuestas_elegibilidad ? `
    <div style="margin-bottom:20px;">
      <div style="font-size:.8125rem;font-weight:700;color:var(--slate-700);margin-bottom:10px;letter-spacing:.04em;text-transform:uppercase;">📝 Respuestas formulario aplicación</div>
      <div style="background:var(--slate-50);border:1px solid var(--slate-200);border-radius:var(--radius-md);padding:12px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:0.875rem;">
          ${Object.entries(c.respuestas_elegibilidad).map(([key, val]) => {
            const labels = {
              degree_check: 'Título Universitario',
              sector: 'Sector Profesional',
              profession: 'Profesión',
              age: 'Edad',
              education_level: 'Nivel Educativo',
              experience: 'Años de Experiencia',
              german: 'Nivel de Alemán',
              location: 'Ubicación',
              marital: 'Estado Civil',
              spec: 'Especialidad',
              otros: 'Otros (Especificado)'
            };
            const label = labels[key] || key;
            
            // Format fallback for old test records that stored raw ids/values
            if (val === 'yes') val = 'Sí';
            if (val === 'no') val = 'No';
            if (val === 'salud') val = 'Salud / Medicina';
            if (val === 'ingenieria') val = 'Ingeniería';
            if (val === 'it') val = 'Tecnología (IT)';
            if (val === 'educacion') val = 'Educación';
            if (val === 'oficios') val = 'Artesanos / Oficios';
            if (val === 'otros') val = 'Otros';

            if (!isNaN(Number(val)) && val !== '') {
              const v = Number(val);
              if (key === 'profession') {
                if (v === 5) val = 'Salud (Médico/Enfermería/etc.)';
                else if (v === 4) val = 'Ingeniería/IT/Oficios';
                else if (v === 3) val = 'Educación';
                else if (v === 2) val = 'Otra';
              } else if (key === 'age') {
                if (v === 4) val = '18 - 30 Años';
                else if (v === 3) val = '30 - 35 Años';
                else if (v === 2) val = '35 - 40 Años';
                else if (v === 1) val = '40 Años o más';
              } else if (key === 'education_level') {
                if (v === 5) val = 'Licenciatura / Posgrado';
                else if (v === 4) val = 'Técnico / Formación';
                else if (v === 3) val = 'Otro';
              } else if (key === 'experience') {
                if (v === 3) val = '4 Años o más';
                else if (v === 2) val = '2 - 4 Años';
                else if (v === 1) val = '1 - 2 Años';
                else if (v === 0) val = 'Sin Experiencia';
              } else if (key === 'german') {
                if (v === 5) val = 'C2+ / Lengua Materna';
                else if (v === 4) val = 'C1 / C2';
                else if (v === 3) val = 'B1 / B2';
                else if (v === 1) val = 'A1 / A2 / Ninguno';
              } else if (key === 'location') {
                if (v === 4) val = 'Europa';
                else if (v === 3) val = 'Latinoamérica / Resto del Mundo';
              } else if (key === 'marital') {
                if (v === 1) val = 'Casado/a';
                else if (v === 2) val = 'Soltero/a';
              }
            }
            
            return `<div><strong style="color:var(--slate-600);">${label}:</strong> <span style="color:var(--slate-900);">${val}</span></div>`;
          }).join('')}
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- GUÍA DE FASE -->
    <div style="margin-bottom:20px;">
      <div style="font-size:.8125rem;font-weight:700;color:var(--slate-700);margin-bottom:10px;letter-spacing:.04em;text-transform:uppercase;">📌 Guía de la Fase: ${c.estado_proceso}</div>
      <div style="background:var(--slate-50);border:1px solid var(--slate-200);border-radius:var(--radius-md);padding:12px;">
        ${(PHASE_GUIDES[c.estado_proceso] || []).map((tarea, index) => {
          const checklists = c.fase_checklists || {};
          const isChecked = checklists[c.estado_proceso] && checklists[c.estado_proceso][index] ? true : false;
          return `
            <div style="display:flex; align-items:center; gap:10px; padding:6px 0;">
              <input type="checkbox" style="width:16px; height:16px; cursor:pointer;" ${isChecked ? 'checked' : ''} onchange="togglePhaseChecklist('${id}', '${c.estado_proceso}', ${index})">
              <span style="font-size:0.875rem; color:${isChecked ? 'var(--slate-400)' : 'var(--slate-700)'}; text-decoration:${isChecked ? 'line-through' : 'none'};">${tarea}</span>
            </div>
          `;
        }).join('') || '<div style="font-size:0.875rem; color:var(--slate-500);">No hay tareas definidas para esta fase.</div>'}
      </div>
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
            <span style="font-size:.7rem;color:var(--slate-400);">${formatDateTime(n.fecha)}</span>
          </div>
          <div style="font-size:.875rem;color:var(--slate-700);">${n.contenido}</div>
        </div>
      `).join('') || '<div style="font-size:.875rem;color:var(--slate-400);">Sin notas todavía.</div>'}
    </div>
  `;
  openModal('modal-candidato');
}

function deleteCandidateProfile(id) {
  if (confirm('¿Estás seguro de que deseas eliminar a este candidato? Esta acción no se puede deshacer.')) {
    DB.deleteCandidato(id).then(() => {
      showToast('Candidato eliminado', 'El perfil ha sido borrado correctamente.', 'success');
      closeModal('modal-candidato');
      State.selectedCandidato = null;
      renderDashboard(State.activeRole);
    }).catch(e => {
      showToast('Error', 'No se pudo eliminar el candidato.', 'error');
    });
  }
}

function acceptCandidate(id) {
  DB.updateCandidato(id, { estado_proceso: 'En Proceso' }).then(() => {
    showToast('Candidato aceptado', 'El candidato ha pasado a la fase "En Proceso".', 'success');
    openCandidateDetail(id);
    renderDashboard(State.activeRole);
  });
}

function rejectCandidate(id) {
  if (confirm('¿Estás seguro de que deseas rechazar a este candidato?')) {
    DB.updateCandidato(id, { estado_proceso: 'Rechazado' }).then(() => {
      showToast('Candidato rechazado', 'El candidato ha sido marcado como "Rechazado".', 'warning');
      openCandidateDetail(id);
      renderDashboard(State.activeRole);
    });
  }
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
                  <span style="font-size:.75rem;color:var(--slate-400);">${formatDateTime(n.fecha)}</span>
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
  renderDashboard(State.activeRole);
}

function selectCandidateForCV(candId) {
  State.cvSelectedCandId = candId;
  State.cvDraft = null;
  renderDashboard(State.activeRole);
}

async function createNewCandidateCV() {
  const nombre = prompt('Nombre completo del nuevo candidato:');
  if (!nombre) return;
  const nuevo = await DB.createCandidato({
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
  renderDashboard(State.activeRole);
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
  renderDashboard(State.activeRole);
}

function removeWerdegangItem(index) {
  State.cvDraft = collectCVFormData();
  State.cvDraft.werdegang.splice(index, 1);
  renderDashboard(State.activeRole);
}

function addAusbildungItem() {
  State.cvDraft = collectCVFormData();
  State.cvDraft.ausbildung.push({ zeitraum: '', beschreibung: '' });
  renderDashboard(State.activeRole);
}

function removeAusbildungItem(index) {
  State.cvDraft = collectCVFormData();
  State.cvDraft.ausbildung.splice(index, 1);
  renderDashboard(State.activeRole);
}

function addSprachenItem() {
  State.cvDraft = collectCVFormData();
  State.cvDraft.sprachen.push({ sprache: '', niveau: '' });
  renderDashboard(State.activeRole);
}

function removeSprachenItem(index) {
  State.cvDraft = collectCVFormData();
  State.cvDraft.sprachen.splice(index, 1);
  renderDashboard(State.activeRole);
}

// ──────────────────────────────────────────────────────────────────
// ★ DASHBOARD: SUPER ASESOR (Gestión y Asignación de Leads)
// ──────────────────────────────────────────────────────────────────
let _superLeadsFilter = 'all'; // 'all' | 'pendientes' | 'asignados'
let _superKanbanAsesorFilter = 'all'; // 'all' | 'unassigned' | asesor_id

function renderSuperLeads() {
  const candidatos = DB.getCandidatos();
  const asesores = DB.getAsesores().filter(u => (u.roles || []).includes('Asesor'));
  const pendientes = candidatos.filter(c => !c.id_asesor);
  const asignados = candidatos.filter(c => c.id_asesor);

  // Filtrado actual
  let lista = candidatos;
  if (_superLeadsFilter === 'pendientes') {
    lista = pendientes;
  } else if (_superLeadsFilter === 'asignados') {
    lista = asignados;
  }

  const coveragePercent = candidatos.length > 0 ? Math.round((asignados.length / candidatos.length) * 100) : 0;

  return `
    <!-- Header / Banner de Super Asesor -->
    <div class="page-header" style="background:linear-gradient(135deg, #0f172a, #0369a1); color:#fff; padding:28px; border-radius:var(--radius-lg); margin-bottom:24px; box-shadow:0 10px 25px -5px rgba(2,132,199,0.25);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
        <div>
          <div style="display:inline-flex; align-items:center; gap:8px; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; color:#38bdf8; font-weight:700; margin-bottom:6px; background:rgba(56,189,248,0.12); padding:4px 12px; border-radius:999px;">
            <span>⚡ Coordinación & Asignación Central</span>
          </div>
          <h1 style="font-size:1.75rem; font-weight:800; margin:0; letter-spacing:-0.02em;">Bandeja de Leads & Distribución</h1>
          <p style="font-size:0.925rem; color:#bae6fd; margin-top:6px; max-width:650px;">
            Recepción centralizada de candidatos que completaron el test de elegibilidad o fueron referidos por socios. Asígnalos a los asesores de reclutamiento según su especialidad y carga de trabajo.
          </p>
        </div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <button class="btn" style="background:#38bdf8; color:#0f172a; font-weight:700; border:none; box-shadow:0 4px 14px rgba(56,189,248,0.4);" onclick="ejecutarAutoDesignacion()">
            ⚡ Reparto Equitativo (${pendientes.length})
          </button>
          <button class="btn btn-outline" style="color:#fff; border-color:rgba(255,255,255,0.25);" onclick="openModal('modal-nuevo-candidato')">
            ➕ Crear Lead Manual
          </button>
        </div>
      </div>

      <!-- Tarjetas de Métricas -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-top:24px;">
        <div style="background:rgba(255,255,255,0.08); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.12); padding:14px 18px; border-radius:12px;">
          <div style="font-size:0.75rem; color:#bae6fd; text-transform:uppercase; letter-spacing:0.04em; font-weight:600;">📥 Total Leads Recibidos</div>
          <div style="font-size:1.75rem; font-weight:800; color:#fff; margin-top:4px;">${candidatos.length}</div>
          <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">Candidatos en pipeline</div>
        </div>

        <div style="background:${pendientes.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.08)'}; backdrop-filter:blur(8px); border:1px solid ${pendientes.length > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.12)'}; padding:14px 18px; border-radius:12px;">
          <div style="font-size:0.75rem; color:${pendientes.length > 0 ? '#fca5a5' : '#bae6fd'}; text-transform:uppercase; letter-spacing:0.04em; font-weight:700; display:flex; align-items:center; gap:6px;">
            ${pendientes.length > 0 ? '⚠️' : '✅'} Pendientes de Asignar
          </div>
          <div style="font-size:1.75rem; font-weight:800; color:${pendientes.length > 0 ? '#fca5a5' : '#fff'}; margin-top:4px;">${pendientes.length}</div>
          <div style="font-size:0.75rem; color:#cbd5e1; margin-top:2px;">${pendientes.length > 0 ? '¡Requieren asesor asignado!' : 'Todos asignados'}</div>
        </div>

        <div style="background:rgba(255,255,255,0.08); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.12); padding:14px 18px; border-radius:12px;">
          <div style="font-size:0.75rem; color:#bae6fd; text-transform:uppercase; letter-spacing:0.04em; font-weight:600;">👥 Asesores en Equipo</div>
          <div style="font-size:1.75rem; font-weight:800; color:#fff; margin-top:4px;">${asesores.length}</div>
          <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">Disponibles para asignación</div>
        </div>

        <div style="background:rgba(255,255,255,0.08); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.12); padding:14px 18px; border-radius:12px;">
          <div style="font-size:0.75rem; color:#bae6fd; text-transform:uppercase; letter-spacing:0.04em; font-weight:600;">🎯 Tasa de Cobertura</div>
          <div style="font-size:1.75rem; font-weight:800; color:#38bdf8; margin-top:4px;">${coveragePercent}%</div>
          <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">${asignados.length} con asesor asignado</div>
        </div>
      </div>
    </div>

    <!-- Contenedor Principal: Filtros y Tabla -->
    <div class="card">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding:16px 20px;">
        <!-- Pestañas de Filtrado -->
        <div style="display:flex; gap:8px;">
          <button class="btn btn-sm ${(_superLeadsFilter==='all') ? 'btn-primary' : 'btn-outline'}" onclick="filtrarLeads('all')">
            Todos (${candidatos.length})
          </button>
          <button class="btn btn-sm ${(_superLeadsFilter==='pendientes') ? 'btn-primary' : 'btn-outline'}" style="${pendientes.length > 0 && _superLeadsFilter!=='pendientes' ? 'border-color:#ef4444; color:#ef4444;' : ''}" onclick="filtrarLeads('pendientes')">
            ⚠️ Pendientes Sin Asignar (${pendientes.length})
          </button>
          <button class="btn btn-sm ${(_superLeadsFilter==='asignados') ? 'btn-primary' : 'btn-outline'}" onclick="filtrarLeads('asignados')">
            ✅ Ya Asignados (${asignados.length})
          </button>
        </div>

        <!-- Barra de Búsqueda -->
        <div class="search-bar" style="max-width:280px;">
          <span class="search-bar-icon">🔍</span>
          <input class="form-input" placeholder="Buscar por candidato o país..." id="leads-table-search" oninput="filterTable(this, 'super-leads-tbody')">
        </div>
      </div>

      <!-- Tabla de Leads -->
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Candidato</th>
              <th>Origen</th>
              <th>Especialidad / Perfil</th>
              <th>Alemán</th>
              <th>Score Test</th>
              <th>Fecha Ingreso</th>
              <th>Asesor Designado</th>
              <th style="text-align:right;">Acción de Designación</th>
            </tr>
          </thead>
          <tbody id="super-leads-tbody">
            ${lista.length === 0 ? `
              <tr>
                <td colspan="8" style="text-align:center; padding:36px; color:var(--slate-400);">
                  No hay leads en este filtro.
                </td>
              </tr>
            ` : lista.map(c => {
              const asesorActual = asesores.find(a => a.id === c.id_asesor);
              const isAssigned = !!c.id_asesor;

              return `
                <tr>
                  <td>
                    <div class="td-avatar" onclick="openCandidateDetail('${c.id}')" style="cursor:pointer;" title="Ver expediente">
                      <div class="avatar" style="background:${getAvatarColor(c.nombre)}">${getInitials(c.nombre)}</div>
                      <div>
                        <div class="td-name" style="font-weight:700; color:var(--slate-900);">${c.nombre}</div>
                        ${c.correo ? `<div style="font-size:0.75rem; color:var(--slate-500);">${c.correo}</div>` : ''}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style="font-size:1.1rem; vertical-align:middle;">${countryFlag(c.pais)}</span>
                    <span style="font-size:0.85rem; font-weight:500;">${c.pais}</span>
                  </td>
                  <td>
                    <span style="font-size:0.875rem; font-weight:600; color:var(--slate-800);">${c.especialidad}</span>
                  </td>
                  <td>
                    <span class="badge badge-info" style="font-size:0.7rem;">${c.nivel_aleman}</span>
                  </td>
                  <td>
                    ${c.puntaje_elegibilidad !== undefined 
                      ? `<span class="badge ${c.puntaje_elegibilidad >= 20 ? 'badge-success' : 'badge-warning'}" style="font-weight:700;">${c.puntaje_elegibilidad} pts</span>` 
                      : `<span style="color:var(--slate-400); font-size:0.75rem;">—</span>`}
                  </td>
                  <td>
                    <span style="font-size:0.8rem; color:var(--slate-500);">${formatDateTime(c.fecha_alta)}</span>
                  </td>
                  <td>
                    ${isAssigned ? `
                      <span class="lead-status-pill assigned" title="Asesor asignado">
                        👤 ${c.nombre_asesor || asesorActual?.nombre || 'Asesor'}
                      </span>
                    ` : `
                      <span class="lead-status-pill unassigned" title="Pendiente de asignación">
                        ⚠️ Sin Asignar
                      </span>
                    `}
                  </td>
                  <td style="text-align:right;">
                    <div style="display:inline-flex; align-items:center; gap:6px;">
                      <select class="form-select form-select-sm" id="lead-sel-${c.id}" style="font-size:0.8rem; padding:4px 8px; width:170px;">
                        <option value="">-- Designar Asesor --</option>
                        ${asesores.map(a => {
                          const carga = candidatos.filter(x => x.id_asesor === a.id).length;
                          return `
                            <option value="${a.id}" ${c.id_asesor === a.id ? 'selected' : ''}>
                              ${a.nombre.split(' ')[0]} (${carga} leads)
                            </option>
                          `;
                        }).join('')}
                      </select>
                      <button class="btn btn-primary btn-sm" onclick="ejecutarDesignacion('${c.id}')" title="Confirmar designación de asesor">
                        ✓
                      </button>
                      <button class="btn btn-outline btn-sm" onclick="openCandidateDetail('${c.id}')" title="Ver detalles y test">
                        👁️
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSuperAsesores() {
  const candidatos = DB.getCandidatos();
  const asesores = DB.getAsesores().filter(u => (u.roles || []).includes('Asesor'));

  return `
    <div class="page-header" style="background:linear-gradient(135deg, #0f172a, #1e293b); color:#fff; padding:28px; border-radius:var(--radius-lg); margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; color:#38bdf8; font-weight:700; margin-bottom:6px;">Supervisión Operativa</div>
          <h1 style="font-size:1.75rem; font-weight:800; margin:0;">Equipo de Asesores & Cargas de Trabajo</h1>
          <p style="font-size:0.925rem; color:#94a3b8; margin-top:6px;">
            Monitorea el número de candidatos activos por asesor, balance de cartera y avance en las fases de reclutamiento.
          </p>
        </div>
        <button class="btn btn-primary" onclick="navigateTo('super-leads')">
          📥 Ir a Bandeja de Asignación
        </button>
      </div>
    </div>

    <!-- Grid de Asesores -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
      ${asesores.length === 0 ? `
        <div class="card" style="padding:40px; text-align:center; color:var(--slate-500); grid-column: 1/-1;">
          No hay usuarios con el rol de Asesor en el sistema. Puedes crearlos desde la Gestión de Usuarios.
        </div>
      ` : asesores.map(a => {
        const asignados = candidatos.filter(c => c.id_asesor === a.id);
        const enLeadNuevo = asignados.filter(c => c.estado_proceso === 'Lead Nuevo').length;
        const enReclutamiento = asignados.filter(c => c.estado_proceso === '1er contacto, reclutamiento' || c.estado_proceso === 'En Proceso').length;
        const enIdioma = asignados.filter(c => c.estado_proceso === 'Suficiencia del idioma' || c.estado_proceso === 'Idioma').length;
        const enTramites = asignados.filter(c => c.estado_proceso === 'Entrevista Laboral y firma del contrato' || c.estado_proceso === 'Procesamiento de visa' || c.estado_proceso === 'Homologación' || c.estado_proceso === 'Trámite Visado').length;

        const loadPercent = Math.min(100, Math.round((asignados.length / 10) * 100));

        return `
          <div class="asesor-workload-card">
            <!-- Header del Asesor -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div style="display:flex; gap:12px; align-items:center;">
                <div class="avatar avatar-lg" style="background:${getAvatarColor(a.nombre)}">${getInitials(a.nombre)}</div>
                <div>
                  <h3 style="font-size:1.05rem; font-weight:700; color:var(--slate-900); margin:0;">${a.nombre}</h3>
                  <div style="font-size:0.75rem; color:var(--slate-500);">${a.correo}</div>
                </div>
              </div>
              <span class="badge badge-success" style="font-size:0.7rem;">Activo</span>
            </div>

            <!-- Carga de Trabajo -->
            <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #e2e8f0;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.8rem; font-weight:600; color:var(--slate-600);">Carga Actual:</span>
                <span style="font-size:1.1rem; font-weight:800; color:#0284c7;">${asignados.length} candidatos</span>
              </div>
              <div class="workload-bar-bg">
                <div class="workload-bar-fill" style="width:${loadPercent}%;"></div>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--slate-400); margin-top:4px;">
                <span>0</span>
                <span>${asignados.length < 5 ? 'Carga ligera' : asignados.length < 8 ? 'Carga equilibrada' : 'Carga alta'}</span>
                <span>10+</span>
              </div>
            </div>

            <!-- Desglose por Etapas -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.75rem;">
              <div style="background:#f1f5f9; padding:6px 10px; border-radius:6px; display:flex; justify-content:space-between;">
                <span style="color:var(--slate-600);">Leads nuevos:</span>
                <strong style="color:var(--slate-900);">${enLeadNuevo}</strong>
              </div>
              <div style="background:#f1f5f9; padding:6px 10px; border-radius:6px; display:flex; justify-content:space-between;">
                <span style="color:var(--slate-600);">1er Contacto:</span>
                <strong style="color:var(--slate-900);">${enReclutamiento}</strong>
              </div>
              <div style="background:#f1f5f9; padding:6px 10px; border-radius:6px; display:flex; justify-content:space-between;">
                <span style="color:var(--slate-600);">En Idioma:</span>
                <strong style="color:var(--slate-900);">${enIdioma}</strong>
              </div>
              <div style="background:#f1f5f9; padding:6px 10px; border-radius:6px; display:flex; justify-content:space-between;">
                <span style="color:var(--slate-600);">Visa/Contrato:</span>
                <strong style="color:var(--slate-900);">${enTramites}</strong>
              </div>
            </div>

            <!-- Botones de Acción -->
            <div style="display:flex; gap:8px; margin-top:4px;">
              <button class="btn btn-outline btn-sm" style="flex:1; justify-content:center;" onclick="verKanbanAsesor('${a.id}')">
                📊 Ver en Kanban
              </button>
              <button class="btn btn-primary btn-sm" style="flex:1; justify-content:center;" onclick="navigateTo('super-leads'); filtrarLeads('pendientes');">
                ➕ Asignar Lead
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderSuperKanban() {
  const { kanban_columns } = DB.get();
  const allCandidatos = DB.getCandidatos();
  const asesores = DB.getAsesores().filter(u => (u.roles || []).includes('Asesor'));

  let candidatos = allCandidatos;
  if (_superKanbanAsesorFilter === 'unassigned') {
    candidatos = allCandidatos.filter(c => !c.id_asesor);
  } else if (_superKanbanAsesorFilter !== 'all') {
    candidatos = allCandidatos.filter(c => c.id_asesor === _superKanbanAsesorFilter);
  }

  const viewMode = State.kanbanView || 'kanban';

  let boardHtml = '';
  if (viewMode === 'kanban') {
    boardHtml = `
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
                    
                    <div style="margin-top:6px; margin-bottom:4px;">
                      ${c.id_asesor ? `
                        <span class="badge" style="background:#e0f2fe; color:#0284c7; font-size:0.65rem; border:1px solid #bae6fd;">
                          👤 ${c.nombre_asesor ? c.nombre_asesor.split(' ')[0] : 'Asesor'}
                        </span>
                      ` : `
                        <span class="badge" style="background:#fee2e2; color:#dc2626; font-size:0.65rem; border:1px solid #fecaca;">
                          ⚠️ Sin Asignar
                        </span>
                      `}
                    </div>

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
    `;
  } else {
    boardHtml = `
      <div class="card">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Candidato</th>
                <th>País</th>
                <th>Especialidad</th>
                <th>Alemán</th>
                <th>Asesor Asignado</th>
                <th>Estado Proceso</th>
              </tr>
            </thead>
            <tbody>
              ${candidatos.map(c => `
                <tr onclick="openCandidateDetail('${c.id}')" style="cursor:pointer">
                  <td><div class="td-avatar"><div class="avatar" style="background:${getAvatarColor(c.nombre)}">${getInitials(c.nombre)}</div><div class="td-name">${c.nombre}</div></div></td>
                  <td><span style="font-size:1rem;">${countryFlag(c.pais)}</span> ${c.pais}</td>
                  <td>${c.especialidad}</td>
                  <td><span class="badge badge-info">${c.nivel_aleman}</span></td>
                  <td>
                    ${c.id_asesor ? `<span class="badge badge-info">👤 ${c.nombre_asesor}</span>` : `<span class="badge badge-danger">⚠️ Sin Asignar</span>`}
                  </td>
                  <td><span class="badge badge-warning">${c.estado_proceso}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  return `
    <div class="kanban-banner" style="background:linear-gradient(135deg, #0f172a, #0369a1);">
      <div>
        <h1 class="kanban-banner-title">Pipeline Global de Candidatos</h1>
        <p class="kanban-banner-subtitle">Vista general de todos los candidatos con asignaciones y filtros</p>
      </div>
      <div class="kanban-banner-actions">
        <div style="display:flex; align-items:center; gap:8px;">
          <label style="color:#fff; font-size:0.8rem; font-weight:600;">Filtrar por Asesor:</label>
          <select class="form-select form-select-sm" style="background:rgba(255,255,255,0.15); color:#fff; border-color:rgba(255,255,255,0.3);" onchange="filtrarKanbanAsesor(this.value)">
            <option value="all" style="color:#000;" ${_superKanbanAsesorFilter==='all'?'selected':''}>Todos los Asesores</option>
            <option value="unassigned" style="color:#000;" ${_superKanbanAsesorFilter==='unassigned'?'selected':''}>⚠️ Solo Sin Asignar</option>
            ${asesores.map(a => `
              <option value="${a.id}" style="color:#000;" ${_superKanbanAsesorFilter===a.id?'selected':''}>
                ${a.nombre} (${allCandidatos.filter(x=>x.id_asesor===a.id).length})
              </option>
            `).join('')}
          </select>
        </div>
        <button class="btn btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.2);" onclick="toggleKanbanView()">
          <span style="margin-right:4px;">${getIcon('layout')}</span> Vista ${viewMode === 'kanban' ? 'Lista' : 'Kanban'}
        </button>
        <button class="btn" style="background:#38bdf8;color:#0f172a;font-weight:700;" onclick="navigateTo('super-leads')">
          📥 Bandeja de Leads
        </button>
      </div>
    </div>
    
    ${boardHtml}

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

    <!-- Modal Nuevo Candidato Manual -->
    <div class="modal-overlay" id="modal-nuevo-candidato">
      <div class="modal" style="max-width:500px;">
        <div class="modal-header">
          <h3 class="modal-title">➕ Nuevo Candidato</h3>
          <button class="modal-close" onclick="closeModal('modal-nuevo-candidato')">✕</button>
        </div>
        <div class="modal-body">
          <form id="form-nuevo-candidato" style="display:flex;flex-direction:column;gap:16px;">
            <div class="form-group">
              <label class="form-label">Nombre completo</label>
              <input class="form-input" id="nc-nombre" required>
            </div>
            <div class="form-group">
              <label class="form-label">Especialidad</label>
              <input class="form-input" id="nc-especialidad" required>
            </div>
            <div class="form-group">
              <label class="form-label">País</label>
              <input class="form-input" id="nc-pais" required>
            </div>
            <div class="form-group">
              <label class="form-label">Nivel de Alemán</label>
              <select class="form-select" id="nc-aleman">
                <option>A1</option><option>A2</option><option>B1</option>
                <option>B2</option><option>C1</option><option>C2</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal('modal-nuevo-candidato')">Cancelar</button>
          <button class="btn btn-primary" onclick="guardarNuevoCandidato()">Guardar</button>
        </div>
      </div>
    </div>
  `;
}

// Controladores de Super Asesor
window.filtrarLeads = function(filtro) {
  _superLeadsFilter = filtro;
  renderDashboard(State.activeRole, 'super-leads');
};

window.filtrarKanbanAsesor = function(asesorId) {
  _superKanbanAsesorFilter = asesorId;
  renderDashboard(State.activeRole, 'super-kanban');
};

window.verKanbanAsesor = function(asesorId) {
  _superKanbanAsesorFilter = asesorId;
  navigateTo('super-kanban');
};

window.ejecutarDesignacion = async function(candId) {
  const sel = $(`lead-sel-${candId}`);
  if (!sel) return;
  const asesorId = sel.value;
  if (!asesorId) {
    showToast('Selección requerida', 'Por favor selecciona un asesor de la lista.', 'warning');
    return;
  }

  try {
    const cand = DB.getCandidatoById(candId);
    await DB.designarAsesor(candId, asesorId, State.currentUser);
    const asesor = DB.getUsuarios().find(u => u.id === asesorId);
    showToast('🎯 Candidato Designado', `${cand.nombre} fue asignado a ${asesor ? asesor.nombre : 'el asesor'}.`, 'success');
    renderDashboard(State.activeRole, 'super-leads');
  } catch(e) {
    console.error(e);
    showToast('Error', 'No se pudo designar el asesor.', 'error');
  }
};

window.ejecutarAutoDesignacion = async function() {
  try {
    const res = await DB.autoDesignarLeads(State.currentUser);
    if (res.count > 0) {
      showToast('⚡ Reparto Exitoso', res.message, 'success', 5000);
      renderDashboard(State.activeRole, 'super-leads');
    } else {
      showToast('Información', res.message, 'info');
    }
  } catch(e) {
    console.error(e);
    showToast('Error', 'Ocurrió un error al realizar la asignación automática.', 'error');
  }
};

window.cambiarAsesorCandidato = async function(candId) {
  const sel = $(`modal-sel-asesor-${candId}`);
  const asesorId = sel ? sel.value : null;
  try {
    await DB.designarAsesor(candId, asesorId, State.currentUser);
    showToast('Asignación actualizada', asesorId ? 'El asesor ha sido asignado y notificado correctamente.' : 'El candidato quedó marcado como sin asesor.', 'success');
    openCandidateDetail(candId);
    renderDashboard(State.activeRole);
  } catch(e) {
    console.error(e);
    showToast('Error', 'No se pudo actualizar la asignación.', 'error');
  }
};

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
                  <div style="font-size:.75rem;color:var(--slate-400);">${m.tipo} · ${formatDateTime(m.fecha)}</div>
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
              <div style="font-size:.75rem;color:var(--slate-400);margin-bottom:10px;">${m.tipo} · ${formatDateTime(m.fecha)}</div>
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
          <div class="form-group"><label class="form-label">País de origen</label><input class="form-input" id="sc-pais" placeholder="Colombia, México..." oninput="updatePhoneCode(this.value, 'sc-tel')"></div>
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

async function registrarCandidatoSocio() {
  const nombre = $('sc-nombre')?.value.trim();
  const pais   = $('sc-pais')?.value.trim();
  const spec   = $('sc-spec')?.value;
  const nivel  = $('sc-nivel')?.value;
  if (!nombre || !pais) { showToast('Error','Nombre y país son obligatorios.','error'); return; }
  const socio = DB.getSocioByUsuario(State.currentUser.id);
  await DB.createCandidato({ nombre, pais, especialidad: spec, nivel_aleman: nivel, estado_proceso:'Lead Nuevo', estado_homologacion:'Pendiente', id_socio: State.currentUser.id, foto: getInitials(nombre), anos_exp: 0 });
  const superAsesores = DB.getUsuarios().filter(u => (u.roles || []).includes('Super Asesor'));
  superAsesores.forEach(sa => {
    DB.addNotificacion({
      id_usuario_dest: sa.id,
      tipo: 'Nuevo_Candidato',
      titulo: '📥 Nuevo Lead de Socio',
      mensaje: `${State.currentUser.nombre} registró a ${nombre} (${spec} · ${pais}). Pendiente de designar asesor.`
    });
  });
  showToast('✅ Candidato registrado', `${nombre} fue enviado a JN Palabras como Lead Nuevo.`, 'success', 5000);
  $('sc-nombre').value=''; $('sc-pais').value='';
}

function simulateExcelUpload() { showToast('Carga Excel', 'La carga masiva por planilla está disponible en la versión con servidor.', 'info'); }
function downloadTemplate()     { showToast('Descarga', 'Plantilla Excel disponible para descarga en producción.', 'info'); }

function renderSocioReferidos() {
  const socio = DB.getSocioByUsuario(State.currentUser.id) || DB.getSocios()[0];
  const referidos = DB.getCandidatosBySocio(State.currentUser.id);
  const stageWidth = { 'Lead Nuevo':12, '1er contacto, reclutamiento':25, 'Suficiencia del idioma':37, 'Entrevista Laboral y firma del contrato':50, 'Procesamiento de visa':62, 'Fase Pre viaje':75, 'En Destino':87, 'Inserción exitosa':100 };

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
              <span class="badge ${c.estado_proceso==='Inserción exitosa'?'badge-success':'badge-slate'}">${stageWidth[c.estado_proceso]||0}%</span>
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
                <td>${formatDateTime(c.fecha_devengamiento)}</td>
                <td>${c.fecha_pago ? formatDateTime(c.fecha_pago) : 'Pendiente'}</td>
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
const OFF_CANVAS_STEPS = [
  {
    type: 'intro',
    title: '¡Bienvenido a JN Palabras!',
    desc: 'Esta breve evaluación nos tomará unos 3 minutos. Nos ayudará a conocer tu perfil y determinar si cumples los requisitos iniciales para emigrar y trabajar en Alemania.',
    buttonText: 'Empezar Evaluación'
  },
  {
    type: 'question',
    id: 'degree_check',
    label: 'Paso 1 de 9',
    question: '¿Tienes un título universitario o una carrera culminada de por lo menos 3 años?',
    options: [
      { value: 'yes', label: 'Sí, tengo título o carrera', icon: getIcon('academic') },
      { value: 'no', label: 'No', icon: getIcon('cross') }
    ]
  },
  {
    type: 'question',
    id: 'sector',
    label: 'Paso 2 de 9',
    question: '¿A qué sector pertenece tu profesión?',
    options: [
      { value: 'salud', label: 'Salud / Medicina', icon: getIcon('hospital') },
      { value: 'ingenieria', label: 'Ingeniería', icon: getIcon('settings') },
      { value: 'it', label: 'Tecnología (IT)', icon: getIcon('laptop') },
      { value: 'educacion', label: 'Educación', icon: getIcon('home') },
      { value: 'oficios', label: 'Artesanos / Oficios', icon: getIcon('tool') },
      { value: 'otros', label: 'Otros', icon: getIcon('briefcase') }
    ]
  },
  {
    type: 'question',
    id: 'profession',
    label: 'Paso 3 de 9',
    question: 'Selecciona tu profesión específica:',
    options: [
      { sector: 'salud', value: 5, label: 'Médico', icon: getIcon('stethoscope') },
      { sector: 'salud', value: 5, label: 'Enfermero/a', icon: getIcon('hospital') },
      { sector: 'salud', value: 5, label: 'Auxiliar de Geriatría', icon: getIcon('hospital') },
      { sector: 'salud', value: 5, label: 'Asistente Técnico/a de Anestesia', icon: getIcon('syringe') },
      { sector: 'salud', value: 5, label: 'Especialista en Asistencia de Cuidados', icon: getIcon('hospital') },
      { sector: 'salud', value: 5, label: 'Auxiliar de Enfermería', icon: getIcon('stethoscope') },
      { sector: 'ingenieria', value: 4, label: 'Ingeniero/a', icon: getIcon('settings') },
      { sector: 'it', value: 4, label: 'Informático (IT)', icon: getIcon('laptop') },
      { sector: 'educacion', value: 3, label: 'Educador/a', icon: getIcon('home') },
      { sector: 'oficios', value: 4, label: 'Artesano / Oficio', icon: getIcon('tool') },
      { sector: 'otros', value: 2, label: 'Otra', icon: getIcon('briefcase') }
    ]
  },
  {
    type: 'question',
    id: 'age',
    label: 'Paso 4 de 9',
    question: '¿Cuál es tu edad?',
    options: [
      { value: 4, label: '18 - 30 Años', icon: getIcon('calendar') },
      { value: 3, label: '30 - 35 Años', icon: getIcon('calendar') },
      { value: 2, label: '35 - 40 Años', icon: getIcon('calendar') },
      { value: 1, label: '40 - 50 Años', icon: getIcon('calendar') },
      { value: 1, label: '50 Años o más', icon: getIcon('calendar') }
    ]
  },
  {
    type: 'question',
    id: 'education_level',
    label: 'Paso 5 de 9',
    question: 'Nivel educativo / Título',
    options: [
      { value: 4, label: 'Técnico', icon: getIcon('tool') },
      { value: 5, label: 'Doctorado', icon: getIcon('academic') },
      { value: 5, label: 'Maestría', icon: getIcon('academic') },
      { value: 5, label: 'Especialización', icon: getIcon('academic') },
      { value: 5, label: 'Licenciatura', icon: getIcon('fileText') },
      { value: 4, label: 'Formación Profesional', icon: getIcon('briefcase') },
      { value: 3, label: 'Otro', icon: getIcon('info') }
    ]
  },
  {
    type: 'question',
    id: 'experience',
    label: 'Paso 6 de 9',
    question: 'Años de experiencia laboral',
    options: [
      { value: 0, label: 'Sin Experiencia', icon: getIcon('info') },
      { value: 1, label: '1 - 2 Años', icon: getIcon('star') },
      { value: 2, label: '2 - 4 Años', icon: getIcon('star') },
      { value: 3, label: '4 Años o más', icon: getIcon('star') }
    ]
  },
  {
    type: 'question',
    id: 'german',
    label: 'Paso 7 de 9',
    question: 'Conocimientos de Alemán',
    options: [
      { value: 1, label: 'Sin conocimiento', icon: getIcon('abc') },
      { value: 1, label: 'A1', icon: getIcon('globe') },
      { value: 1, label: 'A2', icon: getIcon('globe') },
      { value: 3, label: 'B1', icon: getIcon('globe') },
      { value: 3, label: 'B2', icon: getIcon('globe') },
      { value: 4, label: 'C1', icon: getIcon('globe') },
      { value: 4, label: 'C2', icon: getIcon('globe') },
      { value: 5, label: 'C2 +', icon: getIcon('globe') },
      { value: 5, label: 'Lengua Materna', icon: getIcon('globe') }
    ]
  },
  {
    type: 'question',
    id: 'location',
    label: 'Paso 8 de 9',
    question: 'Lugar de residencia',
    options: [
      { value: 4, label: 'Europa', icon: getIcon('globe') },
      { value: 3, label: 'Latinoamérica', icon: getIcon('globe') },
      { value: 3, label: 'Asia', icon: getIcon('globe') },
      { value: 3, label: 'África', icon: getIcon('globe') },
      { value: 3, label: 'Otro', icon: getIcon('mapPin') }
    ]
  },
  {
    type: 'question',
    id: 'marital',
    label: 'Último Paso',
    question: 'Estado Civil',
    options: [
      { value: 1, label: 'Casado/a', icon: getIcon('info') },
      { value: 2, label: 'Soltero/a', icon: getIcon('info') }
    ]
  }
];

function openApplicationOffcanvas() {
  const overlay = $('application-overlay');
  const offcanvas = $('application-offcanvas');
  if (overlay && offcanvas) {
    overlay.classList.add('open');
    offcanvas.classList.add('open');
    document.body.style.overflow = 'hidden';
    initApplicationOffcanvas();
  }
}

function closeApplicationOffcanvas() {
  const overlay = $('application-overlay');
  const offcanvas = $('application-offcanvas');
  if (overlay && offcanvas) {
    overlay.classList.remove('open');
    offcanvas.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function initApplicationOffcanvas() {
  State.appStep = 0;
  State.appAnswers = {}; State.appAnswersLabels = {};
  renderApplicationStep();
}

function renderApplicationStep() {
  const step = State.appStep;
  const stepData = OFF_CANVAS_STEPS[step];
  const container = $('application-offcanvas-content');
  const progressContainer = $('eligibility-progress');
  
  if (!container || !stepData) return;

  // Update progress bar
  if (progressContainer) {
    const questionSteps = OFF_CANVAS_STEPS.filter(s => s.type === 'question').length;
    let currentQIndex = OFF_CANVAS_STEPS.slice(0, step).filter(s => s.type === 'question').length;
    
    if (stepData.type === 'intro') {
      progressContainer.innerHTML = '';
    } else {
      progressContainer.innerHTML = Array.from({length: questionSteps}).map((_, i) => 
        `<div class="test-progress-segment${i < currentQIndex ? ' done' : i === currentQIndex ? ' active' : ''}"></div>`
      ).join('');
    }
  }

  if (stepData.type === 'intro') {
    container.innerHTML = `
      <div class="intro-step" style="padding-top:20px;">
        <div style="font-size:4rem; margin-bottom:16px;">👋</div>
        <h3>${stepData.title}</h3>
        <p>${stepData.desc}</p>
        <button class="btn btn-primary btn-lg" style="width:100%" onclick="nextApplicationStep()">🚀 ${stepData.buttonText}</button>
      </div>
    `;
  } else if (stepData.type === 'question') {
    let options = stepData.options;
    
    if (stepData.id === 'profession' && State.appAnswers['sector']) {
      options = options.filter(o => o.sector === State.appAnswers['sector'] || o.sector === 'otros');
      if (options.length === 0) options = stepData.options.filter(o => o.sector === 'otros');
    }

    container.innerHTML = `
      <div class="test-step-label" style="display: flex; justify-content: space-between; align-items: center;">
        <span>${stepData.label}</span>
        ${step > 0 ? `<button onclick="prevApplicationStep()" style="background:none; border:none; color:var(--primary-600); cursor:pointer; font-weight:600; font-size:14px; padding: 0;">← Volver</button>` : ''}
      </div>
      <div class="test-question interactive-question" style="font-size:1.5rem; margin-bottom:24px;">${stepData.question}</div>
      <div class="test-options">
        ${options.map(opt => `
          <div class="test-option" onclick="selectAppOption('${stepData.id}', '${opt.value}', this)">
            <span class="test-option-icon">${opt.icon}</span>
            <span>${opt.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function selectAppOption(questionId, value, el) {
  State.appAnswers[questionId] = value; State.appAnswersLabels = State.appAnswersLabels || {}; if (el) State.appAnswersLabels[questionId] = el.innerText.trim();
  $$('#application-offcanvas-content .test-option').forEach(o => o.classList.remove('selected'));
  if (el) el.classList.add('selected');

  const text = el ? el.innerText.toLowerCase() : '';
  const isOtros = text.includes('otro') || text.includes('otra');

  if (isOtros) {
    let container = document.getElementById('otros-input-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'otros-input-container';
      container.style.cssText = 'margin-top:16px; display:flex; flex-direction:column; gap:12px; animation: fadeIn 0.3s ease;';
      container.innerHTML = `
        <input type="text" id="otros-input-field" class="form-control" placeholder="Por favor especifica..." style="width:100%; padding:12px; border:1px solid var(--slate-300); border-radius:8px; font-size:1rem;" autocomplete="off" onkeydown="if(event.key==='Enter') submitOtrosOption('${questionId}', '${value}')">
        <button class="btn btn-primary" onclick="submitOtrosOption('${questionId}', '${value}')" style="width:100%">Continuar</button>
      `;
      const optionsDiv = document.querySelector('#application-offcanvas-content .test-options');
      optionsDiv.parentNode.insertBefore(container, optionsDiv.nextSibling);
    }
    setTimeout(() => {
      document.getElementById('otros-input-field')?.focus();
    }, 100);
  } else {
    const existing = document.getElementById('otros-input-container');
    if (existing) existing.remove();

    setTimeout(() => {
      nextApplicationStep();
    }, 400);
  }
}

function submitOtrosOption(questionId, value) {
  const inputVal = document.getElementById('otros-input-field')?.value.trim();
  if (!inputVal) {
    if (typeof showToast === 'function') {
      showToast('Atención', 'Por favor especifica tu respuesta.', 'error');
    } else {
      alert('Por favor especifica tu respuesta.');
    }
    return;
  }
  State.appAnswers[questionId + '_especificacion'] = inputVal;
  nextApplicationStep();
}

function nextApplicationStep() {
  State.appStep++;
  if (State.appStep >= OFF_CANVAS_STEPS.length) {
    showApplicationResult();
  } else {
    renderApplicationStep();
  }
}

function prevApplicationStep() {
  if (State.appStep > 0) {
    State.appStep--;
    renderApplicationStep();
  }
}

function showApplicationResult() {
  const ans = State.appAnswers;
  let totalScore = 0;
  
  Object.keys(ans).forEach(key => {
    const num = parseInt(ans[key], 10);
    if (!isNaN(num) && key !== 'sector' && key !== 'degree_check') {
      totalScore += num;
    }
  });

  const isEligible = totalScore >= 20;
  const container  = $('application-offcanvas-content');
  const progressContainer = $('eligibility-progress');
  
  if (progressContainer) {
    const questionSteps = OFF_CANVAS_STEPS.filter(s => s.type === 'question').length;
    progressContainer.innerHTML = Array.from({length: questionSteps}).map(() => 
      `<div class="test-progress-segment done"></div>`
    ).join('');
  }

  if (isEligible) {
    container.innerHTML = `
      <div class="test-result-success" style="text-align: center; margin-top:24px;">
        <div class="test-result-icon">🎉</div>
        <div class="test-result-title">¡Felicitaciones! Eres elegible</div>
        <div class="test-result-desc">
          Tu perfil cumple los criterios de JN Palabras para iniciar el proceso de emigración médica a Alemania.<br><br>
          <div style="background:#f1f5f9; padding:16px; border-radius:8px; display:inline-block; margin-bottom:16px;">
            <strong style="color:var(--slate-900); font-size:1.25rem;">Puntaje de Perfil: ${totalScore}</strong>
          </div><br>
          Uno de nuestros asesores se pondrá en contacto contigo en menos de 24 horas hábiles.
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap; margin-top:24px;">
          <button class="btn btn-primary btn-lg" style="width:100%;" onclick="closeApplicationOffcanvas(); openModal('modal-registro-candidato');">✅ Completar Mi Registro</button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="test-result-success" style="text-align: center; margin-top:24px;">
        <div class="test-result-icon">💙</div>
        <div class="test-result-title">Analizaremos tu caso en detalle</div>
        <div class="test-result-desc">
          <div style="background:#f1f5f9; padding:16px; border-radius:8px; display:inline-block; margin-bottom:16px;">
            <strong style="color:var(--slate-900); font-size:1.25rem;">Puntaje de Perfil: ${totalScore}</strong>
          </div><br>
          No te preocupes si no alcanzaste el puntaje ideal. Contáctanos directamente y analizaremos tu caso particular.
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap; margin-top:24px;">
          <button class="btn btn-primary btn-lg" style="width:100%;" onclick="closeApplicationOffcanvas(); scrollToSection('contact');">📧 Contactar Asesor</button>
        </div>
      </div>
    `;
  }
}

// Ensure the new functions are available globally if index.html calls them
window.openApplicationOffcanvas = openApplicationOffcanvas;
window.closeApplicationOffcanvas = closeApplicationOffcanvas;
window.prevApplicationStep = prevApplicationStep;
window.submitOtrosOption = submitOtrosOption;

function updatePhoneCode(pais, phoneInputId) {
  const normalized = pais.trim().toLowerCase();
  const phoneInput = document.getElementById(phoneInputId);
  if (!phoneInput) return;

  const countryCodes = {
    'ecuador': '+593', 'colombia': '+57', 'mexico': '+52', 'méxico': '+52',
    'peru': '+51', 'perú': '+51', 'chile': '+56', 'argentina': '+54',
    'bolivia': '+591', 'venezuela': '+58', 'paraguay': '+595', 'uruguay': '+598',
    'brasil': '+55', 'españa': '+34', 'costa rica': '+506', 'panama': '+507',
    'panamá': '+507', 'guatemala': '+502', 'honduras': '+504', 'el salvador': '+503',
    'nicaragua': '+505', 'cuba': '+53', 'dominicana': '+1', 'estados unidos': '+1',
    'alemania': '+49'
  };

  const code = countryCodes[normalized];
  if (code) {
    const currentVal = phoneInput.value.trim();
    if (!currentVal) {
      phoneInput.value = code + ' ';
    } else if (currentVal.match(/^\+\d+/)) {
      phoneInput.value = currentVal.replace(/^\+\d+/, code);
    } else {
      phoneInput.value = code + ' ' + currentVal;
    }
  }
}
window.updatePhoneCode = updatePhoneCode;

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
  return { 'Lead Nuevo':'var(--slate-500)','1er contacto, reclutamiento':'var(--info)','Suficiencia del idioma':'#8b5cf6','Entrevista Laboral y firma del contrato':'#ec4899','Procesamiento de visa':'var(--gold-600)','Fase Pre viaje':'#14b8a6','En Destino':'#eab308','Inserción exitosa':'var(--success)' }[estado] || 'var(--slate-500)';
}

function scrollToSection(id) {
  let targetId = id;
  if (id === 'contacto') targetId = 'contact';
  if (id === 'nosotros') targetId = 'about';
  if (id === 'inicio') targetId = 'hero';
  const el = $(targetId) || document.getElementById(targetId) || document.querySelector(`[data-section="${targetId}"]`);
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
async function submitRegistration(e) {
  e?.preventDefault();
  const nombre = ($('reg-nombre')?.value || '').trim();
  const pais   = ($('reg-pais')?.value || '').trim();
  const correo = ($('reg-correo')?.value || '').trim();
  const comentarios = ($('reg-comentarios')?.value || '').trim();
  
  if (!nombre || !correo || !pais) { showToast('Error','Por favor completa todos los campos requeridos.','error'); return; }
  
  // Calcular puntaje
  let totalScore = 0;
  Object.keys(State.appAnswers).forEach(key => {
    const num = parseInt(State.appAnswers[key], 10);
    if (!isNaN(num) && key !== 'sector' && key !== 'degree_check') {
      totalScore += num;
    }
  });

  await DB.createCandidato({ 
    nombre, 
    pais, 
    especialidad: 'Ver Test', 
    nivel_aleman: 'Ver Test', 
    estado_proceso: 'Lead Nuevo', 
    estado_homologacion: 'Pendiente', 
    foto: getInitials(nombre), 
    anos_exp: 0,
    correo,
    notas_internas: comentarios,
    telefono: ($('reg-telefono')?.value || '').trim(),
    edad: ($('reg-edad')?.value || '').trim(),
    puntaje_elegibilidad: totalScore,
    respuestas_elegibilidad: { ...(State.appAnswersLabels || State.appAnswers) }
  });

  // Notificar a los Super Asesores del nuevo lead recibido
  const superAsesores = DB.getUsuarios().filter(u => (u.roles || []).includes('Super Asesor'));
  superAsesores.forEach(sa => {
    DB.addNotificacion({
      id_usuario_dest: sa.id,
      tipo: 'Nuevo_Candidato',
      titulo: '📥 Nuevo Lead para Designar',
      mensaje: `${nombre} (${pais}) completó el test (${totalScore} pts). Pendiente de designar asesor.`
    });
  });
  
  // Limpiar respuestas para futuras aplicaciones
  State.appAnswers = {};
  State.appStep = 0;
  
  closeModal('modal-registro-candidato');
  showToast('🎉 ¡Registro exitoso!', `Bienvenido/a ${nombre.split(' ')[0]}! Tu asesor te contactará en 24h.`, 'success', 7000);
}

// ──────────────────────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();

  const session = DB.getSession();
  const rawHash = window.location.hash.replace('#', '').trim();
  const savedView = localStorage.getItem('jnp_current_view');
  const savedRole = localStorage.getItem('jnp_active_role');
  const savedSidebar = localStorage.getItem('jnp_current_sidebar');

  const publicSections = ['about', 'nosotros', 'proceso', 'contact', 'contacto', 'eligibilidad', 'hero', 'inicio', 'public'];

  if (session) {
    if (session.rol && !session.roles) session.roles = [session.rol];
    const users = DB.getUsuarios();
    const updatedUser = users.find(u => u.id === session.id || (session.correo && u.correo && u.correo.toLowerCase() === session.correo.toLowerCase()));
    State.currentUser = updatedUser ? { ...session, ...updatedUser } : session;
    
    // Auto-corregir sesiones guardadas previamente que tengan 'Ana García' en la cuenta admin
    if (State.currentUser && State.currentUser.correo === 'admin@jnpalabras.com' && (State.currentUser.nombre.includes('Ana') || !State.currentUser.nombre)) {
      State.currentUser.nombre = 'Admin JN Palabras';
      State.currentUser.avatar = 'AJ';
    }
    DB.setSession(State.currentUser);

    // Determinar rol activo
    let activeRole = savedRole;
    const roleFromHash = getRoleForView(rawHash);
    const userRoles = State.currentUser.roles || [];
    const isAdmin = userRoles.includes('Admin');

    if (roleFromHash && (userRoles.includes(roleFromHash) || isAdmin)) {
      activeRole = roleFromHash;
    } else if (!activeRole || (!userRoles.includes(activeRole) && !isAdmin)) {
      activeRole = userRoles.length > 0 ? userRoles[0] : 'Candidato';
    }
    State.activeRole = activeRole;
    try { localStorage.setItem('jnp_active_role', activeRole); } catch(e) {}

    // Evaluar si el usuario estaba o desea estar en la vista pública
    const isPublicHash = publicSections.includes(rawHash);
    const isDashboardHash = !!getRoleForView(rawHash);

    if (rawHash === 'login') {
      showLogin();
    } else if (isPublicHash || (savedView === 'public' && !isDashboardHash)) {
      showPublic();
      if (rawHash && rawHash !== 'public' && rawHash !== 'inicio') {
        setTimeout(() => scrollToSection(rawHash), 150);
      }
    } else {
      const allowed = (SIDEBAR_MENUS[State.activeRole] || []).map(m => m.id);
      let targetSidebar = null;

      if (rawHash && allowed.includes(rawHash)) {
        targetSidebar = rawHash;
      } else if (savedSidebar && allowed.includes(savedSidebar)) {
        targetSidebar = savedSidebar;
      } else {
        targetSidebar = allowed[0];
      }

      State.currentSidebar = targetSidebar;
      showApp(targetSidebar);
    }
  } else {
    // Sin sesión
    if (rawHash === 'login' || savedView === 'login') {
      showLogin();
    } else {
      showPublic();
      if (rawHash && publicSections.includes(rawHash)) {
        setTimeout(() => scrollToSection(rawHash), 150);
      }
    }
  }

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '').trim();
    if (!hash) {
      if (State.currentView === 'public') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (hash === 'login') {
      showLogin();
      return;
    }

    if (publicSections.includes(hash)) {
      if (State.currentView !== 'public') {
        showPublic();
      }
      scrollToSection(hash);
      return;
    }

    const roleForView = getRoleForView(hash);
    if (roleForView && State.currentUser) {
      const userRoles = State.currentUser.roles || [];
      const isAdmin = userRoles.includes('Admin');
      if ((userRoles.includes(roleForView) || isAdmin) && State.activeRole !== roleForView) {
        State.activeRole = roleForView;
        try { localStorage.setItem('jnp_active_role', roleForView); } catch(e) {}
      }
      if (State.currentView !== 'app') {
        showApp(hash);
      } else if (hash !== State.currentSidebar) {
        navigateTo(hash);
      }
    }
  });

  // Navegación pública
  window.addEventListener('scroll', handleNavScroll);

  // Login form (handled by inline onsubmit in HTML)

  // GDPR banner
  if (!localStorage.getItem('jnp_gdpr')) {
    $('gdpr-banner')?.classList.remove('hidden');
  } else {
    $('gdpr-banner')?.remove();
  }

  // Inicializar test de elegibilidad
  // (eliminado porque initEligibilityTest no existe)

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
window.editProfile = editProfile;
window.saveProfile = saveProfile;
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
// Functions for candidate document actions
function quickUploadDocForCandidate(id) {
  const candidato = DB.getCandidatos().find(c => c.id === id);
  const nombre = candidato ? candidato.nombre : 'Candidato';
  showToast('Subir Documento', `Selecciona un archivo PDF para subir a la carpeta de ${nombre}.`, 'info', 4000);
}

function omitCandidateDocStep(id) {
  const candidato = DB.getCandidatos().find(c => c.id === id);
  const nombre = candidato ? candidato.nombre : 'Candidato';
  showToast('Requisito Omitido', `Se ha marcado la omisión temporal del requisito para ${nombre}.`, 'warning', 4000);
}

// Dashboard inline handlers
const _windowExports = {
  marcarNotifLeidas, showTab, filterBlindCards, openRegistrationModal,
  editUser, saveUser, deleteUser, createUser, filterTable, saveCms,
  toggleKanbanView, guardarNuevoCandidato, openCandidateDetail,
  renderCandidateProfilePage, closeCandidateProfile, exportCandidateProfilePDF,
  openEditCandidateModal, saveCandidateProfileEdit, quickSendMessage,
  quickScheduleInterview, quickUploadDocForCandidate, omitCandidateDocStep,
  quickAddCandidateNote, openCandidateDetailModalLegacy, deleteCandidateProfile,
  acceptCandidate, rejectCandidate, reviewDoc, showRejectModal, addQuickNote,
  selectMatchCand, selectMatchVac, ejecutarMatch, notificarAsesorRiesgo,
  guardarCalif, registrarExamen, subirMaterial, simulateUpload, uploadDocSimulate,
  playVideo, solicitarEntrevista, confirmarEntrevista, toggleVacante, deleteVacante,
  crearVacante, setStars, enviarFeedback, registrarCandidatoSocio, simulateExcelUpload,
  downloadTemplate, openCVForCandidate, switchCVTab, saveCVForm, selectCandidateForCV,
  createNewCandidateCV, printLebenslauf, handleCvPhotoUpload, addWerdegangItem,
  removeWerdegangItem, addAusbildungItem, removeAusbildungItem, addSprachenItem,
  removeSprachenItem
};

for (const [key, fn] of Object.entries(_windowExports)) {
  if (typeof fn !== 'undefined') {
    window[key] = fn;
  }
}


window.toggleRoleDropdown = function(e) {
  if (e) {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
  }
  const dropdown = document.getElementById('custom-role-dropdown');
  if (dropdown) {
    const isVisible = dropdown.style.display === 'block' || dropdown.classList.contains('open');
    if (isVisible) {
      dropdown.style.display = 'none';
      dropdown.classList.remove('open');
    } else {
      dropdown.style.display = 'block';
      dropdown.classList.add('open');
    }
  }
};

window.selectRoleFromDropdown = function(role, e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const dropdown = document.getElementById('custom-role-dropdown');
  if (dropdown) {
    dropdown.style.display = 'none';
    dropdown.classList.remove('open');
  }
  switchRole(role);
};

document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('custom-role-dropdown');
  if (!dropdown) return;
  const container = e.target ? e.target.closest('.role-switcher-container') : null;
  if (!container) {
    dropdown.style.display = 'none';
    dropdown.classList.remove('open');
  }
});

window.switchRole = function(newRole) {
  if (!newRole) return;
  setTimeout(() => {
    State.activeRole = newRole;
    if (State.currentUser) {
      if (!State.currentUser.roles) State.currentUser.roles = [];
      if (!State.currentUser.roles.includes(newRole)) {
        State.currentUser.roles.push(newRole);
      }
      DB.setSession(State.currentUser);
    }
    try {
      localStorage.setItem('jnp_active_role', newRole);
      localStorage.setItem('jnp_current_view', 'app');
    } catch(e) {}
    document.body.className = `theme-${newRole.toLowerCase().replace(/\s+/g, '-')}`;
    const firstItem = SIDEBAR_MENUS[newRole]?.[0]?.id || 'admin-overview';
    State.currentSidebar = firstItem;
    try {
      if (firstItem) {
        localStorage.setItem('jnp_current_sidebar', firstItem);
        window.history.replaceState(null, '', '#' + firstItem);
      }
    } catch(e) {}
    renderAppShell(firstItem);
    showToast('Rol Cambiado', `Perfil activo actualizado a ${newRole}.`, 'info', 2500);
  }, 10);
};

window.filtrarLeads = filtrarLeads;
window.filtrarKanbanAsesor = filtrarKanbanAsesor;
window.verKanbanAsesor = verKanbanAsesor;
window.ejecutarDesignacion = ejecutarDesignacion;
window.ejecutarAutoDesignacion = ejecutarAutoDesignacion;
window.cambiarAsesorCandidato = cambiarAsesorCandidato;
window.getRoleForView = getRoleForView;
window.toggleAgendaTask = toggleAgendaTask;
window.addNewAgendaTask = addNewAgendaTask;
window.toggleSpeechWidget = toggleSpeechWidget;
window.openSpeechWidgetForCandidate = openSpeechWidgetForCandidate;
window.setSpeechTab = setSpeechTab;
window.onSpeechCandidateSelect = onSpeechCandidateSelect;
window.saveCandidateDataFromSpeech = saveCandidateDataFromSpeech;
window.openQuickNoteModal = openQuickNoteModal;
window.renderAsesorDashboard = renderAsesorDashboard;
window.renderAsesorKanban = renderAsesorKanban;
window.filterKanbanCandidates = filterKanbanCandidates;
window.exportKanbanCSV = exportKanbanCSV;
window.openCandidateCVModal = openCandidateCVModal;
window.openCandidateDossierModal = openCandidateDossierModal;
window.openAddCandidateNoteModal = openAddCandidateNoteModal;
window.saveCandidateNoteFromModal = saveCandidateNoteFromModal;
window.openCandidateChatModal = openCandidateChatModal;
window.sendCandidateChatMessage = sendCandidateChatMessage;
window.insertQuickChatMsg = insertQuickChatMsg;
window.openScheduleInterviewModal = openScheduleInterviewModal;
window.saveScheduledInterview = saveScheduledInterview;
window.openEditCandidateModal = openEditCandidateModal;
window.saveCandidateProfileEdit = saveCandidateProfileEdit;
window.switchDossierTab = switchDossierTab;
window.quickAddCandidateNote = quickAddCandidateNote;
window.quickSendMessage = quickSendMessage;
window.quickScheduleInterview = quickScheduleInterview;
window.closeCandidateProfile = closeCandidateProfile;
window.exportCandidateProfilePDF = exportCandidateProfilePDF;
window.openCandidateDetail = openCandidateDetail;

