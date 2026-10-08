// ==========================================
// RECUPERAR CUENTA - PETCARE
// ==========================================

const recoveryForm = document.getElementById("recoveryForm");
const successMessage = document.getElementById("successMessage");

recoveryForm.addEventListener("submit", function (event) {

    // Evita que la página se recargue
    event.preventDefault();

    // Obtiene el correo
    const correo = document.getElementById("correo").value.trim();

    // Verifica que haya un correo
    if (correo === "") {
        return;
    }

    // Muestra el mensaje de éxito
    successMessage.style.display = "flex";

    // Cambia el texto del botón
    const button = recoveryForm.querySelector(".recovery-button");

    button.innerHTML = `
        <i class="bi bi-check-circle-fill"></i>
        Enlace enviado
    `;

    // Desactiva temporalmente el botón
    button.disabled = true;

    // Limpia el formulario
    recoveryForm.reset();

});

