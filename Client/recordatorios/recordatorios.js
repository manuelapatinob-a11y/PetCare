// =========================================
// PETCARE - RECORDATORIOS
// Usa ../auth/sesion.js (peticion, urlFoto)
// =========================================


const TIPOS = {
    otro: { texto: "General", icono: "bi-alarm", color: "purple" },
    cita: { texto: "Cita", icono: "bi-calendar-check", color: "blue" },
    vacuna: { texto: "Vacuna", icono: "bi-shield-plus", color: "green" },
    desparasitacion: { texto: "Desparasitación", icono: "bi-bug", color: "orange" },
    medicamento: { texto: "Medicamento", icono: "bi-capsule", color: "purple" },
    comida: { texto: "Comida", icono: "bi-cup-hot", color: "orange" },
    paseo: { texto: "Paseo", icono: "bi-person-walking", color: "green" },
    entrenamiento: { texto: "Entrenamiento", icono: "bi-trophy", color: "blue" }
};

const REPETICION = { diaria: "Todos los días", semanal: "Cada semana", mensual: "Cada mes", anual: "Cada año" };

const EMOJI = { Perro: "🐶", Gato: "🐱", Ave: "🐦", Conejo: "🐰", Otro: "🐾" };


let datos = null;

let filtroMascota = "todas";

let vista = "pendientes";

let editando = null;


// =========================================
// AYUDAS
// =========================================

function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto ?? "";

    return div.innerHTML;

}


function dia(fecha) {

    return fecha.toLocaleDateString("en-CA");

}


function sumarDias(dias) {

    const fecha = new Date();

    fecha.setDate(fecha.getDate() + dias);

    return dia(fecha);

}


// "2026-10-09T08:30:00" -> Date local
function aFecha(texto) {

    return new Date(texto.length === 10 ? `${texto}T00:00:00` : texto);

}


function hora(texto) {

    return aFecha(texto).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

}


// Nombre del día para agrupar: "Vencidos", "Hoy", "Mañana", "Lunes 13 de oct."
function nombreDia(fechaTexto, completado) {

    const d = fechaTexto.slice(0, 10);

    if (!completado && aFecha(fechaTexto) < new Date() && d < dia(new Date())) {

        return "Vencidos";

    }

    if (d === dia(new Date())) return "Hoy";

    if (d === sumarDias(1)) return "Mañana";

    if (d === sumarDias(-1)) return "Ayer";

    const texto = aFecha(d).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" });

    return texto[0].toUpperCase() + texto.slice(1);

}


function mostrarAviso(texto, tipo = "danger") {

    const aviso = document.getElementById("mensaje");

    aviso.className = `alert alert-${tipo}`;

    aviso.textContent = texto;

    if (tipo === "success") {

        setTimeout(() => aviso.classList.add("d-none"), 3000);

    }

}


function deLaMascota(lista) {

    return filtroMascota === "todas"
        ? lista
        : lista.filter(r => String(r.id_mascota) === filtroMascota);

}


// =========================================
// RESUMEN
// =========================================

function dibujarResumen() {


    const lista = deLaMascota(datos.recordatorios);

    const pendientes = lista.filter(r => !r.completado);

    const ahora = new Date();

    const hoy = dia(ahora);

    const vencidos = pendientes.filter(r => aFecha(r.fecha_hora) < ahora).length;

    const deHoy = pendientes.filter(r => r.fecha_hora.slice(0, 10) === hoy).length;

    const semana = pendientes.filter(r => r.fecha_hora.slice(0, 10) >= hoy && r.fecha_hora.slice(0, 10) <= sumarDias(7)).length;

    const saludProximos = deLaMascota(datos.salud).filter(s => s.fecha_hora.slice(0, 10) >= hoy && s.fecha_hora.slice(0, 10) <= sumarDias(7)).length;


    const tile = (icono, color, etiqueta, valor, nota) => `
        <div class="reminder-kpi">
            <span class="record-icon ${color}"><i class="bi ${icono}"></i></span>
            <div>
                <strong>${valor}</strong>
                <span>${etiqueta}</span>
                ${nota ? `<small>${nota}</small>` : ""}
            </div>
        </div>
    `;


    document.getElementById("resumen").innerHTML =
        tile("bi-sun", "purple", "Para hoy", deHoy) +
        tile("bi-calendar-week", "blue", "Próximos 7 días", semana) +
        tile("bi-heart-pulse", "green", "De Salud esta semana", saludProximos) +
        tile("bi-exclamation-circle", vencidos ? "red" : "gray", "Vencidos", vencidos, vencidos ? "Márcalos o cámbiales la fecha" : "");

}


