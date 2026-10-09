// =========================================
// PETCARE - MOTOR COMÚN DE LOS APARTADOS POR MASCOTA
// (Salud, Alimentación...). Usa ../auth/sesion.js
//
// Cada página define sus LISTAS y FORMULARIOS y llama a:
//   iniciarApartado({
//       ruta: "/salud",                 // ruta del backend
//       listas: LISTAS,                 // qué se muestra en cada lista
//       formularios: FORMULARIOS,       // campos de cada tipo de registro
//       ids: ID_RECURSO,                // columna id de cada recurso
//       alDibujar: () => {...},         // dibujos propios de la página
//       verDetalle: (id) => {...}       // opcional: botón 👁 de una lista
//   });
//
// La página necesita estos elementos: #mensaje, #selectorMascotas,
// #sinMascotas, #contenidoApartado, .health-tabs, .tab-panel,
// [data-lista], #modalRegistro, #formRegistro, #camposRegistro,
// #tituloRegistro, #errorRegistro, #botonGuardarRegistro
// =========================================

let mascotas = [];

let idMascota = null;

let ficha = null;

let edicion = null;          // { lista, registro } cuando se edita

let apartado = null;         // configuración de la página

let alGuardarFormulario = null;  // acción opcional después de guardar el formulario abierto


const emojiEspecie = { Perro: "🐶", Gato: "🐱", Ave: "🐦", Conejo: "🐰", Otro: "🐾" };


// =========================================
// AYUDAS
// =========================================

function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto ?? "";

    return div.innerHTML;

}


function opciones(mapa) {

    return Object.entries(mapa);

}


function hoyTexto() {

    return new Date().toLocaleDateString("en-CA");

}


