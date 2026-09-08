// ========================================
// EDITAR PERFIL
// ========================================

function editarPerfil() {

    const modal = new bootstrap.Modal(
        document.getElementById("editarModal")
    );

    modal.show();
}


// ========================================
// EDITAR DATOS
// ========================================

function editarDatos() {

    const modal = new bootstrap.Modal(
        document.getElementById("editarModal")
    );

    modal.show();
}


// ========================================
// GUARDAR CAMBIOS
// ========================================

function guardarCambios() {

    const nombre =
        document.getElementById("nombreMascota").value;

    const raza =
        document.getElementById("razaMascota").value;

    const peso =
        document.getElementById("pesoMascota").value;


    if (nombre === "" || raza === "" || peso === "") {

        alert("Por favor completa todos los campos.");

        return;
    }


    // Cambiar nombre
    document.querySelector(".profile-info h2").textContent =
        nombre + " 🐶";


    // Cambiar raza
    document.querySelector(".breed").textContent =
        raza;


    // Cambiar peso
    const datos =
        document.querySelectorAll(".data-item strong");

    datos.forEach(dato => {

        if (dato.textContent === "28 kg") {

            dato.textContent = peso + " kg";

        }

    });


    // Cerrar modal
    const modal =
        bootstrap.Modal.getInstance(
            document.getElementById("editarModal")
        );

    modal.hide();


    alert("¡Perfil actualizado correctamente! 🐾💜");
}


// ========================================
// CAMBIAR FOTO
// ========================================

function cambiarFoto() {

    alert(
        "Aquí podrás seleccionar una nueva foto de tu mascota. 🐶📷"
    );

}