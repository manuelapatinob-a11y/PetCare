// =========================================
// PETCARE - SALUD
// Usa ../auth/sesion.js y el motor común ../comun/apartado.js
// =========================================

let filtroHistorial = "todo";


// =========================================
// TEXTOS PARA MOSTRAR
// =========================================

const TEXTOS = {
    tipoCita: {
        control: "Revisión", vacunacion: "Vacunación", urgencia: "Urgencia",
        seguimiento: "Seguimiento", cirugia: "Cirugía", otro: "Otro"
    },
    estadoCita: { programada: "Programada", completada: "Completada", cancelada: "Cancelada" },
    origen: { veterinario: "Informe veterinario", propietario: "Observación del dueño" },
    evolucion: { mejorando: "Mejorando", igual: "Sigue igual", empeorando: "Empeorando", resuelto: "Resuelto" },
    cumplido: { si: "Sí", parcial: "Parcialmente", no: "No" },
    antecedente: {
        alergia: "Alergia", reaccion: "Reacción", lesion: "Lesión",
        accidente: "Accidente", cirugia: "Cirugía", observacion: "Observación"
    },
    gravedad: { leve: "Leve", moderada: "Moderada", grave: "Grave" },
    estadoEnfermedad: { activa: "Activa", controlada: "Controlada", curada: "Curada" },
    documento: {
        informe: "Informe", receta: "Receta", factura: "Factura",
        analisis: "Resultado de análisis", otro: "Otro"
    },
    desparasitacion: { interna: "Interna", externa: "Externa" }
};


// =========================================
// AYUDAS PROPIAS DE SALUD
// =========================================

function enCurso(medicamento) {

    return !medicamento.fecha_fin || medicamento.fecha_fin >= hoyTexto();

}


// Si el tipo es "otro", se muestra lo que escribió el usuario
function textoTipoCita(cita) {

    return cita.tipo === "otro" && cita.tipo_otro
        ? cita.tipo_otro
        : TEXTOS.tipoCita[cita.tipo];

}


// =========================================
// FORMULARIOS DE CADA TIPO DE REGISTRO
// Tipos de campo: text, textarea, date, datetime, select, number, switch, file
// =========================================

const campoOrigen = {
    nombre: "origen", etiqueta: "¿De dónde viene esta información?", tipo: "select",
    opciones: opciones(TEXTOS.origen), requerido: true, col: 6, defecto: "propietario"
};


