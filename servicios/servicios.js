// =============================
// BÚSQUEDA DE SERVICIOS
// =============================

const buscador = document.getElementById("buscarServicio");
const servicios = document.querySelectorAll(".service-card");

buscador.addEventListener("input", function () {

    const texto = this.value.toLowerCase().trim();

    servicios.forEach(servicio => {

        const nombre = servicio.dataset.name.toLowerCase();
        const categoria = servicio.dataset.category.toLowerCase();
        const contenido = servicio.textContent.toLowerCase();

        if (
            nombre.includes(texto) ||
            categoria.includes(texto) ||
            contenido.includes(texto)
        ) {

            servicio.style.display = "block";

        } else {

            servicio.style.display = "none";

        }

    });

});


// =============================
// FILTRO POR CATEGORÍA
// =============================

const categorias = document.querySelectorAll(".category");

categorias.forEach(categoria => {

    categoria.addEventListener("click", function () {

        categorias.forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");

        const filtro = this.dataset.category;

        servicios.forEach(servicio => {

            if (
                filtro === "todos" ||
                servicio.dataset.category === filtro
            ) {

                servicio.style.display = "block";

            } else {

                servicio.style.display = "none";

            }

        });

    });

});


// =============================
// FAVORITOS
// =============================

const favoritos = document.querySelectorAll(".favorite");

favoritos.forEach(favorito => {

    favorito.addEventListener("click", function (event) {

        event.stopPropagation();

        this.classList.toggle("active");

        const icono = this.querySelector("i");

        if (this.classList.contains("active")) {

            icono.classList.remove("bi-heart");
            icono.classList.add("bi-heart-fill");

        } else {

            icono.classList.remove("bi-heart-fill");
            icono.classList.add("bi-heart");

        }

    });

});


// =============================
// MODAL DEL SERVICIO
// =============================

function abrirServicio(nombre) {

    document.getElementById("nombreServicio").textContent = nombre;

    const modal = new bootstrap.Modal(
        document.getElementById("servicioModal")
    );

    modal.show();

}


// =============================
// SOLICITAR SERVICIO
// =============================

function solicitarServicio() {

    alert(
        "¡Solicitud realizada! 🐾\n\n" +
        "Pronto podrás coordinar el servicio con el establecimiento."
    );

}


// =============================
// BOTÓN DE FILTROS
// =============================

document
    .getElementById("btnFiltros")
    .addEventListener("click", function () {

        alert(
            "Filtros disponibles:\n\n" +
            "• Tipo de servicio\n" +
            "• Ubicación\n" +
            "• Calificación\n" +
            "• Disponibilidad"
        );

    });