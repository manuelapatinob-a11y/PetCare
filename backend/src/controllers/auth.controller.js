import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { connection } from '../config/mysql/dbmysql.js';
import { errorFoto, guardarFoto } from '../utils/fotos.js';

const scrypt = promisify(crypto.scrypt);


/* ==================================
   CONTRASEÑAS
================================== */

// Se guarda como "scrypt$sal$hash", nunca la contraseña en texto plano
export async function crearHash(contrasena) {
    const sal = crypto.randomBytes(16).toString('hex');
    const hash = await scrypt(contrasena, sal, 64);
    return `scrypt$${sal}$${hash.toString('hex')}`;
}

export async function verificarHash(contrasena, guardado) {
    const [algoritmo, sal, hash] = guardado.split('$');

    // Las cuentas de Google no tienen contraseña
    if (algoritmo !== 'scrypt' || !sal || !hash) {
        return false;
    }

    const calculado = await scrypt(contrasena, sal, 64);
    const esperado = Buffer.from(hash, 'hex');

    return esperado.length === calculado.length
        && crypto.timingSafeEqual(calculado, esperado);
}

export function contrasenaSegura(contrasena) {
    return contrasena.length >= 8
        && /[A-Z]/.test(contrasena)
        && /[0-9]/.test(contrasena)
        && /[^A-Za-z0-9]/.test(contrasena);
}


/* ==================================
   AYUDAS
================================== */

function texto(valor, maximo) {
    return String(valor ?? '').trim().slice(0, maximo);
}

// Datos del usuario que se pueden enviar al navegador (sin el hash)
export function usuarioPublico(usuario) {
    return {
        id: usuario.id_usuario,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        ciudad: usuario.ciudad,
        foto_perfil: usuario.foto_perfil,
    };
}

async function buscarPorCorreo(correo) {
    const [filas] = await connection.query(
        'SELECT * FROM usuarios WHERE correo = ? LIMIT 1',
        [correo]
    );
    return filas[0];
}

// Crea una sesión y responde con el token y los datos del usuario
async function iniciarSesion(req, res, usuario, estado = 200) {
    const token = crypto.randomBytes(32).toString('hex');

    await connection.query(
        'INSERT INTO sesiones (id_usuario, token_sesion, ip, dispositivo) VALUES (?, ?, ?, ?)',
        [usuario.id_usuario, token, req.ip, texto(req.get('user-agent'), 150)]
    );

    await connection.query(
        'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?',
        [usuario.id_usuario]
    );

    // El tema elegido en Configuración se aplica desde que inicia sesión
    const [[config]] = await connection.query(
        'SELECT tema FROM configuracion_usuario WHERE id_usuario = ?',
        [usuario.id_usuario]
    );

    res.status(estado).json({ token, usuario: { ...usuarioPublico(usuario), tema: config?.tema || 'claro' } });
}

// Busca el usuario por correo o lo crea si es la primera vez que entra con Google
async function usuarioExterno(datos) {
    const existente = await buscarPorCorreo(datos.correo);

    if (existente) {
        return existente;
    }

    const [resultado] = await connection.query(
        `INSERT INTO usuarios (nombres, apellidos, correo, contrasena_hash, foto_perfil)
         VALUES (?, ?, ?, ?, ?)`,
        [
            texto(datos.nombres, 80) || 'Usuario',
            texto(datos.apellidos, 80),
            datos.correo,
            `${datos.proveedor}$sin-contrasena`,
            datos.foto ? texto(datos.foto, 255) : null,
        ]
    );

    const [filas] = await connection.query(
        'SELECT * FROM usuarios WHERE id_usuario = ?',
        [resultado.insertId]
    );
    return filas[0];
}

/* ==================================
   CONTROLADORES
================================== */

// GET /auth/config: datos públicos para el botón de Google
export function configuracion(req, res) {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    });
}


