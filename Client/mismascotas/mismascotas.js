// =========================================
// PETCARE - MIS MASCOTAS
// Usa las funciones de ../auth/sesion.js
// =========================================

const formulario = document.getElementById("formMascota");

const selectEspecie = document.getElementById("id_especie");

const selectRaza = document.getElementById("id_raza");

const inputFoto = document.getElementById("foto");

let mascotas = [];


/*
Emoji y color de fondo para mascotas sin foto
*/

const estiloEspecie = {
    Perro: { emoji: "🐶", clase: "dog" },
    Gato: { emoji: "🐱", clase: "cat" },
    Ave: { emoji: "🐦", clase: "bird" },
    Conejo: { emoji: "🐰", clase: "rabbit" },
    Otro: { emoji: "🐾", clase: "other" }
};


// =========================================
// AYUDAS
// =========================================

function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto ?? "";

    return div.innerHTML;

}


// Edad a partir de la fecha de nacimiento: "4 años", "7 meses"...
function calcularEdad(fecha) {


    if (!fecha) {

        return "Sin dato";

    }


    const nacimiento = new Date(`${fecha}T00:00:00`);

    const hoy = new Date();


    let meses =
        (hoy.getFullYear() - nacimiento.getFullYear()) * 12 +
        (hoy.getMonth() - nacimiento.getMonth());

    if (hoy.getDate() < nacimiento.getDate()) {

        meses--;

    }


    if (meses < 1) {

        const dias = Math.floor((hoy - nacimiento) / 86400000);

        return `${dias} ${dias === 1 ? "día" : "días"}`;

    }


    if (meses < 12) {

        return `${meses} ${meses === 1 ? "mes" : "meses"}`;

    }


    const anios = Math.floor(meses / 12);

    return `${anios} ${anios === 1 ? "año" : "años"}`;

}


function formatearPeso(peso) {

    if (peso === null || peso === undefined) {

        return "Sin dato";

    }

    return `${Number(peso).toLocaleString("es-CO", { maximumFractionDigits: 2 })} kg`;

}


function textoSexo(sexo) {

    return sexo === "hembra" ? "Hembra" : "Macho";

}


function mostrarAviso(texto, tipo = "danger") {


    const aviso = document.getElementById("mensaje");

    aviso.className = `alert alert-${tipo}`;

    aviso.textContent = texto;


    if (tipo === "success") {

        setTimeout(() => aviso.classList.add("d-none"), 3000);

    }

}


// =========================================
// TARJETAS DE MASCOTAS
// =========================================

function fotoMascota(mascota) {


    const foto = urlFoto(mascota.foto);

    const estilo = estiloEspecie[mascota.especie] || estiloEspecie.Otro;


    if (foto) {

        return `<img src="${escaparHTML(foto)}" alt="${escaparHTML(mascota.nombre)}" loading="lazy">`;

    }

    return `<span class="pet-emoji">${estilo.emoji}</span>`;

}


function tarjetaMascota(mascota) {


    const estilo = estiloEspecie[mascota.especie] || estiloEspecie.Otro;

    const iconoSexo =
        mascota.sexo === "hembra" ? "bi-gender-female" : "bi-gender-male";


    return `
        <article class="pet-card" data-id="${mascota.id_mascota}">

            <div class="pet-image ${estilo.clase}">

                ${fotoMascota(mascota)}

                <span class="species-badge">
                    ${estilo.emoji} ${escaparHTML(mascota.especie)}
                </span>

                <div class="dropdown pet-menu">
                    <button
                        class="options"
                        data-bs-toggle="dropdown"
                        aria-label="Opciones">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>

                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <button class="dropdown-item" data-accion="ver">
                                <i class="bi bi-eye"></i> Ver información
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item" data-accion="editar">
                                <i class="bi bi-pencil"></i> Editar ficha
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item text-danger" data-accion="eliminar">
                                <i class="bi bi-trash"></i> Eliminar
                            </button>
                        </li>
                    </ul>
                </div>

            </div>


            <div class="pet-content">

                <div class="pet-heading">
                    <h4>${escaparHTML(mascota.nombre)}</h4>
                    <span>${escaparHTML(mascota.raza || mascota.especie)}</span>
                </div>


                <div class="pet-data">

                    <div>
                        <i class="bi bi-calendar3"></i>
                        <span>Edad</span>
                        <strong>${calcularEdad(mascota.fecha_nacimiento)}</strong>
                    </div>

                    <div>
                        <i class="bi ${iconoSexo}"></i>
                        <span>Sexo</span>
                        <strong>${textoSexo(mascota.sexo)}</strong>
                    </div>

                    <div>
                        <i class="bi bi-speedometer2"></i>
                        <span>Peso</span>
                        <strong>${formatearPeso(mascota.peso_actual)}</strong>
                    </div>

                </div>


                <div class="pet-tags">
                    ${mascota.esterilizado
                        ? '<span class="tag green"><i class="bi bi-shield-check"></i> Esterilizado</span>'
                        : ""}
                    ${mascota.microchip
                        ? '<span class="tag blue"><i class="bi bi-cpu"></i> Microchip</span>'
                        : ""}
                    ${mascota.alergias
                        ? '<span class="tag red"><i class="bi bi-exclamation-triangle"></i> Alergias</span>'
                        : ""}
                </div>


                <div class="pet-actions">

                    <a href="../salud/salud.html?mascota=${mascota.id_mascota}">
                        <i class="bi bi-heart-pulse"></i>
                        Salud
                    </a>

                    <a href="../alimentacion/Alimentacion.html?mascota=${mascota.id_mascota}">
                        <i class="bi bi-cup-hot"></i>
                        Alimentación
                    </a>

                </div>

            </div>

        </article>
    `;

}


