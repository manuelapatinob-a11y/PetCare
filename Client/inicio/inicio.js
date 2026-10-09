// =========================================
// PETCARE - INICIO DEL USUARIO
// Usa las funciones de ../auth/sesion.js
// =========================================


/*
Ícono y color de cada tipo de evento
*/

const estiloEvento = {
    cita: { icono: "bi-calendar-check", clase: "blue", nombre: "Cita" },
    vacuna: { icono: "bi-shield-plus", clase: "green", nombre: "Vacuna" },
    cumpleanos: { icono: "bi-cake2", clase: "pink", nombre: "Cumpleaños" },
    desparasitacion: { icono: "bi-capsule", clase: "green", nombre: "Desparasitación" },
    comida: { icono: "bi-cup-hot", clase: "orange", nombre: "Comida" },
    medicamento: { icono: "bi-capsule-pill", clase: "red", nombre: "Medicamento" },
    paseo: { icono: "bi-person-walking", clase: "purple", nombre: "Paseo" },
    entrenamiento: { icono: "bi-trophy", clase: "purple", nombre: "Entrenamiento" },
    otro: { icono: "bi-bell", clase: "orange", nombre: "Recordatorio" }
};


// =========================================
// AYUDAS
// =========================================

function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto ?? "";

    return div.innerHTML;

}


function inicioDelDia(fecha) {

    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

}


function diasHasta(fecha) {

    return Math.round(
        (inicioDelDia(fecha) - inicioDelDia(new Date())) / 86400000
    );

}


// "Hoy", "Mañana", "En 5 días" o la fecha
function cuandoEs(fecha) {


    const dias = diasHasta(fecha);


    if (dias === 0) {

        return "Hoy";

    }

    if (dias === 1) {

        return "Mañana";

    }

    if (dias < 7) {

        return `En ${dias} días`;

    }

    return fecha.toLocaleDateString("es-CO", { day: "numeric", month: "short" });

}


function horaDe(fecha) {

    return fecha.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

}


// =========================================
// SALUDO Y FECHA
// =========================================

function mostrarSaludo() {


    const hora = new Date().getHours();


    document.getElementById("saludo").textContent =
        hora < 12 ? "¡Buenos días" : hora < 19 ? "¡Buenas tardes" : "¡Buenas noches";


    const fecha = new Date().toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });


    document.getElementById("fechaHoy").textContent =
        fecha.charAt(0).toUpperCase() + fecha.slice(1);

}


// =========================================
// PRÓXIMOS EVENTOS
// =========================================

// Cumpleaños de las mascotas en los próximos 30 días
function cumpleanos(mascotas) {


    const hoy = inicioDelDia(new Date());

    const eventos = [];


    mascotas
        .filter(m => m.fecha_nacimiento)
        .forEach(m => {

            const nacimiento = new Date(`${m.fecha_nacimiento}T00:00:00`);

            const proximo = new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate());

            if (proximo < hoy) {

                proximo.setFullYear(hoy.getFullYear() + 1);

            }

            const anios = proximo.getFullYear() - nacimiento.getFullYear();


            if (diasHasta(proximo) <= 30 && anios > 0) {

                eventos.push({
                    tipo: "cumpleanos",
                    fecha: proximo,
                    todoElDia: true,
                    titulo: `¡${m.nombre} cumple ${anios} ${anios === 1 ? "año" : "años"}!`,
                    detalle: "Prepárale algo especial 🎉"
                });

            }

        });


    return eventos;

}


// Junta citas, vacunas, recordatorios y cumpleaños en una sola lista
function armarEventos(datos) {

    return [

        ...datos.citas.map(c => ({
            tipo: "cita",
            fecha: new Date(c.fecha_hora),
            titulo: c.motivo,
            detalle: [c.mascota, c.veterinario].filter(Boolean).join(" · ")
        })),

        ...(datos.desparasitaciones || []).map(d => ({
            tipo: "desparasitacion",
            fecha: new Date(`${d.proxima_aplicacion}T00:00:00`),
            todoElDia: true,
            titulo: `Desparasitación ${d.tipo}: ${d.producto}`,
            detalle: d.mascota
        })),

        ...datos.vacunas.map(v => ({
            tipo: "vacuna",
            fecha: new Date(`${v.proxima_dosis}T00:00:00`),
            todoElDia: true,
            titulo: `Vacuna: ${v.vacuna}`,
            detalle: v.mascota
        })),

        ...datos.recordatorios.map(r => ({
            tipo: estiloEvento[r.tipo] ? r.tipo : "otro",
            fecha: new Date(r.fecha_hora),
            titulo: r.titulo,
            detalle: [r.mascota, r.descripcion].filter(Boolean).join(" · ")
        })),

        ...cumpleanos(datos.mascotas)

    ].sort((a, b) => a.fecha - b.fecha);

}


