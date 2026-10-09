/* ==================================
   MAPA PET FRIENDLY (OPENSTREETMAP)
   Mapa con Leaflet y lugares reales de OpenStreetMap,
   buscados con Nominatim (gratis, no necesita API key)
================================== */

const MEDELLIN = [6.2442, -75.5812];

let mapa;

let capaLugares;

let marcadorUsuario = null;

let ubicacionUsuario = null;

let busquedasActuales = [];

let tituloActual = "";

let marcadores = [];

let numeroConsulta = 0;

let moviendoMapa = false;


/*
Qué se busca en OpenStreetMap
por cada categoría
*/

const categorias = {

    todos: {
        titulo: "Lugares para mascotas",
        busquedas: ["clinica veterinaria", "pet shop", "mascotas"]
    },

    veterinaria: {
        titulo: "Veterinarias",
        busquedas: ["clinica veterinaria"]
    },

    parque: {
        titulo: "Parques",
        busquedas: ["park", "parque canino"]
    },

    cafeteria: {
        titulo: "Cafeterías",
        busquedas: ["cafe"]
    },

    tienda: {
        titulo: "Tiendas de mascotas",
        busquedas: ["pet shop"]
    },

    restaurante: {
        titulo: "Restaurantes",
        busquedas: ["restaurant"]
    },

    hotel: {
        titulo: "Hoteles",
        busquedas: ["hotel", "hostal"]
    }

};


/*
Nombre en español de cada tipo de lugar
*/

const nombresTipo = {
    veterinary: "Veterinaria",
    pet: "Tienda de mascotas",
    pet_grooming: "Peluquería de mascotas",
    dog_park: "Parque canino",
    park: "Parque",
    cafe: "Cafetería",
    restaurant: "Restaurante",
    fast_food: "Comida rápida",
    hotel: "Hotel",
    hostel: "Hostal",
    guest_house: "Hospedaje"
};


const iconosTipo = {
    veterinary: "bi-heart-pulse",
    pet: "bi-shop",
    pet_grooming: "bi-scissors",
    dog_park: "bi-tree",
    park: "bi-tree",
    cafe: "bi-cup-hot",
    restaurant: "bi-egg-fried",
    fast_food: "bi-egg-fried",
    hotel: "bi-building",
    hostel: "bi-building",
    guest_house: "bi-building"
};


/* ==================================
   INICIAR MAPA
================================== */

function iniciarMapa() {


    mapa = L.map("map").setView(MEDELLIN, 14);


    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
    ).addTo(mapa);


    capaLugares = L.layerGroup().addTo(mapa);


    /*
    Si el usuario mueve el mapa
    se muestra el botón "Buscar en esta zona"
    */

    mapa.on("moveend", () => {

        if (moviendoMapa) {

            moviendoMapa = false;

            return;

        }

        document.getElementById("buscarZona").hidden = false;

    });


    filtrarLugar(
        "todos",
        document.querySelector(".filter")
    );

}


function moverMapa(centro, zoom) {

    moviendoMapa = true;

    mapa.setView(centro, zoom, { animate: false });

}


/* ==================================
   PET FRIENDLY
================================== */

function esPetFriendly(lugar) {


    const etiquetas = lugar.extratags || {};


    /*
    Etiqueta "dog" de OpenStreetMap:
    indica si se permiten perros
    */

    if (etiqueta(etiquetas.dog) === "no") {

        return false;

    }


    if (["yes", "leashed", "outside", "unleashed"]
        .includes(etiqueta(etiquetas.dog))) {

        return true;

    }


    /*
    Lugares que son para mascotas
    por su categoría
    */

    if (["veterinary", "pet", "pet_grooming", "dog_park"]
        .includes(lugar.type)) {

        return true;

    }


    /*
    O por su nombre
    */

    return /\bpet(?!r|er)|mascota|\bperr[oia]|\bdogs?\b|\bgat[oi]|canin|felin|\bvet|animal/i
        .test(lugar.name || "");

}


function etiqueta(valor) {

    return (valor || "").toLowerCase();

}


/* ==================================
   BUSCAR EN OPENSTREETMAP
================================== */

function esperar(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

}


function zonaDeBusqueda() {


    let limites = mapa.getBounds();


    /*
    Si el mapa está muy alejado
    se busca solo cerca del centro
    */

    if (limites.getEast() - limites.getWest() > 0.25) {

        const centro = mapa.getCenter();

        limites = L.latLngBounds(
            [centro.lat - 0.06, centro.lng - 0.06],
            [centro.lat + 0.06, centro.lng + 0.06]
        );

    }


    return [
        limites.getWest(),
        limites.getNorth(),
        limites.getEast(),
        limites.getSouth()
    ].map(n => n.toFixed(5)).join(",");

}