const FORMULARIOS = {

    vacunas: () => [
        {
            nombre: "id_tipo_vacuna", etiqueta: "Vacuna", tipo: "select", col: 6,
            opciones: [
                ["", "Otra (escribir el nombre)"],
                ...ficha.catalogos.tiposVacuna.map(t => [t.id_tipo_vacuna, t.nombre])
            ]
        },
        { nombre: "nombre_vacuna", etiqueta: "Nombre de la vacuna (si no está en la lista)", tipo: "text", col: 6, max: 100 },
        { nombre: "fecha_aplicacion", etiqueta: "Fecha de aplicación", tipo: "date", requerido: true, col: 6, defecto: hoyTexto },
        { nombre: "proxima_dosis", etiqueta: "Próxima fecha prevista", tipo: "date", col: 6 },
        { nombre: "clinica", etiqueta: "Clínica", tipo: "text", col: 6, max: 150 },
        { nombre: "veterinario", etiqueta: "Veterinario", tipo: "text", col: 6, max: 120 },
        { nombre: "lote", etiqueta: "Lote", tipo: "text", col: 6, max: 50 },
        { nombre: "observaciones", etiqueta: "Observaciones", tipo: "textarea" }
    ],

    desparasitaciones: () => [
        { nombre: "tipo", etiqueta: "Tipo", tipo: "select", opciones: opciones(TEXTOS.desparasitacion), requerido: true, col: 6 },
        { nombre: "producto", etiqueta: "Producto utilizado", tipo: "text", requerido: true, col: 6, max: 120 },
        { nombre: "dosis", etiqueta: "Dosis registrada", tipo: "text", col: 4, max: 60, placeholder: "Ej: 1 tableta" },
        { nombre: "fecha_aplicacion", etiqueta: "Fecha de aplicación", tipo: "date", requerido: true, col: 4, defecto: hoyTexto },
        { nombre: "proxima_aplicacion", etiqueta: "Próxima aplicación", tipo: "date", col: 4 },
        { nombre: "observaciones", etiqueta: "Observaciones", tipo: "textarea" }
    ],

    enfermedades: () => [
        { nombre: "nombre", etiqueta: "Enfermedad", tipo: "text", requerido: true, col: 6, max: 150 },
        { nombre: "fecha_diagnostico", etiqueta: "Fecha de diagnóstico", tipo: "date", col: 6 },
        { nombre: "estado", etiqueta: "Estado", tipo: "select", opciones: opciones(TEXTOS.estadoEnfermedad), requerido: true, col: 6, defecto: "activa" },
        campoOrigen,
        { nombre: "cronica", etiqueta: "Es una enfermedad crónica", tipo: "switch" },
        { nombre: "observaciones", etiqueta: "Observaciones", tipo: "textarea" }
    ],

    sintomas: () => [
        { nombre: "descripcion", etiqueta: "Síntoma observado", tipo: "text", requerido: true, col: 6, max: 200, placeholder: "Ej: Vómito, cojera, se rasca..." },
        { nombre: "fecha_inicio", etiqueta: "Fecha de inicio", tipo: "date", requerido: true, col: 6, defecto: hoyTexto },
        { nombre: "frecuencia", etiqueta: "Frecuencia", tipo: "text", col: 6, max: 80, placeholder: "Ej: 2 veces al día" },
        { nombre: "evolucion", etiqueta: "Evolución", tipo: "select", opciones: opciones(TEXTOS.evolucion), requerido: true, col: 6, defecto: "igual" },
        { nombre: "cambios", etiqueta: "Cambios en el apetito, comportamiento o actividad", tipo: "textarea" },
        { nombre: "id_cita", etiqueta: "¿Se revisó en una cita?", tipo: "select", opciones: opcionesCitas() },
        { nombre: "observaciones", etiqueta: "Observaciones", tipo: "textarea" }
    ],

    antecedentes: (lista) => [
        {
            nombre: "tipo", etiqueta: "Tipo", tipo: lista.tipos.length === 1 ? "hidden" : "select", requerido: true, col: 6,
            opciones: lista.tipos.map(t => [t, TEXTOS.antecedente[t]]), defecto: lista.tipos[0]
        },
        { nombre: "descripcion", etiqueta: lista.etiquetaDescripcion, tipo: "text", requerido: true, col: lista.tipos.length === 1 ? 12 : 6, max: 200 },
        { nombre: "fecha", etiqueta: "Fecha", tipo: "date", col: 6 },
        ...(lista.tipos.includes("observacion")
            ? []
            : [{ nombre: "gravedad", etiqueta: "Gravedad", tipo: "select", col: 6, opciones: [["", "Sin indicar"], ...opciones(TEXTOS.gravedad)] }]),
        { ...campoOrigen, col: lista.tipos.includes("observacion") ? 6 : 12 },
        { nombre: "observaciones", etiqueta: "Detalles", tipo: "textarea" }
    ],

    medicamentos: () => [
        { nombre: "nombre", etiqueta: "Medicamento o producto", tipo: "text", requerido: true, col: 6, max: 120 },
        { nombre: "dosis", etiqueta: "Dosis indicada", tipo: "text", requerido: true, col: 6, max: 60, placeholder: "Ej: 16 mg" },
        { nombre: "frecuencia", etiqueta: "Frecuencia de administración", tipo: "text", requerido: true, col: 6, max: 60, placeholder: "Ej: Cada 12 horas" },
        { nombre: "via", etiqueta: "Vía", tipo: "text", col: 6, max: 40, placeholder: "Oral, tópica, inyectable..." },
        { nombre: "fecha_inicio", etiqueta: "Fecha de inicio", tipo: "date", requerido: true, col: 6, defecto: hoyTexto },
        { nombre: "fecha_fin", etiqueta: "Fecha de finalización", tipo: "date", col: 6 },
        { nombre: "id_cita", etiqueta: "Recetado en la cita", tipo: "select", opciones: opcionesCitas() },
        { nombre: "efectos_observados", etiqueta: "Efectos observados", tipo: "textarea" },
        { nombre: "notas", etiqueta: "Notas del propietario", tipo: "textarea" }
    ],

    citas: () => [
        { seccion: "1. Datos de la cita" },
        { nombre: "fecha_hora", etiqueta: "Fecha y hora", tipo: "datetime", requerido: true, col: 6 },
        { nombre: "tipo", etiqueta: "Tipo de cita", tipo: "select", opciones: opciones(TEXTOS.tipoCita), requerido: true, col: 6, defecto: "control" },
        {
            nombre: "tipo_otro", etiqueta: "¿Qué tipo de cita es?", tipo: "text", requerido: true, col: 12, max: 100,
            placeholder: "Ej: Limpieza dental, certificado de viaje, fisioterapia...",
            mostrarSi: { campo: "tipo", valor: "otro" }
        },
        { nombre: "motivo", etiqueta: "Motivo de la consulta", tipo: "text", requerido: true, col: 12, max: 200 },
        { nombre: "clinica", etiqueta: "Clínica o lugar de atención", tipo: "text", col: 6, max: 150 },
        { nombre: "estado", etiqueta: "Estado", tipo: "select", opciones: opciones(TEXTOS.estadoCita), requerido: true, col: 6, defecto: "programada" },

        { seccion: "2. Motivo y síntomas" },
        { nombre: "sintomas_descripcion", etiqueta: "¿Qué le sucede a la mascota?", tipo: "textarea" },
        { nombre: "sintomas_inicio", etiqueta: "¿Cuándo comenzaron los síntomas?", tipo: "date", col: 6 },
        { nombre: "cambios_observados", etiqueta: "Cambios en el apetito, comportamiento o actividad", tipo: "textarea" },
        { nombre: "evolucion_sintomas", etiqueta: "Frecuencia y evolución de los síntomas", tipo: "textarea" },

        { seccion: "3. Atención veterinaria" },
        { nombre: "veterinario", etiqueta: "Nombre del veterinario", tipo: "text", col: 6, max: 120 },
        {
            nombre: "origen_informacion", etiqueta: "Esta información viene de...", tipo: "select", col: 6,
            opciones: opciones(TEXTOS.origen), requerido: true, defecto: "propietario",
            ayuda: "Indica si los datos están en un informe del veterinario o son tu propia observación."
        },
        { nombre: "pruebas_realizadas", etiqueta: "Exploraciones y pruebas realizadas", tipo: "textarea" },
        { nombre: "resultados", etiqueta: "Resultados comunicados", tipo: "textarea" },
        { nombre: "diagnostico", etiqueta: "Diagnóstico (si lo confirmó el veterinario)", tipo: "textarea" },

        { seccion: "4. Tratamiento e indicaciones", ayuda: "Los medicamentos recetados se agregan en la pestaña Medicamentos, eligiendo esta cita." },
        { nombre: "cuidados_casa", etiqueta: "Cuidados recomendados en casa", tipo: "textarea" },
        { nombre: "restricciones", etiqueta: "Restricciones de alimentación o actividad", tipo: "textarea" },
        {
            nombre: "proxima_revision", etiqueta: "Próxima dosis o fecha de revisión", tipo: "date", col: 6,
            ayuda: "Se creará un recordatorio para ese día."
        },

        { seccion: "5. Seguimiento" },
        { nombre: "evolucion_posterior", etiqueta: "Evolución después de la consulta", tipo: "textarea" },
        {
            nombre: "tratamiento_cumplido", etiqueta: "¿Se cumplió el tratamiento?", tipo: "select", col: 6,
            opciones: [["", "Sin indicar"], ...opciones(TEXTOS.cumplido)]
        },
        { nombre: "costo", etiqueta: "Costo de la consulta (COP)", tipo: "number", col: 6, min: 0, step: 1 },
        { nombre: "sintomas_nuevos", etiqueta: "Mejorías o síntomas nuevos", tipo: "textarea" },
        { nombre: "notas", etiqueta: "Notas", tipo: "textarea" }
    ],

    documentos: () => [
        { nombre: "tipo", etiqueta: "Tipo de documento", tipo: "select", opciones: opciones(TEXTOS.documento), requerido: true, col: 6 },
        { nombre: "fecha", etiqueta: "Fecha", tipo: "date", requerido: true, col: 6, defecto: hoyTexto },
        { nombre: "titulo", etiqueta: "Título", tipo: "text", requerido: true, col: 12, max: 150, placeholder: "Ej: Resultado de hemograma" },
        { nombre: "archivo", etiqueta: "Foto o PDF (máximo 5 MB)", tipo: "file", requerido: true, aceptar: "image/jpeg,image/png,image/webp,application/pdf" },
        { nombre: "id_cita", etiqueta: "Cita relacionada", tipo: "select", opciones: opcionesCitas() },
        { nombre: "notas", etiqueta: "Notas", tipo: "textarea" }
    ],
};



