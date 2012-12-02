/**
 * Create DOM elements for selection border lines (top, right, bottom, left) and optionally background
 * @constructor
 * @param {Object} instance Handsontable instance
 * @param {Object} options Configurable options
 * @param {Boolean} [options.bg] Should include a background
 * @param {String} [options.className] CSS class for border elements
 */
Handsontable.Border = function (instance, options) {
};

Handsontable.Border.prototype = {
  /**
   * Show border around one or many cells
   * @param {Object[]} coordsArr
   */
  appear: function (coordsArr) {
  },

  /**
   * Hide border
   */
  disappear: function () {
  }
};