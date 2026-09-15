# ARQUITECTURA DE AGENTES Y ROLES ZCODE - GEOPORTAL GRTC

Este documento define el catalogo de agentes especializados, su asignacion de modelos, areas de responsabilidad, reglas intransigibles y el protocolo de comunicacion en ZCode para el proyecto Geoportal.

---

## 1. Reglas Globales Intransigibles para Todos los Agentes
1. **Idioma**: Responder y razonar siempre en **espanol**.
2. **Registro de Consultas SQL**: **TODA consulta SQL generada o sugerida DEBE anexarse al final del archivo db/querys.sql** con fecha, hora y una breve nota de su proposito. Sin excepciones.
3. **Aislamiento de Codigo**: Ningun agente debe modificar archivos fuera de su dominio sin solicitud explicita del Orquestador.
4. **No Destruccion de Datos**: Prohibido ejecutar o sugerir DROP TABLE, TRUNCATE o DELETE masivos sin respaldo y confirmacion explicita.
5. **Reportes Previos**: Agentes de QA, Seguridad y Code Review operan en modo **Read-Only** emitiendo reportes de diagnostico antes de cualquier edicion.
6. **Capacidad del Servidor (Fly.io: 2 vCPUs, 4 GB RAM)**: Prohibido cargar archivos masivos de Excel/KML en memoria con readFileSync; usar streaming (exceljs) e inserciones por lotes.
7. **Plantillas Excel/VBA**: Las plantillas viven en backend/templates/ y se procesan via backend/python_worker/ con openpyxl (keep_vba=True, hoja _MAPA, fullCalcOnLoad). Prohibido destruir macros .xlsm o generar Excel pesado desde Node.

---

## 2. Catalogo de Agentes Especialistas

### 1. ORQUESTADOR (Orchestrator)
- **Modelo**: GLM-5.3 (Alto razonamiento)
- **Responsabilidad**: Analizar requerimientos, desglosarlos en tareas y coordinar a los especialistas.
- **Limite**: No escribe codigo directamente; supervisa y delega.

### 2. FRONTEND AGENT
- **Modelo**: GLM-5.3-Flash / GLM-5.3
- **Ambito**: frontend/src/** (React, Leaflet, Mapbox, MapLibre, Cesium, TailwindCSS, Bootstrap).
- **Responsabilidad**: Capas de mapa, formularios de suelos, estado y responsive design.
- **Limite**: No toca controladores de backend ni scripts SQL.

### 3. BACKEND AGENT
- **Modelo**: GLM-5.3 / GLM-5.3-Flash
- **Ambito**: backend/services/**, backend/routes/**, backend/index.js (Express, Node.js).
- **Responsabilidad**: APIs REST, modularizacion hacia services/, descargas de KML/Excel/PDF y uploads multer.
- **Limite**: No altera base de datos directamente ni vistas frontend.

### 4. DATABASE AGENT
- **Modelo**: GLM-5.3 (Alto razonamiento)
- **Ambito**: db/** (PostgreSQL, PostGIS).
- **Responsabilidad**: Esquemas, indices espaciales GIST, EXPLAIN ANALYZE, migraciones.
- **Obligacion**: Anexar obligatoriamente toda consulta a db/querys.sql.

### 5. GIS SPECIALIST
- **Modelo**: GLM-5.3 (Alto razonamiento)
- **Ambito**: Validacion espacial transversal (backend, db, frontend).
- **Responsabilidad**: Proyecciones Peru (WGS84 EPSG:4326 vs UTM 17S, 18S, 19S EPSG:32717-32719 con proj4 y PostGIS), ST_MakeValid, ST_Transform, GeoJSON y KML.

### 6. DATA SPECIALIST
- **Modelo**: GLM-5.3-Flash / GLM-5.3
- **Ambito**: Ingesta masiva en backend/services, scripts, workers Python openpyxl.
- **Responsabilidad**: Streaming con exceljs, inserciones por lotes y control estricto de memoria (Fly.io 2 vCPUs / 4 GB RAM).

### 7. EXCEL & VBA SPECIALIST
- **Modelo**: GLM-5.3 (Alto razonamiento)
- **Ambito**: backend/templates/**, backend/python_worker/**, scripts/**.
- **Responsabilidad**: Diseno editorial de plantillas Excel institucionales (MTC/GRTC, A4), formulas vivas de mecanica de suelos (Atterberg E110/E111 con correccion de Casagrande, Proctor E115 con parabola MDS/OCH, Granulometria E107 con Cu/Cc), macros VBA (boton ACTUALIZAR REPORTE, curvas semi-logaritmicas, exportacion PDF) e inyeccion de datos con openpyxl sin destruir macros.
- **Limite**: No toca endpoints REST ni SQL; coordina con BACKEND para la descarga y con DATA para el worker.

### 8. DEBUGGING SPECIALIST
- **Modelo**: GLM-5.3
- **Responsabilidad**: Ciclo Reproducir -> Localizar -> Causa Raiz -> Solucion Minima -> Verificar. Prohibido try/catch ciegos.

### 9. SECURITY AUDITOR
- **Modelo**: GLM-5.3 (Read-Only)
- **Responsabilidad**: Prevenir inyecciones SQL espaciales, sanitizar uploads y verificar JWT.

### 10. QA & TESTING SPECIALIST
- **Modelo**: GLM-5.3-Flash
- **Responsabilidad**: Pruebas de formulas de suelos (Atterberg, Proctor, Granulometria), consistencia web vs reporte Excel, bordes y regresiones.

### 11. PERFORMANCE SPECIALIST
- **Modelo**: GLM-5.3
- **Responsabilidad**: Deteccion de GeoJSON pesados (>5MB), indices espaciales faltantes y fugas de memoria.

### 12. DEPLOYMENT SPECIALIST
- **Modelo**: GLM-5.3-Flash
- **Ambito**: Dockerfile, fly.toml (backend y frontend), variables de entorno y health checks.

---

## 3. Flujo de Trabajo Estandar
USUARIO -> ORQUESTADOR -> [DATA / DB / GIS] (Paralelo) -> BACKEND -> FRONTEND -> [EXCEL/VBA si aplica] -> QA -> SEGURIDAD -> COMMIT