/* =========================================
   PETCARE - ACTIVIDAD FÍSICA
========================================= */


/* ==============================
   SELECCIONAR MASCOTA
============================== */

function seleccionarMascota(nombre, elemento) {

    const petName =
        document.getElementById("petName");

    if (petName) {

        petName.textContent = nombre;

    }


    const mascotas =
        document.querySelectorAll(".pet-option");


    mascotas.forEach(function(mascota) {

        mascota.classList.remove("selected");

    });


    if (elemento) {

        elemento.classList.add("selected");

    }

}


/* ==============================
   REGISTRAR ACTIVIDAD
============================== */

function registrarActividad() {

    mostrarNotificacion(
        "Actividad registrada correctamente.",
        "bi-check-circle-fill"
    );

}


/* ==============================
   AGREGAR PASEO
============================== */

function agregarPaseo() {

    mostrarNotificacion(
        "Puedes agregar un nuevo paseo.",
        "bi-person-walking"
    );

}


/* ==============================
   REGISTRAR PESO
============================== */

function registrarPeso() {

    mostrarNotificacion(
        "Puedes registrar el peso de tu mascota.",
        "bi-speedometer2"
    );

}


/* ==============================
   MOSTRAR NOTIFICACIÓN
============================== */

function mostrarNotificacion(texto, icono) {

    const mensaje =
        document.getElementById("activityMessage");


    if (!mensaje) {

        return;

    }


    mensaje.innerHTML = `
        <i class="bi ${icono}"></i>
        <span>${texto}</span>
    `;


    mensaje.classList.add("show");


    setTimeout(function() {

        mensaje.classList.remove("show");

    }, 3000);

}


/* ==============================
   NOTIFICACIONES
============================== */

const botonNotificacion =
    document.querySelector(".notification-btn");


if (botonNotificacion) {

    botonNotificacion.addEventListener(
        "click",
        function() {

            mostrarNotificacion(
                "No tienes nuevas notificaciones.",
                "bi-bell"
            );

        }
    );

}