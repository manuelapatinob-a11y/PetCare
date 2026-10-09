// =========================================
// PETCARE - IDEAS CON IA (cajas [data-ideas="seccion"])
// La usan Actividad física y Entrenamiento y comportamiento.
// Usa el motor común ../comun/apartado.js
//
// Cada página define:
//   const IDEAS = {
//       secciones: { paseos: { titulo: "paseos", boton: "ideas" }, ... },
//       descripcion: nombre => "Según ... de " + nombre,
//       destinos: {                       // botones "Agregar a"
//           paseosProximos: {
//               texto: "Agenda de paseos", icono: "bi-calendar-plus",
//               valores: idea => ({...}),    // para llenar el formulario
//               disponible: () => true       // opcional
//           }
//       },
//       destinosDe: { paseos: ["paseosProximos"] }
//   };
// y llama a dibujarIdeas() cada vez que se dibuja la ficha.
// =========================================


function datosIdea(idea) {

    try {

        return JSON.parse(idea.datos_json) || {};

    } catch {

        return {};

    }

}


// "15 a 20 minutos" -> 15; "1 hora" -> 60
function minutosDeTexto(texto) {

    const numero = String(texto || "").match(/\d+([.,]\d+)?/);

    if (!numero) {

        return "";

    }

    const valor = Number(numero[0].replace(",", "."));

    return Math.round(/hora/i.test(texto) ? valor * 60 : valor);

}


// Guarda la idea con su marca de "útil" y la fecha en que se agregó
function guardarIdea(idea, cambios) {

    const datos = new FormData();

    datos.append("util", cambios.util ?? (idea.util ?? ""));

    datos.append("aplicada", cambios.aplicada ?? (idea.aplicada ? idea.aplicada.slice(0, 10) : ""));

    return peticion(`${apartado.ruta}/${idMascota}/ideas/${idea.id_recomendacion}`, { method: "PUT", body: datos });

}


function botonesAgregar(idea) {

    const destinos = (IDEAS.destinosDe[idea.seccion] || [])
        .filter(clave => IDEAS.destinos[clave].disponible?.() ?? true);

    if (!destinos.length) {

        return "";

    }

    return `
        <div class="idea-add">
            <span>Agregar a:</span>
            ${destinos.map(clave => {
                const destino = IDEAS.destinos[clave];
                return `
                    <button type="button" data-aplicar-idea="${idea.id_recomendacion}" data-destino="${clave}">
                        <i class="bi ${destino.icono}"></i> ${destino.texto}
                    </button>
                `;
            }).join("")}
        </div>
    `;

}


