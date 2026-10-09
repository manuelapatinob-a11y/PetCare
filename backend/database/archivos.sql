-- =====================================================
-- PETCARE - ARCHIVOS SUBIDOS (fotos y documentos)
-- Se guardan en la base de datos para que no se pierdan
-- en servidores gratuitos que borran su disco al reiniciar.
-- Se puede ejecutar varias veces.
-- =====================================================

CREATE TABLE IF NOT EXISTS archivos (
    ruta       VARCHAR(255) NOT NULL COMMENT 'Ruta pública: /uploads/<carpeta>/<nombre>',
    tipo       VARCHAR(60)  NOT NULL,
    datos      LONGBLOB     NOT NULL,
    tamano     INT          NOT NULL,
    fecha      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ruta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
