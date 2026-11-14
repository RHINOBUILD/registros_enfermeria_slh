/**
 * Registros de Enfermería · Grupo Saint Luke's Hospitals
 * CONFIGURACIÓN: áreas, campos, checklists y umbrales de alerta.
 * Creado por RHINOBUILD
 *
 * IMPORTANTE: la etiqueta de cada campo (segundo valor) es también el nombre
 * de la columna en la hoja. Si cambias una etiqueta, renombra igual la columna
 * en la hoja de esa área; si agregas un campo, ejecuta instalar() otra vez
 * para que se cree su columna (se agrega al final, no se pierde nada).
 */
var CONFIG = {
  INSTITUCION: "Grupo Saint Luke's Hospitals",
  NOMBRE_HOJA: 'Registros de Enfermería · SLH',
  // Un enfermero/a puede corregir sus propios registros durante estas horas.
  // Jefatura y Admin pueden corregir cualquier registro de sus áreas.
  HORAS_CORRECCION_PROPIA: 12,
  // Máximo de registros que regresa una consulta.
  LIMITE_RESULTADOS: 500,
  ROLES: ['Enfermería', 'Jefatura', 'Admin']
};

var TURNOS = ['Matutino', 'Vespertino', 'Nocturno'];
var NIV = ['Ninguno', 'Bajo', 'Medio', 'Alto'];

// num_(clave, etiqueta, mínimo, máximo, alertaSiMenorQue, alertaSiMayorQue, paso)
function num_(k, l, min, max, lo, hi, step) { return { k: k, l: l, t: 'number', min: min, max: max, lo: lo, hi: hi, step: step || 'any' }; }
// sel_(clave, etiqueta, opciones, opcionesQueGeneranAlerta)
function sel_(k, l, o, bad) { return { k: k, l: l, t: 'select', o: o, bad: bad || [] }; }
function txt_f(k, l) { return { k: k, l: l, t: 'text' }; }
function ta_f(k, l) { return { k: k, l: l, t: 'ta' }; }      // tensión arterial 120/80
function tm_f(k, l) { return { k: k, l: l, t: 'time' }; }
function area_f(k, l) { return { k: k, l: l, t: 'textarea' }; }

function dur_(i, f) {
  if (!i || !f) return '';
  var a = String(i).split(':'), b = String(f).split(':');
  var m = (+b[0] * 60 + +b[1]) - (+a[0] * 60 + +a[1]);
  if (isNaN(m)) return '';
  if (m < 0) m += 1440;
  return Math.floor(m / 60) + ' h ' + ('0' + (m % 60)).slice(-2) + ' min';
}
function vacio_(x) { return x === '' || x === null || x === undefined; }

var ORDEN_AREAS = ['uci', 'ucin', 'quir', 'hemo', 'hd', 'urg', 'ceye'];