function ahoraTexto() {

    const ahora = new Date();

    return `${hoyTexto()}T${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;

}


function aFecha(texto) {

    const [anio, mes, dia] = texto.slice(0, 10).split("-").map(Number);

    return new Date(anio, mes - 1, dia);

}


function fechaCorta(texto) {

    if (!texto) {

        return "";

    }

    return aFecha(texto).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

}


function fechaHora(texto) {

    if (!texto) {

        return "";

    }

    return new Date(texto).toLocaleString("es-CO", {
        day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"
    });

}


// "08:30:00" -> "8:30 a. m."
function horaCorta(texto) {

    if (!texto) {

        return "";

    }

    const [h, m] = texto.split(":").map(Number);

    return new Date(2000, 0, 1, h, m).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

}


function dinero(valor) {

    return Number(valor || 0).toLocaleString("es-CO", {
        style: "currency", currency: "COP", maximumFractionDigits: 0
    });

}


function numero(valor) {

    return Number(valor).toLocaleString("es-CO", { maximumFractionDigits: 2 });

}


function calcularEdad(fecha) {


    if (!fecha) {

        return null;

    }


    const nacimiento = aFecha(fecha);

    const hoy = new Date();

    let meses = (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + (hoy.getMonth() - nacimiento.getMonth());

    if (hoy.getDate() < nacimiento.getDate()) {

        meses--;

    }


    if (meses < 12) {

        return `${Math.max(meses, 0)} ${meses === 1 ? "mes" : "meses"}`;

    }

    const anios = Math.floor(meses / 12);

    return `${anios} ${anios === 1 ? "año" : "años"}`;

}


// Una línea con formato HTML (los datos del usuario dentro van escapados)
function H(html) {

    return { html };

}


function badge(texto, color = "gray") {

    return texto ? `<span class="badge-soft ${color}">${escaparHTML(texto)}</span>` : "";

}


function badgeOrigen(origen) {

    return origen === "veterinario"
        ? badge("Informe veterinario", "blue")
        : badge("Observación del dueño", "gray");

}


function mostrarAviso(texto, tipo = "danger") {


    const aviso = document.getElementById("mensaje");

    aviso.className = `alert alert-${tipo}`;

    aviso.textContent = texto;


    if (tipo === "success") {

        setTimeout(() => aviso.classList.add("d-none"), 3000);

    }

}


function idDe(recurso) {

    return apartado.ids[recurso];

}


// =========================================
// DIBUJAR LISTAS
// =========================================

function dibujarLista(clave) {


    const lista = apartado.listas[clave];

    const contenedor = document.querySelector(`[data-lista="${clave}"]`);

    // Listas sin contenedor: la página las dibuja a su manera (solo usan el formulario)
    if (!contenedor) {

        return;

    }

    const registros = lista.datos();


    const tarjetas = registros.map((registro, i) => {


        const t = lista.tarjeta(registro, i, registros);

        const id = registro[idDe(lista.recurso)];


        return `
            <article class="record">

                ${t.miniatura || `<div class="record-icon ${t.color || lista.color}"><i class="bi ${t.icono || lista.icono}"></i></div>`}

                <div class="record-body">
                    <div class="record-top">
                        <strong>${escaparHTML(t.titulo)}</strong>
                        ${t.valor ? `<span class="record-value">${t.valor}</span>` : ""}
                    </div>
                    <span class="record-sub">${escaparHTML(t.subtitulo)}</span>
                    ${t.lineas.filter(Boolean).map(l => `<p>${typeof l === "object" ? l.html : escaparHTML(l)}</p>`).join("")}
                    <div class="badges">${t.badges.filter(Boolean).join("")}</div>
                </div>

                <div class="record-actions">
                    ${lista.verDetalle ? `<button type="button" title="Ver detalle" data-ver="${id}"><i class="bi bi-eye"></i></button>` : ""}
                    <button type="button" title="Editar" data-editar="${clave}" data-id="${id}"><i class="bi bi-pencil"></i></button>
                    <button type="button" title="Eliminar" class="danger" data-eliminar="${clave}" data-id="${id}"><i class="bi bi-trash"></i></button>
                </div>

            </article>
        `;

    }).join("");


    contenedor.innerHTML = `
        <div class="panel-box">

            <div class="list-header">
                <div>
                    <h3><i class="bi ${lista.icono}"></i> ${lista.titulo}</h3>
                    <p>${lista.descripcion}${lista.resumen && registros.length ? " · " + lista.resumen(registros) : ""}</p>
                </div>

                <button type="button" class="btn-add-small" data-agregar="${clave}">
                    <i class="bi bi-plus-lg"></i>
                    <span>${lista.boton}</span>
                </button>
            </div>

            <div class="records">
                ${tarjetas || `<p class="records-empty">${lista.vacio}</p>`}
            </div>

        </div>
    `;

}


function dibujarTodo() {

    apartado.alDibujar?.();

    Object.keys(apartado.listas).forEach(dibujarLista);

}


// =========================================
// FORMULARIO GENERAL (agregar y editar)
// Tipos de campo: text, textarea, date, datetime, time, select, number, switch, file, hidden
// =========================================

function campoHTML(campo, valor) {


    if (campo.seccion) {

        return `
            <div class="col-12">
                <h6 class="form-section">${campo.seccion}</h6>
                ${campo.ayuda ? `<small class="form-help">${campo.ayuda}</small>` : ""}
            </div>
        `;

    }


    const id = `campo_${campo.nombre}`;

    const req = campo.requerido ? "required" : "";

    const etiqueta = `<label for="${id}">${campo.etiqueta}${campo.requerido ? " *" : ""}</label>`;

    const ayuda = campo.ayuda ? `<small class="form-help">${campo.ayuda}</small>` : "";

    const v = escaparHTML(valor ?? "");

    let control;


    switch (campo.tipo) {

        case "hidden":
            return `<input type="hidden" name="${campo.nombre}" value="${v}">`;

        case "textarea":
            control = `<textarea id="${id}" name="${campo.nombre}" class="form-control" rows="2" ${req}>${v}</textarea>`;
            break;

        case "select":
            control = `<select id="${id}" name="${campo.nombre}" class="form-select" ${req}>
                ${campo.opciones.map(([valorOpcion, texto]) =>
                    `<option value="${escaparHTML(valorOpcion)}" ${String(valorOpcion) === String(valor ?? "") ? "selected" : ""}>${escaparHTML(texto)}</option>`
                ).join("")}
            </select>`;
            break;

        case "switch":
            return `
                <div class="col-12">
                    <div class="form-check form-switch switch-box">
                        <input class="form-check-input" type="checkbox" role="switch" id="${id}" name="${campo.nombre}" value="1" ${valor ? "checked" : ""}>
                        <label class="form-check-label" for="${id}">${campo.etiqueta}</label>
                    </div>
                </div>
            `;

        case "file":
            control = `<input type="file" id="${id}" name="${campo.nombre}" class="form-control" accept="${campo.aceptar}" ${edicion ? "" : req}>
                ${edicion && valor ? `<small class="form-help">Archivo actual: <a href="${escaparHTML(urlFoto(valor))}" target="_blank" rel="noopener">ver</a>. Sube otro solo si quieres reemplazarlo.</small>` : ""}`;
            break;

        default: {
            const tipo = { date: "date", datetime: "datetime-local", time: "time", number: "number" }[campo.tipo] || "text";
            const extra = [
                campo.max && tipo === "text" ? `maxlength="${campo.max}"` : "",
                campo.min !== undefined ? `min="${campo.min}"` : "",
                campo.max && tipo === "number" ? `max="${campo.max}"` : "",
                campo.step ? `step="${campo.step}"` : "",
                campo.placeholder ? `placeholder="${escaparHTML(campo.placeholder)}"` : ""
            ].join(" ");
            control = `<input type="${tipo}" id="${id}" name="${campo.nombre}" class="form-control" value="${v}" ${extra} ${req}>`;
        }
    }


    const condicion = campo.mostrarSi
        ? `data-mostrar-si="${campo.mostrarSi.campo}" data-valor="${campo.mostrarSi.valor}"`
        : "";

    return `<div class="col-md-${campo.col || 12}" ${condicion}>${etiqueta}${control}${ayuda}</div>`;

}


// Campos que solo aparecen según otro campo
// (por ejemplo "¿Qué tipo de cita es?" solo cuando el tipo es "Otro")
function activarCamposCondicionales() {


    document.querySelectorAll("#camposRegistro [data-mostrar-si]").forEach(contenedor => {


        const control = document.querySelector(`#camposRegistro [name="${contenedor.dataset.mostrarSi}"]`);

        const input = contenedor.querySelector("input, select, textarea");


        const actualizar = () => {

            const visible = control.value === contenedor.dataset.valor;

            contenedor.classList.toggle("d-none", !visible);

            // Oculto no es obligatorio y no se envía
            input.required = visible;

            input.disabled = !visible;

        };


        control.addEventListener("change", actualizar);

        actualizar();

    });

}


