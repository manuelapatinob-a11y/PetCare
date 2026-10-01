/* =========================================
   PETCARE - SALUD
========================================= */


/* =========================================
   SELECCIONAR MASCOTA
========================================= */

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


/* =========================================
   MOSTRAR MENSAJE
========================================= */

function mostrarMensaje() {

    mostrarNotificacion(
        "Registro agregado correctamente.",
        "bi-check-circle-fill"
    );

}


/* =========================================
   AGREGAR VACUNA
========================================= */

function agregarVacuna() {

    mostrarNotificacion(
        "Puedes agregar una nueva vacuna.",
        "bi-shield-check"
    );

}


/* =========================================
   AGREGAR CITA
========================================= */

function agregarCita() {

    mostrarNotificacion(
        "Puedes agregar una nueva cita veterinaria.",
        "bi-calendar-plus"
    );

}


/* =========================================
   NOTIFICACIÓN
========================================= */

function mostrarNotificacion(texto, icono) {

    const mensaje =
        document.getElementById("healthMessage");


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


/* =========================================
   BOTÓN DE NOTIFICACIONES
========================================= */

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


/* =========================================
   BOTONES DE TRES PUNTOS
========================================= */

const botonesMore =
    document.querySelectorAll(".more-btn");


botonesMore.forEach(function(boton) {

    boton.addEventListener(
        "click",
        function() {

            mostrarNotificacion(
                "Opciones de la cita.",
                "bi-three-dots"
            );

        }
    );

});