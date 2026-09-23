document.addEventListener("DOMContentLoaded", function () {

    // ===============================
    // ELEMENTOS DEL HTML
    // ===============================

    const formulario = document.getElementById("recordatorioForm");
    const listaRecordatorios = document.querySelector(".reminders-list");

    const mascota = document.getElementById("mascota");
    const tipo = document.getElementById("tipo");
    const titulo = document.getElementById("titulo");
    const fecha = document.getElementById("fecha");
    const hora = document.getElementById("hora");
    const notas = document.getElementById("notas");

    let contador = 4;


    // ===============================
    // AGREGAR RECORDATORIO
    // ===============================

    if (formulario) {

        formulario.addEventListener("submit", function (event) {

            event.preventDefault();

            // Obtener información
            const mascotaValor = mascota.value;
            const tipoValor = tipo.value;
            const tituloValor = titulo.value.trim();
            const fechaValor = fecha.value;
            const horaValor = hora.value;
            const notasValor = notas.value.trim();


            // Validar campos
            if (
                mascotaValor === "" ||
                tipoValor === "" ||
                tituloValor === "" ||
                fechaValor === ""
            ) {

                alert("Por favor completa los campos obligatorios. 🐾");
                return;

            }


            // Convertir fecha
            const fechaFormateada = formatearFecha(fechaValor);


            // Crear recordatorio
            const recordatorio = document.createElement("div");

            recordatorio.classList.add("reminder-item");

            recordatorio.innerHTML = `

                <div class="reminder-check">

                    <button class="complete-btn" title="Marcar como completado">

                        <i class="bi bi-check-lg"></i>

                    </button>

                </div>


                <div class="reminder-content">

                    <div class="reminder-title">

                        <h4>${tituloValor}</h4>

                        <span class="reminder-type">
                            ${tipoValor}
                        </span>

                    </div>


                    <p class="reminder-pet">

                        <i class="bi bi-heart-fill"></i>

                        ${mascotaValor}

                    </p>


                    <div class="reminder-date">

                        <i class="bi bi-calendar3"></i>

                        ${fechaFormateada}

                        ${horaValor ? `
                            · <i class="bi bi-clock"></i>
                            ${horaValor}
                        ` : ""}

                    </div>

                    ${
                        notasValor
                        ? `<p class="reminder-note">${notasValor}</p>`
                        : ""
                    }

                </div>


                <button class="delete-btn" title="Eliminar recordatorio">

                    <i class="bi bi-trash"></i>

                </button>

            `;


            // Agregar a la lista
            listaRecordatorios.appendChild(recordatorio);


            // Activar botones
            activarBotones(recordatorio);


            // Actualizar estadísticas
            actualizarContadores();


            // Limpiar formulario
            formulario.reset();


            // Cerrar modal
            const modalElement =
                document.getElementById("modalRecordatorio");

            if (modalElement) {

                const modal =
                    bootstrap.Modal.getInstance(modalElement);

                if (modal) {
                    modal.hide();
                }

            }


            alert("¡Recordatorio creado correctamente! 🔔💜");

        });

    }


    // ===============================
    // ACTIVAR BOTONES
    // ===============================

    function activarBotones(recordatorio) {

        // Botón completar
        const botonCompletar =
            recordatorio.querySelector(".complete-btn");


        if (botonCompletar) {

            botonCompletar.addEventListener("click", function () {

                recordatorio.classList.toggle("completed");

                actualizarContadores();

            });

        }


        // Botón eliminar
        const botonEliminar =
            recordatorio.querySelector(".delete-btn");


        if (botonEliminar) {

            botonEliminar.addEventListener("click", function () {

                const confirmar =
                    confirm(
                        "¿Seguro que quieres eliminar este recordatorio?"
                    );


                if (confirmar) {

                    recordatorio.remove();

                    actualizarContadores();

                }

            });

        }

    }


    // ===============================
    // ACTIVAR BOTONES EXISTENTES
    // ===============================

    document
        .querySelectorAll(".reminder-item")
        .forEach(function (recordatorio) {

            activarBotones(recordatorio);

        });


    // ===============================
    // FORMATEAR FECHA
    // ===============================

    function formatearFecha(fecha) {

        const partes = fecha.split("-");

        const año = partes[0];
        const mes = partes[1];
        const dia = partes[2];

        const meses = [
            "enero",
            "febrero",
            "marzo",
            "abril",
            "mayo",
            "junio",
            "julio",
            "agosto",
            "septiembre",
            "octubre",
            "noviembre",
            "diciembre"
        ];

        return `${dia} de ${meses[parseInt(mes) - 1]} de ${año}`;

    }


    // ===============================
    // ACTUALIZAR CONTADORES
    // ===============================

    function actualizarContadores() {

        const recordatorios =
            document.querySelectorAll(".reminder-item");

        const completados =
            document.querySelectorAll(
                ".reminder-item.completed"
            );

        const pendientes =
            recordatorios.length - completados.length;


        // Buscar tarjetas de estadísticas
        const tarjetas =
            document.querySelectorAll(".summary-card");


        if (tarjetas.length >= 4) {

            // Pendientes
            const numeroPendientes =
                tarjetas[3].querySelector("h2");

            if (numeroPendientes) {
                numeroPendientes.textContent = pendientes;
            }


            // Completados
            const numeroCompletados =
                tarjetas[1].querySelector("h2");

            if (numeroCompletados) {
                numeroCompletados.textContent =
                    completados.length;
            }

        }

    }


    // ===============================
    // BOTÓN DE VOLVER
    // ===============================

    const botonVolver =
        document.querySelector(".back-button");


    if (botonVolver) {

        botonVolver.addEventListener("click", function () {

            window.history.back();

        });

    }


    // ===============================
    // FECHA ACTUAL EN EL FORMULARIO
    // ===============================

    const hoy = new Date();

    const año = hoy.getFullYear();

    const mes =
        String(hoy.getMonth() + 1).padStart(2, "0");

    const dia =
        String(hoy.getDate()).padStart(2, "0");


    const fechaActual =
        `${año}-${mes}-${dia}`;


    if (fecha) {
        fecha.min = fechaActual;
    }

});