#Usa Node.js 18 como base
FROM node:18

# Instalar GDAL/OGR y sus dependencias + PYTHON
# Actualizar la lista de paquetes e instalar gdal-bin y python
RUN sed -i 's/Components: main/Components: main contrib non-free/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && apt-get install -y \
    gdal-bin \
    python3-gdal \
    unrar \
    python3 \
    python3-pip \
    libgl1 \
    libglib2.0-0 \
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

# Install Python dependencies
COPY python_worker/requirements.txt ./python_worker/requirements.txt

# OPTIMIZATION: Install CPU-only PyTorch first to avoid massive CUDA download
# This reduces image size from >3GB to ~500MB
# Actualizar pip primero: typing_extensions>=4.16 trae metadatos que el pip
# viejo de Debian rechaza y hace fallar la instalación de torch
RUN pip3 install --no-cache-dir --upgrade pip

RUN pip3 install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu --break-system-packages

RUN pip3 install --no-cache-dir -r python_worker/requirements.txt --break-system-packages

COPY . .

# Make start script executable
RUN chmod +x start.sh

EXPOSE 5000

# CMD ["node", "--max-old-space-size=16384", "index.js"]
CMD ["./start.sh"]
