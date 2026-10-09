/* ==================================
   PETCARE - SERVICIOS PARA MASCOTAS (página pública)
   Lugares reales de OpenStreetMap, buscados con Nominatim
   (gratis, sin clave). Nominatim permite una consulta por segundo,
   por eso las búsquedas van una tras otra y se guardan un rato.
================================== */

const NOMINATIM = "https://nominatim.openstreetmap.org/search?";


/*
Qué se busca en cada tipo de servicio y cómo se reconocen los resultados
(por el tipo de OpenStreetMap o por el nombre)
*/

const SERVICIOS = {

    veterinaria: {
        titulo: "Veterinarias", icono: "bi-heart-pulse", color: "purple",
        descripcion: "Consultas, vacunas y control",
        busquedas: ["veterinaria", "clinica veterinaria"],
        tipos: ["veterinary"],
        nombre: /veterin|\bvet\b|cl[ií]nica (de )?(peque[ñn]os )?animal|hospital (de )?(peque[ñn]os )?animal|mascota/i
    },

    urgencias: {
        titulo: "Urgencias 24 horas", icono: "bi-hospital", color: "red",
        descripcion: "Veterinarias que atienden día y noche",
        busquedas: ["veterinaria 24 horas", "clinica veterinaria"],
        tipos: ["veterinary"],
        nombre: /veterin|\bvet\b|animal|mascota/i,
        solo24: true
    },

    peluqueria: {
        titulo: "Peluquería y spa", icono: "bi-scissors", color: "pink",
        descripcion: "Baño, corte y estética",
        busquedas: ["peluqueria mascotas", "pet", "mascotas", "canino"],
        tipos: ["pet_grooming"],
        nombre: /pelu|groom|spa|est[eé]tica|ba[ñn]o/i,
        mascotas: true
    },

    tienda: {
        titulo: "Tiendas y alimento", icono: "bi-bag-heart", color: "orange",
        descripcion: "Concentrado, accesorios y juguetes",
        busquedas: ["pet shop", "tienda de mascotas", "tienda veterinaria"],
        tipos: ["pet"],
        nombre: /\bpet|mascot|animal|agro|veterin|canin|perr|gat/i
    },

    guarderia: {
        titulo: "Guarderías y hoteles", icono: "bi-house-heart", color: "blue",
        descripcion: "Cuidado mientras no estás",
        busquedas: ["guarderia canina", "pet", "mascotas", "canino"],
        tipos: ["animal_boarding"],
        nombre: /guarder|hotel|hospedaje|daycare|campestre|resort|guest|kinder/i,
        // Además del nombre tiene que ser de mascotas (no un hotel cualquiera)
        mascotas: true
    },

    adiestramiento: {
        titulo: "Adiestramiento y paseos", icono: "bi-award", color: "green",
        descripcion: "Educadores caninos y paseadores",
        busquedas: ["adiestramiento canino", "pet", "mascotas", "canino"],
        tipos: ["animal_training"],
        nombre: /adiestr|entrenamiento|escuela|educaci[oó]n|paseador|etolog|training|academ/i,
        mascotas: true
    },

    parque: {
        titulo: "Parques para perros", icono: "bi-tree", color: "teal",
        descripcion: "Zonas para correr y jugar",
        busquedas: ["parque canino", "dog park"],
        tipos: ["dog_park"],
        nombre: /canin|perr|dog|mascota/i
    }

};

const NOMBRE_TIPO = {
    veterinary: "Veterinaria", pet: "Tienda de mascotas", pet_grooming: "Peluquería de mascotas",
    animal_boarding: "Guardería / hotel", animal_training: "Adiestramiento", dog_park: "Parque canino",
    park: "Parque", shop: "Tienda", clinic: "Clínica"
};


let categoria = "veterinaria";

let zona = null;           // { nombre, lat, lng, viewbox, cercaDeMi }

let lugares = [];

let consultaActual = 0;


// =========================================
// AYUDAS
// =========================================

function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto ?? "";

    return div.innerHTML;

}


function esperar(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

}


