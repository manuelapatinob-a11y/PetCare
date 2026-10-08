// ======================================
// SELECCIONAR MASCOTA
// ======================================

function seleccionarMascota(nombre, elemento) {

    // Cambiar nombre de la mascota
    document.getElementById("petName").textContent = nombre;


    // Buscar todas las mascotas
    const mascotas =
        document.querySelectorAll(".pet-option");


    // Quitar selección
    mascotas.forEach(function(mascota) {

        mascota.classList.remove("selected");

    });


    // Seleccionar la mascota elegida
    elemento.classList.add("selected");

}


// ======================================
// REGISTRAR COMIDA
// ======================================

function registrarComida() {

    alert(
        "Aquí podrás registrar la comida de tu mascota."
    );

}


// ======================================
// AGREGAR HORARIO
// ======================================

function agregarHorario() {

    alert(
        "Aquí podrás agregar un nuevo horario de comida."
    );

}


// ======================================
// IR AL ASISTENTE
// ======================================

function irAsistente() {

    window.location.href =
        "asistente.html";

}