// =========================================
// PETCARE - FINANZAS
// Gastos de cada mascota y de todas juntas.
// Usa ../auth/sesion.js (peticion, urlFoto, API_URL)
// =========================================


const ICONOS = {
    stethoscope: "bi-clipboard2-pulse", bowl: "bi-basket", bag: "bi-bag", pill: "bi-capsule",
    syringe: "bi-shield-plus", scissors: "bi-scissors", dots: "bi-three-dots", bug: "bi-bug", trophy: "bi-trophy"
};

const VINCULO = {
    cita: { texto: "Consulta", icono: "bi-clipboard2-check", grupo: "Consultas veterinarias" },
    vacuna: { texto: "Vacuna", icono: "bi-shield-plus", grupo: "Vacunas" },
    desparasitacion: { texto: "Desparasitación", icono: "bi-bug", grupo: "Desparasitaciones" },
    medicamento: { texto: "Medicamento", icono: "bi-capsule", grupo: "Medicamentos" },
    compra: { texto: "Compra de comida", icono: "bi-basket", grupo: "Compras de alimento" }
};

const METODO = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia", otro: "Otro" };

const EMOJI = { Perro: "🐶", Gato: "🐱", Ave: "🐦", Conejo: "🐰", Otro: "🐾" };


let datos = null;

let filtroMascota = "todas";

let editando = null;


// =========================================
// AYUDAS
// =========================================

function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto ?? "";

    return div.innerHTML;

}


