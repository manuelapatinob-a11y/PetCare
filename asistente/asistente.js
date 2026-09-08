/*==================================================
                PETCARE
                SCRIPT.JS
==================================================*/

/*==================================================
            OBTENER ELEMENTOS
==================================================*/

const btnInicio = document.getElementById("btnInicio");
const btnAgente = document.getElementById("btnAgente");

const inicio = document.getElementById("inicio");
const agenteIA = document.getElementById("agenteIA");

/*==================================================
            FUNCIÓN MENÚ ACTIVO
==================================================*/

function limpiarMenu() {

    const opciones = document.querySelectorAll(".sidebar li");

    opciones.forEach(opcion => {

        opcion.classList.remove("activo");

    });

}

/*==================================================
            IR A INICIO
==================================================*/

btnInicio.addEventListener("click", () => {

    limpiarMenu();

    btnInicio.classList.add("activo");

    inicio.style.display = "block";

    agenteIA.style.display = "none";

});

/*==================================================
        IR A AGENTE INTELIGENTE
==================================================*/

btnAgente.addEventListener("click", () => {

    limpiarMenu();

    btnAgente.classList.add("activo");

    inicio.style.display = "none";

    agenteIA.style.display = "flex";

});

/*==================================================
            CHAT DEL AGENTE IA
==================================================*/

const mensajes = document.getElementById("mensajes");
const texto = document.getElementById("texto");
const enviar = document.getElementById("enviar");

/*==================================================
        RESPUESTAS PREDEFINIDAS
==================================================*/

function respuestaIA(mensaje){

    mensaje = mensaje.toLowerCase();

    if(mensaje.includes("hola")){

        return "¡Hola! 😊 ¿En qué puedo ayudarte con tu mascota hoy?";

    }

    if(mensaje.includes("vacuna")){

        return "Las vacunas son fundamentales para prevenir enfermedades. Te recomiendo consultar el calendario de vacunación de tu mascota con tu veterinario.";

    }

    if(mensaje.includes("comida") || mensaje.includes("alimentación")){

        return "Una alimentación balanceada depende de la edad, raza y tamaño de tu mascota. Puedo ayudarte a crear una rutina alimenticia.";

    }

    if(mensaje.includes("baño")){

        return "La frecuencia del baño depende del tipo de mascota y su pelaje. Generalmente se recomienda cada 3 o 4 semanas.";

    }

    if(mensaje.includes("gracias")){

        return "¡Con mucho gusto! Estoy aquí para ayudarte siempre. 🐾";

    }

    return "Estoy analizando tu consulta. Te recomiendo proporcionar más detalles para poder ayudarte mejor.";
}

/*==================================================
        AGREGAR MENSAJE DEL USUARIO
==================================================*/

function agregarMensajeUsuario(textoMensaje){

    mensajes.innerHTML += `

        <div class="mensajeUsuario">

            <div class="burbujaUsuario">

                ${textoMensaje}

            </div>

        </div>

    `;

    mensajes.scrollTop = mensajes.scrollHeight;

}

/*==================================================
        AGREGAR MENSAJE DE LA IA
==================================================*/

function agregarMensajeIA(textoMensaje){

    mensajes.innerHTML += `

        <div class="mensajeIA">

            <div class="avatarIA">

                <img src="img/robot.png">

            </div>

            <div class="burbujaIA">

                ${textoMensaje}

            </div>

        </div>

    `;

    mensajes.scrollTop = mensajes.scrollHeight;

}

/*==================================================
            ENVIAR MENSAJE
==================================================*/

function enviarMensaje(){

    const mensaje = texto.value.trim();

    if(mensaje==="") return;

    agregarMensajeUsuario(mensaje);

    texto.value="";

    setTimeout(()=>{

        agregarMensajeIA(respuestaIA(mensaje));

    },800);

}

/*==================================================
        BOTÓN ENVIAR
==================================================*/

enviar.addEventListener("click",enviarMensaje);

/*==================================================
        TECLA ENTER
==================================================*/

texto.addEventListener("keypress",function(e){

    if(e.key==="Enter"){

        enviarMensaje();

    }

});

/*==================================================
        INDICADOR "ESCRIBIENDO..."
==================================================*/

