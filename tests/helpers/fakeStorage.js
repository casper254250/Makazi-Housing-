'use strict';

function createFakeStorage(initialData) {
  var store = Object.assign({}, initialData || {});

  return {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem: function (key, value) {
      store[key] = String(value);
    },
    removeItem: function (key) {
      delete store[key];
    },
    clear: function () {
      store = {};
    },
    snapshot: function () {
      return Object.assign({}, store);
    }
  };
}

module.exports = {
  createFakeStorage: createFakeStorage
};