function dinero(valor) {

    return Number(valor || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

}


function f(fecha) {

    return fecha.toLocaleDateString("en-CA");

}


function aFecha(texto) {

    const [a, m, d] = texto.slice(0, 10).split("-").map(Number);

    return new Date(a, m - 1, d);

}


function fechaCorta(texto) {

    return aFecha(texto).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

}


function mostrarAviso(texto, tipo = "danger") {

    const aviso = document.getElementById("mensaje");

    aviso.className = `alert alert-${tipo}`;

    aviso.textContent = texto;

    if (tipo === "success") {

        setTimeout(() => aviso.classList.add("d-none"), 3000);

    }

}


function categoria(id) {

    return datos.categorias.find(c => c.id_categoria === id) || { nombre: "Otros", icono: "dots" };

}


function mascotaPorId(id) {

    return datos.mascotas.find(m => m.id_mascota === Number(id));

}


function sumar(lista) {

    return lista.reduce((t, g) => t + g.monto, 0);

}


function porcentaje(parte, total) {

    return total ? Math.round((parte / total) * 100) : 0;

}


// =========================================
// PERIODO
// =========================================

function rangoPeriodo() {


    const valor = document.getElementById("periodo").value;

    const hoy = new Date();

    const a = hoy.getFullYear();

    const m = hoy.getMonth();


    const meses = n => ({
        desde: f(new Date(a, m - n + 1, 1)),
        hasta: f(new Date(a, m + 1, 0)),
        meses: n,
        anterior: { desde: f(new Date(a, m - 2 * n + 1, 1)), hasta: f(new Date(a, m - n + 1, 0)) }
    });


    switch (valor) {

        case "mesAnterior":
            return {
                desde: f(new Date(a, m - 1, 1)), hasta: f(new Date(a, m, 0)), meses: 1,
                anterior: { desde: f(new Date(a, m - 2, 1)), hasta: f(new Date(a, m - 1, 0)) },
                nombre: "el mes anterior"
            };

        case "3m": return { ...meses(3), nombre: "los últimos 3 meses" };

        case "6m": return { ...meses(6), nombre: "los últimos 6 meses" };

        case "12m": return { ...meses(12), nombre: "los últimos 12 meses" };

        case "anio":
            return {
                desde: `${a}-01-01`, hasta: `${a}-12-31`, meses: m + 1,
                anterior: { desde: `${a - 1}-01-01`, hasta: f(new Date(a - 1, m + 1, 0)) },
                nombre: `${a}`
            };

        case "rango": {
            const desde = document.getElementById("desde").value || f(new Date(a, m, 1));
            const hasta = document.getElementById("hasta").value || f(hoy);
            const dias = Math.max(1, Math.round((aFecha(hasta) - aFecha(desde)) / 86400000) + 1);
            const antesHasta = new Date(aFecha(desde));
            antesHasta.setDate(antesHasta.getDate() - 1);
            const antesDesde = new Date(antesHasta);
            antesDesde.setDate(antesDesde.getDate() - dias + 1);
            return {
                desde, hasta, meses: Math.max(1, dias / 30.4),
                anterior: { desde: f(antesDesde), hasta: f(antesHasta) },
                nombre: `del ${fechaCorta(desde)} al ${fechaCorta(hasta)}`
            };
        }

        default:
            return { ...meses(1), nombre: "este mes" };
    }

}


function gastosEntre(desde, hasta, mascota = filtroMascota) {

    return datos.gastos.filter(g =>
        g.fecha >= desde && g.fecha.slice(0, 10) <= hasta &&
        (mascota === "todas" || String(g.id_mascota) === mascota)
    );

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
        chip("todas", "💰", "Todas (general)") +
        datos.mascotas.map(m => {
            const foto = urlFoto(m.foto);
            return chip(String(m.id_mascota), foto ? `<img src="${escaparHTML(foto)}" alt="">` : EMOJI[m.especie] || "🐾", m.nombre);
        }).join("");

}


// =========================================
// INDICADORES
// =========================================

function dibujarIndicadores(rango, lista) {


    const total = sumar(lista);

    const anterior = sumar(gastosEntre(rango.anterior.desde, rango.anterior.hasta));


    let cambio = '<span class="kpi-note">Sin gastos en el periodo anterior</span>';

    if (anterior) {

        const p = Math.round(((total - anterior) / anterior) * 100);

        cambio = p === 0
            ? '<span class="kpi-note">Igual que el periodo anterior</span>'
            : `<span class="kpi-note ${p > 0 ? "up" : "down"}">
                   <i class="bi bi-arrow-${p > 0 ? "up" : "down"}-right"></i>
                   ${p > 0 ? "+" : ""}${p}% vs periodo anterior (${dinero(anterior)})
               </span>`;

    }


    const porCategoria = agrupar(lista, g => g.id_categoria);

    const principal = porCategoria[0];

    const mayor = [...lista].sort((a, b) => b.monto - a.monto)[0];


    const tile = (icono, color, etiqueta, valor, nota) => `
        <div class="finance-kpi">
            <span class="kpi-label"><span class="record-icon ${color}"><i class="bi ${icono}"></i></span> ${etiqueta}</span>
            <strong>${valor}</strong>
            ${nota}
        </div>
    `;


    const quien = filtroMascota === "todas" ? "todas tus mascotas" : mascotaPorId(filtroMascota).nombre;


    document.getElementById("indicadores").innerHTML =
        tile("bi-wallet2", "purple", `Total en ${rango.nombre}`, dinero(total), cambio) +
        tile("bi-calendar3", "blue", "Promedio al mes", dinero(total / rango.meses), `<span class="kpi-note">${escaparHTML(quien)}</span>`) +
        tile("bi-pie-chart", "orange", "En lo que más gastas",
            principal ? escaparHTML(categoria(principal.clave).nombre) : "—",
            principal ? `<span class="kpi-note">${dinero(principal.total)} · ${porcentaje(principal.total, total)}% del total</span>` : '<span class="kpi-note">Sin gastos en el periodo</span>') +
        tile("bi-receipt", "green", "Gastos registrados", lista.length,
            mayor ? `<span class="kpi-note">El mayor: ${escaparHTML(mayor.descripcion)} (${dinero(mayor.monto)})</span>` : '<span class="kpi-note">—</span>');

}


// [{ clave, total, cantidad }] ordenado de mayor a menor
function agrupar(lista, clave) {

    const grupos = {};

    lista.forEach(g => {

        const k = clave(g);

        grupos[k] = grupos[k] || { clave: k, total: 0, cantidad: 0 };

        grupos[k].total += g.monto;

        grupos[k].cantidad++;

    });

    return Object.values(grupos).sort((a, b) => b.total - a.total);

}


// =========================================
// POR MASCOTA Y POR CATEGORÍA
// =========================================

function barra(etiqueta, valor, total, extra = "", atributos = "") {

    const p = porcentaje(valor, total);

    return `
        <div class="bar-row" ${atributos}>
            <div class="bar-text">
                <span>${etiqueta}</span>
                <strong>${dinero(valor)} <small>${p}%</small></strong>
            </div>
            <div class="bar-track"><div class="bar-fill" style="width: ${Math.max(p, valor ? 2 : 0)}%"></div></div>
            ${extra ? `<small class="bar-extra">${extra}</small>` : ""}
        </div>
    `;

}


function dibujarPorMascota(rango) {


    const caja = document.getElementById("porMascota");

    const deTodas = gastosEntre(rango.desde, rango.hasta, "todas");

    const totalGeneral = sumar(deTodas);


    if (filtroMascota !== "todas") {

        const m = mascotaPorId(filtroMascota);

        const suyo = sumar(gastosEntre(rango.desde, rango.hasta));

        caja.innerHTML = `
            <div class="list-header">
                <div>
                    <h3><i class="bi bi-person-hearts"></i> ${escaparHTML(m.nombre)} en el total</h3>
                    <p>Comparado con lo que gastas en todas tus mascotas en ${rango.nombre}.</p>
                </div>
            </div>
            ${barra(escaparHTML(m.nombre), suyo, totalGeneral, `De un total general de ${dinero(totalGeneral)}`)}
            <button type="button" class="btn-light-action mt-3" data-filtro="todas">
                <i class="bi bi-grid"></i> Ver todas las mascotas
            </button>
        `;

        return;

    }


    const grupos = agrupar(deTodas, g => g.id_mascota);


    caja.innerHTML = `
        <div class="list-header">
            <div>
                <h3><i class="bi bi-people"></i> Por mascota</h3>
                <p>Total general: <strong>${dinero(totalGeneral)}</strong>. Toca una mascota para ver solo sus gastos.</p>
            </div>
        </div>
        ${datos.mascotas.map(m => {
            const g = grupos.find(x => x.clave === m.id_mascota) || { total: 0, cantidad: 0 };
            return barra(
                `${EMOJI[m.especie] || "🐾"} ${escaparHTML(m.nombre)}`, g.total, totalGeneral,
                `${g.cantidad} ${g.cantidad === 1 ? "gasto" : "gastos"}`,
                `role="button" tabindex="0" data-filtro="${m.id_mascota}"`
            );
        }).join("")}
    `;

}


function dibujarPorCategoria(rango, lista) {


    const total = sumar(lista);

    const grupos = agrupar(lista, g => g.id_categoria);


    document.getElementById("porCategoria").innerHTML = `
        <div class="list-header">
            <div>
                <h3><i class="bi bi-pie-chart"></i> Por categoría</h3>
                <p>En qué se va el dinero en ${rango.nombre}.</p>
            </div>
        </div>
        ${grupos.length
            ? grupos.map(g => {
                const c = categoria(g.clave);
                return barra(`<i class="bi ${ICONOS[c.icono] || "bi-tag"}"></i> ${escaparHTML(c.nombre)}`, g.total, total,
                    `${g.cantidad} ${g.cantidad === 1 ? "gasto" : "gastos"}`);
            }).join("")
            : '<p class="records-empty">No hay gastos en este periodo.</p>'}
    `;

}


// =========================================
// EVOLUCIÓN DE LOS ÚLTIMOS 12 MESES
// =========================================

function dibujarEvolucion(rango) {


    const hoy = new Date();

    const meses = Array.from({ length: 12 }, (_, i) => {

        const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 11 + i, 1);

        const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);

        const total = sumar(gastosEntre(f(inicio), f(fin)));

        return {
            clave: f(inicio).slice(0, 7),
            corto: inicio.toLocaleDateString("es-CO", { month: "short" }).replace(".", ""),
            largo: inicio.toLocaleDateString("es-CO", { month: "long", year: "numeric" }),
            total,
            enPeriodo: f(fin) >= rango.desde && f(inicio) <= rango.hasta
        };

    });


    const maximo = Math.max(...meses.map(m => m.total), 1);

    const conGastos = meses.filter(m => m.total);

    const promedio = conGastos.length ? sumar(conGastos.map(m => ({ monto: m.total }))) / conGastos.length : 0;


    document.getElementById("evolucion").innerHTML = `

        <div class="list-header">
            <div>
                <h3><i class="bi bi-bar-chart"></i> Gastos de los últimos 12 meses</h3>
                <p>${conGastos.length ? `Promedio de los meses con gastos: ${dinero(promedio)}. Los meses del periodo elegido se ven resaltados.` : "Aún no hay gastos en los últimos 12 meses."}</p>
            </div>
        </div>

        <div class="month-chart" role="img"
             aria-label="Gastos por mes en los últimos 12 meses. Máximo ${dinero(maximo)}.">

            <div class="month-plot">
                ${promedio ? `<div class="avg-line" style="bottom: ${(promedio / maximo) * 100}%"><span>Promedio</span></div>` : ""}

                ${meses.map(m => `
                    <div class="month-column ${m.enPeriodo ? "in" : ""}" tabindex="0" data-tip="${m.largo}: ${dinero(m.total)}">
                        <div class="month-bar" style="height: ${(m.total / maximo) * 100}%"></div>
                    </div>
                `).join("")}
            </div>

            <div class="month-labels">
                ${meses.map(m => `<span class="${m.enPeriodo ? "in" : ""}">${m.corto}</span>`).join("")}
            </div>

        </div>

        <details class="monitor-table">
            <summary>Ver como tabla</summary>
            <table class="movements compact">
                <thead><tr><th>Mes</th><th class="text-end">Total</th></tr></thead>
                <tbody>${meses.map(m => `<tr><td>${m.largo}</td><td class="text-end">${dinero(m.total)}</td></tr>`).join("")}</tbody>
            </table>
        </details>
    `;

}


