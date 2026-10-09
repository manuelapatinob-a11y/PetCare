// =========================================
// PETCARE - ALIMENTACIÓN
// Usa ../auth/sesion.js y el motor común ../comun/apartado.js
// =========================================


// =========================================
// TEXTOS PARA MOSTRAR
// =========================================

const TEXTOS = {
    tipoAlimento: {
        pienso: "Pienso / concentrado", humeda: "Comida húmeda", casera: "Comida casera",
        dieta_especial: "Dieta especial", premio: "Premio", golosina: "Golosina", suplemento: "Suplemento"
    },
    motivo: {
        alergia: "Alergia", intolerancia: "Intolerancia", toxico: "Tóxico para su especie",
        indicacion_medica: "Indicación médica", otro: "Otro motivo"
    },
    origen: { veterinario: "Informe veterinario", propietario: "Observación del dueño" },
    apetito: { normal: "Come con normalidad", poco: "Comió poco", ansioso: "Comió con ansiedad", rechazo: "Rechazó el alimento" },
    sed: { normal: "Normal", aumentada: "Más sed de lo normal", disminuida: "Menos sed de lo normal" },
    energia: { baja: "Baja", normal: "Normal", alta: "Alta" }
};

const TIPOS_COMIDA = ["pienso", "humeda", "casera", "dieta_especial"];

const TIPOS_EXTRA = ["premio", "golosina", "suplemento"];

// Tipos de alimento del plan (si no está en la lista se elige "Otro" y se escribe)
const TIPOS_PLAN = [
    "Pienso / concentrado", "Comida húmeda", "Comida casera",
    "Dieta especial", "Dieta cruda (BARF)", "Mixta (seca y húmeda)"
];

const ACEPTAR_FOTO = "image/jpeg,image/png,image/webp";


// =========================================
// AYUDAS PROPIAS DE ALIMENTACIÓN
// =========================================

// Lo que comió: si no se anotó lo consumido, se toma que comió todo lo servido
function consumido(comida) {

    return comida.cantidad_consumida_g ?? comida.cantidad_g;

}


function gramos(valor) {

    if (valor === null || valor === undefined) {

        return "—";

    }

    return valor >= 1000 ? `${numero(valor / 1000)} kg` : `${numero(valor)} g`;

}


// Fecha "AAAA-MM-DD" de hace N días
function haceDias(dias) {

    const fecha = new Date();

    fecha.setDate(fecha.getDate() - dias);

    return fecha.toLocaleDateString("en-CA");

}


function minutosDelDia(hora) {

    const [h, m] = hora.split(":").map(Number);

    return h * 60 + m;

}


function porcentaje(parte, total) {

    return total ? Math.round((parte / total) * 100) : 0;

}


// Foto pequeña que se abre en grande al tocarla
function miniaturaFoto(ruta) {

    if (!ruta) {

        return "";

    }

    const url = escaparHTML(urlFoto(ruta));

    return `<a href="${url}" target="_blank" rel="noopener" class="thumb"><img src="${url}" alt="" loading="lazy"></a>`;

}


// Horarios que son comidas (los snacks no cuentan como comidas del día)
function horariosDeComida() {

    return ficha.horarios.filter(h => h.tipo !== "snack");

}


function opcionesAlimentos(tipos) {

    return [
        ["", "Otro (escribir cuál)"],
        ...ficha.alimentos
            .filter(a => !tipos || tipos.includes(a.tipo))
            .map(a => [a.id_alimento, [a.nombre, a.marca].filter(Boolean).join(" - ")])
    ];

}


// =========================================
// FORMULARIOS
// =========================================

const campoOrigen = {
    nombre: "origen", etiqueta: "¿De dónde viene esta información?", tipo: "select",
    opciones: opciones(TEXTOS.origen), requerido: true, col: 6, defecto: "propietario"
};


