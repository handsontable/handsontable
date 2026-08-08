/**
 * Opaque-origin storage guard (Sentry HANDSONTABLE-DOCS-206).
 *
 * In a document with an opaque origin -- about:blank, sandboxed iframes, srcdoc frames --
 * reading `window.localStorage` throws SecurityError instead of returning undefined, so the
 * usual `typeof localStorage !== 'undefined'` guard throws as well. Starlight's ThemeProvider,
 * ThemeSelect, and SidebarPersister all rely on that guard, and the throw aborts the rest of
 * their inline scripts.
 *
 * Each storage is probed once, and an in-memory stand-in is installed only when the read
 * throws. Real browsers keep native persistent storage untouched.
 *
 * Inlined as the first <head> entry by astro.config.mjs -- keep it ES5 and dependency-free.
 */
(function () {
  function createMemoryStorage() {
    var data = {};

    return {
      getItem: function (key) {
        var name = String(key);

        return Object.prototype.hasOwnProperty.call(data, name) ? data[name] : null;
      },
      setItem: function (key, value) {
        data[String(key)] = String(value);
      },
      removeItem: function (key) {
        delete data[String(key)];
      },
      clear: function () {
        data = {};
      },
      key: function (index) {
        var keys = Object.keys(data);

        return index >= 0 && index < keys.length ? keys[index] : null;
      },
      get length() {
        return Object.keys(data).length;
      },
    };
  }

  function isReadable(name) {
    try {
      return !!window[name];
    } catch (error) {
      return false;
    }
  }

  var names = ['localStorage', 'sessionStorage'];

  for (var i = 0; i < names.length; i++) {
    if (isReadable(names[i])) {
      continue;
    }

    try {
      Object.defineProperty(window, names[i], {
        value: createMemoryStorage(),
        configurable: true,
      });
    } catch (error) {
      // A browser that refuses the redefinition keeps its own behavior; nothing else to do.
    }
  }
})();