// =========================================
// PRESUPUESTO DEL MES (de todas las mascotas)
// =========================================

function dibujarPresupuesto() {


    const hoy = new Date();

    const delMes = gastosEntre(f(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), f(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)), "todas");

    const mes = hoy.toLocaleDateString("es-CO", { month: "long" });


    const fila = (nombre, gastado, limite) => {

        const p = porcentaje(gastado, limite);

        const estado = p >= 100
            ? { clase: "over", texto: `Te pasaste por ${dinero(gastado - limite)}`, icono: "bi-exclamation-octagon" }
            : p >= 80
                ? { clase: "near", texto: `Quedan ${dinero(limite - gastado)}`, icono: "bi-exclamation-triangle" }
                : { clase: "ok", texto: `Quedan ${dinero(limite - gastado)}`, icono: "bi-check-circle" };

        return `
            <div class="budget-row ${estado.clase}">
                <div class="bar-text">
                    <span>${nombre}</span>
                    <strong>${dinero(gastado)} <small>de ${dinero(limite)}</small></strong>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width: ${Math.min(p, 100)}%"></div></div>
                <small class="budget-state"><i class="bi ${estado.icono}"></i> ${p}% · ${estado.texto}</small>
            </div>
        `;

    };


    const total = datos.presupuestos.find(p => p.id_categoria === null);

    const porCategoria = datos.presupuestos.filter(p => p.id_categoria !== null);


    document.getElementById("presupuesto").innerHTML = `

        <div class="list-header">
            <div>
                <h3><i class="bi bi-piggy-bank"></i> Presupuesto de ${mes}</h3>
                <p>De todas tus mascotas. Llevas ${dinero(sumar(delMes))} este mes.</p>
            </div>

            <button type="button" class="btn-add-small" id="botonPresupuesto">
                <i class="bi bi-sliders"></i>
                <span>Definir</span>
            </button>
        </div>

        ${total ? fila("Total del mes", sumar(delMes), total.monto_limite) : ""}

        ${porCategoria.map(p => fila(
            escaparHTML(categoria(p.id_categoria).nombre),
            sumar(delMes.filter(g => g.id_categoria === p.id_categoria)),
            p.monto_limite
        )).join("")}

        ${!datos.presupuestos.length ? '<p class="records-empty">Define cuánto quieres gastar este mes y te mostramos cómo vas.</p>' : ""}
    `;

}


