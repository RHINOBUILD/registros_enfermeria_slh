/**
 * Registros de Enfermería · Grupo Saint Luke's Hospitals
 * BACKEND (Google Apps Script + Google Sheets)
 * Creado por RHINOBUILD
 *
 * Primera vez: ejecuta instalar() desde el editor (crea la hoja de cálculo
 * y te da de alta como Admin). Luego implementa como aplicación web:
 *   Ejecutar como: Yo · Quién tiene acceso: cualquier usuario de tu dominio.
 */

var COLS_BASE = ['ID', 'Fecha', 'Turno', 'Paciente', 'Cama', 'Capturó', 'Correo capturó'];
var COLS_FIN = ['Checklist completo', 'Alertas', 'Observaciones', 'Estado', 'Versión', 'Última corrección', 'Corregido por', 'Anulado por', 'Fecha anulación', 'Motivo anulación'];
var HOJA_USUARIOS = 'Usuarios';
var HOJA_BITACORA = 'Bitácora';
var ENC_USUARIOS = ['Correo', 'Nombre', 'Rol', 'Áreas', 'Activo'];
var ENC_BITACORA = ['Fecha', 'Usuario', 'Acción', 'Área', 'ID', 'Detalle'];

/* ======================= Web app ======================= */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle("Registros de Enfermería · Grupo Saint Luke's")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // permite incrustarla en Google Sites
}

/* ======================= Instalación ======================= */

/** Ejecútala desde el editor la primera vez (y cada vez que agregues campos o áreas). */
function instalar() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID'), ss;
  if (id) ss = SpreadsheetApp.openById(id);
  else {
    ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create(CONFIG.NOMBRE_HOJA);
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }
  ss.setSpreadsheetTimeZone(Session.getScriptTimeZone());

  var u = hoja_(ss, HOJA_USUARIOS, ENC_USUARIOS);
  if (u.getLastRow() < 2) u.appendRow([Session.getEffectiveUser().getEmail(), 'Administrador', 'Admin', '*', 'Sí']);
  u.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.ROLES, true).build());
  u.getRange('E2:E').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Sí', 'No'], true).build());
  u.getRange('G1').setValue('Áreas: * = todas, o claves separadas por coma: ' + ORDEN_AREAS.join(', '));
  u.getRange('G2').setValue('Roles: Enfermería (captura y corrige lo suyo ' + CONFIG.HORAS_CORRECCION_PROPIA + ' h) · Jefatura (corrige y anula en sus áreas) · Admin (todo + importar)');

  hoja_(ss, HOJA_BITACORA, ENC_BITACORA);
  ORDEN_AREAS.forEach(function (k) { hojaArea_(ss, k); });

  ['Hoja 1', 'Sheet1'].forEach(function (n) {
    var h = ss.getSheetByName(n);
    if (h && h.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(h);
  });
  Logger.log('Listo. Hoja de cálculo: ' + ss.getUrl());
  return ss.getUrl();
}

function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('La aplicación no está instalada. El administrador debe ejecutar instalar() en el editor de Apps Script.');
  return SpreadsheetApp.openById(id);
}

/** Crea la hoja si no existe y agrega al final las columnas que falten (nunca borra ni reordena). */
function hoja_(ss, nombre, enc) {
  var h = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  var act = encabezados_(h);
  var falt = enc.filter(function (x) { return act.indexOf(x) < 0; });
  if (falt.length) h.getRange(1, act.length + 1, 1, falt.length).setValues([falt]);
  var n = act.length + falt.length;
  h.setFrozenRows(1);
  h.getRange(1, 1, 1, n).setFontWeight('bold').setBackground('#0b2545').setFontColor('#ffffff');
  return h;
}
function hojaArea_(ss, k) { return hoja_(ss, AREAS[k].n, encArea_(k)); }
function encArea_(k) {
  var a = AREAS[k];
  return COLS_BASE.concat(a.f.map(function (f) { return f.l; }), a.calcL || [], a.c, COLS_FIN);
}
function encabezados_(h) {
  var lc = h.getLastColumn();
  if (!lc) return [];
  var v = h.getRange(1, 1, 1, lc).getValues()[0].map(function (x) { return String(x).trim(); });
  while (v.length && v[v.length - 1] === '') v.pop();
  return v;
}
function indice_(enc) { var o = {}; enc.forEach(function (h, i) { if (h && !(h in o)) o[h] = i; }); return o; }

/* ======================= Usuarios y permisos ======================= */

