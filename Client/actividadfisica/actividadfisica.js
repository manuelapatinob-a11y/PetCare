document.addEventListener("DOMContentLoaded", function () {

    // ==========================
    // DATOS INICIALES
    // ==========================

    let paseos = 2;
    let minutos = 45;
    let calorias = 320;
    let metaDiaria = 60;


    // ==========================
    // ELEMENTOS
    // ==========================

    const botonRegistrar = document.querySelector(".btn-register");

    const tarjetas = document.querySelectorAll(".stat-card h2");

    const porcentajeMeta = document.querySelector(".circle-content h2");

    const circulo = document.querySelector(".progress-circle");

    const metaInfo = document.querySelectorAll(".goal-info strong");

    const historial = document.querySelector(".history-list");


    // ==========================
    // BOTÓN REGISTRAR ACTIVIDAD
    // ==========================

    if (botonRegistrar) {

        botonRegistrar.addEventListener("click", function () {

            const nombre = prompt(
                "¿Qué actividad realizó tu mascota?"
            );

            if (!nombre || nombre.trim() === "") {
                return;
            }


            const duracion = prompt(
                "¿Cuántos minutos duró la actividad?"
            );

            if (!duracion) {
                return;
            }


            const minutosActividad = Number(duracion);


            if (isNaN(minutosActividad) || minutosActividad <= 0) {

                alert("Por favor ingresa un número válido.");

                return;

            }


            // Calorías estimadas

            const caloriasActividad = Math.round(
                minutosActividad * 4
            );


            // Actualizar datos

            paseos++;

            minutos += minutosActividad;

            calorias += caloriasActividad;


            // Actualizar pantalla

            actualizarEstadisticas();

            actualizarMeta();

            agregarAlHistorial(
                nombre,
                minutosActividad,
                caloriasActividad
            );


            alert("¡Actividad registrada correctamente! 🐾");

        });

    }


    // ==========================
    // ACTUALIZAR ESTADÍSTICAS
    // ==========================

    function actualizarEstadisticas() {

        if (tarjetas.length >= 4) {

            tarjetas[0].textContent = paseos;

            tarjetas[1].textContent = minutos + " min";

            tarjetas[2].textContent = calorias;

            let porcentaje = Math.min(
                Math.round((minutos / metaDiaria) * 100),
                100
            );

            tarjetas[3].textContent = porcentaje + "%";

        }

    }


    // ==========================
    // ACTUALIZAR META
    // ==========================

    function actualizarMeta() {

        let porcentaje = Math.min(
            Math.round((minutos / metaDiaria) * 100),
            100
        );


        // Porcentaje del círculo

        if (porcentajeMeta) {

            porcentajeMeta.textContent =
                porcentaje + "%";

        }


        // Cambiar progreso circular

        if (circulo) {

            const grados = porcentaje * 3.6;

            circulo.style.background =
                `conic-gradient(
                    #7046e8 0deg,
                    #7046e8 ${grados}deg,
                    #eee8f7 ${grados}deg
                )`;

        }


        // Minutos realizados

        if (metaInfo.length > 0) {

            metaInfo[0].textContent =
                minutos + " min";

        }

    }


    // ==========================
    // AGREGAR AL HISTORIAL
    // ==========================

    function agregarAlHistorial(
        nombre,
        duracion,
        caloriasActividad
    ) {

        if (!historial) {
            return;
        }


        const nuevaActividad =
            document.createElement("div");


        nuevaActividad.className =
            "history-item";


        nuevaActividad.innerHTML = `

            <div class="history-icon game">

                <i class="bi bi-person-walking"></i>

            </div>

            <div class="activity-info">

                <h5>${nombre}</h5>

                <p>
                    Hoy • ${duracion} minutos
                </p>

            </div>

            <strong>
                +${caloriasActividad} kcal
            </strong>

        `;


        // Agregar arriba del historial

        historial.prepend(nuevaActividad);

    }


    // ==========================
    // INICIAR ESTADÍSTICAS
    // ==========================

    actualizarEstadisticas();

    actualizarMeta();

});