// =========================================
// PETCARE - ACTIVIDAD FÍSICA
// Usa ../auth/sesion.js y el motor común ../comun/apartado.js
// =========================================


// =========================================
// TEXTOS Y VALORES
// =========================================

const TEXTOS = {
    intensidad: { baja: "Baja", media: "Media", alta: "Alta" },
    estadoPaseo: { programado: "Programado", realizado: "Realizado", cancelado: "Cancelado" },
    energia: { baja: "Baja", normal: "Normal", alta: "Alta" }
};

// Tipos de actividad (si no está en la lista se elige "Otro" y se escribe)
const TIPOS_ACTIVIDAD = [
    "Paseo", "Caminata", "Carrera", "Juego en casa", "Juego en el parque",
    "Natación", "Agility", "Entrenamiento"
];

// Meta sugerida si la mascota no tiene una registrada
// (orientativa: lo ideal es confirmarla con el veterinario)
const METAS_SUGERIDAS = {
    Perro: { minutos_dia: 60, paseos_semana: 14 },
    Gato: { minutos_dia: 20, paseos_semana: null },
    Conejo: { minutos_dia: 30, paseos_semana: null },
    Ave: { minutos_dia: 30, paseos_semana: null },
    Otro: { minutos_dia: 15, paseos_semana: null }
};


// =========================================
// AYUDAS
// =========================================

function haceDias(dias) {

    const fecha = new Date();

    fecha.setDate(fecha.getDate() - dias);

    return fecha.toLocaleDateString("en-CA");

}


// 135 -> "2 h 15 min"
function duracion(minutos) {

    if (!minutos) {

        return "0 min";

    }

    const h = Math.floor(minutos / 60);

    const m = Math.round(minutos % 60);

    return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;

}


function esPaseo(actividad) {

    return ["Paseo", "Caminata"].includes(actividad.tipo);

}


// Meta actual: la más reciente registrada o la sugerida por especie
function metaActual() {

    const registrada = ficha.metas[0];

    if (registrada) {

        return { ...registrada, sugerida: false };

    }

    return { ...(METAS_SUGERIDAS[ficha.mascota.especie] || METAS_SUGERIDAS.Otro), pasos_dia: null, sugerida: true };

}


// Actividades entre dos fechas "AAAA-MM-DD" (incluidas)
function actividadesEntre(desde, hasta) {

    return ficha.actividades.filter(a => {

        const dia = a.fecha_hora.slice(0, 10);

        return dia >= desde && dia <= hasta;

    });

}


function totales(lista) {

    return {
        minutos: lista.reduce((t, a) => t + a.duracion_min, 0),
        pasos: lista.reduce((t, a) => t + (a.pasos || 0), 0),
        conPasos: lista.some(a => a.pasos !== null),
        calorias: lista.reduce((t, a) => t + (a.calorias || 0), 0),
        conCalorias: lista.some(a => a.calorias !== null),
        paseos: lista.filter(esPaseo).length
    };

}


function minutosDelDia(fecha) {

    return actividadesEntre(fecha, fecha).reduce((t, a) => t + a.duracion_min, 0);

}


// =========================================
// FORMULARIOS
// =========================================

