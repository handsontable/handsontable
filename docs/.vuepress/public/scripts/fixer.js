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

  function toUpperCaseFirst(string) {
    return string[0].toUpperCase() + string.substr(1);
  }

  // Necessary for jsFiddle environment
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

      if (key === './helpers') {
        ns = 'helpers';

      } else if (key === 'handsontable/base') {
        ns = 'Handsontable';

      } else if (key === 'hyperformula') {
        ns = 'HyperFormula';

      } else if (key === 'react-dom/client') {
        ns = 'ReactDOM';

      } else if (key === 'react-colorful') {
        return window.exports;

      }
      else if (key === '@handsontable/angular') {
        ns = 'Handsontable.angular';

      } else if (key === '@handsontable/react-wrapper') {
        ns = 'Handsontable.react';

      } else if (key === '@handsontable/react') {
        ns = 'Handsontable.react';

      } else if (key === '@handsontable/vue' || key === '@handsontable/vue3') {
        ns = 'Handsontable.vue';

      } else if (key === 'vuex') {
        ns = 'Vuex';

      } else if (key === 'vue-color') {
        ns = 'VueColor';

      } else if (key === 'vue-star-rating') {
        ns = 'VueStarRating';

      } else if (key === 'vue-class-component') {
        ns = 'VueClassComponent';

      } else if (/^handsontable\/dist|styles\/.+\.css$/.test(key)) { // ignore CSS imports
        ns = '';

      } else if (key === 'numbro') {
        ns = 'numbro';

      } else if (/^numbro\/dist\/languages\.min(\.js)?$/.test(key)) {
        ns = 'numbro.allLanguages';

      } else if (/^numbro\/languages\/(.+)$/.test(key)) {
        const match = key.match(/^numbro\/languages\/(.+)$/);

        ns = `numbro.allLanguages.${match[1]}`;

      } else if (/^handsontable\/registry$/.test(key)) {
        // The wrappers are run in the environment where the full Handsontable
        // exists. The `handsontable/registry` imports are only use as an example how to
        // use these functions.
        return {
          registerAllEditors: function() {},
          registerAllRenderers: function() {},
          registerAllValidators: function() {},
          registerAllCellTypes: function() {},
          registerAllPlugins: function() {},
          registerAllModules: function() {},
        };
      } else if (/^handsontable\/cellTypes(\/(.+))?$/.test(key)) {
        ns = 'Handsontable.cellTypes';

      } else if (/^handsontable\/editors(\/(.+))?$/.test(key)) {
        ns = 'Handsontable.editors';

      } else if (/^handsontable\/plugins(\/(.+))?$/.test(key)) {
        ns = 'Handsontable.plugins';

      } else if (/^handsontable\/renderers(\/(.+))?$/.test(key)) {
        ns = 'Handsontable.renderers';

      } else if (/^handsontable\/validators(\/(.+))?$/.test(key)) {
        ns = 'Handsontable.validators';

      } else if (/^handsontable\/i18n(\/(.+))?$/.test(key)) {
        ns = 'Handsontable.languages';
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

        // Covers `import plPL from 'handsontable/languages'` expressions
        if (ns === 'Handsontable.languages') {
          Handsontable.languages.getLanguagesDictionaries().forEach((lang) => {
            moduleToReturn[lang.languageCode.replace('-', '')] = lang;
          });

        // Covers `import { textRenderer } from 'handsontable/renderers'` expressions
        } else if (ns === 'Handsontable.renderers') {
          moduleToReturn = Handsontable.renderers;

          Object.keys(Handsontable.renderers).forEach((rendererKey) => {
            if (rendererKey.endsWith('Renderer')) {
              const camelCase = rendererKey.replace(/^[A-Z]/, (firstChar) => firstChar.toLowerCase());

              moduleToReturn[camelCase] = moduleToReturn[rendererKey];
            }
          });

        } else if (ns === 'HyperFormula') {
          moduleToReturn.HyperFormula = HyperFormula;
        }

        // Covers default import expressions
        if (typeof moduleToReturn.default === 'undefined') {
          Object.defineProperty(moduleToReturn, 'default', {
            value: moduleToReturn,
            writable: false,
            enumerable: false,
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
