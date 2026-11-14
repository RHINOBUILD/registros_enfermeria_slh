# Registros de Enfermería · versión institucional (Apps Script + Google Sheets)

Cada enfermero/a entra con **su cuenta institucional de Google**. Los registros se guardan en una **hoja de cálculo** del administrador y cada alta, corrección y anulación queda en una **bitácora**.

| Archivo | Qué es |
|---|---|
| `Config.gs` | Áreas, campos, checklists y umbrales de alerta. Aquí se ajusta todo lo clínico. |
| `Code.gs` | Backend: usuarios y permisos, validación, guardado, bitácora, importación. |
| `Index.html` | Interfaz (la misma de la v2, conectada al backend). |
| `appsscript.json` | Manifiesto (zona horaria America/Mazatlan, V8). |

## Despliegue (≈10 minutos)

> Hazlo con una cuenta **del mismo dominio de Google Workspace que usará el personal**. La app identifica a cada persona por su correo, y Google solo lo entrega cuando el usuario y el dueño del script son del mismo dominio.

1. Entra a [script.google.com](https://script.google.com) → **Nuevo proyecto**. Nómbralo *Registros de Enfermería SLH*.
2. Pega el contenido de los archivos:
   - `Código.gs` → renómbralo a `Code` y pega `Code.gs`.
   - **+ → Secuencia de comandos** → `Config` → pega `Config.gs`.
   - **+ → HTML** → `Index` → pega `Index.html`.
   - **Configuración del proyecto** (engrane) → activa *Mostrar el archivo de manifiesto "appsscript.json"* → pega `appsscript.json`.
3. En el editor elige la función **`instalar`** → **Ejecutar** → autoriza los permisos.
   En el registro de ejecución aparece la liga de la hoja creada. Tú quedas como **Admin** con acceso a todas las áreas.
4. Abre la hoja → pestaña **Usuarios** y da de alta al personal:

   | Correo | Nombre | Rol | Áreas | Activo |
   |---|---|---|---|---|
   | ana.perez@… | Ana Pérez | Enfermería | uci, quir | Sí |
   | laura.ruiz@… | Laura Ruiz | Jefatura | * | Sí |

   Claves de área: `uci, ucin, quir, hemo, hd, urg, ceye` (o `*` para todas). Para dar de baja: **Activo = No** (no borres la fila).
5. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario de *tu dominio***
   → **Implementar** y copia la URL `/exec`. Esa es la liga para el personal (se puede incrustar en Google Sites).
6. (Opcional) Si usaron el prototipo en algún navegador: ahí presiona **Descargar respaldo (.json)** y en la app institucional, como Admin, **Importar respaldo del prototipo**. No duplica registros si lo importas dos veces.

### Actualizar después de un cambio
**Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar.** La URL no cambia.
Si agregaste campos o áreas en `Config.gs`, ejecuta `instalar()` otra vez: agrega las columnas nuevas al final sin tocar los datos.

## Roles

| Rol | Captura | Corrige | Anula | Importa / ve la hoja |
|---|---|---|---|---|
| Enfermería | Sus áreas | Solo lo suyo, durante 12 h | — | — |
| Jefatura | Sus áreas | Cualquier registro de sus áreas | ✓ con motivo | — |
| Admin | Todas sus áreas | ✓ | ✓ | ✓ |

Las 12 h se cambian en `CONFIG.HORAS_CORRECCION_PROPIA`.

## Qué protege
- **Validación en el servidor**: rangos, formatos y opciones se revisan otra vez en Apps Script aunque alguien manipule el navegador.
- **Nada se borra**: las correcciones suben la versión y dejan en la **Bitácora** el antes → después de cada campo; las anulaciones guardan quién, cuándo y por qué.
- **Sin fórmulas inyectadas**: el texto se escribe como texto (una observación que empiece con `=` no se ejecuta, y "12/08" no se vuelve fecha). El CSV también va protegido.
- **Concurrencia**: escrituras con bloqueo, para que dos capturas simultáneas no se pisen.

## Consideraciones
- La hoja contiene datos de salud: **no la compartas** con el personal; la app trabaja por ellos con tu permiso. Compártela solo con quien deba auditar.
- Esto todavía no es un expediente clínico electrónico certificado (NOM-024-SSA3); úsalo como bitácora operativa y checklist de seguridad. Antes de capturar nombres completos de pacientes, valídalo con Calidad y Jurídico (aviso de privacidad, datos sensibles).
- Apps Script tiene cuotas diarias amplias para Workspace; para varios miles de registros por área conviene archivar por año (copiar la hoja y vaciar la pestaña).

---
Creado por RHINOBUILD
