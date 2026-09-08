function seleccionarMascota(nombre) {

    // Cambiar nombre de la mascota

    document.getElementById("petName").textContent = nombre;


    // Obtener todas las mascotas

    const mascotas = document.querySelectorAll(".pet-option");


    // Quitar selección

    mascotas.forEach(function(mascota) {

        mascota.classList.remove("selected");

    });


    // Seleccionar la mascota presionada

    event.currentTarget.classList.add("selected");

}