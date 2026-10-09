-- =====================================================
-- PETCARE - FINANZAS
-- Cada gasto puede quedar ligado al registro que pagó:
-- cita (id_cita, ya existía), vacuna, desparasitación,
-- medicamento o compra de alimento (compras_alimento.id_gasto).
-- Solo agrega: no borra datos. Se puede ejecutar varias veces.
-- =====================================================

ALTER TABLE gastos
    ADD COLUMN IF NOT EXISTS id_vacuna INT(11) DEFAULT NULL AFTER id_cita,
    ADD COLUMN IF NOT EXISTS id_desparasitacion INT(11) DEFAULT NULL AFTER id_vacuna,
    ADD COLUMN IF NOT EXISTS id_medicamento INT(11) DEFAULT NULL AFTER id_desparasitacion,
    ADD COLUMN IF NOT EXISTS notas VARCHAR(255) DEFAULT NULL AFTER comprobante,
    ADD COLUMN IF NOT EXISTS fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD KEY IF NOT EXISTS fk_gasto_vacuna (id_vacuna),
    ADD KEY IF NOT EXISTS fk_gasto_desparasitacion (id_desparasitacion),
    ADD KEY IF NOT EXISTS fk_gasto_medicamento (id_medicamento);


SET @existe := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_gasto_vacuna');
SET @sql := IF(@existe = 0,
    'ALTER TABLE gastos ADD CONSTRAINT fk_gasto_vacuna FOREIGN KEY (id_vacuna)
        REFERENCES vacunas (id_vacuna) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @existe := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_gasto_desparasitacion');
SET @sql := IF(@existe = 0,
    'ALTER TABLE gastos ADD CONSTRAINT fk_gasto_desparasitacion FOREIGN KEY (id_desparasitacion)
        REFERENCES desparasitaciones (id_desparasitacion) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @existe := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_gasto_medicamento');
SET @sql := IF(@existe = 0,
    'ALTER TABLE gastos ADD CONSTRAINT fk_gasto_medicamento FOREIGN KEY (id_medicamento)
        REFERENCES medicamentos (id_medicamento) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;


-- Categorías que faltaban
INSERT INTO categorias_gasto (nombre, icono)
SELECT 'Desparasitación', 'bug' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categorias_gasto WHERE nombre = 'Desparasitación');

INSERT INTO categorias_gasto (nombre, icono)
SELECT 'Entrenamiento', 'trophy' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categorias_gasto WHERE nombre = 'Entrenamiento');
