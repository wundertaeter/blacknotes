import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

console.log('ServiceWorker v2');

// Activate precaching
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(new RegExp("^http"), new StaleWhileRevalidate());