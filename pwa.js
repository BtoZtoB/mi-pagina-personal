'use strict';

// ACCESO AL DIAGNÓSTICO
function agregarDiagnostico() {
    const menu = document.querySelector('.menu-grid');

    if (!menu || document.getElementById('diagnosticoBtn')) return;

    const button = document.createElement('button');

    button.id = 'diagnosticoBtn';
    button.type = 'button';
    button.className = 'menu-link';

    const icon = document.createElement('i');
    icon.className = 'bi bi-code-square';
    icon.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.textContent = 'Diagnóstico';

    button.append(icon, label);
    menu.appendChild(button);

    button.addEventListener('click', function () {
        // Abrir en la misma ventana y dentro del alcance de la PWA.
        window.location.assign(
            new URL('./diagnostico.html', document.baseURI).href
        );
    });
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        agregarDiagnostico,
        { once: true }
    );
} else {
    agregarDiagnostico();
}

// SERVICE WORKER
async function registrarPWA() {
    if (
        !('serviceWorker' in navigator) ||
        !window.isSecureContext
    ) {
        return;
    }

    try {
        await navigator.serviceWorker.register(
            './service-worker.js',
            {
                scope: './',
                updateViaCache: 'none'
            }
        );

        await navigator.serviceWorker.ready;

        console.info(
            'PWA: archivos esenciales disponibles sin conexión.'
        );
    } catch (error) {
        console.error(
            'No se pudo preparar la PWA sin conexión:',
            error
        );
    }
}

if (document.readyState === 'complete') {
    registrarPWA();
} else {
    window.addEventListener('load', registrarPWA, { once: true });
}

// INSTALACIÓN
let installPrompt = null;

window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    installPrompt = event;

    let button = document.getElementById('installPwaBtn');

    if (!button) {
        const menu = document.querySelector('.menu-grid');
        if (!menu) return;

        button = document.createElement('button');

        button.id = 'installPwaBtn';
        button.type = 'button';
        button.className = 'menu-link';
        button.textContent = 'Instalar aplicación';

        menu.appendChild(button);

        button.addEventListener('click', async function () {
            if (!installPrompt) return;

            const prompt = installPrompt;

            installPrompt = null;
            button.hidden = true;

            await prompt.prompt();
            await prompt.userChoice;
        });
    }

    button.hidden = false;
});

window.addEventListener('appinstalled', function () {
    installPrompt = null;

    const button = document.getElementById('installPwaBtn');

    if (button) button.hidden = true;
});
