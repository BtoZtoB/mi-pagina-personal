'use strict';
(() => {
    let registration = null;
    let installPrompt = null;
    let saving = false;
    let refreshNumber = 0;

    function addDiagnostics() {
        const menu = document.querySelector('.menu-grid');
        if (!menu || document.getElementById('diagnosticoBtn')) return;
        const button = document.createElement('button');
        button.id = 'diagnosticoBtn';
        button.type = 'button';
        button.className = 'menu-link';
        button.textContent = 'Diagnóstico';
        button.addEventListener('click', () => {
            location.assign(new URL('./diagnostico.html', document.baseURI).href);
        });
        menu.appendChild(button);
    }

    function notify(text) {
        const box = document.getElementById('alertaBox');
        if (!box) return;
        if (window.jQuery) jQuery(box).stop(true, true);
        box.replaceChildren();
        const message = document.createElement('div');
        message.className = 'alert alert-info';
        message.setAttribute('role', 'status');
        message.textContent = text;
        box.appendChild(message);
        box.style.display = 'block';
    }

    async function refreshStatus() {
        const version = ++refreshNumber;
        const status = document.getElementById('estadoRed');
        if (!status) return;
        try {
            const items = await OfflineDB.all();
            if (version !== refreshNumber) return;
            const pending = items.filter(item => item.status === 'pending').length;
            const sent = items.filter(item => item.status === 'sent').length;
            const network = navigator.onLine ? 'En línea' : 'Modo offline · Datos locales';
            const receiver = self.PWA_CONTACT_ENDPOINT
                ? '' : ' · Envío al servidor sin configurar';
            status.textContent = network + ' · Pendientes: ' + pending +
                ' · Confirmados: ' + sent + receiver;
            status.dataset.offline = String(!navigator.onLine);
        } catch (_) {
            status.textContent = 'No se pudo abrir el almacenamiento local.';
        }
    }

    async function requestSync() {
        if (!registration || !navigator.onLine) return;
        if ('sync' in registration) {
            try { await registration.sync.register('bryan-contactos'); }
            catch (error) { console.info('Se usará sincronización con la app abierta.', error); }
        }
        if (registration.active) {
            registration.active.postMessage({type: 'SYNC_CONTACTS'});
        }
    }

    function validForm(form) {
        return [...form.querySelectorAll('input, select, textarea')].every(field => {
            if (field.type === 'checkbox') return field.checked;
            const value = field.value.trim();
            if (!value) return false;
            if (field.id === 'correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false;
            if (field.id === 'telefono') {
                const digits = value.replace(/\D/g, '');
                if (digits.length < 7 || digits.length > 15 || !/^\+?[\d\s()-]+$/.test(value)) return false;
            }
            return true;
        });
    }

    async function storeContact(event) {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || form.id !== 'contactForm') return;
        // Los campos inválidos siguen usando las validaciones de script.js.
        if (!validForm(form)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (saving) return;
        saving = true;
        const button = document.getElementById('formSend');
        button.disabled = true;
        const data = {};
        for (const field of form.querySelectorAll('input, select, textarea')) {
            data[field.id] = field.type === 'checkbox' ? field.checked : field.value.trim();
        }
        notify('Guardando en este dispositivo…');
        try {
            await OfflineDB.add(data);
            form.reset();
            for (const field of form.querySelectorAll('input, select, textarea')) {
                field.classList.remove('is-valid', 'is-invalid');
                field.removeAttribute('aria-invalid');
                field.removeAttribute('aria-describedby');
                delete field.dataset.tocado;
            }
            if (window.jQuery) jQuery(form).find('.mensaje-error').stop(true, true).hide().removeClass('visible').text('');
            form.querySelector('[data-step="0"]').click();
            notify('Guardado localmente · Pendiente de envío.' +
                (self.PWA_CONTACT_ENDPOINT ? '' : ' Falta configurar el servicio receptor.'));
            await refreshStatus();
            await requestSync();
        } catch (error) {
            notify('No se pudo guardar. Tu mensaje sigue en el formulario; vuelve a intentarlo.');
            console.error(error);
        } finally {
            saving = false;
            button.disabled = false;
        }
    }

    async function start() {
        addDiagnostics();
        const style = document.createElement('style');
        style.textContent = `
            #estadoRed{flex-shrink:0;padding:5px 10px;border-bottom:1px solid #344e73;background:#123f35;color:#eafff5;text-align:center;font:10px/1.4 Arial,sans-serif;overflow-wrap:anywhere}
            #estadoRed[data-offline="true"]{background:#673915;color:#fff0dc}
        `;
        document.head.appendChild(style);
        const status = document.createElement('div');
        status.id = 'estadoRed';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        document.querySelector('.app-header').after(status);
        const consent = document.querySelector('label[for="aceptoDatos"]');
        if (consent) consent.textContent = 'Acepto guardar estos datos en este dispositivo y enviarlos al servicio receptor configurado cuando haya conexión. *';
        const description = document.querySelector('#contacto > .descripcion');
        if (description) description.textContent = 'Todos los campos son obligatorios. El mensaje se guarda en este dispositivo y queda pendiente hasta que el servidor confirme su recepción.';
        const send = document.getElementById('formSend');
        if (send) send.textContent = 'Guardar mensaje';
        await refreshStatus();
        if (!('serviceWorker' in navigator) || !isSecureContext) return;
        try {
            registration = await navigator.serviceWorker.register('./service-worker.js', {
                scope: './', updateViaCache: 'none'
            });
            registration = await navigator.serviceWorker.ready;
            await requestSync();
        } catch (error) {
            console.error('No se pudo preparar el modo offline:', error);
        }
    }

    document.addEventListener('submit', storeContact, true);
    window.addEventListener('online', async () => {
        await refreshStatus();
        await requestSync();
    });
    window.addEventListener('offline', refreshStatus);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) { refreshStatus(); requestSync(); }
    });
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'CONTACTS_UPDATED') refreshStatus();
        });
    }
    window.addEventListener('beforeinstallprompt', event => {
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
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
    else start();
})();
