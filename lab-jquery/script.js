
$(document).ready(function () {

    /* ================================
       1. MENÚ HAMBURGUESA
    ================================= */

    function cerrarMenu() {
        $("#menuNavegacion").stop(true, true).slideUp(250);
        $("#btnMenu")
            .attr("aria-expanded", "false")
            .attr("aria-label", "Abrir menú")
            .html('<i class="bi bi-list"></i>');
    }

    $("#btnMenu").click(function (evento) {
        evento.stopPropagation();

        const abierto = $(this).attr("aria-expanded") === "true";

        if (abierto) {
            cerrarMenu();
        } else {
            $("#menuNavegacion").stop(true, true).slideDown(250);
            $(this)
                .attr("aria-expanded", "true")
                .attr("aria-label", "Cerrar menú")
                .html('<i class="bi bi-x-lg"></i>');
        }
    });

    $("#menuNavegacion a").click(function () {
        cerrarMenu();
    });

    $(document).click(function (evento) {
        if (!$(evento.target).closest(
            "#menuNavegacion, #btnMenu"
        ).length) {
            cerrarMenu();
        }
    });

    $(document).keydown(function (evento) {
        if (evento.key === "Escape") {
            cerrarMenu();
        }
    });

    /* ================================
       2. MODO CLARO Y OSCURO
    ================================= */

    function actualizarBotonTema() {
        const claro = $("body").hasClass("modo-claro");

        $("#btnTema").html(
            claro
                ? '<i class="bi bi-sun-fill"></i><span>Modo claro</span>'
                : '<i class="bi bi-moon-stars-fill"></i><span>Modo oscuro</span>'
        );
    }

    try {
        if (localStorage.getItem("deporzone_tema") === "claro") {
            $("body").addClass("modo-claro");
        }
    } catch (error) {
        // Si el almacenamiento no está disponible,
        // la página mantiene el tema oscuro.
    }

    actualizarBotonTema();

    $("#btnTema").click(function () {
        $("body").toggleClass("modo-claro");

        const claro = $("body").hasClass("modo-claro");

        actualizarBotonTema();

        try {
            localStorage.setItem(
                "deporzone_tema",
                claro ? "claro" : "oscuro"
            );
        } catch (error) {
            // El cambio sigue funcionando en esta sesión.
        }
    });

    /* ================================
       3. CARRUSEL DE PORTADA
    ================================= */

    const nombresSlides = [
        "CÉSPED NATURAL",
        "CÉSPED SINTÉTICO",
        "CANCHA DE CEMENTO",
        "PARQUET DEPORTIVO"
    ];

    let slideActual = 0;
    let intervaloCarrusel;

    function mostrarSlide(indice) {
        const slides = $(".hero-slide");
        const cantidad = slides.length;

        indice = (indice + cantidad) % cantidad;

        if (indice === slideActual) return;

        const anterior = slideActual;
        slideActual = indice;

        slides.eq(anterior)
            .removeClass("activo")
            .stop(true, true)
            .fadeOut(650);

        slides.eq(slideActual)
            .addClass("activo")
            .stop(true, true)
            .fadeIn(650);

        $(".indicador").removeClass("activo");
        $(".indicador").eq(slideActual).addClass("activo");

        $("#nombreSlide")
            .stop(true, true)
            .fadeOut(150, function () {
                $(this)
                    .text(nombresSlides[slideActual])
                    .fadeIn(250);
            });
    }

    function iniciarCarrusel() {
        clearInterval(intervaloCarrusel);

        intervaloCarrusel = setInterval(function () {
            mostrarSlide(slideActual + 1);
        }, 4000);
    }

    $("#slideSiguiente").click(function () {
        mostrarSlide(slideActual + 1);
        iniciarCarrusel();
    });

    $("#slideAnterior").click(function () {
        mostrarSlide(slideActual - 1);
        iniciarCarrusel();
    });

    $(".indicador").click(function () {
        mostrarSlide(Number($(this).data("slide")));
        iniciarCarrusel();
    });

    $(".hero").hover(
        function () {
            clearInterval(intervaloCarrusel);
        },
        function () {
            iniciarCarrusel();
        }
    );

    iniciarCarrusel();

    /* ================================
       4. DATOS DE LAS CANCHAS
    ================================= */

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

    let horarioElegido = null;
    let reservas = [];

    try {
        const datos = JSON.parse(
            localStorage.getItem("deporzone_reservas") || "[]"
        );

        if (Array.isArray(datos)) {
            reservas = datos;
        }
    } catch (error) {
        reservas = [];
    }

    function guardarReservas() {
        try {
            localStorage.setItem(
                "deporzone_reservas",
                JSON.stringify(reservas)
            );
            return true;
        } catch (error) {
            return false;
        }
    }

    /* ================================
       5. FECHAS Y DISPONIBILIDAD
    ================================= */

    function fechaLocal() {
        const d = new Date();

        return d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
    }

    $("#fechaReserva")
        .attr("min", fechaLocal())
        .val(fechaLocal());

    function horaFinal(hora) {
        return String(Number(hora.slice(0, 2)) + 1)
            .padStart(2, "0") + ":00";
    }

    function horarioPasado(fecha, hora) {
        return new Date(fecha + "T" + hora + ":00") <= new Date();
    }

    function estaOcupado(cancha, fecha, hora) {
        return reservas.some(function (r) {
            return r.cancha === cancha &&
                r.fecha === fecha &&
                r.hora === hora;
        });
    }

    /* ================================
       6. RESUMEN DINÁMICO
    ================================= */

    function actualizarResumen(animar = false) {
        const id = $("#tipoCancha").val();
        const fecha = $("#fechaReserva").val();

        $("#resCancha").text(canchas[id].nombre);
        $("#resFecha").text(fecha || "Sin seleccionar");

        $("#resHora").text(
            horarioElegido
                ? horarioElegido + " - " + horaFinal(horarioElegido)
                : "Sin seleccionar"
        );

        $("#resTotal").text("Bs " + canchas[id].precio);

        if (animar) {
            animarPrecio();
        }
    }

    /* ================================
       7. ANIMACIÓN .animate()
    ================================= */

    function animarPrecio() {
        $("#resTotal")
            .stop(true, true)
            .css({
                fontSize: "23px",
                opacity: 1
            })
            .animate({
                fontSize: "34px",
                opacity: 0.65
            }, 220)
            .animate({
                fontSize: "23px",
                opacity: 1
            }, 350);

        $("#resumenReserva")
            .stop(true, true)
            .animate({
                paddingLeft: "28px",
                paddingRight: "28px"
            }, 200)
            .animate({
                paddingLeft: "20px",
                paddingRight: "20px"
            }, 300);
    }

    /* ================================
       8. MOSTRAR HORARIOS
    ================================= */

    function cargarHorarios() {
        const cancha = $("#tipoCancha").val();
        const fecha = $("#fechaReserva").val();

        horarioElegido = null;
        $("#listaHorarios").empty();

        if (!fecha || fecha < fechaLocal()) {
            $("#listaHorarios").text(
                "Selecciona una fecha válida."
            );
            actualizarResumen();
            return;
        }

        horarios.forEach(function (hora) {
            const ocupado = estaOcupado(cancha, fecha, hora);
            const pasado = horarioPasado(fecha, hora);

            const boton = $("<button>", {
                type: "button",
                class: "hora-btn",
                "data-hora": hora
            });

            boton.text(hora + " - " + horaFinal(hora));

            boton.append(
                $("<span>").text(
                    ocupado ? "Ocupado" :
                    pasado ? "No disponible" : "Disponible"
                )
            );

            if (ocupado || pasado) {
                boton.addClass("ocupado")
                    .prop("disabled", true);
            }

            $("#listaHorarios").append(boton);
        });

        actualizarResumen();
    }

    /* ================================
       9. PESTAÑAS JQUERY
    ================================= */

    function seleccionarCancha(id) {
        if (!canchas[id]) return;

        $(".tab-cancha").removeClass("activo");

        $('.tab-cancha[data-cancha="' + id + '"]')
            .addClass("activo");

        $("#tipoCancha").val(id);

        $("#imagenSeleccionada")
            .removeClass(
                "foto-cesped foto-sintetico foto-cemento foto-parquet"
            )
            .addClass("foto-" + id)
            .hide()
            .fadeIn(350);

        $("#nombreCanchaSeleccionada")
            .text(canchas[id].nombre);

        $("#descripcionCanchaSeleccionada")
            .text(canchas[id].descripcion);

        $("#precioCanchaSeleccionada")
            .text("Bs " + canchas[id].precio + " / hora");

        $("body")
            .removeClass(
                "tema-cesped tema-sintetico tema-cemento tema-parquet"
            )
            .addClass("tema-" + id);

        $("#iconoPrincipal").html(
            '<i class="bi bi-trophy-fill"></i>'
        );

        cargarHorarios();
        animarPrecio();
    }

    $(".tab-cancha").click(function () {
        seleccionarCancha($(this).data("cancha"));
    });

    $("#tipoCancha").change(function () {
        seleccionarCancha($(this).val());
    });

    $("#fechaReserva").change(cargarHorarios);

    /* ================================
       10. FILTROS
    ================================= */

    $(".filtro").click(function () {
        const filtro = $(this).data("filtro");

        $(".filtro").removeClass("activo");
        $(this).addClass("activo");

        $(".cancha").each(function () {
            const tipo = $(this).data("tipo");

            if (filtro === "todas" || filtro === tipo) {
                $(this).stop(true, true).fadeIn(300);
            } else {
                $(this).stop(true, true).fadeOut(200);
            }
        });

        if (filtro !== "todas") {
            seleccionarCancha(filtro);
        }
    });

    /* ================================
       11. ACORDEONES
    ================================= */

    $(".btn-detalles").click(function () {
        $(this)
            .next(".detalles")
            .stop(true, true)
            .slideToggle("fast");

        const icono = $(this).find("span");

        icono.text(
            icono.text() === "+" ? "-" : "+"
        );
    });

    $(".reservar-cancha").click(function () {
        seleccionarCancha($(this).data("cancha"));

        $("#panelHorarios")
            .stop(true, true)
            .slideDown("fast");

        document.getElementById("reservas")
            .scrollIntoView({
                behavior: "smooth"
            });
    });

    $("#mostrarHorarios").click(function () {
        $("#panelHorarios")
            .stop(true, true)
            .slideToggle("fast");
    });

    /* ================================
       12. SELECCIÓN DE HORARIOS
    ================================= */

    $("#listaHorarios").on("click", ".hora-btn", function () {
        if ($(this).prop("disabled")) return;

        $(".hora-btn").removeClass("seleccionado");

        $(this).addClass("seleccionado");

        horarioElegido = $(this).data("hora");

        actualizarResumen(true);

        $("#mensajeError").text("");
    });

    $("#btnMensaje").click(function () {
        $("#mensajeAnimado")
            .stop(true, true)
            .fadeToggle(500);
    });

    /* ================================
       13. VALIDACIÓN DE DATOS
    ================================= */

    function mostrarError(campo, errorId, mensaje) {
        $("#" + campo)
            .removeClass("valido")
            .addClass("invalido");

        $("#" + errorId)
            .text(mensaje)
            .addClass("visible");

        return false;
    }

    function mostrarValido(campo, errorId) {
        $("#" + campo)
            .removeClass("invalido")
            .addClass("valido");

        $("#" + errorId)
            .text("")
            .removeClass("visible");

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

        if (nombre.length < 5 || !patron.test(nombre)) {
            return mostrarError(
                "nombre",
                "errorNombre",
                "Ingresa nombre y apellido válidos, solo letras."
            );
        }

        return mostrarValido("nombre", "errorNombre");
    }

    function validarTelefono() {
        const telefono = $("#telefono").val().trim();

        if (!telefono) {
            return mostrarError(
                "telefono",
                "errorTelefono",
                "El teléfono es obligatorio."
            );
        }

        if (!/^[67][0-9]{7}$/.test(telefono)) {
            return mostrarError(
                "telefono",
                "errorTelefono",
                "Ingresa un celular boliviano de 8 dígitos que empiece con 6 o 7."
            );
        }

        return mostrarValido("telefono", "errorTelefono");
    }

    function validarCorreo() {
        const correo = $("#correo").val().trim();
        const patron = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

        if (!correo) {
            return mostrarError(
                "correo",
                "errorCorreo",
                "El correo electrónico es obligatorio."
            );
        }

        if (!patron.test(correo)) {
            return mostrarError(
                "correo",
                "errorCorreo",
                "Ingresa un correo electrónico válido."
            );
        }

        return mostrarValido("correo", "errorCorreo");
    }

    function validarPago() {
        const pago = $("#metodoPago").val();

        if (pago !== "Efectivo" && pago !== "QR") {
            return mostrarError(
                "metodoPago",
                "errorPago",
                "Debes seleccionar un método de pago."
            );
        }

        return mostrarValido("metodoPago", "errorPago");
    }

    $("#nombre").on("blur input", validarNombre);
    $("#telefono").on("blur input", validarTelefono);
    $("#correo").on("blur input", validarCorreo);
    $("#metodoPago").on("change", validarPago);

    /* ================================
       14. CONFIRMAR RESERVA
    ================================= */

    $("#formReserva").submit(function (evento) {
        evento.preventDefault();

        const nombreOk = validarNombre();
        const telefonoOk = validarTelefono();
        const correoOk = validarCorreo();
        const pagoOk = validarPago();

        const fecha = $("#fechaReserva").val();
        const canchaId = $("#tipoCancha").val();

        $("#mensajeError").text("");

        if (!fecha || fecha < fechaLocal()) {
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

            $("#panelHorarios").slideDown("fast");
            return;
        }

        if (
            horarioPasado(fecha, horarioElegido) ||
            estaOcupado(canchaId, fecha, horarioElegido)
        ) {
            $("#mensajeError").text(
                "Este horario ya no está disponible."
            );

            cargarHorarios();
            return;
        }

        if (!nombreOk || !telefonoOk || !correoOk || !pagoOk) {
            $("#mensajeError").text(
                "Corrige todos los campos marcados en rojo."
            );

            $(".invalido").first().focus();
            return;
        }

        const reserva = {
            id: Date.now(),
            cancha: canchaId,
            fecha: fecha,
            hora: horarioElegido,
            nombre: $("#nombre").val().trim(),
            telefono: $("#telefono").val().trim(),
            correo: $("#correo").val().trim(),
            pago: $("#metodoPago").val(),
            precio: canchas[canchaId].precio
        };

        reservas.push(reserva);

        if (!guardarReservas()) {
            reservas.pop();

            $("#mensajeError").text(
                "No se pudo guardar la reserva."
            );
            return;
        }

        /* DETALLES DE CONFIRMACIÓN */

        const detalle = $("#detalleConfirmacion");
        detalle.empty();

        const datos = [
            ["Cliente", reserva.nombre],
            ["Cancha", canchas[canchaId].nombre],
            ["Fecha", reserva.fecha],
            [
                "Horario",
                reserva.hora + " - " + horaFinal(reserva.hora)
            ],
            ["Teléfono", reserva.telefono],
            ["Correo", reserva.correo],
            ["Método de pago", reserva.pago],
            ["Total", "Bs " + reserva.precio]
        ];

        datos.forEach(function (dato) {
            const linea = $("<p>");

            linea.append(
                $("<strong>").text(dato[0] + ": ")
            );

            linea.append(
                document.createTextNode(dato[1])
            );

            detalle.append(linea);
        });

        $("#modalConfirmacion")
            .css("display", "flex")
            .hide()
            .fadeIn(350);

        $("#formReserva")[0].reset();

        $(".valido, .invalido")
            .removeClass("valido invalido");

        $(".error-campo")
            .removeClass("visible")
            .text("");

        horarioElegido = null;

        cargarHorarios();
        actualizarResumen();
    });

    $("#cerrarModal").click(function () {
        $("#modalConfirmacion").fadeOut(250);
    });

    /* ================================
       15. INICIAR PÁGINA
    ================================= */

    seleccionarCancha("cesped");
    cargarHorarios();
    actualizarResumen();

});
