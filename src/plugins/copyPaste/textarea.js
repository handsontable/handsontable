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
     * Reference counter.
     *
     * @type {Number}
     */
    this.refCounter = 0;
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
  }

  create() {
    this.element = document.createElement('textarea');
    this.element.id = 'HandsontableCopyPaste';
    this.element.tabIndex = -1;
    this.element.style.position = 'fixed';
    this.element.style.bottom = '100%';
  }

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
   * Getter for the element.
   *
   * @returns {String}
   */
  getValue() {
    return this.element.value;
  }

  /**
   * Setter for the element.
   *
   * @param {String} data Value which should be insert into the element.
   */
  setValue(data) {
    this.element.value = data;
  }

  /**
   * Sets focus on the element and select content.
   */
  select() {
    this.element.focus();
    this.element.select();
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
   * Check if instance has been destroyed
   *
   * @returns {Boolean}
   */
  hasBeenDestroyed() {
    return this.refCounter < 1;
  }

  /**
   * Destroy instance
   */
  destroy() {
    this.refCounter = --this.refCounter < 0 ? 0 : this.refCounter;

    if (this.hasBeenDestroyed() && this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
      this.isAppended = false;
    }
  }
}

const globalSingleton = new Textarea();

export default Textarea;
