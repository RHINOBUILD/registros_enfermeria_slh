# Registros de Enfermería · Grupo Saint Luke's

Bitácoras y checklists de seguridad por área: **UCI, UCIN, Quirófano, Hemodinamia, Hemodiálisis, Urgencias y Esterilización (CEYE)**.

Este repositorio tiene dos versiones:

| Versión | Dónde | Para qué |
|---|---|---|
| **Institucional (v3)** | carpeta [`apps-script/`](apps-script/) | Uso real: cada quien entra con su cuenta de Google, datos en Google Sheets, roles y bitácora. Ver la [guía de despliegue](apps-script/README.md). |
| **Prototipo (v2)** | `index.html` · [rhinobuild.github.io/registros_enfermeria_slh](https://rhinobuild.github.io/registros_enfermeria_slh/) | Demostración y capacitación. Los datos se quedan en el navegador. |

---

## Prototipo (v2)

- Un solo archivo: `index.html` (sin dependencias, funciona en celular y computadora).
- Los datos se guardan **solo en el navegador** del equipo donde se capturan (localStorage).
- **No capturar datos reales de pacientes.** Usa iniciales o un folio ficticio. No sustituye el expediente clínico electrónico (NOM-004-SSA3 / NOM-024-SSA3).

## Qué hace (v2.0)

| Función | Detalle |
|---|---|
| Captura por área | Campos específicos de cada servicio + checklist de seguridad |
| Validación de rangos | No acepta valores imposibles (SpO₂ > 100, Glasgow > 15, RASS fuera de −5 a +4, TA sin formato `120/80`, etc.) |
| Alertas clínicas | Marca en rojo signos fuera de rango, conteo de gasas/instrumental incorrecto, pulso distal disminuido, dosis de radiación ≥ 5000 mGy, y en CEYE **NO LIBERAR CARGA** si el biológico es positivo o el químico no conforme |
| Cálculos | Duración de cirugía (incluso si pasa de medianoche) y UF real en hemodiálisis |
| Corregir registro | Guarda quién corrigió, cuándo y qué campos cambió |
| Anular registro | No se borra: queda marcado con motivo, quién y cuándo |
| Filtros | Hoy / 7 días / 30 días / todo, por turno y búsqueda por paciente, cama o enfermero/a |
| Exportar CSV | Respeta los filtros; incluye alertas, estado, correcciones; protegido contra fórmulas maliciosas en Excel |
| Imprimir | Encabezado institucional y líneas de firma (Elaboró / Revisó) |
| Respaldo | Descarga e importación `.json` de todas las áreas (para cambiar de equipo o no perder datos) |
| Comodidades | Recuerda al enfermero/a, propone el turno según la hora, conserva lo capturado al cambiar de pestaña |

Si en el navegador había datos de la versión anterior (v1), se migran automáticamente al abrir la v2.

## Rangos de alerta usados

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

Los umbrales están en `index.html`, en la definición de cada área (`num(clave, etiqueta, mín, máx, alertaBajo, alertaAlto)`). Ajústalos con la Jefatura de Enfermería antes de usar la herramienta.

## Publicar con GitHub Pages
1. Repositorio → **Settings → Pages**.
2. **Source:** Deploy from a branch → `main` → carpeta `/ (root)` → Save.
3. Sitio en `https://rhinobuild.github.io/registros_enfermeria_slh/`.

## Limitaciones (prototipo)
- Sin inicio de sesión: el nombre del enfermero/a es texto libre.
- Cada navegador tiene sus propios datos; en equipos compartidos cualquiera que lo abra los ve.
- Para uso real, usa la versión institucional de [`apps-script/`](apps-script/). Los respaldos `.json` del prototipo se pueden importar ahí.

---
Creado por RHINOBUILD
