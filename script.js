// Página personal: hidratación manual y prevención de eventos duplicados.
$(function () {
    'use strict';

    const app = document.querySelector('.screen-app');

    if (!app || document.getElementById('hidratarBtn')) return;

    const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    const duration = reducedMotion ? 0 : 250;
    const namespace = '.paginaPersonal';

    let graph = null;
    let notificationTimer = null;

    // Estilos del botón y del mensaje, sin modificar el HTML.
    $('<style>', {
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
                box-shadow: 0 0 12px #38bdf833;
            }

            #hidratarBtn:disabled {
                opacity: 1;
                background: #155c43;
                border-color: #79e3b4;
                cursor: default;
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
                padding: 12px 16px;
                border: 1px solid #7ce3b2;
                border-radius: 10px;
                background: #103e30;
                color: white;
                box-shadow: 0 8px 25px #0005;
                font-size: 12px;
                text-align: center;
                pointer-events: none;
            }

            .app-header #hamburgerBtn {
                order: 3;
            }

            @media (max-width: 480px) {
                .app-header > .container {
                    gap: 6px;
                }

                .app-header .navbar-brand {
                    font-size: 13px;
                }

                .app-header .screen-name {
                    display: none;
                }

                #hidratarBtn {
                    margin-left: auto;
                    padding: 6px 8px;
                    font-size: 10px;
                }
            }
        `
    }).appendTo('head');

    const hydrationButton = $('<button>', {
        id: 'hidratarBtn',
        type: 'button',
        text: 'Hidratar',
        'aria-label': 'Hidratar y activar la página'
    });

    hydrationButton.insertBefore('#hamburgerBtn');

    const hydrationStatus = $('<div>', {
        id: 'hydrationStatus',
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': 'true',
        hidden: true
    }).appendTo(app);

    app.dataset.hidratado = 'false';

    // Mostrar una vista inicial estática.
    $('.app-screen').prop('hidden', true);
    $('#inicio').prop('hidden', false);

    document.querySelector('.screen-stage').inert = true;
    document.querySelector('.bottom-tabs').inert = true;
    $('#hamburgerBtn').prop('disabled', true);

    // El tema y la altura se preparan antes de activar las interacciones.
    try {
        document.body.classList.toggle(
            'dark-mode',
            localStorage.getItem('temaPagina') === 'oscuro'
        );
    } catch (_) {
        // El almacenamiento es opcional.
    }

    function updateHeight() {
        const height = window.visualViewport
            ? window.visualViewport.height
            : window.innerHeight;

        document.documentElement.style.setProperty(
            '--app-height',
            height + 'px'
        );
    }

    $(window)
        .off('resize' + namespace + ' orientationchange' + namespace)
        .on(
            'resize' + namespace + ' orientationchange' + namespace,
            updateHeight
        );

    if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
        window.visualViewport.addEventListener('resize', updateHeight);
    }

    updateHeight();

    // Mantener el carrusel quieto durante la vista estática.
    function pauseCarousel() {
        const element = document.getElementById('carruselFotos');

        if (element && window.bootstrap?.Carousel) {
            bootstrap.Carousel.getOrCreateInstance(element).pause();
        }
    }

    pauseCarousel();

    // Vincular siempre con limpieza explícita y un namespace propio.
    function bind(target, events, handler) {
        const namedEvents = events
            .split(/\s+/)
            .map(event => event + namespace)
            .join(' ');

        $(target)
            .off(namedEvents)
            .on(namedEvents, handler);
    }

    function hidratarInterfaz() {
        // Evitar ejecutar la inicialización más de una vez.
        if (app.dataset.hidratado === 'true') return;

        const screens = Array.from(
            document.querySelectorAll('.app-screen')
        );

        const menu = $('#navMenu');
        const hamburger = $('#hamburgerBtn');
        const backdrop = $('#menuBackdrop');

        document.querySelector('.screen-stage').inert = false;
        document.querySelector('.bottom-tabs').inert = false;
        hamburger.prop('disabled', false);

        // MENÚ

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

        bind(hamburger, 'click', toggleMenu);
        bind('#moreMenu', 'click', toggleMenu);

        bind('#cerrarMenu, #menuBackdrop', 'click', function () {
            closeMenu(true);
        });

        bind(document, 'keydown', function (event) {
            if (hamburger.attr('aria-expanded') !== 'true') return;

            if (event.key === 'Escape') {
                closeMenu(true);
                return;
            }

            if (event.key === 'Tab') {
                const controls = [
                    hamburger[0],
                    ...menu[0].querySelectorAll('button')
                ];

                const index = controls.indexOf(document.activeElement);

                if (event.shiftKey && index <= 0) {
                    event.preventDefault();
                    controls[controls.length - 1].focus();
                } else if (
                    !event.shiftKey &&
                    index === controls.length - 1
                ) {
                    event.preventDefault();
                    controls[0].focus();
                }
            }
        });

        // NAVEGACIÓN SIN SCROLL

        function showScreen(id, pushHistory = true, focus = true) {
            if (!screens.some(screen => screen.id === id)) {
                id = 'inicio';
            }

            closeMenu();

            screens.forEach(screen => {
                screen.hidden = screen.id !== id;
            });

            $('[data-screen]').each(function () {
                if (this.dataset.screen === id) {
                    this.setAttribute('aria-current', 'page');
                } else {
                    this.removeAttribute('aria-current');
                }
            });

            const label = document.querySelector(
                '.menu-link[data-screen="' + id + '"]'
            );

            $('#screenName').text(
                label ? label.textContent.trim() : 'Inicio'
            );

            if (pushHistory && location.hash !== '#' + id) {
                history.pushState(null, '', '#' + id);
            }

            if (focus) {
                document.getElementById(id).focus({
                    preventScroll: true
                });
            }

            if (id === 'grafico' && graph) {
                graph.resize();
            }

            const carouselElement = document.getElementById(
                'carruselFotos'
            );

            if (carouselElement && window.bootstrap?.Carousel) {
                const carousel = bootstrap.Carousel
                    .getOrCreateInstance(carouselElement);

                if (id === 'inicio' && !reducedMotion) {
                    carousel.cycle();
                } else {
                    carousel.pause();
                }
            }
        }

        bind('[data-screen]', 'click', function (event) {
            event.preventDefault();
            showScreen(this.dataset.screen);
        });

        bind(window, 'popstate hashchange', function () {
            showScreen(location.hash.slice(1), false);
        });

        // TEMA CLARO Y OSCURO

        function updateTheme() {
            const dark = document.body.classList.contains('dark-mode');

            $('#themeBtn')
                .attr('aria-pressed', String(dark))
                .html(
                    dark
                        ? '<i class="bi bi-sun"></i> <span>Modo claro</span>'
                        : '<i class="bi bi-moon-stars"></i> <span>Modo oscuro</span>'
                );

            if (graph) {
                const color = dark ? '#e9eef8' : '#172554';

                graph.options.scales.x.ticks.color = color;
                graph.options.scales.y.ticks.color = color;
                graph.update();
            }
        }

        bind('#themeBtn', 'click', function () {
            document.body.classList.toggle('dark-mode');

            try {
                localStorage.setItem(
                    'temaPagina',
                    document.body.classList.contains('dark-mode')
                        ? 'oscuro'
                        : 'claro'
                );
            } catch (_) {
                // El tema funciona sin almacenamiento.
            }

            updateTheme();
        });

        updateTheme();

        // TARJETAS PAGINADAS

        const decks = {};

        document.querySelectorAll('[data-deck]').forEach(container => {
            const items = Array.from(container.children);

            decks[container.dataset.deck] = {
                items,
                filtered: items.slice(),
                index: 0
            };
        });

        function renderDeck(name) {
            const deck = decks[name];

            deck.index = Math.max(
                0,
                Math.min(deck.index, deck.filtered.length - 1)
            );

            deck.items.forEach(item => {
                item.hidden = true;
            });

            if (deck.filtered.length) {
                deck.filtered[deck.index].hidden = false;
            }

            $('[data-count="' + name + '"]').text(
                deck.filtered.length
                    ? (deck.index + 1) + ' de ' + deck.filtered.length
                    : 'Sin resultados'
            );

            $('[data-prev="' + name + '"]').prop(
                'disabled',
                deck.index === 0
            );

            $('[data-next="' + name + '"]').prop(
                'disabled',
                deck.index >= deck.filtered.length - 1
            );
        }

        function filterDeck(name, property, value) {
            const deck = decks[name];

            deck.filtered = deck.items.filter(item => {
                return value === 'todos' ||
                    item.dataset[property] === value;
            });

            deck.index = 0;
            renderDeck(name);
        }

        bind('[data-prev], [data-next]', 'click', function () {
            const next = Boolean(this.dataset.next);
            const name = this.dataset.next || this.dataset.prev;

            decks[name].index += next ? 1 : -1;
            renderDeck(name);
        });

        Object.keys(decks).forEach(renderDeck);

        // MÚSICA Y VIDEOJUEGOS

        bind('.boton-musica', 'click', function () {
            $('.boton-musica')
                .removeClass('activo')
                .attr('aria-pressed', 'false');

            $(this)
                .addClass('activo')
                .attr('aria-pressed', 'true');

            filterDeck('artistas', 'genero', this.dataset.genero);
        });

        $('.boton-musica')
            .attr('aria-pressed', 'false')
            .filter('.activo')
            .attr('aria-pressed', 'true');

        bind('#gameFilter', 'change', function () {
            filterDeck('juegos', 'categoria', this.value);
        });

        bind('[data-music]', 'click', function () {
            $('.music-panel').prop('hidden', true);

            $('#musica-' + this.dataset.music).prop('hidden', false);

            $('[data-music]').attr('aria-pressed', 'false');
            $(this).attr('aria-pressed', 'true');
        });

        // FILTRO DE TRES CAPAS

        const options = {
            academico: [
                {
                    value: 'web2',
                    text: 'Diseño Web II (SIS-0141)'
                }
            ],
            desarrollo: [
                {
                    value: 'pwa',
                    text: 'Arquitectura PWA'
                }
            ]
        };

        bind('#capa1', 'change', function () {
            const choices = options[this.value] || [];

            const second = $('#capa2')
                .empty()
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

            $('#resultadoFiltro').text(
                'Seleccione las capas anteriores...'
            );
        });

        bind('#capa2', 'change', function () {
            $('#resultadoFiltro').text(
                this.value
                    ? 'Capa 3: ' + $(this).find('option:selected').text()
                    : 'Seleccione las capas anteriores...'
            );
        });

        // GRÁFICO

        if (typeof Chart !== 'undefined') {
            graph = new Chart(
                document.getElementById('graficoActividades'),
                {
                    type: 'bar',
                    data: {
                        labels: [
                            'Dormir',
                            'Estudiar',
                            'Trabajar',
                            'Videojuegos',
                            'Comer',
                            'Otras actividades'
                        ],
                        datasets: [{
                            label: 'Horas por día',
                            data: [8, 4, 5, 2, 2, 3],
                            backgroundColor: [
                                '#dc3545',
                                '#172554',
                                '#2563eb',
                                '#ef4444',
                                '#64748b',
                                '#0f172a'
                            ],
                            borderRadius: 7
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: reducedMotion
                            ? false
                            : { duration: 400 },
                        plugins: {
                            legend: { display: false }
                        },
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
                }
            );

            updateTheme();
        }

        // SALUDO

        bind('#saludoBtn', 'click', function () {
            const hour = new Date().getHours();

            const greeting = hour < 12
                ? '¡Buenos días!'
                : hour < 19
                    ? '¡Buenas tardes!'
                    : '¡Buenas noches!';

            $('#interactive-output').text(
                greeting + ' Gracias por visitar mi página personal.'
            );
        });

        // FORMULARIO CON VALIDACIÓN EN TIEMPO REAL

        const form = document.getElementById('contactForm');

        const fields = Array.from(
            form.querySelectorAll('input, select, textarea')
        );

        const steps = Array.from(
            form.querySelectorAll('.wizard-step')
        );

        let formStep = 0;

        function showFormStep(index, focus = false) {
            formStep = Math.max(
                0,
                Math.min(index, steps.length - 1)
            );

            steps.forEach((step, i) => {
                step.hidden = i !== formStep;
            });

            $('[data-step]').each(function () {
                this.setAttribute(
                    'aria-pressed',
                    String(Number(this.dataset.step) === formStep)
                );
            });

            $('#formPrev').prop('disabled', formStep === 0);

            $('#formNext').prop(
                'hidden',
                formStep === steps.length - 1
            );

            $('#formSend').prop(
                'hidden',
                formStep !== steps.length - 1
            );

            $('#formProgress').text(
                (formStep + 1) + ' / ' + steps.length
            );

            if (focus) {
                steps[formStep]
                    .querySelector('input, select, textarea')
                    .focus({ preventScroll: true });
            }
        }

        function getError(field) {
            if (field.type === 'checkbox') {
                return field.checked
                    ? ''
                    : 'Debes aceptar esta casilla para continuar.';
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

                output
                    .stop(true, true)
                    .text(error)
                    .addClass('visible');

                if (animate && !wasVisible) {
                    output.hide().fadeIn(duration);
                } else {
                    output.show();
                }
            } else {
                output
                    .stop(true, true)
                    .fadeOut(animate ? duration : 0, function () {
                        $(this).removeClass('visible').text('');
                    });
            }

            return !error;
        }

        function validateStep() {
            const currentFields = fields.filter(field => {
                return field.closest('.wizard-step') === steps[formStep];
            });

            let firstInvalid = null;

            currentFields.forEach(field => {
                field.dataset.tocado = 'true';

                if (!validate(field) && !firstInvalid) {
                    firstInvalid = field;
                }
            });

            if (firstInvalid) {
                firstInvalid.focus({ preventScroll: true });
            }

            return !firstInvalid;
        }

        fields.forEach(field => {
            bind(field, 'blur change', function () {
                this.dataset.tocado = 'true';
                validate(this);
            });

            bind(field, 'input', function () {
                // Validación inmediata mientras se escribe.
                this.dataset.tocado = 'true';
                validate(this);
            });
        });

        bind('#formNext', 'click', function () {
            if (validateStep()) {
                showFormStep(formStep + 1, true);
            }
        });

        bind('#formPrev', 'click', function () {
            showFormStep(formStep - 1, true);
        });

        bind('[data-step]', 'click', function () {
            const target = Number(this.dataset.step);

            if (target > formStep && !validateStep()) return;

            showFormStep(target, true);
        });

        bind(form, 'keydown', function (event) {
            if (
                event.key === 'Enter' &&
                event.target.matches('input:not([type="checkbox"])') &&
                formStep < steps.length - 1
            ) {
                event.preventDefault();

                if (validateStep()) {
                    showFormStep(formStep + 1, true);
                }
            }
        });

        bind(form, 'submit', function (event) {
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
                    steps.indexOf(
                        firstInvalid.closest('.wizard-step')
                    )
                );

                firstInvalid.focus({ preventScroll: true });
                return;
            }

            form.reset();

            fields.forEach(field => {
                $(field)
                    .removeClass('is-valid is-invalid')
                    .removeAttr('aria-invalid aria-describedby');

                delete field.dataset.tocado;

                $('#error-' + field.id)
                    .stop(true, true)
                    .hide()
                    .removeClass('visible')
                    .text('');
            });

            showFormStep(0);

            $('#alertaBox')
                .stop(true, true)
                .hide()
                .html(
                    '<div class="alert alert-success" role="status">' +
                    '<strong>¡Formulario validado correctamente!</strong> ' +
                    'Es una demostración: no se enviaron ni guardaron datos.' +
                    '</div>'
                )
                .slideDown(duration)
                .delay(3000)
                .slideUp(duration);
        });

        showFormStep(0);
        showScreen(location.hash.slice(1) || 'inicio', false, false);

        // Confirmar solo después de conectar las funciones.
        app.dataset.hidratado = 'true';

        hydrationButton
            .text('✓ Hidratado')
            .prop('disabled', true)
            .attr('aria-label', 'Página hidratada correctamente');

        hydrationStatus
            .text('¡Página hidratada correctamente! Las funciones ya están activas.')
            .prop('hidden', false);

        clearTimeout(notificationTimer);

        notificationTimer = setTimeout(function () {
            hydrationStatus.prop('hidden', true);
            notificationTimer = null;
        }, 5000);
    }

    bind(hydrationButton, 'click', hidratarInterfaz);

    // Limpiar el temporizador al salir y pausar el carrusel.
    // Los eventos de las secciones se registran una sola vez:
    // cambiar de pantalla no vuelve a añadir listeners.
    bind(window, 'pagehide', function () {
        clearTimeout(notificationTimer);
        notificationTimer = null;
        hydrationStatus.prop('hidden', true);
        pauseCarousel();
        $('#alertaBox').stop(true, true);
    });

    // Recuperar el comportamiento si se vuelve con el botón Atrás.
    bind(window, 'pageshow', function () {
        updateHeight();

        if (
            app.dataset.hidratado === 'true' &&
            !document.getElementById('inicio').hidden &&
            !reducedMotion &&
            window.bootstrap?.Carousel
        ) {
            bootstrap.Carousel
                .getOrCreateInstance(
                    document.getElementById('carruselFotos')
                )
                .cycle();
        }
    });
});
