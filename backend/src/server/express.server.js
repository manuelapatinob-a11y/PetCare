import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import router from '../routes/index.js';
import { carpetaUploads } from '../utils/fotos.js';

//como numero de telefono el que sirve la ifnromacion
//y que se puede hacer
class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.middleware();//las validaciones que necesita la app
        //codigo que se ejecuta antes de que pase algo
        this.routes();//canales por los cuales se va a comunicar la app
        this.handleErrors();
    }

    middleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        // Archivos de máximo 5 MB (las fotos de perfil y mascotas se limitan a 2 MB)
        this.app.use(fileUpload({ limits: { fileSize: 5 * 1024 * 1024 } }));
        // Fotos de perfil subidas por los usuarios
        this.app.use('/uploads', express.static(carpetaUploads));
    }

    routes() {
        // Carga automática de las rutas que estén en src/routes/<carpeta>/<archivo>.js
        this.app.use('/', router);
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`Conectado al puerto ${this.port}`);
        });
    }

    handleErrors() {
        this.app.use((err, req, res, next) => {
            if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
                console.error("JSON inválido en la petición:", err.message);
                return res.status(400).json({ message: "JSON inválido en la petición" });
            }
            next(err);
        });
    }
}

export default Server;
