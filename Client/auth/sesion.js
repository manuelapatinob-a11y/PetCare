/* ==================================
   SESIÓN DEL USUARIO
   Se usa en las páginas internas de PetCare
================================== */

// Dirección del backend:
// - En internet (Render) la página y el backend están en el mismo sitio.
// - En tu PC con Live Server (puerto 5500) el backend está en localhost:4000.
const API_URL = ["localhost", "127.0.0.1"].includes(location.hostname) && location.port !== "4000"
    ? "http://localhost:4000"
    : location.origin;

// Rutas calculadas desde la ubicación de este archivo (Client/auth/)
const RUTA_SESION = document.currentScript.src;

const INICIO_CON_SESION =
    new URL("../inicio/inicio.html", RUTA_SESION).href;

const PAGINA_LOGIN =
    new URL("../login/login.html", RUTA_SESION).href;


/* ==================================
   DATOS GUARDADOS AL INICIAR SESIÓN
================================== */

function obtenerToken() {

    return localStorage.getItem("petcare_token")
        || sessionStorage.getItem("petcare_token");

}


function obtenerUsuario() {

    try {

        return JSON.parse(
            localStorage.getItem("petcare_usuario")
            || sessionStorage.getItem("petcare_usuario")
        );

    } catch {

        return null;

    }

}


function borrarSesion() {

    ["petcare_token", "petcare_usuario", "petcare_tema"].forEach(clave => {

        localStorage.removeItem(clave);

        sessionStorage.removeItem(clave);

    });

}


// Para páginas que solo se pueden ver con sesión iniciada
function requiereSesion() {

    if (!obtenerToken()) {

        window.location.replace(PAGINA_LOGIN);

    }

}


// Las fotos guardadas en el backend empiezan por /uploads
function urlFoto(ruta) {

    if (!ruta) {

        return null;

    }

    return ruta.startsWith("/uploads") ? API_URL + ruta : ruta;

}


/* ==================================
   PETICIONES AL BACKEND CON EL TOKEN
================================== */

async function peticion(ruta, opciones = {}) {


    let respuesta;


    try {

        respuesta = await fetch(API_URL + ruta, {
            ...opciones,
            headers: {
                ...(opciones.headers || {}),
                Authorization: `Bearer ${obtenerToken()}`
            }
        });

    } catch {

        throw new Error(
            "No hay conexión con el servidor. Verifica que el backend esté encendido."
        );

    }


    const datos = await respuesta.json().catch(() => ({}));


    // Sesión vencida o cerrada: volver al login
    if (respuesta.status === 401) {

        borrarSesion();

        window.location.replace(PAGINA_LOGIN);

        throw new Error(datos.message || "Debes iniciar sesión.");

    }


    if (!respuesta.ok) {

        throw new Error(datos.message || "Ocurrió un error. Intenta de nuevo.");

    }


    return datos;

}


async function cerrarSesion() {


    try {

        await peticion("/auth/logout", { method: "POST" });

    } catch {

        // Aunque falle el servidor, la sesión se borra del navegador
    }


    borrarSesion();

    window.location.href = PAGINA_LOGIN;

}


/* ==================================
   CON SESIÓN: "INICIO" LLEVA AL INICIO DEL USUARIO
================================== */

function ajustarEnlacesInicio() {


    document.querySelectorAll("a[href]").forEach(enlace => {

        const destino = new URL(enlace.getAttribute("href"), window.location.href);

        if (destino.pathname.endsWith("/index.html")) {

            enlace.href = INICIO_CON_SESION;

        }

    });

}


/* ==================================
   DATOS DEL USUARIO EN EL ENCABEZADO
   (elementos con data-usuario-nombre, data-usuario-avatar
   y data-cerrar-sesion)
================================== */

function mostrarUsuario() {


    const usuario = obtenerUsuario();


    if (!usuario) {

        return;

    }


    const nombreCorto =
        `${usuario.nombres.split(" ")[0]} ${(usuario.apellidos || "").charAt(0)}.`.trim();


    document.querySelectorAll("[data-usuario-nombre]").forEach(elemento => {

        elemento.textContent = nombreCorto;

    });


    document.querySelectorAll("[data-usuario-saludo]").forEach(elemento => {

        elemento.textContent = usuario.nombres.split(" ")[0];

    });


    document.querySelectorAll("[data-usuario-avatar]").forEach(elemento => {

        const foto = urlFoto(usuario.foto_perfil);

        if (foto) {

            elemento.textContent = "";

            elemento.style.backgroundImage = `url("${foto}")`;

            elemento.classList.add("con-foto");

        } else {

            // Sin foto (o se acaba de quitar): iniciales
            elemento.style.backgroundImage = "";

            elemento.classList.remove("con-foto");

            elemento.textContent =
                (usuario.nombres.charAt(0) + (usuario.apellidos || "").charAt(0)).toUpperCase();

        }

    });

}


/* ==================================
   CAMPANITA DE NOTIFICACIONES (../comun/campana.js)
================================== */

function cargarCampana() {


    const estilos = document.createElement("link");

    estilos.rel = "stylesheet";

    estilos.href = new URL("../comun/campana.css", RUTA_SESION).href;

    document.head.appendChild(estilos);


    const script = document.createElement("script");

    script.src = new URL("../comun/campana.js", RUTA_SESION).href;

    document.body.appendChild(script);

}


/* ==================================
   DATOS DEL USUARIO ACTUALIZADOS (después de editar el perfil)
================================== */

function guardarUsuario(usuario) {

    const almacen = localStorage.getItem("petcare_usuario") ? localStorage : sessionStorage;

    almacen.setItem("petcare_usuario", JSON.stringify(usuario));

    mostrarUsuario();

}


/* ==================================
   TEMA CLARO U OSCURO (Configuración)
   Se aplica apenas carga la página para que no parpadee
================================== */

function aplicarTema(tema) {

    if (tema) {

        localStorage.setItem("petcare_tema", tema);

    }

    const elegido = localStorage.getItem("petcare_tema") || obtenerUsuario()?.tema || "claro";

    const oscuro = elegido === "oscuro"
        || (elegido === "sistema" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

    document.documentElement.dataset.tema = oscuro ? "oscuro" : "claro";

}


(function cargarTema() {

    const estilos = document.createElement("link");

    estilos.rel = "stylesheet";

    estilos.href = new URL("../comun/tema.css", RUTA_SESION).href;

    document.head.appendChild(estilos);

    if (obtenerToken()) {

        aplicarTema();

    }

})();


document.addEventListener("DOMContentLoaded", () => {


    document.querySelectorAll("[data-cerrar-sesion]").forEach(boton => {

        boton.addEventListener("click", event => {

            event.preventDefault();

            cerrarSesion();

        });

    });


    if (obtenerToken()) {

        ajustarEnlacesInicio();

        mostrarUsuario();

        cargarCampana();

    }

});