// =========================================
// FILTRO POR MASCOTA
// =========================================

function dibujarFiltro() {


    const chip = (valor, foto, nombre) => `
        <button type="button" class="pet-chip ${filtroMascota === valor ? "active" : ""}" data-filtro="${valor}">
            <span class="pet-chip-photo">${foto}</span>
            ${escaparHTML(nombre)}
        </button>
    `;


    document.getElementById("filtroMascotas").innerHTML =
        chip("todas", "📋", "Todas") +
        datos.mascotas.map(m => {
            const foto = urlFoto(m.foto);
            return chip(String(m.id_mascota), foto ? `<img src="${escaparHTML(foto)}" alt="">` : EMOJI[m.especie] || "🐾", m.nombre);
        }).join("");

}


// =========================================
// LISTA DE RECORDATORIOS
// =========================================

function recordatoriosDeLaVista() {


    const lista = deLaMascota(datos.recordatorios);

    const hoy = dia(new Date());


    if (vista === "completados") {

        return lista.filter(r => r.completado)
            .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora));

    }


    const pendientes = lista.filter(r => !r.completado);


    if (vista === "hoy") {

        return pendientes.filter(r => r.fecha_hora.slice(0, 10) <= hoy);

    }

    if (vista === "semana") {

        return pendientes.filter(r => r.fecha_hora.slice(0, 10) >= hoy && r.fecha_hora.slice(0, 10) <= sumarDias(7));

    }

    return pendientes;

}


function tarjeta(r) {


    const tipo = TIPOS[r.tipo] || TIPOS.otro;

    const vencido = !r.completado && aFecha(r.fecha_hora) < new Date();


    return `
        <article class="record reminder ${r.completado ? "done" : ""} ${vencido ? "late" : ""}">

            <button type="button" class="check" title="${r.completado ? "Volver a pendiente" : r.repeticion !== "ninguna" ? "Hecho (pasa a la próxima vez)" : "Marcar como hecho"}"
                    data-${r.completado ? "reabrir" : "completar"}="${r.id_recordatorio}" aria-label="${r.completado ? "Volver a pendiente" : "Marcar como hecho"}">
                <i class="bi ${r.completado ? "bi-arrow-counterclockwise" : "bi-check-lg"}"></i>
            </button>

            <div class="record-icon ${tipo.color}"><i class="bi ${tipo.icono}"></i></div>

            <div class="record-body">
                <div class="record-top">
                    <strong>${escaparHTML(r.titulo)}</strong>
                    <span class="record-value">${hora(r.fecha_hora)}</span>
                </div>
                ${r.descripcion ? `<p>${escaparHTML(r.descripcion)}</p>` : ""}
                <div class="badges">
                    ${r.mascota ? `<span class="badge-soft purple">${escaparHTML(r.mascota)}</span>` : '<span class="badge-soft gray">General</span>'}
                    <span class="badge-soft ${tipo.color}">${tipo.texto}</span>
                    ${r.repeticion !== "ninguna" ? `<span class="badge-soft blue"><i class="bi bi-arrow-repeat"></i> ${REPETICION[r.repeticion]}</span>` : ""}
                    ${vencido ? '<span class="badge-soft red">Vencido</span>' : ""}
                    ${r.automatico ? '<span class="badge-soft gray">Creado por PetCare</span>' : ""}
                </div>
            </div>

            <div class="record-actions">
                <button type="button" title="Editar" data-editar="${r.id_recordatorio}"><i class="bi bi-pencil"></i></button>
                <button type="button" title="Eliminar" class="danger" data-eliminar="${r.id_recordatorio}"><i class="bi bi-trash"></i></button>
            </div>

        </article>
    `;

}