function tarjetaAgregar() {

    return `
        <article
            class="add-pet-card"
            data-bs-toggle="modal"
            data-bs-target="#modalMascota">

            <div class="add-icon">
                <i class="bi bi-plus-lg"></i>
            </div>

            <h4>Agregar mascota</h4>

            <p>Registra una nueva mascota en PetCare.</p>

        </article>
    `;

}


function mostrarMascotas() {


    const lista = document.getElementById("listaMascotas");


    if (mascotas.length === 0) {

        lista.innerHTML = `
            <div class="empty-pets">
                <div class="empty-emoji">🐾</div>
                <h4>Aún no tienes mascotas registradas</h4>
                <p>Agrega a tu primer compañero para empezar a cuidarlo con PetCare.</p>
                <button
                    class="btn-add"
                    data-bs-toggle="modal"
                    data-bs-target="#modalMascota">
                    <i class="bi bi-plus-lg"></i>
                    Agregar mi primera mascota
                </button>
            </div>
        `;

    } else {

        lista.innerHTML =
            mascotas.map(tarjetaMascota).join("") + tarjetaAgregar();

    }


    /*
    Resumen
    */

    document.getElementById("totalMascotas").textContent = mascotas.length;

    document.getElementById("totalMachos").textContent =
        mascotas.filter(m => m.sexo === "macho").length;

    document.getElementById("totalHembras").textContent =
        mascotas.filter(m => m.sexo === "hembra").length;

    document.getElementById("totalEsterilizadas").textContent =
        mascotas.filter(m => m.esterilizado).length;

}


async function cargarMascotas() {


    try {

        mascotas = await peticion("/mascotas");

        mostrarMascotas();

    } catch (error) {

        document.getElementById("listaMascotas").innerHTML = "";

        mostrarAviso(error.message);

    }

}


// =========================================
// VER DETALLE Y ELIMINAR
// =========================================

function filaDetalle(icono, titulo, valor) {

    return `
        <div class="detail-row">
            <i class="bi ${icono}"></i>
            <span>${titulo}</span>
            <strong>${escaparHTML(valor || "Sin dato")}</strong>
        </div>
    `;

}


function verDetalle(mascota) {


    const estilo = estiloEspecie[mascota.especie] || estiloEspecie.Otro;

    const nacimiento = mascota.fecha_nacimiento
        ? new Date(`${mascota.fecha_nacimiento}T00:00:00`)
            .toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
        : null;


    document.getElementById("detalleMascota").innerHTML = `

        <div class="detail-header pet-image ${estilo.clase}">
            ${fotoMascota(mascota)}
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>

        <div class="modal-body">

            <h4 class="detail-name">${escaparHTML(mascota.nombre)}</h4>

            <p class="detail-breed">
                ${estilo.emoji} ${escaparHTML(mascota.especie)}
                ${mascota.raza ? "· " + escaparHTML(mascota.raza) : ""}
            </p>

            ${filaDetalle("bi-calendar3", "Edad", calcularEdad(mascota.fecha_nacimiento))}
            ${filaDetalle("bi-cake2", "Nacimiento", nacimiento)}
            ${filaDetalle(mascota.sexo === "hembra" ? "bi-gender-female" : "bi-gender-male", "Sexo", textoSexo(mascota.sexo))}
            ${filaDetalle("bi-speedometer2", "Peso", formatearPeso(mascota.peso_actual))}
            ${filaDetalle("bi-palette", "Color", mascota.color)}
            ${filaDetalle("bi-shield-check", "Esterilizado", mascota.esterilizado ? "Sí" : "No")}
            ${filaDetalle("bi-cpu", "Microchip", mascota.microchip)}
            ${filaDetalle("bi-exclamation-triangle", "Alergias", mascota.alergias)}
            ${filaDetalle("bi-journal-text", "Observaciones", mascota.observaciones)}

            <div class="detail-buttons">
                <button type="button" class="btn-save" data-detalle="editar" data-id="${mascota.id_mascota}">
                    <i class="bi bi-pencil"></i>
                    Editar ficha
                </button>
                <button type="button" class="btn-delete" data-detalle="eliminar" data-id="${mascota.id_mascota}">
                    <i class="bi bi-trash"></i>
                    Eliminar
                </button>
            </div>

        </div>
    `;


    bootstrap.Modal.getOrCreateInstance(
        document.getElementById("modalDetalle")
    ).show();

}


