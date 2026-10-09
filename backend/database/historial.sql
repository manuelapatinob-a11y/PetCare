-- =====================================================
-- PETCARE - HISTORIAL MÉDICO
-- Vista que une toda la información de salud, gastos y
-- alimentación de cada mascota.
-- Ejecutar después de salud.sql, alimentacion.sql, actividad.sql y entrenamiento.sql.
-- =====================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW v_historial_mascota AS
    -- En esta primera parte se fija la intercalación (COLLATE) de los textos:
    -- así la unión funciona igual en cualquier servidor MySQL o MariaDB
    SELECT v.id_mascota, v.fecha_aplicacion AS fecha, 'vacuna' COLLATE utf8mb4_unicode_ci AS tipo, v.id_vacuna AS id_registro,
           CONCAT('Vacuna: ', COALESCE(tv.nombre, v.nombre_vacuna, 'Sin nombre')) COLLATE utf8mb4_unicode_ci AS titulo,
           CONCAT_WS(' · ', v.clinica, v.veterinario,
                     IF(v.proxima_dosis IS NULL, NULL, CONCAT('Próxima: ', DATE_FORMAT(v.proxima_dosis, '%d/%m/%Y')))) COLLATE utf8mb4_unicode_ci AS detalle
    FROM vacunas v
    LEFT JOIN tipos_vacuna tv ON tv.id_tipo_vacuna = v.id_tipo_vacuna

    UNION ALL
    SELECT d.id_mascota, d.fecha_aplicacion, 'desparasitacion', d.id_desparasitacion,
           CONCAT('Desparasitación ', d.tipo, ': ', d.producto),
           CONCAT_WS(' · ', IF(d.dosis IS NULL, NULL, CONCAT('Dosis: ', d.dosis)), d.observaciones)
    FROM desparasitaciones d

    UNION ALL
    SELECT e.id_mascota, COALESCE(e.fecha_diagnostico, DATE(e.fecha_registro)), 'enfermedad', e.id_enfermedad,
           CONCAT('Enfermedad: ', e.nombre),
           CONCAT_WS(' · ', CONCAT('Estado: ', e.estado), IF(e.cronica, 'Crónica', NULL),
                     IF(e.origen = 'veterinario', 'Según el veterinario', 'Observado por el dueño'))
    FROM enfermedades e

    UNION ALL
    SELECT s.id_mascota, s.fecha_inicio, 'sintoma', s.id_sintoma,
           CONCAT('Síntoma: ', s.descripcion),
           CONCAT_WS(' · ', s.frecuencia, CONCAT('Evolución: ', s.evolucion), s.cambios)
    FROM sintomas s

    UNION ALL
    SELECT a.id_mascota, COALESCE(a.fecha, DATE(a.fecha_registro)), a.tipo, a.id_antecedente,
           a.descripcion,
           CONCAT_WS(' · ', IF(a.gravedad IS NULL, NULL, CONCAT('Gravedad: ', a.gravedad)), a.observaciones)
    FROM antecedentes a

    UNION ALL
    SELECT m.id_mascota, m.fecha_inicio, 'medicamento', m.id_medicamento,
           CONCAT('Medicamento: ', m.nombre),
           CONCAT_WS(' · ', m.dosis, m.frecuencia,
                     IF(m.fecha_fin IS NULL, NULL, CONCAT('Hasta ', DATE_FORMAT(m.fecha_fin, '%d/%m/%Y'))))
    FROM medicamentos m

    UNION ALL
    SELECT c.id_mascota, DATE(c.fecha_hora), 'cita', c.id_cita,
           CONCAT('Consulta: ', c.motivo),
           CONCAT_WS(' · ', IF(c.tipo = 'otro', c.tipo_otro, NULL), c.clinica, c.veterinario,
                     IF(c.diagnostico IS NULL OR c.diagnostico = '', NULL, CONCAT('Diagnóstico: ', c.diagnostico)),
                     IF(c.estado = 'programada', 'Programada', NULL))
    FROM citas_veterinarias c
    WHERE c.estado <> 'cancelada'

    UNION ALL
    SELECT dm.id_mascota, dm.fecha, 'documento', dm.id_documento,
           CONCAT('Documento: ', dm.titulo), dm.tipo
    FROM documentos_medicos dm

    UNION ALL
    SELECT g.id_mascota, g.fecha, 'gasto', g.id_gasto,
           CONCAT('Gasto: ', g.descripcion), CONCAT('$ ', FORMAT(g.monto, 0, 'es_CO'))
    FROM gastos g
    WHERE g.id_categoria IN (1, 2, 4, 5, 8)

    UNION ALL
    SELECT p.id_mascota, p.fecha_inicio, 'alimentacion', p.id_plan,
           CONCAT('Plan de alimentación: ', p.nombre),
           CONCAT_WS(' · ', p.tipo_alimento, p.marca,
                     IF(p.porcion_diaria_g IS NULL, NULL, CONCAT(TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM p.porcion_diaria_g)), ' g al día')))
    FROM planes_alimenticios p

    UNION ALL
    SELECT cp.id_mascota, cp.fecha, 'peso', cp.id_peso,
           CONCAT('Peso: ', TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM cp.peso_kg)), ' kg'),
           CONCAT_WS(' · ', IF(cp.condicion_corporal IS NULL, NULL, CONCAT('Condición corporal ', cp.condicion_corporal, '/9')),
                     IF(cp.energia IS NULL, NULL, CONCAT('Energía ', cp.energia)), cp.pelo_piel, cp.notas)
    FROM control_peso cp

    UNION ALL
    SELECT al.id_mascota, COALESCE(al.fecha_inicio, DATE(al.fecha_registro)), 'alimento', al.id_alimento,
           CONCAT('Nuevo alimento: ', al.nombre),
           CONCAT_WS(' · ', al.marca,
                     ELT(FIELD(al.tipo, 'pienso', 'humeda', 'casera', 'dieta_especial', 'premio', 'golosina', 'suplemento'),
                         'Pienso', 'Comida húmeda', 'Comida casera', 'Dieta especial', 'Premio', 'Golosina', 'Suplemento'),
                     al.ingredientes)
    FROM alimentos al

    UNION ALL
    SELECT ra.id_mascota, COALESCE(ra.fecha, DATE(ra.fecha_registro)), 'restriccion', ra.id_restriccion,
           CONCAT('Evitar: ', ra.alimento),
           CONCAT_WS(' · ',
                     ELT(FIELD(ra.motivo, 'alergia', 'intolerancia', 'toxico', 'indicacion_medica', 'otro'),
                         'Alergia', 'Intolerancia', 'Tóxico', 'Indicación médica', 'Otro motivo'),
                     ra.reaccion,
                     IF(ra.origen = 'veterinario', 'Según el veterinario', 'Observado por el dueño'))
    FROM restricciones_alimentarias ra

    UNION ALL
    SELECT rn.id_mascota, DATE(rn.fecha), 'nutricion', rn.id_recomendacion,
           CONCAT('Recomendación nutricional: ', rn.titulo),
           CONCAT_WS(' · ', rn.profesional, rn.contenido)
    FROM recomendaciones rn
    WHERE rn.categoria = 'alimentacion'

    UNION ALL
    SELECT ag.id_mascota, ag.fecha, 'agua', ag.id_agua,
           CONCAT('Sed ', ag.cambio_sed),
           CONCAT_WS(' · ', IF(ag.consumida_ml IS NULL, NULL, CONCAT(TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM ag.consumida_ml)), ' ml')), ag.notas)
    FROM consumo_agua ag
    WHERE ag.cambio_sed <> 'normal'

    UNION ALL
    SELECT en.id_mascota, en.fecha, 'entrenamiento', en.id_entrenamiento,
           CONCAT('Entrenamiento: ', en.comando),
           CONCAT_WS(' · ',
                     ELT(FIELD(en.nivel_progreso, 'iniciado', 'en_progreso', 'dominado'), 'Iniciado', 'En progreso', 'Dominado'),
                     IF(en.duracion_min IS NULL, NULL, CONCAT(en.duracion_min, ' min')), en.notas)
    FROM entrenamientos en

    UNION ALL
    SELECT ma.id_mascota, ma.fecha_inicio, 'meta_actividad', ma.id_meta,
           CONCAT('Meta de actividad: ', ma.minutos_dia, ' min al día'),
           CONCAT_WS(' · ', IF(ma.paseos_semana IS NULL, NULL, CONCAT(ma.paseos_semana, ' paseos a la semana')), ma.notas)
    FROM metas_actividad ma

    UNION ALL
    SELECT dc.id_mascota, DATE(dc.fecha_hora), 'comportamiento', dc.id_diario,
           CONCAT('Conducta a mejorar: ', dc.comportamiento),
           CONCAT_WS(' · ', CONCAT('Ánimo: ', dc.estado_animo),
                     IF(dc.intensidad IS NULL, NULL, CONCAT('Intensidad ', dc.intensidad)),
                     IF(dc.detonante IS NULL, NULL, CONCAT('Lo provocó: ', dc.detonante)), dc.descripcion)
    FROM diario_comportamiento dc
    WHERE dc.tipo = 'a_mejorar';
