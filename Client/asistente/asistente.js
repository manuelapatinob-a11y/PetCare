// =========================================
// PETCARE - ASISTENTE IA (PetBot)
// Usa ../auth/sesion.js (peticion, urlFoto, obtenerUsuario)
// =========================================


const EMOJI = { Perro: "🐶", Gato: "🐱", Ave: "🐦", Conejo: "🐰", Otro: "🐾" };

// Preguntas de ejemplo para empezar
const EJEMPLOS = [
    { icono: "bi-heart-pulse", texto: "¿Cuáles son las señales de que mi mascota tiene dolor?" },
    { icono: "bi-shield-plus", texto: "¿Qué vacunas necesita y cada cuánto?" },
    { icono: "bi-cup-hot", texto: "¿Qué alimentos son tóxicos para mi mascota?" },
    { icono: "bi-emoji-smile", texto: "¿Cómo le ayudo a no tener ansiedad cuando se queda solo?" }
];

const URGENCIA = {
    urgente: { clase: "urgent", icono: "bi-exclamation-octagon-fill", texto: "Puede ser una urgencia: ve al veterinario ya" },
    consultar: { clase: "consult", icono: "bi-calendar-check", texto: "Conviene consultar al veterinario" }
};


let datos = null;           // mascotas, conversaciones, iaConfigurada

let actual = null;          // conversación abierta { id_conversacion, id_mascota, mascota }

let mensajes = [];

let mascotaElegida = "";    // para una consulta nueva

let enviando = false;


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

        setTimeout(() => aviso.classList.add("d-none"), 3000);

    }

}


// Texto de la IA con formato sencillo (todo se escapa primero):
// **negrita**, listas con "- " o "1. " y párrafos
function formatear(texto) {


    const lineas = escaparHTML(texto).split(/\r?\n/);

    let html = "";

    let lista = null;


    const cerrarLista = () => {

        if (lista) {

            html += `</${lista}>`;

            lista = null;

        }

    };


    lineas.forEach(linea => {

        const limpia = linea.trim();

        const vineta = limpia.match(/^[-•*]\s+(.*)/);

        const numero = limpia.match(/^\d+[.)]\s+(.*)/);


        if (vineta || numero) {

            const tipo = vineta ? "ul" : "ol";

            if (lista !== tipo) {

                cerrarLista();

                html += `<${tipo}>`;

                lista = tipo;

            }

            html += `<li>${(vineta || numero)[1]}</li>`;

        } else {

            cerrarLista();

            if (limpia) html += `<p>${limpia}</p>`;

        }

    });


    cerrarLista();

    return html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

}


function fotoMascota(m) {

    const foto = urlFoto(m.foto);

    return foto ? `<img src="${escaparHTML(foto)}" alt="">` : EMOJI[m.especie] || "🐾";

}


// =========================================
// CONVERSACIONES ANTERIORES
// =========================================

function dibujarConversaciones() {


    const lista = datos.conversaciones;


    document.getElementById("conversaciones").innerHTML = lista.length
        ? lista.map(c => `
            <div class="history-item ${actual?.id_conversacion === c.id_conversacion ? "active" : ""}">
                <button type="button" class="history-open" data-abrir="${c.id_conversacion}">
                    <strong>${escaparHTML(c.titulo)}</strong>
                    <small>
                        ${c.mascota ? `${escaparHTML(c.mascota)} · ` : ""}
                        ${new Date(c.fecha_actualizacion).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    </small>
                </button>
                <button type="button" class="history-delete" title="Eliminar consulta" aria-label="Eliminar consulta" data-borrar="${c.id_conversacion}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `).join("")
        : '<p class="history-empty">Aquí aparecerán tus consultas.</p>';

}


// =========================================
// MASCOTA DE LA CONSULTA
// =========================================

function dibujarSelector() {


    const caja = document.getElementById("selectorMascota");


    // En una conversación ya empezada la mascota no cambia
    if (actual) {

        caja.innerHTML = actual.mascota
            ? `<span class="chat-pet-label"><i class="bi bi-chat-heart"></i> Consulta sobre <strong>${escaparHTML(actual.mascota)}</strong>. PetBot conoce su ficha de salud.</span>`
            : '<span class="chat-pet-label"><i class="bi bi-chat-dots"></i> Consulta general (sin mascota)</span>';

        return;

    }


    const chip = (valor, foto, nombre) => `
        <button type="button" class="pet-chip ${mascotaElegida === valor ? "active" : ""}" data-mascota="${valor}">
            <span class="pet-chip-photo">${foto}</span>
            ${escaparHTML(nombre)}
        </button>
    `;


    caja.innerHTML = `
        <span class="chat-pet-label">¿Sobre quién es la consulta?</span>
        <div class="chat-pet-chips">
            ${datos.mascotas.map(m => chip(String(m.id_mascota), fotoMascota(m), m.nombre)).join("")}
            ${chip("", "💬", "Pregunta general")}
        </div>
    `;

}