const FORMULARIOS = {

    alimentos: (lista) => [
        { nombre: "nombre", etiqueta: "Nombre del alimento", tipo: "text", requerido: true, col: 6, max: 120 },
        { nombre: "marca", etiqueta: "Marca", tipo: "text", col: 6, max: 100 },
        {
            nombre: "tipo", etiqueta: "Tipo", tipo: "select", requerido: true, col: 6,
            opciones: lista.tipos.map(t => [t, TEXTOS.tipoAlimento[t]]), defecto: lista.tipos[0]
        },
        { nombre: "fecha_inicio", etiqueta: "Desde cuándo lo come", tipo: "date", col: 6, defecto: hoyTexto },
        { nombre: "ingredientes", etiqueta: "Ingredientes principales", tipo: "textarea" },
        { nombre: "foto", etiqueta: "Foto del empaque o del alimento (opcional, máximo 2 MB)", tipo: "file", aceptar: ACEPTAR_FOTO },
        {
            seccion: "Existencias",
            ayuda: "Para saber cuánto queda en casa. Cuando se esté acabando te llegará un correo al email de tu cuenta."
        },
        { nombre: "stock_inicial_g", etiqueta: "Cantidad que hay en casa ahora (g)", tipo: "number", col: 6, min: 0, step: 1 },
        { nombre: "alerta_minima_g", etiqueta: "Avisarme por correo cuando queden menos de (g)", tipo: "number", col: 6, min: 0, step: 1, ayuda: "Si lo dejas vacío, se avisa cuando alcance para 5 días o menos." },
        { nombre: "en_uso", etiqueta: "Lo sigue comiendo actualmente", tipo: "switch", defecto: true },
        { nombre: "fecha_fin", etiqueta: "Si ya no lo come, ¿desde cuándo?", tipo: "date", col: 6 },
        { nombre: "observaciones", etiqueta: "Observaciones", tipo: "textarea" }
    ],

    restricciones: () => [
        { nombre: "alimento", etiqueta: "Alimento que no tolera o debe evitar", tipo: "text", requerido: true, col: 6, max: 120 },
        { nombre: "motivo", etiqueta: "Motivo", tipo: "select", opciones: opciones(TEXTOS.motivo), requerido: true, col: 6 },
        { nombre: "reaccion", etiqueta: "¿Qué reacción tiene o tuvo?", tipo: "textarea" },
        { nombre: "foto", etiqueta: "Foto del alimento (opcional, máximo 2 MB)", tipo: "file", aceptar: ACEPTAR_FOTO },
        campoOrigen,
        { nombre: "fecha", etiqueta: "Fecha", tipo: "date", col: 6 },
        { nombre: "observaciones", etiqueta: "Observaciones", tipo: "textarea" }
    ],

    comidas: () => [
        { nombre: "fecha_hora", etiqueta: "Fecha y hora", tipo: "datetime", requerido: true, col: 6, defecto: ahoraTexto },
        {
            nombre: "id_horario", etiqueta: "¿Qué comida del horario es?", tipo: "select", col: 6,
            opciones: [["", "Fuera de horario"], ...ficha.horarios.map(h => [h.id_horario, `${horaCorta(h.hora)}${h.descripcion ? " · " + h.descripcion : ""}`])]
        },
        { nombre: "id_alimento", etiqueta: "Alimento", tipo: "select", col: 6, opciones: opcionesAlimentos() },
        {
            nombre: "alimento", etiqueta: "¿Cuál alimento?", tipo: "text", requerido: true, col: 6, max: 120,
            mostrarSi: { campo: "id_alimento", valor: "" }
        },
        { seccion: "Cantidad" },
        { nombre: "cantidad_g", etiqueta: "Cantidad servida (g)", tipo: "number", requerido: true, col: 6, min: 0.1, step: 0.1 },
        {
            nombre: "cantidad_consumida_g", etiqueta: "Cantidad que realmente comió (g)", tipo: "number", col: 6, min: 0, step: 0.1,
            ayuda: "Si lo dejas vacío se toma que comió todo."
        },
        { seccion: "Cómo comió" },
        { nombre: "duracion_min", etiqueta: "Tiempo que tardó en comer (minutos)", tipo: "number", col: 6, min: 0, step: 1 },
        { nombre: "apetito", etiqueta: "¿Cómo comió?", tipo: "select", opciones: opciones(TEXTOS.apetito), requerido: true, col: 6, defecto: "normal" },
        { nombre: "notas", etiqueta: "Notas", tipo: "text", max: 255 }
    ],

    horarios: () => [
        { nombre: "tipo", etiqueta: "¿Es una comida o un snack?", tipo: "select", requerido: true, col: 6, opciones: [["comida", "Comida"], ["snack", "Snack o premio"]], defecto: "comida" },
        { nombre: "hora", etiqueta: "Hora", tipo: "time", requerido: true, col: 6, ayuda: "Te llega un recordatorio 30 minutos antes." },
        { nombre: "id_alimento", etiqueta: "Alimento", tipo: "select", col: 6, opciones: [["", "Sin especificar"], ...opcionesAlimentos().slice(1)] },
        { nombre: "porcion_g", etiqueta: "Cantidad a servir (g)", tipo: "number", requerido: true, col: 6, min: 0.1, step: 0.1 },
        { nombre: "descripcion", etiqueta: "Nombre", tipo: "text", col: 6, max: 150, placeholder: "Ej: Desayuno, premio de la tarde" },
        {
            nombre: "id_plan", etiqueta: "Plan de alimentación", tipo: "select", col: 6,
            opciones: [["", "Ninguno"], ...ficha.planes.map(p => [p.id_plan, p.nombre])]
        }
    ],

    planes: () => [
        { nombre: "nombre", etiqueta: "Nombre del plan", tipo: "text", requerido: true, col: 6, max: 100, placeholder: "Ej: Dieta de adulto" },
        {
            nombre: "tipo_alimento", etiqueta: "Tipo de alimento", tipo: "select", requerido: true, col: 6,
            opciones: [...TIPOS_PLAN.map(t => [t, t]), ["otro", "Otro"]],
            valor: p => TIPOS_PLAN.includes(p.tipo_alimento) ? p.tipo_alimento : "otro"
        },
        {
            nombre: "tipo_alimento_otro", etiqueta: "¿Cuál tipo de alimento?", tipo: "text", requerido: true, col: 12, max: 100,
            mostrarSi: { campo: "tipo_alimento", valor: "otro" },
            valor: p => TIPOS_PLAN.includes(p.tipo_alimento) ? "" : p.tipo_alimento
        },
        { nombre: "marca", etiqueta: "Marca", tipo: "text", col: 6, max: 100 },
        { nombre: "porcion_diaria_g", etiqueta: "Total diario (g)", tipo: "number", col: 3, min: 1, step: 1 },
        { nombre: "calorias_diarias", etiqueta: "Calorías diarias", tipo: "number", col: 3, min: 1, step: 1 },
        { nombre: "fecha_inicio", etiqueta: "Desde", tipo: "date", requerido: true, col: 6, defecto: hoyTexto },
        { nombre: "fecha_fin", etiqueta: "Hasta", tipo: "date", col: 6 },
        { nombre: "activo", etiqueta: "Es el plan que sigue actualmente", tipo: "switch", defecto: true }
    ],

    agua: () => [
        { nombre: "fecha", etiqueta: "Fecha", tipo: "date", requerido: true, col: 6, defecto: hoyTexto },
        { nombre: "cambio_sed", etiqueta: "¿Cómo está su sed?", tipo: "select", opciones: opciones(TEXTOS.sed), requerido: true, col: 6, defecto: "normal" },
        { nombre: "ofrecida_ml", etiqueta: "Agua ofrecida (ml)", tipo: "number", col: 4, min: 0, step: 1 },
        { nombre: "consumida_ml", etiqueta: "Consumo aproximado (ml)", tipo: "number", col: 4, min: 0, step: 1, ayuda: "Si se puede medir." },
        { nombre: "veces_bebe", etiqueta: "Veces que bebió", tipo: "number", col: 4, min: 0, step: 1 },
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
            ],
            ayuda: "Escala de 1 a 9: en el ideal (5) se sienten las costillas y se nota la cintura."
        },
        { nombre: "energia", etiqueta: "Nivel de energía y actividad", tipo: "select", col: 6, opciones: [["", "Sin indicar"], ...opciones(TEXTOS.energia)] },
        { nombre: "pelo_piel", etiqueta: "Cambios en el pelo y la piel", tipo: "text", max: 255, placeholder: "Ej: Pelo más brillante, piel reseca..." },
        { nombre: "notas", etiqueta: "Notas", tipo: "text", max: 255 }
    ],

    compras: () => [
        {
            nombre: "id_alimento", etiqueta: "Alimento", tipo: "select", requerido: true, col: 6,
            opciones: [["", "Elige el alimento"], ...opcionesAlimentos().slice(1)]
        },
        { nombre: "fecha", etiqueta: "Fecha de compra", tipo: "date", requerido: true, col: 6, defecto: hoyTexto },
        { nombre: "cantidad_g", etiqueta: "Cantidad comprada (g)", tipo: "number", requerido: true, col: 6, min: 1, step: 1, placeholder: "Ej: 15000 para una bolsa de 15 kg" },
        { nombre: "lugar", etiqueta: "Dónde se compró", tipo: "text", max: 120 }
    ],

    recomendaciones: () => [
        { nombre: "titulo", etiqueta: "Recomendación", tipo: "text", requerido: true, col: 12, max: 150, placeholder: "Ej: Reducir la porción diaria" },
        { nombre: "contenido", etiqueta: "Indicaciones del veterinario", tipo: "textarea", requerido: true },
        { nombre: "profesional", etiqueta: "Veterinario o nutricionista", tipo: "text", col: 6, max: 120 },
        { nombre: "fecha", etiqueta: "Fecha", tipo: "date", requerido: true, col: 6, defecto: hoyTexto }
    ]
};


