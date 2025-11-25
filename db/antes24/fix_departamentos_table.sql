DROP TABLE IF EXISTS departamentos CASCADE;

CREATE TABLE codigo_departamentos (
    codigo_departamento CHAR(2) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consulta para crear la tabla de distritos
CREATE TABLE distritos (
    id VARCHAR(6) PRIMARY NULL,
    name VARCHAR(255) NOT NULL,
    province_id VARCHAR(4) NOT NULL,
    department_id VARCHAR(2) NOT NULL
);

-- Inserción de datos para la tabla codigo_departamentos
INSERT INTO codigo_departamentos (codigo_departamento, nombre) VALUES
('01', 'Amazonas'),
('02', 'Áncash'),
('03', 'Apurímac'),
('04', 'Arequipa'),
('05', 'Ayacucho'),
('06', 'Cajamarca'),
('07', 'Callao'),
('08', 'Cusco'),
('09', 'Huancavelica'),
('10', 'Huánuco'),
('11', 'Ica'),
('12', 'Junín'),
('13', 'La Libertad'),
('14', 'Lambayeque'),
('15', 'Lima'),
('16', 'Loreto'),
('17', 'Madre de Dios'),
('18', 'Moquegua'),
('19', 'Pasco'),
('20', 'Piura'),
('21', 'Puno'),
('22', 'San Martín'),
('23', 'Tacna'),
('24', 'Tumbes'),
('25', 'Ucayali');