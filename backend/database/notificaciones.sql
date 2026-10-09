-- =====================================================
-- PETCARE - NOTIFICACIONES (campanita y correo)
-- Recordatorios de vacunas, desparasitaciones, citas,
-- medicamentos, agenda y alimento que se acaba.
-- Solo agrega: no borra datos. Se puede ejecutar varias veces.
-- =====================================================

ALTER TABLE notificaciones
    -- vacuna, desparasitacion, cita, medicamento, recordatorio, alimento
    ADD COLUMN IF NOT EXISTS categoria VARCHAR(20) DEFAULT NULL AFTER tipo,
    -- Página de PetCare que se abre al tocar la notificación
    ADD COLUMN IF NOT EXISTS enlace VARCHAR(255) DEFAULT NULL AFTER mensaje,
    -- Identifica el aviso para no repetirlo (por ejemplo "vacuna:12:2026-10-12:hoy")
    ADD COLUMN IF NOT EXISTS clave_evento VARCHAR(120) DEFAULT NULL,
    -- Cuándo salió por correo (vacío = pendiente de enviar)
    ADD COLUMN IF NOT EXISTS correo_enviado DATETIME DEFAULT NULL,
    ADD UNIQUE KEY IF NOT EXISTS uq_notif_evento (id_usuario, clave_evento);


-- Preferencia: recordatorios de comidas y snacks (activados si no se configuró)
ALTER TABLE configuracion_usuario
    ADD COLUMN IF NOT EXISTS notif_comidas TINYINT(1) NOT NULL DEFAULT 1 AFTER notif_recordatorios;
