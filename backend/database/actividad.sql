-- =====================================================
-- PETCARE - APARTADO DE ACTIVIDAD FÍSICA
-- Usa las tablas actividades_fisicas, paseos, entrenamientos
-- y control_peso; agrega lo que faltaba y la tabla de metas.
-- Solo agrega: no borra datos. Se puede ejecutar varias veces.
-- =====================================================


-- -----------------------------------------------------
-- ACTIVIDADES: notas
-- -----------------------------------------------------
ALTER TABLE actividades_fisicas
    ADD COLUMN IF NOT EXISTS notas VARCHAR(255) DEFAULT NULL;


-- -----------------------------------------------------
-- PASEOS: lugar escrito (no solo de la tabla lugares)
-- -----------------------------------------------------
ALTER TABLE paseos
    ADD COLUMN IF NOT EXISTS lugar VARCHAR(150) DEFAULT NULL AFTER id_lugar;


-- -----------------------------------------------------
-- METAS DE ACTIVIDAD: cuánto debería moverse cada mascota
-- (la más reciente es la meta actual)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS metas_actividad (
    id_meta        INT(11) NOT NULL AUTO_INCREMENT,
    id_mascota     INT(11) NOT NULL,
    minutos_dia    SMALLINT NOT NULL,
    paseos_semana  SMALLINT DEFAULT NULL,
    pasos_dia      INT DEFAULT NULL,
    fecha_inicio   DATE NOT NULL,
    notas          VARCHAR(255) DEFAULT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_meta),
    KEY fk_meta_mascota (id_mascota),
    CONSTRAINT fk_meta_mascota FOREIGN KEY (id_mascota) REFERENCES mascotas (id_mascota)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- IDEAS DE LA IA (se guardan en recomendaciones, origen 'ia'):
-- en qué pestaña se pidieron y los detalles de cada idea
-- -----------------------------------------------------
ALTER TABLE recomendaciones
    ADD COLUMN IF NOT EXISTS seccion VARCHAR(20) DEFAULT NULL AFTER categoria,
    ADD COLUMN IF NOT EXISTS datos_json TEXT DEFAULT NULL
        COMMENT 'Duración, frecuencia, intensidad y precauciones de la idea (JSON)';


-- Cuándo se añadió la idea de la IA al historial, la agenda o el entrenamiento
ALTER TABLE recomendaciones
    ADD COLUMN IF NOT EXISTS aplicada DATE DEFAULT NULL AFTER util;