function opcionesCitas() {

    return [
        ["", "Ninguna"],
        ...ficha.citas.map(c => [c.id_cita, `${fechaCorta(c.fecha_hora)} · ${c.motivo}`])
    ];

}


// =========================================
// LISTAS QUE SE MUESTRAN EN CADA PESTAÑA
// =========================================

const LISTAS = {

    vacunas: {
        recurso: "vacunas", titulo: "Vacunas", icono: "bi-shield-plus", color: "green",
        descripcion: "Vacunas aplicadas según tus registros.",
        boton: "Agregar vacuna", vacio: "No hay vacunas registradas.",
        datos: () => ficha.vacunas,
        tarjeta: v => ({
            titulo: v.tipo_vacuna || v.nombre_vacuna,
            subtitulo: `Aplicada el ${fechaCorta(v.fecha_aplicacion)}`,
            lineas: [
                v.proxima_dosis && H(`<i class="bi bi-calendar-event"></i> Próxima: ${fechaCorta(v.proxima_dosis)}`),
                [v.clinica, v.veterinario].filter(Boolean).join(" · "),
                v.lote && `Lote: ${v.lote}`,
                v.observaciones
            ],
            badges: [
                v.proxima_dosis && v.proxima_dosis < hoyTexto()
                    ? badge("Refuerzo vencido", "red")
                    : v.proxima_dosis ? badge("Al día", "green") : ""
            ]
        })
    },

    desparasitaciones: {
        recurso: "desparasitaciones", titulo: "Desparasitaciones", icono: "bi-bug", color: "orange",
        descripcion: "Internas y externas, con producto y dosis.",
        boton: "Agregar desparasitación", vacio: "No hay desparasitaciones registradas.",
        datos: () => ficha.desparasitaciones,
        tarjeta: d => ({
            titulo: d.producto,
            subtitulo: `Aplicada el ${fechaCorta(d.fecha_aplicacion)}`,
            lineas: [
                d.dosis && `Dosis: ${d.dosis}`,
                d.proxima_aplicacion && H(`<i class="bi bi-calendar-event"></i> Próxima: ${fechaCorta(d.proxima_aplicacion)}`),
                d.observaciones
            ],
            badges: [badge(TEXTOS.desparasitacion[d.tipo], d.tipo === "interna" ? "purple" : "orange")]
        })
    },

    enfermedades: {
        recurso: "enfermedades", titulo: "Enfermedades conocidas", icono: "bi-virus", color: "red",
        descripcion: "Diagnosticadas o conocidas por ti.",
        boton: "Agregar enfermedad", vacio: "No hay enfermedades registradas.",
        datos: () => ficha.enfermedades,
        tarjeta: e => ({
            titulo: e.nombre,
            subtitulo: e.fecha_diagnostico ? `Diagnosticada el ${fechaCorta(e.fecha_diagnostico)}` : "Sin fecha de diagnóstico",
            lineas: [e.observaciones],
            badges: [
                badge(TEXTOS.estadoEnfermedad[e.estado], { activa: "red", controlada: "orange", curada: "green" }[e.estado]),
                e.cronica && badge("Crónica", "purple"),
                badgeOrigen(e.origen)
            ]
        })
    },

    sintomas: {
        recurso: "sintomas", titulo: "Síntomas observados", icono: "bi-thermometer-half", color: "orange",
        descripcion: "Qué notas y desde cuándo.",
        boton: "Agregar síntoma", vacio: "No hay síntomas registrados.",
        datos: () => ficha.sintomas,
        tarjeta: s => ({
            titulo: s.descripcion,
            subtitulo: `Desde el ${fechaCorta(s.fecha_inicio)}`,
            lineas: [s.frecuencia && `Frecuencia: ${s.frecuencia}`, s.cambios, s.observaciones],
            badges: [badge(TEXTOS.evolucion[s.evolucion], {
                mejorando: "green", igual: "gray", empeorando: "red", resuelto: "blue"
            }[s.evolucion])]
        })
    },

    alergias: {
        recurso: "antecedentes", titulo: "Alergias y reacciones", icono: "bi-exclamation-triangle", color: "red",
        descripcion: "Alergias o reacciones conocidas.",
        boton: "Agregar alergia o reacción", vacio: "No hay alergias registradas.",
        tipos: ["alergia", "reaccion"], etiquetaDescripcion: "¿A qué es alérgica o qué reacción tuvo?",
        datos: () => ficha.antecedentes.filter(a => ["alergia", "reaccion"].includes(a.tipo)),
        tarjeta: tarjetaAntecedente
    },

    lesiones: {
        recurso: "antecedentes", titulo: "Lesiones, accidentes y cirugías", icono: "bi-bandaid", color: "blue",
        descripcion: "Antecedentes importantes.",
        boton: "Agregar antecedente", vacio: "No hay lesiones, accidentes ni cirugías registradas.",
        tipos: ["lesion", "accidente", "cirugia"], etiquetaDescripcion: "Descripción",
        datos: () => ficha.antecedentes.filter(a => ["lesion", "accidente", "cirugia"].includes(a.tipo)),
        tarjeta: tarjetaAntecedente
    },

    observaciones: {
        recurso: "antecedentes", titulo: "Observaciones personales", icono: "bi-journal-text", color: "purple",
        descripcion: "Notas que quieras recordar sobre su salud.",
        boton: "Agregar observación", vacio: "No hay observaciones.",
        tipos: ["observacion"], etiquetaDescripcion: "Observación",
        datos: () => ficha.antecedentes.filter(a => a.tipo === "observacion"),
        tarjeta: tarjetaAntecedente
    },

    medicamentos: {
        recurso: "medicamentos", titulo: "Medicamentos y tratamientos", icono: "bi-capsule", color: "purple",
        descripcion: "Nombre, dosis, frecuencia, fechas y efectos observados.",
        boton: "Agregar medicamento", vacio: "No hay medicamentos registrados.",
        datos: () => ficha.medicamentos,
        tarjeta: m => {
            const cita = ficha.citas.find(c => c.id_cita === m.id_cita);
            return {
                titulo: m.nombre,
                subtitulo: `${m.dosis} · ${m.frecuencia}${m.via ? " · " + m.via : ""}`,
                lineas: [
                    H(`<i class="bi bi-calendar-range"></i> ${fechaCorta(m.fecha_inicio)} → ${m.fecha_fin ? fechaCorta(m.fecha_fin) : "Sin fecha de fin"}`),
                    cita && H(`<i class="bi bi-calendar-check"></i> Recetado en: ${escaparHTML(cita.motivo)}`),
                    m.efectos_observados && H(`<strong>Efectos:</strong> ${escaparHTML(m.efectos_observados)}`),
                    m.notas && H(`<strong>Notas:</strong> ${escaparHTML(m.notas)}`)
                ],
                badges: [enCurso(m) ? badge("En curso", "green") : badge("Finalizado", "gray")]
            };
        }
    },

    citasProximas: {
        recurso: "citas", titulo: "Próximas citas", icono: "bi-calendar-plus", color: "blue",
        descripcion: "Citas programadas.",
        boton: "Programar cita", vacio: "No tienes citas programadas.",
        datos: () => ficha.citas
            .filter(c => c.estado === "programada" && c.fecha_hora.slice(0, 10) >= hoyTexto())
            .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora)),
        defectos: { estado: "programada" },
        verDetalle: true,
        tarjeta: tarjetaCita
    },

    consultas: {
        recurso: "citas", titulo: "Consultas realizadas", icono: "bi-clipboard2-check", color: "green",
        descripcion: "Fecha, motivo, atención, resultados y seguimiento.",
        boton: "Registrar consulta", vacio: "No hay consultas registradas.",
        datos: () => ficha.citas
            .filter(c => !(c.estado === "programada" && c.fecha_hora.slice(0, 10) >= hoyTexto())),
        defectos: { estado: "completada" },
        verDetalle: true,
        tarjeta: tarjetaCita
    },

    documentos: {
        recurso: "documentos", titulo: "Documentos", icono: "bi-file-earmark-image", color: "blue",
        descripcion: "Fotos de informes, recetas, facturas y análisis.",
        boton: "Subir documento", vacio: "No hay documentos.",
        datos: () => ficha.documentos,
        tarjeta: d => {
            const url = urlFoto(d.archivo);
            const esPdf = d.archivo.endsWith(".pdf");
            return {
                miniatura: esPdf
                    ? `<a href="${escaparHTML(url)}" target="_blank" rel="noopener" class="thumb pdf"><i class="bi bi-file-earmark-pdf"></i></a>`
                    : `<a href="${escaparHTML(url)}" target="_blank" rel="noopener" class="thumb"><img src="${escaparHTML(url)}" alt="" loading="lazy"></a>`,
                titulo: d.titulo,
                subtitulo: fechaCorta(d.fecha),
                lineas: [d.notas],
                badges: [badge(TEXTOS.documento[d.tipo], "blue")]
            };
        }
    }
};


