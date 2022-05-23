/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.conf > pwa > workboxPluginMode is set to "InjectManifest"
 */


// Caching
// https://medium.com/js-dojo/vuejs-pwa-cache-busting-8d09edd22a31

import { precacheAndRoute, getCacheKeyForURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { cacheNames } from "workbox-core";
import {
    StaleWhileRevalidate,
    NetworkFirst,
    NetworkOnly,
} from "workbox-strategies";

console.log('ServiceWorker v1');

// Activate precaching
precacheAndRoute(self.__WB_MANIFEST, {
    directoryIndex: null, // Diasable index.html precaching ref: https://developers.google.com/web/tools/workbox/modules/workbox-precaching
});

// Implements the network-first strategy for navigation routes that falls back to preloaded cache (index.html)
registerRoute(
    new NavigationRoute(async ({ url }) => {
        const cacheName = cacheNames.precache;
        const cacheKey = getCacheKeyForURL("/index.html");
        const cache = await caches.open(cacheName);

        let networkResponse;
        let networkError;
        try {
            networkResponse = await fetch(url);
            if (networkResponse.ok) {
                await cache.put(cacheKey, networkResponse.clone());
                return networkResponse;
            }
        } catch (error) {
            networkError = error;
        }

        const cacheMatch = await cache.match(cacheKey);
        if (cacheMatch) {
            return cacheMatch;
        } else if (networkResponse) {
            return networkResponse;
        } else {
            throw networkError;
        }
    })
);

registerRoute(new RegExp("^http"), new StaleWhileRevalidate());