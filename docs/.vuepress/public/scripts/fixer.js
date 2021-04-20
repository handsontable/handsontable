/* eslint-disable */
(function() {
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

          } else if (nsPart === 'HandsontablePro') {
            nsPart = 'Handsontable';
          }
        } else {
          nsPart = `.${camelCase(k, true)}`;
        }

        ns = ns + nsPart;
      });

      if (key === 'react-dom') {
        ns = 'ReactDOM';

      } else if (key === '@handsontable/react' || key === '@handsontable-pro/react') {
        ns = 'Handsontable.react';

      } else if (key === '@handsontable/vue' || key === '@handsontable-pro/vue') {
        ns = 'Handsontable.vue';

      } else if (key === 'handsontable-pro') {
        ns = 'Handsontable';

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
