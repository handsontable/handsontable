import { throwWithCause } from '../../helpers/errors';

/**
 * @param {Core} Handsontable The Handsontable instance.
 */
export default function jQueryWrapper(Handsontable: Record<string, unknown>) {
  // eslint-disable-next-line
  const jQuery = typeof window === 'undefined' ? false : (window as Window & { jQuery?: Function }).jQuery;

  if (!jQuery) {
    return;
  }

  type JQueryWithHOT = ((...jqueryArgs: unknown[]) => unknown) & { fn: Record<string, unknown> };

  (jQuery as JQueryWithHOT).fn.handsontable = function(action: unknown, ...args: unknown[]) {
    const $this = this.first(); // Use only first element from list
    let instance = $this.data('handsontable');

    // Init case
    if (typeof action !== 'string') {
      const userSettings = action || {};

      if (instance) {
        instance.updateSettings(userSettings);

      } else {
        type HotCtor = new (...args: unknown[]) => Record<string, Function>;
        instance = new (Handsontable.Core as unknown as HotCtor)($this[0], userSettings);
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
        throwWithCause(`Handsontable do not provide action: ${action}`);
      }
    }

    return output;
  };
}
