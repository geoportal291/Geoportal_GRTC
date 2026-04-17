# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Variables de entorno de CRA deben existir en tiempo de build.
# En Fly el .env no entra al contexto Docker por .dockerignore, así que
# las recibimos como build args.
ARG REACT_APP_API_BASE=https://geoportal-backend-1.fly.dev
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar el resto del código
COPY . .

# Hacer el build (CRACO copiará los assets de Cesium automáticamente)
RUN npm run build

# Stage 2: Servir con Nginx
FROM nginx:alpine

# Copiar el build del stage anterior
COPY --from=builder /app/build/ /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
