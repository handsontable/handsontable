/**
 * @class Textarea
 *
 * @plugin CopyPaste
 */
class Textarea {
  static getSingleton() {
    globalSingleton.append();

    return globalSingleton;
  }

  constructor() {
    /**
     * Main textarea element.
     *
     * @type {HTMLElement}
     */
    this.element = void 0;
    /**
     * Store information about append to the document.body.
     *
     * @type {Boolean}
     */
    this.isAppended = false;
    /**
     * Reference counter.
     *
     * @type {Number}
     */
    this.refCounter = 0;
  }

  /**
   * Apends textarea element to the `body`
   */
  append() {
    if (this.hasBeenDestroyed()) {
      this.create();
    }

    this.refCounter++;

    if (!this.isAppended && document.body) {
      if (document.body) {
        this.isAppended = true;
        document.body.appendChild(this.element);
      }
    }
  }

  /**
   * Prepares textarea element with proper attributes.
   */
  create() {
    this.element = document.createElement('textarea');
    this.element.id = 'HandsontableCopyPaste';
    this.element.className = 'copyPaste';
    this.element.tabIndex = -1;
    this.element.autocomplete = 'off';
    this.element.wrap = 'off';
  }

  /**
   * Deselects textarea element if is active.
   */
  deselect() {
    if (this.element === document.activeElement) {
      document.activeElement.blur();
    }
  }

  /**
   * Destroy instance
   */
  destroy() {
    this.refCounter--;
    this.refCounter = this.refCounter < 0 ? 0 : this.refCounter;

    if (this.hasBeenDestroyed() && this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
      this.isAppended = false;
    }
  }

  /**
   * Getter for the element.
   *
   * @returns {String}
   */
  getValue() {
    return this.element.value;
  }

  /**
   * Check if instance has been destroyed
   *
   * @returns {Boolean}
   */
  hasBeenDestroyed() {
    return this.refCounter < 1;
  }

  /**
   * Check if the element is an active element in frame.
   *
   * @returns {Boolean}
   */
  isActive() {
    return this.element === document.activeElement;
  }

  /**
   * Sets focus on the element and select content.
   */
  select() {
    this.element.focus();
    this.element.select();
  }

  /**
   * Setter for the element.
   *
   * @param {String} data Value which should be insert into the element.
   */
  setValue(data) {
    this.element.value = data;
  }
}

const globalSingleton = new Textarea();

export default Textarea;
