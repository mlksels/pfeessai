/**
 * sync.js — Couche de synchronisation centrale
 * Association Sportive Manar Oran
 *
 * Inclure en PREMIER script sur chaque page :
 *   <script src="/assets/js/sync.js"></script>
 *
 * Fournit window.DS (DataStore) utilisable partout.
 * Toutes les pages lisent/écrivent via DS.get() / DS.set()
 * afin de garantir que dashboard et pages publiques
 * voient toujours les mêmes données.
 */

/* ============================================================
   CLÉS UNIFIÉES — NE JAMAIS UTILISER D'AUTRES CLÉS localStorage
   ============================================================ */
const KEYS = {
  users:        'ms_users',
  events:       'ms_events',
  teams:        'ms_teams',
  gallery:      'ms_gallery',
  messages:     'ms_messages',
  transactions: 'ms_transactions',
  session:      'ms_session',
  settings:     'ms_settings',
  bookings:     'ms_bookings',
  performances: 'ms_performances',
  planning:     'ms_planning',
  news:         'ms_news',
};

/* ============================================================
   MIGRATION : anciens noms de clés → nouvelles clés unifiées
   ============================================================ */
const LEGACY_MAP = {
  'users':           KEYS.users,
  'currentUser':     KEYS.session,
  'currentSession':  KEYS.session,
  'events':          KEYS.events,
  'eventsData':      KEYS.events,
  'planningEvents':  KEYS.planning,
  'teams':           KEYS.teams,
  'teamsData':       KEYS.teams,
  'equipesData':     KEYS.teams,
  'gallery':         KEYS.gallery,
  'galleryPhotos':   KEYS.gallery,
  'messages':        KEYS.messages,
  'contactMessages': KEYS.messages,
  'transactions':    KEYS.transactions,
  'userBookings':    KEYS.bookings,
  'sportsData':      null, // abandonné
  'actualitesData':  KEYS.news,
  'newsData':        KEYS.news,
  'cookieChoice':    'ms_cookieChoice',
};

/* ============================================================
   DONNÉES INITIALES (seed)
   ============================================================ */
function seedUsers() {
  return [
    { id:1, nom:'Admin', prenom:'System', email:'admin@manarsport.dz',
      password:'admin123', role:'admin', userType:'admin',
      status:'active', sexe:'M', documents:[],
      createdAt: new Date().toISOString(), lastLogin:null },
    { id:2, nom:'Benali', prenom:'Karim', email:'coach@manarsport.dz',
      password:'coach123', role:'coach', userType:'coach',
      status:'active', sexe:'M', sport:'Football', experience:'5 ans',
      specialite:'Football', documents:[],
      createdAt: new Date().toISOString(), lastLogin:null },
    { id:3, nom:'Moussa', prenom:'Leila', email:'parent@manarsport.dz',
      password:'parent123', role:'parent', userType:'parent',
      status:'active', sexe:'F', documents:[],
      createdAt: new Date().toISOString(), lastLogin:null },
    { id:4, nom:'Touati', prenom:'Yacine', email:'athlete@manarsport.dz',
      password:'athlete123', role:'athlete', userType:'athlete',
      status:'active', sexe:'M', sport:'Basketball', niveau:'avance',
      documents:[], createdAt: new Date().toISOString(), lastLogin:null },
  ];
}

function seedEvents() {
  const d = (plus) => { const t = new Date(); t.setDate(t.getDate()+plus); return t.toISOString().split('T')[0]; };
  return [
    { id:1, title:'Tournoi Annuel de Football', date:d(10), endDate:d(15),
      type:'competition', sport:'Football', location:'Stade Municipal',
      description:'Tournoi inter-clubs — Catégories U15, U17, U20',
      maxParticipants:100, registered:45, price:2000,
      schedule:'15:00 - 19:00', status:'confirmed', coach:'Karim Benali' },
    { id:2, title:'Portes Ouvertes Manar Sport', date:d(20),
      type:'event', location:'Complexe Manar',
      description:"Découvrez nos installations et rencontrez nos coachs",
      maxParticipants:500, registered:120, schedule:'10:00 - 18:00', status:'open' },
    { id:3, title:'Stage Intensif Natation', date:d(30), endDate:d(32),
      type:'training', sport:'Natation', location:'Piscine Olympique',
      description:'Stage intensif avec coach professionnel',
      maxParticipants:30, registered:18, price:5000,
      schedule:'09:00 - 12:00', status:'open', coach:'Karim Benali' },
    { id:4, title:'Match Amical Basketball', date:d(8),
      type:'competition', sport:'Basketball', location:'Salle Omnisports',
      description:"Match contre l'équipe de Mostaganem",
      maxParticipants:30, registered:15, schedule:'18:00 - 20:00', status:'confirmed' },
    { id:5, title:'Entraînement Football U20', date:d(1),
      type:'training', sport:'Football', location:'Terrain A',
      description:'Entraînement hebdomadaire U20',
      maxParticipants:25, registered:18, schedule:'18:00 - 20:00',
      status:'open', coach:'Karim Benali' },
  ];
}

