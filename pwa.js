'use strict';
window.addEventListener('load', async () => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    try {
        await navigator.serviceWorker.register('./service-worker.js', {
            scope: './', updateViaCache: 'none'
        });
        await navigator.serviceWorker.ready;
        console.info('PWA: archivos esenciales disponibles sin conexión.');
    } catch (error) {
        console.error('No se pudo preparar la PWA sin conexión:', error);
    }
});
let installPrompt = null;
window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    let button = document.getElementById('installPwaBtn');
    if (!button) {
        button = document.createElement('button');
        button.id = 'installPwaBtn';
        button.type = 'button';
        button.className = 'menu-link';
        button.textContent = 'Instalar aplicación';
        const host = document.querySelector('.menu-grid');
        if (!host) return;
        host.appendChild(button);
        button.addEventListener('click', async () => {
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
window.addEventListener('appinstalled', () => {
    installPrompt = null;
    const button = document.getElementById('installPwaBtn');
    if (button) button.hidden = true;
});
