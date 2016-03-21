if (window.jQuery) {
  $.fn.handsontable = function (action) {
    var i,
      ilen,
      args,
      output,
      userSettings,
      $this = this.first(), // Use only first element from list
      instance = $this.data('handsontable');

    // Init case
    if (typeof action !== 'string') {
      userSettings = action || {};

      if (instance) {
        instance.updateSettings(userSettings);

      } else {
        instance = new Handsontable.Core($this[0], userSettings);
        $this.data('handsontable', instance);
        instance.init();
      }

      return $this;

    } else { // Action case
      args = [];

      if (arguments.length > 1) {
        for (i = 1, ilen = arguments.length; i < ilen; i++) {
          args.push(arguments[i]);
        }
      }

      if (instance) {
        if (typeof instance[action] !== 'undefined') {
          output = instance[action].apply(instance, args);

          if (action === 'destroy'){
            $this.removeData();
          }

        } else {
          throw new Error('Handsontable do not provide action: ' + action);
        }
      }

      return output;
    }
  };
}