async function eliminarMascota(mascota) {


    if (!confirm(`¿Seguro que quieres eliminar a ${mascota.nombre}? Ya no aparecerá en PetCare.`)) {

        return;

    }


    try {

        await peticion(`/mascotas/${mascota.id_mascota}`, { method: "DELETE" });

        bootstrap.Modal.getInstance(document.getElementById("modalDetalle"))?.hide();

        mascotas = mascotas.filter(m => m.id_mascota !== mascota.id_mascota);

        mostrarMascotas();

        mostrarAviso(`${mascota.nombre} fue eliminado(a).`, "success");

    } catch (error) {

        mostrarAviso(error.message);

    }

}


document.getElementById("listaMascotas").addEventListener("click", event => {


    const tarjeta = event.target.closest(".pet-card");

    if (!tarjeta) {

        return;

    }


    const mascota =
        mascotas.find(m => m.id_mascota === Number(tarjeta.dataset.id));

    const accion = event.target.closest("[data-accion]")?.dataset.accion;


    if (accion === "eliminar") {

        eliminarMascota(mascota);

    } else if (accion === "editar") {

        abrirEdicion(mascota);

    } else if (accion === "ver") {

        verDetalle(mascota);

    } else if (!event.target.closest("a, .pet-menu")) {

        // Clic en cualquier otra parte de la tarjeta
        verDetalle(mascota);

    }

});


// =========================================
// FORMULARIO: ESPECIES Y RAZAS
// =========================================

async function cargarEspecies() {


    try {

        const especies = await peticion("/mascotas/especies");

        selectEspecie.innerHTML =
            '<option value="">Selecciona una especie</option>' +
            especies.map(e => {
                const emoji = (estiloEspecie[e.nombre] || estiloEspecie.Otro).emoji;
                return `<option value="${e.id_especie}">${emoji} ${escaparHTML(e.nombre)}</option>`;
            }).join("");

    } catch (error) {

        selectEspecie.innerHTML = '<option value="">No se pudieron cargar</option>';

    }

}


selectEspecie.addEventListener("change", () => cargarRazas());


// Razas de la especie elegida (al editar se deja marcada la que tenía)
async function cargarRazas(elegida = "") {


    selectRaza.disabled = true;


    if (!selectEspecie.value) {

        selectRaza.innerHTML = '<option value="">Primero elige la especie</option>';

        return;

    }


    selectRaza.innerHTML = '<option value="">Cargando razas...</option>';


    try {

        const razas = await peticion(`/mascotas/razas?especie=${selectEspecie.value}`);

        selectRaza.innerHTML =
            '<option value="">No sé / Sin raza</option>' +
            razas.map(r =>
                `<option value="${r.id_raza}">${escaparHTML(r.nombre)}</option>`
            ).join("");

        selectRaza.value = elegida ? String(elegida) : "";

        selectRaza.disabled = false;

    } catch {

        selectRaza.innerHTML = '<option value="">No se pudieron cargar</option>';

    }

}


// =========================================
// FORMULARIO: EDITAR UNA MASCOTA
// =========================================

let editando = null;


function tituloFormulario(texto, icono) {

    document.getElementById("tituloMascota").innerHTML = `<i class="bi ${icono}"></i> ${escaparHTML(texto)}`;

}


async function abrirEdicion(mascota) {


    editando = mascota;

    bootstrap.Modal.getInstance(document.getElementById("modalDetalle"))?.hide();


    formulario.reset();

    document.getElementById("mensajeFormulario").classList.add("d-none");


    const campos = ["nombre", "fecha_nacimiento", "peso_actual", "color", "microchip", "alergias", "observaciones"];

    campos.forEach(campo => {

        document.getElementById(campo).value = mascota[campo] ?? "";

    });

    document.getElementById(mascota.sexo === "hembra" ? "sexoHembra" : "sexoMacho").checked = true;

    document.getElementById("esterilizado").checked = mascota.esterilizado;

    selectEspecie.value = String(mascota.id_especie);


    // Foto actual
    const vista = document.getElementById("vistaFoto");

    const foto = urlFoto(mascota.foto);

    vista.style.backgroundImage = foto ? `url("${foto}")` : "";

    vista.classList.toggle("has-photo", Boolean(foto));

    document.getElementById("quitarFoto").classList.toggle("d-none", !foto);

    document.getElementById("quitar_foto").checked = false;


    tituloFormulario(`Editar a ${mascota.nombre}`, "bi-pencil");

    document.getElementById("botonGuardar").innerHTML = '<i class="bi bi-check-lg"></i> Guardar cambios';


    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalMascota")).show();

    await cargarRazas(mascota.id_raza);

}


