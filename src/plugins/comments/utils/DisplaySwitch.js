/* eslint-disable import/prefer-default-export */

import {debounce} from '../../../helpers/function';
import {mixin} from './../../../helpers/object';
import localHooks from './../../../mixins/localHooks';

/**
 * Display switch for the Comments plugin. Manages the time of displaying comments.
 */
class DisplaySwitch {
  constructor(hot, settings) {
    this.hot = hot;
    /**
     * Responsible for showing comment after proper delay.
     *
     * @type {Function}
     */
    this.show = null;
    /**
     * Responsible for hiding comment after proper delay.
     *
     * @type {Function}
     */
    this.hide = null;
    /**
     * Flag to determine if comment can be showed or hidden.
     *
     * @type {Boolean}
     */
    this.allowShowing = true;

    this.update(settings.displayDelay, settings.hideDelay);
  }

  /**
   * Update the switch settings.
   *
   * @param {Number} displayDelay Delay of showing the comments (in milliseconds).
   * @param {Number} hideDelay Delay of hiding the comments (in milliseconds).
   */
  update(displayDelay, hideDelay) {
    const showDebounced = debounce((range) => {
      if (this.allowShowing) {
        this.runLocalHooks('show', range.from.row, range.from.col);
      }
    }, displayDelay);

    this.show = (range) => {
      this.allowShowing = true;
      showDebounced(range);
    };

    this.hide = () => {
      this.allowShowing = false;

      setTimeout(() => {
        if (!this.allowShowing) {
          this.runLocalHooks('hide');
        }
      }, hideDelay);
    };
  }

  /**
   * Destroy the switcher.
   */
  destroy() {
    this.show = null;
    this.hide = null;

    this.clearLocalHooks();
  }
}

mixin(DisplaySwitch, localHooks);

export {DisplaySwitch};
