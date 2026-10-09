-- Razas por especie para el formulario de mascotas.
-- INSERT IGNORE: se puede ejecutar varias veces sin duplicar
-- (la tabla tiene una llave única por especie + nombre).

INSERT IGNORE INTO razas (id_especie, nombre, tamano)
SELECT e.id_especie, r.nombre, r.tamano
FROM especies e
JOIN (
    -- PERROS
              SELECT 'Perro' AS especie, 'Criollo' AS nombre, 'mediano' AS tamano
    UNION ALL SELECT 'Perro', 'Akita', 'grande'
    UNION ALL SELECT 'Perro', 'Basset Hound', 'mediano'
    UNION ALL SELECT 'Perro', 'Beagle', 'mediano'
    UNION ALL SELECT 'Perro', 'Bichón Frisé', 'pequeño'
    UNION ALL SELECT 'Perro', 'Border Collie', 'mediano'
    UNION ALL SELECT 'Perro', 'Boxer', 'grande'
    UNION ALL SELECT 'Perro', 'Bull Terrier', 'mediano'
    UNION ALL SELECT 'Perro', 'Bulldog Francés', 'pequeño'
    UNION ALL SELECT 'Perro', 'Bulldog Inglés', 'mediano'
    UNION ALL SELECT 'Perro', 'Chihuahua', 'mini'
    UNION ALL SELECT 'Perro', 'Chow Chow', 'mediano'
    UNION ALL SELECT 'Perro', 'Cocker Spaniel', 'mediano'
    UNION ALL SELECT 'Perro', 'Dachshund (Salchicha)', 'pequeño'
    UNION ALL SELECT 'Perro', 'Dálmata', 'grande'
    UNION ALL SELECT 'Perro', 'Dóberman', 'grande'
    UNION ALL SELECT 'Perro', 'Golden Retriever', 'grande'
    UNION ALL SELECT 'Perro', 'Gran Danés', 'gigante'
    UNION ALL SELECT 'Perro', 'Husky Siberiano', 'grande'
    UNION ALL SELECT 'Perro', 'Jack Russell Terrier', 'pequeño'
    UNION ALL SELECT 'Perro', 'Labrador Retriever', 'grande'
    UNION ALL SELECT 'Perro', 'Maltés', 'mini'
    UNION ALL SELECT 'Perro', 'Pastor Alemán', 'grande'
    UNION ALL SELECT 'Perro', 'Pastor Belga Malinois', 'grande'
    UNION ALL SELECT 'Perro', 'Pinscher Miniatura', 'mini'
    UNION ALL SELECT 'Perro', 'Pitbull', 'mediano'
    UNION ALL SELECT 'Perro', 'Pomerania', 'mini'
    UNION ALL SELECT 'Perro', 'Poodle', 'pequeño'
    UNION ALL SELECT 'Perro', 'Pug', 'pequeño'
    UNION ALL SELECT 'Perro', 'Rottweiler', 'grande'
    UNION ALL SELECT 'Perro', 'Samoyedo', 'grande'
    UNION ALL SELECT 'Perro', 'San Bernardo', 'gigante'
    UNION ALL SELECT 'Perro', 'Schnauzer', 'mediano'
    UNION ALL SELECT 'Perro', 'Shar Pei', 'mediano'
    UNION ALL SELECT 'Perro', 'Shih Tzu', 'pequeño'
    UNION ALL SELECT 'Perro', 'Weimaraner', 'grande'
    UNION ALL SELECT 'Perro', 'Yorkshire Terrier', 'mini'

    -- GATOS
    UNION ALL SELECT 'Gato', 'Criollo', 'pequeño'
    UNION ALL SELECT 'Gato', 'Abisinio', 'pequeño'
    UNION ALL SELECT 'Gato', 'Angora', 'pequeño'
    UNION ALL SELECT 'Gato', 'Azul Ruso', 'pequeño'
    UNION ALL SELECT 'Gato', 'Bengalí', 'mediano'
    UNION ALL SELECT 'Gato', 'Bombay', 'pequeño'
    UNION ALL SELECT 'Gato', 'Británico de Pelo Corto', 'mediano'
    UNION ALL SELECT 'Gato', 'Esfinge', 'pequeño'
    UNION ALL SELECT 'Gato', 'Exótico de Pelo Corto', 'pequeño'
    UNION ALL SELECT 'Gato', 'Himalayo', 'pequeño'
    UNION ALL SELECT 'Gato', 'Maine Coon', 'mediano'
    UNION ALL SELECT 'Gato', 'Persa', 'pequeño'
    UNION ALL SELECT 'Gato', 'Ragdoll', 'mediano'
    UNION ALL SELECT 'Gato', 'Scottish Fold', 'pequeño'
    UNION ALL SELECT 'Gato', 'Siamés', 'pequeño'
    UNION ALL SELECT 'Gato', 'Siberiano', 'mediano'

    -- AVES
    UNION ALL SELECT 'Ave', 'Agapornis', 'mini'
    UNION ALL SELECT 'Ave', 'Cacatúa', 'pequeño'
    UNION ALL SELECT 'Ave', 'Canario', 'mini'
    UNION ALL SELECT 'Ave', 'Guacamaya', 'mediano'
    UNION ALL SELECT 'Ave', 'Loro', 'pequeño'
    UNION ALL SELECT 'Ave', 'Ninfa (Cocotilla)', 'mini'
    UNION ALL SELECT 'Ave', 'Periquito', 'mini'
    UNION ALL SELECT 'Ave', 'Pinzón', 'mini'

    -- CONEJOS
    UNION ALL SELECT 'Conejo', 'Criollo', 'pequeño'
    UNION ALL SELECT 'Conejo', 'Angora', 'pequeño'
    UNION ALL SELECT 'Conejo', 'Belier (Orejas caídas)', 'pequeño'
    UNION ALL SELECT 'Conejo', 'Cabeza de León', 'pequeño'
    UNION ALL SELECT 'Conejo', 'Enano Holandés', 'mini'
    UNION ALL SELECT 'Conejo', 'Gigante de Flandes', 'grande'
    UNION ALL SELECT 'Conejo', 'Holandés', 'pequeño'
    UNION ALL SELECT 'Conejo', 'Mini Rex', 'pequeño'

    -- OTROS
    UNION ALL SELECT 'Otro', 'Chinchilla', 'pequeño'
    UNION ALL SELECT 'Otro', 'Cobaya (Cuy)', 'pequeño'
    UNION ALL SELECT 'Otro', 'Erizo', 'mini'
    UNION ALL SELECT 'Otro', 'Hámster', 'mini'
    UNION ALL SELECT 'Otro', 'Hurón', 'pequeño'
    UNION ALL SELECT 'Otro', 'Pez', 'mini'
    UNION ALL SELECT 'Otro', 'Tortuga', 'pequeño'
) r ON r.especie = e.nombre;