// Distancia en km entre dos puntos
function distanciaKm(a, b) {

    const rad = x => (x * Math.PI) / 180;

    const dLat = rad(b.lat - a.lat);

    const dLng = rad(b.lng - a.lng);

    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;

    return 6371 * 2 * Math.asin(Math.sqrt(h));

}


function textoDistancia(km) {

    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString("es-CO", { maximumFractionDigits: 1 })} km`;

}


// Horario de OpenStreetMap ("Mo-Fr 08:00-18:00; Sa 09:00-13:00") en español
function horarioEnEspanol(texto) {

    if (!texto) return "";

    if (/^\s*24\/7\s*$/.test(texto)) return "Abierto las 24 horas";

    const dias = { Mo: "Lun", Tu: "Mar", We: "Mié", Th: "Jue", Fr: "Vie", Sa: "Sáb", Su: "Dom", PH: "festivos" };

    return texto
        .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, d => dias[d])
        .replace(/\boff\b/gi, "cerrado")
        .replace(/;\s*/g, " · ");

}


function es24Horas(lugar) {

    return /24\/7/.test(lugar.horario || "") || /24\s?(h|horas)/i.test(lugar.nombre) || lugar.emergencia;

}


function direccionCorta(resultado) {

    const a = resultado.address || {};

    const calle = [a.road, a.house_number].filter(Boolean).join(" # ");

    const partes = [calle, a.neighbourhood || a.suburb, a.city || a.town || a.village].filter(Boolean);

    if (partes.length) return partes.join(", ");

    return (resultado.display_name || "").split(",").map(p => p.trim()).filter(p => p !== resultado.name).slice(0, 3).join(", ");

}


// =========================================
// NOMINATIM
// =========================================

async function nominatim(parametros) {

    const respuesta = await fetch(NOMINATIM + new URLSearchParams({
        format: "jsonv2", "accept-language": "es", ...parametros
    }));

    if (!respuesta.ok) {

        throw new Error(`Error ${respuesta.status}`);

    }

    return respuesta.json();

}


// Se guarda lo ya buscado para no repetir consultas (dura mientras la pestaña esté abierta)
function guardado(clave) {

    try {

        return JSON.parse(sessionStorage.getItem(clave));

    } catch {

        return null;

    }

}


function guardar(clave, valor) {

    try {

        sessionStorage.setItem(clave, JSON.stringify(valor));

    } catch {

        // Sin espacio o sin almacenamiento: no pasa nada, solo se vuelve a buscar
    }

}


// Ciudad o barrio escrito -> centro y zona de búsqueda
async function buscarZona(texto) {


    const clave = `petcare_zona:${texto.toLowerCase()}`;

    const antes = guardado(clave);

    if (antes) return antes;


    const [lugar] = await nominatim({ q: `${texto}, Colombia`, limit: 1 });

    if (!lugar) return null;


    const lat = Number(lugar.lat);

    const lng = Number(lugar.lon);


    // La zona es la de la ciudad, pero sin pasar de unos 15 km alrededor del centro
    const [sur, norte, oeste, este] = lugar.boundingbox.map(Number);

    const margen = 0.14;

    const caja = [
        Math.max(oeste, lng - margen), Math.min(norte, lat + margen),
        Math.min(este, lng + margen), Math.max(sur, lat - margen)
    ];

    // Barrios muy pequeños: se amplía a unos 3 km
    if (caja[2] - caja[0] < 0.05) {

        caja.splice(0, 4, lng - 0.03, lat + 0.03, lng + 0.03, lat - 0.03);

    }


    const zonaNueva = {
        nombre: lugar.name || texto,
        lat, lng,
        viewbox: caja.map(n => n.toFixed(5)).join(","),
        cercaDeMi: false
    };

    guardar(clave, zonaNueva);

    return zonaNueva;

}


// Lugares que son de mascotas por su tipo o su nombre
const DE_MASCOTAS = /\bpet|mascot|animal|canin|\bperr|\bgat[oi]|\bdogs?\b|\bcats?\b|veterin|huell|patit|pelud|firulais/i;

const TIPOS_DE_MASCOTAS = ["veterinary", "pet", "pet_grooming", "animal_boarding", "animal_training", "dog_park"];


// Un término de búsqueda en la zona (se guarda para reutilizarlo en otras categorías)
async function buscarTermino(texto, zonaBusqueda) {


    const clave = `petcare_termino:${zonaBusqueda.viewbox}:${texto}`;

    const antes = guardado(clave);

    if (antes) return { lista: antes, nueva: false };


    const resultados = await nominatim({
        q: texto, limit: 50, bounded: 1, viewbox: zonaBusqueda.viewbox, extratags: 1, addressdetails: 1
    });


    const lista = resultados.filter(r => r.name).map(r => {
        const e = r.extratags || {};
        return {
            id: r.osm_type + r.osm_id,
            nombre: r.name,
            tipoOsm: r.type,
            tipo: NOMBRE_TIPO[r.type] || "",
            direccion: direccionCorta(r),
            lat: Number(r.lat),
            lng: Number(r.lon),
            telefono: e.phone || e["contact:phone"] || e["contact:mobile"] || "",
            horario: e.opening_hours || "",
            web: e.website || e["contact:website"] || "",
            emergencia: e.emergency === "yes"
        };
    });


    guardar(clave, lista);

    return { lista, nueva: true };

}


async function buscarServicios(servicio, zonaBusqueda) {


    const encontrados = new Map();

    let anteriorFueNueva = false;


    for (const texto of servicio.busquedas) {

        // Nominatim permite una consulta por segundo
        if (anteriorFueNueva) await esperar(1100);

        const { lista, nueva } = await buscarTermino(texto, zonaBusqueda);

        anteriorFueNueva = nueva;

        lista.forEach(l => encontrados.set(l.id, l));

    }


    return [...encontrados.values()].filter(l => {

        if (servicio.tipos.includes(l.tipoOsm)) return true;

        if (!servicio.nombre.test(l.nombre)) return false;

        return !servicio.mascotas || TIPOS_DE_MASCOTAS.includes(l.tipoOsm) || DE_MASCOTAS.test(l.nombre);

    });

}


// =========================================
// DIBUJAR
// =========================================

function dibujarCategorias() {


    document.getElementById("categorias").innerHTML = Object.entries(SERVICIOS).map(([clave, s]) => `
        <button type="button" class="service-category ${s.color} ${clave === categoria ? "active" : ""}"
                data-categoria="${clave}" aria-pressed="${clave === categoria}">
            <span class="category-icon"><i class="bi ${s.icono}"></i></span>
            <strong>${s.titulo}</strong>
            <small>${s.descripcion}</small>
        </button>
    `).join("");

}


function tarjeta(l) {


    const telefono = l.telefono.split(";")[0].trim();

    const web = l.web && /^https?:\/\//i.test(l.web) ? l.web : l.web ? `https://${l.web}` : "";


    return `
        <article class="service-item">

            <div class="service-top">
                <span class="category-icon ${SERVICIOS[categoria].color}"><i class="bi ${SERVICIOS[categoria].icono}"></i></span>

                <div class="service-name">
                    <h3>${escaparHTML(l.nombre)}</h3>
                    <span>${escaparHTML(l.tipo || SERVICIOS[categoria].titulo)}</span>
                </div>

                ${l.distancia !== undefined ? `<span class="service-distance"><i class="bi bi-signpost"></i> ${textoDistancia(l.distancia)}</span>` : ""}
            </div>

            <ul class="service-data">
                ${l.direccion ? `<li><i class="bi bi-geo-alt"></i> ${escaparHTML(l.direccion)}</li>` : ""}
                ${l.horario ? `<li><i class="bi bi-clock"></i> ${escaparHTML(horarioEnEspanol(l.horario))}</li>` : ""}
                ${telefono ? `<li><i class="bi bi-telephone"></i> ${escaparHTML(telefono)}</li>` : ""}
            </ul>

            <div class="service-badges">
                ${es24Horas(l) ? '<span class="tag-24"><i class="bi bi-moon-stars"></i> 24 horas</span>' : ""}
                ${!l.horario && !telefono ? '<span class="tag-muted">Sin horario ni teléfono registrados</span>' : ""}
            </div>

            <div class="service-actions">
                <a href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}" target="_blank" rel="noopener" class="primary">
                    <i class="bi bi-sign-turn-right"></i> Cómo llegar
                </a>
                ${telefono ? `<a href="tel:${escaparHTML(telefono.replace(/[^\d+]/g, ""))}"><i class="bi bi-telephone"></i> Llamar</a>` : ""}
                ${web ? `<a href="${escaparHTML(web)}" target="_blank" rel="noopener"><i class="bi bi-globe"></i> Sitio web</a>` : ""}
                <a href="https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}#map=18/${l.lat}/${l.lng}" target="_blank" rel="noopener">
                    <i class="bi bi-map"></i> Ver mapa
                </a>
            </div>

        </article>
    `;

}