// =========================================
// MENSAJES
// =========================================

function burbuja(m) {


    if (m.emisor === "usuario") {

        return `<div class="msg user"><div class="bubble">${escaparHTML(m.contenido).replace(/\n/g, "<br>")}</div></div>`;

    }


    const urgencia = URGENCIA[m.datos?.urgencia];


    return `
        <div class="msg bot">
            <span class="bot-avatar" aria-hidden="true"><i class="bi bi-robot"></i></span>
            <div class="bubble">
                ${urgencia ? `
                    <div class="urgency ${urgencia.clase}" role="${urgencia.clase === "urgent" ? "alert" : "note"}">
                        <i class="bi ${urgencia.icono}"></i>
                        <span>
                            <strong>${urgencia.texto}</strong>
                            ${m.datos.motivo_urgencia ? `<small>${escaparHTML(m.datos.motivo_urgencia)}</small>` : ""}
                        </span>
                        ${urgencia.clase === "urgent" ? '<a href="../mapa/mapa.html" class="urgency-map"><i class="bi bi-geo-alt"></i> Veterinarias cerca</a>' : ""}
                    </div>
                ` : ""}
                <div class="bot-text">${formatear(m.contenido)}</div>
            </div>
        </div>
    `;

}


function bienvenida() {


    const usuario = obtenerUsuario();

    const nombre = usuario ? usuario.nombres.split(" ")[0] : "";


    return `
        <div class="chat-welcome">
            <div class="welcome-icon"><i class="bi bi-robot"></i></div>
            <h3>Hola${nombre ? `, ${escaparHTML(nombre)}` : ""}. Soy PetBot 👋</h3>
            <p>
                Pregúntame sobre síntomas, cuidados, alimentación o comportamiento.
                Si eliges una mascota, tengo en cuenta su raza, edad, peso, alergias, enfermedades y medicamentos.
            </p>
            ${datos.iaConfigurada ? `
                <div class="welcome-examples">
                    ${EJEMPLOS.map(e => `
                        <button type="button" data-ejemplo="${escaparHTML(e.texto)}">
                            <i class="bi ${e.icono}"></i>
                            ${escaparHTML(e.texto)}
                        </button>
                    `).join("")}
                </div>
            ` : `
                <p class="welcome-warning"><i class="bi bi-exclamation-triangle"></i>
                    La IA todavía no está configurada en el servidor (falta GROQ_API_KEY en backend/.env).</p>
            `}
        </div>
    `;

}


function dibujarMensajes(pensando = false) {


    const caja = document.getElementById("mensajes");


    caja.innerHTML = mensajes.length
        ? mensajes.map(burbuja).join("") + (pensando ? `
            <div class="msg bot">
                <span class="bot-avatar" aria-hidden="true"><i class="bi bi-robot"></i></span>
                <div class="bubble typing" aria-label="PetBot está escribiendo"><span></span><span></span><span></span></div>
            </div>
        ` : "")
        : bienvenida();


    caja.scrollTop = caja.scrollHeight;


    // Preguntas sugeridas de la última respuesta
    const ultima = [...mensajes].reverse().find(m => m.emisor === "ia");

    const sugeridas = !pensando && ultima?.datos?.preguntas_sugeridas || [];

    document.getElementById("sugerencias").innerHTML = sugeridas
        .map(p => `<button type="button" data-ejemplo="${escaparHTML(p)}">${escaparHTML(p)}</button>`).join("");

}


// =========================================
// CARGAR Y ABRIR
// =========================================

async function cargar() {


    try {

        datos = await peticion("/asistente");

    } catch (e) {

        mostrarAviso(e.message);

        return;

    }


    // La mascota puede venir en la dirección: asistente.html?mascota=5
    const pedida = new URLSearchParams(location.search).get("mascota");

    mascotaElegida = datos.mascotas.some(m => String(m.id_mascota) === pedida)
        ? pedida
        : String(datos.mascotas[0]?.id_mascota ?? "");


    document.getElementById("botonEnviar").disabled = !datos.iaConfigurada;

    document.getElementById("pregunta").disabled = !datos.iaConfigurada;


    dibujarConversaciones();

    dibujarSelector();

    dibujarMensajes();

}


