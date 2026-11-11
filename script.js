$(function () {
    'use strict';

    const app = document.querySelector('.screen-app');
    if (!app) return;

    const $app = $(app);
    const NS = '.paginaPersonal';
    const reducedMotion = matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;
    const duration = reducedMotion ? 0 : 250;

    const screens = [...app.querySelectorAll('.app-screen')];
    const menu = $('#navMenu');
    const hamburger = $('#hamburgerBtn');
    const backdrop = $('#menuBackdrop');
    const stage = app.querySelector('.screen-stage');
    const tabs = app.querySelector('.bottom-tabs');
    const form = document.getElementById('contactForm');
    const fields = [...form.querySelectorAll('input, select, textarea')];
    const steps = [...form.querySelectorAll('.wizard-step')];

    let activeScreen = 'inicio';
    let formStep = 0;
    let graph = null;
    let notificationTimer = null;
    let hydrationCount = 0;

    // Limpiar una instancia anterior si el archivo se vuelve a ejecutar.
    if (typeof app._destroyPersonalPage === 'function') {
        app._destroyPersonalPage();
    }

    $('#hidratarBtn, #hydrationStatus, #hydrationStyles').remove();

    $('<style>', {
        id: 'hydrationStyles',
        text: `
            #hidratarBtn {
                order: 2;
                flex-shrink: 0;
                padding: 7px 10px;
                border: 1px solid #81dbff;
                border-radius: 8px;
                background: linear-gradient(135deg, #165a97, #12305b);
                color: white;
                font: inherit;
                font-size: 11px;
                font-weight: 700;
            }

            #hidratarBtn:hover {
                background: #2178ba;
            }

            #hydrationStatus {
                position: absolute;
                left: 12px;
                right: 12px;
                bottom: calc(78px + env(safe-area-inset-bottom, 0px));
                z-index: 60;
                width: fit-content;
                max-width: calc(100% - 24px);
                margin: 0 auto;
                padding: 10px 14px;
                border: 1px solid #7ce3b2;
                border-radius: 10px;
                background: #103e30;
                color: white;
                box-shadow: 0 8px 25px #0005;
                font-size: 11px;
                text-align: center;
                pointer-events: none;
            }

            .app-header #hamburgerBtn {
                order: 3;
            }

            @media (max-width: 480px) {
                .app-header > .container { gap: 6px; }
                .app-header .navbar-brand { font-size: 13px; }
                .app-header .screen-name { display: none; }

                #hidratarBtn {
                    margin-left: auto;
                    padding: 6px 8px;
                    font-size: 10px;
                }
            }
        `
    }).appendTo('head');

    $('<button>', {
        id: 'hidratarBtn',
        type: 'button',
        text: 'Hidratar',
        'aria-label': 'Reconectar las funciones sin recargar'
    }).insertBefore(hamburger);

    const status = $('<div>', {
        id: 'hydrationStatus',
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': 'true',
        hidden: true
    }).appendTo(app);

    function updateHeight() {
        const height = window.visualViewport
            ? window.visualViewport.height
            : window.innerHeight;

        document.documentElement.style.setProperty(
            '--app-height', height + 'px'
        );
    }

    // MENÚ

    function closeMenu(returnFocus = false) {
        menu.stop(true, true).slideUp(duration);
        hamburger.attr('aria-expanded', 'false');
        backdrop.prop('hidden', true);
        stage.inert = false;
        tabs.inert = false;

        if (returnFocus) hamburger.trigger('focus');
    }

    function toggleMenu() {
        const open = hamburger.attr('aria-expanded') !== 'true';

        hamburger.attr('aria-expanded', String(open));
        backdrop.prop('hidden', !open);
        stage.inert = open;
        tabs.inert = open;

        menu.stop(true, true).slideToggle(duration, function () {
            if (open) $('#cerrarMenu').trigger('focus');
        });
    }

    function menuKeyboard(event) {
        if (hamburger.attr('aria-expanded') !== 'true') return;

        if (event.key === 'Escape') {
            closeMenu(true);
            return;
        }

        if (event.key !== 'Tab') return;

        const controls = [
            hamburger[0],
            ...menu[0].querySelectorAll('button')
        ];

        const index = controls.indexOf(document.activeElement);

        if (event.shiftKey && index <= 0) {
            event.preventDefault();
            controls[controls.length - 1].focus();
        } else if (!event.shiftKey && index === controls.length - 1) {
            event.preventDefault();
            controls[0].focus();
        }
    }

    // CARRUSEL Y NAVEGACIÓN

    function getCarousel() {
        const element = document.getElementById('carruselFotos');

        if (!element || !window.bootstrap?.Carousel) return null;

        return bootstrap.Carousel.getOrCreateInstance(element);
    }

    function updateCarousel() {
        const carousel = getCarousel();
        if (!carousel) return;

        if (
            activeScreen === 'inicio' &&
            !reducedMotion &&
            !document.hidden
        ) {
            carousel.cycle();
        } else {
            carousel.pause();
        }
    }

    function showScreen(id, pushHistory = true, focus = true) {
        if (!screens.some(screen => screen.id === id)) id = 'inicio';

        closeMenu();
        activeScreen = id;

        screens.forEach(screen => {
            screen.hidden = screen.id !== id;
        });

        $app.find('[data-screen]').each(function () {
            if (this.dataset.screen === id) {
                this.setAttribute('aria-current', 'page');
            } else {
                this.removeAttribute('aria-current');
            }
        });

        const label = app.querySelector(
            '.menu-link[data-screen="' + id + '"]'
        );

        $('#screenName').text(
            label ? label.textContent.trim() : 'Inicio'
        );

        if (pushHistory && location.hash !== '#' + id) {
            history.pushState(null, '', '#' + id);
        }

        if (focus) {
            document.getElementById(id).focus({ preventScroll: true });
        }

        if (id === 'grafico' && graph) graph.resize();
        updateCarousel();
    }

    // TEMA

    try {
        document.body.classList.toggle(
            'dark-mode',
            localStorage.getItem('temaPagina') === 'oscuro'
        );
    } catch (_) {}

    function updateTheme() {
        const dark = document.body.classList.contains('dark-mode');

        $('#themeBtn')
            .attr('aria-pressed', String(dark))
            .html(dark
                ? '<i class="bi bi-sun"></i> <span>Modo claro</span>'
                : '<i class="bi bi-moon-stars"></i> <span>Modo oscuro</span>'
            );

        if (graph) {
            const color = dark ? '#e9eef8' : '#172554';
            graph.options.scales.x.ticks.color = color;
            graph.options.scales.y.ticks.color = color;
            graph.update('none');
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');

        try {
            localStorage.setItem(
                'temaPagina',
                document.body.classList.contains('dark-mode')
                    ? 'oscuro' : 'claro'
            );
        } catch (_) {}

        updateTheme();
    }

    // TARJETAS Y FILTROS

    const decks = {};

    app.querySelectorAll('[data-deck]').forEach(container => {
        const items = [...container.children];

        decks[container.dataset.deck] = {
            items,
            filtered: items.slice(),
            index: 0
        };
    });

    function renderDeck(name) {
        const deck = decks[name];

        deck.index = Math.max(
            0, Math.min(deck.index, deck.filtered.length - 1)
        );

        deck.items.forEach(item => { item.hidden = true; });

        if (deck.filtered.length) {
            deck.filtered[deck.index].hidden = false;
        }

        $('[data-count="' + name + '"]').text(
            deck.filtered.length
                ? (deck.index + 1) + ' de ' + deck.filtered.length
                : 'Sin resultados'
        );

        $('[data-prev="' + name + '"]').prop(
            'disabled', deck.index === 0
        );

        $('[data-next="' + name + '"]').prop(
            'disabled', deck.index >= deck.filtered.length - 1
        );
    }

    function filterDeck(name, property, value) {
        const deck = decks[name];

        deck.filtered = deck.items.filter(item =>
            value === 'todos' || item.dataset[property] === value
        );

        deck.index = 0;
        renderDeck(name);
    }

    const filterOptions = {
        academico: [
            { value: 'web2', text: 'Diseño Web II (SIS-0141)' }
        ],
        desarrollo: [
            { value: 'pwa', text: 'Arquitectura PWA' }
        ]
    };

    function updateSecondLayer(value) {
        const choices = filterOptions[value] || [];
        const second = $('#capa2').empty()
            .prop('disabled', !choices.length);

        second.append(new Option(
            choices.length
                ? '-- Seleccione opción --'
                : '-- Primero elija área --',
            ''
        ));

        choices.forEach(choice => {
            second.append(new Option(choice.text, choice.value));
        });

        $('#resultadoFiltro').text('Seleccione las capas anteriores...');
    }

    // GRÁFICO

    function createGraph() {
        if (typeof Chart === 'undefined') return;

        const canvas = document.getElementById('graficoActividades');
        const previous = Chart.getChart(canvas);
        if (previous) previous.destroy();

        graph = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: [
                    'Dormir', 'Estudiar', 'Trabajar',
                    'Videojuegos', 'Comer', 'Otras actividades'
                ],
                datasets: [{
                    label: 'Horas por día',
                    data: [8, 4, 5, 2, 2, 3],
                    backgroundColor: [
                        '#dc3545', '#172554', '#2563eb',
                        '#ef4444', '#64748b', '#0f172a'
                    ],
                    borderRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: reducedMotion ? false : { duration: 400 },
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        ticks: {
                            font: { size: 10 },
                            maxRotation: 35
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: { stepSize: 2 }
                    }
                }
            }
        });
    }

    // FORMULARIO

    function showFormStep(index, focus = false) {
        formStep = Math.max(0, Math.min(index, steps.length - 1));

        steps.forEach((step, i) => {
            step.hidden = i !== formStep;
        });

        $app.find('[data-step]').each(function () {
            this.setAttribute(
                'aria-pressed',
                String(Number(this.dataset.step) === formStep)
            );
        });

        $('#formPrev').prop('disabled', formStep === 0);
        $('#formNext').prop('hidden', formStep === steps.length - 1);
        $('#formSend').prop('hidden', formStep !== steps.length - 1);
        $('#formProgress').text((formStep + 1) + ' / ' + steps.length);

        if (focus) {
            steps[formStep].querySelector(
                'input, select, textarea'
            ).focus({ preventScroll: true });
        }
    }

    function getError(field) {
        if (field.type === 'checkbox') {
            return field.checked
                ? '' : 'Debes aceptar esta casilla para continuar.';
        }

        const value = field.value.trim();

        if (!value) return 'Este campo es obligatorio.';

        if (
            field.id === 'correo' &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
            return 'Ingresa un correo electrónico válido.';
        }

        if (field.id === 'telefono') {
            const digits = value.replace(/\D/g, '');

            if (
                digits.length < 7 ||
                digits.length > 15 ||
                !/^\+?[\d\s()-]+$/.test(value)
            ) {
                return 'Ingresa un número de teléfono válido.';
            }
        }

        return '';
    }

    function validate(field, animate = true) {
        const error = getError(field);
        const output = $('#error-' + field.id);

        $(field)
            .toggleClass('is-invalid', Boolean(error))
            .toggleClass('is-valid', !error)
            .attr('aria-invalid', String(Boolean(error)))
            .attr('aria-describedby', 'error-' + field.id);

        if (error) {
            const wasVisible = output.hasClass('visible');

            output.stop(true, true).text(error).addClass('visible');

            if (animate && !wasVisible) {
                output.hide().fadeIn(duration);
            } else {
                output.show();
            }
        } else {
            output.stop(true, true).fadeOut(
                animate ? duration : 0,
                function () {
                    $(this).removeClass('visible').text('');
                }
            );
        }

        return !error;
    }

    function validateStep() {
        let firstInvalid = null;

        fields.filter(field =>
            field.closest('.wizard-step') === steps[formStep]
        ).forEach(field => {
            field.dataset.tocado = 'true';

            if (!validate(field) && !firstInvalid) {
                firstInvalid = field;
            }
        });

        if (firstInvalid) firstInvalid.focus({ preventScroll: true });
        return !firstInvalid;
    }

    function submitForm(event) {
        event.preventDefault();
        let firstInvalid = null;

        fields.forEach(field => {
            field.dataset.tocado = 'true';

            if (!validate(field, false) && !firstInvalid) {
                firstInvalid = field;
            }
        });

        if (firstInvalid) {
            showFormStep(
                steps.indexOf(firstInvalid.closest('.wizard-step'))
            );

            firstInvalid.focus({ preventScroll: true });
            return;
        }

        form.reset();

        fields.forEach(field => {
            $(field).removeClass('is-valid is-invalid')
                .removeAttr('aria-invalid aria-describedby');

            delete field.dataset.tocado;

            $('#error-' + field.id).stop(true, true)
                .hide().removeClass('visible').text('');
        });

        showFormStep(0);

        $('#alertaBox').stop(true, true).hide().html(
            '<div class="alert alert-success" role="status">' +
            '<strong>¡Formulario validado correctamente!</strong> ' +
            'Es una demostración: no se enviaron ni guardaron datos.' +
            '</div>'
        ).slideDown(duration).delay(3000).slideUp(duration);
    }

    // ACCIONES DE LOS BOTONES

    function runButtonAction(button, event) {
        if (button.hasAttribute('data-screen')) {
            event.preventDefault();
            showScreen(button.dataset.screen);
            return;
        }

        if (button.matches('#hamburgerBtn, #moreMenu')) {
            toggleMenu();
            return;
        }

        if (button.matches('#cerrarMenu, #menuBackdrop')) {
            closeMenu(true);
            return;
        }

        if (button.id === 'themeBtn') {
            toggleTheme();
            return;
        }

        if (button.matches('[data-prev], [data-next]')) {
            const next = Boolean(button.dataset.next);
            const name = button.dataset.next || button.dataset.prev;

            decks[name].index += next ? 1 : -1;
            renderDeck(name);
            return;
        }

        if (button.matches('.boton-musica')) {
            $('.boton-musica').removeClass('activo')
                .attr('aria-pressed', 'false');

            $(button).addClass('activo').attr('aria-pressed', 'true');

            filterDeck('artistas', 'genero', button.dataset.genero);
            return;
        }

        if (button.hasAttribute('data-music')) {
            $('.music-panel').prop('hidden', true);
            $('#musica-' + button.dataset.music).prop('hidden', false);

            $('[data-music]').attr('aria-pressed', 'false');
            $(button).attr('aria-pressed', 'true');
            return;
        }

        if (button.id === 'saludoBtn') {
            const hour = new Date().getHours();
            const greeting = hour < 12
                ? '¡Buenos días!'
                : hour < 19 ? '¡Buenas tardes!' : '¡Buenas noches!';

            $('#interactive-output').text(
                greeting + ' Gracias por visitar mi página personal.'
            );
            return;
        }

        if (button.id === 'formNext') {
            if (validateStep()) showFormStep(formStep + 1, true);
            return;
        }

        if (button.id === 'formPrev') {
            showFormStep(formStep - 1, true);
            return;
        }

        if (button.hasAttribute('data-step')) {
            const target = Number(button.dataset.step);

            if (target > formStep && !validateStep()) return;
            showFormStep(target, true);
        }

        // Bootstrap gestiona sus propios botones del carrusel.
        // El botón Enviar conserva el evento submit del formulario.
    }

    // EVENT BUBBLING Y DELEGACIÓN
    //
    // Un solo controlador de clic en el padre para todos los botones.
    // También funciona al pulsar los iconos dentro de los botones.

    function handleClick(event) {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const button = target.closest('button');

        if (!button || !app.contains(button)) return;
        if (button.matches(':disabled')) return;

        hydrate();
        runButtonAction(button, event);
    }

    function handleFieldEvent(event) {
        const field = event.target;

        if (
            !(field instanceof Element) ||
            !field.matches(
                '#contactForm input, #contactForm select, #contactForm textarea'
            )
        ) return;

        field.dataset.tocado = 'true';
        validate(field);
    }

    function handleChange(event) {
        const field = event.target;

        if (field.id === 'gameFilter') {
            filterDeck('juegos', 'categoria', field.value);
        } else if (field.id === 'capa1') {
            updateSecondLayer(field.value);
        } else if (field.id === 'capa2') {
            $('#resultadoFiltro').text(
                field.value
                    ? 'Capa 3: ' + $(field).find('option:selected').text()
                    : 'Seleccione las capas anteriores...'
            );
        }

        handleFieldEvent(event);
    }

    function handleKeydown(event) {
        menuKeyboard(event);

        if (event.defaultPrevented) return;

        if (
            event.key === 'Enter' &&
            event.target.matches('#contactForm input:not([type="checkbox"])') &&
            formStep < steps.length - 1
        ) {
            event.preventDefault();

            if (validateStep()) showFormStep(formStep + 1, true);
        }
    }

    function handleSubmit(event) {
        if (event.target === form) submitForm(event);
    }

    // Reconectar únicamente los eventos propios del contenedor.
    function connectEvents() {
        $app.off(NS)
            .on('click' + NS, handleClick)
            .on('change' + NS, handleChange)
            .on('input' + NS + ' focusout' + NS, handleFieldEvent)
            .on('keydown' + NS, handleKeydown)
            .on('submit' + NS, handleSubmit);
    }

    function hydrate() {
        connectEvents();

        hydrationCount += 1;
        app.dataset.hidratado = 'true';
        app.dataset.hidrataciones = String(hydrationCount);

        clearTimeout(notificationTimer);

        status.empty().prop('hidden', false)
            .text('¡Página hidratada correctamente!');

        notificationTimer = setTimeout(function () {
            status.prop('hidden', true);
            notificationTimer = null;
        }, 1800);
    }

    // EVENTOS DEL NAVEGADOR: SE REGISTRAN UNA SOLA VEZ

    $(window).off(NS)
        .on('resize' + NS + ' orientationchange' + NS, updateHeight)
        .on('popstate' + NS + ' hashchange' + NS, function () {
            showScreen(location.hash.slice(1), false);
        })
        .on('pagehide' + NS, function () {
            clearTimeout(notificationTimer);
            notificationTimer = null;
            status.prop('hidden', true);
            $('#alertaBox').stop(true, true);

            const carousel = getCarousel();
            if (carousel) carousel.pause();
        })
        .on('pageshow' + NS, function () {
            updateHeight();
            updateCarousel();
        });

    $(document).off('visibilitychange' + NS)
        .on('visibilitychange' + NS, updateCarousel);

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateHeight);
    }

    // Retirar el detector de captura de la versión anterior.
    if (typeof app._hydrationClickHandler === 'function') {
        document.removeEventListener(
            'click', app._hydrationClickHandler, true
        );

        delete app._hydrationClickHandler;
    }

    // Limpieza para una eventual reinicialización completa del archivo.
    app._destroyPersonalPage = function () {
        clearTimeout(notificationTimer);
        $app.off(NS);
        $(window).off(NS);
        $(document).off(NS);

        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', updateHeight);
        }

        if (graph) {
            graph.destroy();
            graph = null;
        }

        $('#alertaBox, #navMenu, .mensaje-error').stop(true, true);
    };

    // INICIO

    stage.inert = false;
    tabs.inert = false;
    hamburger.prop('disabled', false);

    updateHeight();
    Object.keys(decks).forEach(renderDeck);

    $('.boton-musica').attr('aria-pressed', 'false')
        .filter('.activo').attr('aria-pressed', 'true');

    createGraph();
    updateTheme();
    showFormStep(0);
    connectEvents();

    app.dataset.hidratado = 'true';
    app.dataset.hidrataciones = '0';

    showScreen(location.hash.slice(1) || 'inicio', false, false);
});
