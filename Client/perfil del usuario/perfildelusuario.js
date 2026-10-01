// ===============================
// MENÚ DEL USUARIO
// ===============================

function mostrarMenu() {

    const menu = document.getElementById("dropdownMenu");

    menu.classList.toggle("show");
}


// Cerrar menú si se hace clic afuera

document.addEventListener("click", function(event) {

    const menu = document.getElementById("dropdownMenu");
    const boton = document.querySelector(".user-button");

    if (
        menu &&
        !menu.contains(event.target) &&
        !boton.contains(event.target)
    ) {

        menu.classList.remove("show");

    }

});


// ===============================
// EDITAR PERFIL
// ===============================

function editarPerfil() {

    alert("Aquí podrás editar tu información personal.");

}


// ===============================
// AGREGAR MASCOTA
// ===============================

function agregarMascota() {

    window.location.href = "crear-mascota.html";

}


// ===============================
// VER ACTIVIDAD
// ===============================

function verActividad() {

    alert("Mostrando toda la actividad reciente.");

}


// ===============================
// ASISTENTE
// ===============================

function abrirAsistente() {

    window.location.href = "asistente.html";

}