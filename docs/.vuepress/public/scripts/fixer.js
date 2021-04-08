(function() {
  if (typeof window.exports === 'undefined') {
    window.exports = {};
  }

  function camelCase(string, firstLowerCase) {
    var s = string.replace(/-\D/g, function(match){
      return match.charAt(1).toUpperCase();
    });

    if (firstLowerCase) {
      return s;
    }

    return s[0].toUpperCase() + s.substr(1);
  }
  
  window.require = function(key) {
    var ns = '';

    if (key === 'exports') {
      return window.exports;
    }

    key.split('/').forEach(function(k, index) {
      var nsPart = '';

      if (index === 0) {
        nsPart = camelCase(k.replace('@', ''));

        if (nsPart === 'Angular') {
          nsPart = 'ng';

        } else if (nsPart === 'HandsontablePro') {
          nsPart = 'Handsontable';
        }
      } else {
        nsPart = '.' + camelCase(k, true);
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
      var match = key.match(/^numbro\/languages\/(.+)$/);

      ns = 'numbro.allLanguages.' + match[1];
    }

    var moduleToReturn = window;

    if (ns !== '') {
      ns.split('.').forEach(function(n) {
        moduleToReturn = moduleToReturn[n];
      });

      if (typeof moduleToReturn === 'undefined') {
        moduleToReturn = window.exports;

        ns.split('.').forEach(function(n) {
          moduleToReturn = moduleToReturn[n];
        });
      }
    }

    return moduleToReturn;
  }
}())
