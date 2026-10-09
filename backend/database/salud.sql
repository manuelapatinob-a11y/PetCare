-- =====================================================
-- PETCARE - APARTADO DE SALUD
-- Tablas nuevas (enfermedades, síntomas, antecedentes,
-- documentos) y campos que faltaban en las existentes.
-- Se puede ejecutar varias veces sin problema.
-- =====================================================


-- -----------------------------------------------------
-- ENFERMEDADES CONOCIDAS
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS enfermedades (
    id_enfermedad     INT(11) NOT NULL AUTO_INCREMENT,
    id_mascota        INT(11) NOT NULL,
    nombre            VARCHAR(150) NOT NULL,
    fecha_diagnostico DATE DEFAULT NULL,
    estado            ENUM('activa','controlada','curada') NOT NULL DEFAULT 'activa',
    cronica           TINYINT(1) NOT NULL DEFAULT 0,
    origen            ENUM('veterinario','propietario') NOT NULL DEFAULT 'propietario',
    observaciones     TEXT DEFAULT NULL,
    fecha_registro    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_enfermedad),
    KEY fk_enf_mascota (id_mascota),
    CONSTRAINT fk_enf_mascota FOREIGN KEY (id_mascota) REFERENCES mascotas (id_mascota)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- SÍNTOMAS OBSERVADOS
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS sintomas (
    id_sintoma     INT(11) NOT NULL AUTO_INCREMENT,
    id_mascota     INT(11) NOT NULL,
    id_cita        INT(11) DEFAULT NULL,
    descripcion    VARCHAR(200) NOT NULL,
    fecha_inicio   DATE NOT NULL,
    frecuencia     VARCHAR(80) DEFAULT NULL,
    evolucion      ENUM('mejorando','igual','empeorando','resuelto') NOT NULL DEFAULT 'igual',
    cambios        TEXT DEFAULT NULL COMMENT 'Cambios en apetito, comportamiento o actividad',
    observaciones  TEXT DEFAULT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_sintoma),
    KEY fk_sin_mascota (id_mascota),
    KEY fk_sin_cita (id_cita),
    CONSTRAINT fk_sin_mascota FOREIGN KEY (id_mascota) REFERENCES mascotas (id_mascota)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sin_cita FOREIGN KEY (id_cita) REFERENCES citas_veterinarias (id_cita)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- ANTECEDENTES: alergias, reacciones, lesiones,
-- accidentes, cirugías y observaciones del propietario
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS antecedentes (
    id_antecedente INT(11) NOT NULL AUTO_INCREMENT,
    id_mascota     INT(11) NOT NULL,
    tipo           ENUM('alergia','reaccion','lesion','accidente','cirugia','observacion') NOT NULL,
    descripcion    VARCHAR(200) NOT NULL,
    fecha          DATE DEFAULT NULL,
    gravedad       ENUM('leve','moderada','grave') DEFAULT NULL,
    origen         ENUM('veterinario','propietario') NOT NULL DEFAULT 'propietario',
    observaciones  TEXT DEFAULT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_antecedente),
    KEY fk_ant_mascota (id_mascota),
    CONSTRAINT fk_ant_mascota FOREIGN KEY (id_mascota) REFERENCES mascotas (id_mascota)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- DOCUMENTOS: fotos de informes, recetas, facturas
-- y resultados de análisis
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos_medicos (
    id_documento   INT(11) NOT NULL AUTO_INCREMENT,
    id_mascota     INT(11) NOT NULL,
    id_cita        INT(11) DEFAULT NULL,
    tipo           ENUM('informe','receta','factura','analisis','otro') NOT NULL DEFAULT 'informe',
    titulo         VARCHAR(150) NOT NULL,
    fecha          DATE NOT NULL,
    archivo        VARCHAR(255) NOT NULL,
    notas          TEXT DEFAULT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_documento),
    KEY fk_doc_mascota (id_mascota),
    KEY fk_doc_cita (id_cita),
    CONSTRAINT fk_doc_mascota FOREIGN KEY (id_mascota) REFERENCES mascotas (id_mascota)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_doc_cita FOREIGN KEY (id_cita) REFERENCES citas_veterinarias (id_cita)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- VACUNAS: permitir vacunas que no están en el catálogo
