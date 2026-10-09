// =========================================
// PETCARE - MENÚ DE LAS PÁGINAS PÚBLICAS (Mapa, Servicios)
// Sin sesión se queda el menú público del HTML.
// Con sesión iniciada se cambia por el menú del usuario.
// Se carga después de ../auth/sesion.js (usa obtenerToken).
// La página marca su opción con <nav class="menu" data-activo="mapa">
// =========================================

(function () {

    const MENU_CON_SESION = [
        ["inicio", "../inicio/inicio.html", "bi-house", "Inicio"],
        ["mismascotas", "../mismascotas/mismascotas.html", "bi-people", "Mis Mascotas"],
        ["salud", "../salud/salud.html", "bi-heart-pulse", "Salud"],
        ["alimentacion", "../alimentacion/Alimentacion.html", "bi-cup-hot", "Alimentación"],
        ["actividad", "../actividadfisica/actividadfisica.html", "bi-person-walking", "Actividad Física"],
        ["entrenamiento", "../entrenamiento/entrenamiento.html", "bi-award", "Entrenamiento y comportamiento"],
        ["recordatorios", "../recordatorios/recordatorios.html", "bi-bell", "Recordatorios"],
        ["mapa", "../mapa/mapa.html", "bi-geo-alt", "Mapa Pet Friendly"],
        ["finanzas", "../finanzas/finanzas.html", "bi-wallet2", "Finanzas"],
        ["asistente", "../asistente/asistente.html", "bi-robot", "Asistente IA"],
        ["perfil", "../perfil/perfil.html", "bi-person", "Perfil"],
        ["configuracion", "../configuracion/configuracion.html", "bi-gear", "Configuración"]
    ];


    document.addEventListener("DOMContentLoaded", () => {


        if (typeof obtenerToken !== "function" || !obtenerToken()) {

            return;

        }


        const menu = document.querySelector(".sidebar .menu");

        if (!menu) {

            return;

        }


        const activo = menu.dataset.activo;

        menu.innerHTML = MENU_CON_SESION.map(([clave, enlace, icono, texto]) => `
            <a href="${enlace}" class="${clave === activo ? "active" : ""}">
                <i class="bi ${icono}"></i>
                ${texto}
            </a>
        `).join("");


        document.querySelector(".sidebar").classList.add("con-sesion");

        document.querySelector(".sidebar .logo-area")?.setAttribute("href", "../inicio/inicio.html");

    });

})();
