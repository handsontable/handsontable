interface JQuery {
  first(): JQuery;
  data(key: string, value?: any): any;
  removeData(): JQuery;
  handsontable(action?: any, ...args: any[]): any;
  fn: Record<string, any>;
}

interface Window {
  jQuery?: JQuery;
}

/**
 * @param {Core} Handsontable The Handsontable instance.
 */
export default function jQueryWrapper(Handsontable: any): void {
  // eslint-disable-next-line
  const jQuery = typeof window === 'undefined' ? false : (window as Window).jQuery;

  if (!jQuery) {
    return;
  }

  jQuery.fn.handsontable = function(action?: any, ...args: any[]): any {
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

    let output;

    // Action case
    if (instance) {
      if (typeof instance[action] !== 'undefined') {
        output = instance[action].call(instance, ...args);

        if (action === 'destroy') {
          $this.removeData();
        }

      } else {
        throw new Error(`Handsontable do not provide action: ${action}`);
      }
    }

    return output;
  };
}
