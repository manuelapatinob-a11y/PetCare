// ==========================================
// FORMULARIO DE CONTACTO - PETCARE
// ==========================================

const formulario = document.getElementById("contactForm");
const mensaje = document.getElementById("formMessage");

formulario.addEventListener("submit", function (event) {

    event.preventDefault();

    mensaje.innerHTML = `
        <div class="alert alert-success mt-3">
            <i class="bi bi-check-circle-fill"></i>
            ¡Gracias por escribirnos! Hemos recibido tu mensaje.
        </div>
    `;

    formulario.reset();

});