async function consultarNominatim(texto, zona) {


    const parametros = new URLSearchParams({
        q: texto,
        format: "jsonv2",
        extratags: 1,
        limit: 40,
        bounded: 1,
        viewbox: zona,
        "accept-language": "es"
    });


    const respuesta = await fetch(
        "https://nominatim.openstreetmap.org/search?" + parametros
    );


    if (!respuesta.ok) {

        throw new Error("Error " + respuesta.status);

    }


    return respuesta.json();

}


async function cargarLugares() {


    /*
    Cada búsqueda tiene un número,
    así se ignoran respuestas viejas
    */

    const consulta = ++numeroConsulta;

    const zona = zonaDeBusqueda();


    document.getElementById("buscarZona").hidden = true;

    document.getElementById("cargando").hidden = false;

    document.getElementById("tituloBusqueda").textContent = tituloActual;


    const encontrados = new Map();


    try {

        for (let i = 0; i < busquedasActuales.length; i++) {


            /*
            Nominatim permite una consulta por segundo
            */

            if (i > 0) {

                await esperar(1100);

            }


            const resultados =
                await consultarNominatim(busquedasActuales[i], zona);


            if (consulta !== numeroConsulta) {

                return;

            }


            resultados.forEach(lugar => {

                encontrados.set(lugar.osm_type + lugar.osm_id, lugar);

            });

        }

    } catch (error) {

        if (consulta === numeroConsulta) {

            document.getElementById("cargando").hidden = true;

            mostrarError();

        }

        return;

    }


    const lugares =
        [...encontrados.values()]
        .map(lugar => ({

            nombre: lugar.name || nombresTipo[lugar.type] || "Lugar",

            tipo: lugar.type,

            direccion: direccionCorta(lugar),

            lat: Number(lugar.lat),

            lng: Number(lugar.lon),

            petFriendly: esPetFriendly(lugar)

        }))
        .sort((a, b) => b.petFriendly - a.petFriendly);


    document.getElementById("cargando").hidden = true;

    mostrarLugares(lugares);

    mostrarLista(lugares);

}


function direccionCorta(lugar) {


    /*
    display_name trae: nombre, calle, barrio, ciudad...
    se quitan el nombre y lo muy general
    */

    return (lugar.display_name || "")
        .split(",")
        .map(parte => parte.trim())
        .filter(parte => parte !== lugar.name)
        .slice(0, 3)
        .join(", ");

}


/* ==================================
   MOSTRAR MARCADORES
================================== */

function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto;

    return div.innerHTML;

}


function iconoLugar(lugar) {


    const icono = iconosTipo[lugar.tipo] || "bi-geo-alt";


    return L.divIcon({

        className: "",

        html: `
            <div class="pin ${lugar.petFriendly ? "pin-pet" : "pin-normal"}">
                <i class="bi ${lugar.petFriendly ? "bi-heart-fill" : icono}"></i>
            </div>
        `,

        iconSize: [34, 34],

        iconAnchor: [17, 34],

        popupAnchor: [0, -32]

    });

}


function contenidoPopup(lugar) {


    const destino = `${lugar.lat},${lugar.lng}`;


    return `
        <div class="popup-place">

            <strong>${escaparHTML(lugar.nombre)}</strong>

            <small>${escaparHTML(nombresTipo[lugar.tipo] || lugar.tipo)}</small>

            ${lugar.petFriendly
                ? '<span class="badge-pet">Pet friendly</span>'
                : ""}

            <p>${escaparHTML(lugar.direccion)}</p>

            <div class="popup-links">

                <a
                    href="https://www.google.com/maps/dir/?api=1&destination=${destino}"
                    target="_blank"
                    rel="noopener">
                    Cómo llegar
                </a>

                <a
                    href="https://www.google.com/maps/search/?api=1&query=${destino}"
                    target="_blank"
                    rel="noopener">
                    Ver en Google Maps
                </a>

            </div>

        </div>
    `;

}


function mostrarLugares(lista) {


    capaLugares.clearLayers();

    marcadores = [];


    lista.forEach(lugar => {


        const marcador = L.marker(
            [lugar.lat, lugar.lng],
            {
                icon: iconoLugar(lugar),
                title: lugar.nombre,
                zIndexOffset: lugar.petFriendly ? 1000 : 0
            }
        );


        marcador.bindPopup(contenidoPopup(lugar));

        marcador.addTo(capaLugares);

        marcadores.push(marcador);

    });

}


/* ==================================
   LISTA DE LUGARES
================================== */