const FORMULARIOS = {

    actividades: () => [
        {
            nombre: "tipo", etiqueta: "Actividad", tipo: "select", requerido: true, col: 6,
            opciones: [...TIPOS_ACTIVIDAD.map(t => [t, t]), ["otro", "Otro"]],
            valor: a => TIPOS_ACTIVIDAD.includes(a.tipo) ? a.tipo : "otro"
        },
        {
            nombre: "tipo_otro", etiqueta: "¿Qué actividad?", tipo: "text", requerido: true, col: 6, max: 60,
            mostrarSi: { campo: "tipo", valor: "otro" },
            valor: a => TIPOS_ACTIVIDAD.includes(a.tipo) ? "" : a.tipo
        },
        { nombre: "fecha_hora", etiqueta: "Fecha y hora", tipo: "datetime", requerido: true, col: 6, defecto: ahoraTexto },
        { nombre: "duracion_min", etiqueta: "Duración (minutos)", tipo: "number", requerido: true, col: 6, min: 1, step: 1 },
        { nombre: "intensidad", etiqueta: "Intensidad", tipo: "select", opciones: opciones(TEXTOS.intensidad), requerido: true, col: 6, defecto: "media" },
        { nombre: "distancia_km", etiqueta: "Distancia (km)", tipo: "number", col: 6, min: 0, step: 0.01 },
        { nombre: "pasos", etiqueta: "Pasos", tipo: "number", col: 6, min: 0, step: 1, ayuda: "Si usas un collar o app que los cuente." },
        { nombre: "calorias", etiqueta: "Calorías", tipo: "number", col: 6, min: 0, step: 1 },
        { nombre: "notas", etiqueta: "Notas", tipo: "text", max: 255 }
    ],

    paseos: () => [
        { nombre: "fecha_hora", etiqueta: "Fecha y hora", tipo: "datetime", requerido: true, col: 6 },
        { nombre: "duracion_min", etiqueta: "Duración (minutos)", tipo: "number", col: 6, min: 1, step: 1 },
        { nombre: "lugar", etiqueta: "Lugar", tipo: "text", col: 6, max: 150, placeholder: "Ej: Parque cercano" },
        {
            nombre: "estado", etiqueta: "Estado", tipo: "select", opciones: opciones(TEXTOS.estadoPaseo), requerido: true, col: 6,
            ayuda: "Al marcarlo como realizado se registra solo como actividad."
        },
        { nombre: "notas", etiqueta: "Notas", tipo: "text", max: 255 }
    ],


    pesos: () => [
        { nombre: "fecha", etiqueta: "Fecha de la medición", tipo: "date", requerido: true, col: 6, defecto: hoyTexto },
        { nombre: "peso_kg", etiqueta: "Peso (kg)", tipo: "number", requerido: true, col: 6, min: 0.01, max: 999.99, step: 0.01 },
        {
            nombre: "condicion_corporal", etiqueta: "Condición corporal", tipo: "select", col: 6,
            opciones: [
                ["", "Sin indicar"],
                ["1", "1 · Muy delgado"], ["2", "2"], ["3", "3 · Delgado"], ["4", "4"],
                ["5", "5 · Ideal"], ["6", "6"], ["7", "7 · Con sobrepeso"], ["8", "8"], ["9", "9 · Obeso"]
            ]
        },
        { nombre: "energia", etiqueta: "Nivel de energía", tipo: "select", col: 6, opciones: [["", "Sin indicar"], ...opciones(TEXTOS.energia)] },
        { nombre: "notas", etiqueta: "Notas", tipo: "text", max: 255 }
    ],

    metas: () => {
        const sugerida = METAS_SUGERIDAS[ficha.mascota.especie] || METAS_SUGERIDAS.Otro;
        return [
            {
                nombre: "minutos_dia", etiqueta: "Minutos de actividad al día", tipo: "number", requerido: true, col: 6, min: 1, step: 1,
                defecto: sugerida.minutos_dia,
                ayuda: `Sugerencia para ${ficha.mascota.especie.toLowerCase()}: ${sugerida.minutos_dia} min. Confírmala con el veterinario según edad, raza y salud.`
            },
            { nombre: "paseos_semana", etiqueta: "Paseos a la semana", tipo: "number", col: 6, min: 0, step: 1, defecto: sugerida.paseos_semana ?? "" },
            { nombre: "pasos_dia", etiqueta: "Pasos al día (opcional)", tipo: "number", col: 6, min: 0, step: 1 },
            { nombre: "fecha_inicio", etiqueta: "Desde", tipo: "date", requerido: true, col: 6, defecto: hoyTexto },
            { nombre: "notas", etiqueta: "Notas", tipo: "text", max: 255, placeholder: "Ej: Indicada por la Dra. Gómez" }
        ];
    }
};


// =========================================
// LISTAS
// =========================================

