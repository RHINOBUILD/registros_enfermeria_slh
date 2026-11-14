# Registros de Enfermería · Grupo Saint Luke's Hospitals

Bitácoras clínicas y checklists de seguridad por área: **UCI, UCIN, Quirófano, Hemodinamia, Hemodiálisis, Urgencias y Esterilización (CEYE)**.

| | Liga | Para qué |
|---|---|---|
| **Plataforma oficial** | [Entrar](https://script.google.com/macros/s/AKfycbxmRvy99heCvbfrCxpTiSgQF218wLszBbR2nBKpNYQxlOvHklefaNLbeicbyR0Zh24/exec) | Uso real. Cada quien entra con su cuenta de Google; datos en Google Sheets con roles y bitácora. |
| **Demostración** | [rhinobuild.github.io/registros_enfermeria_slh](https://rhinobuild.github.io/registros_enfermeria_slh/) | Capacitación y pruebas. Misma interfaz y lógica, datos solo en el navegador; permite cambiar entre Enfermería, Jefatura y Admin. |

## Estructura

| Carpeta / archivo | Contenido |
|---|---|
| [`apps-script/`](apps-script/) | **Código fuente oficial** (Apps Script): `Config.gs`, `Code.gs`, `Index.html`, `appsscript.json` y la [guía de despliegue](apps-script/README.md). |
| `index.html` | Demo de GitHub Pages. **Se genera** con `python3 tools/build_demo.py`; no se edita a mano. |
| `tools/` | `build_demo.py` (genera la demo) y `demo_shim.js` (simula Google Sheets en el navegador). |

### Flujo para cambios
1. Edita los archivos de `apps-script/`.
2. Ejecuta `python3 tools/build_demo.py` para regenerar la demo y súbelo a GitHub.
3. Copia los archivos cambiados al proyecto de Apps Script → **Implementar → Administrar implementaciones → ✏️ → Nueva versión**. La URL oficial no cambia.

## Funciones
- Captura por área con campos clínicos específicos y checklist de seguridad.
- **Alertas en vivo** mientras se captura: signos fuera de rango, conteo de gasas/instrumental incorrecto, pulso distal ausente, dosis de radiación alta y, en CEYE, **NO LIBERAR CARGA** si el indicador biológico sale positivo.
- Validación también en el servidor (rangos, formatos, opciones).
- **Roles**: Enfermería (captura y corrige lo suyo 12 h), Jefatura (corrige y anula con motivo), Admin (todo + importación).
- **Nada se borra**: correcciones con versión y bitácora antes → después; anulaciones con motivo, autor y fecha.
- Indicadores del día por área, filtros por periodo/turno/búsqueda, exportación CSV e impresión con encabezado institucional y firmas.

## Umbrales de alerta

| Parámetro | Alerta si |
|---|---|
| FC adulto | < 50 o > 120 lpm |
| FC neonato | < 100 o > 180 lpm |
| FR neonato | < 30 o > 60 rpm |
| SpO₂ | < 90 % |
| Temperatura adulto | < 35.5 o ≥ 38.3 °C |
| Temp axilar neonato | < 36.5 o > 37.5 °C |
| TA | sistólica < 90, sistólica ≥ 180 o diastólica ≥ 110 |
| Glasgow | ≤ 8 |
| Braden | ≤ 12 |
| Glucosa capilar adulto | < 70 o > 180 mg/dL |
| Glucemia neonato | < 45 o > 150 mg/dL |
| Diuresis neonato | < 1 ml/kg/h |
| Dolor | ≥ 7 |
| Sangrado quirúrgico | > 1000 ml |
| Dosis de radiación | ≥ 5000 mGy |

Se ajustan en `apps-script/Config.gs`. Conviene validarlos con la Jefatura de Enfermería.

## Consideraciones
- No sustituye el expediente clínico electrónico certificado (NOM-004-SSA3 / NOM-024-SSA3); es bitácora operativa y checklist de seguridad.
- La hoja de cálculo contiene datos de salud: no se comparte con el personal; la app trabaja por ellos.

---
Creado por RHINOBUILD