function dibujarLista() {


    const lista = recordatoriosDeLaVista();


    if (!lista.length) {

        const vacio = {
            pendientes: "No tienes recordatorios pendientes. Toca \"Nuevo recordatorio\" para crear uno.",
            hoy: "Nada pendiente para hoy. 🎉",
            semana: "No hay recordatorios en los próximos 7 días.",
            completados: "Aún no has completado recordatorios."
        }[vista];

        document.getElementById("lista").innerHTML = `<p class="records-empty">${vacio}</p>`;

        return;

    }


    // Agrupados por día
    const grupos = [];

    lista.forEach(r => {

        const nombre = nombreDia(r.fecha_hora, r.completado);

        const grupo = grupos.find(g => g.nombre === nombre);

        grupo ? grupo.items.push(r) : grupos.push({ nombre, items: [r] });

    });


    document.getElementById("lista").innerHTML = grupos.map(g => `
        <h6 class="day-title ${g.nombre === "Vencidos" ? "late" : ""}">${g.nombre}</h6>
        <div class="records">${g.items.map(tarjeta).join("")}</div>
    `).join("");

}


// =========================================
// LO QUE VIENE DE SALUD
// =========================================

function dibujarSalud() {


    const hoy = dia(new Date());

    const lista = deLaMascota(datos.salud);


    if (!lista.length) {

        document.getElementById("salud").innerHTML =
            '<p class="records-empty">No hay vacunas, citas ni medicamentos próximos.</p>';

        return;

    }


    document.getElementById("salud").innerHTML = `
        <div class="health-feed">
            ${lista.map(s => {
                const tipo = TIPOS[s.tipo];
                const fecha = s.fecha_hora.slice(0, 10);
                const atrasada = fecha < hoy && s.tipo !== "medicamento";
                const cuando = s.tipo === "medicamento"
                    ? "En curso"
                    : fecha === hoy ? "Hoy" : fecha === sumarDias(1) ? "Mañana"
                    : aFecha(fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short" });

                return `
                    <a class="feed-item" href="../salud/salud.html?mascota=${s.id_mascota}">
                        <span class="record-icon ${tipo.color}"><i class="bi ${tipo.icono}"></i></span>
                        <span class="feed-body">
                            <strong>${escaparHTML(s.titulo)}</strong>
                            <small>${escaparHTML(s.mascota)}${s.descripcion ? ` · ${escaparHTML(s.descripcion)}` : ""}</small>
                        </span>
                        <span class="feed-when ${atrasada ? "late" : ""}">
                            ${atrasada ? "Atrasada · " : ""}${cuando}${s.tipo === "cita" ? `<br><small>${hora(s.fecha_hora)}</small>` : ""}
                        </span>
                    </a>
                `;
            }).join("")}
        </div>
    `;

}


function dibujarTodo() {

    dibujarResumen();

    dibujarFiltro();

    dibujarLista();

    dibujarSalud();

}


async function cargar() {

    try {

        datos = await peticion("/recordatorios");

        dibujarTodo();

    } catch (e) {

        document.getElementById("resumen").innerHTML = "";

        mostrarAviso(e.message);

    }

}


// =========================================
// FORMULARIO
// =========================================

const modal = () => bootstrap.Modal.getOrCreateInstance(document.getElementById("modalRecordatorio"));


function abrirFormulario(recordatorio = null) {


    editando = recordatorio;

    const formulario = document.getElementById("formRecordatorio");

    formulario.reset();

    document.getElementById("errorRecordatorio").classList.add("d-none");


    document.getElementById("campoTipo").innerHTML = Object.entries(TIPOS)
        .map(([valor, t]) => `<option value="${valor}">${t.texto}</option>`).join("");

    document.getElementById("campoMascota").innerHTML = '<option value="">General (todas)</option>' +
        datos.mascotas.map(m => `<option value="${m.id_mascota}">${escaparHTML(m.nombre)}</option>`).join("");


    if (recordatorio) {

        document.getElementById("campoTitulo").value = recordatorio.titulo;

        document.getElementById("campoTipo").value = recordatorio.tipo;

        document.getElementById("campoMascota").value = recordatorio.id_mascota ?? "";

        document.getElementById("campoRepeticion").value = recordatorio.repeticion;

        document.getElementById("campoFecha").value = recordatorio.fecha_hora.slice(0, 10);

        document.getElementById("campoHora").value = recordatorio.fecha_hora.slice(11, 16);

        document.getElementById("campoDescripcion").value = recordatorio.descripcion || "";

    } else {

        // Por defecto: dentro de una hora, para la mascota que se está viendo
        const enUnaHora = new Date(Date.now() + 60 * 60 * 1000);

        document.getElementById("campoTipo").value = "otro";

        document.getElementById("campoMascota").value = filtroMascota === "todas" ? "" : filtroMascota;

        document.getElementById("campoFecha").value = dia(enUnaHora);

        document.getElementById("campoHora").value = `${String(enUnaHora.getHours()).padStart(2, "0")}:00`;

    }


    document.getElementById("ideasRapidas").classList.toggle("d-none", Boolean(recordatorio));

    document.getElementById("tituloModal").textContent = recordatorio ? "Editar recordatorio" : "Nuevo recordatorio";

    modal().show();

}