function usuario_() {
  var email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) throw new Error('No se pudo identificar tu cuenta. Entra con tu cuenta institucional de Google (la misma del dominio del hospital).');
  var v = ss_().getSheetByName(HOJA_USUARIOS).getDataRange().getValues();
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][0]).trim().toLowerCase() !== email) continue;
    if (String(v[i][4]).trim() !== 'Sí') throw new Error('Tu acceso está desactivado. Contacta a la Jefatura de Enfermería.');
    var rol = String(v[i][2]).trim();
    if (CONFIG.ROLES.indexOf(rol) < 0) rol = 'Enfermería';
    var ar = String(v[i][3]).trim(), areas;
    if (ar === '*') areas = ORDEN_AREAS.slice();
    else {
      var lista = ar.toLowerCase().split(/[,;\s]+/);
      areas = ORDEN_AREAS.filter(function (k) { return lista.indexOf(k) >= 0; });
    }
    if (!areas.length) throw new Error('Tu cuenta no tiene áreas asignadas. Contacta a la Jefatura de Enfermería.');
    return { email: email, nombre: String(v[i][1]).trim() || email, rol: rol, areas: areas };
  }
  throw new Error('Tu cuenta (' + email + ') no está dada de alta. Pide a la Jefatura de Enfermería o a Capital Humano que te registre.');
}
function permArea_(u, k) {
  if (!AREAS[k]) throw new Error('Área desconocida.');
  if (u.areas.indexOf(k) < 0) throw new Error('No tienes acceso al área ' + AREAS[k].n + '.');
}
function esJefe_(u) { return u.rol === 'Jefatura' || u.rol === 'Admin'; }
function puedeCorregir_(u, r) {
  if (r.estado === 'Anulado') return false;
  if (esJefe_(u)) return true;
  var edad = Date.now() - new Date(r.fecha).getTime();
  return r.correo === u.email && edad < CONFIG.HORAS_CORRECCION_PROPIA * 3600000;
}

/* ======================= Datos ======================= */

function txtLim_(x, n) { return String(x == null ? '' : x).replace(/\s+$/, '').replace(/^\s+/, '').slice(0, n); }

/** Valida en el servidor (no se confía en el navegador). */
function limpiar_(a, rec) {
  rec = rec || {};
  var p = txtLim_(rec.p, 40);
  if (!p) throw new Error('Falta el paciente (iniciales o folio).');
  var t = String(rec.t || '');
  if (TURNOS.indexOf(t) < 0) throw new Error('Turno inválido.');
  var v = {};
  a.f.forEach(function (f) {
    var x = rec.v ? rec.v[f.k] : '';
    x = x == null ? '' : String(x).trim();
    if (x === '') { v[f.k] = ''; return; }
    if (f.t === 'number') {
      var n = Number(x);
      if (isNaN(n) || n < f.min || n > f.max) throw new Error(f.l + ': valor fuera de rango (' + f.min + ' a ' + f.max + ').');
      if (f.step === 1 && n % 1 !== 0) throw new Error(f.l + ': debe ser un número entero.');
      v[f.k] = n;
    } else if (f.t === 'ta') {
      if (!/^\d{2,3}\/\d{2,3}$/.test(x)) throw new Error(f.l + ': usa el formato 120/80.');
      v[f.k] = x;
    } else if (f.t === 'select') {
      if (f.o.indexOf(x) < 0) throw new Error(f.l + ': opción no válida.');
      v[f.k] = x;
    } else if (f.t === 'time') {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(x)) throw new Error(f.l + ': hora no válida.');
      v[f.k] = x;
    } else v[f.k] = txtLim_(x, f.t === 'textarea' ? 2000 : 200);
  });
  var k = {};
  a.c.forEach(function (c) { k[c] = !!(rec.k && rec.k[c]); });
  return { p: p, c: txtLim_(rec.c, 20), t: t, o: txtLim_(rec.o, 2000), v: v, k: k };
}

/** Registro → objeto {columna: valor} con lo que calcula el sistema. */
function aCols_(a, r) {
  var o = { 'Turno': r.t, 'Paciente': r.p, 'Cama': r.c, 'Observaciones': r.o };
  a.f.forEach(function (f) { o[f.l] = r.v[f.k]; });
  (a.calcL || []).forEach(function (l) { o[l] = ''; });
  if (a.calc) a.calc(r.v).forEach(function (c) { o[c[0]] = c[1]; });
  var ok = 0;
  a.c.forEach(function (c) { o[c] = r.k[c] ? 'Sí' : 'No'; if (r.k[c]) ok++; });
  o['Checklist completo'] = ok === a.c.length ? 'Sí' : 'No';
  o['Alertas'] = alertas_(a, r.v).join(' | ');
  return o;
}

