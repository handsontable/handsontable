import {addClass} from './../../helpers/dom/element';

const CLASSNAMES = {
  backlightClassName: 'ht__manualRowMove--backlight',
  guidelineClassName: 'ht__manualRowMove--guideline',
};

class ManualRowMoveUI {
  constructor(hotInstance) {
    this.hot = hotInstance;

    this.parent = void 0;
    /**
     * DOM element representing the move handle.
     *
     * @type {HTMLElement}
     */
    this.backlightElement = null;
    /**
     * DOM element representing the horizontal guide line.
     *
     * @type {HTMLElement}
     */
    this.guidelineElement = null;

    this.appended = false;

    this.created = false;
  }

  /**
   * Add created UI elements to table.
   *
   * @param {HTMLElement} parent Element which are parent for our UI elements.
   */
  appendUI(parent) {
    this.parent = parent;
    this.parent.appendChild(this.backlightElement);
    this.parent.appendChild(this.guidelineElement);
    this.appended = true;
  }

  /**
   * Method for create UI elements. Only create, without append to table.
   */
  createUI() {
    this.backlightElement = document.createElement('div');
    this.guidelineElement = document.createElement('div');

    addClass(this.backlightElement, CLASSNAMES.backlightClassName);
    addClass(this.guidelineElement, CLASSNAMES.guidelineClassName);

    this.created = true;
  }

  /**
   * Method for remove UI elements
   */
  removeUI() {
    if (this.isAppended()) {
      this.parent.removeChild(this.backlightElement);
      this.parent.removeChild(this.guidelineElement);

    } else if (this.isCreated()) {
      let toRemove = document.createElement('div');

      toRemove.appendChild(this.backlightElement);
      toRemove.appendChild(this.guidelineElement);

      document.body.appendChild(toRemove);
      document.body.removeChild(toRemove);
    }

    this.created = false;
    this.appended = false;
  }

  /**
   * Check if UI elements are appended.
   *
   * @returns {boolean}
   */
  isAppended() {
    return this.appended;
  }

  /**
   * Check if UI elements are created.
   *
   * @returns {boolean}
   */
  isCreated() {
    return this.created;
  }
}

export {ManualRowMoveUI};
