// =========================================
// PETCARE - MI PERFIL
// Usa ../auth/sesion.js (peticion, urlFoto, guardarUsuario)
// =========================================


const EMOJI = { Perro: "🐶", Gato: "🐱", Ave: "🐦", Conejo: "🐰", Otro: "🐾" };

const CAMPOS = ["nombres", "apellidos", "correo", "telefono", "direccion", "ciudad"];

let perfil = null;


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

    aviso.scrollIntoView({ behavior: "smooth", block: "nearest" });

    if (tipo === "success") {

        setTimeout(() => aviso.classList.add("d-none"), 3500);

    }

}


function mostrarError(id, texto) {

    const error = document.getElementById(id);

    error.textContent = texto;

    error.classList.toggle("d-none", !texto);

}


function iniciales(u) {

    return (u.nombres.charAt(0) + (u.apellidos || "").charAt(0)).toUpperCase();

}


// =========================================
// DIBUJAR
// =========================================

function dibujarTarjeta() {


    const u = perfil.usuario;

    const foto = urlFoto(u.foto_perfil);

    const r = perfil.resumen;

    const desde = new Date(u.fecha_registro).toLocaleDateString("es-CO", { month: "long", year: "numeric" });


    const dato = (enlace, icono, valor, texto) => `
        <a class="profile-stat" href="${enlace}">
            <i class="bi ${icono}"></i>
            <strong>${valor}</strong>
            <span>${texto}</span>
        </a>
    `;


    document.getElementById("tarjeta").innerHTML = `

        <div class="profile-main">

            <div class="profile-photo-box">
                <div class="profile-photo ${foto ? "has-photo" : ""}" ${foto ? `style="background-image: url('${escaparHTML(foto)}')"` : ""}>
                    ${foto ? "" : iniciales(u)}
                </div>

                <button type="button" class="photo-edit" id="botonFoto" title="Cambiar foto" aria-label="Cambiar foto de perfil">
                    <i class="bi bi-camera"></i>
                </button>
            </div>

            <div>
                <h3>${escaparHTML(`${u.nombres} ${u.apellidos}`)}</h3>
                <p><i class="bi bi-envelope"></i> ${escaparHTML(u.correo)}</p>
                <p>
                    ${u.ciudad ? `<i class="bi bi-geo-alt"></i> ${escaparHTML(u.ciudad)} · ` : ""}
                    Miembro desde ${desde}
                </p>
                <div class="badges">
                    ${u.con_google ? '<span class="badge-soft blue"><i class="bi bi-google"></i> Cuenta de Google</span>' : ""}
                    ${foto ? '<button type="button" class="link-button" id="botonQuitarFoto"><i class="bi bi-x-circle"></i> Quitar foto</button>' : ""}
                </div>
            </div>

        </div>

        <div class="profile-stats">
            ${dato("../mismascotas/mismascotas.html", "bi-heart", perfil.mascotas.length, perfil.mascotas.length === 1 ? "mascota" : "mascotas")}
            ${dato("../recordatorios/recordatorios.html", "bi-bell", r.recordatorios, "recordatorios pendientes")}
            ${dato("../salud/salud.html", "bi-calendar-check", r.citas, r.citas === 1 ? "cita próxima" : "citas próximas")}
            ${dato("../finanzas/finanzas.html", "bi-wallet2",
                r.gastos_mes.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }), "gastado este mes")}
        </div>
    `;

}


function dibujarMascotas() {


    document.getElementById("misMascotas").innerHTML = `

        <div class="list-header">
            <div>
                <h3><i class="bi bi-heart"></i> Mis mascotas</h3>
                <p>Toca una para ver su salud.</p>
            </div>

            <a class="btn-add-small" href="../mismascotas/mismascotas.html">
                <i class="bi bi-pencil"></i>
                <span>Administrar</span>
            </a>
        </div>

        ${perfil.mascotas.length
            ? `<div class="mini-pets">
                   ${perfil.mascotas.map(m => {
                       const foto = urlFoto(m.foto);
                       return `
                           <a class="mini-pet" href="../salud/salud.html?mascota=${m.id_mascota}">
                               <span class="pet-chip-photo">${foto ? `<img src="${escaparHTML(foto)}" alt="">` : EMOJI[m.especie] || "🐾"}</span>
                               <span>
                                   <strong>${escaparHTML(m.nombre)}</strong>
                                   <small>${escaparHTML(m.raza || m.especie)}</small>
                               </span>
                           </a>
                       `;
                   }).join("")}
               </div>`
            : '<p class="records-empty">Aún no tienes mascotas. <a href="../mismascotas/mismascotas.html">Agrega la primera</a>.</p>'}
    `;

}


function llenarFormulario() {


    CAMPOS.forEach(campo => {

        document.getElementById(campo).value = perfil.usuario[campo] ?? "";

    });

    document.getElementById("contrasena_actual").value = "";

    document.getElementById("confirmarCorreo").classList.add("d-none");

    mostrarError("errorPerfil", "");


    // Las cuentas de Google pueden crear una contraseña
    const tiene = perfil.usuario.tiene_contrasena;

    document.getElementById("campoActual").classList.toggle("d-none", !tiene);

    document.getElementById("tituloContrasena").textContent = tiene ? "Cambiar contraseña" : "Crear una contraseña";

    document.getElementById("textoContrasena").textContent = tiene
        ? "Al cambiarla se cierran tus sesiones en otros dispositivos."
        : "Entras con Google. Si creas una contraseña, también podrás entrar con tu correo.";

}


