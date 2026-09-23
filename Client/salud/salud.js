function seleccionarMascota(nombre, elemento) {

    // Cambiar el nombre de la mascota

    document.getElementById("petName").textContent = nombre;


    // Obtener todas las mascotas

    const mascotas = document.querySelectorAll(".pet-option");


    // Quitar selección

    mascotas.forEach(function(mascota) {

        mascota.classList.remove("selected");

    });


    // Seleccionar mascota actual

    elemento.classList.add("selected");

}