function seedTeams() {
  return [
    { id:1, name:'Football U20', sport:'Football', coach:'Karim Benali',
      members:18, maxMembers:22, category:'Jeunes', level:'Compétition',
      schedule:'Lun, Mer, Ven 18h-20h', status:'open',
      description:'Équipe de football des moins de 20 ans, participant aux championnats régionaux.',
      achievements:['Champion régional 2023', "Finaliste coupe d'Oran 2022"] },
    { id:2, name:'Basketball Senior Féminin', sport:'Basketball', coach:'Leila Bensalem',
      members:15, maxMembers:15, category:'Adultes', level:'Avancé',
      schedule:'Mar, Jeu, Sam 19h-21h', status:'full',
      description:'Équipe féminine de basketball ouverte à tous niveaux.',
      achievements:['3ème place nationale 2023'] },
    { id:3, name:'Natation Compétition', sport:'Natation', coach:'Amine Slimani',
      members:12, maxMembers:20, category:'Jeunes/Adultes', level:'Avancé',
      schedule:'Lun, Mer, Ven 7h-9h', status:'open',
      description:'Groupe de natation de compétition.',
      achievements:['Champion national 2023'] },
    { id:4, name:'Athlétisme Tous Niveaux', sport:'Athlétisme', coach:'Sofiane Hadj',
      members:8, maxMembers:15, category:'Tous âges', level:'Tous niveaux',
      schedule:'Mar, Jeu 17h-19h', status:'open',
      description:'Section athlétisme ouverte à tous.', achievements:[] },
  ];
}

function seedGallery() {
  return [
    { id:1, title:'Victoire en finale régionale',
      description:'Notre équipe de football U20 après leur victoire au championnat régional.',
      category:'competitions', date:'2024-11-15',
      author:'Service Communication', authorId:1, likes:245, views:1845, dataUrl:null },
    { id:2, title:'Entraînement basketball',
      description:"Séance d'entraînement de l'équipe senior féminine.",
      category:'entrainements', date:'2024-11-10',
      author:'Karim Benali', authorId:2, likes:156, views:982, dataUrl:null },
    { id:3, title:'Journée portes ouvertes',
      description:'Découverte des installations.',
      category:'evenements', date:'2024-11-05',
      author:'Service Communication', authorId:1, likes:189, views:2103, dataUrl:null },
    { id:4, title:'Stage natation jeunes',
      description:"Stage intensif d'été.",
      category:'formations', date:'2024-11-01',
      author:'Amine Slimani', authorId:3, likes:28, views:189, dataUrl:null },
  ];
}

function seedMessages() {
  return [
    { id:1, name:'Ahmed Benali', email:'ahmed@test.com',
      subject:"Demande d'inscription",
      message:"Je souhaite inscrire mon fils de 12 ans au football. Quels sont les documents nécessaires ?",
      date: new Date(Date.now()-86400000).toISOString(), read:false },
    { id:2, name:'Samira Moussa', email:'samira@test.com',
      subject:'Question sur les tarifs',
      message:'Bonjour, intéressée par les cours de natation adulte. Tarifs et horaires ?',
      date: new Date(Date.now()-172800000).toISOString(), read:true },
    { id:3, name:'Rachid Touati', email:'rachid@test.com',
      subject:'Demande de stage',
      message:"Y a-t-il des stages basketball pendant les vacances de printemps ?",
      date: new Date(Date.now()-259200000).toISOString(), read:false },
  ];
}

function seedTransactions() {
  return [
    { id:1, date:'2024-02-20', member:'Karim Benali', memberId:2,
      type:'Inscription', amount:5000, status:'payé' },
    { id:2, date:'2024-02-19', member:'Leila Moussa', memberId:3,
      type:'Stage natation', amount:5000, status:'payé' },
    { id:3, date:'2024-02-18', member:'Yacine Touati', memberId:4,
      type:'Inscription enfant', amount:3500, status:'en attente' },
  ];
}

