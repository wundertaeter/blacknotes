import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

console.log('ServiceWorker v2');

// Activate precaching
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(new RegExp("^http"), new StaleWhileRevalidate());




/*
 * Push notifications
 */
// Receive the push event sent from the backend
self.addEventListener("push", e => {
    const data = e.data.json();
    console.log("Service Worker: Push Recieved...", data);
    const info = { icon: `${self.registration.scope}favicon.ico` };
    if (data.msg) info.body = data.msg;
    info.data = { onClickURL: data.on_click_url };
    self.registration.showNotification(data.title, info);
  });
  
  // Push notification on click event handler.
  // If on_click_url was given, this handler will open a new browser tab on that url.
  self.addEventListener("notificationclick", function(event) {
    event.notification.close();
    const data = event.notification.data;
    console.log("Service Worker: notificationclick", event);
    const onClickURL = data.onClickURL;
    let url = self.registration.scope;
    if (onClickURL) {
      if (onClickURL.startsWith("/")) {
        // Relative path
        url = (url.endsWith("/") ? url.slice(0, -1) : url) + onClickURL;
      } else {
        // Absolute url
        url = onClickURL;
      }
    }
    event.waitUntil(
      clients.matchAll({ type: "window" }).then(async clientsArr => {
        const hadWindowToFocus = clientsArr.some(windowClient =>
          windowClient.url === url ? (windowClient.focus(), true) : false
        );
        if (!hadWindowToFocus) {
          let windowClient;
          for (let i = 0; i < clientsArr.length; i++) {
            try{
              windowClient = await clientsArr[i].focus();
              windowClient.navigate(url);
              break;
            }catch{}
          }
          if (!windowClient) {
            clients.openWindow(url).then(windowClient => windowClient ? windowClient.focus() : null);
          }
        }
      })
    );
  });