function tarjetaAntecedente(a) {

    return {
        titulo: a.descripcion,
        subtitulo: a.fecha ? fechaCorta(a.fecha) : "Sin fecha",
        lineas: [a.observaciones],
        badges: [
            a.tipo !== "observacion" && badge(TEXTOS.antecedente[a.tipo], "purple"),
            a.gravedad && badge(TEXTOS.gravedad[a.gravedad], { leve: "green", moderada: "orange", grave: "red" }[a.gravedad]),
            badgeOrigen(a.origen)
        ]
    };

}


function tarjetaCita(c) {

    return {
        titulo: c.motivo,
        subtitulo: `${fechaHora(c.fecha_hora)}${c.clinica ? " · " + c.clinica : ""}`,
        lineas: [
            c.veterinario && H(`<i class="bi bi-person-badge"></i> ${escaparHTML(c.veterinario)}`),
            c.diagnostico && H(`<strong>Diagnóstico:</strong> ${escaparHTML(c.diagnostico)}`),
            c.proxima_revision && H(`<i class="bi bi-calendar-event"></i> Próxima revisión: ${fechaCorta(c.proxima_revision)}`)
        ],
        badges: [
            badge(textoTipoCita(c), c.tipo === "urgencia" ? "red" : "blue"),
            badge(TEXTOS.estadoCita[c.estado], { programada: "orange", completada: "green", cancelada: "gray" }[c.estado]),
            c.estado !== "programada" && badgeOrigen(c.origen_informacion)
        ],
        valor: c.costo ? dinero(c.costo) : ""
    };

}


