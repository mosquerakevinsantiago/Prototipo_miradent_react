CREATE DATABASE miradent;

USE miradent;

CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    contrasena_hash VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

CREATE TABLE especialidades (
    id_especialidad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE odontologos (
    id_odontologo INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    id_especialidad INT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_especialidad) REFERENCES especialidades(id_especialidad)
);

CREATE TABLE servicios (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    id_especialidad INT NOT NULL,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    duracion_minutos INT NOT NULL,
    FOREIGN KEY (id_especialidad) REFERENCES especialidades(id_especialidad)
);

CREATE TABLE sillas (
    id_silla INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE horario_clinica (
    id_horario INT AUTO_INCREMENT PRIMARY KEY,
    dia_semana INT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL
);

CREATE TABLE cierres_clinica (
    id_cierre INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    motivo VARCHAR(150)
);

CREATE TABLE disponibilidad (
    id_disponibilidad INT AUTO_INCREMENT PRIMARY KEY,
    id_odontologo INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    FOREIGN KEY (id_odontologo) REFERENCES odontologos(id_odontologo)
);

CREATE TABLE citas (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_odontologo INT NOT NULL,
    id_servicio INT NOT NULL,
    id_silla INT NOT NULL,
    id_disponibilidad INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion_minutos INT NOT NULL,
    estado VARCHAR(20) NOT NULL,
    notas TEXT,
    FOREIGN KEY (id_paciente) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_odontologo) REFERENCES odontologos(id_odontologo),
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio),
    FOREIGN KEY (id_silla) REFERENCES sillas(id_silla),
    FOREIGN KEY (id_disponibilidad) REFERENCES disponibilidad(id_disponibilidad)
);

CREATE TABLE notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL,
    mensaje VARCHAR(250) NOT NULL,
    leida INT NOT NULL DEFAULT 0,
    fecha_creacion DATETIME NOT NULL,
    FOREIGN KEY (id_cita) REFERENCES citas(id_cita)
);

INSERT INTO roles (nombre) VALUES
('Administrador'),
('Odontólogo'),
('Paciente');

INSERT INTO especialidades (nombre) VALUES
('Odontología general'),
('Ortodoncia'),
('Endodoncia'),
('Periodoncia'),
('Odontopediatría'),
('Rehabilitación oral');

INSERT INTO servicios (id_especialidad, nombre, duracion_minutos) VALUES
(1, 'Revisión general', 30),
(1, 'Limpieza dental', 30),
(1, 'Blanqueamiento', 30),
(2, 'Ortodoncia', 30),
(1, 'Consulta de urgencia', 30),
(1, 'Otro tratamiento', 30),
(3, 'Endodoncia', 90),
(1, 'Extracción simple', 30),
(1, 'Blanqueamiento dental', 30),
(1, 'Resina compuesta', 30),
(1, 'Consulta de valoración', 30),
(1, 'Aplicación de flúor', 30),
(1, 'Sellantes dentales', 30),
(2, 'Control de ortodoncia', 30),
(1, 'Radiografía periapical', 30),
(1, 'Profilaxis avanzada', 30),
(1, 'Sellado de restauración', 30),
(2, 'Retiro de brackets', 30);

INSERT INTO sillas (nombre) VALUES
('Silla 1'),
('Silla 2');

INSERT INTO horario_clinica (dia_semana, hora_inicio, hora_fin) VALUES
(1, '08:00:00', '12:00:00'),
(1, '13:30:00', '18:00:00'),
(2, '08:00:00', '12:00:00'),
(2, '13:30:00', '18:00:00'),
(3, '08:00:00', '12:00:00'),
(3, '13:30:00', '18:00:00'),
(4, '08:00:00', '12:00:00'),
(4, '13:30:00', '18:00:00'),
(5, '08:00:00', '12:00:00'),
(5, '13:30:00', '18:00:00');
