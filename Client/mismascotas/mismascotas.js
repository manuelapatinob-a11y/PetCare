// =========================================
// PETCARE - MIS MASCOTAS
// =========================================


// FORMULARIO AGREGAR MASCOTA

const formulario = document.getElementById("formMascota");

formulario.addEventListener("submit", function (event) {

    event.preventDefault();

    const nombre =
        document.getElementById("nombreMascota").value;

    const tipo =
        document.getElementById("tipoMascota").value;


    if (nombre === "" || tipo === "") {

        alert("Por favor completa los datos de la mascota.");

        return;
    }


    alert(
        "¡Mascota registrada correctamente! 🐾\n\n" +
        "Nombre: " + nombre +
        "\nTipo: " + tipo
    );


    formulario.reset();


    const modal =
        bootstrap.Modal.getInstance(
            document.getElementById("modalMascota")
        );

    modal.hide();

});