// opciones.valores: valores para llenar el formulario nuevo (por ejemplo desde una idea de la IA)
// opciones.alGuardar(respuesta): se ejecuta después de guardar
function abrirFormulario(claveLista, registro = null, opciones = {}) {


    const lista = apartado.listas[claveLista];

    edicion = registro ? { lista: claveLista, registro } : null;

    alGuardarFormulario = opciones.alGuardar || null;

    const campos = apartado.formularios[lista.recurso](lista);


    const valorDe = campo => {

        if (registro) {

            // El campo puede decir cómo sacar su valor del registro
            if (campo.valor) {

                return campo.valor(registro);

            }

            const valor = registro[campo.nombre];

            if (valor && campo.tipo === "datetime") {

                return valor.slice(0, 16);

            }

            if (valor && campo.tipo === "date") {

                return valor.slice(0, 10);

            }

            if (valor && campo.tipo === "time") {

                return valor.slice(0, 5);

            }

            return valor;

        }

        if (opciones.valores?.[campo.nombre] !== undefined) {

            return opciones.valores[campo.nombre];

        }

        if (lista.defectos?.[campo.nombre] !== undefined) {

            return lista.defectos[campo.nombre];

        }

        return typeof campo.defecto === "function" ? campo.defecto() : campo.defecto;

    };


    document.getElementById("camposRegistro").innerHTML =
        `<div class="row g-3">${campos.map(c => campoHTML(c, valorDe(c))).join("")}</div>`;


    activarCamposCondicionales();


    const nombreSingular = lista.boton.replace(/^(Agregar|Registrar|Programar|Subir|Crear|Anotar)\s+/i, "");

    document.getElementById("tituloRegistro").innerHTML =
        `<i class="bi ${lista.icono}"></i> ${registro ? "Editar" : lista.boton.split(" ")[0]} ${nombreSingular}`;


    document.getElementById("errorRegistro").classList.add("d-none");

    document.getElementById("formRegistro").dataset.lista = claveLista;


    const mostrar = () =>
        bootstrap.Modal.getOrCreateInstance(document.getElementById("modalRegistro")).show();


    // Si viene desde una ventana de detalle, primero se cierra esa ventana
    const detalle = document.getElementById("modalDetalle");

    if (detalle?.classList.contains("show")) {

        detalle.addEventListener("hidden.bs.modal", mostrar, { once: true });

        bootstrap.Modal.getInstance(detalle).hide();

    } else {

        mostrar();

    }

}


document.getElementById("formRegistro").addEventListener("submit", async event => {


    event.preventDefault();


    const formulario = event.target;

    const lista = apartado.listas[formulario.dataset.lista];

    const error = document.getElementById("errorRegistro");

    error.classList.add("d-none");


    // Campos obligatorios vacíos
    const vacio = [...formulario.querySelectorAll("[required]")].find(c => !c.value.trim());

    if (vacio) {

        const etiqueta = formulario.querySelector(`label[for="${vacio.id}"]`)?.textContent.replace(" *", "");

        error.textContent = `Completa el campo "${etiqueta}".`;

        error.classList.remove("d-none");

        vacio.focus();

        return;

    }


    const datos = new FormData(formulario);


    // No enviar archivos vacíos
    formulario.querySelectorAll('input[type="file"]').forEach(input => {

        if (!input.files.length) {

            datos.delete(input.name);

        }

    });


    const boton = document.getElementById("botonGuardarRegistro");

    boton.disabled = true;

    boton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';


    try {

        const ruta = edicion
            ? `${apartado.ruta}/${idMascota}/${lista.recurso}/${edicion.registro[idDe(lista.recurso)]}`
            : `${apartado.ruta}/${idMascota}/${lista.recurso}`;

        const respuesta = await peticion(ruta, { method: edicion ? "PUT" : "POST", body: datos });


        bootstrap.Modal.getInstance(document.getElementById("modalRegistro")).hide();

        if (alGuardarFormulario) {

            await alGuardarFormulario(respuesta);

            alGuardarFormulario = null;

        }

        await cargarFicha();

        mostrarAviso("Guardado correctamente.", "success");

    } catch (e) {

        error.textContent = e.message;

        error.classList.remove("d-none");

    } finally {

        boton.disabled = false;

        boton.innerHTML = '<i class="bi bi-check-lg"></i> Guardar';

    }

});


