#Usa Node.js 18 como base
FROM node:18

# Instalar GDAL/OGR y sus dependencias
# Actualizar la lista de paquetes e instalar gdal-bin
RUN sed -i 's/Components: main/Components: main contrib non-free/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && apt-get install -y \
    gdal-bin \
    python3-gdal \
    unrar \
    && rm -rf /var/lib/apt/lists/*

# --- AÑADIR ESTAS LÍNEAS PARA DEPURACIÓN ---
RUN which ogr2ogr
RUN ls -l $(which ogr2ogr)
# --- FIN DE LÍNEAS DE DEPURACIÓN ---

WORKDIR /app

# --- AGGRESSIVE CLEANUP FOR DEPENDENCY INSTALLATION ---
# Remove any existing node_modules or package-lock.json to ensure a fresh install
RUN rm -rf node_modules package-lock.json || true
# Clean npm cache
RUN npm cache clean --force
# --- END AGGRESSIVE CLEANUP ---

# Forzar reconstrucción de caché
COPY package.json ./
COPY package-lock.json ./


RUN npm install


COPY . .

EXPOSE 5000

CMD ["node", "--max-old-space-size=16384", "index.js"]
