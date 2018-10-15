'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _element = require('./../../../helpers/dom/element');

var _object = require('./../../../helpers/object');

var _string = require('./../../../helpers/string');

var _event = require('./event');

var _event2 = _interopRequireDefault(_event);

var _overlays = require('./overlays');

var _overlays2 = _interopRequireDefault(_overlays);

var _scroll = require('./scroll');

var _scroll2 = _interopRequireDefault(_scroll);

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

var _table = require('./table');

var _table2 = _interopRequireDefault(_table);

var _viewport = require('./viewport');

var _viewport2 = _interopRequireDefault(_viewport);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Walkontable
 */
var Walkontable = function () {
  /**
   * @param {Object} settings
   */
  function Walkontable(settings) {
    _classCallCheck(this, Walkontable);

    var originalHeaders = [];

    // this is the namespace for global events
    this.guid = 'wt_' + (0, _string.randomString)();

    // bootstrap from settings
    if (settings.cloneSource) {
      this.cloneSource = settings.cloneSource;
      this.cloneOverlay = settings.cloneOverlay;
      this.wtSettings = settings.cloneSource.wtSettings;
      this.wtTable = new _table2.default(this, settings.table, settings.wtRootElement);
      this.wtScroll = new _scroll2.default(this);
      this.wtViewport = settings.cloneSource.wtViewport;
      this.wtEvent = new _event2.default(this);
      this.selections = this.cloneSource.selections;
    } else {
      this.wtSettings = new _settings2.default(this, settings);
      this.wtTable = new _table2.default(this, settings.table);
      this.wtScroll = new _scroll2.default(this);
      this.wtViewport = new _viewport2.default(this);
      this.wtEvent = new _event2.default(this);
      this.selections = this.getSetting('selections');
      this.wtOverlays = new _overlays2.default(this);
      this.exportSettingsAsClassNames();
    }

    // find original headers
    if (this.wtTable.THEAD.childNodes.length && this.wtTable.THEAD.childNodes[0].childNodes.length) {
      for (var c = 0, clen = this.wtTable.THEAD.childNodes[0].childNodes.length; c < clen; c++) {
        originalHeaders.push(this.wtTable.THEAD.childNodes[0].childNodes[c].innerHTML);
      }
      if (!this.getSetting('columnHeaders').length) {
        this.update('columnHeaders', [function (column, TH) {
          (0, _element.fastInnerText)(TH, originalHeaders[column]);
        }]);
      }
    }
    this.drawn = false;
    this.drawInterrupted = false;
  }

  /**
   * Force rerender of Walkontable
   *
   * @param {Boolean} [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway
   * @returns {Walkontable}
   */


  _createClass(Walkontable, [{
    key: 'draw',
    value: function draw() {
      var fastDraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      this.drawInterrupted = false;

      if (!fastDraw && !(0, _element.isVisible)(this.wtTable.TABLE)) {
        // draw interrupted because TABLE is not visible
        this.drawInterrupted = true;
      } else {
        this.wtTable.draw(fastDraw);
      }

      return this;
    }

    /**
     * Returns the TD at coords. If topmost is set to true, returns TD from the topmost overlay layer,
     * if not set or set to false, returns TD from the master table.
     *
     * @param {CellCoords} coords
     * @param {Boolean} [topmost=false]
     * @returns {Object}
     */

  }, {
    key: 'getCell',
    value: function getCell(coords) {
      var topmost = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (!topmost) {
        return this.wtTable.getCell(coords);
      }

      var totalRows = this.wtSettings.getSetting('totalRows');
      var fixedRowsTop = this.wtSettings.getSetting('fixedRowsTop');
      var fixedRowsBottom = this.wtSettings.getSetting('fixedRowsBottom');
      var fixedColumns = this.wtSettings.getSetting('fixedColumnsLeft');

      if (coords.row < fixedRowsTop && coords.col < fixedColumns) {
        return this.wtOverlays.topLeftCornerOverlay.clone.wtTable.getCell(coords);
      } else if (coords.row < fixedRowsTop) {
        return this.wtOverlays.topOverlay.clone.wtTable.getCell(coords);
      } else if (coords.col < fixedColumns && coords.row >= totalRows - fixedRowsBottom) {
        if (this.wtOverlays.bottomLeftCornerOverlay && this.wtOverlays.bottomLeftCornerOverlay.clone) {
          return this.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.getCell(coords);
        }
      } else if (coords.col < fixedColumns) {
        return this.wtOverlays.leftOverlay.clone.wtTable.getCell(coords);
      } else if (coords.row < totalRows && coords.row > totalRows - fixedRowsBottom) {
        if (this.wtOverlays.bottomOverlay && this.wtOverlays.bottomOverlay.clone) {
          return this.wtOverlays.bottomOverlay.clone.wtTable.getCell(coords);
        }
      }

      return this.wtTable.getCell(coords);
    }

    /**
     * @param {Object} settings
     * @param {*} value
     * @returns {Walkontable}
     */

  }, {
    key: 'update',
    value: function update(settings, value) {
      return this.wtSettings.update(settings, value);
    }

    /**
     * Scrolls the viewport to a cell (rerenders if needed).
     *
     * @param {CellCoords} coords
     * @param {Boolean} [snapToTop]
     * @param {Boolean} [snapToRight]
     * @param {Boolean} [snapToBottom]
     * @param {Boolean} [snapToLeft]
     * @returns {Boolean}
     */

  }, {
    key: 'scrollViewport',
    value: function scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft) {
      return this.wtScroll.scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft);
    }

    /**
     * Scrolls the viewport to a column (rerenders if needed).
     *
     * @param {Number} column Visual column index.
     * @param {Boolean} [snapToRight]
     * @param {Boolean} [snapToLeft]
     * @returns {Boolean}
     */

  }, {
    key: 'scrollViewportHorizontally',
    value: function scrollViewportHorizontally(column, snapToRight, snapToLeft) {
      return this.wtScroll.scrollViewportHorizontally(column, snapToRight, snapToLeft);
    }

    /**
     * Scrolls the viewport to a row (rerenders if needed).
     *
     * @param {Number} row Visual row index.
     * @param {Boolean} [snapToTop]
     * @param {Boolean} [snapToBottom]
     * @returns {Boolean}
     */

  }, {
    key: 'scrollViewportVertically',
    value: function scrollViewportVertically(row, snapToTop, snapToBottom) {
      return this.wtScroll.scrollViewportVertically(row, snapToTop, snapToBottom);
    }

    /**
     * @returns {Array}
     */

  }, {
    key: 'getViewport',
    value: function getViewport() {
      return [this.wtTable.getFirstVisibleRow(), this.wtTable.getFirstVisibleColumn(), this.wtTable.getLastVisibleRow(), this.wtTable.getLastVisibleColumn()];
    }

    /**
     * Get overlay name
     *
     * @returns {String}
     */

  }, {
    key: 'getOverlayName',
    value: function getOverlayName() {
      return this.cloneOverlay ? this.cloneOverlay.type : 'master';
    }

    /**
     * Check overlay type of this Walkontable instance.
     *
     * @param {String} name Clone type @see {Overlay.CLONE_TYPES}.
     * @returns {Boolean}
     */

  }, {
    key: 'isOverlayName',
    value: function isOverlayName(name) {
      if (this.cloneOverlay) {
        return this.cloneOverlay.type === name;
      }

      return false;
    }

    /**
     * Export settings as class names added to the parent element of the table.
     */

  }, {
    key: 'exportSettingsAsClassNames',
    value: function exportSettingsAsClassNames() {
      var _this = this;

      var toExport = {
        rowHeaders: ['array'],
        columnHeaders: ['array']
      };
      var allClassNames = [];
      var newClassNames = [];

      (0, _object.objectEach)(toExport, function (optionType, key) {
        if (optionType.indexOf('array') > -1 && _this.getSetting(key).length) {
          newClassNames.push('ht' + (0, _string.toUpperCaseFirst)(key));
        }
        allClassNames.push('ht' + (0, _string.toUpperCaseFirst)(key));
      });
      (0, _element.removeClass)(this.wtTable.wtRootElement.parentNode, allClassNames);
      (0, _element.addClass)(this.wtTable.wtRootElement.parentNode, newClassNames);
    }

    /**
     * Get/Set Walkontable instance setting
     *
     * @param {String} key
     * @param {*} [param1]
     * @param {*} [param2]
     * @param {*} [param3]
     * @param {*} [param4]
     * @returns {*}
     */

  }, {
    key: 'getSetting',
    value: function getSetting(key, param1, param2, param3, param4) {
      // this is faster than .apply - https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
      return this.wtSettings.getSetting(key, param1, param2, param3, param4);
    }

    /**
     * Checks if setting exists
     *
     * @param {String} key
     * @returns {Boolean}
     */

  }, {
    key: 'hasSetting',
    value: function hasSetting(key) {
      return this.wtSettings.has(key);
    }

    /**
     * Destroy instance
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.wtOverlays.destroy();
      this.wtEvent.destroy();
    }
  }]);

  return Walkontable;
}();

exports.default = Walkontable;