// =========================================
// LISTAS
// =========================================

function tarjetaAlimento(a) {

    const existencias = a.existencias_g;

    const bajo = a.alerta_minima_g !== null && existencias <= a.alerta_minima_g;

    return {
        miniatura: miniaturaFoto(a.foto),
        titulo: [a.nombre, a.marca].filter(Boolean).join(" - "),
        subtitulo: TEXTOS.tipoAlimento[a.tipo],
        lineas: [
            a.ingredientes && H(`<strong>Ingredientes:</strong> ${escaparHTML(a.ingredientes)}`),
            a.fecha_inicio && `Lo come desde el ${fechaCorta(a.fecha_inicio)}${a.fecha_fin ? " hasta el " + fechaCorta(a.fecha_fin) : ""}`,
            a.observaciones
        ],
        badges: [
            a.en_uso ? badge("En uso", "green") : badge("Ya no lo come", "gray"),
            a.en_uso && (existencias > 0 || a.stock_inicial_g > 0)
                ? badge(`Quedan ${gramos(Math.max(existencias, 0))}`, bajo ? "red" : "blue")
                : "",
            a.alerta_enviada && badge(`Aviso enviado al correo el ${fechaCorta(a.alerta_enviada)}`, "orange")
        ]
    };

}


const LISTAS = {

    alimentos: {
        recurso: "alimentos", titulo: "Alimentos que come", icono: "bi-basket2", color: "orange",
        descripcion: "Nombre, marca, tipo e ingredientes.",
        boton: "Agregar alimento", vacio: "No hay alimentos registrados.",
        tipos: TIPOS_COMIDA,
        datos: () => ficha.alimentos.filter(a => TIPOS_COMIDA.includes(a.tipo)),
        tarjeta: tarjetaAlimento
    },

    extras: {
        recurso: "alimentos", titulo: "Premios, golosinas y suplementos", icono: "bi-gift", color: "purple",
        descripcion: "Lo que recibe aparte de su comida.",
        boton: "Agregar premio o suplemento", vacio: "No hay premios ni suplementos registrados.",
        tipos: TIPOS_EXTRA,
        datos: () => ficha.alimentos.filter(a => TIPOS_EXTRA.includes(a.tipo)),
        tarjeta: tarjetaAlimento
    },

    restricciones: {
        recurso: "restricciones", titulo: "Alimentos que no tolera o debe evitar", icono: "bi-slash-circle", color: "red",
        descripcion: "Según indicación profesional o lo que has observado.",
        boton: "Agregar alimento a evitar", vacio: "No hay alimentos a evitar registrados.",
        datos: () => ficha.restricciones,
        tarjeta: r => ({
            miniatura: miniaturaFoto(r.foto),
            titulo: r.alimento,
            subtitulo: r.fecha ? fechaCorta(r.fecha) : "Sin fecha",
            lineas: [r.reaccion && H(`<strong>Reacción:</strong> ${escaparHTML(r.reaccion)}`), r.observaciones],
            badges: [badge(TEXTOS.motivo[r.motivo], r.motivo === "toxico" ? "red" : "orange"), badgeOrigen(r.origen)]
        })
    },

    comidas: {
        recurso: "comidas", titulo: "Comidas registradas", icono: "bi-egg-fried", color: "orange",
        descripcion: "Las 40 más recientes.",
        boton: "Registrar comida", vacio: "No hay comidas registradas.",
        datos: () => ficha.comidas.slice(0, 40),
        tarjeta: c => {
            const comio = consumido(c);
            const restos = c.cantidad_g - comio;
            return {
                titulo: c.alimento,
                subtitulo: fechaHora(c.fecha_hora),
                lineas: [
                    `Servido: ${gramos(c.cantidad_g)} · Comió: ${gramos(comio)}${restos > 0 ? ` · Dejó: ${gramos(restos)}` : ""}`,
                    c.duracion_min !== null && `Tardó ${c.duracion_min} min`,
                    c.notas
                ],
                badges: [
                    badge(TEXTOS.apetito[c.apetito], { normal: "green", poco: "orange", ansioso: "purple", rechazo: "red" }[c.apetito])
                ]
            };
        }
    },

    horarios: {
        recurso: "horarios", titulo: "Horarios de comidas y snacks", icono: "bi-clock", color: "blue",
        descripcion: "Te llega un recordatorio 30 minutos antes de cada uno.",
        boton: "Agregar horario", vacio: "No hay horarios definidos.",
        datos: () => ficha.horarios,
        resumen: lista => {
            const comidas = lista.filter(h => h.tipo !== "snack");
            const snacks = lista.length - comidas.length;
            return `${comidas.length} ${comidas.length === 1 ? "comida" : "comidas"}${snacks ? ` y ${snacks} ${snacks === 1 ? "snack" : "snacks"}` : ""} al día · ${gramos(comidas.reduce((t, h) => t + h.porcion_g, 0))} de comida`;
        },
        tarjeta: h => {
            const alimento = ficha.alimentos.find(a => a.id_alimento === h.id_alimento);
            return {
                icono: h.tipo === "snack" ? "bi-gift" : "bi-clock",
                color: h.tipo === "snack" ? "purple" : "blue",
                titulo: horaCorta(h.hora),
                subtitulo: h.descripcion || (h.tipo === "snack" ? "Snack" : "Comida"),
                lineas: [`Servir ${gramos(h.porcion_g)}${alimento ? ` de ${alimento.nombre}` : ""}`],
                badges: [
                    h.tipo === "snack" ? badge("Snack", "purple") : badge("Comida", "blue"),
                    h.id_plan ? badge(ficha.planes.find(p => p.id_plan === h.id_plan)?.nombre, "gray") : ""
                ]
            };
        }
    },

    planes: {
        recurso: "planes", titulo: "Plan de alimentación", icono: "bi-journal-check", color: "green",
        descripcion: "Los cambios de plan quedan en la evolución del peso.",
        boton: "Agregar plan", vacio: "No hay planes de alimentación.",
        datos: () => ficha.planes,
        tarjeta: p => ({
            titulo: p.nombre,
            subtitulo: [p.tipo_alimento, p.marca].filter(Boolean).join(" · "),
            lineas: [
                [p.porcion_diaria_g && `${gramos(p.porcion_diaria_g)} al día`, p.calorias_diarias && `${p.calorias_diarias} kcal`].filter(Boolean).join(" · "),
                `Desde ${fechaCorta(p.fecha_inicio)}${p.fecha_fin ? " hasta " + fechaCorta(p.fecha_fin) : ""}`
            ],
            badges: [p.activo ? badge("Plan actual", "green") : badge("Anterior", "gray")]
        })
    },

    agua: {
        recurso: "agua", titulo: "Consumo de agua", icono: "bi-droplet", color: "blue",
        descripcion: "Agua ofrecida, consumo aproximado y cambios en la sed.",
        boton: "Registrar agua", vacio: "No hay registros de agua.",
        datos: () => ficha.agua,
        tarjeta: a => ({
            titulo: a.consumida_ml !== null ? `Bebió unos ${numero(a.consumida_ml)} ml` : a.ofrecida_ml !== null ? `Se ofrecieron ${numero(a.ofrecida_ml)} ml` : "Registro de agua",
            subtitulo: fechaCorta(a.fecha),
            lineas: [
                [a.ofrecida_ml !== null && a.consumida_ml !== null && `Ofrecida: ${numero(a.ofrecida_ml)} ml`,
                    a.veces_bebe !== null && `Bebió ${a.veces_bebe} ${a.veces_bebe === 1 ? "vez" : "veces"}`].filter(Boolean).join(" · "),
                a.notas
            ],
            badges: [badge(TEXTOS.sed[a.cambio_sed], { normal: "green", aumentada: "orange", disminuida: "red" }[a.cambio_sed])]
        })
    },

    pesos: {
        recurso: "pesos", titulo: "Peso y condición física", icono: "bi-graph-up", color: "purple",
        descripcion: "El registro más reciente es su peso actual.",
        boton: "Registrar peso", vacio: "No hay mediciones de peso.",
        datos: () => ficha.pesos,
        tarjeta: (p, i, lista) => {
            const anterior = lista[i + 1];
            const diferencia = anterior ? p.peso_kg - anterior.peso_kg : 0;

            // Cambios de alimentación entre la medición anterior y esta
            const cambios = anterior ? [
                ...ficha.planes.filter(pl => pl.fecha_inicio > anterior.fecha && pl.fecha_inicio <= p.fecha).map(pl => `plan "${pl.nombre}"`),
                ...ficha.alimentos.filter(a => a.fecha_inicio && a.fecha_inicio > anterior.fecha && a.fecha_inicio <= p.fecha).map(a => `"${a.nombre}"`)
            ] : [];

            return {
                titulo: `${numero(p.peso_kg)} kg`,
                subtitulo: fechaCorta(p.fecha),
                lineas: [
                    [p.condicion_corporal && `Condición corporal: ${p.condicion_corporal}/9`, p.energia && `Energía: ${TEXTOS.energia[p.energia]}`].filter(Boolean).join(" · "),
                    p.pelo_piel && `Pelo y piel: ${p.pelo_piel}`,
                    cambios.length && H(`<i class="bi bi-arrow-repeat"></i> Después de empezar ${escaparHTML(cambios.join(", "))}`),
                    p.notas
                ],
                badges: [
                    anterior && Math.abs(diferencia) >= 0.01
                        ? badge(`${diferencia > 0 ? "▲ +" : "▼ "}${numero(diferencia)} kg`, diferencia > 0 ? "orange" : "blue")
                        : "",
                    p.condicion_corporal && badge(p.condicion_corporal <= 3 ? "Bajo peso" : p.condicion_corporal >= 7 ? "Sobrepeso" : "Peso adecuado",
                        p.condicion_corporal <= 3 || p.condicion_corporal >= 7 ? "orange" : "green")
                ]
            };
        }
    },

    compras: {
        recurso: "compras", titulo: "Compras de alimento", icono: "bi-cart", color: "green",
        descripcion: "Cada compra suma a las existencias en casa.",
        boton: "Registrar compra", vacio: "No hay compras registradas.",
        datos: () => ficha.compras,
        tarjeta: c => ({
            titulo: [c.nombre_alimento, c.marca_alimento].filter(Boolean).join(" - "),
            subtitulo: `${fechaCorta(c.fecha)}${c.lugar ? " · " + c.lugar : ""}`,
            lineas: [`Cantidad: ${gramos(c.cantidad_g)}`],
            badges: []
        })
    },

    recomendaciones: {
        recurso: "recomendaciones", titulo: "Recomendaciones del veterinario", icono: "bi-clipboard2-heart", color: "green",
        descripcion: "Indicaciones nutricionales para hacer seguimiento.",
        boton: "Agregar recomendación", vacio: "No hay recomendaciones registradas.",
        datos: () => ficha.recomendaciones,
        tarjeta: r => ({
            titulo: r.titulo,
            subtitulo: `${fechaCorta(r.fecha)}${r.profesional ? " · " + r.profesional : ""}`,
            lineas: [r.contenido],
            badges: [badge("Informe veterinario", "blue")]
        })
    }
};


