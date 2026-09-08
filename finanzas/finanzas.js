document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("gastoForm");

    formulario.addEventListener("submit", function (event) {

        event.preventDefault();

        const mascota = document.getElementById("mascota").value;
        const categoria = document.getElementById("categoria").value;
        const descripcion = document.getElementById("descripcion").value;
        const valor = document.getElementById("valor").value;
        const fecha = document.getElementById("fecha").value;

        // Validar campos principales
        if (
            mascota === "" ||
            categoria === "" ||
            descripcion === "" ||
            valor === "" ||
            fecha === ""
        ) {
            alert("Por favor completa todos los campos.");
            return;
        }

        // Validar que el valor sea positivo
        if (Number(valor) <= 0) {
            alert("El valor del gasto debe ser mayor a $0.");
            return;
        }

        alert(
            "¡Gasto registrado correctamente! 💜\n\n" +
            mascota + " · " +
            descripcion + "\n" +
            "Valor: $" + Number(valor).toLocaleString("es-CO")
        );

        // Limpiar formulario
        formulario.reset();

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(
            document.getElementById("modalGasto")
        );

        modal.hide();

    });

});