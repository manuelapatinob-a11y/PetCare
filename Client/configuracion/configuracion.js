// =========================================
// PETCARE - CONFIGURACIÓN
// Usa ../auth/sesion.js (peticion, urlFoto, aplicarTema, borrarSesion)
// =========================================


const EMOJI = { Perro: "🐶", Gato: "🐱", Ave: "🐦", Conejo: "🐰", Otro: "🐾" };

let datos = null;


// =========================================
// AYUDAS
// =========================================

function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto ?? "";

    return div.innerHTML;

}


function mostrarAviso(texto, tipo = "danger") {

    const aviso = document.getElementById("mensaje");

    aviso.className = `alert alert-${tipo}`;

    aviso.textContent = texto;

    if (tipo === "success") {

        clearTimeout(mostrarAviso.espera);

        mostrarAviso.espera = setTimeout(() => aviso.classList.add("d-none"), 3500);

    }

}


// "Mozilla/5.0 (Windows NT 10.0...) Chrome/..." -> "Chrome en Windows"
function nombreDispositivo(texto) {

    const t = texto || "";

    const navegador = /Edg\//.test(t) ? "Edge" : /OPR\//.test(t) ? "Opera" : /Chrome\//.test(t) ? "Chrome"
        : /Firefox\//.test(t) ? "Firefox" : /Safari\//.test(t) ? "Safari" : "Navegador";

    const sistema = /Android/.test(t) ? "Android" : /iPhone|iPad/.test(t) ? "iPhone / iPad" : /Windows/.test(t) ? "Windows"
        : /Mac OS/.test(t) ? "Mac" : /Linux/.test(t) ? "Linux" : "dispositivo desconocido";

    return { texto: `${navegador} en ${sistema}`, movil: /Android|iPhone|iPad/.test(t) };

}


// =========================================
// SECCIONES (menú de la izquierda)
// =========================================

function mostrarSeccion(seccion) {


    const valida = document.querySelector(`[data-panel-config="${seccion}"]`) ? seccion : "notificaciones";


    document.querySelectorAll("[data-seccion]").forEach(enlace => {

        enlace.classList.toggle("active", enlace.dataset.seccion === valida);

        enlace.setAttribute("aria-current", enlace.dataset.seccion === valida ? "page" : "false");

    });

    document.querySelectorAll("[data-panel-config]").forEach(panel => {

        panel.classList.toggle("d-none", panel.dataset.panelConfig !== valida);

    });

}


window.addEventListener("hashchange", () => mostrarSeccion(location.hash.slice(1)));


// =========================================
// DIBUJAR
// =========================================

function dibujar() {


    const c = datos.configuracion;


    // Notificaciones
    ["notif_correo", "notif_recordatorios", "notif_comidas"].forEach(id => {

        document.getElementById(id).checked = c[id];

    });

    document.getElementById("estadoCorreo").innerHTML = datos.correoConfigurado
        ? `
            <div>
                <strong><i class="bi bi-envelope-check"></i> Los correos llegan a ${escaparHTML(datos.correo)}</strong>
                <small>¿No te llegan? Revisa la carpeta de spam o envía uno de prueba. Para cambiar el correo ve a <a href="../perfil/perfil.html">Mi perfil</a>.</small>
            </div>
            <button type="button" class="btn-light-action" id="correoPrueba">
                <i class="bi bi-send"></i>
                Enviar correo de prueba
            </button>
        `
        : `
            <div>
                <strong class="text-warning-emphasis"><i class="bi bi-exclamation-triangle"></i> El correo del servidor no está configurado</strong>
                <small>Por ahora los avisos solo se ven en la campanita (falta SMTP en backend/.env).</small>
            </div>
        `;


    // Apariencia
    const tema = document.querySelector(`input[name="tema"][value="${localStorage.getItem("petcare_tema") || c.tema}"]`);

    if (tema) tema.checked = true;


    // Seguridad
    document.getElementById("textoContrasena").textContent = datos.tiene_contrasena ? "Cambiar contraseña" : "Crear una contraseña";

    const otras = datos.sesiones.filter(s => !s.actual).length;

    document.getElementById("cerrarOtras").disabled = !otras;

    document.getElementById("sesiones").innerHTML = `
        <div class="sessions">
            ${datos.sesiones.map(s => {
                const d = nombreDispositivo(s.dispositivo);
                return `
                    <div class="session ${s.actual ? "current" : ""}">
                        <span class="record-icon ${s.actual ? "green" : "gray"}"><i class="bi ${d.movil ? "bi-phone" : "bi-laptop"}"></i></span>
                        <span class="session-body">
                            <strong>${escaparHTML(d.texto)} ${s.actual ? '<span class="badge-soft green">Este dispositivo</span>' : ""}</strong>
                            <small>Desde ${new Date(s.fecha_inicio).toLocaleString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}${s.ip ? ` · IP ${escaparHTML(s.ip.replace("::ffff:", ""))}` : ""}</small>
                        </span>
                        ${s.actual ? "" : `<button type="button" class="btn-light-action" data-cerrar-sesion-id="${s.id_sesion}">Cerrar</button>`}
                    </div>
                `;
            }).join("")}
        </div>
    `;


    // Mascotas eliminadas
    document.getElementById("eliminadas").innerHTML = datos.eliminadas.length
        ? `<div class="sessions">
               ${datos.eliminadas.map(m => {
                   const foto = urlFoto(m.foto);
                   return `
                       <div class="session">
                           <span class="pet-chip-photo">${foto ? `<img src="${escaparHTML(foto)}" alt="">` : EMOJI[m.especie] || "🐾"}</span>
                           <span class="session-body">
                               <strong>${escaparHTML(m.nombre)}</strong>
                               <small>${escaparHTML(m.especie)}</small>
                           </span>
                           <button type="button" class="btn-light-action" data-restaurar="${m.id_mascota}">
                               <i class="bi bi-arrow-counterclockwise"></i> Recuperar
                           </button>
                       </div>
                   `;
               }).join("")}
           </div>`
        : '<p class="records-empty"><i class="bi bi-check2-circle"></i> No tienes mascotas eliminadas.</p>';


    // Cuenta
    document.getElementById("textoCuenta").textContent = `Sesión iniciada como ${datos.correo}.`;

    document.getElementById("etiquetaConfirmacion").textContent = datos.tiene_contrasena
        ? "Escribe tu contraseña para confirmar"
        : "Escribe DESACTIVAR para confirmar";

    document.getElementById("confirmacionCuenta").type = datos.tiene_contrasena ? "password" : "text";

}