// =========================================
// REGISTROS SIN COSTO
// =========================================

function dibujarPendientes() {


    const lista = datos.pendientes.filter(p => filtroMascota === "todas" || String(p.id_mascota) === filtroMascota);

    const visibles = lista.slice(0, 8);


    document.getElementById("pendientes").innerHTML = `

        <div class="list-header">
            <div>
                <h3><i class="bi bi-hourglass-split"></i> Sin costo registrado</h3>
                <p>Consultas, vacunas, medicamentos y compras de comida de los últimos 6 meses que aún no tienen gasto.</p>
            </div>
        </div>

        ${visibles.length
            ? `<div class="pending-list">
                   ${visibles.map(p => `
                       <div class="pending-item">
                           <span class="record-icon purple"><i class="bi ${VINCULO[p.vinculo].icono}"></i></span>
                           <span class="pending-body">
                               <strong>${escaparHTML(p.descripcion)}</strong>
                               <small>${escaparHTML(p.mascota)} · ${fechaCorta(p.fecha)}</small>
                           </span>
                           <button type="button" class="btn-light-action" data-costo="${p.vinculo}:${p.id}">
                               <i class="bi bi-plus-lg"></i> Costo
                           </button>
                       </div>
                   `).join("")}
               </div>
               ${lista.length > visibles.length ? `<p class="pending-more">Y ${lista.length - visibles.length} más.</p>` : ""}`
            : '<p class="records-empty"><i class="bi bi-check2-circle"></i> Todo lo registrado ya tiene su costo.</p>'}
    `;

}