// =========================================
// COLUMNA ID DE CADA TIPO DE REGISTRO
// =========================================

const ID_RECURSO = {
    vacunas: "id_vacuna", desparasitaciones: "id_desparasitacion", enfermedades: "id_enfermedad",
    sintomas: "id_sintoma", antecedentes: "id_antecedente", medicamentos: "id_medicamento",
    citas: "id_cita", documentos: "id_documento"
};


// =========================================
// FICHA DE LA MASCOTA (resumen y alertas)
// =========================================

// Alergias, enfermedades activas y medicamentos en curso
// (se muestran en la ficha y en el PDF del historial)
function alertasSalud() {

    return {
        alergias: [
            ficha.mascota.alergias,
            ...ficha.antecedentes.filter(a => ["alergia", "reaccion"].includes(a.tipo)).map(a => a.descripcion)
        ].filter(Boolean),

        enfermedades: ficha.enfermedades.filter(e => e.estado !== "curada").map(e => e.nombre),

        medicamentos: ficha.medicamentos.filter(enCurso).map(m => `${m.nombre} (${m.frecuencia})`)
    };

}


function dibujarFicha() {


    const m = ficha.mascota;

    const foto = urlFoto(m.foto);

    const hoy = hoyTexto();

    const { alergias, enfermedades, medicamentos } = alertasSalud();


    const proximaVacuna = ficha.vacunas
        .filter(v => v.proxima_dosis && v.proxima_dosis >= hoy)
        .sort((a, b) => a.proxima_dosis.localeCompare(b.proxima_dosis))[0];

    const proximaDesparasitacion = ficha.desparasitaciones
        .filter(d => d.proxima_aplicacion && d.proxima_aplicacion >= hoy)
        .sort((a, b) => a.proxima_aplicacion.localeCompare(b.proxima_aplicacion))[0];

    const proximaCita = LISTAS.citasProximas.datos()[0];


    const alerta = (icono, color, titulo, items, vacio) => `
        <div class="alert-item ${items.length ? color : "ok"}">
            <i class="bi ${items.length ? icono : "bi-check-circle"}"></i>
            <div>
                <span>${titulo}</span>
                <strong>${items.length ? items.map(escaparHTML).join(", ") : vacio}</strong>
            </div>
        </div>
    `;


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
                    <span><i class="bi bi-gender-${m.sexo === "hembra" ? "female" : "male"}"></i> ${m.sexo === "hembra" ? "Hembra" : "Macho"}</span>
                    <span><i class="bi bi-speedometer2"></i> ${m.peso_actual ? numero(m.peso_actual) + " kg" : "Peso sin dato"}</span>
                    ${m.esterilizado ? '<span><i class="bi bi-shield-check"></i> Esterilizado</span>' : ""}
                </div>
            </div>
        </div>

        <div class="health-alerts">
            ${alerta("bi-exclamation-triangle", "red", "Alergias", alergias, "Ninguna conocida")}
            ${alerta("bi-virus", "orange", "Enfermedades activas", enfermedades, "Ninguna")}
            ${alerta("bi-capsule", "purple", "Medicamentos en curso", medicamentos, "Ninguno")}
        </div>

        <div class="health-next">
            <div>
                <span><i class="bi bi-shield-plus"></i> Próxima vacuna</span>
                <strong>${proximaVacuna ? fechaCorta(proximaVacuna.proxima_dosis) : "—"}</strong>
            </div>
            <div>
                <span><i class="bi bi-bug"></i> Próxima desparasitación</span>
                <strong>${proximaDesparasitacion ? fechaCorta(proximaDesparasitacion.proxima_aplicacion) : "—"}</strong>
            </div>
            <div>
                <span><i class="bi bi-calendar-check"></i> Próxima cita</span>
                <strong>${proximaCita ? fechaHora(proximaCita.fecha_hora) : "—"}</strong>
            </div>
        </div>
    `;

}


// =========================================
// HISTORIAL MÉDICO (unión de todo)
// =========================================

const ESTILO_HISTORIAL = {
    vacuna: { icono: "bi-shield-plus", color: "green", texto: "Vacuna" },
    desparasitacion: { icono: "bi-bug", color: "orange", texto: "Desparasitación" },
    enfermedad: { icono: "bi-virus", color: "red", texto: "Enfermedad" },
    sintoma: { icono: "bi-thermometer-half", color: "orange", texto: "Síntoma" },
    alergia: { icono: "bi-exclamation-triangle", color: "red", texto: "Alergia" },
    reaccion: { icono: "bi-exclamation-triangle", color: "red", texto: "Reacción" },
    lesion: { icono: "bi-bandaid", color: "blue", texto: "Lesión" },
    accidente: { icono: "bi-bandaid", color: "blue", texto: "Accidente" },
    cirugia: { icono: "bi-scissors", color: "blue", texto: "Cirugía" },
    observacion: { icono: "bi-journal-text", color: "purple", texto: "Observación" },
    medicamento: { icono: "bi-capsule", color: "purple", texto: "Medicamento" },
    cita: { icono: "bi-clipboard2-check", color: "blue", texto: "Consulta" },
    documento: { icono: "bi-file-earmark-image", color: "blue", texto: "Documento" },
    gasto: { icono: "bi-cash-coin", color: "green", texto: "Gasto" },
    alimentacion: { icono: "bi-basket", color: "orange", texto: "Alimentación" },
    peso: { icono: "bi-speedometer2", color: "purple", texto: "Peso" },
    alimento: { icono: "bi-basket2", color: "orange", texto: "Alimento" },
    restriccion: { icono: "bi-slash-circle", color: "red", texto: "Alimento a evitar" },
    nutricion: { icono: "bi-clipboard2-heart", color: "green", texto: "Recomendación nutricional" },
    agua: { icono: "bi-droplet", color: "blue", texto: "Agua" },
    entrenamiento: { icono: "bi-trophy", color: "purple", texto: "Entrenamiento" },
    meta_actividad: { icono: "bi-bullseye", color: "green", texto: "Meta de actividad" },
    comportamiento: { icono: "bi-emoji-neutral", color: "orange", texto: "Comportamiento" }
};


const GRUPOS_HISTORIAL = {
    todo: { texto: "Todo" },
    vacunas: { texto: "Vacunas", tipos: ["vacuna", "desparasitacion"] },
    condiciones: { texto: "Enfermedades y síntomas", tipos: ["enfermedad", "sintoma"] },
    antecedentes: { texto: "Antecedentes", tipos: ["alergia", "reaccion", "lesion", "accidente", "cirugia", "observacion"] },
    medicamentos: { texto: "Medicamentos", tipos: ["medicamento"] },
    consultas: { texto: "Consultas", tipos: ["cita"] },
    documentos: { texto: "Documentos y gastos", tipos: ["documento", "gasto"] },
    alimentacion: { texto: "Alimentación y peso", tipos: ["alimentacion", "peso", "alimento", "restriccion", "nutricion", "agua"] },
    actividad: { texto: "Actividad y conducta", tipos: ["entrenamiento", "meta_actividad", "comportamiento"] }
};


const inputDesde = document.getElementById("historialDesde");

const inputHasta = document.getElementById("historialHasta");


function dibujarFiltrosHistorial() {

    document.getElementById("filtrosHistorial").innerHTML = Object.entries(GRUPOS_HISTORIAL)
        .map(([clave, grupo]) => `
            <button type="button" class="chip ${clave === filtroHistorial ? "active" : ""}" data-filtro="${clave}">
                ${grupo.texto}
            </button>
        `).join("");

}


// Registros del historial que cumplen los filtros (tipo, fechas y búsqueda).
// Lo usan tanto la pantalla como la exportación.
function historialFiltrado() {


    const texto = document.getElementById("buscarHistorial").value.trim().toLowerCase();

    const tipos = GRUPOS_HISTORIAL[filtroHistorial].tipos;

    const desde = inputDesde.value;

    const hasta = inputHasta.value;


    return ficha.historial.filter(h =>
        (!tipos || tipos.includes(h.tipo)) &&
        (!desde || h.fecha >= desde) &&
        (!hasta || h.fecha <= hasta) &&
        (!texto || `${h.titulo} ${h.detalle || ""}`.toLowerCase().includes(texto))
    );

}


// "del 1 de ene de 2026 al 9 de oct de 2026", "desde...", "hasta..." o "todas las fechas"
function textoPeriodo() {


    const desde = inputDesde.value;

    const hasta = inputHasta.value;


    if (desde && hasta) {

        return `del ${fechaCorta(desde)} al ${fechaCorta(hasta)}`;

    }

    if (desde) {

        return `desde el ${fechaCorta(desde)}`;

    }

    if (hasta) {

        return `hasta el ${fechaCorta(hasta)}`;

    }

    return "todas las fechas";

}


function dibujarHistorial() {


    dibujarFiltrosHistorial();


    const eventos = historialFiltrado();

    const contenedor = document.getElementById("historial");


    document.getElementById("conteoHistorial").textContent = ficha.historial.length
        ? `${eventos.length} ${eventos.length === 1 ? "registro" : "registros"} · ${textoPeriodo()}`
        : "";


    if (eventos.length === 0) {

        contenedor.innerHTML = `<p class="records-empty">${ficha.historial.length
            ? "No hay registros con esos filtros."
            : "El historial se irá llenando a medida que registres vacunas, consultas, medicamentos y más."}</p>`;

        return;

    }


    // Agrupado por mes
    let mesActual = "";

    contenedor.innerHTML = eventos.map(h => {


        const mes = aFecha(h.fecha).toLocaleDateString("es-CO", { month: "long", year: "numeric" });

        const encabezado = mes !== mesActual ? `<h4 class="timeline-month">${mes}</h4>` : "";

        mesActual = mes;

        const estilo = ESTILO_HISTORIAL[h.tipo] || { icono: "bi-dot", color: "gray" };


        return `
            ${encabezado}
            <div class="timeline-item">
                <div class="timeline-icon ${estilo.color}"><i class="bi ${estilo.icono}"></i></div>
                <div class="timeline-body">
                    <span class="timeline-date">${fechaCorta(h.fecha)}</span>
                    <strong>${escaparHTML(h.titulo)}</strong>
                    ${h.detalle ? `<p>${escaparHTML(h.detalle)}</p>` : ""}
                </div>
            </div>
        `;

    }).join("");

}


document.getElementById("buscarHistorial").addEventListener("input", dibujarHistorial);


document.getElementById("filtrosHistorial").addEventListener("click", event => {

    const boton = event.target.closest("[data-filtro]");

    if (boton) {

        filtroHistorial = boton.dataset.filtro;

        dibujarHistorial();

    }

});


// =========================================
// FILTRO POR FECHA
// =========================================

function validarRango() {


    // Si "desde" queda después de "hasta", se intercambian
    if (inputDesde.value && inputHasta.value && inputDesde.value > inputHasta.value) {

        [inputDesde.value, inputHasta.value] = [inputHasta.value, inputDesde.value];

    }


    document.querySelectorAll("[data-rango]").forEach(b => b.classList.remove("active"));

    dibujarHistorial();

}


inputDesde.addEventListener("change", validarRango);

inputHasta.addEventListener("change", validarRango);


// Atajos: último mes, 6 meses, 1 año o todas las fechas
document.querySelector(".date-shortcuts").addEventListener("click", event => {


    const boton = event.target.closest("[data-rango]");

    if (!boton) {

        return;

    }


    if (boton.dataset.rango === "todo") {

        inputDesde.value = "";

        inputHasta.value = "";

    } else {

        const desde = new Date();

        desde.setDate(desde.getDate() - Number(boton.dataset.rango));

        inputDesde.value = desde.toLocaleDateString("en-CA");

        inputHasta.value = hoyTexto();

    }


    document.querySelectorAll("[data-rango]").forEach(b => b.classList.toggle("active", b === boton));

    dibujarHistorial();

});


// =========================================
// EXPORTAR EL HISTORIAL (respeta los filtros)
// =========================================

function hayAlgoParaExportar() {


    if (historialFiltrado().length === 0) {

        mostrarAviso("No hay registros para exportar con esos filtros.");

        return false;

    }

    return true;

}


// Nombre del archivo: historial_Toby_2026-04-10_2026-10-09.pdf
function nombreArchivo(extension) {


    const nombre = ficha.mascota.nombre
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/gi, "_");


    return `historial_${nombre}_${inputDesde.value || "inicio"}_${inputHasta.value || hoyTexto()}.${extension}`;

}


// PDF: se genera en el navegador con jsPDF y se descarga directamente
document.getElementById("exportarPDF").addEventListener("click", () => {


    if (!hayAlgoParaExportar()) {

        return;

    }


    if (!window.jspdf) {

        mostrarAviso("No se pudo cargar el generador de PDF. Revisa tu conexión a internet y recarga la página.");

        return;

    }


    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({ unit: "mm", format: "a4" });

    const m = ficha.mascota;

    const morado = [112, 70, 232];

    const margen = 14;


    // ---------- Encabezado ----------
    pdf.setFillColor(...morado);

    pdf.rect(0, 0, 210, 6, "F");


    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(18);

    pdf.setTextColor(31, 26, 61);

    pdf.text(`Historial médico de ${m.nombre}`, margen, 18);


    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(10);

    pdf.setTextColor(90, 90, 110);


    const datosMascota = [
        [m.especie, m.raza].filter(Boolean).join(" - "),
        m.sexo === "hembra" ? "Hembra" : "Macho",
        calcularEdad(m.fecha_nacimiento),
        m.peso_actual ? `${numero(m.peso_actual)} kg` : null,
        m.esterilizado ? "Esterilizado" : null
    ].filter(Boolean).join("  ·  ");

    const grupo = GRUPOS_HISTORIAL[filtroHistorial];

    pdf.text(datosMascota, margen, 25);

    pdf.text(
        `Periodo: ${textoPeriodo()}${filtroHistorial !== "todo" ? `  ·  Solo: ${grupo.texto}` : ""}`,
        margen, 31
    );

    pdf.text(`Generado el ${fechaCorta(hoyTexto())} con PetCare`, margen, 37);


    // ---------- Alertas de salud ----------
    const { alergias, enfermedades, medicamentos } = alertasSalud();

    pdf.autoTable({
        startY: 43,
        theme: "plain",
        body: [
            ["Alergias", alergias.join(", ") || "Ninguna conocida"],
            ["Enfermedades activas", enfermedades.join(", ") || "Ninguna"],
            ["Medicamentos en curso", medicamentos.join(", ") || "Ninguno"]
        ],
        styles: { fontSize: 9, cellPadding: 1.5, textColor: [31, 26, 61] },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 45, textColor: morado } },
        margin: { left: margen, right: margen }
    });


    // ---------- Historial ----------
    pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 6,
        head: [["Fecha", "Tipo", "Registro", "Detalle"]],
        body: historialFiltrado().map(h => [
            aFecha(h.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }),
            ESTILO_HISTORIAL[h.tipo]?.texto || h.tipo,
            h.titulo,
            h.detalle || ""
        ]),
        headStyles: { fillColor: morado, textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [247, 245, 254] },
        styles: { fontSize: 9, cellPadding: 2.5, valign: "top", textColor: [31, 26, 61] },
        columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 28 }, 2: { cellWidth: 64 } },
        margin: { left: margen, right: margen, bottom: 18 }
    });


    // ---------- Número de página ----------
    const paginas = pdf.getNumberOfPages();

    for (let i = 1; i <= paginas; i++) {

        pdf.setPage(i);

        pdf.setFontSize(8);

        pdf.setTextColor(140, 140, 155);

        pdf.text(`PetCare  ·  ${m.nombre}`, margen, 290);

        pdf.text(`Página ${i} de ${paginas}`, 196, 290, { align: "right" });

    }


    pdf.save(nombreArchivo("pdf"));

});


// Excel: archivo CSV que Excel abre directamente
function celdaCSV(valor) {


    let texto = String(valor ?? "");


    // Evita que Excel interprete un texto como fórmula
    if (/^[=+\-@]/.test(texto)) {

        texto = "'" + texto;

    }


    return `"${texto.replaceAll('"', '""')}"`;

}