async function cargar() {


    try {

        perfil = await peticion("/usuario/perfil");

        dibujarTarjeta();

        dibujarMascotas();

        llenarFormulario();

    } catch (e) {

        document.getElementById("tarjeta").innerHTML = "";

        mostrarAviso(e.message);

    }

}


// =========================================
// GUARDAR PERFIL Y FOTO
// =========================================

async function guardarPerfil(extra = {}) {


    const datos = new FormData(document.getElementById("formPerfil"));

    Object.entries(extra).forEach(([clave, valor]) => datos.append(clave, valor));


    const respuesta = await peticion("/usuario/perfil", { method: "PUT", body: datos });

    // El encabezado de todas las páginas muestra los datos nuevos
    guardarUsuario(respuesta.usuario);

    await cargar();

    return respuesta;

}


// Si cambia el correo, se pide la contraseña actual
document.getElementById("correo").addEventListener("input", event => {

    const cambio = event.target.value.trim().toLowerCase() !== perfil.usuario.correo;

    document.getElementById("confirmarCorreo").classList.toggle("d-none", !(cambio && perfil.usuario.tiene_contrasena));

});


document.getElementById("formPerfil").addEventListener("submit", async event => {


    event.preventDefault();

    mostrarError("errorPerfil", "");


    const vacio = [...event.target.querySelectorAll("[required]")].find(c => !c.value.trim());

    if (vacio) {

        mostrarError("errorPerfil", `Completa el campo "${event.target.querySelector(`label[for="${vacio.id}"]`).textContent.replace(" *", "")}".`);

        vacio.focus();

        return;

    }

    if (!document.getElementById("correo").checkValidity()) {

        mostrarError("errorPerfil", "El correo no es válido.");

        return;

    }


    const boton = document.getElementById("botonGuardarPerfil");

    boton.disabled = true;


    try {

        const respuesta = await guardarPerfil();

        mostrarAviso(respuesta.message, "success");

    } catch (e) {

        mostrarError("errorPerfil", e.message);

    } finally {

        boton.disabled = false;

    }

});


document.getElementById("botonDeshacer").addEventListener("click", llenarFormulario);


document.getElementById("archivoFoto").addEventListener("change", async event => {


    const archivo = event.target.files[0];

    event.target.value = "";

    if (!archivo) return;


    if (archivo.size > 2 * 1024 * 1024) {

        mostrarAviso("La foto no puede pesar más de 2 MB.");

        return;

    }


    try {

        await guardarPerfil({ foto_perfil: archivo });

        mostrarAviso("Tu foto de perfil se actualizó.", "success");

    } catch (e) {

        mostrarAviso(e.message);

    }

});


document.addEventListener("click", async event => {


    if (event.target.closest("#botonFoto")) {

        document.getElementById("archivoFoto").click();

    } else if (event.target.closest("#botonQuitarFoto")) {

        if (!confirm("¿Quitar tu foto de perfil?")) return;

        try {

            await guardarPerfil({ quitar_foto: "1" });

            mostrarAviso("Se quitó tu foto de perfil.", "success");

        } catch (e) {

            mostrarAviso(e.message);

        }

    }

});


// =========================================
// CONTRASEÑA
// =========================================

document.getElementById("verContrasenas").addEventListener("change", event => {

    ["actual", "nueva", "confirmar", "contrasena_actual"].forEach(id => {

        document.getElementById(id).type = event.target.checked ? "text" : "password";

    });

});


document.getElementById("formContrasena").addEventListener("submit", async event => {


    event.preventDefault();

    mostrarError("errorContrasena", "");

    const nueva = document.getElementById("nueva").value;


    if (perfil.usuario.tiene_contrasena && !document.getElementById("actual").value) {

        mostrarError("errorContrasena", "Escribe tu contraseña actual.");

        return;

    }

    if (nueva.length < 8 || !/[A-Z]/.test(nueva) || !/[0-9]/.test(nueva) || !/[^A-Za-z0-9]/.test(nueva)) {

        mostrarError("errorContrasena", "La nueva contraseña debe tener 8 caracteres, una mayúscula, un número y un carácter especial.");

        return;

    }

    if (nueva !== document.getElementById("confirmar").value) {

        mostrarError("errorContrasena", "Las contraseñas nuevas no coinciden.");

        return;

    }


    const boton = document.getElementById("botonContrasena");

    boton.disabled = true;


    try {

        const respuesta = await peticion("/usuario/contrasena", { method: "PUT", body: new FormData(event.target) });

        event.target.reset();

        await cargar();

        mostrarAviso(respuesta.message, "success");

    } catch (e) {

        mostrarError("errorContrasena", e.message);

    } finally {

        boton.disabled = false;

    }

});


cargar();