// =========================================
// MOVIMIENTOS
// =========================================

function movimientosFiltrados(rango) {


    const texto = document.getElementById("buscar").value.trim().toLowerCase();

    const cat = document.getElementById("filtroCategoria").value;


    return gastosEntre(rango.desde, rango.hasta).filter(g =>
        (!cat || String(g.id_categoria) === cat) &&
        (!texto || `${g.descripcion} ${g.notas || ""} ${g.mascota}`.toLowerCase().includes(texto))
    );

}


function dibujarMovimientos(rango) {


    const selector = document.getElementById("filtroCategoria");

    const elegido = selector.value;

    selector.innerHTML = '<option value="">Todas las categorías</option>' +
        datos.categorias.map(c => `<option value="${c.id_categoria}" ${String(c.id_categoria) === elegido ? "selected" : ""}>${escaparHTML(c.nombre)}</option>`).join("");


    const lista = movimientosFiltrados(rango);


    document.getElementById("textoMovimientos").textContent =
        `${lista.length} ${lista.length === 1 ? "gasto" : "gastos"} en ${rango.nombre} · ${dinero(sumar(lista))}`;


    document.getElementById("tablaMovimientos").innerHTML = lista.length
        ? lista.map(g => {
            const c = categoria(g.id_categoria);
            return `
                <tr>
                    <td class="nowrap">${fechaCorta(g.fecha)}</td>
                    <td>${escaparHTML(g.mascota)}</td>
                    <td><span class="badge-soft gray"><i class="bi ${ICONOS[c.icono] || "bi-tag"}"></i> ${escaparHTML(c.nombre)}</span></td>
                    <td>
                        ${escaparHTML(g.descripcion)}
                        ${g.vinculo ? `<span class="badge-soft purple"><i class="bi bi-link-45deg"></i> ${VINCULO[g.vinculo].texto}</span>` : ""}
                        ${g.notas ? `<small class="d-block text-muted">${escaparHTML(g.notas)}</small>` : ""}
                    </td>
                    <td>${METODO[g.metodo_pago] || "—"}</td>
                    <td class="text-end nowrap"><strong>${dinero(g.monto)}</strong></td>
                    <td class="record-actions">
                        ${g.comprobante ? `<a href="${escaparHTML(urlFoto(g.comprobante))}" target="_blank" rel="noopener" title="Ver comprobante"><i class="bi bi-paperclip"></i></a>` : ""}
                        <button type="button" title="Editar" data-editar="${g.id_gasto}"><i class="bi bi-pencil"></i></button>
                        <button type="button" title="Eliminar" class="danger" data-eliminar="${g.id_gasto}"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join("")
        : '<tr><td colspan="7" class="records-empty">No hay gastos con estos filtros.</td></tr>';

}


function exportarCSV() {


    const rango = rangoPeriodo();

    const lista = movimientosFiltrados(rango);

    const celda = v => `"${String(v ?? "").replace(/"/g, '""')}"`;


    const filas = [
        ["Fecha", "Mascota", "Categoría", "Descripción", "Relacionado con", "Método de pago", "Valor", "Notas"],
        ...lista.map(g => [
            g.fecha.slice(0, 10), g.mascota, categoria(g.id_categoria).nombre, g.descripcion,
            g.vinculo ? VINCULO[g.vinculo].texto : "", METODO[g.metodo_pago] || "", g.monto, g.notas || ""
        ]),
        ["", "", "", "Total", "", "", sumar(lista), ""]
    ];


    // Punto y coma y BOM para que Excel en español lo abra bien
    const csv = "﻿" + filas.map(fila => fila.map(celda).join(";")).join("\r\n");

    const enlace = document.createElement("a");

    enlace.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));

    const quien = filtroMascota === "todas" ? "todas" : mascotaPorId(filtroMascota).nombre;

    enlace.download = `gastos-${quien}-${rango.desde}-a-${rango.hasta}.csv`.replace(/\s+/g, "-");

    enlace.click();

    URL.revokeObjectURL(enlace.href);

}


