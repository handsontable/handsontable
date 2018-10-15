'use strict';

exports.__esModule = true;
exports.CUSTOM_SELECTION = exports.HEADER_TYPE = exports.FILL_TYPE = exports.CELL_TYPE = exports.AREA_TYPE = exports.ACTIVE_HEADER_TYPE = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _types = require('./types');

var _array = require('./../../helpers/array');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ACTIVE_HEADER_TYPE = exports.ACTIVE_HEADER_TYPE = 'active-header';
var AREA_TYPE = exports.AREA_TYPE = 'area';
var CELL_TYPE = exports.CELL_TYPE = 'cell';
var FILL_TYPE = exports.FILL_TYPE = 'fill';
var HEADER_TYPE = exports.HEADER_TYPE = 'header';
var CUSTOM_SELECTION = exports.CUSTOM_SELECTION = 'custom-selection';

/**
 * Highlight class responsible for managing Walkontable Selection classes.
 *
 * With Highlight object you can manipulate four different highlight types:
 *  - `cell` can be added only to a single cell at a time and it defines currently selected cell;
 *  - `fill` can occur only once and its highlight defines selection of autofill functionality (managed by the plugin with the same name);
 *  - `areas` can be added to multiple cells at a time. This type highlights selected cell or multiple cells.
 *    The multiple cells have to be defined as an uninterrupted order (regular shape). Otherwise, the new layer of
 *    that type should be created to manage not-consecutive selection;
 *  - `header` can occur multiple times. This type is designed to highlight only headers. Like `area` type it
 *    can appear with multiple highlights (accessed under different level layers).
 *
 * @class Highlight
 * @util
 */

