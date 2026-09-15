// ==========================================
// PETCARE - ASISTENTE INTELIGENTE
// ==========================================

const input = document.getElementById("mensajeInput");
const chatArea = document.getElementById("chatArea");


// ==========================================
// ENVIAR MENSAJE
// ==========================================

function enviarMensaje() {

    const mensaje = input.value.trim();

    if (mensaje === "") {
        return;
    }

    // Mostrar mensaje del usuario
    agregarMensajeUsuario(mensaje);

    // Limpiar input
    input.value = "";

    // Simular respuesta de IA
    mostrarEscribiendo();

    setTimeout(() => {

        quitarEscribiendo();

        const respuesta = generarRespuesta(mensaje);

        agregarMensajeAsistente(respuesta);

    }, 1000);

}


// ==========================================
// ENVIAR CON ENTER
// ==========================================

input.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        enviarMensaje();

    }

});


// ==========================================
// MENSAJE DEL USUARIO
// ==========================================

function agregarMensajeUsuario(mensaje) {

    const contenedor = document.createElement("div");

    contenedor.className =
        "message user-message";

    contenedor.innerHTML = `

        <div class="message-content">

            <div class="message-name">
                Tú
            </div>

            <div class="message-bubble">

                ${mensaje}

            </div>

            <small class="message-time">
                Ahora
            </small>

        </div>

    `;

    chatArea.appendChild(contenedor);

    bajarChat();

}


// ==========================================
// MENSAJE DEL ASISTENTE
// ==========================================

function agregarMensajeAsistente(mensaje) {

    const contenedor = document.createElement("div");

    contenedor.className =
        "message assistant-message";

    contenedor.innerHTML = `

        <div class="message-avatar">

            <i class="bi bi-robot"></i>

        </div>

        <div class="message-content">

            <div class="message-name">
                PetBot
            </div>

            <div class="message-bubble">

                ${mensaje}

            </div>

            <small class="message-time">
                Ahora
            </small>

        </div>

    `;

    chatArea.appendChild(contenedor);

    bajarChat();

}


// ==========================================
// PREGUNTAS RÁPIDAS
// ==========================================

function preguntaRapida(pregunta) {

    input.value = pregunta;

    enviarMensaje();

}


// ==========================================
// RESPUESTAS SIMULADAS
// ==========================================

function generarRespuesta(mensaje) {

    const texto = mensaje.toLowerCase();


    // ALIMENTACIÓN

    if (
        texto.includes("comida") ||
        texto.includes("aliment") ||
        texto.includes("comer")
    ) {

        return `
            Una alimentación adecuada depende de la especie,
            edad, tamaño y necesidades de tu mascota. 🐶🐱
            <br><br>
            Lo mejor es ofrecerle un alimento completo y
            adecuado para su etapa de vida y mantener siempre
            agua fresca disponible.
        `;

    }


    // ACTIVIDAD

    if (
        texto.includes("ejercicio") ||
        texto.includes("actividad") ||
        texto.includes("caminar") ||
        texto.includes("paseo")
    ) {

        return `
            La actividad física ayuda a mantener a tu mascota
            saludable y activa. 🐾
            <br><br>
            Los perros generalmente necesitan paseos y juegos
            diarios, pero la cantidad depende de su edad,
            tamaño, condición física y características.
        `;

    }


    // SALUD

    if (
        texto.includes("vacuna") ||
        texto.includes("salud") ||
        texto.includes("veterin")
    ) {

        return `
            Las vacunas son importantes para prevenir
            diferentes enfermedades. 💜
            <br><br>
            El calendario de vacunación debe ser definido
            por un veterinario según la edad y las
            características de tu mascota.
        `;

    }


    // COMPORTAMIENTO

    if (
        texto.includes("comportamiento") ||
        texto.includes("conducta") ||
        texto.includes("ladra") ||
        texto.includes("muerde")
    ) {

        return `
            El comportamiento de cada mascota puede tener
            diferentes causas. 🐕
            <br><br>
            Una rutina estable, ejercicio, refuerzo positivo
            y paciencia pueden ayudar. Si el comportamiento
            cambia de manera repentina, es recomendable
            consultar con un veterinario o especialista.
        `;

    }


    // PESO

    if (
        texto.includes("peso") ||
        texto.includes("obesidad")
    ) {

        return `
            El peso saludable depende de factores como la
            raza, edad, tamaño y condición corporal. ⚖️
            <br><br>
            Para saber si el peso de tu mascota es adecuado,
            lo mejor es consultar con un veterinario.
        `;

    }


    // RESPUESTA GENERAL

    return `
        ¡Claro! 🐾 Puedo ayudarte con información general
        sobre el cuidado de tu mascota.
        <br><br>
        Puedes preguntarme sobre <strong>salud, alimentación,
        actividad física, comportamiento o cuidados</strong>.
        <br><br>
        ¿Qué te gustaría saber?
    `;

}


// ==========================================
// INDICADOR "ESCRIBIENDO"
// ==========================================

function mostrarEscribiendo() {

    const indicador = document.createElement("div");

    indicador.id = "typing";

    indicador.className =
        "message assistant-message";

    indicador.innerHTML = `

        <div class="message-avatar">

            <i class="bi bi-robot"></i>

        </div>

        <div class="message-content">

            <div class="message-name">
                PetBot
            </div>

            <div class="message-bubble">

                PetBot está escribiendo... 💜

            </div>

        </div>

    `;

    chatArea.appendChild(indicador);

    bajarChat();

}


// ==========================================
// QUITAR INDICADOR
// ==========================================

function quitarEscribiendo() {

    const indicador =
        document.getElementById("typing");

    if (indicador) {

        indicador.remove();

    }

}


// ==========================================
// BAJAR CHAT
// ==========================================

function bajarChat() {

    chatArea.scrollTop =
        chatArea.scrollHeight;

}


// ==========================================
// ADJUNTAR ARCHIVO
// ==========================================

function adjuntarArchivo() {

    alert(
        "Aquí podrás adjuntar una foto de tu mascota 📷🐾"
    );

}


// ==========================================
// MICRÓFONO
// ==========================================

function activarMicrofono() {

    alert(
        "Función de reconocimiento de voz disponible próximamente 🎤"
    );

}