// =========================================
// DIBUJAR TODO
// =========================================

function dibujarTodo() {


    const rango = rangoPeriodo();

    const lista = gastosEntre(rango.desde, rango.hasta);


    dibujarFiltro();

    dibujarIndicadores(rango, lista);

    dibujarPorMascota(rango);

    dibujarPorCategoria(rango, lista);

    dibujarEvolucion(rango);

    dibujarPresupuesto();

    dibujarPendientes();

    dibujarMovimientos(rango);

}


async function cargar() {


    try {

        datos = await peticion("/finanzas");

    } catch (e) {

        mostrarAviso(e.message);

        return;

    }


    if (!datos.mascotas.length) {

        document.getElementById("sinMascotas").classList.remove("d-none");

        return;

    }


    // La mascota puede venir en la dirección: finanzas.html?mascota=5
    const pedida = new URLSearchParams(location.search).get("mascota");

    if (filtroMascota === "todas" && pedida && mascotaPorId(pedida)) {

        filtroMascota = String(Number(pedida));

    }


    document.getElementById("contenido").classList.remove("d-none");

    dibujarTodo();

}


// =========================================
// FORMULARIO DE GASTO
// =========================================

const modalGasto = () => bootstrap.Modal.getOrCreateInstance(document.getElementById("modalGasto"));


// Lo que este gasto puede pagar: lo pendiente de la mascota (y lo que ya tenía, al editar)
function opcionesVinculo(idMascota, actual = null) {


    const pendientes = datos.pendientes.filter(p => String(p.id_mascota) === String(idMascota));

    const grupos = Object.keys(VINCULO)
        .map(tipo => ({ tipo, items: pendientes.filter(p => p.vinculo === tipo) }))
        .filter(g => g.items.length);


    document.getElementById("gVinculo").innerHTML =
        '<option value="">Nada en particular</option>' +
        (actual ? `<option value="${actual.valor}" selected>${escaparHTML(actual.texto)} (el actual)</option>` : "") +
        grupos.map(g => `
            <optgroup label="${VINCULO[g.tipo].grupo}">
                ${g.items.map(p => `<option value="${p.vinculo}:${p.id}">${escaparHTML(p.descripcion)} · ${fechaCorta(p.fecha)}</option>`).join("")}
            </optgroup>
        `).join("");


    document.getElementById("gVinculo").disabled = idMascota === "todas";

}


