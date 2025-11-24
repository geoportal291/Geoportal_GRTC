# Usa una imagen ligera de Nginx
FROM nginx:alpine

# Copia el contenido del build al directorio de Nginx
COPY build/ /usr/share/nginx/html

# Copia la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
