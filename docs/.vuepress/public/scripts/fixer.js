/* eslint-disable */
(function() {
  const isInternalFixer = /\handsontable.com$/.test(location.host);

  if (!isInternalFixer && typeof Babel !== 'undefined') {
    Babel.disableScriptTags();
  }
  if (typeof window.exports === 'undefined') {
    window.exports = {};
  }

  /**
   * @param string
   * @param firstLowerCase
   */
  function camelCase(string, firstLowerCase) {
    const s = string.replace(/-\D/g, (match) => {
      return match.charAt(1).toUpperCase();
    });

    if (firstLowerCase) {
      return s;
    }

    return s[0].toUpperCase() + s.substr(1);
  }

  // Necessery for jsFiddle environment
  if (!isInternalFixer && window.addEventListener) {
    function appendScript(code) {
      const scriptEl = document.createElement('script');

      scriptEl.text = code;
      document.head.appendChild(scriptEl);
    };

    window.addEventListener('load', () => {
      const sBabel = document.querySelector('script[data-presets]');

      if (sBabel) {
        appendScript(Babel.transform(sBabel.innerText, {
          presets: ['es2015', 'react', 'stage-0'],
          plugins: ['transform-decorators-legacy']
        }).code);
      }
      const sTypescript = document.querySelector('script[type=text\\/typescript]');

      if (sTypescript) {
        appendScript(ts.transpile(sTypescript.innerText));
      }
    }, false);
  }

  window.require = function(key) {
    try {
      let ns = '';

      if (key === 'exports') {
        return window.exports;
      }

      key.split('/').forEach((k, index) => {
        let nsPart = '';

        if (index === 0) {
          nsPart = camelCase(k.replace('@', ''));

          if (nsPart === 'Angular') {
            nsPart = 'ng';
          }
        } else {
          nsPart = `.${camelCase(k, true)}`;
        }

        ns = ns + nsPart;
      });

      if (key === 'react-dom') {
        ns = 'ReactDOM';

      } else if (key === '@handsontable/react') {
        ns = 'Handsontable.react';

      } else if (key === '@handsontable/vue') {
        ns = 'Handsontable.vue';

      } else if (/^handsontable\/dist\/.+\.css$/.test(key)) { // ignore CSS imports
        ns = '';

      } else if (key === 'numbro') {
        ns = 'numbro';

      } else if (/^numbro\/dist\/languages\.min(\.js)?$/.test(key)) {
        ns = 'numbro.allLanguages';

      } else if (/^numbro\/languages\/(.+)$/.test(key)) {
        const match = key.match(/^numbro\/languages\/(.+)$/);

        ns = `numbro.allLanguages.${match[1]}`;
      }

      let moduleToReturn = window;

      if (ns !== '') {
        ns.split('.').forEach((n) => {
          moduleToReturn = moduleToReturn[n];
        });

        if (typeof moduleToReturn === 'undefined') {
          moduleToReturn = window.exports;

          ns.split('.').forEach((n) => {
            moduleToReturn = moduleToReturn[n];
          });
        }
      }

      return moduleToReturn;
    } catch (error) {
      console.error('Error when trying import ', key);
      throw error;
    }
  };
}());
