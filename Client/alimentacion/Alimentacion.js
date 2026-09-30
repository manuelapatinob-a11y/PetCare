document.addEventListener("DOMContentLoaded", function () {

  // Inicializa los iconos de Lucide
  lucide.createIcons();


  // =========================
  // MENÚ MOBILE
  // =========================

  const sidebar = document.getElementById("sidebar");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const sidebarOverlay = document.getElementById("sidebarOverlay");


  function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("active");

    document.body.style.overflow = "hidden";
  }


  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");

    document.body.style.overflow = "";
  }


  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", function () {

      if (sidebar.classList.contains("open")) {
        closeSidebar();
      } else {
        openSidebar();
      }

    });
  }


  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }


  // =========================
  // CERRAR SIDEBAR AL CAMBIAR
  // TAMAÑO DE PANTALLA
  // =========================

  window.addEventListener("resize", function () {

    if (window.innerWidth > 850) {
      closeSidebar();
    }

  });


  // =========================
  // SELECCIÓN DE MASCOTA
  // =========================

  const petCards = document.querySelectorAll(".pet-card");


  petCards.forEach(function (card) {

    card.addEventListener("click", function () {

      petCards.forEach(function (pet) {

        pet.classList.remove("selected");

        const status = pet.querySelector(".pet-status");

        if (status) {
          status.classList.remove("online");
        }

      });


      card.classList.add("selected");

      const selectedStatus = card.querySelector(".pet-status");

      if (selectedStatus) {
        selectedStatus.classList.add("online");
      }


      const selectedPet = card.dataset.pet;

      console.log("Mascota seleccionada:", selectedPet);

    });

  });


  // =========================
  // SUBMENÚ ALIMENTACIÓN
  // =========================

  const subNavItems = document.querySelectorAll(".sub-nav-item");


  subNavItems.forEach(function (item) {

    item.addEventListener("click", function () {

      subNavItems.forEach(function (button) {
        button.classList.remove("active");
      });


      item.classList.add("active");

    });

  });


  // =========================
  // MENÚ PRINCIPAL
  // =========================

  const navItems = document.querySelectorAll(".nav-item");


  navItems.forEach(function (item) {

    item.addEventListener("click", function () {

      navItems.forEach(function (nav) {
        nav.classList.remove("active");
      });


      item.classList.add("active");


      // En móvil cierra automáticamente
      if (window.innerWidth <= 850) {
        closeSidebar();
      }

    });

  });


});