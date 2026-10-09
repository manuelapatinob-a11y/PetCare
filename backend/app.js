import './src/config/env.js';
import Server from './src/server/express.server.js';
import { dbConnectMysql } from './src/config/mysql/dbmysql.js';


async function main() {
    try {
        // Conexión a la base de datos
        //await dbConnectMongoose();
        await dbConnectMysql();


        const server = new Server();
        await server.start();
    } catch (error) {
        console.error('Error al iniciar la aplicación:', error.message);
        process.exit(1);
    }
}

// Manejo de errores e inicio del servidor
main().catch(
    (error) => {
        console.error('Error fatal:', error);
        process.exit(1);
    }
);
