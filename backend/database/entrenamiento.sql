-- =====================================================
-- PETCARE - APARTADO DE ENTRENAMIENTO Y COMPORTAMIENTO
-- Usa las tablas entrenamientos, diario_comportamiento, rutinas,
-- rutina_actividades y consejos_guias; agrega lo que faltaba.
-- Solo agrega: no borra datos. Se puede ejecutar varias veces.
-- Ejecutar antes de historial.sql.
-- =====================================================


-- -----------------------------------------------------
-- IDEAS DE LA IA: también hay consejos de comportamiento
-- -----------------------------------------------------
ALTER TABLE recomendaciones
    MODIFY categoria ENUM('salud','alimentacion','actividad','entrenamiento','comportamiento','seguridad','finanzas') NOT NULL;


-- -----------------------------------------------------
-- DIARIO DE COMPORTAMIENTO: si la conducta es buena o a mejorar,
-- qué tan fuerte fue y qué hizo el dueño
-- -----------------------------------------------------
ALTER TABLE diario_comportamiento
    ADD COLUMN IF NOT EXISTS tipo ENUM('positivo','neutral','a_mejorar') NOT NULL DEFAULT 'neutral' AFTER fecha_hora,
    ADD COLUMN IF NOT EXISTS intensidad ENUM('leve','moderada','fuerte') DEFAULT NULL AFTER comportamiento,
    ADD COLUMN IF NOT EXISTS respuesta VARCHAR(255) DEFAULT NULL
        COMMENT 'Qué hizo el dueño y cómo reaccionó la mascota' AFTER detonante;


-- -----------------------------------------------------
-- RUTINAS: objetivo y por qué la recomienda la IA
-- -----------------------------------------------------
ALTER TABLE rutinas
    ADD COLUMN IF NOT EXISTS objetivo VARCHAR(100) DEFAULT NULL AFTER nombre,
    ADD COLUMN IF NOT EXISTS fundamento TEXT DEFAULT NULL AFTER descripcion;


-- -----------------------------------------------------
-- ACTIVIDADES DE CADA RUTINA: de qué mascota son (para
-- comprobar que son del usuario) y cómo hacer cada una
-- -----------------------------------------------------
ALTER TABLE rutina_actividades
    ADD COLUMN IF NOT EXISTS id_mascota INT(11) DEFAULT NULL AFTER id_rutina,
    ADD COLUMN IF NOT EXISTS detalle VARCHAR(255) DEFAULT NULL,
    ADD KEY IF NOT EXISTS fk_ract_mascota (id_mascota);

UPDATE rutina_actividades ra
JOIN rutinas r ON r.id_rutina = ra.id_rutina
SET ra.id_mascota = r.id_mascota
WHERE ra.id_mascota IS NULL;

SET @existe := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_ract_mascota');
SET @sql := IF(@existe = 0,
    'ALTER TABLE rutina_actividades ADD CONSTRAINT fk_ract_mascota FOREIGN KEY (id_mascota)
        REFERENCES mascotas (id_mascota) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;


-- -----------------------------------------------------
-- GUÍAS BÁSICAS (1 = Perro, 2 = Gato, NULL = todas las especies)
-- Solo se insertan las que no existen
-- -----------------------------------------------------
INSERT INTO consejos_guias (id_especie, categoria, titulo, contenido, nivel)
SELECT g.id_especie, g.categoria, g.titulo, g.contenido, g.nivel
FROM (
    SELECT 1 AS id_especie, 'entrenamiento' AS categoria, 'Enseñar a venir cuando lo llamas' AS titulo,
           'Empieza en casa, sin distracciones: di su nombre y "ven" con voz alegre, agáchate y prémialo apenas llegue. Nunca lo llames para regañarlo. Aumenta la distancia poco a poco y practica en el parque con una correa larga.' AS contenido,
           'basico' AS nivel
    UNION ALL SELECT 1, 'entrenamiento', 'Caminar sin tirar de la correa',
           'Si tira, detente y espera a que la correa se afloje; cuando vuelva a tu lado, prémialo y sigue caminando. Sesiones cortas de 5 a 10 minutos y premios pequeños a la altura de tu pierna.', 'intermedio'
    UNION ALL SELECT 1, 'entrenamiento', 'El comando "quieto"',
           'Pídele que se siente, muestra la palma de la mano y di "quieto". Espera 2 segundos y prémialo sin que se levante. Aumenta primero el tiempo, luego la distancia y por último las distracciones.', 'intermedio'
    UNION ALL SELECT 1, 'comportamiento', 'Ladridos excesivos',
           'Identifica qué los provoca (aburrimiento, visitas, ruidos). No grites: refuerza el silencio con premios, enséñale una conducta alternativa como ir a su cama y dale más ejercicio y juegos mentales.', 'intermedio'
    UNION ALL SELECT 1, 'comportamiento', 'Morder y mordisquear (cachorros)',
           'Cuando muerda las manos, retira la mano y deja de jugar unos segundos; ofrécele un juguete para morder. Premia cuando juegue con el juguete. Es normal en la etapa de dentición.', 'basico'
    UNION ALL SELECT 1, 'comportamiento', 'Socialización segura',
           'Preséntale personas, perros tranquilos, ruidos y lugares nuevos de forma gradual y con premios. Si muestra miedo, aumenta la distancia y no lo obligues a acercarse.', 'basico'
    UNION ALL SELECT 2, 'entrenamiento', 'Usar el rascador en lugar de los muebles',
           'Pon el rascador junto al mueble que araña, frótalo con hierba gatera y prémialo cuando lo use. Cubre temporalmente el mueble con cinta doble faz o una manta.', 'basico'
    UNION ALL SELECT 2, 'entrenamiento', 'Enseñar a venir con un sonido',
           'Asocia un sonido (un chasquido o agitar la bolsa de premios) con su comida o un premio favorito. Practica desde distancias cortas hasta que acuda en cualquier lugar de la casa.', 'basico'
    UNION ALL SELECT 2, 'comportamiento', 'Gatos que muerden al acariciarlos',
           'Observa las señales de que ya no quiere caricias: cola que se mueve, orejas hacia atrás, piel que se eriza. Acarícialo poco tiempo, sobre todo en la cabeza, y detente antes de que se incomode.', 'intermedio'
    UNION ALL SELECT 2, 'comportamiento', 'Actividad nocturna',
           'Juega con él 10 a 15 minutos antes de dormir con una caña o juguete que imite una presa y luego dale su comida. Así descarga energía y duerme mejor.', 'basico'
    UNION ALL SELECT NULL, 'comportamiento', 'Señales de estrés',
           'Esconderse, lamerse en exceso, jadear sin calor, no comer o hacer sus necesidades fuera de lugar pueden ser señales de estrés o de dolor. Si aparecen de repente o duran varios días, consulta al veterinario.', 'basico'
    UNION ALL SELECT NULL, 'entrenamiento', 'Reglas del refuerzo positivo',
           'Premia justo en el momento de la conducta (en 1 o 2 segundos), usa sesiones cortas que terminen con un éxito y sé constante con las palabras. Nunca uses castigos físicos: generan miedo y empeoran la conducta.', 'basico'
) g
WHERE NOT EXISTS (SELECT 1 FROM consejos_guias c WHERE c.titulo = g.titulo);
