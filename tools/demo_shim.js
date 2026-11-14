/*
 * MODO DEMOSTRACIÓN (GitHub Pages)
 * Simula Google Sheets / Apps Script en el navegador (localStorage) para que la
 * demo use exactamente el mismo código que la versión institucional.
 * Generado por tools/build_demo.py — no editar index.html a mano.
 */
(function () {
  var TZ = 'America/Mazatlan', KDB = 'enf_demo_db', KU = 'enf_demo_user';
  var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
  function enc(v) { return JSON.stringify(v, function (k, x) { var o = this[k]; return o instanceof Date ? { __d: o.toISOString() } : x; }); }
  function dec(s) { return JSON.parse(s, function (k, x) { return x && x.__d ? new Date(x.__d) : x; }); }
  var DB; try { DB = ls.get(KDB) ? dec(ls.get(KDB)) : null; } catch (e) { DB = null; }
  if (!DB) DB = { props: {}, books: {} };
  function persist() { ls.set(KDB, enc(DB)); }

  function parseIn(v) {
    if (typeof v !== 'string') return v;
    if (v.charAt(0) === "'") return v.slice(1);
    if (v === '') return '';
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return v;
  }
  function Sheet(b, n) { this.b = b; this.name = n; }
  Sheet.prototype = {
    get d() { return DB.books[this.b].sheets[this.name]; },
    getName: function () { return this.name; },
    getLastRow: function () { return this.d.length; },
    getLastColumn: function () { return this.d.reduce(function (m, r) { var n = r.length; while (n && (r[n - 1] === '' || r[n - 1] == null)) n--; return Math.max(m, n); }, 0); },
    getRange: function (a, b, c, d) {
      if (typeof a === 'string') { var m = /^([A-Z])(\d+)/.exec(a); return new Range(this, +m[2], m[1].charCodeAt(0) - 64, 1, 1); }
      return new Range(this, a, b, c || 1, d || 1);
    },
    getDataRange: function () { return new Range(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); },
    appendRow: function (arr) { this.d.push(arr.map(parseIn)); persist(); return this; },
    setFrozenRows: function () { return this; }
  };
  function Range(s, r, c, nr, nc) { this.s = s; this.r = r; this.c = c; this.nr = nr; this.nc = nc; }
  Range.prototype = {
    getValues: function () {
      var out = [];
      for (var i = 0; i < this.nr; i++) { var row = this.s.d[this.r - 1 + i] || [], o = []; for (var j = 0; j < this.nc; j++) { var x = row[this.c - 1 + j]; o.push(x == null ? '' : x); } out.push(o); }
      return out;
    },
    setValues: function (v) {
      for (var i = 0; i < this.nr; i++) { var ri = this.r - 1 + i; while (this.s.d.length <= ri) this.s.d.push([]); for (var j = 0; j < this.nc; j++) this.s.d[ri][this.c - 1 + j] = parseIn(v[i][j]); }
      persist(); return this;
    },
    setValue: function (x) { return this.setValues([[x]]); },
    setFontWeight: function () { return this; }, setBackground: function () { return this; }, setFontColor: function () { return this; },
    setDataValidation: function () { return this; },
    sort: function (o) { var col = o.column - this.c, rows = this.s.d.splice(this.r - 1, this.nr); rows.sort(function (a, b) { return (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (o.ascending ? 1 : -1); }); Array.prototype.splice.apply(this.s.d, [this.r - 1, 0].concat(rows)); persist(); return this; }
  };
  function Book(id) { this.id = id; }
  Book.prototype = {
    getId: function () { return this.id; },
    getUrl: function () { return '#'; },
    getSheetByName: function (n) { return DB.books[this.id].sheets[n] ? new Sheet(this.id, n) : null; },
    insertSheet: function (n) { DB.books[this.id].sheets[n] = []; DB.books[this.id].order.push(n); persist(); return new Sheet(this.id, n); },
    deleteSheet: function (s) { delete DB.books[this.id].sheets[s.name]; DB.books[this.id].order = DB.books[this.id].order.filter(function (x) { return x !== s.name; }); persist(); },
    getSheets: function () { var id = this.id; return DB.books[id].order.map(function (n) { return new Sheet(id, n); }); },
    setSpreadsheetTimeZone: function () { }
  };
  window.SpreadsheetApp = {
    create: function (name) { var id = 'demo'; DB.books[id] = { name: name, sheets: { 'Hoja 1': [] }, order: ['Hoja 1'] }; persist(); return new Book(id); },
    openById: function (id) { if (!DB.books[id]) throw new Error('No existe'); return new Book(id); },
    getActiveSpreadsheet: function () { return null; },
    flush: function () { },
    newDataValidation: function () { var b = { requireValueInList: function () { return b; }, build: function () { return {}; } }; return b; }
  };
  var DEMO_USERS = [
    ['enfermeria@demo', 'Enfermera Demo', 'Enfermería'],
    ['jefatura@demo', 'Jefa de Piso Demo', 'Jefatura'],
    ['admin@demo', 'Administrador Demo', 'Admin']
  ];
  window.Session = {
    getActiveUser: function () { return { getEmail: function () { return ls.get(KU) || 'enfermeria@demo'; } }; },
    getEffectiveUser: function () { return { getEmail: function () { return 'admin@demo'; } }; },
    getScriptTimeZone: function () { return TZ; }
  };
  window.PropertiesService = { getScriptProperties: function () { return { getProperty: function (k) { return DB.props[k] || null; }, setProperty: function (k, v) { DB.props[k] = v; persist(); } }; } };
  window.LockService = { getScriptLock: function () { return { tryLock: function () { return true; }, waitLock: function () { }, releaseLock: function () { } }; } };
  window.Utilities = {
    getUuid: function () { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(16) + Math.random().toString(16).slice(2)); },
    formatDate: function (d, tz, f) {
      var p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      if (p.hour === '24') p.hour = '00';
      return f.replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day).replace('HH', p.hour).replace('mm', p.minute);
    }
  };
  window.Logger = { log: function () { } };
  window.HtmlService = { XFrameOptionsMode: {} };

  window.google = { script: { get run() {
    var ok = null, ko = null, p = new Proxy({}, { get: function (t, k) {
      if (k === 'withSuccessHandler') return function (h) { ok = h; return p; };
      if (k === 'withFailureHandler') return function (h) { ko = h; return p; };
      return function () {
        var args = JSON.parse(JSON.stringify([].slice.call(arguments)));
        setTimeout(function () {
          try { var r = window[k].apply(null, args); ok && ok(r === undefined ? null : JSON.parse(JSON.stringify(r))); }
          catch (e) { ko && ko(e); }
        }, 60);
      };
    } });
    return p;
  } } };

  /* Arranque de la demo: instala, da de alta a los 3 usuarios y migra datos del prototipo anterior (v2) */
  window.__demoBoot = function () {
    if (!DB.props.SPREADSHEET_ID) {
      instalar();
      var u = ss_().getSheetByName('Usuarios');
      u.getRange(2, 1, 1, 5).setValues([[DEMO_USERS[2][0], DEMO_USERS[2][1], 'Admin', '*', 'Sí']]);
      u.appendRow([DEMO_USERS[1][0], DEMO_USERS[1][1], 'Jefatura', '*', 'Sí']);
      u.appendRow([DEMO_USERS[0][0], DEMO_USERS[0][1], 'Enfermería', '*', 'Sí']);
    }
    var old = ls.get('enf_v2');
    if (old && !ls.get('enf_v2_en_demo')) {
      var prev = ls.get(KU);
      try {
        ls.set(KU, 'admin@demo');
        var r = api_importar(JSON.stringify({ datos: JSON.parse(old) }));
        window.__demoMigrados = r.importados;
      } catch (e) { }
      if (prev) ls.set(KU, prev); else try { localStorage.removeItem(KU); } catch (e) { }
      ls.set('enf_v2_en_demo', '1');
    }
  };
  window.__demoUser = function (email) { ls.set(KU, email); location.reload(); };
  window.__demoReset = function () {
    if (!confirm('Se borrarán todos los datos de la demostración en este navegador. ¿Continuar?')) return;
    try { localStorage.removeItem(KDB); localStorage.setItem('enf_v2_en_demo', '1'); } catch (e) { }
    location.reload();
  };
  window.__demoCurrent = function () { return ls.get(KU) || 'enfermeria@demo'; };
  window.__DEMO_USERS = DEMO_USERS;
})();