// Botones de la ventana de detalle
document.getElementById("modalDetalle").addEventListener("click", event => {

    const boton = event.target.closest("[data-detalle]");

    if (!boton) {

        return;

    }

    const mascota = mascotas.find(m => m.id_mascota === Number(boton.dataset.id));

    boton.dataset.detalle === "editar" ? abrirEdicion(mascota) : eliminarMascota(mascota);

});


// =========================================
// FORMULARIO: FOTO
// =========================================

function limpiarFoto() {

    const vista = document.getElementById("vistaFoto");

    vista.style.backgroundImage = "";

    vista.classList.remove("has-photo");

}


inputFoto.addEventListener("change", () => {


    const archivo = inputFoto.files[0];


    if (!archivo) {

        limpiarFoto();

        return;

    }


    if (archivo.size > 2 * 1024 * 1024) {

        mostrarErrorFormulario("La foto no puede pesar más de 2 MB.");

        inputFoto.value = "";

        limpiarFoto();

        return;

    }


    const vista = document.getElementById("vistaFoto");

    vista.style.backgroundImage = `url("${URL.createObjectURL(archivo)}")`;

    vista.classList.add("has-photo");

});


// =========================================
// FORMULARIO: GUARDAR
// =========================================

function mostrarErrorFormulario(texto) {

    const aviso = document.getElementById("mensajeFormulario");

    aviso.textContent = texto;

    aviso.classList.remove("d-none");

    aviso.scrollIntoView({ behavior: "smooth", block: "nearest" });

}


// La fecha de nacimiento no puede ser futura
document.getElementById("fecha_nacimiento").max =
    new Date().toLocaleDateString("en-CA");


formulario.addEventListener("submit", async event => {


    event.preventDefault();

    document.getElementById("mensajeFormulario").classList.add("d-none");


    const nombre = document.getElementById("nombre").value.trim();

    const sexo = formulario.querySelector('input[name="sexo"]:checked');


    if (!nombre || !selectEspecie.value || !sexo) {

        mostrarErrorFormulario("Completa el nombre, la especie y el sexo.");

        return;

    }


    const datos = new FormData(formulario);

    if (!inputFoto.files[0]) {

        datos.delete("foto");

    }


    const boton = document.getElementById("botonGuardar");

    boton.disabled = true;

    boton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';


    try {

        if (editando) {

            // El interruptor de esterilizado sin marcar no se envía: se manda en 0
            if (!datos.has("esterilizado")) {

                datos.append("esterilizado", "0");

            }

            const guardada = await peticion(`/mascotas/${editando.id_mascota}`, { method: "PUT", body: datos });

            mascotas = mascotas.map(m => m.id_mascota === guardada.id_mascota ? guardada : m);

            mostrarAviso(`Se guardaron los cambios de ${guardada.nombre}.`, "success");

        } else {

            const nueva = await peticion("/mascotas", { method: "POST", body: datos });

            mascotas.unshift(nueva);

            mostrarAviso(`¡${nueva.nombre} fue registrado(a) correctamente! 🐾`, "success");

        }


        mostrarMascotas();

        bootstrap.Modal.getInstance(
            document.getElementById("modalMascota")
        ).hide();

    } catch (error) {

        mostrarErrorFormulario(error.message);

    } finally {

        boton.disabled = false;

        boton.innerHTML = editando
            ? '<i class="bi bi-check-lg"></i> Guardar cambios'
            : '<i class="bi bi-check-lg"></i> Guardar mascota';

    }

});


// Al cerrar el formulario se limpia
document.getElementById("modalMascota").addEventListener("hidden.bs.modal", () => {

    formulario.reset();

    limpiarFoto();

    selectRaza.innerHTML = '<option value="">Primero elige la especie</option>';

    selectRaza.disabled = true;

    document.getElementById("mensajeFormulario").classList.add("d-none");

    // Vuelve a quedar listo para agregar una mascota nueva
    editando = null;

    tituloFormulario("Agregar mascota", "bi-heart");

    document.getElementById("botonGuardar").innerHTML = '<i class="bi bi-check-lg"></i> Guardar mascota';

    document.getElementById("quitarFoto").classList.add("d-none");

});


// =========================================
// INICIO
// =========================================

cargarEspecies();

cargarMascotas();
