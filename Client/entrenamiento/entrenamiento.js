// =========================================
// PETCARE - ENTRENAMIENTO Y COMPORTAMIENTO
// Usa ../auth/sesion.js, el motor común ../comun/apartado.js
// y las ideas con IA de ../comun/ideas.js
// =========================================


// =========================================
// TEXTOS Y VALORES
// =========================================

const TEXTOS = {
    progreso: { iniciado: "Iniciado", en_progreso: "En progreso", dominado: "Dominado" },
    tipoConducta: { positivo: "Conducta buena", neutral: "Neutral", a_mejorar: "A mejorar" },
    animo: { feliz: "Feliz", tranquilo: "Tranquilo", energico: "Enérgico", ansioso: "Ansioso", triste: "Triste", agresivo: "Agresivo" },
    intensidad: { leve: "Leve", moderada: "Moderada", fuerte: "Fuerte" },
    dia: {
        todos: "Todos los días", lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves",
        viernes: "Viernes", sabado: "Sábado", domingo: "Domingo"
    },
    categoria: {
        alimentacion: "Comida", paseo: "Paseo", entrenamiento: "Entrenamiento", juego: "Juego",
        higiene: "Higiene", medicamento: "Medicamento", descanso: "Descanso"
    },
    nivel: { basico: "Básico", intermedio: "Intermedio", avanzado: "Avanzado" }
};

const EMOJI_ANIMO = { feliz: "😊", tranquilo: "😌", energico: "⚡", ansioso: "😟", triste: "😢", agresivo: "😠" };

const ICONO_CATEGORIA = {
    alimentacion: "bi-cup-hot", paseo: "bi-person-walking", entrenamiento: "bi-trophy", juego: "bi-balloon",
    higiene: "bi-droplet", medicamento: "bi-capsule", descanso: "bi-moon-stars"
};

// Día de la semana de hoy como lo guarda la base de datos
const DIAS_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];


// =========================================
// AYUDAS
// =========================================

function haceDias(dias) {

    const fecha = new Date();

    fecha.setDate(fecha.getDate() - dias);

    return fecha.toLocaleDateString("en-CA");

}


function rutinaActiva() {

    return ficha.rutinas.find(r => r.activa) || null;

}


function pasosDe(idRutina) {

    return ficha.pasosRutina.filter(p => p.id_rutina === idRutina);

}


// Actividades de la rutina activa que tocan hoy, por hora
function rutinaDeHoy() {

    const activa = rutinaActiva();

    if (!activa) {

        return [];

    }

    const hoy = DIAS_SEMANA[new Date().getDay()];

    return pasosDe(activa.id_rutina)
        .filter(p => p.dia_semana === "todos" || p.dia_semana === hoy)
        .sort((a, b) => a.hora.localeCompare(b.hora));

}


function diarioDesde(dias) {

    const desde = haceDias(dias);

    return ficha.diario.filter(d => d.fecha_hora.slice(0, 10) >= desde);

}


// =========================================
// FORMULARIOS
// =========================================