/**
 * Fila para la hoja. Los textos se escriben con apóstrofo inicial para que
 * Sheets no los convierta en fórmulas, fechas u horas. Columnas que no son
 * del sistema (agregadas a mano) conservan su valor.
 */
function fila_(enc, obj, prev) {
  return enc.map(function (h, i) {
    if (!(h in obj)) return prev ? prev[i] : '';
    var x = obj[h];
    if (x === undefined || x === null || x === '') return '';
    if (x instanceof Date || typeof x === 'number') return x;
    return "'" + String(x);
  });
}

function iso_(d) { return d instanceof Date && !isNaN(d) ? d.toISOString() : ''; }
function hhmm_(d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), 'HH:mm'); }

function deFila_(a, ix, row) {
  function g(h) { var i = ix[h]; return i == null ? '' : row[i]; }
  function s(h) { var x = g(h); return x instanceof Date ? iso_(x) : String(x == null ? '' : x); }
  var v = {};
  a.f.forEach(function (f) {
    var x = g(f.l);
    v[f.k] = x instanceof Date ? (f.t === 'time' ? hhmm_(x) : iso_(x)) : (x === '' || x == null ? '' : String(x));
  });
  var k = {};
  a.c.forEach(function (c) { k[c] = g(c) === 'Sí'; });
  return {
    id: s('ID'), fecha: iso_(g('Fecha')), t: s('Turno'), p: s('Paciente'), c: s('Cama'),
    capturo: s('Capturó'), correo: s('Correo capturó').toLowerCase(), v: v, k: k, o: s('Observaciones'),
    estado: s('Estado') || 'Vigente', version: Number(g('Versión')) || 1,
    ultCorr: s('Última corrección'), corrPor: s('Corregido por'),
    anulPor: s('Anulado por'), anulFecha: s('Fecha anulación'), anulMotivo: s('Motivo anulación')
  };
}
function decorar_(a, r, u) {
  r.alertas = alertas_(a, r.v);
  r.calc = a.calc ? a.calc(r.v) : [];
  r.puedeCorregir = puedeCorregir_(u, r);
  r.puedeAnular = r.estado !== 'Anulado' && esJefe_(u);
  return r;
}
function buscarFila_(h, ix, id) {
  var n = h.getLastRow() - 1;
  if (n < 1) return -1;
  var ids = h.getRange(2, ix['ID'] + 1, n, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return -1;
}
function bitacora_(ss, u, accion, area, id, detalle) {
  ss.getSheetByName(HOJA_BITACORA).appendRow([new Date(), u.email, accion, area ? AREAS[area].n : '', id || '', "'" + (detalle || '')]);
}
function conLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) throw new Error('El sistema está ocupado guardando otros registros. Intenta de nuevo en unos segundos.');
  try { return fn(); } finally { lock.releaseLock(); }
}
function nuevoId_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 12); }

/* ======================= API (google.script.run) ======================= */

function api_inicio() {
  var u = usuario_();
  return {
    usuario: u,
    areas: u.areas.map(function (k) {
      var a = AREAS[k];
      return { k: k, n: a.n, c: a.c, f: a.f.map(function (f) { return { k: f.k, l: f.l, t: f.t, o: f.o || null, min: f.min, max: f.max, step: f.step || null }; }) };
    }),
    resumen: api_resumen_(u),
    institucion: CONFIG.INSTITUCION,
    horasCorreccion: CONFIG.HORAS_CORRECCION_PROPIA,
    hoja: u.rol === 'Admin' ? ss_().getUrl() : ''
  };
}

/** Registros de hoy (vigentes) y cuántos con alerta, por área. */
function api_resumen() { return api_resumen_(usuario_()); }
function api_resumen_(u) {
  var ss = ss_(), tz = Session.getScriptTimeZone(), hoy = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd'), out = {};
  u.areas.forEach(function (k) {
    var h = ss.getSheetByName(AREAS[k].n), res = { hoy: 0, alertas: 0 };
    out[k] = res;
    if (!h || h.getLastRow() < 2) return;
    var d = h.getDataRange().getValues(), ix = indice_(d[0].map(String));
    for (var i = d.length - 1; i >= 1; i--) {
      var f = d[i][ix['Fecha']];
      if (!(f instanceof Date)) continue;
      var dia = Utilities.formatDate(f, tz, 'yyyy-MM-dd');
      if (dia < hoy) break; // filas en orden cronológico
      if (dia !== hoy || d[i][ix['Estado']] === 'Anulado') continue;
      res.hoy++;
      if (String(d[i][ix['Alertas']] || '')) res.alertas++;
    }
  });
  return out;
}

