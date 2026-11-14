#!/usr/bin/env python3
"""
Genera index.html (demo de GitHub Pages) a partir de la versión institucional:
  apps-script/Index.html + Config.gs + Code.gs + tools/demo_shim.js
Uso:  python3 tools/build_demo.py
Así la demo siempre usa la misma interfaz y la misma lógica que la app real.
"""
import pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
URL_INSTITUCIONAL = 'https://script.google.com/macros/s/AKfycbxmRvy99heCvbfrCxpTiSgQF218wLszBbR2nBKpNYQxlOvHklefaNLbeicbyR0Zh24/exec'

html = (RAIZ / 'apps-script/Index.html').read_text(encoding='utf-8')
gs = (RAIZ / 'apps-script/Config.gs').read_text(encoding='utf-8') + '\n' + (RAIZ / 'apps-script/Code.gs').read_text(encoding='utf-8')
shim = (RAIZ / 'tools/demo_shim.js').read_text(encoding='utf-8')
assert '</script' not in gs and '</script' not in shim

CSS = """
<style>
/* ---- Modo demostración ---- */
body{padding-top:42px}
#demobar{position:fixed;top:0;left:0;right:0;height:42px;z-index:60;display:flex;align-items:center;gap:12px;padding:0 16px;background:#050f20;color:#cdd8ea;font:500 12.5px/1 "Plus Jakarta Sans",system-ui,sans-serif;border-bottom:1px solid rgba(201,162,39,.45)}
#demobar .dm{background:#c9a227;color:#0b2545;font-weight:800;letter-spacing:1px;font-size:10.5px;padding:4px 8px;border-radius:6px;white-space:nowrap}
#demobar .tx{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#demobar .sp{flex:1}
#demobar select{width:auto;padding:5px 26px 5px 9px;font-size:12.5px;border-radius:8px;background-color:#0f2142;color:#fff;border:1px solid #2b416b}
#demobar a,#demobar button{white-space:nowrap;color:#e3c766;text-decoration:none;font-weight:700;background:none;border:0;cursor:pointer;font-size:12.5px;padding:6px 4px}
#demobar a:hover,#demobar button:hover{text-decoration:underline}
#demobar button{color:#8ea3c4;font-weight:600}
.side{top:42px!important;height:calc(100vh - 42px)!important}
.top{top:42px!important}
#toast{top:56px!important}
#sheet{display:none!important}
@media (max-width:999px){#demobar .tx,#demobar .lb,#demobar button{display:none}#demobar{gap:8px;padding:0 10px}}
@media (max-width:420px){#demobar a span{display:none}}
@media print{#demobar{display:none}body{padding-top:0}}
</style>
"""

BAR = """
<div id="demobar" role="region" aria-label="Modo demostración">
 <span class="dm">DEMO</span>
 <span class="tx">Datos de prueba guardados solo en este navegador · no captures pacientes reales</span>
 <span class="sp"></span>
 <label class="lb" for="demou" style="color:#8ea3c4">Ver como</label>
 <select id="demou" onchange="__demoUser(this.value)" aria-label="Ver como"></select>
 <button type="button" onclick="__demoReset()">Reiniciar demo</button>
 <a href="%s" target="_blank" rel="noopener">Versión institucional <span>→</span></a>
</div>
""" % URL_INSTITUCIONAL

BOOT = """
<script>
%s
(0,eval)(%s);
try{__demoBoot()}catch(e){console.error(e)}
(function(){var s=document.getElementById('demou'),c=__demoCurrent();s.innerHTML=__DEMO_USERS.map(function(u){return'<option value="'+u[0]+'"'+(u[0]===c?' selected':'')+'>'+u[2]+'</option>'}).join('');
 if(window.__demoMigrados)setTimeout(function(){var t=document.getElementById('toast');if(t){t.textContent=window.__demoMigrados+' registros del prototipo anterior se pasaron a la demo';t.className='show';setTimeout(function(){t.className=''},5000)}},1500)})();
</script>
"""

import json
boot = BOOT % (shim, json.dumps(gs))

marca_script = '<script>\n(function(){'
assert html.count(marca_script) == 1
assert html.count('</head>') == 1 and html.count('<body>') == 1
html = html.replace('</head>', CSS + '</head>', 1)
html = html.replace('<body>', '<body>' + BAR, 1)
html = html.replace(marca_script, boot + marca_script, 1)
html = html.replace('<base target="_top">', '', 1)
html = html.replace('<title>Registros de Enfermería · Grupo Saint Luke\'s</title>', '<title>Registros de Enfermería · Demo · Grupo Saint Luke\'s</title>', 1)

(RAIZ / 'index.html').write_text('<!-- Generado por tools/build_demo.py a partir de apps-script/. No editar a mano. -->\n' + html, encoding='utf-8')
print('index.html generado:', len(html), 'bytes')
