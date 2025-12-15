CREATE TABLE zonas_criticas (
    id_zona_critica SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL,
    codigo VARCHAR(50),
    progresiva VARCHAR(50),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    altitud VARCHAR(50),
    lado VARCHAR(50),
    longitud_zona VARCHAR(50),
    observaciones TEXT,
    tipo VARCHAR(255),
    clase_dano VARCHAR(50),
    condicion VARCHAR(50),
    panel_fotografico_codigo VARCHAR(255),
    entregable VARCHAR(50)
);