function seedNews() {
  return [
    { id:1, title:"Notre équipe de football U20 championne régionale",
      excerpt:"L'équipe des moins de 20 ans a remporté le championnat régional après une saison exceptionnelle.",
      date:'2024-11-10', category:'competitions', author:'Équipe Football',
      views:2845, tags:['football','championnat','jeunes'], featured:true,
      content:"<p>L'équipe U20 a remporté le titre régional avec 18 victoires et 2 nuls.</p>" },
    { id:2, title:'Nouveau coach de natation : Karim Benali',
      excerpt:"L'association accueille Karim Benali, ancien champion national, comme nouveau coach de natation.",
      date:'2024-11-08', category:'annonces', author:'Direction Sportive',
      views:1956, tags:['natation','coach','recrutement'], featured:false,
      content:"<p>Karim Benali, ancien champion national 5 fois, rejoint Manar Sport.</p>" },
    { id:3, title:'Portes ouvertes : record de participation',
      excerpt:'Notre journée portes ouvertes a attiré plus de 500 visiteurs.',
      date:'2024-11-05', category:'evenements', author:'Communication',
      views:1745, tags:['événement','découverte','communauté'], featured:false,
      content:"<p>Plus de 500 visiteurs et 80 nouvelles inscriptions.</p>" },
  ];
}

function seedSettings() {
  return {
    clubName:'Association Sportive Manar Oran',
    email:'contact@manarsport.dz',
    phone:'+213 41 12 34 56',
    address:'Bir El Djir, Oran, Algérie',
    description:'Association sportive fondée en 2010, dédiée au développement du sport à Oran.',
  };
}

/* ============================================================
   DataStore — API principale
   ============================================================ */