// Los próximos 7 días con un punto por cada evento
function mostrarSemana(eventos) {


    const hoy = inicioDelDia(new Date());

    const dias = [];


    for (let i = 0; i < 7; i++) {

        const dia = new Date(hoy);

        dia.setDate(hoy.getDate() + i);


        const delDia = eventos.filter(e => diasHasta(e.fecha) === i);

        const puntos = delDia
            .slice(0, 3)
            .map(e => `<i class="dot ${estiloEvento[e.tipo].clase}"></i>`)
            .join("");


        dias.push(`
            <div class="day ${i === 0 ? "today" : ""}" title="${delDia.length} evento(s)">
                <span>${dia.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", "")}</span>
                <strong>${dia.getDate()}</strong>
                <div class="dots">${puntos}</div>
            </div>
        `);

    }


    document.getElementById("semana").innerHTML = dias.join("");

}


function mostrarEventos(eventos) {


    const contenedor = document.getElementById("eventos");

    const proximos = eventos.slice(0, 6);


    if (proximos.length === 0) {

        contenedor.innerHTML = `
            <div class="empty-events">
                <span>🎉</span>
                <strong>No tienes pendientes próximos</strong>
                <p>Aquí verás citas, vacunas, recordatorios y cumpleaños de tus mascotas.</p>
            </div>
        `;

        return;

    }


    contenedor.innerHTML = proximos.map(evento => {


        const estilo = estiloEvento[evento.tipo];


        return `
            <div class="event">

                <div class="event-icon ${estilo.clase}">
                    <i class="bi ${estilo.icono}"></i>
                </div>

                <div class="event-info">
                    <strong>${escaparHTML(evento.titulo)}</strong>
                    <span>${escaparHTML(evento.detalle || estilo.nombre)}</span>
                </div>

                <div class="event-date">
                    <strong>${cuandoEs(evento.fecha)}</strong>
                    <span>${evento.todoElDia ? estilo.nombre : horaDe(evento.fecha)}</span>
                </div>

            </div>
        `;

    }).join("");

}


// =========================================
// CONSEJO DEL DÍA
// =========================================

function mostrarConsejo(consejo) {


    if (!consejo) {

        return;

    }


    document.getElementById("consejoTitulo").textContent = consejo.titulo;

    document.getElementById("consejoTexto").textContent = consejo.contenido;

    document.getElementById("consejoCategoria").textContent =
        [consejo.categoria, consejo.especie].filter(Boolean).join(" · ");

    document.getElementById("consejo").hidden = false;

}


// =========================================
// CLIMA PARA PASEAR (Open-Meteo, gratis y sin clave)
// =========================================

const MEDELLIN = { nombre: "Medellín", latitude: 6.245, longitude: -75.5715 };


// Códigos del clima de la Organización Meteorológica Mundial
function describirClima(codigo, esDeDia) {

    if (codigo === 0) return { texto: "Despejado", emoji: esDeDia ? "☀️" : "🌙" };
    if (codigo <= 2) return { texto: "Parcialmente nublado", emoji: esDeDia ? "⛅" : "☁️" };
    if (codigo === 3) return { texto: "Nublado", emoji: "☁️" };
    if (codigo <= 48) return { texto: "Niebla", emoji: "🌫️" };
    if (codigo <= 57) return { texto: "Llovizna", emoji: "🌦️" };
    if (codigo <= 67) return { texto: "Lluvia", emoji: "🌧️" };
    if (codigo <= 77) return { texto: "Nieve", emoji: "❄️" };
    if (codigo <= 82) return { texto: "Chubascos", emoji: "🌧️" };
    return { texto: "Tormenta", emoji: "⛈️" };

}