document.getElementById("exportarExcel").addEventListener("click", () => {


    if (!hayAlgoParaExportar()) {

        return;

    }


    const m = ficha.mascota;

    const filas = [
        ["Historial médico de", m.nombre],
        ["Especie", [m.especie, m.raza].filter(Boolean).join(" · ")],
        ["Periodo", textoPeriodo()],
        ["Generado el", fechaCorta(hoyTexto())],
        [],
        ["Fecha", "Tipo", "Registro", "Detalle"],
        ...historialFiltrado().map(h => [
            h.fecha,
            ESTILO_HISTORIAL[h.tipo]?.texto || h.tipo,
            h.titulo,
            h.detalle || ""
        ])
    ];


    // Punto y coma y BOM para que Excel en español lo abra con tildes y en columnas
    const csv = "\uFEFF" + filas.map(fila => fila.map(celdaCSV).join(";")).join("\r\n");

    const archivo = new Blob([csv], { type: "text/csv;charset=utf-8" });




    const enlace = document.createElement("a");

    enlace.href = URL.createObjectURL(archivo);

    enlace.download = nombreArchivo("csv");

    document.body.appendChild(enlace);

    enlace.click();

    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);

});


// =========================================
// DETALLE DE UNA CITA (las 5 partes)
// =========================================