class DataStore {
  constructor() {
    this._channel = null;
    this._listeners = {};
    this._migrated  = false;

    // BroadcastChannel pour synchro entre onglets
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this._channel = new BroadcastChannel('ms_sync');
        this._channel.onmessage = (e) => this._onRemoteChange(e.data);
      } catch(_) {}
    }

    this._migrate();
    this._seed();
  }

  /* ---------- Clés publiques ---------- */
  get KEYS() { return KEYS; }

  /* ---------- Lecture ---------- */
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch(e) {
      console.error('[DS] get error', key, e);
      return null;
    }
  }

  sanitizeUsersForStorage(users) {
    if (!Array.isArray(users)) return users;
    return users.map(user => {
      if (user && Array.isArray(user.documents)) {
        user.documents = user.documents.map(doc => {
          if (doc && typeof doc === 'object') {
            delete doc.preview;
          }
          return doc;
        });
      }
      if (user && user.files && typeof user.files === 'object') {
        Object.entries(user.files).forEach(([key, file]) => {
          if (file && typeof file === 'object') {
            delete file.dataUrl;
            delete file.preview;
          }
        });
      }
      return user;
    });
  }

  /* ---------- Écriture ---------- */
  set(key, value) {
    try {
      const storedValue = key === KEYS.users ? this.sanitizeUsersForStorage(value) : value;
      localStorage.setItem(key, JSON.stringify(storedValue));
      this._broadcast(key, storedValue);
      this._emit(key, storedValue);
    } catch(e) {
      console.error('[DS] set error', key, e);
    }
  }

  /* ---------- Fusion d'un tableau (upsert par id) ---------- */
  upsert(key, item) {
    const list = this.get(key) || [];
    const idx  = list.findIndex(x => x.id === item.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...item };
    else list.push(item);
    this.set(key, list);
    return list;
  }

  /* ---------- Suppression d'un élément ---------- */
  remove(key, id) {
    const list = (this.get(key) || []).filter(x => x.id !== id);
    this.set(key, list);
    return list;
  }

  /* ---------- Session utilisateur ---------- */
  getSession() {
    return this.get(KEYS.session);
  }

  setSession(user) {
    const safe = { ...user };
    delete safe.password;
    this.set(KEYS.session, safe);
    // Rétrocompatibilité — certaines pages lisent encore les anciennes clés
    try {
      localStorage.setItem('currentSession', JSON.stringify(safe));
      localStorage.setItem('currentUser', JSON.stringify(safe));
    } catch(_) {}
  }

  clearSession() {
    localStorage.removeItem(KEYS.session);
    localStorage.removeItem('currentSession');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this._broadcast(KEYS.session, null);
    this._emit(KEYS.session, null);
  }

  /* ---------- Abonnement aux changements ---------- */
  on(key, cb) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(cb);
    return () => { this._listeners[key] = this._listeners[key].filter(f => f !== cb); };
  }

  /* ---------- Statistiques dashboard ---------- */
  stats() {
    const users  = this.get(KEYS.users)  || [];
    const events = this.get(KEYS.events) || [];
    const msgs   = this.get(KEYS.messages) || [];
    const tx     = this.get(KEYS.transactions) || [];

    const nonAdmin = users.filter(u => (u.role||u.userType) !== 'admin');
    const weekAgo  = new Date(); weekAgo.setDate(weekAgo.getDate()-7);

    const paidTotal    = tx.filter(t=>t.status==='payé').reduce((s,t)=>s+t.amount,0);
    const pendingTotal = tx.filter(t=>t.status==='en attente').reduce((s,t)=>s+t.amount,0);
    const totalTx      = paidTotal + pendingTotal;

    return {
      totalMembers:  nonAdmin.filter(u=>u.status==='active').length,
      pendingMembers:nonAdmin.filter(u=>u.status==='pending').length,
      newThisWeek:   nonAdmin.filter(u=>new Date(u.createdAt||u.registrationDate||0)>weekAgo).length,
      totalEvents:   events.length,
      unreadMessages:msgs.filter(m=>!m.read).length,
      revenue:       paidTotal,
      pendingRevenue:pendingTotal,
      recoveryRate:  totalTx>0 ? Math.round(paidTotal/totalTx*100) : 0,
      men:           nonAdmin.filter(u=>u.sexe==='M').length,
      women:         nonAdmin.filter(u=>u.sexe==='F').length,
    };
  }

  /* ---------- Login ---------- */
  login(email, password) {
    const users = this.get(KEYS.users) || [];
    const user  = users.find(u => u.email===email && u.password===password && u.status==='active');
    if (!user) return null;
    // Mettre à jour lastLogin
    user.lastLogin = new Date().toISOString();
    this.upsert(KEYS.users, user);
    this.setSession(user);
    return user;
  }

  /* ---------- Inscription ---------- */
  register(userData) {
    const users = this.get(KEYS.users) || [];
    if (users.find(u=>u.email===userData.email)) return { error:'email_exists' };
    const newUser = {
      ...userData,
      id: Date.now(),
      status: userData.role==='admin' ? 'active' : 'pending',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      documents: userData.documents || [],
    };
    users.push(newUser);
    this.set(KEYS.users, users);
    this.setSession(newUser);
    return { user: newUser };
  }

  /* ---------- Migration des anciennes clés ---------- */
  _migrate() {
    if (this._migrated) return;
    this._migrated = true;

    for (const [oldKey, newKey] of Object.entries(LEGACY_MAP)) {
      if (!newKey) continue;
      const raw = localStorage.getItem(oldKey);
      if (!raw) continue;
      if (localStorage.getItem(newKey)) continue; // nouvelle clé déjà présente
      try {
        localStorage.setItem(newKey, raw);
        console.log(`[DS] migrated "${oldKey}" → "${newKey}"`);
      } catch(_) {}
    }
  }

  /* ---------- Seed des données initiales ---------- */
  _seed() {
    if (!this.get(KEYS.users))        this.set(KEYS.users,        seedUsers());
    if (!this.get(KEYS.events))       this.set(KEYS.events,       seedEvents());
    if (!this.get(KEYS.teams))        this.set(KEYS.teams,        seedTeams());
    if (!this.get(KEYS.gallery))      this.set(KEYS.gallery,      seedGallery());
    if (!this.get(KEYS.messages))     this.set(KEYS.messages,     seedMessages());
    if (!this.get(KEYS.transactions)) this.set(KEYS.transactions, seedTransactions());
    if (!this.get(KEYS.news))         this.set(KEYS.news,         seedNews());
    if (!this.get(KEYS.settings))     this.set(KEYS.settings,     seedSettings());
    if (!this.get(KEYS.bookings))     this.set(KEYS.bookings,     []);
    if (!this.get(KEYS.performances)) this.set(KEYS.performances, []);
    if (!this.get(KEYS.planning))     this.set(KEYS.planning,     this.get(KEYS.events)||[]);

    // Alias rétrocompat session
    const s = this.get(KEYS.session);
    if (s) {
      try {
        if (!localStorage.getItem('currentSession'))
          localStorage.setItem('currentSession', JSON.stringify(s));
        if (!localStorage.getItem('currentUser'))
          localStorage.setItem('currentUser', JSON.stringify(s));
      } catch(_) {}
    }
  }

  /* ---------- BroadcastChannel ---------- */
  _broadcast(key, value) {
    if (this._channel) {
      try { this._channel.postMessage({ key, value }); } catch(_) {}
    }
  }

  _onRemoteChange({ key, value }) {
    // Mettre à jour localStorage silencieusement si reçu d'un autre onglet
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch(_) {}
    this._emit(key, value);
  }

  _emit(key, value) {
    (this._listeners[key] || []).forEach(cb => { try { cb(value, key); } catch(_) {} });
    (this._listeners['*']  || []).forEach(cb => { try { cb(value, key); } catch(_) {} });
  }
}