function tarjetaPaseo(p) {

    const futuro = p.estado === "programado" && p.fecha_hora.slice(0, 10) >= hoyTexto();

    return {
        icono: futuro ? "bi-calendar-event" : "bi-person-walking",
        titulo: p.lugar || "Paseo",
        subtitulo: fechaHora(p.fecha_hora),
        lineas: [p.duracion_min && `Duración: ${duracion(p.duracion_min)}`, p.notas],
        badges: [
            badge(
                p.estado === "programado" && !futuro ? "Programado (ya pasó)" : TEXTOS.estadoPaseo[p.estado],
                { programado: futuro ? "blue" : "orange", realizado: "green", cancelado: "gray" }[p.estado]
            )
        ]
    };

}


const LISTAS = {

    actividades: {
        recurso: "actividades", titulo: "Historial de actividades", icono: "bi-activity", color: "purple",
        descripcion: "Todo el ejercicio registrado.",
        boton: "Registrar actividad", vacio: "No hay actividades registradas.",
        datos: () => ficha.actividades,
        tarjeta: a => ({
            titulo: a.tipo,
            subtitulo: fechaHora(a.fecha_hora),
            lineas: [
                [duracion(a.duracion_min), a.distancia_km && `${numero(a.distancia_km)} km`,
                    a.pasos !== null && `${numero(a.pasos)} pasos`, a.calorias !== null && `${numero(a.calorias)} kcal`].filter(Boolean).join(" · "),
                a.notas
            ],
            badges: [
                badge(`Intensidad ${TEXTOS.intensidad[a.intensidad].toLowerCase()}`, { baja: "gray", media: "blue", alta: "purple" }[a.intensidad]),
                a.id_paseo && badge("De la agenda de paseos", "green")
            ]
        })
    },

    paseosProximos: {
        recurso: "paseos", titulo: "Próximos paseos", icono: "bi-calendar-plus", color: "blue",
        descripcion: "Se crea un recordatorio que verás en tu Inicio.",
        boton: "Programar paseo", vacio: "No hay paseos programados.",
        defectos: { estado: "programado" },
        datos: () => ficha.paseos
            .filter(p => p.estado === "programado" && p.fecha_hora.slice(0, 10) >= hoyTexto())
            .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora)),
        tarjeta: tarjetaPaseo
    },

    paseosAnteriores: {
        recurso: "paseos", titulo: "Paseos anteriores", icono: "bi-clock-history", color: "green",
        descripcion: "Edita un paseo para marcarlo como realizado o cancelado.",
        boton: "Registrar paseo realizado", vacio: "No hay paseos anteriores.",
        defectos: { estado: "realizado" },
        datos: () => ficha.paseos.filter(p => !(p.estado === "programado" && p.fecha_hora.slice(0, 10) >= hoyTexto())),
        tarjeta: tarjetaPaseo
    },


    pesos: {
        recurso: "pesos", titulo: "Control de peso", icono: "bi-speedometer2", color: "purple",
        descripcion: "El registro más reciente es su peso actual (también se ve en Alimentación).",
        boton: "Registrar peso", vacio: "No hay mediciones de peso.",
        datos: () => ficha.pesos,
        tarjeta: (p, i, lista) => {
            const anterior = lista[i + 1];
            const diferencia = anterior ? p.peso_kg - anterior.peso_kg : 0;
            return {
                titulo: `${numero(p.peso_kg)} kg`,
                subtitulo: fechaCorta(p.fecha),
                lineas: [
                    [p.condicion_corporal && `Condición corporal: ${p.condicion_corporal}/9`, p.energia && `Energía: ${TEXTOS.energia[p.energia]}`].filter(Boolean).join(" · "),
                    p.notas
                ],
                badges: [
                    anterior && Math.abs(diferencia) >= 0.01
                        ? badge(`${diferencia > 0 ? "▲ +" : "▼ "}${numero(diferencia)} kg`, diferencia > 0 ? "orange" : "blue")
                        : anterior ? badge("Estable", "green") : ""
                ]
            };
        }
    },

    metas: {
        recurso: "metas", titulo: "Meta de actividad", icono: "bi-bullseye", color: "green",
        descripcion: "La más reciente es la meta actual. Con ella se mide el monitor de actividad.",
        boton: "Definir meta", vacio: "Aún no hay meta: se usa una sugerida según la especie.",
        datos: () => ficha.metas,
        tarjeta: (m, i) => ({
            titulo: `${m.minutos_dia} min al día`,
            subtitulo: `Desde ${fechaCorta(m.fecha_inicio)}`,
            lineas: [
                [m.paseos_semana !== null && `${m.paseos_semana} paseos a la semana`, m.pasos_dia !== null && `${numero(m.pasos_dia)} pasos al día`].filter(Boolean).join(" · "),
                m.notas
            ],
            badges: [i === 0 ? badge("Meta actual", "green") : badge("Anterior", "gray")]
        })
    }
};


