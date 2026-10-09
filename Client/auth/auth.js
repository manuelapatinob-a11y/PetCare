/* ==================================
   FUNCIONES COMPARTIDAS: LOGIN Y REGISTRO
================================== */

// Dirección del backend (backend/.env -> PORT)
const API_URL = "http://localhost:4000";

// Página a la que se entra después de iniciar sesión
const PAGINA_INICIO = "../inicio/inicio.html";


/* ==================================
   MENSAJES
================================== */

function mostrarMensaje(texto, tipo = "error") {

    const caja = document.getElementById("mensaje");

    const icono =
        tipo === "error" ? "bi-exclamation-circle" : "bi-check-circle";

    caja.className = `alert-box show ${tipo}`;

    caja.innerHTML = `<i class="bi ${icono}"></i><span></span>`;

    caja.querySelector("span").textContent = texto;

    caja.scrollIntoView({ behavior: "smooth", block: "nearest" });

}


function ocultarMensaje() {

    document.getElementById("mensaje").className = "alert-box";

}


/* ==================================
   PETICIONES AL BACKEND
================================== */

async function enviarAlBackend(ruta, cuerpo) {


    const esFormulario = cuerpo instanceof FormData;

    let respuesta;


    try {

        respuesta = await fetch(API_URL + ruta, {
            method: "POST",
            headers: esFormulario ? {} : { "Content-Type": "application/json" },
            body: esFormulario ? cuerpo : JSON.stringify(cuerpo)
        });

    } catch {

        throw new Error(
            "No hay conexión con el servidor. Verifica que el backend esté encendido."
        );

    }


    const datos = await respuesta.json().catch(() => ({}));


    if (!respuesta.ok) {

        throw new Error(datos.message || "Ocurrió un error. Intenta de nuevo.");

    }


    return datos;

}


/* ==================================
   SESIÓN
================================== */

function guardarSesion(datos, recordar = true) {


    const almacen = recordar ? localStorage : sessionStorage;

    almacen.setItem("petcare_token", datos.token);

    almacen.setItem("petcare_usuario", JSON.stringify(datos.usuario));


    mostrarMensaje(`¡Hola, ${datos.usuario.nombres}! Entrando...`, "success");


    setTimeout(() => {

        window.location.href = PAGINA_INICIO;

    }, 900);

}


/* ==================================
   MOSTRAR / OCULTAR CONTRASEÑA
================================== */

document.querySelectorAll(".toggle-password").forEach(boton => {

    boton.addEventListener("click", () => {

        const input = boton.parentElement.querySelector("input");

        const visible = input.type === "text";

        input.type = visible ? "password" : "text";

        boton.innerHTML =
            `<i class="bi ${visible ? "bi-eye" : "bi-eye-slash"}"></i>`;

    });

});


/* ==================================
   GOOGLE
================================== */

function cargarScript(url) {

    return new Promise((resolve, reject) => {

        const script = document.createElement("script");

        script.src = url;

        script.onload = resolve;

        script.onerror = reject;

        document.head.appendChild(script);

    });

}


// true si no se pudo hablar con el backend al cargar la página
let sinConexion = false;


function botonNoConfigurado(contenedor, proveedor) {


    contenedor.innerHTML = `
        <button type="button" class="btn-social">
            <i class="bi bi-${proveedor.toLowerCase()}"></i>
            Continuar con ${proveedor}
        </button>
    `;


    contenedor.querySelector("button").addEventListener("click", () => {

        mostrarMensaje(
            sinConexion
                ? "No hay conexión con el servidor. Verifica que el backend esté encendido y recarga la página."
                : `El inicio con ${proveedor} todavía no está configurado en el servidor.`
        );

    });

}


async function iniciarGoogle(config) {


    const contenedor = document.getElementById("botonGoogle");


    if (!config.googleClientId) {

        botonNoConfigurado(contenedor, "Google");

        return;

    }


    await cargarScript("https://accounts.google.com/gsi/client");


    google.accounts.id.initialize({

        client_id: config.googleClientId,

        callback: async respuesta => {

            try {

                ocultarMensaje();

                const datos = await enviarAlBackend(
                    "/auth/google",
                    { credential: respuesta.credential }
                );

                guardarSesion(datos);

            } catch (error) {

                mostrarMensaje(error.message);

            }

        }

    });


    contenedor.innerHTML = "";


    google.accounts.id.renderButton(contenedor, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        locale: "es",
        width: Math.min(contenedor.offsetWidth || 240, 400)
    });

}


async function iniciarBotonesSociales() {


    let config = {};


    try {

        const respuesta = await fetch(API_URL + "/auth/config");

        config = await respuesta.json();

    } catch {

        // Sin backend se muestran los botones, y al hacer clic se avisa
        sinConexion = true;

    }


    iniciarGoogle(config).catch(() =>
        botonNoConfigurado(document.getElementById("botonGoogle"), "Google")
    );

}


iniciarBotonesSociales();