async function abrir(idConversacion) {


    try {

        const respuesta = await peticion(`/asistente/conversaciones/${idConversacion}`);

        actual = respuesta.conversacion;

        mensajes = respuesta.mensajes;

        dibujarConversaciones();

        dibujarSelector();

        dibujarMensajes();

    } catch (e) {

        mostrarAviso(e.message);

    }

}


function nuevaConversacion() {

    actual = null;

    mensajes = [];

    dibujarConversaciones();

    dibujarSelector();

    dibujarMensajes();

    document.getElementById("pregunta").focus();

}


// =========================================
// PREGUNTAR
// =========================================

async function preguntar(texto) {


    const pregunta = texto.trim();

    if (!pregunta || enviando || !datos?.iaConfigurada) return;


    enviando = true;

    document.getElementById("botonEnviar").disabled = true;

    document.getElementById("pregunta").value = "";

    ajustarAltura();


    // La pregunta se ve de una vez mientras PetBot piensa
    mensajes.push({ emisor: "usuario", contenido: pregunta });

    dibujarMensajes(true);


    const formulario = new FormData();

    formulario.append("mensaje", pregunta);

    if (actual) {

        formulario.append("id_conversacion", actual.id_conversacion);

    } else if (mascotaElegida) {

        formulario.append("id_mascota", mascotaElegida);

    }


    try {

        const respuesta = await peticion("/asistente/mensaje", { method: "POST", body: formulario });

        const nueva = !actual;

        actual = respuesta.conversacion;

        mensajes[mensajes.length - 1] = respuesta.pregunta;

        mensajes.push(respuesta.respuesta);


        if (nueva) {

            datos.conversaciones.unshift({ ...actual, fecha_actualizacion: new Date().toISOString() });

            dibujarSelector();

        } else {

            const c = datos.conversaciones.find(x => x.id_conversacion === actual.id_conversacion);

            if (c) c.fecha_actualizacion = new Date().toISOString();

        }

        dibujarConversaciones();

    } catch (e) {

        // La pregunta vuelve al cuadro para intentarlo de nuevo
        mensajes.pop();

        document.getElementById("pregunta").value = pregunta;

        mostrarAviso(e.message);

    } finally {

        enviando = false;

        document.getElementById("botonEnviar").disabled = false;

        dibujarMensajes();

    }

}


function ajustarAltura() {

    const caja = document.getElementById("pregunta");

    caja.style.height = "auto";

    caja.style.height = `${Math.min(caja.scrollHeight, 160)}px`;

}


// =========================================
// EVENTOS
// =========================================

document.getElementById("formPregunta").addEventListener("submit", event => {

    event.preventDefault();

    preguntar(document.getElementById("pregunta").value);

});


// Enter envía; Shift + Enter hace un salto de línea
document.getElementById("pregunta").addEventListener("keydown", event => {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        preguntar(event.target.value);

    }

});

document.getElementById("pregunta").addEventListener("input", ajustarAltura);

document.getElementById("nuevaConversacion").addEventListener("click", nuevaConversacion);


document.addEventListener("click", async event => {


    const ejemplo = event.target.closest("[data-ejemplo]");

    const mascota = event.target.closest("[data-mascota]");

    const abrirBoton = event.target.closest("[data-abrir]");

    const borrar = event.target.closest("[data-borrar]");


    if (ejemplo) {

        preguntar(ejemplo.dataset.ejemplo);

    } else if (mascota) {

        mascotaElegida = mascota.dataset.mascota;

        dibujarSelector();

    } else if (abrirBoton) {

        abrir(Number(abrirBoton.dataset.abrir));

    } else if (borrar) {

        if (!confirm("¿Eliminar esta consulta?")) return;

        try {

            await peticion(`/asistente/conversaciones/${borrar.dataset.borrar}`, { method: "DELETE" });

            datos.conversaciones = datos.conversaciones.filter(c => c.id_conversacion !== Number(borrar.dataset.borrar));

            if (actual?.id_conversacion === Number(borrar.dataset.borrar)) {

                nuevaConversacion();

            } else {

                dibujarConversaciones();

            }

        } catch (e) {

            mostrarAviso(e.message);

        }

    }

});


cargar();