function mostrarLista(lista) {


    const contenedor =
        document.getElementById("lugaresLista");


    contenedor.innerHTML = "";


    const petFriendly =
        lista.filter(lugar => lugar.petFriendly).length;


    document.getElementById("cantidadLugares").textContent =
        `${petFriendly} pet friendly de ${lista.length}`;


    if (lista.length === 0) {

        contenedor.innerHTML = `
            <p class="places-empty">
                No encontramos lugares en esta zona.
                Mueve el mapa o prueba otra categoría.
            </p>
        `;

        return;

    }


    lista.forEach((lugar, index) => {


        const tarjeta = document.createElement("div");

        tarjeta.className = "place-card";


        tarjeta.innerHTML = `

            <span class="legend-dot ${lugar.petFriendly ? "pet" : "normal"}"></span>

            <div class="place-info">

                <strong>${escaparHTML(lugar.nombre)}</strong>

                <small>${escaparHTML(nombresTipo[lugar.tipo] || lugar.tipo)}</small>

                ${lugar.petFriendly
                    ? '<span class="badge-pet">Pet friendly</span>'
                    : ""}

            </div>

        `;


        tarjeta.addEventListener("click", () => {

            moverMapa([lugar.lat, lugar.lng], 17);

            marcadores[index].openPopup();

        });


        contenedor.appendChild(tarjeta);

    });

}


function mostrarError() {


    capaLugares.clearLayers();


    document.getElementById("cantidadLugares").textContent = "0";


    document.getElementById("lugaresLista").innerHTML = `
        <p class="places-empty">
            No se pudieron cargar los lugares.
            Revisa tu conexión e intenta de nuevo.
        </p>
    `;

}


/* ==================================
   FILTROS
================================== */

function filtrarLugar(tipo, boton) {


    document
        .querySelectorAll(".filter")
        .forEach(btn => {

            btn.classList.remove("active");

        });


    boton.classList.add("active");


    document.getElementById("searchInput").value = "";


    busquedasActuales = categorias[tipo].busquedas;

    tituloActual = categorias[tipo].titulo;


    cargarLugares();

}


/* ==================================
   BUSCAR
================================== */

function buscarLugar() {


    const texto =
        document
        .getElementById("searchInput")
        .value
        .trim();


    if (texto === "") {

        filtrarLugar(
            "todos",
            document.querySelector(".filter")
        );

        return;

    }


    document
        .querySelectorAll(".filter")
        .forEach(btn => {

            btn.classList.remove("active");

        });


    busquedasActuales = [texto];

    tituloActual = `Resultados: ${texto}`;


    cargarLugares();

}


function buscarEnZona() {


    document.getElementById("zonaBusqueda").textContent =
        "Zona visible del mapa";


    cargarLugares();

}


/* ==================================
   ENTER EN BUSCADOR
================================== */

document
    .getElementById("searchInput")
    .addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                buscarLugar();

            }

        }
    );


/* ==================================
   MI UBICACIÓN
================================== */

function miUbicacion() {


    if (!navigator.geolocation) {

        alert(
            "Tu navegador no permite obtener tu ubicación."
        );

        return;

    }


    const boton = document.getElementById("botonUbicacion");

    boton.disabled = true;

    boton.innerHTML =
        '<i class="bi bi-hourglass-split"></i> Buscando...';


    navigator.geolocation.getCurrentPosition(

        function(position) {


            ubicacionUsuario = [
                position.coords.latitude,
                position.coords.longitude
            ];


            boton.disabled = false;

            boton.innerHTML =
                '<i class="bi bi-crosshair"></i> Mi ubicación';


            /*
            Punto azul en la ubicación del usuario
            */

            if (marcadorUsuario) {

                marcadorUsuario.setLatLng(ubicacionUsuario);

            } else {

                marcadorUsuario = L.circleMarker(
                    ubicacionUsuario,
                    {
                        radius: 9,
                        color: "#ffffff",
                        weight: 3,
                        fillColor: "#2f7cf6",
                        fillOpacity: 1
                    }
                )
                .bindPopup("Estás aquí")
                .addTo(mapa);

            }


            moverMapa(ubicacionUsuario, 15);


            document.getElementById("zonaBusqueda").textContent =
                "Cerca de tu ubicación";


            /*
            Repetir la búsqueda actual
            pero ahora cerca del usuario
            */

            cargarLugares();

        },


        function(error) {


            boton.disabled = false;

            boton.innerHTML =
                '<i class="bi bi-crosshair"></i> Mi ubicación';


            if (error.code === error.PERMISSION_DENIED) {

                alert(
                    "Debes permitir el acceso a tu ubicación en el navegador."
                );

            } else {

                alert(
                    "No pudimos obtener tu ubicación."
                );

            }

        },

        {
            enableHighAccuracy: true,
            timeout: 10000
        }

    );

}


iniciarMapa();

