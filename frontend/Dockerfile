# Dockerfile simplificado: el build se hace localmente
# Ejecutar primero: set GENERATE_SOURCEMAP=false && set REACT_APP_API_BASE=https://geoportal-backend-u3zi.fly.dev && npm run build
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY build/ /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]