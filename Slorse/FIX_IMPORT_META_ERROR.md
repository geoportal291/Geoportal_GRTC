# 🔧 Fix: Error `import.meta` en Deploy de Fly.io

## 🐛 Problema
Después de hacer `npm run build` y `fly deploy`, la aplicación no renderizaba nada y mostraba el error:
```
Uncaught SyntaxError: Cannot use 'import.meta' outside a module
```

##  Causa Raíz
**CesiumJS** usa internamente `import.meta.url` para cargar sus Web Workers y assets. El problema era que:

1. Los archivos de Cesium (`Build/Cesium/*`) no se estaban copiando al directorio `build/` durante el proceso de build
2. El `nginx.conf` no tenía configuración para servir estos archivos con los headers CORS y MIME types correctos
3. No había ningún polyfill para `import.meta` en el bundle de Webpack

## ✅ Solución Aplicada

### 1. **craco.config.js** - Agregar CopyWebpackPlugin y DefinePlugin
```javascript
// Copiar assets de Cesium al directorio cesium/
webpackConfig.plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: 'node_modules/cesium/Build/Cesium',
        to: 'cesium',
        globOptions: {
          ignore: ['**/index.js']
        }
      }
    ]
  })
);

// Exponer import.meta para compatibilidad
webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    'import.meta.url': JSON.stringify('window.location.origin')
  })
);
```

### 2. **nginx.conf** - Configuración mejorada para Cesium
- Agregué un bloque `location /cesium/` específico para servir los assets de Cesium
- Headers CORS para permitir carga de Web Workers
- Cache control optimizado (1 año para assets inmutables)
- MIME types correctos para `.wasm`, `.mjs`, etc.

### 3. **index.js** - Polyfill para globalThis
Agregué un polyfill para `globalThis` para compatibilidad con navegadores antiguos.

## 🚀 Pasos para Deploy

1. **Instalar dependencia faltante** (si no está):
   ```bash
   cd frontend
   npm install --save-dev copy-webpack-plugin
   ```

2. **Build local para probar**:
   ```bash
   cd frontend
   npm run build
   ```
   
   Verifica que se haya creado la carpeta `frontend/build/cesium/` con archivos dentro.

3. **Deploy a Fly.io**:
   ```bash
   cd frontend
   fly deploy
   ```

4. **Verificar el deploy**:
   - Abre `https://geoportal-frontend-1.fly.dev`
   - Revisa la consola del navegador (no debe haber errores de `import.meta`)
   - Verifica que la pestaña Network muestre los archivos de `/cesium/` cargando correctamente (200 OK)

## 📋 Archivos Modificados
- ✅ `frontend/craco.config.js` - Agregado CopyWebpackPlugin y DefinePlugin
- ✅ `frontend/nginx.conf` - Configuración mejorada para Cesium
- ✅ `frontend/src/index.js` - Polyfill para globalThis

## 🔍 Verificación Post-Deploy

Abre la consola del navegador y verifica:
```javascript
// Debe mostrar la URL base de Cesium
console.log(window.CESIUM_BASE_URL); // '/cesium/'

// Debe poder acceder a Cesium sin errores
console.log(Cesium.VERSION); // '1.139.1' o similar
```

## ⚠️ Notas Importantes

1. **No eliminar `copy-webpack-plugin`** del `devDependencies` - es crítico para Cesium
2. Si actualizas Cesium a una nueva versión, verifica que la ruta `node_modules/cesium/Build/Cesium` siga siendo válida
3. El cache de 1 año para assets de Cesium es seguro porque los nombres de archivo incluyen hashes de contenido

## 🆘 Si el problema persiste

1. Limpia la cache de npm:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Verifica que los archivos de Cesium existan en el build:
   ```bash
   ls -la frontend/build/cesium/
   ```

3. Revisa los logs de Fly.io:
   ```bash
   fly logs
   ```

---
**Fecha del fix**: 10 de abril de 2026
**Versión de Cesium**: 1.139.1
**Versión de React**: 18.3.1
**Versión de CRACO**: 7.1.0
