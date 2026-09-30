// ==========================================
// NOSOTROS - PETCARE
// ==========================================

// Animación sencilla al hacer scroll
document.addEventListener("DOMContentLoaded", function () {

    const cards = document.querySelectorAll(".info-card, .feature");

    const observer = new IntersectionObserver(
        function (entries) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                }

            });

        },
        {
            threshold: 0.15
        }
    );

    cards.forEach(function (card) {
        observer.observe(card);
    });

});