// =====================================================
// Sube backend/database/petcare_completo.sql a la base de datos de internet.
// Los datos de conexión se leen de backend/.env.produccion
// (MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_SSL).
// Uso (desde la carpeta backend):  node database/importar.mjs
// =====================================================

import fs from 'node:fs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const archivoEnv = new URL('../.env.produccion', import.meta.url);

if (!fs.existsSync(archivoEnv)) {
    console.error('Falta el archivo backend/.env.produccion con los datos de la base de datos de internet.');
    process.exit(1);
}

const env = dotenv.parse(fs.readFileSync(archivoEnv));
const sql = fs.readFileSync(new URL('./petcare_completo.sql', import.meta.url), 'utf8');

const conexion = await mysql.createConnection({
    host: env.MYSQL_HOST,
    port: Number(env.MYSQL_PORT),
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    ssl: env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
});

console.log(`Conectado a ${env.MYSQL_HOST}. Subiendo la base de datos (puede tardar un poco)...`);

await conexion.query("SET time_zone = '-05:00'; SET FOREIGN_KEY_CHECKS = 0;");
await conexion.query(sql);
await conexion.query('SET FOREIGN_KEY_CHECKS = 1;');

const [tablas] = await conexion.query(
    `SELECT table_name AS nombre, table_rows AS filas, table_type AS tipo
     FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name`
);

const [[usuarios]] = await conexion.query('SELECT COUNT(*) AS n FROM usuarios');
const [[archivos]] = await conexion.query('SELECT COUNT(*) AS n FROM archivos');

console.log(`Listo: ${tablas.filter((t) => t.tipo === 'BASE TABLE').length} tablas y ${tablas.filter((t) => t.tipo === 'VIEW').length} vistas.`);
console.log(`Usuarios: ${usuarios.n}. Fotos y documentos: ${archivos.n}.`);

await conexion.end();