const FORMULARIOS = {

    entrenamientos: () => [
        { nombre: "comando", etiqueta: "Comando o habilidad", tipo: "text", requerido: true, col: 6, max: 100, placeholder: "Ej: Sentado, quieto, ven..." },
        { nombre: "fecha", etiqueta: "Fecha", tipo: "date", requerido: true, col: 6, defecto: hoyTexto },
        { nombre: "duracion_min", etiqueta: "Duración de la sesión (minutos)", tipo: "number", col: 6, min: 1, step: 1 },
        { nombre: "nivel_progreso", etiqueta: "Progreso", tipo: "select", opciones: opciones(TEXTOS.progreso), requerido: true, col: 6, defecto: "iniciado" },
        { nombre: "notas", etiqueta: "Pasos y notas", tipo: "textarea" }
    ],

    diario: () => [
        { nombre: "fecha_hora", etiqueta: "Fecha y hora", tipo: "datetime", requerido: true, col: 6, defecto: ahoraTexto },
        {
            nombre: "tipo", etiqueta: "¿Cómo fue la conducta?", tipo: "select", requerido: true, col: 6, defecto: "neutral",
            opciones: [["positivo", "👍 Conducta buena"], ["neutral", "Neutral"], ["a_mejorar", "⚠️ A mejorar"]]
        },
        { nombre: "comportamiento", etiqueta: "¿Qué hizo?", tipo: "text", requerido: true, col: 6, max: 150, placeholder: "Ej: Ladró a las visitas, se quedó quieto al abrir la puerta" },
        {
            nombre: "estado_animo", etiqueta: "Estado de ánimo", tipo: "select", requerido: true, col: 6, defecto: "tranquilo",
            opciones: Object.entries(TEXTOS.animo).map(([valor, texto]) => [valor, `${EMOJI_ANIMO[valor]} ${texto}`])
        },
        { nombre: "intensidad", etiqueta: "Intensidad", tipo: "select", col: 6, opciones: [["", "Sin indicar"], ...opciones(TEXTOS.intensidad)] },
        { nombre: "detonante", etiqueta: "¿Qué lo provocó?", tipo: "text", col: 6, max: 150, placeholder: "Ej: El timbre, otro perro, quedarse solo" },
        { nombre: "respuesta", etiqueta: "¿Qué hiciste y cómo reaccionó?", tipo: "text", max: 255, placeholder: "Ej: Lo llamé a su cama, se calmó en 1 minuto" },
        { nombre: "descripcion", etiqueta: "Notas", tipo: "textarea" }
    ],

    rutinas: () => [
        { nombre: "nombre", etiqueta: "Nombre de la rutina", tipo: "text", requerido: true, col: 6, max: 100, placeholder: "Ej: Rutina entre semana" },
        { nombre: "objetivo", etiqueta: "Objetivo", tipo: "text", col: 6, max: 100, placeholder: "Ej: Que se canse antes de quedarse solo" },
        { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea" },
        { nombre: "activa", etiqueta: "Usar como rutina actual (se muestra en \"Rutina de hoy\")", tipo: "switch", defecto: !ficha.rutinas.length }
    ],

    pasosRutina: () => [
        {
            nombre: "id_rutina", etiqueta: "Rutina", tipo: "select", requerido: true, col: 6,
            opciones: ficha.rutinas.map(r => [r.id_rutina, r.activa ? `${r.nombre} (actual)` : r.nombre]),
            defecto: rutinaActiva()?.id_rutina
        },
        { nombre: "dia_semana", etiqueta: "Día", tipo: "select", requerido: true, col: 6, opciones: opciones(TEXTOS.dia), defecto: "todos" },
        { nombre: "hora", etiqueta: "Hora", tipo: "time", requerido: true, col: 6 },
        { nombre: "duracion_min", etiqueta: "Duración (minutos)", tipo: "number", col: 6, min: 1, step: 1 },
        { nombre: "actividad", etiqueta: "Actividad", tipo: "text", requerido: true, col: 6, max: 150, placeholder: "Ej: Práctica de \"quieto\"" },
        { nombre: "categoria", etiqueta: "Tipo", tipo: "select", requerido: true, col: 6, opciones: opciones(TEXTOS.categoria), defecto: "entrenamiento" },
        { nombre: "detalle", etiqueta: "Cómo hacerlo", tipo: "text", max: 255 }
    ]
};


// =========================================
// LISTAS
// =========================================

const LISTAS = {

    entrenamientos: {
        recurso: "entrenamientos", titulo: "Comandos y habilidades", icono: "bi-trophy", color: "orange",
        descripcion: "Lo que está aprendiendo y lo que ya domina.",
        boton: "Registrar entrenamiento", vacio: "No hay entrenamientos registrados. Usa una idea de la IA o registra uno.",
        datos: () => ficha.entrenamientos,
        resumen: lista => {
            const dominados = lista.filter(e => e.nivel_progreso === "dominado").length;
            return `${dominados} ${dominados === 1 ? "dominado" : "dominados"} de ${lista.length}`;
        },
        tarjeta: e => ({
            titulo: e.comando,
            subtitulo: fechaCorta(e.fecha),
            lineas: [e.duracion_min && `Sesión de ${e.duracion_min} min`, e.notas],
            badges: [badge(TEXTOS.progreso[e.nivel_progreso], { iniciado: "gray", en_progreso: "blue", dominado: "green" }[e.nivel_progreso])]
        })
    },

    diario: {
        recurso: "diario", titulo: "Diario de comportamiento", icono: "bi-journal-text", color: "purple",
        descripcion: "Anota las conductas buenas y las que quieres mejorar: la IA las usa para darte consejos.",
        boton: "Anotar conducta", vacio: "Aún no hay anotaciones en el diario.",
        datos: () => ficha.diario,
        tarjeta: d => ({
            icono: { positivo: "bi-hand-thumbs-up", neutral: "bi-journal-text", a_mejorar: "bi-exclamation-triangle" }[d.tipo],
            color: { positivo: "green", neutral: "purple", a_mejorar: "orange" }[d.tipo],
            titulo: d.comportamiento,
            subtitulo: fechaHora(d.fecha_hora),
            lineas: [
                d.detonante && `Lo provocó: ${d.detonante}`,
                d.respuesta && `Qué hiciste: ${d.respuesta}`,
                d.descripcion
            ],
            badges: [
                badge(TEXTOS.tipoConducta[d.tipo], { positivo: "green", neutral: "gray", a_mejorar: "orange" }[d.tipo]),
                badge(`${EMOJI_ANIMO[d.estado_animo]} ${TEXTOS.animo[d.estado_animo]}`, "blue"),
                d.intensidad && badge(`Intensidad ${TEXTOS.intensidad[d.intensidad].toLowerCase()}`, { leve: "gray", moderada: "orange", fuerte: "red" }[d.intensidad])
            ]
        })
    },

    // Estas dos se dibujan en "Generador de rutinas" (no tienen contenedor [data-lista])
    rutinas: {
        recurso: "rutinas", titulo: "Rutinas", icono: "bi-calendar2-week", color: "blue",
        descripcion: "", boton: "Crear rutina", vacio: "",
        datos: () => ficha.rutinas, tarjeta: () => ({})
    },

    pasosRutina: {
        recurso: "pasosRutina", titulo: "Actividades de la rutina", icono: "bi-clock", color: "blue",
        descripcion: "", boton: "Agregar actividad", vacio: "",
        datos: () => ficha.pasosRutina, tarjeta: () => ({})
    }
};


const ID_RECURSO = {
    entrenamientos: "id_entrenamiento", diario: "id_diario", rutinas: "id_rutina",
    pasosRutina: "id_rutina_actividad", ideas: "id_recomendacion"
};


// =========================================
// FICHA DE LA MASCOTA Y RUTINA DE HOY
// =========================================

function dibujarFicha() {


    const m = ficha.mascota;

    const foto = urlFoto(m.foto);

    const dominados = ficha.entrenamientos.filter(e => e.nivel_progreso === "dominado").length;

    const semana = diarioDesde(6);

    const buenas = semana.filter(d => d.tipo === "positivo").length;

    const aMejorar = semana.filter(d => d.tipo === "a_mejorar").length;

    const activa = rutinaActiva();

    const hoy = rutinaDeHoy();

    const ahora = new Date().toTimeString().slice(0, 5);


    const listaHoy = hoy.length
        ? hoy.map(p => {
            const paso = p.hora.slice(0, 5) < ahora;
            return `
                <li class="${paso ? "past" : ""}">
                    <span class="today-time">${horaCorta(p.hora)}</span>
                    <i class="bi ${ICONO_CATEGORIA[p.categoria]}"></i>
                    <span>${escaparHTML(p.actividad)}${p.duracion_min ? ` <small>· ${p.duracion_min} min</small>` : ""}</span>
                </li>
            `;
        }).join("")
        : `<li class="today-empty">${activa ? "Hoy no hay actividades en la rutina." : "Aún no tiene una rutina. Créala en \"Generador de rutinas\"."}</li>`;


    document.getElementById("ficha").innerHTML = `

        <div class="health-pet">
            <div class="health-photo">
                ${foto ? `<img src="${escaparHTML(foto)}" alt="">` : emojiEspecie[m.especie] || "🐾"}
            </div>

            <div>
                <h3>${escaparHTML(m.nombre)}</h3>
                <p>${escaparHTML([m.especie, m.raza].filter(Boolean).join(" · "))}</p>

                <div class="health-facts">
                    <span><i class="bi bi-calendar3"></i> ${calcularEdad(m.fecha_nacimiento) || "Edad sin dato"}</span>
                    <span><i class="bi bi-trophy"></i> ${dominados} ${dominados === 1 ? "comando dominado" : "comandos dominados"}</span>
                    <span><i class="bi bi-journal-text"></i> Esta semana: ${buenas} 👍 · ${aMejorar} ⚠️</span>
                </div>
            </div>
        </div>

        <div class="today-routine">
            <div class="today-routine-head">
                <span><i class="bi bi-calendar-check"></i> Rutina de hoy</span>
                ${activa ? `<small>${escaparHTML(activa.nombre)}</small>` : ""}
            </div>
            <ul>${listaHoy}</ul>
        </div>
    `;

}


// =========================================
// CONSEJOS Y GUÍAS (guías básicas guardadas)
// =========================================

let filtroGuias = "todas";


function dibujarGuias() {


    const guias = ficha.guias.filter(g => filtroGuias === "todas" || g.categoria === filtroGuias);

    const boton = (valor, texto) =>
        `<button type="button" class="guide-filter ${filtroGuias === valor ? "active" : ""}" data-filtro-guias="${valor}">${texto}</button>`;


    document.getElementById("guias").innerHTML = `

        <div class="list-header">
            <div>
                <h3><i class="bi bi-book"></i> Guías básicas</h3>
                <p>Guías para ${escaparHTML(ficha.mascota.especie.toLowerCase())}s y para todas las mascotas.</p>
            </div>

            <div class="guide-filters">
                ${boton("todas", "Todas")}
                ${boton("entrenamiento", "Entrenamiento")}
                ${boton("comportamiento", "Comportamiento")}
            </div>
        </div>

        <div class="guides-grid">
            ${guias.map(g => `
                <article class="guide-card">
                    <div class="guide-top">
                        <span class="record-icon ${g.categoria === "entrenamiento" ? "orange" : "purple"}">
                            <i class="bi ${g.categoria === "entrenamiento" ? "bi-trophy" : "bi-emoji-smile"}"></i>
                        </span>
                        <div>
                            <strong>${escaparHTML(g.titulo)}</strong>
                            <div class="badges">
                                ${badge(g.categoria === "entrenamiento" ? "Entrenamiento" : "Comportamiento", g.categoria === "entrenamiento" ? "orange" : "purple")}
                                ${badge(TEXTOS.nivel[g.nivel] || "", "gray")}
                            </div>
                        </div>
                    </div>

                    <p>${escaparHTML(g.contenido)}</p>

                    ${g.categoria === "entrenamiento" ? `
                        <button type="button" class="guide-practice" data-practicar="${g.id_consejo}">
                            <i class="bi bi-plus-lg"></i> Empezar a practicarlo
                        </button>
                    ` : ""}
                </article>
            `).join("") || '<p class="records-empty">No hay guías en esta categoría.</p>'}
        </div>
    `;

}


// =========================================
// RESUMEN DEL DIARIO (últimos 30 días)
// =========================================

function dibujarResumenDiario() {


    const mes = diarioDesde(29);

    const nombre = escaparHTML(ficha.mascota.nombre);


    if (!mes.length) {

        document.getElementById("resumenDiario").innerHTML = `
            <div class="list-header">
                <div>
                    <h3><i class="bi bi-graph-up"></i> Resumen de los últimos 30 días</h3>
                    <p>Anota cómo se comporta ${nombre} para ver aquí su ánimo y lo que provoca sus conductas.</p>
                </div>
            </div>
        `;

        return;

    }


    const contar = clave => mes.reduce((t, d) => ({ ...t, [d[clave]]: (t[d[clave]] || 0) + 1 }), {});

    const animos = contar("estado_animo");

    const tipos = contar("tipo");


    // Lo que más provoca las conductas a mejorar
    const detonantes = Object.entries(
        mes.filter(d => d.tipo === "a_mejorar" && d.detonante)
            .reduce((t, d) => {
                const clave = d.detonante.trim().toLowerCase();
                t[clave] = t[clave] || { texto: d.detonante.trim(), veces: 0 };
                t[clave].veces++;
                return t;
            }, {})
    ).map(([, v]) => v).sort((a, b) => b.veces - a.veces).slice(0, 3);


    document.getElementById("resumenDiario").innerHTML = `

        <div class="list-header">
            <div>
                <h3><i class="bi bi-graph-up"></i> Resumen de los últimos 30 días</h3>
                <p>${mes.length} ${mes.length === 1 ? "anotación" : "anotaciones"} de ${nombre}.</p>
            </div>
        </div>

        <div class="diary-summary">

            <div>
                <span class="summary-label">Conductas</span>
                <div class="mood-chips">
                    <span class="mood-chip good">👍 ${tipos.positivo || 0} buenas</span>
                    <span class="mood-chip">${tipos.neutral || 0} neutrales</span>
                    <span class="mood-chip warn">⚠️ ${tipos.a_mejorar || 0} a mejorar</span>
                </div>
            </div>

            <div>
                <span class="summary-label">Estado de ánimo</span>
                <div class="mood-chips">
                    ${Object.entries(animos).sort((a, b) => b[1] - a[1]).map(([animo, veces]) =>
                        `<span class="mood-chip">${EMOJI_ANIMO[animo]} ${TEXTOS.animo[animo]} · ${veces}</span>`
                    ).join("")}
                </div>
            </div>

            <div>
                <span class="summary-label">Lo que más provoca las conductas a mejorar</span>
                ${detonantes.length
                    ? `<ol class="trigger-list">${detonantes.map(d => `<li>${escaparHTML(d.texto)} <small>(${d.veces} ${d.veces === 1 ? "vez" : "veces"})</small></li>`).join("")}</ol>`
                    : '<p class="summary-empty">Anota "¿Qué lo provocó?" en las conductas a mejorar para verlo aquí.</p>'}
            </div>

        </div>
    `;

}


// =========================================
// RUTINAS
// =========================================

function dibujarRutinas() {


    // Formulario del generador
    const selector = document.getElementById("rutinaObjetivo");

    const elegido = selector.value;

    selector.innerHTML = Object.entries(ficha.objetivos)
        .map(([valor, texto]) => `<option value="${valor}" ${valor === elegido ? "selected" : ""}>${escaparHTML(texto)}</option>`)
        .join("");

    document.getElementById("botonRutinaIA").disabled = !ficha.iaConfigurada;

    document.getElementById("notaIA").classList.toggle("d-none", ficha.iaConfigurada);

    document.getElementById("textoGenerador").textContent =
        `Una rutina semanal hecha a la medida de ${ficha.mascota.nombre}: su edad, raza, salud, lo que ya sabe y su diario de comportamiento.`;


    if (!ficha.rutinas.length) {

        document.getElementById("rutinas").innerHTML = `
            <div class="panel-box">
                <p class="records-empty">Aún no hay rutinas. Genera una con IA o créala a mano.</p>
            </div>
        `;

        return;

    }


    document.getElementById("rutinas").innerHTML = ficha.rutinas.map(r => {


        const pasos = pasosDe(r.id_rutina);

        // Primero lo de todos los días y luego cada día
        const grupos = Object.keys(TEXTOS.dia)
            .map(dia => ({ dia, pasos: pasos.filter(p => p.dia_semana === dia).sort((a, b) => a.hora.localeCompare(b.hora)) }))
            .filter(g => g.pasos.length);

        const minutosDia = pasos
            .filter(p => p.dia_semana === "todos" && ["entrenamiento", "juego", "paseo"].includes(p.categoria))
            .reduce((t, p) => t + (p.duracion_min || 0), 0);


        return `
            <article class="panel-box routine-card ${r.activa ? "active" : ""}">

                <div class="list-header">
                    <div>
                        <h3><i class="bi bi-calendar2-week"></i> ${escaparHTML(r.nombre)}</h3>
                        <div class="badges">
                            ${r.activa ? badge("Rutina actual", "green") : ""}
                            ${r.generada_ia ? badge("Generada con IA", "purple") : badge("Creada a mano", "gray")}
                            ${r.objetivo ? badge(r.objetivo, "blue") : ""}
                            ${minutosDia ? badge(`${minutosDia} min diarios de actividad`, "orange") : ""}
                        </div>
                    </div>

                    <div class="record-actions">
                        ${r.activa ? "" : `<button type="button" title="Usar como rutina actual" data-activar-rutina="${r.id_rutina}"><i class="bi bi-check2-circle"></i></button>`}
                        <button type="button" title="Editar rutina" data-editar="rutinas" data-id="${r.id_rutina}"><i class="bi bi-pencil"></i></button>
                        <button type="button" title="Eliminar rutina" class="danger" data-eliminar="rutinas" data-id="${r.id_rutina}"><i class="bi bi-trash"></i></button>
                    </div>
                </div>

                ${r.descripcion ? `<p class="routine-text">${escaparHTML(r.descripcion)}</p>` : ""}

                ${r.fundamento ? `<p class="routine-why"><i class="bi bi-patch-check"></i> <strong>Por qué:</strong> ${escaparHTML(r.fundamento)}</p>` : ""}

                ${grupos.map(g => `
                    <h6 class="routine-day">${TEXTOS.dia[g.dia]}</h6>
                    <ul class="routine-steps">
                        ${g.pasos.map(p => `
                            <li>
                                <span class="today-time">${horaCorta(p.hora)}</span>
                                <span class="step-icon"><i class="bi ${ICONO_CATEGORIA[p.categoria]}"></i></span>
                                <div class="step-body">
                                    <strong>${escaparHTML(p.actividad)}</strong>
                                    <small>${[TEXTOS.categoria[p.categoria], p.duracion_min && `${p.duracion_min} min`].filter(Boolean).join(" · ")}</small>
                                    ${p.detalle ? `<p>${escaparHTML(p.detalle)}</p>` : ""}
                                </div>
                                <div class="record-actions">
                                    <button type="button" title="Editar" data-editar="pasosRutina" data-id="${p.id_rutina_actividad}"><i class="bi bi-pencil"></i></button>
                                    <button type="button" title="Eliminar" class="danger" data-eliminar="pasosRutina" data-id="${p.id_rutina_actividad}"><i class="bi bi-trash"></i></button>
                                </div>
                            </li>
                        `).join("")}
                    </ul>
                `).join("") || '<p class="records-empty">Esta rutina aún no tiene actividades.</p>'}

                <button type="button" class="btn-add-small routine-add" data-agregar-paso="${r.id_rutina}">
                    <i class="bi bi-plus-lg"></i>
                    <span>Agregar actividad</span>
                </button>

            </article>
        `;

    }).join("");

}


// Generar una rutina con IA
document.getElementById("formRutinaIA").addEventListener("submit", async event => {


    event.preventDefault();

    const boton = document.getElementById("botonRutinaIA");

    boton.disabled = true;

    boton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Armando la rutina...';


    try {

        const respuesta = await peticion(`/entrenamiento/${idMascota}/rutinas/generar`, {
            method: "POST",
            body: new FormData(event.target)
        });

        await cargarFicha();

        mostrarAviso(respuesta.message, "success");

        document.getElementById("rutinas").scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (e) {

        mostrarAviso(e.message);

    } finally {

        boton.disabled = !ficha.iaConfigurada;

        boton.innerHTML = '<i class="bi bi-magic"></i> Generar rutina con IA';

    }

});


document.addEventListener("click", async event => {


    const activar = event.target.closest("[data-activar-rutina]");

    const agregarPaso = event.target.closest("[data-agregar-paso]");

    const filtro = event.target.closest("[data-filtro-guias]");

    const practicar = event.target.closest("[data-practicar]");


    if (activar) {

        const rutina = ficha.rutinas.find(r => r.id_rutina === Number(activar.dataset.activarRutina));

        const datos = new FormData();

        datos.append("nombre", rutina.nombre);

        datos.append("objetivo", rutina.objetivo || "");

        datos.append("descripcion", rutina.descripcion || "");

        datos.append("activa", "1");


        try {

            await peticion(`/entrenamiento/${idMascota}/rutinas/${rutina.id_rutina}`, { method: "PUT", body: datos });

            await cargarFicha();

            mostrarAviso(`"${rutina.nombre}" es ahora la rutina actual.`, "success");

        } catch (e) {

            mostrarAviso(e.message);

        }

    } else if (agregarPaso) {

        abrirFormulario("pasosRutina", null, { valores: { id_rutina: Number(agregarPaso.dataset.agregarPaso) } });

    } else if (filtro) {

        filtroGuias = filtro.dataset.filtroGuias;

        dibujarGuias();

    } else if (practicar) {

        const guia = ficha.guias.find(g => g.id_consejo === Number(practicar.dataset.practicar));

        abrirFormulario("entrenamientos", null, {
            valores: { comando: guia.titulo.slice(0, 100), notas: guia.contenido }
        });

    }

});


// =========================================
// IDEAS CON IA (las dibuja ../comun/ideas.js)
// =========================================

const IDEAS = {

    secciones: {
        entrenamiento: { titulo: "su entrenamiento", nivel: "Dificultad" },
        comportamiento: { titulo: "su comportamiento", boton: "consejos", nivel: "Prioridad" }
    },

    descripcion: nombre => `Según la edad, la raza, la salud, lo que ya sabe y el diario de comportamiento de ${nombre}.`,

    // Botones "Agregar a" de cada idea
    destinos: {

        entrenamientos: {
            texto: "Entrenamiento", icono: "bi-trophy",
            valores: (idea, d) => ({
                comando: idea.titulo.slice(0, 100),
                fecha: hoyTexto(),
                duracion_min: minutosDeTexto(d.duracion),
                nivel_progreso: "iniciado",
                notas: [idea.contenido, d.frecuencia && `Practicar: ${d.frecuencia}`, d.precauciones && `Precauciones: ${d.precauciones}`]
                    .filter(Boolean).join("\n\n")
            })
        },

        pasosRutina: {
            texto: "Rutina", icono: "bi-calendar2-week",
            disponible: () => ficha.rutinas.length > 0,
            valores: (idea, d) => ({
                id_rutina: rutinaActiva()?.id_rutina ?? ficha.rutinas[0].id_rutina,
                dia_semana: "todos",
                actividad: idea.titulo.slice(0, 150),
                categoria: "entrenamiento",
                duracion_min: minutosDeTexto(d.duracion),
                detalle: idea.contenido.slice(0, 255)
            })
        }
    },

    destinosDe: {
        entrenamiento: ["entrenamientos", "pasosRutina"],
        comportamiento: ["pasosRutina"]
    }
};


// =========================================
// INICIAR
// =========================================

iniciarApartado({
    ruta: "/entrenamiento",
    listas: LISTAS,
    formularios: FORMULARIOS,
    ids: ID_RECURSO,
    alDibujar: () => {
        dibujarFicha();
        dibujarIdeas();
        dibujarGuias();
        dibujarResumenDiario();
        dibujarRutinas();
    }
});
