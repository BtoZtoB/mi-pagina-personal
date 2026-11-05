
document.addEventListener("DOMContentLoaded", () => {

    // CAMBIAR MODO OSCURO Y CLARO
    const temaBtn = document.getElementById("temaBtn");

    temaBtn.addEventListener("click", () => {
        document.body.classList.toggle("claro");

        const claro = document.body.classList.contains("claro");

        temaBtn.textContent = claro ? "🌙" : "☀️";
    });

    // BOTON EXPLORAR
    const explorarBtn = document.getElementById("explorarBtn");

    explorarBtn.addEventListener("click", () => {
        document.getElementById("servicios")
            .scrollIntoView({ behavior: "smooth" });
    });

    // BOTONES DE INFORMACION
    const botones = document.querySelectorAll(".info-btn");

    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            alert(boton.dataset.info);
        });
    });

    // FORMULARIO DE CONTACTO
    const formulario = document.getElementById("contactoForm");
    const respuesta = document.getElementById("respuesta");

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const nombre = document.getElementById("nombre").value;

        respuesta.textContent =
            "¡Gracias, " + nombre + "! Tu mensaje de prueba fue registrado.";

        formulario.reset();
    });

});
