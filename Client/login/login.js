/* ==================================
   INICIAR SESIÓN
================================== */

const formLogin = document.getElementById("formLogin");


formLogin.addEventListener("submit", async event => {


    event.preventDefault();

    ocultarMensaje();


    const correo = document.getElementById("correo").value.trim();

    const contrasena = document.getElementById("contrasena").value;


    if (!correo || !contrasena) {

        mostrarMensaje("Ingresa tu correo y tu contraseña.");

        return;

    }


    const boton = document.getElementById("botonEntrar");

    boton.disabled = true;

    boton.innerHTML = 'Entrando... <i class="bi bi-hourglass-split"></i>';


    try {

        const datos = await enviarAlBackend("/auth/login", { correo, contrasena });

        guardarSesion(
            datos,
            document.getElementById("recordarme").checked
        );

    } catch (error) {

        mostrarMensaje(error.message);

        boton.disabled = false;

        boton.innerHTML = 'Iniciar sesión <i class="bi bi-arrow-right"></i>';

    }

});