function abrirGasto(gasto = null, desde = null) {


    editando = gasto;

    const form = document.getElementById("formGasto");

    form.reset();

    document.getElementById("errorGasto").classList.add("d-none");


    // Mascotas (al crear se puede dividir entre todas)
    document.getElementById("gMascota").innerHTML =
        datos.mascotas.map(m => `<option value="${m.id_mascota}">${escaparHTML(m.nombre)}</option>`).join("") +
        (!gasto && datos.mascotas.length > 1 ? '<option value="todas">Todas (dividir en partes iguales)</option>' : "");

    document.getElementById("gCategoria").innerHTML =
        datos.categorias.map(c => `<option value="${c.id_categoria}">${escaparHTML(c.nombre)}</option>`).join("");


    const comprobante = document.getElementById("comprobanteActual");

    comprobante.classList.add("d-none");


    if (gasto) {

        document.getElementById("gMascota").value = gasto.id_mascota;

        document.getElementById("gCategoria").value = gasto.id_categoria;

        document.getElementById("gDescripcion").value = gasto.descripcion;

        document.getElementById("gMonto").value = gasto.monto;

        document.getElementById("gFecha").value = gasto.fecha.slice(0, 10);

        document.getElementById("gMetodo").value = gasto.metodo_pago || "efectivo";

        document.getElementById("gNotas").value = gasto.notas || "";

        const id = { cita: gasto.id_cita, vacuna: gasto.id_vacuna, desparasitacion: gasto.id_desparasitacion, medicamento: gasto.id_medicamento, compra: gasto.id_compra }[gasto.vinculo];

        opcionesVinculo(gasto.id_mascota, gasto.vinculo ? { valor: `${gasto.vinculo}:${id}`, texto: VINCULO[gasto.vinculo].texto } : null);

        if (gasto.comprobante) {

            comprobante.innerHTML = `Comprobante actual: <a href="${escaparHTML(urlFoto(gasto.comprobante))}" target="_blank" rel="noopener">ver</a>. Sube otro solo si quieres reemplazarlo.`;

            comprobante.classList.remove("d-none");

        }

    } else {

        const mascota = desde?.id_mascota ?? (filtroMascota === "todas" ? datos.mascotas[0].id_mascota : filtroMascota);

        document.getElementById("gMascota").value = mascota;

        document.getElementById("gFecha").value = f(new Date());

        opcionesVinculo(mascota);


        // "Registrar costo" de algo pendiente: ya queda lleno
        if (desde) {

            document.getElementById("gVinculo").value = `${desde.vinculo}:${desde.id}`;

            aplicarVinculo();

        }

    }


    document.getElementById("tituloGasto").textContent = gasto ? "Editar gasto" : "Registrar gasto";

    modalGasto().show();

}


// Al elegir lo que se pagó, se llenan la categoría, la descripción y la fecha
function aplicarVinculo() {


    const valor = document.getElementById("gVinculo").value;

    const pendiente = datos.pendientes.find(p => `${p.vinculo}:${p.id}` === valor);


    if (!pendiente) {

        return;

    }


    document.getElementById("gCategoria").value = pendiente.categoria;

    document.getElementById("gDescripcion").value = pendiente.descripcion.slice(0, 200);

    document.getElementById("gFecha").value = pendiente.fecha.slice(0, 10);

}


document.getElementById("gVinculo").addEventListener("change", aplicarVinculo);

document.getElementById("gMascota").addEventListener("change", event => opcionesVinculo(event.target.value));