function dibujarResultados() {


    const servicio = SERVICIOS[categoria];

    const filtro = document.getElementById("filtroNombre").value.trim().toLowerCase();

    const orden = document.getElementById("orden").value;

    const nota = document.getElementById("nota");


    let lista = lugares.filter(l => !filtro || `${l.nombre} ${l.direccion}`.toLowerCase().includes(filtro));


    // Urgencias: solo las de 24 horas; si OpenStreetMap no tiene ese dato, se muestran todas con aviso
    nota.classList.add("d-none");

    if (servicio.solo24) {

        const de24 = lista.filter(es24Horas);

        nota.classList.remove("d-none");

        nota.innerHTML = de24.length
            ? '<i class="bi bi-exclamation-triangle"></i> <strong>En una urgencia llama antes de ir</strong> para confirmar que te pueden atender ya.'
            : '<i class="bi bi-exclamation-triangle"></i> <strong>No encontramos veterinarias marcadas como 24 horas en esta zona.</strong> Te mostramos las veterinarias cercanas: llama antes de ir para confirmar si atienden urgencias.';

        if (de24.length) lista = de24;

    }


    lista.sort((a, b) =>
        orden === "nombre" ? a.nombre.localeCompare(b.nombre, "es")
            : orden === "datos" ? (Boolean(b.telefono || b.horario) - Boolean(a.telefono || a.horario)) || a.distancia - b.distancia
                : a.distancia - b.distancia
    );


    document.getElementById("tituloResultados").textContent = servicio.titulo;

    document.getElementById("detalleResultados").textContent = lugares.length
        ? `${lista.length} ${lista.length === 1 ? "lugar" : "lugares"} ${zona.cercaDeMi ? "cerca de ti" : `en ${zona.nombre}`}`
        : "";


    document.getElementById("resultados").innerHTML = lista.length
        ? lista.map(tarjeta).join("")
        : `
            <div class="results-empty">
                <i class="bi bi-search"></i>
                <p>${filtro ? "Ningún lugar coincide con el filtro." : `No encontramos ${servicio.titulo.toLowerCase()} en esta zona en OpenStreetMap.`}</p>
                ${filtro ? "" : '<p>Prueba con otra ciudad o barrio, con "Cerca de mí", o búscalos en el <a href="../mapa/mapa.html">Mapa Pet Friendly</a>.</p>'}
            </div>
        `;

}


