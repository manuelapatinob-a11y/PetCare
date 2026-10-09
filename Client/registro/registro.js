/* ==================================
   CREAR CUENTA
================================== */

const formRegistro = document.getElementById("formRegistro");

const inputContrasena = document.getElementById("contrasena");

const inputFoto = document.getElementById("foto_perfil");


/* ==================================
   REQUISITOS DE CONTRASEÑA
================================== */

const reglas = {
    largo: texto => texto.length >= 8,
    mayuscula: texto => /[A-Z]/.test(texto),
    numero: texto => /[0-9]/.test(texto),
    especial: texto => /[^A-Za-z0-9]/.test(texto)
};


function revisarContrasena() {


    let cumpleTodas = true;


    document.querySelectorAll(".requirements span").forEach(span => {

        const cumple = reglas[span.dataset.regla](inputContrasena.value);

        span.classList.toggle("ok", cumple);

        span.querySelector("i").className =
            `bi ${cumple ? "bi-check-circle-fill" : "bi-circle"}`;

        cumpleTodas = cumpleTodas && cumple;

    });


    return cumpleTodas;

}


inputContrasena.addEventListener("input", revisarContrasena);


/* ==================================
   VISTA PREVIA DE LA FOTO
================================== */

inputFoto.addEventListener("change", () => {


    const vista = document.getElementById("vistaFoto");

    const archivo = inputFoto.files[0];


    if (!archivo) {

        vista.style.backgroundImage = "";

        vista.classList.remove("has-photo");

        return;

    }


    if (archivo.size > 2 * 1024 * 1024) {

        mostrarMensaje("La foto no puede pesar más de 2 MB.");

        inputFoto.value = "";

        return;

    }


    ocultarMensaje();

    vista.style.backgroundImage = `url("${URL.createObjectURL(archivo)}")`;

    vista.classList.add("has-photo");

});


/* ==================================
   ENVIAR FORMULARIO
================================== */

function marcarInvalido(id, invalido) {

    document.getElementById(id).classList.toggle("invalid", invalido);

}


formRegistro.addEventListener("submit", async event => {


    event.preventDefault();

    ocultarMensaje();


    const valor = id => document.getElementById(id).value.trim();


    /*
    Campos obligatorios
    */

    const faltantes = ["nombres", "apellidos", "correo"].filter(id => !valor(id));

    ["nombres", "apellidos", "correo"].forEach(id =>
        marcarInvalido(id, faltantes.includes(id))
    );


    if (faltantes.length > 0) {

        mostrarMensaje("Completa tus nombres, apellidos y correo.");

        return;

    }


    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor("correo"))) {

        marcarInvalido("correo", true);

        mostrarMensaje("El correo no es válido.");

        return;

    }


    if (!revisarContrasena()) {

        marcarInvalido("contrasena", true);

        mostrarMensaje("Tu contraseña no cumple todos los requisitos.");

        return;

    }


    if (inputContrasena.value !== document.getElementById("confirmar").value) {

        marcarInvalido("confirmar", true);

        mostrarMensaje("Las contraseñas no coinciden.");

        return;

    }


    ["contrasena", "confirmar"].forEach(id => marcarInvalido(id, false));


    if (!document.getElementById("terminos").checked) {

        mostrarMensaje("Debes aceptar los Términos y Condiciones.");

        return;

    }


    /*
    FormData envía los datos y la foto juntos
    */

    const datosFormulario = new FormData(formRegistro);

    if (!inputFoto.files[0]) {

        datosFormulario.delete("foto_perfil");

    }


    const boton = document.getElementById("botonRegistro");

    boton.disabled = true;

    boton.innerHTML = 'Creando cuenta... <i class="bi bi-hourglass-split"></i>';


    try {

        const datos = await enviarAlBackend("/auth/registro", datosFormulario);

        guardarSesion(datos);

    } catch (error) {

        mostrarMensaje(error.message);

        boton.disabled = false;

        boton.innerHTML = 'Crear mi cuenta <i class="bi bi-arrow-right"></i>';

    }

});
