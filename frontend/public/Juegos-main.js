document.addEventListener('DOMContentLoaded', () => {

    // Inicializar iconos Lucide
    lucide.createIcons();

    // === NAVBAR ===
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarMenu = document.getElementById('navbarMenu');
    const dropdown = document.getElementById('juegosDropdown');
    const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const navbar = document.querySelector('.navbar');

    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', () => {
            navbarMenu.classList.toggle('active');
        });
    }

    // Cerrar menú móvil al hacer clic en un enlace (no el dropdown-toggle)
    const navLinks = document.querySelectorAll('.navbar-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (!this.classList.contains('dropdown-toggle')) {
                navbarMenu.classList.remove('active');
            }
        });
    });

    // Dropdown toggle
    dropdownToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function (e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // Prevenir cierre al hacer clic dentro del dropdown
    dropdownMenu.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // Cerrar dropdown al seleccionar una opción
    const dropdownLinks = dropdownMenu.querySelectorAll('a');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            dropdown.classList.remove('active');
            navbarMenu.classList.remove('active');

            // Scroll a la materia correspondiente
            const href = this.getAttribute('href').substring(1);
            const targetCard = document.querySelector(`.game-card.${href}`);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => highlightSelectedCard(targetCard), 500);
            }
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // === ANIMACIONES SCROLL ===
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }, index * 100);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));

    // === SMOOTH SCROLL ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || this.classList.contains('dropdown-toggle')) return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // === BOTONES JUGAR ===
    const playButtons = document.querySelectorAll('.play-btn');
    playButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = e.target.closest('.game-card');
            const subject = card.dataset.subject;
            startGame(subject);
        });
    });

    // Click en la card resalta
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('click', function () {
            highlightSelectedCard(this);
        });

        // Efecto hover en el icono
        card.addEventListener('mouseenter', () => {
            const icon = card.querySelector('.game-icon-wrapper i');
            if (icon) {
                icon.style.transform = 'scale(1.2) rotate(10deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        card.addEventListener('mouseleave', () => {
            const icon = card.querySelector('.game-icon-wrapper i');
            if (icon) icon.style.transform = 'scale(1) rotate(0deg)';
        });
    });
});

// Resaltar card seleccionada
function highlightSelectedCard(card) {
    document.querySelectorAll('.game-card').forEach(c => {
        c.style.transform = '';
    });
    card.style.transform = 'translateY(-8px) scale(1.05)';
    setTimeout(() => { card.style.transform = ''; }, 600);
}

// Iniciar juego → modal
function startGame(subject) {
    const subjectNames = {
        'matematicas': 'Matemáticas',
        'ciencias': 'Ciencias',
        'lengua': 'Lengua',
        'sociales': 'Sociales'
    };
    showGameModal(subjectNames[subject] || subject, subject);
}

// Crear y mostrar modal
function showGameModal(subjectName, subject) {
    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">CONFIGURAR JUEGO</h2>
                <button class="modal-close" onclick="closeGameModal()">✕</button>
            </div>
            <div class="modal-body">
                <div class="modal-section">
                    <h3>MATERIA SELECCIONADA</h3>
                    <p class="selected-subject">${subjectName}</p>
                </div>
                <div class="modal-section">
                    <h3>MODO DE JUEGO</h3>
                    <div class="modal-options">
                        <button class="option-btn" data-mode="normal">Normal</button>
                        <button class="option-btn" data-mode="competencia">Competencia</button>
                        <button class="option-btn" data-mode="multijugador">Multijugador</button>
                    </div>
                </div>
                <div class="modal-section">
                    <h3>DIFICULTAD</h3>
                    <div class="modal-options">
                        <button class="option-btn" data-difficulty="facil">Fácil</button>
                        <button class="option-btn" data-difficulty="medio">Medio</button>
                        <button class="option-btn" data-difficulty="dificil">Difícil</button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="start-game-btn" onclick="launchGame('${subject}')">¡COMENZAR!</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    // Selección de opciones
    modal.querySelectorAll('.option-btn').forEach(button => {
        button.addEventListener('click', function () {
            const section = this.closest('.modal-section');
            section.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Cerrar al hacer clic en el fondo
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeGameModal();
    });
}

// Cerrar modal
function closeGameModal() {
    const modal = document.querySelector('.game-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Lanzar juego
function launchGame(subject) {
    const modal = document.querySelector('.game-modal');
    const selectedMode = modal.querySelector('.option-btn[data-mode].selected');
    const selectedDifficulty = modal.querySelector('.option-btn[data-difficulty].selected');

    if (!selectedMode || !selectedDifficulty) {
        alert('Por favor selecciona un modo de juego y una dificultad');
        return;
    }

    const subjectNames = {
        'matematicas': 'Matemáticas',
        'ciencias': 'Ciencias',
        'lengua': 'Lengua',
        'sociales': 'Sociales'
    };

    alert(`¡Próximamente!\n\nMateria: ${subjectNames[subject]}\nModo: ${selectedMode.dataset.mode}\nDificultad: ${selectedDifficulty.dataset.difficulty}`);
    closeGameModal();
}
