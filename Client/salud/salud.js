function seleccionarMascota(nombre, elemento) {

    // Cambiar el nombre de la mascota seleccionada
    const petName = document.getElementById("petName");

    if (petName) {
        petName.textContent = nombre;
    }

    // Obtener todas las mascotas
    const mascotas = document.querySelectorAll(".pet-option");

    // Quitar la selección anterior
    mascotas.forEach((mascota) => {
        mascota.classList.remove("selected");
    });

    // Marcar la mascota seleccionada
    if (elemento) {
        elemento.classList.add("selected");
    }
}