var AREAS = {
  uci: {
    n: 'UCI',
    f: [num_('fc', 'FC (lpm)', 20, 250, 50, 120, 1), ta_f('ta', 'TA (mmHg)'), num_('spo2', 'SpO₂ (%)', 0, 100, 90, null, 1),
      num_('temp', 'Temp (°C)', 30, 45, 35.5, 38.2), num_('gcs', 'Glasgow', 3, 15, 9, null, 1),
      sel_('vent', 'Ventilación', ['Ninguna', 'Puntas nasales', 'VMNI', 'VMI']), num_('bal', 'Balance de líquidos (ml)', -20000, 20000),
      num_('braden', 'Braden', 6, 23, 13, null, 1), sel_('caidas', 'Riesgo de caídas', NIV, ['Alto']),
      num_('rass', 'Sedación (RASS)', -5, 4, null, null, 1), num_('glu', 'Glucosa capilar (mg/dL)', 10, 1000, 70, 180, 1),
      num_('dolor', 'Dolor (0-10)', 0, 10, null, 6, 1)],
    c: ['Cabecera elevada 30°', 'Higiene de manos', 'Cuidados de catéteres y sondas', 'Prevención de úlceras (cambios de posición)', 'Alarmas de monitor verificadas', 'Medicamentos de alto riesgo doble verificación']
  },
  ucin: {
    n: 'UCIN',
    f: [num_('peso', 'Peso (g)', 300, 6000, null, null, 1), num_('eg', 'Edad gestacional (sem)', 22, 44), num_('fc', 'FC (lpm)', 60, 250, 100, 180, 1),
      num_('fr', 'FR (rpm)', 10, 120, 30, 60, 1), num_('spo2', 'SpO₂ (%)', 0, 100, 90, null, 1), num_('tinc', 'Temp incubadora (°C)', 20, 40),
      num_('tax', 'Temp axilar (°C)', 33, 42, 36.5, 37.5), sel_('alim', 'Alimentación', ['Ayuno', 'Sonda', 'Succión', 'Mixta']),
      sel_('foto', 'Fototerapia', ['No', 'Sí']), num_('diur', 'Diuresis (ml/kg/h)', 0, 20, 1, null), num_('glu', 'Glucemia capilar (mg/dL)', 10, 500, 45, 150, 1)],
    c: ['Identificación del recién nacido', 'Higiene de manos', 'Incubadora y alarmas revisadas', 'Cálculo de dosis por peso verificado', 'Cuidado de piel y cordón', 'Registro de lactancia o fórmula']
  },
  quir: {
    n: 'Quirófano',
    f: [txt_f('cx', 'Cirugía'), txt_f('cir', 'Cirujano'), sel_('anes', 'Anestesia', ['General', 'Regional', 'Local', 'Sedación']),
      tm_f('ini', 'Hora inicio'), tm_f('fin', 'Hora fin'), sel_('gasas', 'Conteo de gasas', ['Correcto', 'Incorrecto'], ['Incorrecto']),
      sel_('inst', 'Conteo de instrumental', ['Correcto', 'Incorrecto'], ['Incorrecto']), num_('sang', 'Sangrado (ml)', 0, 20000, null, 1000, 1),
      sel_('muestras', 'Muestras patológicas', ['No', 'Sí'])],
    calcL: ['Duración'],
    calc: function (v) { var d = dur_(v.ini, v.fin); return d ? [['Duración', d]] : []; },
    c: ['Identidad y consentimiento verificados', 'Sitio quirúrgico marcado', 'Profilaxis antibiótica en tiempo', 'Pausa quirúrgica (lista OMS)', 'Conteo final de material', 'Posición y puntos de presión protegidos']
  },
  hemo: {
    n: 'Hemodinamia',
    f: [txt_f('proc', 'Procedimiento'), sel_('acceso', 'Acceso', ['Radial', 'Femoral', 'Otro']), num_('contraste', 'Contraste (ml)', 0, 2000, null, null, 1),
      num_('hep', 'Heparina (UI)', 0, 50000, null, null, 1), num_('tca', 'TCA (s)', 0, 1000, null, null, 1), area_f('mat', 'Material usado / lote'),
      num_('rad', 'Dosis de radiación (mGy)', 0, 30000, null, 4999), sel_('hemos', 'Hemostasia', ['Compresión', 'Dispositivo', 'Otra']),
      sel_('pulso', 'Pulso distal post', ['Presente', 'Disminuido', 'Ausente'], ['Disminuido', 'Ausente'])],
    c: ['Alergia a contraste verificada', 'Función renal revisada', 'Consentimiento firmado', 'Pulsos distales valorados post-procedimiento', 'Sitio de punción sin sangrado', 'Material y lotes registrados']
  },
  hd: {
    n: 'Hemodiálisis',
    f: [num_('ppre', 'Peso pre (kg)', 1, 300), num_('ppost', 'Peso post (kg)', 1, 300), num_('ufp', 'UF programada (ml)', 0, 10000, null, null, 1),
      num_('qb', 'Flujo sanguíneo (ml/min)', 0, 600, null, null, 1), sel_('acceso', 'Acceso', ['Fístula', 'Catéter', 'Injerto']),
      ta_f('tapre', 'TA pre'), ta_f('tapost', 'TA post'), num_('dur', 'Duración (h)', 0, 12), area_f('inc', 'Incidentes')],
    calcL: ['UF real (ml)', 'Dif. vs programada (ml)'],
    calc: function (v) {
      if (vacio_(v.ppre) || vacio_(v.ppost)) return [];
      var uf = Math.round((Number(v.ppre) - Number(v.ppost)) * 1000), o = [['UF real (ml)', uf]];
      if (!vacio_(v.ufp)) o.push(['Dif. vs programada (ml)', uf - Number(v.ufp)]);
      return o;
    },
    c: ['Máquina desinfectada y probada', 'Prueba de agua / dializado', 'Acceso valorado', 'Heparina indicada', 'Filtro y líneas verificados', 'Hemostasia del acceso al finalizar']
  },
  urg: {
    n: 'Urgencias',
    f: [sel_('triage', 'Triage', ['Rojo', 'Naranja', 'Amarillo', 'Verde', 'Azul']), txt_f('motivo', 'Motivo de consulta'), tm_f('hing', 'Hora de ingreso'),
      num_('fc', 'FC (lpm)', 20, 250, 50, 120, 1), ta_f('ta', 'TA (mmHg)'), num_('spo2', 'SpO₂ (%)', 0, 100, 90, null, 1),
      num_('temp', 'Temp (°C)', 30, 45, 35.5, 38.2), num_('dolor', 'Dolor (0-10)', 0, 10, null, 6, 1),
      sel_('destino', 'Destino', ['En observación', 'Alta', 'Hospitalización', 'Quirófano', 'UCI', 'Traslado'])],
    c: ['Triage aplicado en tiempo', 'Brazalete de identificación', 'Riesgo de caídas valorado', 'Alergias preguntadas', 'Medicamentos registrados con hora']
  },
  ceye: {
    n: 'Esterilización (CEYE)',
    f: [txt_f('equipo', 'Equipo (autoclave)'), txt_f('ciclo', 'Ciclo No.'), num_('temp', 'Temperatura (°C)', 0, 200), num_('tiempo', 'Tiempo (min)', 0, 240, null, null, 1),
      txt_f('lote', 'Lote'), num_('paq', 'Paquetes procesados', 0, 10000, null, null, 1),
      sel_('iq', 'Indicador químico', ['Conforme', 'No conforme'], ['No conforme']), sel_('ib', 'Indicador biológico', ['Negativo', 'Positivo', 'Pendiente'], ['Positivo']),
      txt_f('solic', 'Área solicitante')],
    x: function (v) {
      if (v.ib === 'Positivo' || v.iq === 'No conforme') return ['NO LIBERAR CARGA'];
      if (v.ib === 'Pendiente') return ['Liberación condicionada: biológico pendiente'];
      return [];
    },
    c: ['Descontaminación y lavado previo', 'Empaque íntegro y rotulado', 'Carga correcta del equipo', 'Indicadores revisados antes de liberar', 'Almacenamiento y caducidad', 'Bitácora firmada']
  }
};

/** Alertas clínicas de un registro (también se guardan en la columna "Alertas"). */
function alertas_(a, v) {
  var out = [];
  a.f.forEach(function (f) {
    var x = v[f.k];
    if (vacio_(x)) return;
    if (f.t === 'number') {
      var n = Number(x);
      if (isNaN(n)) return;
      if (f.lo != null && n < f.lo) out.push(f.l + ' ' + x + ' ↓');
      else if (f.hi != null && n > f.hi) out.push(f.l + ' ' + x + ' ↑');
    } else if (f.t === 'ta') {
      var m = /^(\d{2,3})\/(\d{2,3})$/.exec(String(x));
      if (m) {
        var s = +m[1], d = +m[2];
        if (s < 90) out.push(f.l + ' ' + x + ' ↓');
        else if (s >= 180 || d >= 110) out.push(f.l + ' ' + x + ' ↑');
      }
    } else if (f.t === 'select' && f.bad.indexOf(String(x)) >= 0) {
      out.push(f.l + ': ' + x);
    }
  });
  return a.x ? a.x(v).concat(out) : out;
}