async function eliminar(claveLista, id) {


    const lista = apartado.listas[claveLista];


    if (!confirm("¿Seguro que quieres eliminar este registro? No se puede deshacer.")) {

        return;

    }


    try {

        await peticion(`${apartado.ruta}/${idMascota}/${lista.recurso}/${id}`, { method: "DELETE" });

        await cargarFicha();

        mostrarAviso("Registro eliminado.", "success");

    } catch (e) {

        mostrarAviso(e.message);

    }

}


// Botones de agregar, editar, eliminar y ver (en las listas y en los detalles)
document.addEventListener("click", event => {


    const agregar = event.target.closest("[data-agregar]");

    const editar = event.target.closest("[data-editar]");

    const borrar = event.target.closest("[data-eliminar]");

    const ver = event.target.closest("[data-ver]");


    if (agregar) {

        abrirFormulario(agregar.dataset.agregar);

    } else if (editar) {

        const lista = apartado.listas[editar.dataset.editar];

        const id = Number(editar.dataset.id);

        const registro = ficha[lista.recurso].find(r => r[idDe(lista.recurso)] === id);

        abrirFormulario(editar.dataset.editar, registro);

    } else if (borrar) {

        eliminar(borrar.dataset.eliminar, Number(borrar.dataset.id));

    } else if (ver) {

        apartado.verDetalle?.(Number(ver.dataset.ver));

    }

});


// =========================================
// PESTAÑAS
// =========================================

document.querySelector(".health-tabs").addEventListener("click", event => {


    const boton = event.target.closest("[data-tab]");

    if (!boton) {

        return;

    }


    document.querySelectorAll(".health-tabs .tab").forEach(t => t.classList.toggle("active", t === boton));

    document.querySelectorAll(".tab-panel").forEach(panel =>
        panel.classList.toggle("d-none", panel.dataset.panel !== boton.dataset.tab)
    );

});


// =========================================
// ELEGIR MASCOTA Y CARGAR
// =========================================

function dibujarSelector() {


    document.getElementById("selectorMascotas").innerHTML = mascotas.map(m => {

        const foto = urlFoto(m.foto);

        return `
            <button type="button" class="pet-chip ${m.id_mascota === idMascota ? "active" : ""}" data-mascota="${m.id_mascota}">
                <span class="pet-chip-photo">${foto ? `<img src="${escaparHTML(foto)}" alt="">` : emojiEspecie[m.especie] || "🐾"}</span>
                ${escaparHTML(m.nombre)}
            </button>
        `;

    }).join("");

}


document.getElementById("selectorMascotas").addEventListener("click", event => {


    const boton = event.target.closest("[data-mascota]");

    if (!boton) {

        return;

    }


    idMascota = Number(boton.dataset.mascota);

    history.replaceState(null, "", `?mascota=${idMascota}`);

    dibujarSelector();

    cargarFicha();

});


async function cargarFicha() {


    try {

        ficha = await peticion(`${apartado.ruta}/${idMascota}`);

        dibujarTodo();

        document.getElementById("contenidoApartado").classList.remove("d-none");

    } catch (e) {

        mostrarAviso(e.message);

    }

}


async function iniciarApartado(configuracion) {


    apartado = configuracion;


    try {

        mascotas = await peticion("/mascotas");

    } catch (e) {

        document.getElementById("selectorMascotas").innerHTML = "";

        mostrarAviso(e.message);

        return;

    }


    if (mascotas.length === 0) {

        document.getElementById("selectorMascotas").classList.add("d-none");

        document.getElementById("sinMascotas").classList.remove("d-none");

        return;

    }


    // La mascota puede venir en la dirección: salud.html?mascota=5
    const pedida = Number(new URLSearchParams(location.search).get("mascota"));

    idMascota = mascotas.some(m => m.id_mascota === pedida) ? pedida : mascotas[0].id_mascota;


    dibujarSelector();

    cargarFicha();

}