function verCita(id) {


    const c = ficha.citas.find(x => x.id_cita === id);

    const medicamentos = ficha.medicamentos.filter(m => m.id_cita === id);

    const sintomas = ficha.sintomas.filter(s => s.id_cita === id);

    const documentos = ficha.documentos.filter(d => d.id_cita === id);



    const dato = (titulo, valor) => valor
        ? `<div class="detail-item"><span>${titulo}</span><p>${escaparHTML(valor)}</p></div>`
        : "";

    const seccion = (titulo, contenido) => contenido.trim()
        ? `<section class="detail-section"><h6>${titulo}</h6>${contenido}</section>`
        : "";


    document.getElementById("tituloDetalle").textContent = c.motivo;


    document.getElementById("cuerpoDetalle").innerHTML = `

        <div class="badges mb-3">
            ${badge(textoTipoCita(c), "blue")}
            ${badge(TEXTOS.estadoCita[c.estado], { programada: "orange", completada: "green", cancelada: "gray" }[c.estado])}
            ${badgeOrigen(c.origen_informacion)}
        </div>

        ${seccion("1. Datos de la cita", `
            ${dato("Fecha y hora", fechaHora(c.fecha_hora))}
            ${dato("Motivo", c.motivo)}
            ${dato("Clínica o lugar", c.clinica)}
        `)}

        ${seccion("2. Motivo y síntomas", `
            ${dato("¿Qué le sucede?", c.sintomas_descripcion)}
            ${dato("Comenzó", fechaCorta(c.sintomas_inicio))}
            ${dato("Cambios en apetito, comportamiento o actividad", c.cambios_observados)}
            ${dato("Frecuencia y evolución", c.evolucion_sintomas)}
            ${sintomas.length ? dato("Síntomas registrados", sintomas.map(s => s.descripcion).join(", ")) : ""}
        `)}

        ${seccion("3. Atención veterinaria", `
            ${dato("Veterinario", c.veterinario)}
            ${dato("Exploraciones y pruebas", c.pruebas_realizadas)}
            ${dato("Resultados", c.resultados)}
            ${dato("Diagnóstico", c.diagnostico)}
        `)}

        ${seccion("4. Tratamiento e indicaciones", `
            ${medicamentos.length ? `<div class="detail-item"><span>Medicamentos recetados</span>${medicamentos.map(m =>
                `<p><strong>${escaparHTML(m.nombre)}</strong>: ${escaparHTML(m.dosis)}, ${escaparHTML(m.frecuencia)}</p>`).join("")}</div>` : ""}
            ${dato("Cuidados en casa", c.cuidados_casa)}
            ${dato("Restricciones", c.restricciones)}
            ${dato("Próxima dosis o revisión", fechaCorta(c.proxima_revision))}
        `)}

        ${seccion("5. Seguimiento", `
            ${dato("Evolución después de la consulta", c.evolucion_posterior)}
            ${dato("¿Se cumplió el tratamiento?", TEXTOS.cumplido[c.tratamiento_cumplido])}
            ${dato("Mejorías o síntomas nuevos", c.sintomas_nuevos)}
            ${dato("Costo de la consulta", c.costo ? dinero(c.costo) : "")}
            ${dato("Notas", c.notas)}
        `)}

        ${documentos.length ? seccion("Documentos adjuntos", `
            <div class="detail-docs">
                ${documentos.map(d => `
                    <a href="${escaparHTML(urlFoto(d.archivo))}" target="_blank" rel="noopener">
                        <i class="bi bi-file-earmark-${d.archivo.endsWith(".pdf") ? "pdf" : "image"}"></i>
                        ${escaparHTML(d.titulo)}
                    </a>
                `).join("")}
            </div>
        `) : ""}

        <button type="button" class="btn-save" data-editar="${c.estado === "programada" ? "citasProximas" : "consultas"}" data-id="${c.id_cita}">
            <i class="bi bi-pencil"></i>
            Editar esta cita
        </button>
    `;


    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalDetalle")).show();

}


// =========================================
// INICIAR
// =========================================

iniciarApartado({
    ruta: "/salud",
    listas: LISTAS,
    formularios: FORMULARIOS,
    ids: ID_RECURSO,
    alDibujar: () => {
        dibujarFicha();
        dibujarHistorial();
    },
    verDetalle: verCita
});