-- (por ejemplo de aves, conejos u otras especies)
-- -----------------------------------------------------
ALTER TABLE vacunas
    MODIFY id_tipo_vacuna INT(11) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS nombre_vacuna VARCHAR(100) DEFAULT NULL AFTER id_tipo_vacuna,
    ADD COLUMN IF NOT EXISTS clinica VARCHAR(150) DEFAULT NULL AFTER veterinario;

INSERT IGNORE INTO tipos_vacuna (id_especie, nombre, descripcion, frecuencia_meses)
SELECT e.id_especie, v.nombre, v.descripcion, v.frecuencia
FROM especies e
JOIN (
              SELECT 'Perro' AS especie, 'Leptospirosis' AS nombre, 'Refuerzo contra leptospira' AS descripcion, 12 AS frecuencia
    UNION ALL SELECT 'Conejo', 'Mixomatosis', 'Enfermedad viral transmitida por insectos', 6
    UNION ALL SELECT 'Conejo', 'Enfermedad hemorrágica vírica', 'EHV (RHD1 y RHD2)', 12
) v ON v.especie = e.nombre;


-- -----------------------------------------------------
-- DESPARASITACIONES: dosis registrada
-- -----------------------------------------------------
ALTER TABLE desparasitaciones
    ADD COLUMN IF NOT EXISTS dosis VARCHAR(60) DEFAULT NULL AFTER producto;


-- -----------------------------------------------------
-- MEDICAMENTOS: cita en la que se recetó,
-- efectos observados y notas del propietario
-- -----------------------------------------------------
ALTER TABLE medicamentos
    ADD COLUMN IF NOT EXISTS id_cita INT(11) DEFAULT NULL AFTER id_tratamiento,
    ADD COLUMN IF NOT EXISTS efectos_observados TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS notas TEXT DEFAULT NULL,
    ADD KEY IF NOT EXISTS fk_med_cita (id_cita);

SET @existe_fk := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_med_cita'
);
SET @sql := IF(@existe_fk = 0,
    'ALTER TABLE medicamentos ADD CONSTRAINT fk_med_cita FOREIGN KEY (id_cita)
        REFERENCES citas_veterinarias (id_cita) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0');
PREPARE paso FROM @sql;
EXECUTE paso;
DEALLOCATE PREPARE paso;


-- -----------------------------------------------------
-- CITAS VETERINARIAS: las 5 partes de una cita
-- 1. Datos  2. Motivo y síntomas  3. Atención
-- 4. Tratamiento e indicaciones  5. Seguimiento
-- -----------------------------------------------------
ALTER TABLE citas_veterinarias
    MODIFY tipo ENUM('control','vacunacion','urgencia','seguimiento','cirugia','otro') NOT NULL DEFAULT 'control',
    -- Cuando el tipo es "otro", qué tipo de cita es
    ADD COLUMN IF NOT EXISTS tipo_otro VARCHAR(100) DEFAULT NULL AFTER tipo,
    ADD COLUMN IF NOT EXISTS clinica VARCHAR(150) DEFAULT NULL AFTER id_lugar,
    -- 2. Motivo y síntomas
    ADD COLUMN IF NOT EXISTS sintomas_descripcion TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS sintomas_inicio DATE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS cambios_observados TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS evolucion_sintomas TEXT DEFAULT NULL,
    -- 3. Atención veterinaria
    ADD COLUMN IF NOT EXISTS pruebas_realizadas TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS resultados TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS diagnostico TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS origen_informacion ENUM('veterinario','propietario') NOT NULL DEFAULT 'propietario',
    -- 4. Tratamiento e indicaciones
    ADD COLUMN IF NOT EXISTS cuidados_casa TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS restricciones TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS proxima_revision DATE DEFAULT NULL,
    -- 5. Seguimiento
    ADD COLUMN IF NOT EXISTS evolucion_posterior TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS tratamiento_cumplido ENUM('si','parcial','no') DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS sintomas_nuevos TEXT DEFAULT NULL;


-- El historial médico (vista v_historial_mascota) está en historial.sql