async function cargar() {

    try {

        datos = await peticion("/usuario/configuracion");

        dibujar();

    } catch (e) {

        mostrarAviso(e.message);

    }

}


// =========================================
// GUARDAR (cada cambio se guarda solo)
// =========================================

async function guardar() {


    const formulario = new FormData();

    ["notif_correo", "notif_recordatorios", "notif_comidas"].forEach(id => {

        formulario.append(id, document.getElementById(id).checked ? "1" : "0");

    });

    const tema = document.querySelector('input[name="tema"]:checked')?.value || "claro";

    formulario.append("tema", tema);


    // El tema se ve de una vez, sin esperar al servidor
    aplicarTema(tema);


    try {

        const respuesta = await peticion("/usuario/configuracion", { method: "PUT", body: formulario });

        datos.configuracion = respuesta.configuracion;

        mostrarAviso(respuesta.message, "success");

    } catch (e) {

        mostrarAviso(e.message);

        dibujar();

    }

}


document.querySelectorAll("[data-guardar]").forEach(control => control.addEventListener("change", guardar));


// =========================================
// BOTONES
// =========================================

document.addEventListener("click", async event => {


    const prueba = event.target.closest("#correoPrueba");

    const cerrarUna = event.target.closest("[data-cerrar-sesion-id]");

    const cerrarOtras = event.target.closest("#cerrarOtras");

    const restaurar = event.target.closest("[data-restaurar]");


    try {

        if (prueba) {

            prueba.disabled = true;

            prueba.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando...';

            const respuesta = await peticion("/usuario/correo-prueba", { method: "POST" });

            mostrarAviso(respuesta.message, "success");

            dibujar();

        } else if (cerrarUna || cerrarOtras) {

            if (cerrarOtras && !confirm("¿Cerrar tu sesión en todos los demás dispositivos?")) return;

            const ruta = cerrarUna ? `/usuario/sesiones/${cerrarUna.dataset.cerrarSesionId}` : "/usuario/sesiones";

            const respuesta = await peticion(ruta, { method: "DELETE" });

            await cargar();

            mostrarAviso(respuesta.message, "success");

        } else if (restaurar) {

            const respuesta = await peticion(`/usuario/mascotas/${restaurar.dataset.restaurar}/restaurar`, { method: "PUT" });

            await cargar();

            mostrarAviso(respuesta.message, "success");

        }

    } catch (e) {

        mostrarAviso(e.message);

        if (prueba) dibujar();

    }

});


document.getElementById("formDesactivar").addEventListener("submit", async event => {


    event.preventDefault();

    const error = document.getElementById("errorDesactivar");

    error.classList.add("d-none");

    const valor = document.getElementById("confirmacionCuenta").value;


    if (!valor.trim()) {

        error.textContent = datos.tiene_contrasena ? "Escribe tu contraseña." : "Escribe DESACTIVAR.";

        error.classList.remove("d-none");

        return;

    }


    if (!confirm("¿Seguro que quieres desactivar tu cuenta? Ya no podrás entrar a PetCare.")) return;


    const formulario = new FormData();

    formulario.append(datos.tiene_contrasena ? "contrasena" : "confirmacion", valor);


    try {

        await peticion("/usuario/desactivar", { method: "POST", body: formulario });

        borrarSesion();

        window.location.replace(PAGINA_LOGIN);

    } catch (e) {

        error.textContent = e.message;

        error.classList.remove("d-none");

    }

});


mostrarSeccion(location.hash.slice(1));

cargar();
