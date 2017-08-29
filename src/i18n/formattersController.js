/* eslint-disable import/prefer-default-export */

class FormattersController {
  static getSingleton() {
    return singleton;
  }

  constructor() {
    /**
     * List of formatter functions.
     *
     * @type {Array}
     */
    this.formatters = [];
  }

  /**
   * Register formatter.
   *
   * @param {Function} formatter Function which will be applied on phrase propositions.
   * It will transform them if it's possible.
   */
  registerFormatter(formatter) {
    this.formatters.push(formatter);
  }

  /**
   * Get all registered previously formatters.
   *
   * @returns {Array}
   */
  getFormatters() {
    return this.formatters;
  }
}

const singleton = new FormattersController();

export {singleton as formattersController};