// Recomendaciones para el paseo según el clima
function recomendaciones(actual, dia) {


    const lista = [];

    let estado = "ideal";


    if (actual.weather_code >= 95) {

        lista.push("Hay tormenta: mejor quédense en casa. Muchas mascotas se asustan con los truenos.");

        estado = "casa";

    } else if (actual.precipitation > 0 || actual.weather_code >= 51 || dia.precipitation_probability_max[0] >= 70) {

        lista.push("Es probable que llueva: lleva impermeable y seca bien sus patas al volver.");

        estado = "precaucion";

    }


    if (actual.temperature_2m >= 28) {

        lista.push("Hace calor: pasea temprano o al atardecer y lleva agua. Toca el piso 5 segundos con tu mano: si te quema, también a sus patas.");

        estado = estado === "casa" ? "casa" : "precaucion";

    }


    if (actual.is_day && dia.uv_index_max[0] >= 8) {

        lista.push("El índice UV es alto: busca la sombra entre las 10 a. m. y las 3 p. m.");

    }


    if (actual.temperature_2m <= 12) {

        lista.push("Hace frío: abriga a las mascotas pequeñas o de pelo corto.");

    }


    if (!actual.is_day) {

        lista.push("Si salen de noche, usa collar o arnés reflectivo.");

    }


    if (lista.length === 0) {

        lista.push("¡Buen clima para un paseo! Disfrútenlo 🐾");

    }


    return { lista, estado };

}


async function buscarCiudad(nombre) {


    const respuesta = await fetch(
        "https://geocoding-api.open-meteo.com/v1/search?count=1&language=es&name=" +
        encodeURIComponent(nombre)
    );

    const datos = await respuesta.json();


    return datos.results?.[0] || MEDELLIN;

}


async function mostrarClima() {


    const contenido = document.getElementById("climaContenido");


    try {

        const ciudadUsuario = obtenerUsuario()?.ciudad || "Medellín";

        const ciudad = await buscarCiudad(ciudadUsuario);


        const parametros = new URLSearchParams({
            latitude: ciudad.latitude,
            longitude: ciudad.longitude,
            current: "temperature_2m,apparent_temperature,precipitation,weather_code,is_day",
            daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max",
            forecast_days: 1,
            timezone: "auto"
        });


        const respuesta = await fetch("https://api.open-meteo.com/v1/forecast?" + parametros);

        const datos = await respuesta.json();

        const actual = datos.current;

        const dia = datos.daily;


        const clima = describirClima(actual.weather_code, actual.is_day);

        const { lista, estado } = recomendaciones(actual, dia);


        const estados = {
            ideal: { texto: "Ideal para pasear", clase: "green" },
            precaucion: { texto: "Con precaución", clase: "orange" },
            casa: { texto: "Mejor en casa", clase: "red" }
        };


        const badge = document.getElementById("climaEstado");

        badge.textContent = estados[estado].texto;

        badge.className = `weather-badge ${estados[estado].clase}`;


        contenido.innerHTML = `
            <div class="weather-now">

                <span class="weather-emoji">${clima.emoji}</span>

                <div>
                    <strong>${Math.round(actual.temperature_2m)}°C</strong>
                    <span>${clima.texto} · ${escaparHTML(ciudad.name || ciudad.nombre)}</span>
                </div>

            </div>

            <div class="weather-data">
                <span><i class="bi bi-thermometer-half"></i> Sensación ${Math.round(actual.apparent_temperature)}°</span>
                <span><i class="bi bi-arrow-down-up"></i> ${Math.round(dia.temperature_2m_min[0])}° / ${Math.round(dia.temperature_2m_max[0])}°</span>
                <span><i class="bi bi-umbrella"></i> Lluvia ${dia.precipitation_probability_max[0] ?? 0}%</span>
            </div>

            <ul class="weather-tips">
                ${lista.map(t => `<li>${t}</li>`).join("")}
            </ul>
        `;

    } catch {

        contenido.innerHTML =
            '<span class="text-muted small">No se pudo consultar el clima en este momento.</span>';

    }

}


// =========================================
// RUTINA DE HOY (se guarda en este navegador)
// =========================================

const tareasRutina = [
    { id: "agua", texto: "Agua fresca", emoji: "💧" },
    { id: "comida", texto: "Comida a sus horas", emoji: "🍽️" },
    { id: "paseo", texto: "Paseo o ejercicio", emoji: "🦮" },
    { id: "juego", texto: "Tiempo de juego", emoji: "🎾" },
    { id: "limpieza", texto: "Limpiar cama o arenero", emoji: "🧹" },
    { id: "carino", texto: "Mimos y cariño", emoji: "❤️" }
];