function dibujarIdeas() {


    document.querySelectorAll("[data-ideas]").forEach(caja => {


        const seccion = caja.dataset.ideas;

        const config = IDEAS.secciones[seccion];

        const ideas = ficha.ideas.filter(i => i.seccion === seccion);

        const nombre = escaparHTML(ficha.mascota.nombre);

        const palabra = config.boton || "ideas";


        const tarjetas = ideas.map(idea => {

            const d = datosIdea(idea);

            return `
                <article class="idea-card">

                    <div class="idea-top">
                        <strong>${escaparHTML(idea.titulo)}</strong>
                        ${d.intensidad ? badge(`${config.nivel || "Intensidad"} ${d.intensidad}`, { baja: "gray", media: "blue", alta: "purple" }[d.intensidad]) : ""}
                    </div>

                    <p>${escaparHTML(idea.contenido)}</p>

                    <div class="idea-meta">
                        ${d.duracion ? `<span><i class="bi bi-stopwatch"></i> ${escaparHTML(d.duracion)}</span>` : ""}
                        ${d.frecuencia ? `<span><i class="bi bi-arrow-repeat"></i> ${escaparHTML(d.frecuencia)}</span>` : ""}
                    </div>

                    ${d.fundamento ? `<p class="idea-why"><i class="bi bi-patch-check"></i> <strong>Por qué:</strong> ${escaparHTML(d.fundamento)}</p>` : ""}

                    ${d.precauciones ? `<p class="idea-warning"><i class="bi bi-exclamation-triangle"></i> ${escaparHTML(d.precauciones)}</p>` : ""}

                    ${botonesAgregar(idea)}

                    <div class="idea-actions">
                        <small>
                            ${fechaCorta(idea.fecha)}
                            ${idea.aplicada ? ` · <span class="idea-added"><i class="bi bi-check2-circle"></i> Agregada el ${fechaCorta(idea.aplicada)}</span>` : ""}
                        </small>

                        <div>
                            <button type="button" class="${idea.util === 1 ? "active" : ""}" title="Me sirve"
                                    data-util="${idea.id_recomendacion}" data-valor="1">
                                <i class="bi bi-hand-thumbs-up"></i>
                            </button>
                            <button type="button" class="${idea.util === 0 ? "active" : ""}" title="No me sirve"
                                    data-util="${idea.id_recomendacion}" data-valor="0">
                                <i class="bi bi-hand-thumbs-down"></i>
                            </button>
                            <button type="button" class="danger" title="Borrar" data-borrar-idea="${idea.id_recomendacion}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>

                </article>
            `;

        }).join("");


        caja.innerHTML = `
            <div class="ai-header">
                <div>
                    <h3><i class="bi bi-stars"></i> ${palabra[0].toUpperCase() + palabra.slice(1)} con IA para ${config.titulo}</h3>
                    <p>${IDEAS.descripcion(nombre)} Se guardan para consultarlas después.</p>
                </div>

                <button type="button" class="btn-ai" data-generar="${seccion}" ${ficha.iaConfigurada ? "" : "disabled"}>
                    <i class="bi bi-magic"></i>
                    ${ideas.length ? `Generar más ${palabra}` : `Generar ${palabra}`}
                </button>
            </div>

            ${ficha.iaConfigurada ? "" : `
                <p class="ai-note"><i class="bi bi-info-circle"></i>
                    La IA todavía no está configurada en el servidor (falta la clave gratuita GROQ_API_KEY).</p>
            `}

            <div class="ideas-grid">
                ${tarjetas || (ficha.iaConfigurada ? `<p class="records-empty">Aún no hay ${palabra}. Toca "Generar ${palabra}".</p>` : "")}
            </div>

            ${ideas.length ? '<p class="ai-disclaimer">Sugerencias orientativas generadas por inteligencia artificial. Consulta a tu veterinario o a un educador canino antes de hacer cambios importantes, sobre todo si tiene alguna condición de salud.</p>' : ""}
        `;

    });

}


document.addEventListener("click", async event => {


    const generar = event.target.closest("[data-generar]");

    const util = event.target.closest("[data-util]");

    const borrar = event.target.closest("[data-borrar-idea]");

    const aplicar = event.target.closest("[data-aplicar-idea]");


    if (aplicar) {

        const idea = ficha.ideas.find(i => i.id_recomendacion === Number(aplicar.dataset.aplicarIdea));

        const destino = aplicar.dataset.destino;

        abrirFormulario(destino, null, {
            valores: IDEAS.destinos[destino].valores(idea, datosIdea(idea)),
            // Al guardar, la idea queda marcada como agregada
            alGuardar: () => guardarIdea(idea, { aplicada: hoyTexto() })
        });

    } else if (generar) {

        const textoAntes = generar.innerHTML;

        generar.disabled = true;

        generar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Pensando...';


        try {

            const datos = new FormData();

            datos.append("seccion", generar.dataset.generar);

            const respuesta = await peticion(`${apartado.ruta}/${idMascota}/ideas/generar`, { method: "POST", body: datos });

            await cargarFicha();

            mostrarAviso(respuesta.message, "success");

        } catch (e) {

            mostrarAviso(e.message);

            generar.disabled = false;

            generar.innerHTML = textoAntes;

        }

    } else if (util) {

        // Tocar otra vez el mismo botón quita la marca
        const idea = ficha.ideas.find(i => i.id_recomendacion === Number(util.dataset.util));

        const valor = String(idea.util) === util.dataset.valor ? "" : util.dataset.valor;

        try {

            await guardarIdea(idea, { util: valor });

            await cargarFicha();

        } catch (e) {

            mostrarAviso(e.message);

        }

    } else if (borrar) {

        if (!confirm("¿Borrar esta sugerencia de la IA?")) {

            return;

        }


        try {

            await peticion(`${apartado.ruta}/${idMascota}/ideas/${borrar.dataset.borrarIdea}`, { method: "DELETE" });

            await cargarFicha();

        } catch (e) {

            mostrarAviso(e.message);

        }

    }

});