function mostrarEscribiendo(){

    mensajes.innerHTML += `

        <div class="mensajeIA" id="escribiendo">

            <div class="avatarIA">

                <img src="img/robot.png">

            </div>

            <div class="burbujaIA">

                <i class="fa-solid fa-circle-notch fa-spin"></i>

                El Agente IA está escribiendo...

            </div>

        </div>

    `;

    mensajes.scrollTop = mensajes.scrollHeight;

}

/*==================================================
        ELIMINAR INDICADOR
==================================================*/

function ocultarEscribiendo(){

    const escribiendo = document.getElementById("escribiendo");

    if(escribiendo){

        escribiendo.remove();

    }

}

/*==================================================
        NUEVO ENVÍO DE MENSAJES
==================================================*/

function enviarMensaje(){

    const mensaje = texto.value.trim();

    if(mensaje=="") return;

    agregarMensajeUsuario(mensaje);

    texto.value="";

    mostrarEscribiendo();

    setTimeout(()=>{

        ocultarEscribiendo();

        agregarMensajeIA(respuestaIA(mensaje));

    },1800);

}

/*==================================================
        BOTÓN ENVIAR
==================================================*/

enviar.onclick = enviarMensaje;

/*==================================================
            TECLA ENTER
==================================================*/

texto.addEventListener("keydown",function(e){

    if(e.key==="Enter"){

        e.preventDefault();

        enviarMensaje();

    }

});

/*==================================================
        RESPUESTAS AVANZADAS DEL AGENTE IA
==================================================*/

const respuestasIA = {

    perro: "🐶 Los perros necesitan ejercicio diario, agua fresca, una alimentación balanceada y visitas periódicas al veterinario.",

    gatos: "🐱 Los gatos son animales muy independientes, pero también requieren vacunas, buena alimentación y controles veterinarios.",

    gato: "🐱 Los gatos son animales muy independientes, pero también requieren vacunas, buena alimentación y controles veterinarios.",

    vacunas: "💉 Mantener el esquema de vacunación al día ayuda a prevenir enfermedades graves.",

    vacuna: "💉 Mantener el esquema de vacunación al día ayuda a prevenir enfermedades graves.",

    comida: "🍖 La alimentación debe adaptarse a la edad, peso y raza de la mascota.",

    alimento: "🥣 Una buena nutrición mejora la salud y prolonga la vida de tu mascota.",

    agua: "💧 Tu mascota siempre debe tener agua limpia y fresca disponible.",

    paseo: "🦮 Los paseos diarios ayudan a mantener una buena salud física y mental.",

    pasear: "🚶‍♂️ Pasear diariamente reduce el estrés y mejora el comportamiento.",

    rutina: "📅 Una rutina constante mejora la calidad de vida de cualquier mascota.",

    baño: "🛁 La frecuencia del baño depende del tipo de pelaje y de la especie.",

    pulgas: "🪲 Existen productos antipulgas muy efectivos. Consulta con tu veterinario cuál es el más adecuado.",

    garrapatas: "🕷️ Es importante revisar el pelaje después de cada paseo.",

    emergencia: "🚨 Si tu mascota presenta dificultad para respirar, convulsiones o sangrado abundante, acude inmediatamente al veterinario.",

    veterinario: "👨‍⚕️ Las revisiones veterinarias periódicas ayudan a detectar enfermedades a tiempo."

};

/*==================================================
        MEJORAR RESPUESTAS
==================================================*/

const respuestaAnterior = respuestaIA;

respuestaIA = function(mensaje){

    mensaje = mensaje.toLowerCase();

    for(const palabra in respuestasIA){

        if(mensaje.includes(palabra)){

            return respuestasIA[palabra];

        }

    }

    return respuestaAnterior(mensaje);

};

/*==================================================
        RESPUESTAS NATURALES DEL AGENTE IA
==================================================*/

const saludos = [

    "¡Hola! 👋 ¿En qué puedo ayudarte con tu mascota hoy?",

    "¡Bienvenido! 🐾 Estoy listo para responder tus preguntas.",

    "¡Hola! 😊 Cuéntame, ¿qué necesitas saber sobre tu mascota?",

    "¡Es un gusto ayudarte! ❤️"

];

const despedidas = [

    "¡Hasta luego! 🐶 Cuida mucho a tu mascota.",

    "Fue un placer ayudarte. 🐾",

    "¡Nos vemos pronto! Estoy aquí cuando me necesites.",

    "Gracias por utilizar PetCare IA. ❤️"

];

