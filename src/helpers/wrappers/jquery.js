export default function jQueryWrapper(Handsontable) {
  const jQuery = typeof window === 'undefined' ? false : window.jQuery;

  if (!jQuery) {
    return;
  }

  jQuery.fn.handsontable = function(action) {
    const $this = this.first(); // Use only first element from list
    let instance = $this.data('handsontable');

    // Init case
    if (typeof action !== 'string') {
      const userSettings = action || {};

      if (instance) {
        instance.updateSettings(userSettings);

      } else {
        instance = new Handsontable.Core($this[0], userSettings);
        $this.data('handsontable', instance);
        instance.init();
      }

      return $this;
    }

    // Action case
    const args = [];
    let output;

    if (arguments.length > 1) {
      for (let i = 1, ilen = arguments.length; i < ilen; i++) {
        args.push(arguments[i]);
      }
    }

    if (instance) {
      if (typeof instance[action] !== 'undefined') {
        output = instance[action].apply(instance, args);

        if (action === 'destroy') {
          $this.removeData();
        }

      } else {
        throw new Error('Handsontable do not provide action: ' + action);
      }
    }

    return output;
  };
};
