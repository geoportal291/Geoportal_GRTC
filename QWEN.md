## Qwen Added Memories
- Geoportal Frontend - Fix de Deploy Fly.io:

PROBLEMAS ENCONTRADOS Y SOLUCIONES:

1. ERROR import.meta fuera de módulo:
   - Causa: CesiumJS y Resium usaban import.meta que webpack bundleaba incorrectamente
   - Solución: Eliminar resium de package.json, usar IgnorePlugin para cesium, cargar Cesium via script tag en index.html desde /cesium/Cesium.js
   - Archivos modificados: craco.config.js (IgnorePlugin + CopyWebpackPlugin), src/index.js (remover import de Cesium), package.json (uninstall resium)

2. ERROR "e.some is not a function" en AuthContext.js:
   - Causa: El backend en producción devuelve formato diferente al localhost (null/objeto en vez de array)
   - Solución: Validación robusta en fetchAssignedProjects - verificar Array.isArray(projects) antes de usar .some(), manejar formatos { projects: [...] }, { data: [...] }, null, etc.
   - Archivo modificado: src/data/contexts/AuthContext.js

3. ERROR "Formato inesperado de proyectos" devolviendo HTML:
   - Causa: API_URL = process.env.REACT_APP_API_BASE || '' quedaba vacío en producción porque no hay .env.production
   - Resultado: Las peticiones a /api/user-projects iban a la misma URL del frontend y nginx devolvía index.html en vez de JSON del backend
   - Solución: Usar API_BASE_URL importada desde src/api/config.js que tiene fallback correcto a 'https://geoportal-backend-1.fly.dev'
   - Archivo modificado: src/data/contexts/AuthContext.js - importar { API_BASE_URL } from '../../api/config' y usarla directamente

4. ERROR "Cannot find module framer-motion":
   - Solución: npm install framer-motion@12.38.0

5. DOCKERFILE actualizado:
   - Multi-stage build: Stage 1 Node 20 para build, Stage 2 Nginx Alpine para servir
   - Node 20 necesario porque copy-webpack-plugin v11 usa Array.toSorted() que no existe en Node 18
   - CopyWebpackPlugin copia assets de Cesium a build/cesium/

6. NGINX.CONF mejorado:
   - Location /cesium/ con headers CORS, cache control, MIME types para WASM/MJS
   - Cache de 1 año para assets estáticos

URLs de producción:
- Frontend: https://geoportal-frontend-1.fly.dev
- Backend: https://geoportal-backend-1.fly.dev
