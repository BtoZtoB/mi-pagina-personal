
/* ==========================================
   DEPORZONE - JAVASCRIPT + JQUERY
   Reservas deportivas y minijuego de fútbol
========================================== */

$(document).ready(function () {

    "use strict";

    /* ======================================
       1. DATOS GENERALES
    ====================================== */

    const canchas = {
        cesped: {
            nombre: "Césped Natural",
            precio: 180,
            descripcion: "Cancha de fútbol con pasto natural."
        },
        sintetico: {
            nombre: "Césped Sintético",
            precio: 150,
            descripcion: "Cancha de fútbol con césped artificial."
        },
        cemento: {
            nombre: "Cancha de Cemento",
            precio: 90,
            descripcion: "Cancha de futsal con piso de cemento."
        },
        parquet: {
            nombre: "Parquet Deportivo",
            precio: 130,
            descripcion: "Cancha de futsal techada con parquet."
        }
    };

    const horarios = [
        "08:00", "09:00", "10:00", "11:00",
        "12:00", "13:00", "14:00", "15:00",
        "16:00", "17:00", "18:00", "19:00",
        "20:00", "21:00"
    ];

    const nombresSlides = [
        "CÉSPED NATURAL",
        "CÉSPED SINTÉTICO",
        "CANCHA DE CEMENTO",
        "PARQUET DEPORTIVO"
    ];

    const CLAVE_RESERVAS = "deporzone_reservas";
    const CLAVE_TEMA = "deporzone_tema";

    let canchaElegida = "cesped";
    let canchaFondo = "cesped";
    let horarioElegido = null;
    let reservas = [];

    /*
       NOVEDAD:

       reservas = información real guardada.

       reservasVisibles = información que aparece
       en la sección "Mis reservas".

       Solo el botón Actualizar modifica
       las reservas visibles.
    */

    let reservasVisibles = [];

    try {
        const datos = JSON.parse(
            localStorage.getItem(CLAVE_RESERVAS) || "[]"
        );

        reservas = Array.isArray(datos) ? datos : [];

    } catch (error) {
        reservas = [];
    }

    /*
       Al cargar la página se muestran las
       reservas existentes.

       Después de cargar, los cambios nuevos
       no se reflejan hasta actualizar.
    */

    reservasVisibles = reservas.map(function (reserva) {
        return { ...reserva };
    });

    function guardarReservas() {
        try {
            localStorage.setItem(
                CLAVE_RESERVAS,
                JSON.stringify(reservas)
            );

            return true;

        } catch (error) {
            notificar(
                "No se pudo guardar el cambio."
            );

            return false;
        }
    }

    function fechaLocal(fecha) {
        const anio = fecha.getFullYear();

        const mes = String(
            fecha.getMonth() + 1
        ).padStart(2, "0");

        const dia = String(
            fecha.getDate()
        ).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    }

    function fechaValida(fechaTexto) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaTexto)) {
            return false;
        }

        const partes = fechaTexto.split("-").map(Number);

        const fecha = new Date(
            partes[0],
            partes[1] - 1,
            partes[2]
        );

        return (
            fecha.getFullYear() === partes[0] &&
            fecha.getMonth() === partes[1] - 1 &&
            fecha.getDate() === partes[2]
        );
    }

    function notificar(mensaje) {
        $("#notificacion")
            .stop(true, true)
            .text(mensaje)
            .fadeIn(250)
            .delay(2400)
            .fadeOut(400);
    }

    /* ======================================
       2. MENÚ HAMBURGUESA
    ====================================== */

    function cerrarMenu() {
        $("#menuNavegacion")
            .stop(true, true)
            .slideUp(200);

        $("#btnMenu")
            .attr("aria-expanded", "false")
            .find("i")
            .removeClass("bi-x-lg")
            .addClass("bi-list");
    }

    $("#btnMenu").on("click", function (evento) {

        evento.stopPropagation();

        const abierto =
            $(this).attr("aria-expanded") === "true";

        if (abierto) {
            cerrarMenu();
        } else {
            $("#menuNavegacion")
                .stop(true, true)
                .slideDown(250);

            $(this)
                .attr("aria-expanded", "true")
                .find("i")
                .removeClass("bi-list")
                .addClass("bi-x-lg");
        }
    });

    $("#menuNavegacion a").on("click", cerrarMenu);

    $(document).on("click", function (evento) {

        if (
            !$(evento.target).closest(
                "#btnMenu, #menuNavegacion"
            ).length
        ) {
            cerrarMenu();
        }
    });

    $(document).on("keydown", function (evento) {

        if (evento.key === "Escape") {
            cerrarMenu();
        }
    });

    /* ======================================
       3. MODO CLARO Y OSCURO
    ====================================== */

    function actualizarBotonTema() {

        const modoClaro =
            $("body").hasClass("modo-claro");

        $("#btnTema").html(
            modoClaro
                ? '<i class="bi bi-sun-fill"></i><span>Modo claro</span>'
                : '<i class="bi bi-moon-stars-fill"></i><span>Modo oscuro</span>'
        );
    }

    try {
        if (
            localStorage.getItem(CLAVE_TEMA) === "claro"
        ) {
            $("body").addClass("modo-claro");
        }
    } catch (error) {}

    actualizarBotonTema();

    $("#btnTema").on("click", function () {

        $("body").toggleClass("modo-claro");

        actualizarBotonTema();

        const claro =
            $("body").hasClass("modo-claro");

        $("#fondoInteractivo")
            .stop(true, true)
            .css("opacity", 0.55)
            .animate({ opacity: 1 }, 650);

        try {
            localStorage.setItem(
                CLAVE_TEMA,
                claro ? "claro" : "oscuro"
            );
        } catch (error) {}

        notificar(
            claro
                ? "¡Modo claro activado!"
                : "¡Modo oscuro activado!"
        );
    });

    /* ======================================
       4. FONDO INTERACTIVO
    ====================================== */

    const tiposFondo = [
        "cesped",
        "sintetico",
        "cemento",
        "parquet"
    ];

    let temaFondoActual = "cesped";
    let temaFondoPendiente = null;
    let animacionFondoEnCurso = false;

    function cambiarFondo(tipo) {

        if (!tiposFondo.includes(tipo)) {
            return;
        }

        $("body")
            .removeClass(
                "tema-cesped tema-sintetico " +
                "tema-cemento tema-parquet"
            )
            .addClass("tema-" + tipo);

        canchaFondo = tipo;

        if (animacionFondoEnCurso) {
            temaFondoPendiente = tipo;
            return;
        }

        if (tipo === temaFondoActual) {
            return;
        }

        animacionFondoEnCurso = true;

        const claseNueva = "fondo-" + tipo;

        $("#capaFondoNueva")
            .stop(true, true)
            .removeClass(
                "fondo-cesped fondo-sintetico " +
                "fondo-cemento fondo-parquet"
            )
            .addClass(claseNueva)
            .css("opacity", 0)
            .animate(
                { opacity: 1 },
                500,
                function () {

                    $("#capaFondoActual")
                        .removeClass(
                            "fondo-cesped fondo-sintetico " +
                            "fondo-cemento fondo-parquet"
                        )
                        .addClass(claseNueva);

                    $("#capaFondoNueva")
                        .css("opacity", 0);

                    temaFondoActual = tipo;
                    animacionFondoEnCurso = false;

                    if (
                        temaFondoPendiente &&
                        temaFondoPendiente !== temaFondoActual
                    ) {
                        const siguiente = temaFondoPendiente;
                        temaFondoPendiente = null;
                        cambiarFondo(siguiente);
                    } else {
                        temaFondoPendiente = null;
                    }
                }
            );
    }

    $(".cancha").hover(
        function () {
            cambiarFondo($(this).data("tipo"));
        },
        function () {
            cambiarFondo(canchaElegida);
        }
    );

    /* Luz que sigue al cursor */

    let cursorX = -500;
    let cursorY = -500;
    let luzX = -500;
    let luzY = -500;
    let luzActiva = false;
    let fotogramaLuz = null;

    const movimientoReducido = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    function animarLuz() {

        if (!luzActiva) {
            fotogramaLuz = null;
            return;
        }

        luzX += (cursorX - luzX) * 0.14;
        luzY += (cursorY - luzY) * 0.14;

        $("#luzCursor").css({
            left: luzX - 210,
            top: luzY - 210
        });

        fotogramaLuz = requestAnimationFrame(animarLuz);
    }

    if (
        !movimientoReducido &&
        window.matchMedia("(pointer: fine)").matches
    ) {

        $(document).on("mousemove", function (evento) {

            cursorX = evento.clientX;
            cursorY = evento.clientY;

            if (!luzActiva) {

                luzActiva = true;
                luzX = cursorX;
                luzY = cursorY;

                $("#luzCursor")
                    .stop(true, true)
                    .animate({ opacity: 1 }, 350);
            }

            if (fotogramaLuz === null) {
                fotogramaLuz = requestAnimationFrame(animarLuz);
            }
        });

        $(document).on("mouseleave", function () {

            luzActiva = false;

            $("#luzCursor")
                .stop(true, true)
                .animate({ opacity: 0 }, 300);
        });
    }

    /* ======================================
       5. CARRUSEL
    ====================================== */

    let slideActual = 0;
    let intervaloCarrusel = null;

    const duracionCarrusel = 4500;

    function iniciarProgresoCarrusel() {

        $("#progresoCarrusel")
            .stop(true, true)
            .css("width", "0%")
            .animate(
                { width: "100%" },
                duracionCarrusel,
                "linear"
            );
    }

    function mostrarSlide(indice) {

        const $slides = $(".hero-slide");
        const total = $slides.length;

        if (!total) {
            return;
        }

        indice = (indice + total) % total;

        if (indice === slideActual) {
            return;
        }

        $slides
            .eq(slideActual)
            .stop(true, true)
            .fadeOut(500)
            .removeClass("activo");

        slideActual = indice;

        $slides
            .eq(slideActual)
            .stop(true, true)
            .fadeIn(500)
            .addClass("activo");

        $(".indicador")
            .removeClass("activo")
            .eq(slideActual)
            .addClass("activo");

        $("#nombreSlide")
            .stop(true, true)
            .fadeOut(150, function () {

                $(this)
                    .text(nombresSlides[slideActual])
                    .fadeIn(250);
            });

        $(".hero-contenido h1")
            .stop(true, true)
            .css({
                opacity: 0,
                marginLeft: "-20px"
            })
            .animate(
                {
                    opacity: 1,
                    marginLeft: "0px"
                },
                550
            );

        iniciarProgresoCarrusel();
    }

    function iniciarCarrusel() {

        clearInterval(intervaloCarrusel);

        iniciarProgresoCarrusel();

        intervaloCarrusel = setInterval(function () {
            mostrarSlide(slideActual + 1);
        }, duracionCarrusel);
    }

    $("#slideAnterior").on("click", function () {
        mostrarSlide(slideActual - 1);
        iniciarCarrusel();
    });

    $("#slideSiguiente").on("click", function () {
        mostrarSlide(slideActual + 1);
        iniciarCarrusel();
    });

    $(".indicador").on("click", function () {
        mostrarSlide(Number($(this).data("slide")));
        iniciarCarrusel();
    });

    $(".hero").hover(
        function () {
            clearInterval(intervaloCarrusel);
            $("#progresoCarrusel").stop(true, false);
        },
        function () {
            iniciarCarrusel();
        }
    );

    iniciarCarrusel();

    /* ======================================
       6. CONTADORES ANIMADOS
    ====================================== */

    let contadoresIniciados = false;

    function animarContadores() {

        if (contadoresIniciados) {
            return;
        }

        const $estadisticas = $(".estadisticas");

        if (!$estadisticas.length) {
            return;
        }

        const limite =
            $(window).scrollTop() +
            $(window).height();

        if (limite > $estadisticas.offset().top) {

            contadoresIniciados = true;

            $(".contador").each(function () {

                const $contador = $(this);
                const meta = Number($contador.data("meta"));

                $({ numero: 0 }).animate(
                    { numero: meta },
                    {
                        duration: 1200,
                        step: function (valor) {
                            $contador.text(Math.floor(valor));
                        },
                        complete: function () {
                            $contador.text(meta);
                        }
                    }
                );
            });
        }
    }

    /*
       IMPORTANTE:
       El contador utiliza reservasVisibles,
       NO la lista real de reservas.

       Por eso tampoco cambia automáticamente.
    */

    function actualizarContadorReservas() {

        const cantidad = reservasVisibles.length;

        const $contador = $("#contadorReservas");

        const anterior = Number($contador.text()) || 0;

        $({ numero: anterior }).animate(
            { numero: cantidad },
            {
                duration: 450,
                step: function (valor) {
                    $contador.text(Math.round(valor));
                },
                complete: function () {
                    $contador.text(cantidad);
                }
            }
        );
    }

    $("#contadorReservas").text(reservasVisibles.length);

    /* ======================================
       7. FILTROS DE CANCHAS
    ====================================== */

    $(".filtro").on("click", function () {

        const filtro = $(this).data("filtro");

        $(".filtro").removeClass("activo");
        $(this).addClass("activo");

        let cantidad = 0;

        $(".cancha").each(function () {

            const $tarjeta = $(this);

            const coincide =
                filtro === "todas" ||
                $tarjeta.data("tipo") === filtro;

            $tarjeta.stop(true, true);

            if (coincide) {
                cantidad++;
                $tarjeta.fadeIn(350);
            } else {
                $tarjeta.fadeOut(250);
            }
        });

        $("#resultadoFiltro")
            .stop(true, true)
            .fadeOut(100, function () {

                $(this)
                    .text(
                        "Mostrando " +
                        cantidad +
                        (cantidad === 1
                            ? " cancha"
                            : " canchas")
                    )
                    .fadeIn(250);
            });

        if (filtro !== "todas") {
            seleccionarCancha(filtro);
        }
    });

    /* ======================================
       8. CARACTERÍSTICAS DE CANCHAS
    ====================================== */

    $(".btn-detalles").on("click", function () {

        const $detalles = $(this).next(".detalles");
        const $icono = $(this).find("span");

        const estabaVisible = $detalles.is(":visible");

        $detalles
            .stop(true, true)
            .slideToggle(300);

        $icono.text(estabaVisible ? "+" : "−");
    });

    /* ======================================
       9. SELECCIONAR CANCHA
    ====================================== */

    function seleccionarCancha(tipo) {

        if (!canchas[tipo]) {
            return;
        }

        canchaElegida = tipo;
        horarioElegido = null;

        $(".tab-cancha").removeClass("activo");

        $('.tab-cancha[data-cancha="' + tipo + '"]')
            .addClass("activo");

        $("#tipoCancha").val(tipo);

        $("#imagenSeleccionada")
            .stop(true, true)
            .fadeOut(150, function () {

                $(this)
                    .removeClass(
                        "foto-cesped foto-sintetico " +
                        "foto-cemento foto-parquet"
                    )
                    .addClass("foto-" + tipo)
                    .fadeIn(300);
            });

        $("#nombreCanchaSeleccionada")
            .text(canchas[tipo].nombre);

        $("#descripcionCanchaSeleccionada")
            .text(canchas[tipo].descripcion);

        $("#precioCanchaSeleccionada")
            .text(
                "Bs " + canchas[tipo].precio + " / hora"
            );

        cambiarFondo(tipo);

        generarHorarios();
        actualizarResumen();
        animarPrecio();
    }

    $(".tab-cancha").on("click", function () {
        seleccionarCancha($(this).data("cancha"));
    });

    $("#tipoCancha").on("change", function () {
        seleccionarCancha($(this).val());
    });

    $(".reservar-cancha").on("click", function () {

        const tipo = $(this).data("cancha");

        seleccionarCancha(tipo);

        $("#panelHorarios")
            .stop(true, true)
            .slideDown(350);

        $("html, body").animate(
            {
                scrollTop: $("#reservas").offset().top
            },
            650
        );

        notificar(
            "¡Cancha seleccionada! Elige tu horario."
        );
    });

    /* ======================================
       10. FECHAS Y HORARIOS
    ====================================== */

    function horaFinal(hora) {

        return String(
            Number(hora.slice(0, 2)) + 1
        ).padStart(2, "0") + ":00";
    }

    function reservaOcupada(tipo, fecha, hora) {

        /*
           Aquí sí consultamos las reservas
           reales y actualizadas.

           Así se evitan reservas duplicadas.
        */

        return reservas.some(function (reserva) {

            return (
                reserva.cancha === tipo &&
                reserva.fecha === fecha &&
                reserva.hora === hora
            );
        });
    }

    function horarioYaPaso(fecha, hora) {

        return new Date(
            fecha + "T" + hora + ":00"
        ) <= new Date();
    }

    $("#fechaReserva")
        .attr("min", fechaLocal(new Date()))
        .val(fechaLocal(new Date()));

    function generarHorarios() {

        const fecha = $("#fechaReserva").val();

        const $lista = $("#listaHorarios");

        $lista.empty();

        if (
            !fechaValida(fecha) ||
            fecha < fechaLocal(new Date())
        ) {

            $lista.text(
                "Selecciona una fecha válida."
            );

            actualizarResumen();
            return;
        }

        horarios.forEach(function (hora, indice) {

            const ocupado =
                reservaOcupada(
                    canchaElegida,
                    fecha,
                    hora
                );

            const pasado =
                horarioYaPaso(fecha, hora);

            const $boton = $("<button>", {
                type: "button",
                class: "hora-btn",
                "data-hora": hora
            });

            $boton.text(
                hora + " - " + horaFinal(hora)
            );

            $boton.append(
                $("<span>").text(
                    ocupado
                        ? "Ocupado"
                        : pasado
                            ? "No disponible"
                            : "Disponible"
                )
            );

            if (ocupado || pasado) {

                $boton
                    .addClass("ocupado")
                    .prop("disabled", true);
            }

            if (
                !ocupado &&
                !pasado &&
                horarioElegido === hora
            ) {
                $boton.addClass("seleccionado");
            }

            $boton.hide();

            $lista.append($boton);

            $boton
                .delay(indice * 30)
                .fadeIn(180);
        });
    }

    $("#fechaReserva").on("change", function () {

        horarioElegido = null;

        generarHorarios();
        actualizarResumen();

        $("#panelHorarios").slideDown(300);

        notificar("Horarios actualizados.");
    });

    $("#mostrarHorarios").on("click", function () {

        $("#panelHorarios")
            .stop(true, true)
            .slideToggle(300);
    });

    $("#listaHorarios").on(
        "click",
        ".hora-btn",
        function () {

            if ($(this).prop("disabled")) {
                return;
            }

            $(".hora-btn").removeClass("seleccionado");

            $(this).addClass("seleccionado");

            horarioElegido = $(this).data("hora");

            actualizarResumen();
            animarPrecio();

            $("#mensajeError").text("");

            notificar(
                "Horario seleccionado: " + horarioElegido
            );
        }
    );

    /* ======================================
       11. RESUMEN Y PRECIOS
    ====================================== */

    function actualizarResumen() {

        const cancha = canchas[canchaElegida];
        const fecha = $("#fechaReserva").val();

        $("#resCancha").text(cancha.nombre);

        $("#resFecha").text(
            fecha || "Sin seleccionar"
        );

        $("#resHora").text(
            horarioElegido
                ? horarioElegido +
                  " - " +
                  horaFinal(horarioElegido)
                : "Sin seleccionar"
        );

        $("#resTotal").text(
            "Bs " + cancha.precio
        );
    }

    function animarPrecio() {

        $("#resTotal")
            .stop(true, true)
            .css({
                fontSize: "23px",
                opacity: 1
            })
            .animate(
                {
                    fontSize: "34px",
                    opacity: 0.65
                },
                200
            )
            .animate(
                {
                    fontSize: "23px",
                    opacity: 1
                },
                300
            );

        $("#resumenReserva")
            .stop(true, true)
            .animate(
                {
                    paddingLeft: "27px",
                    paddingRight: "27px"
                },
                180
            )
            .animate(
                {
                    paddingLeft: "20px",
                    paddingRight: "20px"
                },
                250
            );
    }

    generarHorarios();
    actualizarResumen();

    /* ======================================
       12. VALIDACIONES
    ====================================== */

    function mostrarError(campo, errorId, mensaje) {

        const $input = $("#" + campo);

        $input
            .removeClass("valido")
            .addClass("invalido");

        $("#" + errorId)
            .text(mensaje)
            .stop(true, true)
            .slideDown(180)
            .addClass("visible");

        $input
            .stop(true, true)
            .animate({ marginLeft: "7px" }, 60)
            .animate({ marginLeft: "-7px" }, 60)
            .animate({ marginLeft: "0px" }, 60);

        return false;
    }

    function mostrarValido(campo, errorId) {

        $("#" + campo)
            .removeClass("invalido")
            .addClass("valido");

        $("#" + errorId)
            .stop(true, true)
            .slideUp(150, function () {
                $(this)
                    .text("")
                    .removeClass("visible");
            });

        return true;
    }

    function validarNombre() {

        const nombre = $("#nombre").val().trim();

        const patron =
            /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)+$/;

        if (!nombre) {

            return mostrarError(
                "nombre",
                "errorNombre",
                "El nombre completo es obligatorio."
            );
        }

        if (
            nombre.length < 5 ||
            !patron.test(nombre)
        ) {

            return mostrarError(
                "nombre",
                "errorNombre",
                "Ingresa nombre y apellido válidos."
            );
        }

        return mostrarValido(
            "nombre",
            "errorNombre"
        );
    }

    function validarTelefono() {

        const telefono =
            $("#telefono").val().trim();

        if (!/^[67][0-9]{7}$/.test(telefono)) {

            return mostrarError(
                "telefono",
                "errorTelefono",
                "Ingresa 8 dígitos, comenzando con 6 o 7."
            );
        }

        return mostrarValido(
            "telefono",
            "errorTelefono"
        );
    }

    function validarCorreo() {

        const correo = $("#correo").val().trim();

        const patron =
            /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

        if (!patron.test(correo)) {

            return mostrarError(
                "correo",
                "errorCorreo",
                "Ingresa un correo electrónico válido."
            );
        }

        return mostrarValido(
            "correo",
            "errorCorreo"
        );
    }

    function validarPago() {

        const pago = $("#metodoPago").val();

        if (
            pago !== "Efectivo" &&
            pago !== "QR"
        ) {

            return mostrarError(
                "metodoPago",
                "errorPago",
                "Selecciona un método de pago."
            );
        }

        return mostrarValido(
            "metodoPago",
            "errorPago"
        );
    }

    $("#nombre").on("blur", validarNombre);
    $("#telefono").on("blur", validarTelefono);
    $("#correo").on("blur", validarCorreo);
    $("#metodoPago").on("change", validarPago);

    /* ======================================
       13. CONFIRMAR RESERVA

       CAMBIO PRINCIPAL:
       NO ACTUALIZAR "MIS RESERVAS"
       AUTOMÁTICAMENTE.
    ====================================== */

    $("#formReserva").on("submit", function (evento) {

        evento.preventDefault();

        const nombreOk = validarNombre();
        const telefonoOk = validarTelefono();
        const correoOk = validarCorreo();
        const pagoOk = validarPago();

        const fecha = $("#fechaReserva").val();

        $("#mensajeError").text("");

        if (
            !fechaValida(fecha) ||
            fecha < fechaLocal(new Date())
        ) {

            $("#mensajeError").text(
                "Selecciona una fecha válida."
            );

            $("#fechaReserva").focus();
            return;
        }

        if (!horarioElegido) {

            $("#mensajeError").text(
                "Debes seleccionar un horario disponible."
            );

            $("#panelHorarios").slideDown(300);
            return;
        }

        if (
            horarioYaPaso(fecha, horarioElegido) ||
            reservaOcupada(
                canchaElegida,
                fecha,
                horarioElegido
            )
        ) {

            $("#mensajeError").text(
                "Este horario ya no está disponible."
            );

            horarioElegido = null;
            generarHorarios();
            actualizarResumen();
            return;
        }

        if (
            !nombreOk ||
            !telefonoOk ||
            !correoOk ||
            !pagoOk
        ) {

            $("#mensajeError").text(
                "Corrige los campos marcados en rojo."
            );

            $(".invalido").first().focus();
            return;
        }

        const nuevaReserva = {
            id: Date.now().toString() +
                Math.random().toString(36).slice(2, 8),
            cancha: canchaElegida,
            fecha: fecha,
            hora: horarioElegido,
            nombre: $("#nombre").val().trim(),
            telefono: $("#telefono").val().trim(),
            correo: $("#correo").val().trim(),
            pago: $("#metodoPago").val(),
            precio: canchas[canchaElegida].precio
        };

        reservas.push(nuevaReserva);

        if (!guardarReservas()) {

            reservas.pop();

            $("#mensajeError").text(
                "No se pudo guardar la reserva."
            );

            return;
        }

        /* Modal de confirmación */

        const $detalle = $("#detalleConfirmacion");

        $detalle.empty();

        const datos = [
            ["Cliente", nuevaReserva.nombre],
            ["Cancha", canchas[nuevaReserva.cancha].nombre],
            ["Fecha", nuevaReserva.fecha],
            [
                "Horario",
                nuevaReserva.hora +
                " - " +
                horaFinal(nuevaReserva.hora)
            ],
            ["Teléfono", nuevaReserva.telefono],
            ["Correo", nuevaReserva.correo],
            ["Método de pago", nuevaReserva.pago],
            ["Total", "Bs " + nuevaReserva.precio]
        ];

        datos.forEach(function (dato) {

            const $linea = $("<p>");

            $linea.append(
                $("<strong>").text(dato[0] + ": ")
            );

            $linea.append(
                document.createTextNode(dato[1])
            );

            $detalle.append($linea);
        });

        $("#modalConfirmacion")
            .css("display", "flex")
            .hide()
            .fadeIn(350);

        /*
           Se actualizan los horarios porque
           la reserva ya está ocupando uno.
        */

        horarioElegido = null;
        generarHorarios();
        actualizarResumen();

        /*
           NO hacemos lo siguiente:

           mostrarMisReservas();
           actualizarContadorReservas();

           Por eso la reserva nueva no aparece
           hasta presionar Actualizar.
        */

        $("#formReserva")[0].reset();

        $("#tipoCancha").val(canchaElegida);

        $(".valido, .invalido")
            .removeClass("valido invalido");

        $(".error-campo")
            .removeClass("visible")
            .hide()
            .text("");

        $("#fechaReserva").val(fecha);

        actualizarResumen();

        notificar(
            "¡Reserva guardada! Presiona Actualizar " +
            "en Mis reservas para verla."
        );
    });

    $("#cerrarModal").on("click", function () {

        $("#modalConfirmacion").fadeOut(300);
    });

    $("#modalConfirmacion").on("click", function (evento) {

        if (evento.target === this) {
            $(this).fadeOut(300);
        }
    });

    /* ======================================
       14. MIS RESERVAS

       LA LISTA UTILIZA reservasVisibles.
    ====================================== */

    function mostrarMisReservas() {

        const $contenedor = $("#listaMisReservas");

        $contenedor.empty();

        if (reservasVisibles.length === 0) {

            $contenedor.html(
                '<div class="sin-reservas">' +
                '<i class="bi bi-calendar-x"></i>' +
                '<p>Todavía no tienes reservas registradas.</p>' +
                '</div>'
            );

            return;
        }

        const ordenadas = [...reservasVisibles].sort(
            function (a, b) {

                return (
                    (a.fecha + a.hora)
                        .localeCompare(b.fecha + b.hora)
                );
            }
        );

        ordenadas.forEach(function (reserva) {

            const nombreCancha =
                canchas[reserva.cancha]
                    ? canchas[reserva.cancha].nombre
                    : reserva.cancha;

            const $item = $("<article>", {
                class: "reserva-item"
            });

            const $cabecera = $("<div>", {
                class: "reserva-item-cabecera"
            });

            $cabecera.append(
                $("<h4>").text(nombreCancha)
            );

            const $cancelar = $("<button>", {
                type: "button",
                class: "btn-cancelar",
                "data-id": reserva.id,
                text: "Cancelar reserva"
            });

            $cabecera.append($cancelar);

            $item.append($cabecera);

            [
                ["Fecha", reserva.fecha],
                ["Hora", reserva.hora],
                ["Cliente", reserva.nombre],
                ["Pago", reserva.pago],
                ["Total", "Bs " + reserva.precio]
            ].forEach(function (dato) {

                const $p = $("<p>");

                $p.append(
                    $("<strong>").text(dato[0] + ": ")
                );

                $p.append(
                    document.createTextNode(dato[1])
                );

                $item.append($p);
            });

            $contenedor.append($item);
        });
    }

    /* ======================================
       15. CANCELAR RESERVA

       GUARDA LA CANCELACIÓN,
       PERO NO MODIFICA LA LISTA VISIBLE.
    ====================================== */

    $("#listaMisReservas").on(
        "click",
        ".btn-cancelar",
        function () {

            const id = String(
                $(this).attr("data-id")
            );

            /*
               Evita cancelar nuevamente una
               reserva que ya fue eliminada,
               pero sigue visible porque todavía
               no se presionó Actualizar.
            */

            const existe = reservas.some(
                function (reserva) {

                    return String(reserva.id) === id;
                }
            );

            if (!existe) {

                notificar(
                    "Esta reserva ya fue cancelada. " +
                    "Presiona Actualizar."
                );

                return;
            }

            const confirmar = window.confirm(
                "¿Seguro que deseas cancelar esta reserva?"
            );

            if (!confirmar) {
                return;
            }

            const anteriores = [...reservas];

            reservas = reservas.filter(
                function (reserva) {

                    return String(reserva.id) !== id;
                }
            );

            if (!guardarReservas()) {

                reservas = anteriores;
                return;
            }

            /*
               Se actualizan los horarios:
               el horario cancelado vuelve
               a estar disponible.
            */

            generarHorarios();

            /*
               NO actualizamos la lista ni
               el contador aquí.

               La reserva cancelada sigue
               visible hasta presionar
               el botón Actualizar.
            */

            notificar(
                "Reserva cancelada. Presiona " +
                "Actualizar para ver el cambio."
            );
        }
    );

    /* ======================================
       16. BOTÓN ACTUALIZAR

       ÚNICO LUGAR QUE REFRESCA
       LA LISTA Y SU CONTADOR.
    ====================================== */

    $("#actualizarReservas").on("click", function () {

        const $boton = $(this);

        $boton.prop("disabled", true);

        /*
           Copiamos las reservas reales
           a las reservas visibles.
        */

        reservasVisibles = reservas.map(
            function (reserva) {

                return { ...reserva };
            }
        );

        /*
           Animación de actualización.
        */

        $("#listaMisReservas")
            .stop(true, true)
            .fadeOut(180, function () {

                mostrarMisReservas();

                $(this).fadeIn(350, function () {

                    $boton.prop("disabled", false);
                });
            });

        /*
           Ahora sí cambia el contador.
        */

        actualizarContadorReservas();

        notificar(
            "¡Lista de reservas actualizada!"
        );
    });

    /*
       Primera carga:
       mostrar reservas que ya existían
       cuando se abrió la página.
    */

    mostrarMisReservas();

    /* ======================================
       17. ANIMACIONES AL DESPLAZARSE
    ====================================== */

    function animarEntradas() {

        const limite =
            $(window).scrollTop() +
            $(window).height() - 40;

        $(".animar-entrada").each(function () {

            const $elemento = $(this);

            if (
                !$elemento.hasClass("ya-animado") &&
                $elemento.offset().top < limite
            ) {

                $elemento.addClass("ya-animado");

                $elemento.animate(
                    {
                        opacity: 1,
                        top: 0
                    },
                    550
                );
            }
        });
    }

    $(window).on("scroll resize", function () {

        animarEntradas();
        animarContadores();

        if ($(window).scrollTop() > 350) {

            $("#volverArriba")
                .stop(true, true)
                .fadeIn(250);

        } else {

            $("#volverArriba")
                .stop(true, true)
                .fadeOut(250);
        }
    });

    $("#volverArriba").on("click", function () {

        $("html, body").animate(
            { scrollTop: 0 },
            650
        );
    });

    animarEntradas();
    animarContadores();

    /* ======================================
       18. MENSAJE DEPORTIVO
    ====================================== */

    $("#btnMensaje").on("click", function () {

        $("#mensajeAnimado")
            .stop(true, true)
            .fadeToggle(400);

        $("#iconoPrincipal")
            .stop(true, true)
            .animate(
                { fontSize: "85px" },
                250
            )
            .animate(
                { fontSize: "65px" },
                250
            );
    });

    /* ======================================
       19. MINIJUEGO: ¡MARCA EL GOL!
    ====================================== */

    const $campo = $("#juegoCampo");
    const $balon = $("#juegoBalon");
    const $portero = $("#juegoPortero");
    const $celebracion = $("#juegoCelebracion");

    const DURACION_PARTIDO = 30;
    const DURACION_DISPARO = 620;
    const PASO_BALON = 25;

    let juegoActivo = false;
    let disparando = false;
    let tiempoRestante = DURACION_PARTIDO;
    let goles = 0;
    let atajadas = 0;

    let intervaloTiempo = null;
    let intervaloPortero = null;
    let temporizadorResultado = null;

    let posicionBalonY = 0;
    let posicionPorteroY = 0;

    /* MEDIDAS DEL CAMPO */

    function altoCampo() {
        return $campo.innerHeight();
    }

    function anchoCampo() {
        return $campo.innerWidth();
    }

    function altoBalon() {
        return $balon.outerHeight();
    }

    function anchoBalon() {
        return $balon.outerWidth();
    }

    function altoPortero() {
        return $portero.outerHeight();
    }

    function limitar(numero, minimo, maximo) {

        return Math.max(
            minimo,
            Math.min(numero, maximo)
        );
    }

    function inicioBalonY() {

        return (
            altoCampo() - altoBalon()
        ) / 2;
    }

    function inicioPorteroY() {

        return (
            altoCampo() - altoPortero()
        ) / 2;
    }

    /* MARCADOR */

    function actualizarMarcador() {

        $("#juegoGoles").text(goles);
        $("#juegoAtajadas").text(atajadas);
        $("#juegoTiempo").text(tiempoRestante);

        $("#juegoTiempo").toggleClass(
            "juego-tiempo-urgente",
            tiempoRestante <= 10
        );
    }

    function mensajeJuego(texto) {

        $("#juegoMensaje")
            .stop(true, true)
            .hide()
            .text(texto)
            .fadeIn(250);
    }

    /* POSICIÓN INICIAL DEL BALÓN */

    function colocarBalon() {

        $balon.stop(true, false);

        posicionBalonY = inicioBalonY();

        $balon.css({
            left: 30,
            top: posicionBalonY,
            opacity: 1
        });
    }

    /* POSICIÓN INICIAL DEL PORTERO */

    function colocarPortero() {

        $portero.stop(true, false);

        posicionPorteroY = inicioPorteroY();

        $portero.css({
            top: posicionPorteroY,
            opacity: 1
        });
    }

    function reiniciarPosiciones() {

        disparando = false;

        $campo.removeClass(
            "juego-gol juego-atajada"
        );

        $celebracion
            .stop(true, true)
            .hide();

        colocarBalon();
        colocarPortero();
    }

    /* MOVIMIENTO DEL PORTERO */

    function moverPortero() {

        if (!juegoActivo) {
            return;
        }

        const maximo =
            altoCampo() - altoPortero() - 10;

        const destino = limitar(
            Math.random() * maximo,
            10,
            maximo
        );

        $portero
            .stop(true, false)
            .animate(
                { top: destino },
                650,
                "swing",
                function () {

                    posicionPorteroY =
                        parseFloat(
                            $portero.css("top")
                        ) || 0;
                }
            );
    }

    function iniciarMovimientoPortero() {

        clearInterval(intervaloPortero);

        moverPortero();

        intervaloPortero = setInterval(
            moverPortero,
            700
        );
    }

    /* MOVER EL BALÓN */

    function moverBalon(direccion) {

        if (!juegoActivo || disparando) {
            return;
        }

        const maximo =
            altoCampo() - altoBalon() - 10;

        posicionBalonY = limitar(
            posicionBalonY +
                direccion * PASO_BALON,
            10,
            maximo
        );

        $balon
            .stop(true, false)
            .animate(
                { top: posicionBalonY },
                120,
                "swing"
            );
    }

    /* CELEBRACIÓN DE GOL */

    function mostrarResultadoGol() {

        goles++;

        actualizarMarcador();

        $campo
            .removeClass("juego-atajada")
            .addClass("juego-gol");

        $celebracion
            .stop(true, true)
            .text("¡GOOOOL! ⚽")
            .fadeIn(200)
            .delay(450)
            .fadeOut(300);

        mensajeJuego(
            "¡Excelente disparo! ¡Marcaste un gol!"
        );
    }

    /* ATAJADA */

    function mostrarResultadoAtajada() {

        atajadas++;

        actualizarMarcador();

        $campo
            .removeClass("juego-gol")
            .addClass("juego-atajada");

        $celebracion
            .stop(true, true)
            .text("¡ATAJADA! 🧤")
            .fadeIn(200)
            .delay(400)
            .fadeOut(300);

        mensajeJuego(
            "¡El portero detuvo tu disparo!"
        );
    }

    /* DISPARAR BALÓN */

    function dispararBalon() {

        if (!juegoActivo || disparando) {
            return;
        }

        disparando = true;

        const destinoX =
            anchoCampo() - anchoBalon() - 8;

        const posicionObjetivoY =
            posicionBalonY;

        const margenSuperior =
            altoCampo() * 0.21;

        const margenInferior =
            altoCampo() * 0.79;

        const centroBalon =
            posicionObjetivoY +
            altoBalon() / 2;

        const dentroPorteria =
            centroBalon >= margenSuperior &&
            centroBalon <= margenInferior;

        $balon
            .stop(true, false)
            .animate(
                { left: destinoX },
                DURACION_DISPARO,
                "linear",
                function () {

                    if (!juegoActivo) {

                        disparando = false;
                        return;
                    }

                    const porteroY =
                        parseFloat(
                            $portero.css("top")
                        ) || 0;

                    const arribaPortero = porteroY;

                    const abajoPortero =
                        porteroY + altoPortero();

                    const arribaBalon =
                        posicionObjetivoY;

                    const abajoBalon =
                        posicionObjetivoY +
                        altoBalon();

                    const tocaPortero =
                        abajoBalon > arribaPortero &&
                        arribaBalon < abajoPortero;

                    if (
                        dentroPorteria &&
                        !tocaPortero
                    ) {

                        mostrarResultadoGol();

                    } else {

                        mostrarResultadoAtajada();
                    }

                    clearTimeout(temporizadorResultado);

                    temporizadorResultado =
                        setTimeout(function () {

                            if (!juegoActivo) {
                                return;
                            }

                            $balon
                                .stop(true, false)
                                .css({
                                    left: 30,
                                    top: posicionObjetivoY,
                                    opacity: 0
                                })
                                .fadeTo(
                                    200,
                                    1,
                                    function () {

                                        disparando = false;

                                        $campo.removeClass(
                                            "juego-gol juego-atajada"
                                        );
                                    }
                                );

                        }, 550);
                }
            );
    }

    /* FINALIZAR PARTIDO */

    function finalizarPartido() {

        if (!juegoActivo) {
            return;
        }

        juegoActivo = false;
        disparando = false;

        clearInterval(intervaloTiempo);
        clearInterval(intervaloPortero);
        clearTimeout(temporizadorResultado);

        $balon.stop(true, false);
        $portero.stop(true, false);

        $celebracion
            .stop(true, true)
            .hide();

        tiempoRestante = 0;

        actualizarMarcador();

        $("#juegoIniciar")
            .prop("disabled", false)
            .text("Volver a jugar");

        let resultado = "";

        if (goles === 0) {

            resultado =
                "¡Tiempo terminado! Inténtalo otra vez.";

        } else if (goles < 3) {

            resultado =
                "¡Buen partido! Marcaste " +
                goles + " gol(es).";

        } else if (goles < 6) {

            resultado =
                "¡Gran delantero! " +
                goles + " goles.";

        } else {

            resultado =
                "¡Eres una estrella de DeporZone! " +
                goles + " goles.";
        }

        mensajeJuego(resultado);

        notificar(
            "Partido terminado: " +
            goles + " goles."
        );
    }

    /* COMENZAR PARTIDO */

    function iniciarPartido() {

        clearInterval(intervaloTiempo);
        clearInterval(intervaloPortero);
        clearTimeout(temporizadorResultado);

        goles = 0;
        atajadas = 0;
        tiempoRestante = DURACION_PARTIDO;

        juegoActivo = true;
        disparando = false;

        reiniciarPosiciones();
        actualizarMarcador();

        $("#juegoIniciar")
            .prop("disabled", true)
            .text("Partido en curso...");

        mensajeJuego(
            "¡Comenzó el partido! Apunta y dispara."
        );

        iniciarMovimientoPortero();

        intervaloTiempo = setInterval(
            function () {

                if (!juegoActivo) {
                    return;
                }

                tiempoRestante--;

                actualizarMarcador();

                if (tiempoRestante <= 0) {
                    finalizarPartido();
                }

            },
            1000
        );

        $campo.trigger("focus");
    }

    /* BOTONES DEL JUEGO */

    $("#juegoIniciar").on(
        "click",
        iniciarPartido
    );

    $("#juegoArriba").on(
        "click",
        function () {
            moverBalon(-1);
        }
    );

    $("#juegoAbajo").on(
        "click",
        function () {
            moverBalon(1);
        }
    );

    $("#juegoDisparar").on(
        "click",
        dispararBalon
    );

    /* CONTROLES DEL TECLADO */

    $(document).on("keydown", function (evento) {

        if (!juegoActivo) {
            return;
        }

        const etiqueta =
            evento.target.tagName.toLowerCase();

        if (
            etiqueta === "input" ||
            etiqueta === "textarea" ||
            etiqueta === "select" ||
            etiqueta === "button"
        ) {
            return;
        }

        if (evento.key === "ArrowUp") {

            evento.preventDefault();
            moverBalon(-1);

        } else if (evento.key === "ArrowDown") {

            evento.preventDefault();
            moverBalon(1);

        } else if (evento.code === "Space") {

            evento.preventDefault();
            dispararBalon();
        }
    });

    /* AJUSTE AL CAMBIAR TAMAÑO */

    $(window).on("resize", function () {

        if (!juegoActivo) {

            colocarBalon();
            colocarPortero();
            return;
        }

        if (!disparando) {

            posicionBalonY = limitar(
                posicionBalonY,
                10,
                altoCampo() - altoBalon() - 10
            );

            $balon.css({
                top: posicionBalonY
            });
        }

        posicionPorteroY = limitar(
            parseFloat(
                $portero.css("top")
            ) || 0,
            10,
            altoCampo() - altoPortero() - 10
        );

        $portero.css({
            top: posicionPorteroY
        });
    });

    /* ESTADO INICIAL DEL JUEGO */

    colocarBalon();
    colocarPortero();
    actualizarMarcador();

    /* ======================================
       20. INICIALIZACIÓN FINAL
    ====================================== */

    console.log(
        "DeporZone cargado correctamente."
    );

    console.log(
        "jQuery versión:",
        $.fn.jquery
    );

    console.log(
        "Reservas: actualización manual activada."
    );

    console.log(
        "Minijuego ¡Marca el gol! preparado."
    );

});