/** fil = {periodo:'hoy'|'7'|'30'|'todo', turno:'', q:''} */
function api_listar(area, fil) {
  var u = usuario_();
  permArea_(u, area);
  fil = fil || {};
  var a = AREAS[area], h = ss_().getSheetByName(a.n);
  if (!h || h.getLastRow() < 2) return { registros: [], limitado: false };
  var d = h.getDataRange().getValues(), ix = indice_(d[0].map(String));
  var tz = Session.getScriptTimeZone(), ahora = new Date(), hoy = Utilities.formatDate(ahora, tz, 'yyyy-MM-dd');
  var desde = fil.periodo && fil.periodo !== 'todo' && fil.periodo !== 'hoy' ? new Date(ahora.getTime() - Number(fil.periodo) * 864e5) : null;
  var q = String(fil.q || '').toLowerCase().trim(), out = [], limitado = false;
  for (var i = d.length - 1; i >= 1; i--) {
    var row = d[i], f = row[ix['Fecha']];
    if (!(f instanceof Date)) continue;
    if (fil.periodo === 'hoy' && Utilities.formatDate(f, tz, 'yyyy-MM-dd') !== hoy) continue;
    if (desde && f < desde) continue;
    if (fil.turno && String(row[ix['Turno']]) !== fil.turno) continue;
    if (q && (row[ix['Paciente']] + ' ' + row[ix['Cama']] + ' ' + row[ix['Capturó']]).toLowerCase().indexOf(q) < 0) continue;
    if (out.length >= CONFIG.LIMITE_RESULTADOS) { limitado = true; break; }
    out.push(decorar_(a, deFila_(a, ix, row), u));
  }
  out.sort(function (x, y) { return y.fecha.localeCompare(x.fecha); });
  return { registros: out, limitado: limitado };
}

/** Alta (rec.id vacío) o corrección (rec.id existente). */
function api_guardar(area, rec) {
  var u = usuario_();
  permArea_(u, area);
  var a = AREAS[area], r = limpiar_(a, rec);
  return conLock_(function () {
    var ss = ss_(), h = hojaArea_(ss, area), enc = encabezados_(h), ix = indice_(enc), filaN;
    if (!rec.id) {
      var o = aCols_(a, r), id = nuevoId_();
      o['ID'] = id; o['Fecha'] = new Date(); o['Capturó'] = u.nombre; o['Correo capturó'] = u.email;
      o['Estado'] = 'Vigente'; o['Versión'] = 1;
      h.appendRow(fila_(enc, o));
      filaN = h.getLastRow();
      bitacora_(ss, u, 'Alta', area, id, r.p);
    } else {
      filaN = buscarFila_(h, ix, rec.id);
      if (filaN < 0) throw new Error('No se encontró el registro.');
      var prev = h.getRange(filaN, 1, 1, enc.length).getValues()[0], ant = deFila_(a, ix, prev);
      if (!puedeCorregir_(u, ant)) {
        throw new Error(ant.estado === 'Anulado' ? 'El registro está anulado.' :
          'Solo puedes corregir tus propios registros durante ' + CONFIG.HORAS_CORRECCION_PROPIA + ' h. Pide la corrección a la Jefatura.');
      }
      var cambios = [];
      function cmp(et, x, y) { if (String(x == null ? '' : x) !== String(y == null ? '' : y)) cambios.push(et + ': «' + (x === '' ? '—' : x) + '» → «' + (y === '' ? '—' : y) + '»'); }
      cmp('Paciente', ant.p, r.p); cmp('Cama', ant.c, r.c); cmp('Turno', ant.t, r.t); cmp('Observaciones', ant.o, r.o);
      a.f.forEach(function (f) { cmp(f.l, ant.v[f.k], r.v[f.k]); });
      a.c.forEach(function (c) { cmp(c, ant.k[c] ? 'Sí' : 'No', r.k[c] ? 'Sí' : 'No'); });
      if (!cambios.length) return { sinCambios: true, registro: decorar_(a, ant, u) };
      var o2 = aCols_(a, r);
      o2['Versión'] = ant.version + 1; o2['Última corrección'] = new Date(); o2['Corregido por'] = u.nombre;
      h.getRange(filaN, 1, 1, enc.length).setValues([fila_(enc, o2, prev)]);
      bitacora_(ss, u, 'Corrección', area, rec.id, cambios.join(' ; '));
    }
    SpreadsheetApp.flush();
    var nueva = h.getRange(filaN, 1, 1, enc.length).getValues()[0];
    return { registro: decorar_(a, deFila_(a, ix, nueva), u) };
  });
}

