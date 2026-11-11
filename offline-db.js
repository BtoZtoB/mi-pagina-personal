'use strict';
self.OfflineDB = (() => {
    let connection;
    function open() {
        if (connection) return connection;
        connection = new Promise((resolve, reject) => {
            const request = indexedDB.open('bryan-contactos-offline', 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore('mensajes', {keyPath: 'id'});
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => { connection = null; reject(request.error); };
        });
        return connection;
    }
    async function run(mode, operation) {
        const db = await open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('mensajes', mode);
            let request;
            try { request = operation(transaction.objectStore('mensajes')); }
            catch (error) { reject(error); return; }
            transaction.oncomplete = () => resolve(request.result);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error || new Error('Almacenamiento cancelado'));
        });
    }
    return {
        all: () => run('readonly', store => store.getAll()),
        put: item => run('readwrite', store => store.put(item)),
        add: data => run('readwrite', store => store.add({
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            status: 'pending',
            data
        }))
    };
})();
