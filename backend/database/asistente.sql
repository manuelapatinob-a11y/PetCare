-- =====================================================
-- PETCARE - ASISTENTE IA (PetBot)
-- Usa las tablas conversaciones y mensajes.
-- Cada respuesta de la IA guarda su nivel de urgencia y las
-- preguntas sugeridas. Se puede ejecutar varias veces.
-- =====================================================

ALTER TABLE mensajes
    ADD COLUMN IF NOT EXISTS datos_json TEXT DEFAULT NULL
        COMMENT 'Urgencia, motivo, preguntas sugeridas y temas de la respuesta de la IA (JSON)';

ALTER TABLE conversaciones
    ADD COLUMN IF NOT EXISTS fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
