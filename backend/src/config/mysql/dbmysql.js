import mysql from 'mysql2/promise';
import '../env.js';

const database = process.env.MYSQL_DATABASE;
const username = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const host = process.env.MYSQL_HOST;
const port = process.env.MYSQL_PORT;

// Pool de conexiones: reutiliza conexiones para cada consulta
const connection = mysql.createPool(
    {
        host: host,
        user: username,
        password: password,
        database: database,
        port: Number(port),
        waitForConnections: true,
        connectionLimit: 10,
    }
);


const dbConnectMysql = async () => {
    try {
        // Consulta de prueba para verificar que la conexión funciona
        await connection.query('SELECT 1');
        console.log(`Conectado a la base de datos mysql: ${database}`);
    } catch (error) {
        console.error('No se pudo conectar a MySQL:', error.message);
        throw error;
    }
}

export { connection, dbConnectMysql };