const ID_RECURSO = {
    actividades: "id_actividad", paseos: "id_paseo",
    pesos: "id_peso", metas: "id_meta"
};


// =========================================
// FICHA DE LA MASCOTA (con la barra de hoy)
// =========================================

function dibujarFicha() {


    const m = ficha.mascota;

    const foto = urlFoto(m.foto);

    const meta = metaActual();

    const hoy = minutosDelDia(hoyTexto());

    const avance = Math.min(100, Math.round((hoy / meta.minutos_dia) * 100));

    const cumplida = hoy >= meta.minutos_dia;

    const proximo = LISTAS.paseosProximos.datos()[0];

    const semana = totales(actividadesEntre(haceDias(6), hoyTexto()));

    const paseosSemana = semana.paseos;


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
                    <span><i class="bi bi-speedometer2"></i> ${m.peso_actual ? numero(m.peso_actual) + " kg" : "Peso sin dato"}</span>
                    <span><i class="bi bi-bullseye"></i> Meta: ${meta.minutos_dia} min al día${meta.sugerida ? " (sugerida)" : ""}</span>
                </div>
            </div>
        </div>

        <div class="today-meter">
            <div class="today-head">
                <span>Actividad de hoy</span>
                <strong>${duracion(hoy)} <small>de ${duracion(meta.minutos_dia)}</small></strong>
            </div>

            <div class="meter" role="meter" aria-valuemin="0" aria-valuemax="${meta.minutos_dia}" aria-valuenow="${hoy}"
                 aria-label="Minutos de actividad de hoy">
                <div class="meter-fill ${cumplida ? "done" : ""}" style="width: ${avance}%"></div>
            </div>

            <small class="today-status">
                ${cumplida
                    ? '<i class="bi bi-check-circle-fill"></i> Meta de hoy cumplida'
                    : `<i class="bi bi-hourglass-split"></i> Faltan ${duracion(meta.minutos_dia - hoy)}`}
            </small>
        </div>

        <div class="health-next">
            <div>
                <span><i class="bi bi-calendar-event"></i> Próximo paseo</span>
                <strong>${proximo ? fechaHora(proximo.fecha_hora) : "—"}</strong>
            </div>
            <div>
                <span><i class="bi bi-person-walking"></i> Paseos esta semana</span>
                <strong>${paseosSemana}${meta.paseos_semana ? ` de ${meta.paseos_semana}` : ""}</strong>
            </div>
            <div>
                <span><i class="bi bi-stopwatch"></i> Tiempo activo esta semana</span>
                <strong>${duracion(semana.minutos)}</strong>
            </div>
        </div>
    `;

}


// =========================================
// INDICADORES DE LA SEMANA (frente a la semana anterior)
// =========================================

function dibujarIndicadores() {


    const semana = totales(actividadesEntre(haceDias(6), hoyTexto()));

    const anterior = totales(actividadesEntre(haceDias(13), haceDias(7)));


    // Cambio frente a la semana anterior: más actividad es bueno
    const cambio = (ahora, antes) => {

        if (!antes) {

            return '<span class="kpi-delta neutral">Sin datos la semana anterior</span>';

        }

        const porcentajeCambio = Math.round(((ahora - antes) / antes) * 100);

        if (porcentajeCambio === 0) {

            return '<span class="kpi-delta neutral">= Igual que la semana anterior</span>';

        }

        const sube = porcentajeCambio > 0;

        return `<span class="kpi-delta ${sube ? "up" : "down"}">
            <i class="bi bi-arrow-${sube ? "up" : "down"}-right"></i>
            ${sube ? "+" : ""}${porcentajeCambio}% vs semana anterior
        </span>`;

    };


    const tile = (icono, etiqueta, valor, delta) => `
        <div class="kpi-tile">
            <span class="kpi-label"><i class="bi ${icono}"></i> ${etiqueta}</span>
            <strong class="kpi-value">${valor}</strong>
            ${delta}
        </div>
    `;


    document.getElementById("indicadores").innerHTML =
        tile("bi-signpost-2", "Pasos esta semana",
            semana.conPasos ? numero(semana.pasos) : "—",
            semana.conPasos ? cambio(semana.pasos, anterior.pasos) : '<span class="kpi-delta neutral">Registra los pasos al anotar actividades</span>') +
        tile("bi-person-walking", "Paseos esta semana",
            semana.paseos,
            cambio(semana.paseos, anterior.paseos)) +
        tile("bi-stopwatch", "Tiempo activo",
            duracion(semana.minutos),
            cambio(semana.minutos, anterior.minutos)) +
        tile("bi-fire", "Calorías",
            semana.conCalorias ? `${numero(semana.calorias)} kcal` : "—",
            semana.conCalorias ? cambio(semana.calorias, anterior.calorias) : '<span class="kpi-delta neutral">Registra las calorías al anotar actividades</span>');

}


// =========================================
// MONITOR DE ACTIVIDAD (columnas: minutos por día vs meta)
// =========================================

function dibujarMonitor() {


    const meta = metaActual();


    const dias = Array.from({ length: 7 }, (_, i) => {

        const fecha = haceDias(6 - i);

        const lista = actividadesEntre(fecha, fecha);

        return {
            fecha,
            minutos: lista.reduce((t, a) => t + a.duracion_min, 0),
            actividades: lista.length,
            nombre: i === 6 ? "Hoy" : aFecha(fecha).toLocaleDateString("es-CO", { weekday: "short" }).replace(".", ""),
            largo: aFecha(fecha).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" })
        };

    });


    // Escala: el máximo entre la meta (con margen) y el día más activo
    const maximo = Math.max(meta.minutos_dia * 1.25, ...dias.map(d => d.minutos), 1);

    const total = dias.reduce((t, d) => t + d.minutos, 0);

    const avance = Math.round((total / (meta.minutos_dia * 7)) * 100);

    const diasCumplidos = dias.filter(d => d.minutos >= meta.minutos_dia).length;


    document.getElementById("textoMeta").textContent =
        `Últimos 7 días · meta: ${meta.minutos_dia} min al día${meta.sugerida ? " (sugerida según la especie)" : ""}`;


    document.getElementById("monitor").innerHTML = `
        <div class="column-chart" role="img"
             aria-label="Minutos de actividad por día en los últimos 7 días. Total ${duracion(total)}, ${diasCumplidos} de 7 días con la meta cumplida.">

            <div class="chart-plot">

                <div class="goal-line" style="bottom: ${(meta.minutos_dia / maximo) * 100}%">
                    <span>Meta ${meta.minutos_dia} min</span>
                </div>

                ${dias.map(d => `
                    <div class="chart-column" tabindex="0"
                         data-tip="${d.largo}: ${duracion(d.minutos)} · ${d.actividades} ${d.actividades === 1 ? "actividad" : "actividades"}">
                        ${d.minutos ? `<span class="column-value">${d.minutos}</span>` : ""}
                        <div class="column-bar" style="height: ${(d.minutos / maximo) * 100}%"></div>
                    </div>
                `).join("")}

            </div>

            <div class="chart-labels">
                ${dias.map(d => `
                    <div class="${d.nombre === "Hoy" ? "today" : ""}">
                        ${d.nombre}
                        ${d.minutos >= meta.minutos_dia ? '<i class="bi bi-check-circle-fill" title="Meta cumplida"></i>' : ""}
                    </div>
                `).join("")}
            </div>

        </div>
    `;


    // Mensaje según cómo va la semana
    const nombre = escaparHTML(ficha.mascota.nombre);

    document.getElementById("mensajeMonitor").innerHTML =
        total === 0
            ? `<i class="bi bi-info-circle"></i> Aún no hay actividades esta semana. Registra los paseos y el juego de ${nombre}.`
            : avance >= 90
                ? `<i class="bi bi-emoji-smile"></i> ¡Excelente! ${nombre} lleva el ${avance}% de su meta semanal (${diasCumplidos} de 7 días cumplidos).`
                : avance >= 60
                    ? `<i class="bi bi-hand-thumbs-up"></i> Va bien: ${nombre} lleva el ${avance}% de su meta semanal. Un poco más de juego o paseo y la cumple.`
                    : `<i class="bi bi-exclamation-circle"></i> ${nombre} lleva el ${avance}% de su meta semanal. Necesita más actividad.`;


    // La misma información en tabla
    document.getElementById("tablaMonitor").innerHTML = `
        <table class="monitor-data">
            <thead><tr><th>Día</th><th>Minutos</th><th>Actividades</th><th>Meta</th></tr></thead>
            <tbody>
                ${dias.map(d => `
                    <tr>
                        <td>${d.largo}</td>
                        <td>${d.minutos}</td>
                        <td>${d.actividades}</td>
                        <td>${d.minutos >= meta.minutos_dia ? "Cumplida" : `Faltaron ${meta.minutos_dia - d.minutos} min`}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

}


// =========================================
// IDEAS CON IA (las dibuja ../comun/ideas.js)
// =========================================

const IDEAS = {

    secciones: {
        actividades: { titulo: "actividades y juegos" },
        paseos: { titulo: "paseos" },
        peso: { titulo: "control de peso" },
        meta: { titulo: "su meta de actividad" }
    },

    descripcion: nombre => `Según el peso, la raza, la edad y la salud de ${nombre}.`,

    // Botones "Agregar a" de cada idea
    destinos: {

        actividades: {
            texto: "Actividades", icono: "bi-activity",
            valores: (idea, d) => {
                const enLista = TIPOS_ACTIVIDAD.find(t => t.toLowerCase() === idea.titulo.toLowerCase());
                return {
                    tipo: enLista || "otro",
                    tipo_otro: enLista ? "" : idea.titulo.slice(0, 60),
                    fecha_hora: ahoraTexto(),
                    duracion_min: minutosDeTexto(d.duracion),
                    intensidad: d.intensidad || "media",
                    notas: `Idea de la IA: ${idea.contenido}`.slice(0, 255)
                };
            }
        },

        paseosProximos: {
            texto: "Agenda de paseos", icono: "bi-calendar-plus",
            valores: (idea, d) => ({
                duracion_min: minutosDeTexto(d.duracion),
                estado: "programado",
                notas: `${idea.titulo}: ${idea.contenido}`.slice(0, 255)
            })
        }
    },

    destinosDe: {
        actividades: ["actividades", "paseosProximos"],
        paseos: ["actividades", "paseosProximos"],
        peso: ["actividades", "paseosProximos"],
        meta: ["actividades", "paseosProximos"]
    }
};


// =========================================
// INICIAR
// =========================================

iniciarApartado({
    ruta: "/actividad",
    listas: LISTAS,
    formularios: FORMULARIOS,
    ids: ID_RECURSO,
    alDibujar: () => {
        dibujarFicha();
        dibujarIndicadores();
        dibujarMonitor();
        dibujarIdeas();
    }
});