function claveRutina() {

    const usuario = obtenerUsuario();

    return `petcare_rutina_${usuario?.id || "x"}_${new Date().toLocaleDateString("en-CA")}`;

}


function leerRutina() {

    try {

        return JSON.parse(localStorage.getItem(claveRutina())) || [];

    } catch {

        return [];

    }

}


function guardarRutina(hechas) {

    try {

        localStorage.setItem(claveRutina(), JSON.stringify(hechas));

    } catch {

        // Si el navegador no deja guardar, la lista igual funciona mientras la página esté abierta
    }

}


function mostrarRutina() {


    const hechas = leerRutina();


    document.getElementById("rutina").innerHTML = tareasRutina.map(tarea => `
        <label class="routine-item ${hechas.includes(tarea.id) ? "done" : ""}">
            <input type="checkbox" value="${tarea.id}" ${hechas.includes(tarea.id) ? "checked" : ""}>
            <span class="routine-emoji">${tarea.emoji}</span>
            <span>${tarea.texto}</span>
        </label>
    `).join("");


    actualizarProgreso(hechas.length);

}


function actualizarProgreso(cantidad) {


    const total = tareasRutina.length;


    document.getElementById("rutinaConteo").textContent =
        cantidad === total ? "¡Completa! 🎉" : `${cantidad} de ${total}`;

    document.getElementById("rutinaBarra").style.width =
        `${Math.round((cantidad / total) * 100)}%`;

}


document.getElementById("rutina").addEventListener("change", event => {


    const hechas = [...document.querySelectorAll("#rutina input:checked")]
        .map(input => input.value);


    event.target.closest(".routine-item").classList.toggle("done", event.target.checked);

    guardarRutina(hechas);

    actualizarProgreso(hechas.length);

});


// =========================================
// ¿SABÍAS QUE?
// =========================================

const datosCuriosos = [
    { emoji: "👃", texto: "Los perros tienen cerca de 300 millones de receptores olfativos. Las personas tenemos alrededor de 6 millones." },
    { emoji: "🐾", texto: "La huella de la nariz de cada perro es única, como nuestras huellas digitales." },
    { emoji: "😴", texto: "Un gato adulto duerme entre 12 y 16 horas al día." },
    { emoji: "🍬", texto: "Los gatos no pueden sentir el sabor dulce: no tienen los receptores para detectarlo." },
    { emoji: "🧼", texto: "Los gatos pasan entre el 30 % y el 50 % del día acicalándose." },
    { emoji: "🗣️", texto: "Un perro promedio puede aprender a reconocer unas 165 palabras y gestos." },
    { emoji: "🐰", texto: "Cuando un conejo está feliz da saltos y giros en el aire llamados \"binkies\"." },
    { emoji: "🍫", texto: "El chocolate, las uvas, la cebolla y el xilitol son tóxicos para los perros." },
    { emoji: "🌡️", texto: "Los perros casi no sudan: se refrescan jadeando y por las almohadillas de sus patas." },
    { emoji: "🦜", texto: "Algunas especies grandes de loros pueden vivir más de 50 años." }
];


let indiceDato = new Date().getDate() % datosCuriosos.length;


function mostrarDato() {

    const dato = datosCuriosos[indiceDato];

    document.getElementById("datoEmoji").textContent = dato.emoji;

    document.getElementById("datoTexto").textContent = dato.texto;

}


document.getElementById("otroDato").addEventListener("click", () => {

    indiceDato = (indiceDato + 1) % datosCuriosos.length;

    mostrarDato();

});


// =========================================
// CARGAR TODO
// =========================================

async function cargarInicio() {


    try {

        const datos = await peticion("/inicio");


        document.getElementById("mensajeBienvenida").textContent =
            datos.mascotas.length === 0
                ? "Empieza registrando a tu primera mascota."
                : datos.mascotas.length === 1
                    ? "Así va el cuidado de tu mascota hoy."
                    : `Así va el cuidado de tus ${datos.mascotas.length} mascotas hoy.`;


        const eventos = armarEventos(datos);

        mostrarSemana(eventos);

        mostrarEventos(eventos);

        mostrarConsejo(datos.consejo);

    } catch (error) {

        const aviso = document.getElementById("mensaje");

        aviso.textContent = error.message;

        aviso.classList.remove("d-none");

        mostrarSemana([]);

        document.getElementById("eventos").innerHTML = "";

    }

}


mostrarSaludo();

mostrarRutina();

mostrarDato();

mostrarClima();

cargarInicio();
