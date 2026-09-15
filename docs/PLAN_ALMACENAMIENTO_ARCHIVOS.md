# Plan — Migración de Almacenamiento de Archivos (imágenes + mallas 3D)

> **Estado:** Planificación, pendiente de visto bueno. **No se ha modificado código.**
> **Fecha:** 2026-09-15 · **Contexto:** Vercel Blob (cuota/credenciales agotadas → 530) y NAS WebDAV institucional (`*.dafe.it.com`, también caído → 530). El backend ya NO tiene ningún almacenamiento de archivos operativo.

---

## 0. Respuesta directa: ¿MEGA es buena opción?

**No, para el flujo activo de la aplicación.** Razones concretas:

| # | Problema | Detalle |
|---|---|---|
| 1 | **API no oficial** | MEGA no ofrece API pública para cuentas gratuitas. Requiere `megajs` (librería inversa no soportada). Cualquier cambio de MEGA rompe el backend sin aviso. |
| 2 | **Cuota de TRANSFERENCIA (no solo de almacenamiento)** | MEGA gratis limita los GB descargados por cuenta/IP de forma dinámica y agresiva. Un OBJ grande descargado en cada sesión del visor 3D agota la cuota en pocas visitas → **reproduce exactamente la caída de hoy**. |
| 3 | **Cifrado E2E = sin URLs directas** | Los archivos no se sirven por URL pública: el backend debe descargar, descifrar y re-transmitir cada archivo (RAM de Fly 4 GB en juego). El navegador nunca podrá bajar directo. |
| 4 | **Riesgo de cuenta** | Usar una cuenta gratuita como backend de una app contradice los términos de MEGA; suspensiones reportadas con pérdida de acceso. |

**Único uso aceptable de MEGA:** copia de respaldo fría (archivo), nunca como storage que la app sirve.

## 1. Qué encontré en el código (mapa real del almacenamiento)

El backend ya tiene **tres vías de storage medio cableadas** (esto es a la vez el problema y la oportunidad):

1. `backend/services/nasStorageService.js` — subida/borrado a NAS institucional vía **WebDAV** (completo y funcional en su día). ⚠️ **Bug de seguridad: credenciales por defecto hardcodeadas** (`admin123`, líneas 5-6) — corregir sí o sí.
2. `backend/services/blobStorageService.js` — fachada que **imita la firma del NAS** pero sobre Vercel Blob (quien la hizo dejó el nombre `uploadFileToNAS` para compatibilidad).
3. **≥12 llamadas directas** `put()`/`del()` de `@vercel/blob` esparcidas por `backend/index.js` (líneas 2167, 2552, 2638, 5760, 6727, 7121, 6363…) y `proyectosService.js:873` — fuera de toda fachada.

Y un dato clave a favor: el endpoint `/api/modelos-3d/:id/obj` **ya soporta `DB_EMBEDDED_OBJ`** (malla guardada en `metadata.obj_content` en la propia base de datos PostgreSQL, que sigue viva).

### Verificación de campo (hoy)
- `https://files.dafe.it.com/geoportal/` → **530** (NAS caído / dominio vencido).
- Vercel Blob → **530** (cuota/credenciales agotadas, confirmado por el usuario).
- PostgreSQL → **operativo** (la app funciona: login, progresivas, estratos).

## 2. Matriz de decisión del nuevo storage

| Opción | Capacidad gratis | Egress (descargas) | API | ¿Tarjeta? | Veredicto |
|---|---|---|---|---|---|
| **PostgreSQL (BYTEA / `DB_EMBEDDED_OBJ`)** | La del disco de la BD | Gratis (el que ya pagas) | Ya implementada | No | ✅ **Desbloqueo inmediato**; ideal imágenes y OBJ medianos |
| **Cloudflare R2** | 10 GB | **Ilimitado y gratis** | S3 oficial + URLs firmadas | Sí (no cobra dentro del límite) | ✅ **Mejor opción definitiva** para archivos grandes |
| **Oracle Cloud Always Free** | **20 GB** | 10 TB/mes | S3-compatible | Sí (solo identificación) | ✅ Alternativa seria si R2 no convence (matchea los 20 GB) |
| **NAS institucional** (revivir dominio/DNS) | La del NAS | La del ancho de banda de la oficina | WebDAV (ya escrita) | No | ✅ Si la institución puede revivir `dafe.it.com`, es gratis y el código ya existe |
| **Fly Volume** (disco en el servidor) | 3 GB gratis, luego ~$0.15/GB/mes | Gratis interno | fs directo (la más simple) | — | 🟡 Buena, pero 20 GB ≈ $3/mes |
| **MEGA** | 20 GB | **Limitado y dinámico** | No oficial (megajs) | No | ❌ Solo respaldo frío |