const ID_RECURSO = {
    alimentos: "id_alimento", restricciones: "id_restriccion", comidas: "id_registro",
    horarios: "id_horario", planes: "id_plan", agua: "id_agua", pesos: "id_peso",
    compras: "id_compra", recomendaciones: "id_recomendacion"
};


// =========================================
// FICHA DE LA MASCOTA
// =========================================

function dibujarFicha() {


    const m = ficha.mascota;

    const foto = urlFoto(m.foto);

    const plan = ficha.planes.find(p => p.activo);

    const principal = ficha.alimentos.filter(a => a.en_uso && TIPOS_COMIDA.includes(a.tipo));

    const ultima = ficha.comidas[0];


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
                    <span><i class="bi bi-speedometer2"></i> ${m.peso_actual ? numero(m.peso_actual) + " kg" : "Peso sin dato"}</span>
                    <span><i class="bi bi-journal-check"></i> ${plan ? escaparHTML(plan.nombre) : "Sin plan"}</span>
                    <span><i class="bi bi-clock"></i> ${horariosDeComida().length} ${horariosDeComida().length === 1 ? "comida" : "comidas"} al día</span>
                </div>
            </div>
        </div>

        <div class="health-alerts">
            ${alerta("bi-slash-circle", "red", "Debe evitar", ficha.restricciones.map(r => r.alimento), "Nada registrado")}
            ${alerta("bi-basket2", "orange", "Come actualmente", principal.map(a => a.nombre), "Sin alimentos registrados")}
        </div>

        <div class="health-next">
            <div>
                <span><i class="bi bi-egg-fried"></i> Última comida</span>
                <strong>${ultima ? fechaHora(ultima.fecha_hora) : "—"}</strong>
            </div>
            <div>
                <span><i class="bi bi-droplet"></i> Último registro de agua</span>
                <strong>${ficha.agua[0] ? fechaCorta(ficha.agua[0].fecha) : "—"}</strong>
            </div>
            <div>
                <span><i class="bi bi-graph-up"></i> Último peso</span>
                <strong>${ficha.pesos[0] ? `${numero(ficha.pesos[0].peso_kg)} kg · ${fechaCorta(ficha.pesos[0].fecha)}` : "—"}</strong>
            </div>
        </div>
    `;

}


// =========================================
// TOTALES DIARIOS (últimos 7 días)
// =========================================

function totalesPorDia(dias) {


    const resultado = [];


    for (let i = 0; i < dias; i++) {

        const fecha = haceDias(i);

        const delDia = ficha.comidas.filter(c => c.fecha_hora.slice(0, 10) === fecha);

        const servido = delDia.reduce((t, c) => t + c.cantidad_g, 0);

        const comio = delDia.reduce((t, c) => t + consumido(c), 0);


        resultado.push({ fecha, comidas: delDia.length, servido, comio, restos: servido - comio });

    }


    return resultado;

}


function dibujarTotalesDiarios() {


    const dias = totalesPorDia(7);


    if (dias.every(d => d.comidas === 0)) {

        document.getElementById("totalesDiarios").innerHTML =
            '<p class="records-empty">Registra comidas para ver los totales de cada día.</p>';

        return;

    }


    document.getElementById("totalesDiarios").innerHTML = `
        <div class="table-responsive">
            <table class="daily-table">
                <thead>
                    <tr>
                        <th>Día</th>
                        <th>Comidas</th>
                        <th>Servido</th>
                        <th>Comió</th>
                        <th>Restos</th>
                        <th>Cambio en lo servido</th>
                    </tr>
                </thead>
                <tbody>
                    ${dias.map((d, i) => {

                        const anterior = dias[i + 1];

                        const cambio = anterior && anterior.comidas && d.comidas ? d.servido - anterior.servido : 0;

                        return `
                            <tr class="${d.comidas ? "" : "empty"}">
                                <td>${i === 0 ? "Hoy" : i === 1 ? "Ayer" : aFecha(d.fecha).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })}</td>
                                <td>${d.comidas}</td>
                                <td>${d.comidas ? gramos(d.servido) : "—"}</td>
                                <td>${d.comidas ? gramos(d.comio) : "—"}${d.servido ? ` <small>(${porcentaje(d.comio, d.servido)}%)</small>` : ""}</td>
                                <td class="${d.restos > 0 ? "warn" : ""}">${d.comidas ? gramos(d.restos) : "—"}</td>
                                <td>${Math.abs(cambio) >= 1 ? `<span class="${cambio > 0 ? "up" : "down"}">${cambio > 0 ? "▲ +" : "▼ "}${gramos(Math.abs(cambio))}</span>` : "—"}</td>
                            </tr>
                        `;

                    }).join("")}
                </tbody>
            </table>
        </div>
    `;

}


// =========================================
// REGULARIDAD DE LOS HORARIOS (últimos 14 días)
// =========================================

function calcularRegularidad() {


    const desde = haceDias(13);

    const comidas = ficha.comidas.filter(c => c.fecha_hora.slice(0, 10) >= desde);


    if (!horariosDeComida().length || !comidas.length) {

        return null;

    }


    // Cada comida se compara con el horario más cercano: a tiempo si es ±30 minutos
    let puntuales = 0;

    for (const comida of comidas) {

        const minutos = minutosDelDia(comida.fecha_hora.slice(11, 16));

        const diferencia = Math.min(...horariosDeComida().map(h => Math.abs(minutosDelDia(h.hora) - minutos)));

        if (diferencia <= 30) {

            puntuales++;

        }

    }


    const diasConRegistro = new Set(comidas.map(c => c.fecha_hora.slice(0, 10))).size;


    return {
        puntualidad: porcentaje(puntuales, comidas.length),
        comidasPorDia: comidas.length / diasConRegistro,
        rechazos: comidas.filter(c => c.apetito === "rechazo").length,
        poco: comidas.filter(c => c.apetito === "poco").length,
        duracion: comidas.filter(c => c.duracion_min !== null).map(c => c.duracion_min)
    };

}


function dibujarRegularidad() {


    const r = calcularRegularidad();

    const contenedor = document.getElementById("regularidad");


    if (!r) {

        contenedor.innerHTML = `
            <div class="list-header mb-0">
                <div>
                    <h3><i class="bi bi-calendar-check"></i> Regularidad de los horarios</h3>
                    <p>Define los horarios y registra las comidas para ver si se mantienen.</p>
                </div>
            </div>
        `;

        return;

    }


    const promedioDuracion = r.duracion.length
        ? Math.round(r.duracion.reduce((t, d) => t + d, 0) / r.duracion.length)
        : null;


    contenedor.innerHTML = `
        <div class="list-header">
            <div>
                <h3><i class="bi bi-calendar-check"></i> Regularidad de los horarios</h3>
                <p>Últimos 14 días. A tiempo = máximo 30 minutos de diferencia con su horario.</p>
            </div>
        </div>

        <div class="mini-stats">
            <div><strong>${r.puntualidad}%</strong><span>Comidas a tiempo</span></div>
            <div><strong>${numero(r.comidasPorDia)}</strong><span>Comidas al día (plan: ${horariosDeComida().length})</span></div>
            <div><strong>${promedioDuracion !== null ? promedioDuracion + " min" : "—"}</strong><span>Tarda en comer</span></div>
            <div><strong>${r.rechazos + r.poco}</strong><span>Veces que comió poco o rechazó</span></div>
        </div>
    `;

}


// =========================================
// EXISTENCIAS
// =========================================

// Solo los alimentos en uso de los que se lleva control
// (tienen cantidad en casa, compras o comidas registradas)
function calcularExistencias() {

    return ficha.alimentos
        .filter(a => a.en_uso && (a.stock_inicial_g > 0 || a.existencias_g !== 0 || a.consumo_diario_g))
        .map(a => {

            const quedan = Math.max(a.existencias_g, 0);

            const dias = a.consumo_diario_g ? Math.floor(quedan / a.consumo_diario_g) : null;

            const bajo = (a.alerta_minima_g !== null && quedan <= a.alerta_minima_g) || (dias !== null && dias <= 5);

            return { ...a, quedan, dias, bajo };

        });

}


function dibujarExistencias() {


    const lista = calcularExistencias();

    const contenedor = document.getElementById("existencias");


    if (!lista.length) {

        contenedor.innerHTML = '<p class="records-empty">Agrega los alimentos que come con la cantidad que hay en casa, o registra una compra.</p>';

        return;

    }


    contenedor.innerHTML = `<div class="stock-list">${lista.map(a => {

        // La barra se llena según los días que alcanzan (30 días = barra llena)
        const llenado = a.dias !== null ? Math.min(100, Math.round((a.dias / 30) * 100)) : (a.quedan > 0 ? 100 : 0);

        return `
            <div class="stock-item ${a.bajo ? "low" : ""}">
                <div class="stock-top">
                    <strong>${escaparHTML([a.nombre, a.marca].filter(Boolean).join(" - "))}</strong>
                    <span>${gramos(a.quedan)}</span>
                </div>
                <div class="stock-bar"><div style="width: ${llenado}%"></div></div>
                <small>
                    ${a.consumo_diario_g ? `Consume ${gramos(a.consumo_diario_g)} al día · ` : ""}
                    ${a.dias !== null ? `alcanza para unos <strong>${a.dias} días</strong>` : "Registra comidas con este alimento para calcular cuánto dura"}
                    ${a.bajo ? ' · <strong class="text-danger">Hay que comprar pronto</strong>' : ""}
                </small>
            </div>
        `;

    }).join("")}</div>`;

}


// =========================================
// RESUMEN DE CONTROLES
// =========================================

function dibujarControles() {


    const tarjeta = (icono, color, titulo, pregunta, valor, detalle, estado = "") => `
        <div class="control-card">
            <div class="control-head">
                <div class="control-icon ${color}"><i class="bi ${icono}"></i></div>
                <div>
                    <strong>${titulo}</strong>
                    <span>${pregunta}</span>
                </div>
            </div>
            <div class="control-value">${valor}</div>
            <p>${detalle}</p>
            ${estado}
        </div>
    `;

    const sinDatos = texto => `<span class="control-empty">${texto}</span>`;


    // 1. Cantidad diaria: servido vs consumido (7 días)
    const dias = totalesPorDia(7).filter(d => d.comidas);

    const servido = dias.reduce((t, d) => t + d.servido, 0);

    const comio = dias.reduce((t, d) => t + d.comio, 0);

    const cantidad = dias.length
        ? tarjeta("bi-egg-fried", "orange", "Cantidad diaria", "Comparar lo servido con lo consumido",
            `${porcentaje(comio, servido)}%`,
            `Comió ${gramos(comio / dias.length)} de ${gramos(servido / dias.length)} servidos al día (promedio de ${dias.length} ${dias.length === 1 ? "día" : "días"}).`,
            porcentaje(comio, servido) < 80 ? badge("Está dejando comida", "orange") : badge("Come bien", "green"))
        : tarjeta("bi-egg-fried", "orange", "Cantidad diaria", "Comparar lo servido con lo consumido", sinDatos("Sin comidas esta semana"), "Registra las comidas en la pestaña Comidas.");


    // 2. Rutina alimentaria
    const r = calcularRegularidad();

    const rutina = r
        ? tarjeta("bi-clock", "blue", "Rutina alimentaria", "Comprobar si se mantienen los horarios",
            `${r.puntualidad}%`,
            `de las comidas fueron a tiempo · ${numero(r.comidasPorDia)} comidas al día (plan: ${horariosDeComida().length}).`,
            r.puntualidad < 70 ? badge("Horarios irregulares", "orange") : badge("Horarios regulares", "green"))
        : tarjeta("bi-clock", "blue", "Rutina alimentaria", "Comprobar si se mantienen los horarios", sinDatos("Sin datos"), "Define los horarios y registra las comidas.");


    // 3. Peso: tendencia en los últimos ~30 días
    const pesos = ficha.pesos;

    let peso;

    if (pesos.length >= 2) {

        const actual = pesos[0];

        const referencia = pesos.find(p => p.fecha <= haceDias(30)) || pesos[pesos.length - 1];

        const cambio = actual.peso_kg - referencia.peso_kg;

        const porc = (cambio / referencia.peso_kg) * 100;

        const tendencia = Math.abs(porc) < 1 ? ["Estable", "green"] : cambio > 0 ? ["Está aumentando", "orange"] : ["Está bajando", "blue"];

        peso = tarjeta("bi-graph-up", "purple", "Peso", "Detectar tendencias de aumento o pérdida",
            `${cambio > 0 ? "+" : ""}${numero(cambio)} kg`,
            `De ${numero(referencia.peso_kg)} kg (${fechaCorta(referencia.fecha)}) a ${numero(actual.peso_kg)} kg (${fechaCorta(actual.fecha)}) · ${porc > 0 ? "+" : ""}${numero(porc)}%.`,
            badge(tendencia[0], tendencia[1]));

    } else {

        peso = tarjeta("bi-graph-up", "purple", "Peso", "Detectar tendencias de aumento o pérdida",
            pesos.length ? `${numero(pesos[0].peso_kg)} kg` : sinDatos("Sin mediciones"),
            "Registra al menos dos mediciones para ver la tendencia.");

    }


    // 4. Hidratación: esta semana vs la anterior
    const promedioAgua = (desde, hasta) => {

        const registros = ficha.agua.filter(a => a.fecha >= desde && a.fecha <= hasta && (a.consumida_ml ?? a.ofrecida_ml) !== null);

        return registros.length
            ? registros.reduce((t, a) => t + (a.consumida_ml ?? a.ofrecida_ml), 0) / registros.length
            : null;

    };

    const aguaAhora = promedioAgua(haceDias(6), hoyTexto());

    const aguaAntes = promedioAgua(haceDias(13), haceDias(7));

    const cambiosSed = ficha.agua.filter(a => a.fecha >= haceDias(6) && a.cambio_sed !== "normal");

    let hidratacion;

    if (aguaAhora !== null) {

        const cambio = aguaAntes ? ((aguaAhora - aguaAntes) / aguaAntes) * 100 : null;

        hidratacion = tarjeta("bi-droplet", "blue", "Hidratación", "Identificar cambios en el consumo de agua",
            `${numero(Math.round(aguaAhora))} ml`,
            `al día en promedio esta semana${cambio !== null ? ` · ${cambio > 0 ? "+" : ""}${Math.round(cambio)}% frente a la semana anterior` : ""}.`,
            cambiosSed.length || (cambio !== null && Math.abs(cambio) >= 25)
                ? badge(cambiosSed.length ? `Sed ${cambiosSed[0].cambio_sed}` : "Cambio llamativo", "orange")
                : badge("Sin cambios llamativos", "green"));

    } else {

        hidratacion = tarjeta("bi-droplet", "blue", "Hidratación", "Identificar cambios en el consumo de agua",
            sinDatos("Sin registros esta semana"), "Registra el agua en la pestaña Agua.",
            cambiosSed.length ? badge(`Sed ${cambiosSed[0].cambio_sed}`, "orange") : "");

    }


    // 5. Tolerancia: síntomas (de Salud) en los 14 días después de un cambio de alimento
    const relaciones = ficha.sintomas.map(s => {

        const desde = (() => { const d = aFecha(s.fecha_inicio); d.setDate(d.getDate() - 14); return d.toLocaleDateString("en-CA"); })();

        const cambios = [
            ...ficha.alimentos.filter(a => a.fecha_inicio && a.fecha_inicio >= desde && a.fecha_inicio <= s.fecha_inicio).map(a => a.nombre),
            ...ficha.planes.filter(p => p.fecha_inicio >= desde && p.fecha_inicio <= s.fecha_inicio).map(p => `plan ${p.nombre}`)
        ];

        return cambios.length ? `${s.descripcion} (${fechaCorta(s.fecha_inicio)}) después de empezar ${cambios.join(", ")}` : null;

    }).filter(Boolean);

    const tolerancia = tarjeta("bi-shield-exclamation", "red", "Tolerancia alimentaria", "Relacionar síntomas con cambios de alimento",
        relaciones.length ? `${relaciones.length}` : "0",
        relaciones.length
            ? escaparHTML(relaciones.slice(0, 2).join(" · "))
            : "Ningún síntoma registrado en Salud apareció en los 14 días siguientes a un cambio de alimento.",
        relaciones.length ? badge("Revisar con el veterinario", "orange") : badge("Sin relación encontrada", "green"));


    // 6. Existencias
    const existencias = calcularExistencias();

    const porComprar = existencias.filter(a => a.bajo);

    const menor = existencias.filter(a => a.dias !== null).sort((a, b) => a.dias - b.dias)[0];

    const stock = tarjeta("bi-box-seam", "orange", "Existencias", "Controlar cuánto alimento queda y cuándo comprar más",
        menor ? `${menor.dias} días` : existencias.length ? sinDatos("Sin consumo registrado") : sinDatos("Sin alimentos"),
        menor ? `alcanza ${escaparHTML(menor.nombre)} (${gramos(menor.quedan)} en casa).` : "Registra los alimentos, sus existencias y las comidas.",
        porComprar.length ? badge(`Comprar: ${porComprar.map(a => a.nombre).join(", ")}`, "red") : existencias.length ? badge("Hay suficiente", "green") : "");




    // 7. Seguimiento nutricional
    const ultima = ficha.recomendaciones[0];

    const seguimiento = tarjeta("bi-clipboard2-heart", "green", "Seguimiento nutricional", "Registro de las recomendaciones del veterinario",
        `${ficha.recomendaciones.length}`,
        ultima ? `Última: <strong>${escaparHTML(ultima.titulo)}</strong> (${fechaCorta(ultima.fecha)}).` : "Aún no hay recomendaciones registradas.",
        "");


    document.getElementById("controles").innerHTML =
        cantidad + rutina + peso + hidratacion + tolerancia + stock + seguimiento;

}


// =========================================
// INICIAR
// =========================================

iniciarApartado({
    ruta: "/alimentacion",
    listas: LISTAS,
    formularios: FORMULARIOS,
    ids: ID_RECURSO,
    alDibujar: () => {
        dibujarFicha();
        dibujarControles();
        dibujarTotalesDiarios();
        dibujarRegularidad();
        dibujarExistencias();
    }
});