var Highlight = function () {
  function Highlight(options) {
    _classCallCheck(this, Highlight);

    /**
     * Options consumed by Highlight class and Walkontable Selection classes.
     *
     * @type {Object}
     */
    this.options = options;
    /**
     * The property which describes which layer level of the visual selection will be modified.
     * This option is valid only for `area` and `header` highlight types which occurs multiple times on
     * the table (as a non-consecutive selection).
     *
     * An order of the layers is the same as the order of added new non-consecutive selections.
     *
     * @type {Number}
     * @default 0
     */
    this.layerLevel = 0;
    /**
     * `cell` highlight object which describes attributes for the currently selected cell.
     * It can only occur only once on the table.
     *
     * @type {Selection}
     */
    this.cell = (0, _types.createHighlight)(CELL_TYPE, options);
    /**
     * `fill` highlight object which describes attributes for the borders for autofill functionality.
     * It can only occur only once on the table.
     *
     * @type {Selection}
     */
    this.fill = (0, _types.createHighlight)(FILL_TYPE, options);
    /**
     * Collection of the `area` highlights. That objects describes attributes for the borders and selection of
     * the multiple selected cells. It can occur multiple times on the table.
     *
     * @type {Map.<number, Selection>}
     */
    this.areas = new Map();
    /**
     * Collection of the `header` highlights. That objects describes attributes for the selection of
     * the multiple selected rows and columns in the table header. It can occur multiple times on the table.
     *
     * @type {Map.<number, Selection>}
     */
    this.headers = new Map();
    /**
     * Collection of the `active-header` highlights. That objects describes attributes for the selection of
     * the multiple selected rows and columns in the table header. The table headers which have selected all items in
     * a row will be marked as `active-header`.
     *
     * @type {Map.<number, Selection>}
     */
    this.activeHeaders = new Map();
    /**
     * Collection of the `custom-selection`, holder for example borders added through CustomBorders plugin.
     *
     * @type {Selection[]}
     */
    this.customSelections = [];
  }

  /**
   * Check if highlight cell rendering is disabled for specyfied highlight type.
   *
   * @param {String} highlightType Highlight type. Possible values are: `cell`, `area`, `fill` or `header`.
   * @return {Boolean}
   */


  _createClass(Highlight, [{
    key: 'isEnabledFor',
    value: function isEnabledFor(highlightType) {
      // Legacy compatibility.
      var type = highlightType === 'current' ? CELL_TYPE : highlightType;
      var disableHighlight = this.options.disableHighlight;

      if (typeof disableHighlight === 'string') {
        disableHighlight = [disableHighlight];
      }

      return disableHighlight === false || Array.isArray(disableHighlight) && !disableHighlight.includes(type);
    }

    /**
     * Set a new layer level to make access to the desire `area` and `header` highlights.
     *
     * @param {Number} [level=0] Layer level to use.
     * @returns {Highlight}
     */

  }, {
    key: 'useLayerLevel',
    value: function useLayerLevel() {
      var level = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      this.layerLevel = level;

      return this;
    }

    /**
     * Get Walkontable Selection instance created for controlling highlight of the currently selected/edited cell.
     *
     * @return {Selection}
     */

  }, {
    key: 'getCell',
    value: function getCell() {
      return this.cell;
    }

    /**
     * Get Walkontable Selection instance created for controlling highlight of the autofill functionality.
     *
     * @return {Selection}
     */

  }, {
    key: 'getFill',
    value: function getFill() {
      return this.fill;
    }

    /**
     * Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
     * of the multiple selected cells.
     *
     * @return {Selection}
     */

  }, {
    key: 'createOrGetArea',
    value: function createOrGetArea() {
      var layerLevel = this.layerLevel;
      var area = void 0;

      if (this.areas.has(layerLevel)) {
        area = this.areas.get(layerLevel);
      } else {
        area = (0, _types.createHighlight)(AREA_TYPE, Object.assign({ layerLevel: layerLevel }, this.options));

        this.areas.set(layerLevel, area);
      }

      return area;
    }

    /**
     * Get all Walkontable Selection instances which describes the state of the visual highlight of the cells.
     *
     * @return {Selection[]}
     */

  }, {
    key: 'getAreas',
    value: function getAreas() {
      return [].concat(_toConsumableArray(this.areas.values()));
    }

    /**
     * Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
     * of the multiple selected header cells.
     *
     * @return {Selection}
     */

  }, {
    key: 'createOrGetHeader',
    value: function createOrGetHeader() {
      var layerLevel = this.layerLevel;
      var header = void 0;

      if (this.headers.has(layerLevel)) {
        header = this.headers.get(layerLevel);
      } else {
        header = (0, _types.createHighlight)(HEADER_TYPE, Object.assign({}, this.options));

        this.headers.set(layerLevel, header);
      }

      return header;
    }

    /**
     * Get all Walkontable Selection instances which describes the state of the visual highlight of the headers.
     *
     * @return {Selection[]}
     */

  }, {
    key: 'getHeaders',
    value: function getHeaders() {
      return [].concat(_toConsumableArray(this.headers.values()));
    }

    /**
     * Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
     * of the multiple selected active header cells.
     *
     * @return {Selection}
     */

  }, {
    key: 'createOrGetActiveHeader',
    value: function createOrGetActiveHeader() {
      var layerLevel = this.layerLevel;
      var header = void 0;

      if (this.activeHeaders.has(layerLevel)) {
        header = this.activeHeaders.get(layerLevel);
      } else {
        header = (0, _types.createHighlight)(ACTIVE_HEADER_TYPE, Object.assign({}, this.options));

        this.activeHeaders.set(layerLevel, header);
      }

      return header;
    }

    /**
     * Get all Walkontable Selection instances which describes the state of the visual highlight of the active headers.
     *
     * @return {Selection[]}
     */

  }, {
    key: 'getActiveHeaders',
    value: function getActiveHeaders() {
      return [].concat(_toConsumableArray(this.activeHeaders.values()));
    }

    /**
     * Get Walkontable Selection instance created for controlling highlight of the custom selection functionality.
     *
     * @return {Selection}
     */

  }, {
    key: 'getCustomSelections',
    value: function getCustomSelections() {
      return [].concat(_toConsumableArray(this.customSelections.values()));
    }

    /**
     * Add selection to the custom selection instance. The new selection are added to the end of the selection collection.
     *
     * @param {Object} options
     */

  }, {
    key: 'addCustomSelection',
    value: function addCustomSelection(options) {
      this.customSelections.push((0, _types.createHighlight)(CUSTOM_SELECTION, Object.assign({}, options)));
    }

    /**
     * Perform cleaning visual highlights for the whole table.
     */

  }, {
    key: 'clear',
    value: function clear() {
      this.cell.clear();
      this.fill.clear();

      (0, _array.arrayEach)(this.areas.values(), function (highlight) {
        return void highlight.clear();
      });
      (0, _array.arrayEach)(this.headers.values(), function (highlight) {
        return void highlight.clear();
      });
      (0, _array.arrayEach)(this.activeHeaders.values(), function (highlight) {
        return void highlight.clear();
      });
    }

    /**
     * This object can be iterate over using `for of` syntax or using internal `arrayEach` helper.
     */

  }, {
    key: Symbol.iterator,
    value: function value() {
      return [this.cell, this.fill].concat(_toConsumableArray(this.areas.values()), _toConsumableArray(this.headers.values()), _toConsumableArray(this.activeHeaders.values()), _toConsumableArray(this.customSelections))[Symbol.iterator]();
    }
  }]);

  return Highlight;
}();

exports.default = Highlight;