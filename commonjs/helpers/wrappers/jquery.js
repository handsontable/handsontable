'use strict';

exports.__esModule = true;
exports.default = jQueryWrapper;
function jQueryWrapper(Handsontable) {
  var jQuery = typeof window === 'undefined' ? false : window.jQuery;

  if (!jQuery) {
    return;
  }

  jQuery.fn.handsontable = function (action) {
    var $this = this.first(); // Use only first element from list
    var instance = $this.data('handsontable');

    // Init case
    if (typeof action !== 'string') {
      var userSettings = action || {};

      if (instance) {
        instance.updateSettings(userSettings);
      } else {
        instance = new Handsontable.Core($this[0], userSettings);
        $this.data('handsontable', instance);
        instance.init();
      }

      return $this;
    }

    var output = void 0;

    // Action case
    if (instance) {
      if (typeof instance[action] !== 'undefined') {
        var _instance$action;

        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        output = (_instance$action = instance[action]).call.apply(_instance$action, [instance].concat(args));

        if (action === 'destroy') {
          $this.removeData();
        }
      } else {
        throw new Error('Handsontable do not provide action: ' + action);
      }
    }

    return output;
  };
}