document.getElementById("formRecordatorio").addEventListener("submit", async event => {


    event.preventDefault();

    const error = document.getElementById("errorRecordatorio");

    error.classList.add("d-none");


    const titulo = document.getElementById("campoTitulo").value.trim();

    const fecha = document.getElementById("campoFecha").value;

    const horaElegida = document.getElementById("campoHora").value;


    if (!titulo || !fecha || !horaElegida) {

        error.textContent = "Completa qué hay que recordar, la fecha y la hora.";

        error.classList.remove("d-none");

        return;

    }


    const formulario = new FormData(event.target);

    formulario.append("fecha_hora", `${fecha}T${horaElegida}`);


    const boton = document.getElementById("botonGuardar");

    boton.disabled = true;


    try {

        const respuesta = await peticion(editando ? `/recordatorios/${editando.id_recordatorio}` : "/recordatorios", {
            method: editando ? "PUT" : "POST",
            body: formulario
        });

        modal().hide();

        await cargar();

        mostrarAviso(respuesta.message, "success");

    } catch (e) {

        error.textContent = e.message;

        error.classList.remove("d-none");

    } finally {

        boton.disabled = false;

    }

});


// =========================================
// EVENTOS
// =========================================

document.getElementById("botonNuevo").addEventListener("click", () => abrirFormulario());


document.getElementById("vistas").addEventListener("click", event => {

    const boton = event.target.closest("[data-vista]");

    if (!boton) return;

    vista = boton.dataset.vista;

    document.querySelectorAll("#vistas button").forEach(b => b.classList.toggle("active", b === boton));

    dibujarLista();

});


document.addEventListener("click", async event => {


    const filtro = event.target.closest("[data-filtro]");

    const completar = event.target.closest("[data-completar]");

    const reabrir = event.target.closest("[data-reabrir]");

    const editar = event.target.closest("[data-editar]");

    const eliminar = event.target.closest("[data-eliminar]");

    const rapido = event.target.closest("[data-rapido]");


    if (filtro) {

        filtroMascota = filtro.dataset.filtro;

        dibujarTodo();

    } else if (rapido) {

        const [tipo, titulo] = rapido.dataset.rapido.split("|");

        document.getElementById("campoTipo").value = tipo;

        document.getElementById("campoTitulo").value = titulo;

    } else if (completar || reabrir) {

        const id = (completar || reabrir).dataset.completar || (completar || reabrir).dataset.reabrir;

        try {

            const respuesta = await peticion(`/recordatorios/${id}/${completar ? "completar" : "reabrir"}`, { method: "PUT" });

            await cargar();

            mostrarAviso(respuesta.message, "success");

        } catch (e) {

            mostrarAviso(e.message);

        }

    } else if (editar) {

        abrirFormulario(datos.recordatorios.find(r => r.id_recordatorio === Number(editar.dataset.editar)));

    } else if (eliminar) {

        if (!confirm("¿Eliminar este recordatorio?")) return;

        try {

            const respuesta = await peticion(`/recordatorios/${eliminar.dataset.eliminar}`, { method: "DELETE" });

            await cargar();

            mostrarAviso(respuesta.message, "success");

        } catch (e) {

            mostrarAviso(e.message);

        }

    }

});


cargar();
