# archivo/

Material que **no forma parte de la aplicación** pero se conserva por valor histórico.
Nada de aquí se importa desde `frontend/`, `backend/` ni `scripts/` (verificado con `git grep`
el 2026-08-22). Si algo de esta carpeta vuelve a hacer falta, sácalo de aquí antes de usarlo:
lo que vive en `archivo/` se asume muerto.

| Carpeta | Contenido | Notas |
|---|---|---|
| `Slorse/` | Mockups HTML, planes 3D/BIM en `.txt` y `.md`, scripts Python de análisis de DOCX, SQL de `tipo_ensayo` | Los tres `analyze_docx*.py` apuntan a una ruta que ya no existe (`Resilio Sync\geoportal (1)\`). Los mockups son bocetos previos de dashboards de suelos y del visor 3D. |
| `CHESCO/` | Documentos personales: diseño de página web de geología (PDF), informe de corte San Martín (DOCX), `prueba.html` | |
| `scratch/` | Inspecciones puntuales de `tipo_ensayo` (2 JS + 1 SQL) | Trabajo de un solo uso. |
| `brain/` | Un `task.md` dentro de una carpeta con nombre UUID | Residuo de una herramienta, no del proyecto. |
| `notas/` | `estaciones.txt` (progresivas de la vía), `trazo.txt` (fragmento JS de la ruta CU-104) | `trazo.txt` es un recorte del mismo trazo que se depuró en la fase 1 de la limpieza del frontend. |

Ver `docs/rutas-y-modulos.md` para el estado del frontend.
