# 🚀 Guía de Deploy - Geoportal Frontend en Fly.io

## ⚡ Deploy Rápido (Recomendado)

El Dockerfile ahora hace el build automáticamente, así que solo necesitas:

```bash
cd frontend
fly deploy
```

¡Eso es todo! Fly.io hará el build y deploy en un solo paso.

---

## 🔍 Explicación del Nuevo Dockerfile

El `Dockerfile` ahora usa **multi-stage build**:

### Stage 1: Build (Node.js)
```dockerfile
FROM node:18-alpine AS builder
# Instala dependencias
# Hace npm run build
# CRACO copia automáticamente los assets de Cesium a build/cesium/
```

### Stage 2: Servir (Nginx)
```dockerfile
FROM nginx:alpine
# Copia solo el build final (ligero)
# Usa nginx.conf optimizado para Cesium
```

**Ventajas:**
- ✅ Imagen final pequeña (~25MB vs ~500MB)
- ✅ No necesitas hacer build local
- ✅ Los assets de Cesium se copian automáticamente
- ✅ Deploy consistente y reproducible

---

## 📋 Verificación Post-Deploy

### 1. Verificar que la app carga
```
https://geoportal-frontend-1.fly.dev
```

### 2. Abrir la consola del navegador (F12)
Deberías ver **NO** ver estos errores:
- ❌ `Cannot use 'import.meta' outside a module`
- ❌ `Failed to load resource: the server responded with a status of 404` para archivos de `/cesium/`

### 3. Verificar que Cesium carga correctamente
En la consola del navegador:
```javascript
console.log(window.CESIUM_BASE_URL); // Debe mostrar '/cesium/'
console.log(Cesium.VERSION); // Debe mostrar '1.139.1' o similar
```

### 4. Verificar archivos de Cesium en Network tab
- Abre DevTools > Network
- Filtra por "cesium"
- Debes ver archivos como:
  - `/cesium/Workers/*`
  - `/cesium/Widgets/*`
  - `/cesium/Cesium.js`
  - Todos con status **200 OK**

---

## 🛠️ Deploy con Build Local (Opcional)

Si prefieres hacer el build localmente antes del deploy:

```bash
cd frontend

# 1. Instalar dependencias (si hay cambios)
npm install

# 2. Hacer build local
npm run build

# 3. Verificar que se creó la carpeta cesium/
ls build/cesium/
# Debes ver: Workers/, Widgets/, Assets/, Cesium.js, etc.

# 4. Deploy (usará el build local)
fly deploy --local-only
```

---

## 🐛 Troubleshooting

### Problema: Los archivos de `/cesium/` dan 404

**Causa:** El build no copió los assets de Cesium

**Solución:**
```bash
# Verificar que CRACO está configurado correctamente
cat craco.config.js

# Verificar que copy-webpack-plugin está instalado
npm list copy-webpack-plugin

# Hacer build limpio
rm -rf node_modules build
npm install
npm run build

# Verificar que existe la carpeta
ls build/cesium/
```

### Problema: Error `import.meta` persiste

**Causa:** El DefinePlugin no está funcionando

**Solución:**
```bash
# Limpiar cache
npm cache clean --force
rm -rf node_modules package-lock.json build
npm install

# Verificar craco.config.js tiene el DefinePlugin
grep -A5 "DefinePlugin" craco.config.js
```

### Problema: Deploy falla por memoria

**Causa:** El build necesita más de 512MB

**Solución:** El `fly.toml` ya está configurado con 16GB, así que no debería haber problema.

Si necesitas más memoria temporalmente:
```bash
fly scale memory 16384
```

---

## 📊 Monitoreo del Deploy

### Ver logs en tiempo real
```bash
fly logs
```

### Ver estado de las máquinas
```bash
fly status
```

### Ver detalles de la app
```bash
fly apps info geoportal-frontend-1
```

---

## 🔄 Rollback (si algo sale mal)

```bash
# Ver historial de deploys
fly releases

# Hacer rollback al deploy anterior
fly deployments rollback
```

---

## 📝 Resumen de Cambios Realizados

| Archivo | Cambio | Propósito |
|---------|--------|-----------|
| `craco.config.js` | Agregado CopyWebpackPlugin + DefinePlugin | Copiar assets de Cesium y polyfill import.meta |
| `nginx.conf` | Configuración mejorada para `/cesium/` | Servir Web Workers y WASM correctamente |
| `Dockerfile` | Multi-stage build | Build automático en el deploy |
| `.dockerignore` | Agregado `build/` | No enviar build local innecesario |
| `src/index.js` | Polyfill globalThis | Compatibilidad con navegadores antiguos |

---

## ✅ Checklist Pre-Deploy

- [ ] `npm install` ejecutado exitosamente
- [ ] `npm run build` funciona localmente (opcional pero recomendado)
- [ ] `build/cesium/` existe y tiene archivos (si hiciste build local)
- [ ] No hay errores en consola al correr `npm start`
- [ ] `fly.toml` tiene la configuración correcta
- [ ] Tienes acceso a la app de Fly.io

---

**Última actualización**: 10 de abril de 2026
**Versión actual**: v3.0.0
**Cesium**: 1.139.1
**React**: 18.3.1