function api_anular(area, id, motivo) {
  var u = usuario_();
  permArea_(u, area);
  if (!esJefe_(u)) throw new Error('Solo la Jefatura puede anular registros.');
  motivo = txtLim_(motivo, 500);
  if (motivo.length < 5) throw new Error('Escribe el motivo de la anulación.');
  var a = AREAS[area];
  return conLock_(function () {
    var ss = ss_(), h = hojaArea_(ss, area), enc = encabezados_(h), ix = indice_(enc), filaN = buscarFila_(h, ix, id);
    if (filaN < 0) throw new Error('No se encontró el registro.');
    var prev = h.getRange(filaN, 1, 1, enc.length).getValues()[0];
    if (deFila_(a, ix, prev).estado === 'Anulado') throw new Error('El registro ya estaba anulado.');
    h.getRange(filaN, 1, 1, enc.length).setValues([fila_(enc, { 'Estado': 'Anulado', 'Anulado por': u.nombre, 'Fecha anulación': new Date(), 'Motivo anulación': motivo }, prev)]);
    bitacora_(ss, u, 'Anulación', area, id, motivo);
    SpreadsheetApp.flush();
    return { registro: decorar_(a, deFila_(a, ix, h.getRange(filaN, 1, 1, enc.length).getValues()[0]), u) };
  });
}

/** Admin: importa el respaldo .json del prototipo (versión de navegador). No duplica IDs. */
function api_importar(texto) {
  var u = usuario_();
  if (u.rol !== 'Admin') throw new Error('Solo un Admin puede importar respaldos.');
  var j;
  try { j = JSON.parse(texto); } catch (e) { throw new Error('El archivo no es un respaldo válido.'); }
  var datos = j && j.datos;
  if (!datos || typeof datos !== 'object') throw new Error('El archivo no es un respaldo válido.');
  return conLock_(function () {
    var ss = ss_(), res = { importados: 0, omitidos: 0, errores: [] };
    ORDEN_AREAS.forEach(function (k) {
      if (!Array.isArray(datos[k]) || !datos[k].length) return;
      var a = AREAS[k], h = hojaArea_(ss, k), enc = encabezados_(h), ix = indice_(enc);
      var existentes = {};
      if (h.getLastRow() > 1) h.getRange(2, ix['ID'] + 1, h.getLastRow() - 1, 1).getValues().forEach(function (x) { existentes[String(x[0])] = 1; });
      var filas = [];
      datos[k].forEach(function (x, n) {
        try {
          if (!x || !x.id) throw new Error('sin ID');
          if (existentes[x.id]) { res.omitidos++; return; }
          var fecha = x.ts ? new Date(x.ts) : null;
          if (!fecha || isNaN(fecha)) throw new Error('sin fecha válida');
          var r = limpiar_(a, { p: x.p, c: x.c, t: TURNOS.indexOf(x.t) >= 0 ? x.t : 'Matutino', o: x.o, v: x.v || {}, k: x.k || {} });
          var o = aCols_(a, r), mods = Array.isArray(x.mod) ? x.mod : [];
          o['ID'] = String(x.id); o['Fecha'] = fecha; o['Capturó'] = txtLim_(x.e, 80) + ' (importado)'; o['Correo capturó'] = '';
          o['Estado'] = x.anul ? 'Anulado' : 'Vigente'; o['Versión'] = 1 + mods.length;
          if (mods.length) { var m = mods[mods.length - 1]; o['Última corrección'] = new Date(m.ts); o['Corregido por'] = txtLim_(m.por, 80); }
          if (x.anul) { o['Anulado por'] = txtLim_(x.anul.por, 80); o['Fecha anulación'] = new Date(x.anul.ts); o['Motivo anulación'] = txtLim_(x.anul.motivo, 500); }
          filas.push(fila_(enc, o));
          existentes[x.id] = 1;
          res.importados++;
        } catch (e) { res.errores.push(a.n + ' #' + (n + 1) + ': ' + e.message); }
      });
      if (filas.length) {
        filas.sort(function (p, q) { return p[ix['Fecha']] - q[ix['Fecha']]; });
        h.getRange(h.getLastRow() + 1, 1, filas.length, enc.length).setValues(filas);
        SpreadsheetApp.flush();
        // mantiene el orden cronológico (el resumen del día depende de ello)
        h.getRange(2, 1, h.getLastRow() - 1, enc.length).sort({ column: ix['Fecha'] + 1, ascending: true });
      }
    });
    bitacora_(ss, u, 'Importación', '', '', res.importados + ' importados, ' + res.omitidos + ' ya existían, ' + res.errores.length + ' con error');
    res.errores = res.errores.slice(0, 20);
    return res;
  });
}
