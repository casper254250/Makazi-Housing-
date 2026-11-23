(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('./namespace') : {});
  var listeners = {};

  function on(eventName, handler) {
    if (!eventName || typeof handler !== 'function') return function () {};
    if (!listeners[eventName]) listeners[eventName] = [];
    listeners[eventName].push(handler);
    return function unsubscribe() {
      off(eventName, handler);
    };
  }

  function off(eventName, handler) {
    if (!listeners[eventName]) return;
    listeners[eventName] = listeners[eventName].filter(function (fn) {
      return fn !== handler;
    });
  }

  function emit(eventName, payload) {
    var list = listeners[eventName];
    if (!list || !list.length) return;
    var snapshot = list.slice();
    for (var i = 0; i < snapshot.length; i++) {
      try {
        snapshot[i](payload);
      } catch (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('Event listener error for ' + eventName + ':', err);
        }
      }
    }
  }

  function clear() {
    listeners = {};
  }

  var events = {
    on: on,
    off: off,
    emit: emit,
    clear: clear
  };

  Makazi.core = Makazi.core || {};
  Makazi.core.events = events;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = events;
  }
})(typeof window !== 'undefined' ? window : globalThis);
