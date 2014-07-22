"use strict";

importScripts("polyfills/idbCacheUtils.js");
importScripts("polyfills/fetchPolyfill.js");
importScripts("polyfills/idbCachePolyfill.js");
importScripts("polyfills/idbCacheStoragePolyfill.js");

var log = console.log.bind(console);
var err = console.error.bind(console);
this.onerror = err;

var notify = function() {
  if (self.Notification && self.Notification.permission == "granted") {
    new self.Notification(arguments[0]);
  } else {
    log.apply(arguments)
  }
};

var baseUrl = (new URL("./", this.location.href) + "");
notify(baseUrl);

this.addEventListener("install", function(e) {
  e.waitUntil(caches.create("v1").then(function(v1) {
    var resourceUrls = [
      '',
      '?offline',
      'index.html',
      'style.css',
      'app.js',
      'image-list.js',
      'star-wars-logo.jpg',
      'gallery/',
      'gallery/bountyHunters.jpg',
      'gallery/myLittleVader.jpg',
      'gallery/snowTroopers.jpg'
    ];

    return Promise.all(resourceUrls.map(function(relativeUrl) {
      return v1.add(baseUrl + relativeUrl);
    }));
  }));
});

this.addEventListener("fetch", function(e) {
  var request = e.request;

  if (this.scope.indexOf(request.origin) == -1) {
    return;
  }

  // Basic read-through caching.
  e.respondWith(
    caches.match(request, "v1").then(
      function(response) {
        return response;
      },
      function() {
        // we didn't have it in the cache, so add it to the cache and return it
        return caches.get("v1").then(
          function(v1) {
            log("runtime caching:", request.url);

            // FIXME(slighltyoff): add should take/return an array
            return v1.add(request).then(
              function(response) {
                return response;
              }
            );
          }
        );
      }
    )
  );
});

this.addEventListener("sync", function(e) {
  this.clients.getServiced().then(log, err);
});
