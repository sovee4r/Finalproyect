document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarMenu = document.getElementById('navbarMenu');
    const dropdown = document.getElementById('juegosDropdown');
    const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const navbar = document.querySelector('.navbar');
    const logoBtn = document.getElementById('logoBtn');
    
    // Toggle del menú móvil
    if (navbarToggle) {
        navbarToggle.addEventListener('click', function() {
            navbarMenu.classList.toggle('active');
        });
    }
    
    // Botón del logo para ir al inicio
    if (logoBtn) {
        logoBtn.addEventListener('click', function() {
            window.scrollTo({ 
                top: 0, 
                behavior: 'smooth' 
            });
            // Cerrar el menú móvil si está abierto
            navbarMenu.classList.remove('active');
        });
    }
    
    // Cerrar menú móvil al hacer clic en un enlace
    const navLinks = document.querySelectorAll('.navbar-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // No cerrar el menú si es el toggle del dropdown
            if (!this.classList.contains('dropdown-toggle')) {
                navbarMenu.classList.remove('active');
            }
        });
    });
    
    // Funcionalidad del dropdown
    dropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });
    
    // Cerrar dropdown al hacer clic en una opción
    const dropdownLinks = dropdownMenu.querySelectorAll('a');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', function() {
            dropdown.classList.remove('active');
            navbarMenu.classList.remove('active');
        });
    });
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // Prevenir que el dropdown se cierre al hacer clic dentro de él
    dropdownMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Efecto de scroll en el navbar
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Animaciones al hacer scroll
    handleScrollAnimations();
    
    // Smooth scroll para enlaces ancla
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Ignorar el enlace #juegos ya que es solo para el dropdown
            if (href === '#juegos') {
                return;
            }
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Función para manejar las animaciones de scroll
function handleScrollAnimations() {
    const animatedElements = document.querySelectorAll('.scroll-animate');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Agregar delay escalonado para los elementos
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Función para el botón de comenzar a jugar
function startGame() {
    alert('¡Próximamente! El juego estará disponible pronto.');
}
