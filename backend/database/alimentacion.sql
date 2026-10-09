-- =====================================================
-- PETCARE - APARTADO DE ALIMENTACIÓN
-- Tablas nuevas (alimentos, restricciones, agua, compras)
-- y campos que faltaban en las existentes.
-- Solo agrega: no borra datos. Se puede ejecutar varias veces.
-- =====================================================


-- -----------------------------------------------------
-- ALIMENTOS QUE CONSUME (comida, premios y suplementos)
-- y sus existencias en casa
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS alimentos (
    id_alimento     INT(11) NOT NULL AUTO_INCREMENT,
    id_mascota      INT(11) NOT NULL,
    nombre          VARCHAR(120) NOT NULL,
    marca           VARCHAR(100) DEFAULT NULL,
    tipo            ENUM('pienso','humeda','casera','dieta_especial','premio','golosina','suplemento') NOT NULL,
    ingredientes    TEXT DEFAULT NULL,
    fecha_inicio    DATE DEFAULT NULL COMMENT 'Desde cuándo lo come (para relacionar síntomas)',
    fecha_fin       DATE DEFAULT NULL,
    en_uso          TINYINT(1) NOT NULL DEFAULT 1,
    stock_inicial_g DECIMAL(9,2) NOT NULL DEFAULT 0 COMMENT 'Cantidad que había en casa al registrarlo',
    alerta_minima_g DECIMAL(9,2) DEFAULT NULL COMMENT 'Avisar para comprar cuando quede menos',
    observaciones   TEXT DEFAULT NULL,
    fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_alimento),
    KEY fk_alim_mascota (id_mascota),
    CONSTRAINT fk_alim_mascota FOREIGN KEY (id_mascota) REFERENCES mascotas (id_mascota)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- ALIMENTOS QUE NO TOLERA O DEBE EVITAR
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS restricciones_alimentarias (
    id_restriccion INT(11) NOT NULL AUTO_INCREMENT,
    id_mascota     INT(11) NOT NULL,
    alimento       VARCHAR(120) NOT NULL,
    motivo         ENUM('alergia','intolerancia','toxico','indicacion_medica','otro') NOT NULL,
    reaccion       TEXT DEFAULT NULL,
    origen         ENUM('veterinario','propietario') NOT NULL DEFAULT 'propietario',
    fecha          DATE DEFAULT NULL,
    observaciones  TEXT DEFAULT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_restriccion),
    KEY fk_restr_mascota (id_mascota),
    CONSTRAINT fk_restr_mascota FOREIGN KEY (id_mascota) REFERENCES mascotas (id_mascota)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- CONSUMO DE AGUA
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS consumo_agua (
    id_agua        INT(11) NOT NULL AUTO_INCREMENT,
    id_mascota     INT(11) NOT NULL,
    fecha          DATE NOT NULL,
    ofrecida_ml    DECIMAL(7,1) DEFAULT NULL,
    consumida_ml   DECIMAL(7,1) DEFAULT NULL COMMENT 'Si se puede medir',
    veces_bebe     SMALLINT DEFAULT NULL COMMENT 'Veces que bebe en el día',
    cambio_sed     ENUM('normal','aumentada','disminuida') NOT NULL DEFAULT 'normal',
    notas          VARCHAR(255) DEFAULT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_agua),
    KEY fk_agua_mascota (id_mascota),
    CONSTRAINT fk_agua_mascota FOREIGN KEY (id_mascota) REFERENCES mascotas (id_mascota)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- COMPRAS DE ALIMENTO: suman existencias y se guardan
-- también como gasto (categoría Alimentación)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS compras_alimento (
    id_compra      INT(11) NOT NULL AUTO_INCREMENT,
    id_mascota     INT(11) NOT NULL,
    id_alimento    INT(11) NOT NULL,
    fecha          DATE NOT NULL,
    cantidad_g     DECIMAL(9,2) NOT NULL,
    precio         DECIMAL(12,2) DEFAULT NULL,
    lugar          VARCHAR(120) DEFAULT NULL,
    id_gasto       INT(11) DEFAULT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_compra),
    KEY fk_compra_mascota (id_mascota),
    KEY fk_compra_alimento (id_alimento),
    KEY fk_compra_gasto (id_gasto),
    CONSTRAINT fk_compra_mascota FOREIGN KEY (id_mascota) REFERENCES mascotas (id_mascota)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_compra_alimento FOREIGN KEY (id_alimento) REFERENCES alimentos (id_alimento)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_compra_gasto FOREIGN KEY (id_gasto) REFERENCES gastos (id_gasto)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- COMIDAS: cantidad servida (cantidad_g), consumida,