/* ============================================================
   PATCH DE RÉTROCOMPATIBILITÉ
   Toutes les classes existantes (AdminApp, ManarSportApp, AuthManager…)
   continuent de fonctionner, mais leurs lectures/écritures
   localStorage passent maintenant par les nouvelles clés via
   l'intercepteur ci-dessous.
   ============================================================ */
(function patchLocalStorage() {
  const _getItem = Storage.prototype.getItem;
  const _setItem = Storage.prototype.setItem;
  const _removeItem = Storage.prototype.removeItem;

  Storage.prototype.getItem = function(key) {
    // Rediriger l'ancienne clé vers la nouvelle
    const mapped = LEGACY_MAP[key];
    if (mapped) {
      const val = _getItem.call(this, mapped);
      if (val !== null) return val;
    }
    return _getItem.call(this, key);
  };

  Storage.prototype.setItem = function(key, value) {
    const mapped = LEGACY_MAP[key];
    if (mapped) {
      _setItem.call(this, mapped, value);
      _setItem.call(this, key, value);
      // Propager via DataStore
      window.DS && window.DS._broadcast && window.DS._broadcast(mapped, JSON.parse(value));
    } else {
      _setItem.call(this, key, value);
    }
  };

  Storage.prototype.removeItem = function(key) {
    const mapped = LEGACY_MAP[key];
    if (mapped) _removeItem.call(this, mapped);
    _removeItem.call(this, key);
  };
})();

/* ============================================================
   HELPERS GLOBAUX (utilisables directement dans les pages)
   ============================================================ */

/**
 * Retourne l'utilisateur connecté (depuis DS ou ancienne session).
 */
function getCurrentUser() {
  return window.DS.getSession()
    || (() => { try { return JSON.parse(localStorage.getItem('currentSession')); } catch(_){return null;} })();
}

/**
 * Redirige vers l'espace correspondant au rôle.
 */
function redirectToUserSpace(role) {
  const base = window.location.pathname.includes('/admin/') ? '..'
              : window.location.pathname.includes('/pages/')  ? '..'
              : '';
  const routes = {
    admin:   `${base}/admin/dashboard.html`,
    coach:   `${base}/pages/espace-coach.html`,
    athlete: `${base}/pages/espace-athlete.html`,
    parent:  `${base}/pages/espace-parent.html`,
  };
  window.location.href = routes[role] || `${base}/index.html`;
}

/**
 * Affiche un toast léger (sans dépendance).
 */
function showToast(msg, type = 'info') {
  const colors = {
    success: { bg:'#d4edda', color:'#155724', border:'#c3e6cb' },
    error:   { bg:'#f8d7da', color:'#721c24', border:'#f5c6cb' },
    warning: { bg:'#fff3cd', color:'#856404', border:'#ffeeba' },
    info:    { bg:'#d1ecf1', color:'#0c5460', border:'#bee5eb' },
  };
  const c = colors[type] || colors.info;
  let ctr = document.getElementById('_ms_toast_ctr');
  if (!ctr) {
    ctr = document.createElement('div');
    ctr.id = '_ms_toast_ctr';
    ctr.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;max-width:380px;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(ctr);
  }
  const t = document.createElement('div');
  t.style.cssText = `padding:13px 18px;border-radius:10px;font-size:14px;font-family:sans-serif;`
    + `background:${c.bg};color:${c.color};border:1px solid ${c.border};`
    + `box-shadow:0 4px 16px rgba(0,0,0,.12);display:flex;align-items:center;gap:10px;`
    + `animation:_ms_slidein .28s ease;`;
  t.innerHTML = `<span style="flex:1">${msg}</span>`
    + `<button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:18px;line-height:1;">&times;</button>`;
  if (!document.getElementById('_ms_toast_anim')) {
    const s = document.createElement('style');
    s.id = '_ms_toast_anim';
    s.textContent = '@keyframes _ms_slidein{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}';
    document.head.appendChild(s);
  }
  ctr.appendChild(t);
  setTimeout(() => t.remove && t.remove(), 4500);
}

/* ============================================================
   EXPOSITION GLOBALE
   ============================================================ */
window.DS              = new DataStore();
window.getCurrentUser  = getCurrentUser;
window.redirectToUserSpace = redirectToUserSpace;
window.showToast       = showToast;

/* Alias pour les classes existantes qui appelaient window.app.notifications.show() */
window.DS.notify = showToast;

console.log('[Manar Sport] sync.js chargé — DS prêt.', window.DS.stats());