**Recomendación en dos tiempos:**
- **Ya (hoy, gratis, sin cuentas nuevas):** todo a **PostgreSQL** — malla del modelo 120 por `DB_EMBEDDED_OBJ` e imágenes por BYTEA. Restaura el 3D de inmediato.
- **Definitivo (cuanto antes):** **Cloudflare R2** (o el NAS si revive) para archivos grandes, porque las descargas repetidas del OBJ no deben pasar por la BD. La fachada unificada del paso F2 hace que cambiar de driver sea configuración, no código.

## 3. Fases (aprox. 5–6 días-ingeniero)

### F0 — Inventario y decisión final (0.5 d)
- Query de inventario: cuántas URLs `blob.vercel-storage.com` y `files.dafe.it.com` hay en la BD, en qué tablas/campos y (si es posible) tamaños. *Registrar SQL en `db/querys.sql`.*
- Verificar disco libre de PostgreSQL y límite del proveedor.
- Preguntar a la institución si `dafe.it.com` puede revivir (si sí, NAS gana por defecto).
- ⚠️ **Aviso crítico:** los archivos ya subidos a Vercel Blob **pueden ser irrecuperables** (si la cuota impide hasta leerlos). El plan asume que se re-suben desde los originales que el usuario conserve localmente. Confirmar en esta fase.

### F1 — Desbloqueo inmediato del 3D (0.5–1 d)
- Re-procesar/re-subir el modelo 120 con `url_archivo = 'DB_EMBEDDED_OBJ'` (la ruta de servicio ya existe en `index.js:857-865`).
- Garantizar streaming por chunks desde la BD (regla 6 de AGENTS: nada de cargar el OBJ completo en RAM con 4 GB de máquina).
- Criterio de salida: malla del diorama cargando de nuevo, backend estable.

### F2 — Fachada única de almacenamiento (1.5 d)
- Crear `backend/services/storageService.js` con drivers intercambiables por variable de entorno (`STORAGE_DRIVER=postgres|r2|nas`): `putStream/getStream/delete/urlFor`.
- Migrar los **≥12 puntos de `put()/del()` directo** y los dos servicios existentes a la fachada.
- Seguridad: eliminar credenciales hardcodeadas (`admin123`) — solo variables de entorno, fail-fast si faltan.
- Criterio de salida: cero referencias a `@vercel/blob` fuera del driver, ESLint/arranque limpio.

### F3 — Driver definitivo + migración de existentes (1–1.5 d)
- Si R2/Oracle: crear cuenta, bucket, claves en `.env` de Fly (`fly secrets set`).
- Script de migración: re-subir desde los originales locales → actualizar URLs en BD (por tablas detectadas en F0). SQL registrado en `db/querys.sql`.
- Criterio de salida: imágenes de señales/canteras/fuentes de agua/geología visibles de nuevo.

### F4 — Descargas de archivos grandes (0.5 d)
- OBJ e imágenes grandes: proxy en streaming del backend (ya casi está) o **URL firmadas** si R2/Oracle (el navegador baja directo del storage, cero carga en Fly).
- Criterio de salida: descargar el OBJ de un proyecto completo sin elevar la RAM del backend.

### F5 — QA, rollback y monitoreo (0.5 d)
- Pruebas: subir/borrar/ver cada tipo de archivo; visor 3D con malla; eliminación en cascada.
- Alerta de cuota del storage elegido (dash R2/Oracle o query de tamaño en PG).
- Documentar rollback (el driver anterior queda a un cambio de variable).

## 4. Riesgos

| Riesgo | Mitigación |
|---|---|
| Archivos de Vercel irrecuperables | F0 lo confirma; re-subida desde originales locales |
| OBJ demasiado grande para BYTEA cómodo | F1 mide tamaño real; si > ~100 MB, obligatorio driver R2/Oracle/NAS para mallas |
| PostgreSQL llenándose con imágenes | Monitoreo F5 + mover imágenes grandes al driver definitivo en F3 |
| Cuenta R2/Oracle requiere tarjeta | Fallback: NAS si revive, o Fly Volume (~$3/mes) |