-- tiempo que tarda y si come con normalidad
-- -----------------------------------------------------
ALTER TABLE registros_alimentacion
    ADD COLUMN IF NOT EXISTS id_alimento INT(11) DEFAULT NULL AFTER id_horario,
    ADD COLUMN IF NOT EXISTS cantidad_consumida_g DECIMAL(7,2) DEFAULT NULL AFTER cantidad_g,
    ADD COLUMN IF NOT EXISTS duracion_min SMALLINT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS apetito ENUM('normal','poco','ansioso','rechazo') NOT NULL DEFAULT 'normal',
    ADD KEY IF NOT EXISTS fk_ralim_alimento (id_alimento);

SET @existe := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_ralim_alimento');
SET @sql := IF(@existe = 0,
    'ALTER TABLE registros_alimentacion ADD CONSTRAINT fk_ralim_alimento FOREIGN KEY (id_alimento)
        REFERENCES alimentos (id_alimento) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;


-- -----------------------------------------------------
-- HORARIOS: ahora son de la mascota (el plan es opcional)
-- -----------------------------------------------------
ALTER TABLE horarios_comida
    MODIFY id_plan INT(11) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS id_mascota INT(11) DEFAULT NULL AFTER id_horario,
    ADD KEY IF NOT EXISTS fk_horario_mascota (id_mascota);

-- Horarios que ya existían: se les asigna la mascota de su plan
UPDATE horarios_comida h
JOIN planes_alimenticios p ON p.id_plan = h.id_plan
SET h.id_mascota = p.id_mascota
WHERE h.id_mascota IS NULL;

SET @existe := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_horario_mascota');
SET @sql := IF(@existe = 0,
    'ALTER TABLE horarios_comida ADD CONSTRAINT fk_horario_mascota FOREIGN KEY (id_mascota)
        REFERENCES mascotas (id_mascota) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;


-- -----------------------------------------------------
-- PESO: condición corporal, energía, pelo y piel
-- -----------------------------------------------------
ALTER TABLE control_peso
    ADD COLUMN IF NOT EXISTS condicion_corporal TINYINT DEFAULT NULL COMMENT 'Escala de 1 (muy delgado) a 9 (obeso); 5 es ideal',
    ADD COLUMN IF NOT EXISTS energia ENUM('baja','normal','alta') DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS pelo_piel VARCHAR(255) DEFAULT NULL;


-- -----------------------------------------------------
-- SEGUIMIENTO NUTRICIONAL: quién lo recomendó
-- (se usa la tabla recomendaciones con categoría alimentación)
-- -----------------------------------------------------
ALTER TABLE recomendaciones
    ADD COLUMN IF NOT EXISTS profesional VARCHAR(120) DEFAULT NULL AFTER origen;


-- -----------------------------------------------------
-- Al borrar un plan, sus horarios se quedan (solo pierden el plan)
-- -----------------------------------------------------
SET @regla := (SELECT DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS
               WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_horario_plan');
SET @sql := IF(@regla = 'CASCADE',
    'ALTER TABLE horarios_comida DROP FOREIGN KEY fk_horario_plan',
    'DO 0');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @existe := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_horario_plan');
SET @sql := IF(@existe = 0,
    'ALTER TABLE horarios_comida ADD CONSTRAINT fk_horario_plan FOREIGN KEY (id_plan)
        REFERENCES planes_alimenticios (id_plan) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;


-- -----------------------------------------------------
-- FOTOS (del concentrado, premio o alimento a evitar)
-- y aviso por correo cuando se está acabando el alimento
-- -----------------------------------------------------
ALTER TABLE alimentos
    ADD COLUMN IF NOT EXISTS foto VARCHAR(255) DEFAULT NULL AFTER ingredientes,
    ADD COLUMN IF NOT EXISTS alerta_enviada DATETIME DEFAULT NULL
        COMMENT 'Cuándo se avisó por correo que se acaba; se borra al reponer';

ALTER TABLE restricciones_alimentarias
    ADD COLUMN IF NOT EXISTS foto VARCHAR(255) DEFAULT NULL AFTER reaccion;


-- -----------------------------------------------------
-- El correo de alerta se marca aparte: si no se pudo enviar
-- (por ejemplo, sin correo configurado) se reintenta más tarde
-- -----------------------------------------------------
ALTER TABLE alimentos
    ADD COLUMN IF NOT EXISTS correo_alerta_enviado DATETIME DEFAULT NULL AFTER alerta_enviada;


-- -----------------------------------------------------
-- HORARIOS: si es una comida o un snack, y de qué alimento
-- (para el recordatorio de la próxima comida)
-- -----------------------------------------------------
ALTER TABLE horarios_comida
    ADD COLUMN IF NOT EXISTS tipo ENUM('comida','snack') NOT NULL DEFAULT 'comida' AFTER hora,
    ADD COLUMN IF NOT EXISTS id_alimento INT(11) DEFAULT NULL AFTER tipo,
    ADD KEY IF NOT EXISTS fk_horario_alimento (id_alimento);

SET @existe := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_horario_alimento');
SET @sql := IF(@existe = 0,
    'ALTER TABLE horarios_comida ADD CONSTRAINT fk_horario_alimento FOREIGN KEY (id_alimento)
        REFERENCES alimentos (id_alimento) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
