
// =====================================================
// PÁGINA PERSONAL - BRYAN ZELAYA
// JavaScript y manipulación del DOM
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    // =================================================
    // 1. MENÚ LATERAL
    // =================================================

    const menu = document.getElementById("menu");

    if (menu && typeof bootstrap !== "undefined") {
        const enlacesMenu = menu.querySelectorAll(".nav-link");

        enlacesMenu.forEach(function (enlace) {
            enlace.addEventListener("click", function () {
                const instancia = bootstrap.Offcanvas.getInstance(menu);

                if (instancia) {
                    instancia.hide();
                }
            });
        });
    }


    // =================================================
    // 2. MODO OSCURO
    // =================================================

    const themeBtn = document.getElementById("themeBtn");

    if (themeBtn) {

        function actualizarBotonTema() {
            const oscuro = document.body.classList.contains("dark-mode");

            themeBtn.setAttribute("aria-pressed", String(oscuro));

            themeBtn.innerHTML = oscuro
                ? '<i class="bi bi-sun"></i> <span>Modo claro</span>'
                : '<i class="bi bi-moon-stars"></i> <span>Modo oscuro</span>';
        }

        const temaGuardado = localStorage.getItem("temaPagina");

        if (temaGuardado === "oscuro") {
            document.body.classList.add("dark-mode");
        }

        actualizarBotonTema();

        themeBtn.addEventListener("click", function () {

            document.body.classList.toggle("dark-mode");

            const oscuro = document.body.classList.contains("dark-mode");

            localStorage.setItem(
                "temaPagina",
                oscuro ? "oscuro" : "claro"
            );

            actualizarBotonTema();
        });
    }


    // =================================================
    // 3. HORARIO DE GOOGLE SHEETS
    // =================================================

    const horario = document.getElementById("googleSheetsHorario");
    const sheetsFrame = document.getElementById("sheetsFrame");
    const sheetsPendiente = document.getElementById("sheetsPendiente");

    if (horario && sheetsFrame) {

        const enlaceSheets = horario.dataset.sheetUrl;

        if (enlaceSheets) {

            sheetsFrame.src = enlaceSheets;
            sheetsFrame.style.display = "block";

            if (sheetsPendiente) {
                sheetsPendiente.style.display = "none";
            }

        } else if (sheetsPendiente) {

            sheetsPendiente.innerHTML =
                "<p>No se ha configurado el horario de Google Sheets.</p>";
        }
    }


    // =================================================
    // 4. FILTROS DE MÚSICA
    // =================================================

    const botonesMusica = document.querySelectorAll(".boton-musica");
    const artistas = document.querySelectorAll(".artista-item");

    botonesMusica.forEach(function (boton) {

        boton.addEventListener("click", function () {

            const generoSeleccionado = boton.dataset.genero;

            botonesMusica.forEach(function (otroBoton) {
                otroBoton.classList.remove("activo");
            });

            boton.classList.add("activo");

            artistas.forEach(function (artista) {

                const generoArtista = artista.dataset.genero;

                if (
                    generoSeleccionado === "todos" ||
                    generoArtista === generoSeleccionado
                ) {
                    artista.style.display = "";
                } else {
                    artista.style.display = "none";
                }
            });
        });
    });


    // =================================================
    // 5. FILTROS DE VIDEOJUEGOS
    // =================================================

    const botonesJuegos = document.querySelectorAll(".boton-filtro");
    const juegos = document.querySelectorAll(".juego-item");

    botonesJuegos.forEach(function (boton) {

        boton.addEventListener("click", function () {

            const filtroSeleccionado = boton.dataset.filtro;

            botonesJuegos.forEach(function (otroBoton) {
                otroBoton.classList.remove("activo");
            });

            boton.classList.add("activo");

            juegos.forEach(function (juego) {

                const categoria = juego.dataset.categoria;

                if (
                    filtroSeleccionado === "todos" ||
                    categoria === filtroSeleccionado
                ) {
                    juego.style.display = "";
                } else {
                    juego.style.display = "none";
                }
            });
        });
    });


    // =================================================
    // 6. GRÁFICO DE ACTIVIDADES
    // =================================================

    const canvasGrafico = document.getElementById("graficoActividades");

    if (canvasGrafico && typeof Chart !== "undefined") {

        new Chart(canvasGrafico, {
            type: "bar",

            data: {
                labels: [
                    "Dormir",
                    "Estudiar",
                    "Trabajar",
                    "Videojuegos",
                    "Comer",
                    "Otras actividades"
                ],

                datasets: [{
                    label: "Horas por día",

                    data: [8, 4, 5, 2, 2, 3],

                    backgroundColor: [
                        "#dc3545",
                        "#172554",
                        "#2563eb",
                        "#ef4444",
                        "#64748b",
                        "#0f172a"
                    ],

                    borderRadius: 7
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            stepSize: 2
                        }
                    }
                }
            }
        });
    }


    // =================================================
    // 7. SALUDO INTERACTIVO
    // =================================================

    const saludoBtn = document.getElementById("saludoBtn");
    const salidaSaludo = document.getElementById("interactive-output");

    if (saludoBtn && salidaSaludo) {

        saludoBtn.addEventListener("click", function () {

            const hora = new Date().getHours();
            let saludo;

            if (hora < 12) {
                saludo = "¡Buenos días!";
            } else if (hora < 19) {
                saludo = "¡Buenas tardes!";
            } else {
                saludo = "¡Buenas noches!";
            }

            salidaSaludo.textContent =
                saludo + " Gracias por visitar mi página personal.";
        });
    }


    // =================================================
    // 8. VALIDACIÓN COMPLETA DEL FORMULARIO
    // =================================================

    const formulario = document.getElementById("contactForm");
    const alertaBox = document.getElementById("alertaBox");

    if (formulario) {

        const idsCampos = [
            "nombre",
            "apellidos",
            "correo",
            "telefono",
            "ciudad",
            "pais",
            "motivo",
            "urgencia",
            "asunto",
            "mensaje",
            "aceptoDatos"
        ];

        const campos = idsCampos
            .map(function (id) {
                return document.getElementById(id);
            })
            .filter(function (campo) {
                return campo !== null;
            });


        // ---------------------------------------------
        // Función para obtener el mensaje de error
        // ---------------------------------------------

        function obtenerError(campo) {

            const valor = campo.value.trim();

            // Casilla de aceptación
            if (campo.type === "checkbox") {

                if (!campo.checked) {
                    return "Debes aceptar esta casilla para continuar.";
                }

                return "";
            }

            // Campos vacíos
            if (valor === "") {
                return "Este campo es obligatorio.";
            }

            // Correo electrónico
            if (campo.id === "correo") {

                const expresionCorreo =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!expresionCorreo.test(valor)) {
                    return "Ingresa un correo electrónico válido.";
                }
            }

            // Teléfono
            if (campo.id === "telefono") {

                const numeros = valor.replace(/\D/g, "");

                if (numeros.length < 7 || numeros.length > 15) {
                    return "Ingresa un número de teléfono válido.";
                }

                if (!/^\+?[\d\s()-]+$/.test(valor)) {
                    return "El teléfono solo puede contener números y símbolos telefónicos.";
                }
            }

            return "";
        }


        // ---------------------------------------------
        // Mostrar o quitar el mensaje de error
        // ---------------------------------------------

        function mostrarValidacion(campo) {

            const mensaje = obtenerError(campo);

            const contenedorError = document.getElementById(
                "error-" + campo.id
            );

            if (!contenedorError) {
                return mensaje === "";
            }

            if (mensaje !== "") {

                campo.classList.add("is-invalid");
                campo.classList.remove("is-valid");

                campo.setAttribute("aria-invalid", "true");
                campo.setAttribute(
                    "aria-describedby",
                    contenedorError.id
                );

                contenedorError.innerHTML =
                    '<i class="bi bi-exclamation-circle-fill"></i>' +
                    '<span>' + mensaje + '</span>';

                contenedorError.classList.add("visible");

                return false;

            } else {

                campo.classList.remove("is-invalid");
                campo.classList.add("is-valid");

                campo.setAttribute("aria-invalid", "false");

                contenedorError.textContent = "";
                contenedorError.classList.remove("visible");

                return true;
            }
        }


        // ---------------------------------------------
        // Validar al salir de un campo
        // ---------------------------------------------

        campos.forEach(function (campo) {

            // Cuando el usuario sale del campo
            campo.addEventListener("blur", function () {

                campo.dataset.tocado = "true";

                mostrarValidacion(campo);
            });


            // Mientras escribe, corregir el error
            campo.addEventListener("input", function () {

                if (campo.dataset.tocado === "true") {
                    mostrarValidacion(campo);
                }
            });


            // Cuando cambia una selección
            campo.addEventListener("change", function () {

                campo.dataset.tocado = "true";

                mostrarValidacion(campo);
            });
        });


        // ---------------------------------------------
        // Validar todo al presionar Enviar
        // ---------------------------------------------

        formulario.addEventListener("submit", function (evento) {

            evento.preventDefault();

            let formularioValido = true;
            let primerCampoIncorrecto = null;

            campos.forEach(function (campo) {

                campo.dataset.tocado = "true";

                const campoValido = mostrarValidacion(campo);

                if (!campoValido) {

                    formularioValido = false;

                    if (primerCampoIncorrecto === null) {
                        primerCampoIncorrecto = campo;
                    }
                }
            });


            // Si existen errores
            if (!formularioValido) {

                if (alertaBox) {

                    alertaBox.innerHTML = `
                        <div class="alert alert-danger" role="alert">
                            <i class="bi bi-exclamation-triangle-fill"></i>
                            <strong>Formulario incompleto.</strong>
                            Debes completar correctamente todos
                            los campos obligatorios.
                        </div>
                    `;
                }

                if (primerCampoIncorrecto) {

                    primerCampoIncorrecto.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                    primerCampoIncorrecto.focus({
                        preventScroll: true
                    });
                }

                return;
            }


            // Si todos los campos son correctos
            if (alertaBox) {

                alertaBox.innerHTML = `
                    <div class="alert alert-success" role="status">
                        <i class="bi bi-check-circle-fill"></i>
                        <strong>¡Formulario validado correctamente!</strong>
                        Todos los campos fueron completados.
                        Este formulario es una demostración,
                        por lo que no se enviaron datos.
                    </div>
                `;
            }

            // Limpiar el formulario
            formulario.reset();

            // Quitar estilos y avisos
            campos.forEach(function (campo) {

                campo.classList.remove("is-valid", "is-invalid");

                campo.removeAttribute("aria-invalid");
                campo.removeAttribute("aria-describedby");

                delete campo.dataset.tocado;

                const error = document.getElementById(
                    "error-" + campo.id
                );

                if (error) {
                    error.textContent = "";
                    error.classList.remove("visible");
                }
            });
        });
    }

});