function dibujarCargando() {

    document.getElementById("detalleResultados").textContent = "";

    document.getElementById("nota").classList.add("d-none");

    document.getElementById("resultados").innerHTML = Array.from({ length: 6 }, () => '<div class="service-item skeleton" aria-hidden="true"></div>').join("") +
        '<span class="visually-hidden">Buscando lugares...</span>';

}


function dibujarError() {

    document.getElementById("resultados").innerHTML = `
        <div class="results-empty">
            <i class="bi bi-wifi-off"></i>
            <p>No se pudo consultar OpenStreetMap. Revisa tu conexión e intenta de nuevo en unos segundos.</p>
            <button type="button" class="near-button" id="reintentar"><i class="bi bi-arrow-clockwise"></i> Reintentar</button>
        </div>
    `;

}


// =========================================
// CARGAR
// =========================================

async function cargar() {


    const consulta = ++consultaActual;

    document.getElementById("tituloResultados").textContent = SERVICIOS[categoria].titulo;

    dibujarCargando();


    try {

        const lista = await buscarServicios(SERVICIOS[categoria], zona);

        if (consulta !== consultaActual) return;

        lugares = lista.map(l => ({ ...l, distancia: distanciaKm(zona, l) }));

        dibujarResultados();

    } catch {

        if (consulta === consultaActual) dibujarError();

    }

}