document.getElementById("formGasto").addEventListener("submit", async event => {


    event.preventDefault();

    const error = document.getElementById("errorGasto");

    error.classList.add("d-none");


    const vacio = [...event.target.querySelectorAll("[required]")].find(c => !c.value.trim());

    if (vacio) {

        error.textContent = `Completa el campo "${event.target.querySelector(`label[for="${vacio.id}"]`).textContent.replace(" *", "")}".`;

        error.classList.remove("d-none");

        vacio.focus();

        return;

    }


    const formulario = new FormData(event.target);

    if (!document.getElementById("gComprobante").files.length) {

        formulario.delete("comprobante");

    }


    const boton = document.getElementById("botonGuardarGasto");

    boton.disabled = true;


    try {

        const respuesta = await peticion(editando ? `/finanzas/gastos/${editando.id_gasto}` : "/finanzas/gastos", {
            method: editando ? "PUT" : "POST",
            body: formulario
        });

        modalGasto().hide();

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
// PRESUPUESTO
// =========================================

const modalPresupuesto = () => bootstrap.Modal.getOrCreateInstance(document.getElementById("modalPresupuesto"));


function abrirPresupuesto() {


    document.getElementById("errorPresupuesto").classList.add("d-none");

    document.getElementById("pCategoria").innerHTML = '<option value="">Todo el mes (todas las categorías)</option>' +
        datos.categorias.map(c => `<option value="${c.id_categoria}">${escaparHTML(c.nombre)}</option>`).join("");

    mostrarLimiteActual();

    modalPresupuesto().show();

}


function mostrarLimiteActual() {

    const valor = document.getElementById("pCategoria").value;

    const actual = datos.presupuestos.find(p => String(p.id_categoria ?? "") === valor);

    document.getElementById("pMonto").value = actual ? actual.monto_limite : "";

}


document.getElementById("pCategoria").addEventListener("change", mostrarLimiteActual);


document.getElementById("formPresupuesto").addEventListener("submit", async event => {


    event.preventDefault();

    try {

        const respuesta = await peticion("/finanzas/presupuesto", { method: "PUT", body: new FormData(event.target) });

        modalPresupuesto().hide();

        await cargar();

        mostrarAviso(respuesta.message, "success");

    } catch (e) {

        const error = document.getElementById("errorPresupuesto");

        error.textContent = e.message;

        error.classList.remove("d-none");

    }

});


// =========================================
// EVENTOS
// =========================================

document.getElementById("periodo").addEventListener("change", event => {

    document.getElementById("rango").classList.toggle("d-none", event.target.value !== "rango");

    dibujarTodo();

});

["desde", "hasta"].forEach(id => document.getElementById(id).addEventListener("change", dibujarTodo));

document.getElementById("buscar").addEventListener("input", () => dibujarMovimientos(rangoPeriodo()));

document.getElementById("filtroCategoria").addEventListener("change", () => dibujarMovimientos(rangoPeriodo()));

document.getElementById("botonGasto").addEventListener("click", () => abrirGasto());

document.getElementById("botonExportar").addEventListener("click", exportarCSV);


document.addEventListener("click", async event => {


    const filtro = event.target.closest("[data-filtro]");

    const editar = event.target.closest("[data-editar]");

    const eliminar = event.target.closest("[data-eliminar]");

    const costo = event.target.closest("[data-costo]");


    if (event.target.closest("#botonPresupuesto")) {

        abrirPresupuesto();

    } else if (filtro) {

        filtroMascota = filtro.dataset.filtro;

        history.replaceState(null, "", filtroMascota === "todas" ? location.pathname : `?mascota=${filtroMascota}`);

        dibujarTodo();

    } else if (costo) {

        abrirGasto(null, datos.pendientes.find(p => `${p.vinculo}:${p.id}` === costo.dataset.costo));

    } else if (editar) {

        abrirGasto(datos.gastos.find(g => g.id_gasto === Number(editar.dataset.editar)));

    } else if (eliminar) {

        if (!confirm("¿Eliminar este gasto?")) return;

        try {

            const respuesta = await peticion(`/finanzas/gastos/${eliminar.dataset.eliminar}`, { method: "DELETE" });

            await cargar();

            mostrarAviso(respuesta.message, "success");

        } catch (e) {

            mostrarAviso(e.message);

        }

    }

});


// Las barras por mascota también se eligen con el teclado
document.addEventListener("keydown", event => {

    const fila = event.target.closest?.(".bar-row[data-filtro]");

    if (fila && (event.key === "Enter" || event.key === " ")) {

        event.preventDefault();

        fila.click();

    }

});


cargar();
