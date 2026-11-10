// Página personal: navegación sin desplazamiento, jQuery y validaciones.
$(function () {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reducedMotion ? 0 : 250;
    const screens = Array.from(document.querySelectorAll('.app-screen'));
    const menu = $('#navMenu');
    const hamburger = $('#hamburgerBtn');
    const backdrop = $('#menuBackdrop');
    let activeScreen = 'inicio';
    let graph = null;

    function closeMenu(returnFocus = false) {
        menu.stop(true, true).slideUp(duration);
        hamburger.attr('aria-expanded', 'false');
        backdrop.prop('hidden', true);
        document.querySelector('.screen-stage').inert = false;
        document.querySelector('.bottom-tabs').inert = false;
        if (returnFocus) hamburger.trigger('focus');
    }
    function toggleMenu() {
        const open = hamburger.attr('aria-expanded') !== 'true';
        hamburger.attr('aria-expanded', String(open));
        backdrop.prop('hidden', !open);
        document.querySelector('.screen-stage').inert = open;
        document.querySelector('.bottom-tabs').inert = open;
        menu.stop(true, true).slideToggle(duration, function () {
            if (open) $('#cerrarMenu').trigger('focus');
        });
    }
    hamburger.on('click', toggleMenu);
    $('#moreMenu').on('click', toggleMenu);
    $('#cerrarMenu, #menuBackdrop').on('click', () => closeMenu(true));
    $(document).on('keydown', function (event) {
        if (hamburger.attr('aria-expanded') !== 'true') return;
        if (event.key === 'Escape') { closeMenu(true); return; }
        if (event.key === 'Tab') {
            const controls = [hamburger[0], ...menu[0].querySelectorAll('button')];
            const index = controls.indexOf(document.activeElement);
            if (event.shiftKey && index <= 0) {
                event.preventDefault(); controls[controls.length - 1].focus();
            } else if (!event.shiftKey && index === controls.length - 1) {
                event.preventDefault(); controls[0].focus();
            }
        }
    });

    function showScreen(id, pushHistory = true, focus = true) {
        if (!screens.some(screen => screen.id === id)) id = 'inicio';
        closeMenu();
        activeScreen = id;
        screens.forEach(screen => { screen.hidden = screen.id !== id; });
        $('[data-screen]').each(function () {
            if (this.dataset.screen === id) this.setAttribute('aria-current', 'page');
            else this.removeAttribute('aria-current');
        });
        const label = document.querySelector('.menu-link[data-screen="' + id + '"]');
        $('#screenName').text(label ? label.textContent.trim() : 'Inicio');
        if (pushHistory && location.hash !== '#' + id) history.pushState(null, '', '#' + id);
        const screen = document.getElementById(id);
        if (focus) screen.focus({ preventScroll: true });
        if (id === 'grafico' && graph) requestAnimationFrame(() => graph.resize());
        if (typeof bootstrap !== 'undefined' && bootstrap.Carousel) {
            const carousel = bootstrap.Carousel.getOrCreateInstance(document.getElementById('carruselFotos'));
            if (id === 'inicio' && !reducedMotion) carousel.cycle();
            else carousel.pause();
        }
    }
    $('[data-screen]').on('click', function (event) {
        event.preventDefault(); showScreen(this.dataset.screen);
    });
    $(window).on('popstate hashchange', () => showScreen(location.hash.slice(1), false));

    // Ajustar a la parte visible de la pantalla, incluido el teclado del móvil.
    function updateHeight() {
        const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        document.documentElement.style.setProperty('--app-height', height + 'px');
    }
    $(window).on('resize orientationchange', updateHeight);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', updateHeight);
    updateHeight();
    if (window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        console.log('Dispositivo Móvil o Tablet Detectado: Cargando Modo PWA');
    }

    // Tema guardado: conservar el comportamiento original.
    try { document.body.classList.toggle('dark-mode', localStorage.getItem('temaPagina') === 'oscuro'); } catch (_) { /* El tema funciona aunque el almacenamiento no esté disponible. */ }
    function updateTheme() {
        const dark = document.body.classList.contains('dark-mode');
        $('#themeBtn').attr('aria-pressed', String(dark)).html(dark
            ? '<i class="bi bi-sun"></i> <span>Modo claro</span>'
            : '<i class="bi bi-moon-stars"></i> <span>Modo oscuro</span>');
        if (graph) {
            const color = dark ? '#e9eef8' : '#172554';
            graph.options.scales.x.ticks.color = color;
            graph.options.scales.y.ticks.color = color;
            graph.update();
        }
    }
    $('#themeBtn').on('click', function () {
        document.body.classList.toggle('dark-mode');
        try { localStorage.setItem('temaPagina', document.body.classList.contains('dark-mode') ? 'oscuro' : 'claro'); } catch (_) { /* Almacenamiento opcional. */ }
        updateTheme();
    });
    updateTheme();

    // Cada tarjeta original sigue disponible por medio de anterior/siguiente.
    const decks = {};
    document.querySelectorAll('[data-deck]').forEach(function (container) {
        const name = container.dataset.deck;
        decks[name] = { items: Array.from(container.children), filtered: [], index: 0 };
        decks[name].filtered = decks[name].items.slice();
    });
    function renderDeck(name) {
        const deck = decks[name];
        deck.index = Math.max(0, Math.min(deck.index, deck.filtered.length - 1));
        deck.items.forEach(item => { item.hidden = true; });
        if (deck.filtered.length) deck.filtered[deck.index].hidden = false;
        $('[data-count="' + name + '"]').text(deck.filtered.length
            ? (deck.index + 1) + ' de ' + deck.filtered.length : 'Sin resultados');
        $('[data-prev="' + name + '"]').prop('disabled', deck.index === 0);
        $('[data-next="' + name + '"]').prop('disabled', deck.index >= deck.filtered.length - 1);
    }
    function filterDeck(name, property, value) {
        const deck = decks[name];
        deck.filtered = deck.items.filter(item => value === 'todos' || item.dataset[property] === value);
        deck.index = 0; renderDeck(name);
    }
    $('[data-prev], [data-next]').on('click', function () {
        const next = Boolean(this.dataset.next);
        const name = this.dataset.next || this.dataset.prev;
        decks[name].index += next ? 1 : -1;
        renderDeck(name);
    });
    Object.keys(decks).forEach(renderDeck);
    $('.boton-musica').on('click', function () {
        $('.boton-musica').removeClass('activo').attr('aria-pressed', 'false');
        $(this).addClass('activo').attr('aria-pressed', 'true');
        filterDeck('artistas', 'genero', this.dataset.genero);
    });
    $('.boton-musica').attr('aria-pressed', 'false').filter('.activo').attr('aria-pressed', 'true');
    $('#gameFilter').on('change', function () { filterDeck('juegos', 'categoria', this.value); });
    $('[data-music]').on('click', function () {
        const selected = this.dataset.music;
        $('.music-panel').prop('hidden', true);
        $('#musica-' + selected).prop('hidden', false);
        $('[data-music]').attr('aria-pressed', 'false');
        $(this).attr('aria-pressed', 'true');
    });

    // Filtro de tres capas del PDF: área -> opción -> resultado.
    const options = {
        academico: [{ value: 'web2', text: 'Diseño Web II (SIS-0141)' }],
        desarrollo: [{ value: 'pwa', text: 'Arquitectura PWA' }]
    };
    $('#capa1').on('change', function () {
        const choices = options[this.value] || [];
        const second = $('#capa2').empty().prop('disabled', !choices.length);
        second.append(new Option(choices.length ? '-- Seleccione opción --' : '-- Primero elija área --', ''));
        choices.forEach(choice => second.append(new Option(choice.text, choice.value)));
        $('#resultadoFiltro').text('Seleccione las capas anteriores...');
    });
    $('#capa2').on('change', function () {
        $('#resultadoFiltro').text(this.value
            ? 'Capa 3: ' + $(this).find('option:selected').text()
            : 'Seleccione las capas anteriores...');
    });

    // Gráfico original de 24 horas, redimensionado al abrir su pantalla.
    if (typeof Chart !== 'undefined') {
        graph = new Chart(document.getElementById('graficoActividades'), {
            type: 'bar',
            data: {
                labels: ['Dormir', 'Estudiar', 'Trabajar', 'Videojuegos', 'Comer', 'Otras actividades'],
                datasets: [{ label: 'Horas por día', data: [8, 4, 5, 2, 2, 3],
                    backgroundColor: ['#dc3545', '#172554', '#2563eb', '#ef4444', '#64748b', '#0f172a'], borderRadius: 7 }]
            },
            options: { responsive: true, maintainAspectRatio: false, animation: !reducedMotion,
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { font: { size: 10 }, maxRotation: 35 } }, y: { beginAtZero: true, max: 10, ticks: { stepSize: 2 } } }
            }
        });
        updateTheme();
    }
    $('#saludoBtn').on('click', function () {
        const hour = new Date().getHours();
        $('#interactive-output').text((hour < 12 ? '¡Buenos días!' : hour < 19 ? '¡Buenas tardes!' : '¡Buenas noches!')
            + ' Gracias por visitar mi página personal.');
    });

    // Formulario en pasos, con los once campos y validación original.
    const form = document.getElementById('contactForm');
    const fields = Array.from(form.querySelectorAll('input, select, textarea'));
    const steps = Array.from(form.querySelectorAll('.wizard-step'));
    let formStep = 0;
    function showFormStep(index, focus = false) {
        formStep = Math.max(0, Math.min(index, steps.length - 1));
        steps.forEach((step, i) => { step.hidden = i !== formStep; });
        $('[data-step]').each(function () { this.setAttribute('aria-pressed', String(Number(this.dataset.step) === formStep)); });
        $('#formPrev').prop('disabled', formStep === 0);
        $('#formNext').prop('hidden', formStep === steps.length - 1);
        $('#formSend').prop('hidden', formStep !== steps.length - 1);
        $('#formProgress').text((formStep + 1) + ' / ' + steps.length);
        if (focus) steps[formStep].querySelector('input,select,textarea').focus({ preventScroll: true });
    }
    function getError(field) {
        if (field.type === 'checkbox') return field.checked ? '' : 'Debes aceptar esta casilla para continuar.';
        const value = field.value.trim();
        if (!value) return 'Este campo es obligatorio.';
        if (field.id === 'correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ingresa un correo electrónico válido.';
        if (field.id === 'telefono') {
            const digits = value.replace(/\D/g, '');
            if (digits.length < 7 || digits.length > 15 || !/^\+?[\d\s()-]+$/.test(value)) return 'Ingresa un número de teléfono válido.';
        }
        return '';
    }
    function validate(field, animate = true) {
        const error = getError(field);
        const output = $('#error-' + field.id);
        $(field).toggleClass('is-invalid', Boolean(error)).toggleClass('is-valid', !error)
            .attr('aria-invalid', String(Boolean(error))).attr('aria-describedby', 'error-' + field.id);
        if (error) {
            const wasVisible = output.hasClass('visible');
            output.stop(true, true).text(error).addClass('visible');
            if (animate && !wasVisible) output.hide().fadeIn(duration); else output.show();
        } else {
            output.stop(true, true).fadeOut(animate ? duration : 0, function () { $(this).removeClass('visible').text(''); });
        }
        return !error;
    }
    function validateStep() {
        const currentFields = fields.filter(field => field.closest('.wizard-step') === steps[formStep]);
        let firstInvalid = null;
        currentFields.forEach(field => {
            field.dataset.tocado = 'true';
            if (!validate(field) && !firstInvalid) firstInvalid = field;
        });
        if (firstInvalid) firstInvalid.focus({ preventScroll: true });
        return !firstInvalid;
    }
    fields.forEach(function (field) {
        $(field).on('blur change', function () { this.dataset.tocado = 'true'; validate(this); });
        $(field).on('input', function () { if (this.dataset.tocado === 'true') validate(this); });
    });
    $('#formNext').on('click', function () { if (validateStep()) showFormStep(formStep + 1, true); });
    $('#formPrev').on('click', () => showFormStep(formStep - 1, true));
    $('[data-step]').on('click', function () { showFormStep(Number(this.dataset.step)); });
    $(form).on('keydown', function (event) {
        if (event.key === 'Enter' && event.target.matches('input:not([type="checkbox"])') && formStep < steps.length - 1) {
            event.preventDefault(); if (validateStep()) showFormStep(formStep + 1, true);
        }
    });
    $(form).on('submit', function (event) {
        event.preventDefault();
        let firstInvalid = null;
        fields.forEach(field => {
            field.dataset.tocado = 'true';
            if (!validate(field, false) && !firstInvalid) firstInvalid = field;
        });
        if (firstInvalid) {
            showFormStep(steps.indexOf(firstInvalid.closest('.wizard-step')));
            firstInvalid.focus({ preventScroll: true });
            return;
        }
        form.reset();
        fields.forEach(field => {
            $(field).removeClass('is-valid is-invalid').removeAttr('aria-invalid aria-describedby');
            delete field.dataset.tocado;
            $('#error-' + field.id).stop(true, true).hide().removeClass('visible').text('');
        });
        showFormStep(0);
        $('#alertaBox').stop(true, true).hide().html('<div class="alert alert-success" role="status"><strong>¡Formulario validado correctamente!</strong> Es una demostración: no se enviaron ni guardaron datos.</div>')
            .slideDown(duration).delay(3000).slideUp(duration);
    });
    showFormStep(0);
    showScreen(location.hash.slice(1) || 'inicio', false, false);
});
