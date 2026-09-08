let mapa;

let marcadores = [];

let ubicacionUsuario = null;


const lugares = [

    {
        nombre: "Veterinaria PetCare",
        tipo: "veterinaria",
        direccion: "Medellín, Antioquia",
        lat: 6.2442,
        lng: -75.5812,
        rating: 4.8
    },

    {
        nombre: "Parque El Poblado",
        tipo: "parque",
        direccion: "El Poblado, Medellín",
        lat: 6.2094,
        lng: -75.5679,
        rating: 4.7
    },

    {
        nombre: "Pet Café Medellín",
        tipo: "cafeteria",
        direccion: "Laureles, Medellín",
        lat: 6.2449,
        lng: -75.5909,
        rating: 4.6
    },

    {
        nombre: "Pet Shop Medellín",
        tipo: "tienda",
        direccion: "Envigado, Antioquia",
        lat: 6.1705,
        lng: -75.5851,
        rating: 4.9
    },

    {
        nombre: "Hotel Pet Friendly",
        tipo: "hotel",
        direccion: "Sabaneta, Antioquia",
        lat: 6.1517,
        lng: -75.6161,
        rating: 4.5
    }

];


function iniciarMapa() {


    /*
    Centro inicial:

    Medellín, Colombia
    */

    const medellin = {
        lat: 6.2442,
        lng: -75.5812
    };


    mapa = new google.maps.Map(
        document.getElementById("map"),
        {

            center: medellin,

            zoom: 13,

            mapTypeControl: false,

            streetViewControl: false,

            fullscreenControl: true

        }
    );


    mostrarLugares(lugares);

    mostrarLista(lugares);

}


/* ==================================
   MOSTRAR MARCADORES
================================== */

function mostrarLugares(lista) {


    /*
    Eliminar marcadores anteriores
    */

    marcadores.forEach(
        marcador => marcador.setMap(null)
    );


    marcadores = [];


    lista.forEach(lugar => {


        const marcador = new google.maps.Marker({

            position: {
                lat: lugar.lat,
                lng: lugar.lng
            },

            map: mapa,

            title: lugar.nombre

        });


        const ventana = new google.maps.InfoWindow({

            content: `
            
                <div style="padding:8px">

                    <h6 style="margin-bottom:5px">
                        ${lugar.nombre}
                    </h6>

                    <p style="margin:0;font-size:12px">
                        ${lugar.direccion}
                    </p>

                    <p style="margin:5px 0 0;color:#f5a623">
                        ⭐ ${lugar.rating}
                    </p>

                </div>

            `

        });


        marcador.addListener(
            "click",
            () => ventana.open(
                mapa,
                marcador
            )
        );


        marcadores.push(marcador);

    });

}


/* ==================================
   LISTA DE LUGARES
================================== */

function mostrarLista(lista) {


    const contenedor =
        document.getElementById(
            "lugaresLista"
        );


    contenedor.innerHTML = "";


    document.getElementById(
        "cantidadLugares"
    ).textContent =
        `${lista.length} lugares`;


    lista.forEach((lugar, index) => {


        const tarjeta =
            document.createElement("div");


        tarjeta.className =
            "place-card";


        tarjeta.innerHTML = `

            <div class="place-icon ${lugar.tipo}">

                ${iconoTipo(lugar.tipo)}

            </div>


            <div class="place-info">

                <strong>
                    ${lugar.nombre}
                </strong>

                <small>
                    ${lugar.direccion}
                </small>

                <span class="stars">
                    ⭐ ${lugar.rating}
                </span>

            </div>

        `;


        tarjeta.addEventListener(
            "click",
            () => {

                mapa.setCenter({

                    lat: lugar.lat,

                    lng: lugar.lng

                });


                mapa.setZoom(16);


                marcadores[index].setAnimation(
                    google.maps.Animation.BOUNCE
                );


                setTimeout(() => {

                    marcadores[index].setAnimation(
                        null
                    );

                }, 1000);

            }
        );


        contenedor.appendChild(tarjeta);

    });

}


/* ==================================
   ICONOS
================================== */

function iconoTipo(tipo) {


    const iconos = {

        veterinaria:
            '<i class="bi bi-heart-pulse"></i>',

        parque:
            '<i class="bi bi-tree"></i>',

        cafeteria:
            '<i class="bi bi-cup-hot"></i>',

        tienda:
            '<i class="bi bi-shop"></i>',

        hotel:
            '<i class="bi bi-building"></i>'

    };


    return iconos[tipo] || 
        '<i class="bi bi-geo-alt"></i>';

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


    let resultados;


    if (tipo === "todos") {

        resultados = lugares;

    } else {

        resultados =
            lugares.filter(
                lugar => lugar.tipo === tipo
            );

    }


    mostrarLugares(resultados);

    mostrarLista(resultados);

}


/* ==================================
   BUSCAR
================================== */

function buscarLugar() {


    const texto =
        document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();


    if (texto === "") {

        mostrarLugares(lugares);

        mostrarLista(lugares);

        return;

    }


    const resultados =
        lugares.filter(lugar =>

            lugar.nombre
                .toLowerCase()
                .includes(texto)

            ||

            lugar.direccion
                .toLowerCase()
                .includes(texto)

            ||

            lugar.tipo
                .toLowerCase()
                .includes(texto)

        );


    mostrarLugares(resultados);

    mostrarLista(resultados);

}


/* ==================================
   ENTER EN BUSCADOR
================================== */

document
    .getElementById("searchInput")
    .addEventListener(
        "keypress",
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


    navigator.geolocation.getCurrentPosition(

        function(position) {


            const ubicacion = {

                lat: position.coords.latitude,

                lng: position.coords.longitude

            };


            ubicacionUsuario = ubicacion;


            mapa.setCenter(ubicacion);

            mapa.setZoom(15);


            new google.maps.Marker({

                position: ubicacion,

                map: mapa,

                title: "Mi ubicación",

                icon: {

                    url:
                        "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"

                }

            });


        },


        function() {

            alert(
                "No pudimos obtener tu ubicación."
            );

        }

    );

}