// =====================================================
// Copia las fotos y documentos de backend/uploads a la tabla "archivos"
// (los que ya estén en la tabla no se repiten).
// Uso (desde la carpeta backend):  node database/subir_archivos.mjs
// =====================================================

import fs from 'node:fs';
import path from 'node:path';
import { connection } from '../src/config/mysql/dbmysql.js';
import { carpetaUploads } from '../src/utils/fotos.js';

const TIPOS = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' };

let nuevos = 0;

for (const carpeta of fs.readdirSync(carpetaUploads, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    for (const nombre of fs.readdirSync(path.join(carpetaUploads, carpeta.name))) {
        const tipo = TIPOS[path.extname(nombre).toLowerCase()];

        if (!tipo) continue;

        const datos = fs.readFileSync(path.join(carpetaUploads, carpeta.name, nombre));

        const [resultado] = await connection.query(
            'INSERT IGNORE INTO archivos (ruta, tipo, datos, tamano) VALUES (?, ?, ?, ?)',
            [`/uploads/${carpeta.name}/${nombre}`, tipo, datos, datos.length]
        );

        nuevos += resultado.affectedRows;
    }
}

const [[total]] = await connection.query('SELECT COUNT(*) AS n, COALESCE(SUM(tamano), 0) AS bytes FROM archivos');

console.log(`Archivos copiados: ${nuevos}. En la base de datos hay ${total.n} (${(total.bytes / 1024).toFixed(0)} KB).`);

process.exit(0);
