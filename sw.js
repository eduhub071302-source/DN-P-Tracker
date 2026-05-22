const CACHE_NAME = "dnp-tracker-v15";
const urlsToCache = [
  "./",
  "./index.html",
  "./admin.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css",
];

let timerIntervalId = null;
let sessionData = null;

// Install a service worker
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force the waiting SW to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    }),
  );
});

// Update a service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Cache and return requests (Network First strategy for GitHub Pages)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      }),
  );
});

// Handle mini notification touch response to foreground the app window
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow("./");
      }),
  );
});

// Message listener for live tracking processing inside the background worker execution thread
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.action === "startBackgroundTimer") {
    sessionData = event.data.session;
    startBackgroundLoop();
  } else if (event.data.action === "stopBackgroundTimer") {
    stopBackgroundLoop();
  }
});

function formatTime(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function startBackgroundLoop() {
  if (timerIntervalId) clearInterval(timerIntervalId);

  timerIntervalId = setInterval(() => {
    if (!sessionData) {
      clearInterval(timerIntervalId);
      return;
    }

    const elapsedSeconds = Math.floor(
      (Date.now() - sessionData.startTime) / 1000,
    );

    // Force background crash-cap at 90 Minutes (Pitstop Rule)
    if (elapsedSeconds >= 5400) {
      self.registration.showNotification("DN P Tracker PRO", {
        body: `🚨 Pitstop Rule Applied! Session capped at 90 mins and saved safely.`,
        icon: "https://cdn-icons-png.flaticon.com/512/3135/3135692.png",
        tag: "study-session",
        renotify: true,
        sticky: false,
      });
      stopBackgroundLoop();
      return;
    }

    let displayTime = "";
    let bodyText = "";

    if (sessionData.isPomodoro) {
      const totalPomoSeconds = sessionData.defaultPomoMins * 60;
      const remaining = totalPomoSeconds - elapsedSeconds;

      if (remaining <= 0) {
        displayTime = "00:00:00";
        bodyText = `🚨 Pomodoro Complete! Take a break. [${sessionData.subject}]`;
        clearInterval(timerIntervalId);
      } else {
        displayTime = formatTime(remaining);
        bodyText = `⏱️ Remaining: ${displayTime} | ${sessionData.subject} - ${sessionData.topic}`;
      }
    } else {
      displayTime = formatTime(elapsedSeconds);
      bodyText = `⏱️ Elapsed Time: ${displayTime} | ${sessionData.subject} - ${sessionData.topic}`;
    }

    self.registration.showNotification("DN P Tracker PRO", {
      body: bodyText,
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135692.png",
      tag: "study-session",
      renotify: false,
      silent: true, // Prevents consistent annoying device vibrate notification sound loops every second
      sticky: true,
    });
  }, 1000);
}

function stopBackgroundLoop() {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  sessionData = null;
  self.registration
    .getNotifications({ tag: "study-session" })
    .then((notifications) => {
      notifications.forEach((n) => n.close());
    });
}
