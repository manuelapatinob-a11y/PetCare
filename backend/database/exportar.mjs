// =====================================================
// Exporta la base de datos local (XAMPP / phpMyAdmin) a
// backend/database/petcare_completo.sql, lista para subirla a internet.
// Quita lo que solo funciona en tu PC (DEFINER de las vistas).
// Uso (desde la carpeta backend):  node database/exportar.mjs
// El archivo tiene datos de los usuarios: NO se sube a GitHub.
// =====================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import '../src/config/env.js';

const MYSQLDUMP = process.env.MYSQLDUMP || 'C:/xampp/mysql/bin/mysqldump.exe';
const salida = new URL('./petcare_completo.sql', import.meta.url);

let sql = execFileSync(MYSQLDUMP, [
    `--host=${process.env.MYSQL_HOST}`,
    `--port=${process.env.MYSQL_PORT}`,
    `--user=${process.env.MYSQL_USER}`,
    ...(process.env.MYSQL_PASSWORD ? [`--password=${process.env.MYSQL_PASSWORD}`] : []),
    '--single-transaction',
    '--skip-lock-tables',
    '--skip-add-locks',
    '--skip-comments',
    '--skip-triggers',
    '--hex-blob',
    '--default-character-set=utf8mb4',
    process.env.MYSQL_DATABASE,
], { maxBuffer: 1024 * 1024 * 1024 }).toString('utf8');


// Las vistas no deben depender del usuario de tu PC (root@localhost)
sql = sql
    .replace(/\/\*!50013 DEFINER=[^*]*\*\/\s*/g, '')
    .replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, '')
    .replace(/SQL SECURITY DEFINER/g, 'SQL SECURITY INVOKER');

fs.writeFileSync(salida, sql);

const tablas = (sql.match(/^CREATE TABLE/gm) || []).length;
const vistas = (sql.match(/VIEW `/g) || []).length;

console.log(`Listo: database/petcare_completo.sql (${(sql.length / 1024 / 1024).toFixed(2)} MB, ${tablas} tablas, ${vistas} vistas).`);