const respuestasGenerales = [

    "Estoy analizando tu consulta para darte la mejor recomendación.",

    "Te recomiendo consultar también con un veterinario si los síntomas persisten.",

    "Puedo ayudarte con alimentación, vacunas, comportamiento, rutinas y mucho más.",

    "Cada mascota es diferente, por lo que siempre es importante tener en cuenta su edad y estado de salud.",

    "Si deseas, puedes darme más detalles para ofrecerte una respuesta más precisa."

];

/*==================================================
        RESPUESTA ALEATORIA
==================================================*/

function obtenerRespuestaAleatoria(lista){

    return lista[Math.floor(Math.random()*lista.length)];

}

/*==================================================
        MEJORAR RESPUESTA IA
==================================================*/

const respuestaOriginal = respuestaIA;

respuestaIA = function(mensaje){

    mensaje = mensaje.toLowerCase();

    if(mensaje.includes("hola") ||
       mensaje.includes("buenas") ||
       mensaje.includes("buen día") ||
       mensaje.includes("buenos días")){

        return obtenerRespuestaAleatoria(saludos);

    }

    if(mensaje.includes("adiós") ||
       mensaje.includes("hasta luego") ||
       mensaje.includes("nos vemos") ||
       mensaje.includes("chao")){

        return obtenerRespuestaAleatoria(despedidas);

    }

    let respuesta = respuestaOriginal(mensaje);

    if(respuesta.includes("Estoy analizando")){

        return obtenerRespuestaAleatoria(respuestasGenerales);

    }

    return respuesta;

};

/*==================================================
        EFECTO AL ESCRIBIR
==================================================*/

texto.addEventListener("input",()=>{

    if(texto.value.length>0){

        enviar.style.opacity="1";

        enviar.style.transform="scale(1)";

    }else{

        enviar.style.opacity=".6";

        enviar.style.transform="scale(.95)";

    }

});

/*==================================================
        ENFOCAR INPUT AL CARGAR
==================================================*/

window.addEventListener("load",()=>{

    texto.focus();

});

/*==================================================
            HORA ACTUAL
==================================================*/

function obtenerHora(){

    const ahora = new Date();

    let horas = ahora.getHours();

    let minutos = ahora.getMinutes();

    if(horas < 10){

        horas = "0" + horas;

    }

    if(minutos < 10){

        minutos = "0" + minutos;

    }

    return horas + ":" + minutos;

}

/*==================================================
        AGREGAR HORA A LOS MENSAJES
==================================================*/

function agregarHoraMensaje(){

    return `

        <span class="horaMensaje">

            ${obtenerHora()}

        </span>

    `;

}

/*==================================================
        GUARDAR CONVERSACIÓN
==================================================*/

function guardarConversacion(){

    localStorage.setItem(

        "chatPetCare",

        mensajes.innerHTML

    );

}

/*==================================================
        CARGAR CONVERSACIÓN
==================================================*/

function cargarConversacion(){

    const chatGuardado = localStorage.getItem("chatPetCare");

    if(chatGuardado){

        mensajes.innerHTML = chatGuardado;

    }

}

/*==================================================
        LIMPIAR CHAT
==================================================*/

function limpiarChat(){

    if(confirm("¿Deseas borrar toda la conversación?")){

        mensajes.innerHTML = `

            <div class="mensajeIA">

                <div class="avatarIA">

                    <img src="img/robot.png">

                </div>

                <div class="burbujaIA">

                    👋 Hola.

                    Soy el Agente Inteligente de PetCare.

                    ¿Cómo puedo ayudarte hoy?

                </div>

            </div>

        `;

        guardarConversacion();

    }

}

/*==================================================
        BOTÓN LIMPIAR CHAT
==================================================*/

const botonLimpiar = document.createElement("button");

botonLimpiar.innerHTML = '<i class="fa-solid fa-trash"></i>';

botonLimpiar.className = "btnIcono";

botonLimpiar.title = "Limpiar conversación";

const escribir = document.querySelector(".escribir");

if(escribir){

    escribir.prepend(botonLimpiar);

}

botonLimpiar.addEventListener("click", limpiarChat);

/*==================================================
        GUARDAR AUTOMÁTICAMENTE
==================================================*/

const observador = new MutationObserver(() => {

    guardarConversacion();

});

observador.observe(mensajes, {

    childList: true,

    subtree: true

});

/*==================================================
        CARGAR CHAT AL INICIAR
==================================================*/

window.addEventListener("load", () => {

    cargarConversacion();

});