# ARQUITECTURA DEL SISTEMA GEOPORTAL GRTC

## 1. Backend
- Node.js + Express con pool en conexion.js.
- Servicios modulares en backend/services/.
- Workers Python en backend/python_worker/ (openpyxl para reportes .xlsm de suelos).
- Despliegue en Fly.io con 1024MB RAM.

## 2. Frontend
- React, Leaflet, Mapbox GL, MapLibre, Cesium.
- Modulos principales: Mecanica de Suelos, Inventario Vial, Gestion de Tramos y Progresivas.

## 3. Base de Datos
- PostgreSQL + PostGIS.
- Registro obligatorio de consultas en db/querys.sql.
