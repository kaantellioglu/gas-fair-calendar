/* No fetch handler or offline cache: this calendar contains protected, shared data. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
