// =========================================
// PETCARE - CAMPANITA DE NOTIFICACIONES
// La carga ../auth/sesion.js en las páginas con sesión iniciada.
// Usa: peticion() y RUTA_SESION de sesion.js
// =========================================

(function () {

    const ESTILO = {
        vacuna: { icono: "bi-shield-plus", color: "verde" },
        desparasitacion: { icono: "bi-bug", color: "naranja" },
        cita: { icono: "bi-calendar-check", color: "azul" },
        medicamento: { icono: "bi-capsule", color: "morado" },
        recordatorio: { icono: "bi-alarm", color: "azul" },
        alimento: { icono: "bi-basket2", color: "naranja" },
        comida: { icono: "bi-cup-hot", color: "naranja" },
        snack: { icono: "bi-gift", color: "morado" }
    };

    let datos = null;


    function escapar(texto) {

        const div = document.createElement("div");

        div.textContent = texto ?? "";

        return div.innerHTML;

    }


    // "hace 5 min", "hace 2 h", "ayer", "3 oct"
    function hace(fechaTexto) {

        const fecha = new Date(fechaTexto);

        const minutos = Math.round((Date.now() - fecha) / 60000);

        if (minutos < 1) return "ahora";
        if (minutos < 60) return `hace ${minutos} min`;
        if (minutos < 24 * 60) return `hace ${Math.round(minutos / 60)} h`;
        if (minutos < 48 * 60) return "ayer";

        return fecha.toLocaleDateString("es-CO", { day: "numeric", month: "short" });

    }


    // =========================================
    // ARMAR LA CAMPANITA EN EL ENCABEZADO
    // =========================================

    function montar() {


        const zona = document.querySelector(".user-area");

        // Botones de campana de ejemplo que ya no se usan
        const anterior = document.querySelector(".notification-btn, .user-area .notification, .top-header .notification, header .notification");


        const campana = document.createElement("div");

        campana.className = "campana";

        campana.innerHTML = `
            <button type="button" class="campana-boton" aria-label="Notificaciones" aria-expanded="false">
                <i class="bi bi-bell"></i>
                <span class="campana-numero" hidden></span>
            </button>

            <div class="campana-panel" hidden>

                <div class="campana-encabezado">
                    <strong>Notificaciones</strong>
                    <button type="button" class="campana-todas">Marcar todas como leídas</button>
                </div>

                <div class="campana-lista">
                    <p class="campana-vacia">Cargando...</p>
                </div>

                <div class="campana-pie">
                    <label>
                        <input type="checkbox" class="campana-correo">
                        Recibir los avisos también por correo
                    </label>
                    <label>
                        <input type="checkbox" class="campana-recordatorios">
                        Recordatorios de vacunas, citas y medicamentos
                    </label>
                    <label>
                        <input type="checkbox" class="campana-comidas">
                        Recordatorios de comidas y snacks
                    </label>
                    <small class="campana-aviso" hidden>
                        El correo del servidor todavía no está configurado: por ahora los avisos solo se ven aquí.
                    </small>
                </div>

            </div>
        `;


        if (anterior) {

            anterior.replaceWith(campana);

        } else if (zona) {

            zona.prepend(campana);

        } else {

            return null;

        }


        return campana;

    }


    // =========================================
    // DIBUJAR
    // =========================================

    function dibujar(campana) {


        const numero = campana.querySelector(".campana-numero");

        numero.hidden = !datos.noLeidas;

        numero.textContent = datos.noLeidas > 9 ? "9+" : datos.noLeidas;


        const lista = campana.querySelector(".campana-lista");

        lista.innerHTML = datos.notificaciones.length
            ? datos.notificaciones.map(n => {

                const estilo = ESTILO[n.categoria] || { icono: "bi-bell", color: "morado" };

                return `
                    <button type="button" class="campana-item ${n.leida ? "" : "nueva"}" data-id="${n.id_notificacion}">
                        <span class="campana-icono ${estilo.color}"><i class="bi ${estilo.icono}"></i></span>
                        <span class="campana-texto">
                            <strong>${escapar(n.titulo)}</strong>
                            <span>${escapar(n.mensaje)}</span>
                            <small>
                                ${hace(n.fecha_envio)}
                                ${n.correo_enviado ? ' · <i class="bi bi-envelope-check"></i> enviado al correo' : ""}
                            </small>
                        </span>
                    </button>
                `;

            }).join("")
            : '<p class="campana-vacia"><i class="bi bi-check2-circle"></i> No tienes notificaciones.</p>';


        campana.querySelector(".campana-correo").checked = datos.preferencias.correo;

        campana.querySelector(".campana-recordatorios").checked = datos.preferencias.recordatorios;

        campana.querySelector(".campana-comidas").checked = datos.preferencias.comidas;

        campana.querySelector(".campana-aviso").hidden = datos.preferencias.correoConfigurado;

        campana.querySelector(".campana-todas").hidden = !datos.noLeidas;

    }


    async function cargar(campana) {

        try {

            datos = await peticion("/notificaciones");

            dibujar(campana);

        } catch {

            campana.querySelector(".campana-lista").innerHTML =
                '<p class="campana-vacia">No se pudieron cargar las notificaciones.</p>';

        }

    }


    // =========================================
    // EVENTOS
    // =========================================

    function activar(campana) {


        const boton = campana.querySelector(".campana-boton");

        const panel = campana.querySelector(".campana-panel");


        const abrir = abierto => {

            panel.hidden = !abierto;

            boton.setAttribute("aria-expanded", String(abierto));

        };


        boton.addEventListener("click", () => {

            abrir(panel.hidden);

            if (!panel.hidden) {

                cargar(campana);

            }

        });


        // Cerrar al tocar fuera o con Escape
        document.addEventListener("click", event => {

            if (!campana.contains(event.target)) {

                abrir(false);

            }

        });

        document.addEventListener("keydown", event => {

            if (event.key === "Escape") {

                abrir(false);

            }

        });


        // Tocar una notificación: queda leída y abre su página
        campana.querySelector(".campana-lista").addEventListener("click", async event => {


            const item = event.target.closest(".campana-item");

            if (!item) {

                return;

            }


            const notificacion = datos.notificaciones.find(n => n.id_notificacion === Number(item.dataset.id));


            if (!notificacion.leida) {

                try {

                    await peticion(`/notificaciones/${notificacion.id_notificacion}/leida`, { method: "PUT" });

                    notificacion.leida = true;

                    datos.noLeidas = Math.max(datos.noLeidas - 1, 0);

                    dibujar(campana);

                } catch {

                    // Si falla, igual se abre la página
                }

            }


            if (notificacion.enlace) {

                window.location.href = new URL(`../${notificacion.enlace}`, RUTA_SESION).href;

            } else {

                cargar(campana);

            }

        });


        campana.querySelector(".campana-todas").addEventListener("click", async () => {

            await peticion("/notificaciones/leidas", { method: "PUT" });

            cargar(campana);

        });


        // Preferencias: correo, recordatorios y comidas
        campana.querySelectorAll(".campana-correo, .campana-recordatorios, .campana-comidas").forEach(casilla => {

            casilla.addEventListener("change", async () => {

                const formulario = new FormData();

                formulario.append("correo", campana.querySelector(".campana-correo").checked ? "1" : "0");

                formulario.append("recordatorios", campana.querySelector(".campana-recordatorios").checked ? "1" : "0");

                formulario.append("comidas", campana.querySelector(".campana-comidas").checked ? "1" : "0");

                await peticion("/notificaciones/preferencias", { method: "PUT", body: formulario });

            });

        });

    }


    // =========================================
    // INICIAR
    // =========================================

    const campana = montar();

    if (campana) {

        activar(campana);

        cargar(campana);

        // Revisar si hay nuevas cada 2 minutos
        setInterval(() => cargar(campana), 2 * 60 * 1000);

    }

})();