async function cambiarZona(texto) {


    const consulta = ++consultaActual;

    dibujarCargando();

    document.getElementById("textoZona").textContent = `Buscando "${texto}"...`;


    try {

        const nueva = await buscarZona(texto);

        if (consulta !== consultaActual) return;


        if (!nueva) {

            document.getElementById("textoZona").textContent = `No encontramos "${texto}". Escribe una ciudad o un barrio de Colombia.`;

            lugares = [];

            dibujarResultados();

            return;

        }


        zona = nueva;

        document.getElementById("textoZona").innerHTML = `<i class="bi bi-pin-map"></i> Mostrando servicios en <strong>${escaparHTML(zona.nombre)}</strong>`;

        await esperar(1100);

        cargar();

    } catch {

        if (consulta === consultaActual) dibujarError();

    }

}


function cercaDeMi() {


    const boton = document.getElementById("cercaDeMi");


    if (!navigator.geolocation) {

        document.getElementById("textoZona").textContent = "Tu navegador no permite usar la ubicación.";

        return;

    }


    boton.disabled = true;

    boton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Ubicando...';


    navigator.geolocation.getCurrentPosition(posicion => {

        const { latitude: lat, longitude: lng } = posicion.coords;

        zona = {
            nombre: "tu ubicación", lat, lng, cercaDeMi: true,
            viewbox: [lng - 0.04, lat + 0.04, lng + 0.04, lat - 0.04].map(n => n.toFixed(5)).join(",")
        };

        document.getElementById("textoZona").innerHTML = '<i class="bi bi-crosshair"></i> Mostrando servicios <strong>cerca de ti</strong> (unos 4 km a la redonda)';

        boton.disabled = false;

        boton.innerHTML = '<i class="bi bi-crosshair"></i> Cerca de mí';

        cargar();

    }, () => {

        document.getElementById("textoZona").textContent = "No pudimos obtener tu ubicación. Revisa el permiso del navegador o escribe tu ciudad.";

        boton.disabled = false;

        boton.innerHTML = '<i class="bi bi-crosshair"></i> Cerca de mí';

    }, { timeout: 10000 });

}


// =========================================
// EVENTOS
// =========================================

document.getElementById("formCiudad").addEventListener("submit", event => {

    event.preventDefault();

    const texto = document.getElementById("ciudad").value.trim();

    if (texto) cambiarZona(texto);

});

document.getElementById("cercaDeMi").addEventListener("click", cercaDeMi);

document.getElementById("filtroNombre").addEventListener("input", dibujarResultados);

document.getElementById("orden").addEventListener("change", dibujarResultados);


document.addEventListener("click", event => {

    const boton = event.target.closest("[data-categoria]");

    if (boton) {

        categoria = boton.dataset.categoria;

        history.replaceState(null, "", `?tipo=${categoria}`);

        document.getElementById("filtroNombre").value = "";

        dibujarCategorias();

        if (zona) cargar();

    } else if (event.target.closest("#reintentar")) {

        zona ? cargar() : cambiarZona(document.getElementById("ciudad").value.trim() || "Medellín");

    }

});


// Con sesión iniciada no hace falta el botón de iniciar sesión
document.addEventListener("DOMContentLoaded", () => {

    if (typeof obtenerToken === "function" && obtenerToken()) {

        document.getElementById("enlaceLogin").hidden = true;

    }

});


// =========================================
// INICIAR (el tipo puede venir en la dirección: servicios.html?tipo=urgencias)
// =========================================

const pedido = new URLSearchParams(location.search).get("tipo");

if (SERVICIOS[pedido]) categoria = pedido;

dibujarCategorias();

cambiarZona("Medellín");