// POST /auth/registro
export async function registro(req, res) {
    try {
        const datos = {
            nombres: texto(req.body.nombres, 80),
            apellidos: texto(req.body.apellidos, 80),
            correo: texto(req.body.correo, 120).toLowerCase(),
            telefono: texto(req.body.telefono, 20),
            direccion: texto(req.body.direccion, 150),
            ciudad: texto(req.body.ciudad, 80) || 'Medellín',
        };
        const contrasena = String(req.body.contrasena ?? '');

        if (!datos.nombres || !datos.apellidos || !datos.correo || !contrasena) {
            return res.status(400).json({ message: 'Nombres, apellidos, correo y contraseña son obligatorios.' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
            return res.status(400).json({ message: 'El correo no es válido.' });
        }

        if (!contrasenaSegura(contrasena)) {
            return res.status(400).json({
                message: 'La contraseña debe tener 8 caracteres, una mayúscula, un número y un carácter especial.',
            });
        }

        const foto = req.files?.foto_perfil;

        if (foto && errorFoto(foto)) {
            return res.status(400).json({ message: errorFoto(foto) });
        }

        if (await buscarPorCorreo(datos.correo)) {
            return res.status(409).json({ message: 'Ya existe una cuenta con ese correo.' });
        }

        const contrasenaHash = await crearHash(contrasena);
        const fotoPerfil = foto ? await guardarFoto(foto, 'perfiles') : null;

        const [resultado] = await connection.query(
            `INSERT INTO usuarios
                (nombres, apellidos, correo, contrasena_hash, telefono, direccion, ciudad, foto_perfil)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                datos.nombres,
                datos.apellidos,
                datos.correo,
                contrasenaHash,
                datos.telefono || null,
                datos.direccion || null,
                datos.ciudad,
                fotoPerfil,
            ]
        );

        const [filas] = await connection.query(
            'SELECT * FROM usuarios WHERE id_usuario = ?',
            [resultado.insertId]
        );

        await iniciarSesion(req, res, filas[0], 201);
    } catch (error) {
        console.error('Error en el registro:', error.message);
        res.status(500).json({ message: 'No se pudo crear la cuenta. Intenta de nuevo.' });
    }
}


// POST /auth/login
export async function login(req, res) {
    try {
        const correo = texto(req.body.correo, 120).toLowerCase();
        const contrasena = String(req.body.contrasena ?? '');

        if (!correo || !contrasena) {
            return res.status(400).json({ message: 'Ingresa tu correo y tu contraseña.' });
        }

        const usuario = await buscarPorCorreo(correo);

        if (!usuario || !(await verificarHash(contrasena, usuario.contrasena_hash))) {
            return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
        }

        if (!usuario.activo) {
            return res.status(403).json({ message: 'Esta cuenta está desactivada.' });
        }

        await iniciarSesion(req, res, usuario);
    } catch (error) {
        console.error('Error en el login:', error.message);
        res.status(500).json({ message: 'No se pudo iniciar sesión. Intenta de nuevo.' });
    }
}


// POST /auth/google: recibe el token que entrega el botón de Google
export async function google(req, res) {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;

        if (!clientId) {
            return res.status(501).json({ message: 'El inicio de sesión con Google no está configurado.' });
        }

        const credencial = String(req.body.credential ?? '');

        // Google verifica la firma del token y nos devuelve sus datos
        const respuesta = await fetch(
            'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credencial)
        );
        const datos = await respuesta.json();

        if (!respuesta.ok || datos.aud !== clientId || datos.email_verified !== 'true') {
            return res.status(401).json({ message: 'No se pudo verificar tu cuenta de Google.' });
        }

        const usuario = await usuarioExterno({
            proveedor: 'google',
            correo: datos.email.toLowerCase(),
            nombres: datos.given_name || datos.name,
            apellidos: datos.family_name,
            foto: datos.picture,
        });

        if (!usuario.activo) {
            return res.status(403).json({ message: 'Esta cuenta está desactivada.' });
        }

        await iniciarSesion(req, res, usuario);
    } catch (error) {
        console.error('Error con Google:', error.message);
        res.status(500).json({ message: 'No se pudo iniciar sesión con Google.' });
    }
}



// POST /auth/logout: cierra la sesión del token enviado
export async function logout(req, res) {
    try {
        await connection.query(
            'UPDATE sesiones SET fecha_cierre = NOW() WHERE token_sesion = ? AND fecha_cierre IS NULL',
            [req.token]
        );
        res.json({ message: 'Sesión cerrada.' });
    } catch (error) {
        console.error('Error al cerrar sesión:', error.message);
        res.status(500).json({ message: 'No se pudo cerrar la sesión.' });
    }
}
