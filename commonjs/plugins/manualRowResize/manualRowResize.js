'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _base = require('./../_base');

var _base2 = _interopRequireDefault(_base);

var _element = require('./../../helpers/dom/element');

var _eventManager = require('./../../eventManager');

var _eventManager2 = _interopRequireDefault(_eventManager);

var _event = require('./../../helpers/dom/event');

var _array = require('./../../helpers/array');

var _number = require('./../../helpers/number');

var _plugins = require('./../../plugins');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Developer note! Whenever you make a change in this file, make an analogous change in manualRowResize.js

/**
 * @description
 * This plugin allows to change rows height. To make rows height persistent the {@link Options#persistentState}
 * plugin should be enabled.
 *
 * The plugin creates additional components to make resizing possibly using user interface:
 * - handle - the draggable element that sets the desired height of the row.
 * - guide - the helper guide that shows the desired height as a horizontal guide.
 *
 * @plugin ManualRowResize
 */
var ManualRowResize = function (_BasePlugin) {
  _inherits(ManualRowResize, _BasePlugin);

  function ManualRowResize(hotInstance) {
    _classCallCheck(this, ManualRowResize);

    var _this = _possibleConstructorReturn(this, (ManualRowResize.__proto__ || Object.getPrototypeOf(ManualRowResize)).call(this, hotInstance));

    _this.currentTH = null;
    _this.currentRow = null;
    _this.selectedRows = [];
    _this.currentHeight = null;
    _this.newSize = null;
    _this.startY = null;
    _this.startHeight = null;
    _this.startOffset = null;
    _this.handle = document.createElement('DIV');
    _this.guide = document.createElement('DIV');
    _this.eventManager = new _eventManager2.default(_this);
    _this.pressed = null;
    _this.dblclick = 0;
    _this.autoresizeTimeout = null;
    _this.manualRowHeights = [];

    (0, _element.addClass)(_this.handle, 'manualRowResizer');
    (0, _element.addClass)(_this.guide, 'manualRowResizerGuide');
    return _this;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ManualRowResize#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */


  _createClass(ManualRowResize, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return this.hot.getSettings().manualRowResize;
    }

    /**
     * Enables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'enablePlugin',
    value: function enablePlugin() {
      var _this2 = this;

      if (this.enabled) {
        return;
      }

      this.manualRowHeights = [];

      var initialRowHeights = this.hot.getSettings().manualRowResize;
      var loadedManualRowHeights = this.loadManualRowHeights();

      if (typeof loadedManualRowHeights !== 'undefined') {
        this.manualRowHeights = loadedManualRowHeights;
      } else if (Array.isArray(initialRowHeights)) {
        this.manualRowHeights = initialRowHeights;
      } else {
        this.manualRowHeights = [];
      }

      this.addHook('modifyRowHeight', function (height, row) {
        return _this2.onModifyRowHeight(height, row);
      });

      // Handsontable.hooks.register('beforeRowResize');
      // Handsontable.hooks.register('afterRowResize');

      this.bindEvents();

      _get(ManualRowResize.prototype.__proto__ || Object.getPrototypeOf(ManualRowResize.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
     */

  }, {
    key: 'updatePlugin',
    value: function updatePlugin() {
      var initialRowHeights = this.hot.getSettings().manualRowResize;

      if (Array.isArray(initialRowHeights)) {
        this.manualRowHeights = initialRowHeights;
      } else if (!initialRowHeights) {
        this.manualRowHeights = [];
      }
    }

    /**
     * Disables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      _get(ManualRowResize.prototype.__proto__ || Object.getPrototypeOf(ManualRowResize.prototype), 'disablePlugin', this).call(this);
    }

    /**
     * Saves the current sizes using the persistentState plugin (the {@link Options#persistentState} option has to be enabled).
     * @fires Hooks#persistentStateSave
     * @fires Hooks#manualRowHeights
     */

  }, {
    key: 'saveManualRowHeights',
    value: function saveManualRowHeights() {
      this.hot.runHooks('persistentStateSave', 'manualRowHeights', this.manualRowHeights);
    }

    /**
     * Loads the previously saved sizes using the persistentState plugin (the {@link Options#persistentState} option has to be enabled).
     *
     * @returns {Array}
     * @fires Hooks#persistentStateLoad
     * @fires Hooks#manualRowHeights
     */

  }, {
    key: 'loadManualRowHeights',
    value: function loadManualRowHeights() {
      var storedState = {};

      this.hot.runHooks('persistentStateLoad', 'manualRowHeights', storedState);

      return storedState.value;
    }

    /**
     * Sets the resize handle position.
     *
     * @private
     * @param {HTMLCellElement} TH TH HTML element.
     */

  }, {
    key: 'setupHandlePosition',
    value: function setupHandlePosition(TH) {
      var _this3 = this;

      this.currentTH = TH;
      var row = this.hot.view.wt.wtTable.getCoords(TH).row; // getCoords returns CellCoords
      var headerWidth = (0, _element.outerWidth)(this.currentTH);

      if (row >= 0) {
        // if not col header
        var box = this.currentTH.getBoundingClientRect();

        this.currentRow = row;
        this.selectedRows = [];

        if (this.hot.selection.isSelected() && this.hot.selection.isSelectedByRowHeader()) {
          var _hot$getSelectedRange = this.hot.getSelectedRangeLast(),
              from = _hot$getSelectedRange.from,
              to = _hot$getSelectedRange.to;

          var start = from.row;
          var end = to.row;

          if (start >= end) {
            start = to.row;
            end = from.row;
          }

          if (this.currentRow >= start && this.currentRow <= end) {
            (0, _number.rangeEach)(start, end, function (i) {
              return _this3.selectedRows.push(i);
            });
          } else {
            this.selectedRows.push(this.currentRow);
          }
        } else {
          this.selectedRows.push(this.currentRow);
        }

        this.startOffset = box.top - 6;
        this.startHeight = parseInt(box.height, 10);
        this.handle.style.left = box.left + 'px';
        this.handle.style.top = this.startOffset + this.startHeight + 'px';
        this.handle.style.width = headerWidth + 'px';
        this.hot.rootElement.appendChild(this.handle);
      }
    }

    /**
     * Refresh the resize handle position.
     *
     * @private
     */

  }, {
    key: 'refreshHandlePosition',
    value: function refreshHandlePosition() {
      this.handle.style.top = this.startOffset + this.currentHeight + 'px';
    }

    /**
     * Sets the resize guide position.
     *
     * @private
     */

  }, {
    key: 'setupGuidePosition',
    value: function setupGuidePosition() {
      var handleWidth = parseInt((0, _element.outerWidth)(this.handle), 10);
      var handleRightPosition = parseInt(this.handle.style.left, 10) + handleWidth;
      var maximumVisibleElementWidth = parseInt(this.hot.view.maximumVisibleElementWidth(0), 10);
      (0, _element.addClass)(this.handle, 'active');
      (0, _element.addClass)(this.guide, 'active');

      this.guide.style.top = this.handle.style.top;
      this.guide.style.left = handleRightPosition + 'px';
      this.guide.style.width = maximumVisibleElementWidth - handleWidth + 'px';
      this.hot.rootElement.appendChild(this.guide);
    }

    /**
     * Refresh the resize guide position.
     *
     * @private
     */

  }, {
    key: 'refreshGuidePosition',
    value: function refreshGuidePosition() {
      this.guide.style.top = this.handle.style.top;
    }

    /**
     * Hides both the resize handle and resize guide.
     *
     * @private
     */

  }, {
    key: 'hideHandleAndGuide',
    value: function hideHandleAndGuide() {
      (0, _element.removeClass)(this.handle, 'active');
      (0, _element.removeClass)(this.guide, 'active');
    }

    /**
     * Checks if provided element is considered as a row header.
     *
     * @private
     * @param {HTMLElement} element HTML element.
     * @returns {Boolean}
     */

  }, {
    key: 'checkIfRowHeader',
    value: function checkIfRowHeader(element) {
      if (element !== this.hot.rootElement) {
        var parent = element.parentNode;

        if (parent.tagName === 'TBODY') {
          return true;
        }

        return this.checkIfRowHeader(parent);
      }

      return false;
    }

    /**
     * Gets the TH element from the provided element.
     *
     * @private
     * @param {HTMLElement} element HTML element.
     * @returns {HTMLElement}
     */

  }, {
    key: 'getTHFromTargetElement',
    value: function getTHFromTargetElement(element) {
      if (element.tagName !== 'TABLE') {
        if (element.tagName === 'TH') {
          return element;
        }
        return this.getTHFromTargetElement(element.parentNode);
      }

      return null;
    }

    /**
     * 'mouseover' event callback - set the handle position.
     *
     * @private
     * @param {MouseEvent} event
     */

  }, {
    key: 'onMouseOver',
    value: function onMouseOver(event) {
      if (this.checkIfRowHeader(event.target)) {
        var th = this.getTHFromTargetElement(event.target);

        if (th) {
          if (!this.pressed) {
            this.setupHandlePosition(th);
          }
        }
      }
    }

    /**
     * Auto-size row after doubleclick - callback.
     *
     * @private
     * @fires Hooks#beforeRowResize
     * @fires Hooks#afterRowResize
     */

  }, {
    key: 'afterMouseDownTimeout',
    value: function afterMouseDownTimeout() {
      var _this4 = this;

      var render = function render() {
        _this4.hot.forceFullRender = true;
        _this4.hot.view.render(); // updates all
        _this4.hot.view.wt.wtOverlays.adjustElementsSize(true);
      };
      var resize = function resize(selectedRow, forceRender) {
        var hookNewSize = _this4.hot.runHooks('beforeRowResize', selectedRow, _this4.newSize, true);

        if (hookNewSize !== void 0) {
          _this4.newSize = hookNewSize;
        }

        _this4.setManualSize(selectedRow, _this4.newSize); // double click sets auto row size

        if (forceRender) {
          render();
        }

        _this4.hot.runHooks('afterRowResize', selectedRow, _this4.newSize, true);
      };

      if (this.dblclick >= 2) {
        var selectedRowsLength = this.selectedRows.length;

        if (selectedRowsLength > 1) {
          (0, _array.arrayEach)(this.selectedRows, function (selectedRow) {
            resize(selectedRow);
          });
          render();
        } else {
          (0, _array.arrayEach)(this.selectedRows, function (selectedRow) {
            resize(selectedRow, true);
          });
        }
      }
      this.dblclick = 0;
      this.autoresizeTimeout = null;
    }

    /**
     * 'mousedown' event callback.
     *
     * @private
     * @param {MouseEvent} event
     */

  }, {
    key: 'onMouseDown',
    value: function onMouseDown(event) {
      var _this5 = this;

      if ((0, _element.hasClass)(event.target, 'manualRowResizer')) {
        this.setupGuidePosition();
        this.pressed = this.hot;

        if (this.autoresizeTimeout === null) {
          this.autoresizeTimeout = setTimeout(function () {
            return _this5.afterMouseDownTimeout();
          }, 500);

          this.hot._registerTimeout(this.autoresizeTimeout);
        }

        this.dblclick += 1;
        this.startY = (0, _event.pageY)(event);
        this.newSize = this.startHeight;
      }
    }

    /**
     * 'mousemove' event callback - refresh the handle and guide positions, cache the new row height.
     *
     * @private
     * @param {MouseEvent} event
     */

  }, {
    key: 'onMouseMove',
    value: function onMouseMove(event) {
      var _this6 = this;

      if (this.pressed) {
        this.currentHeight = this.startHeight + ((0, _event.pageY)(event) - this.startY);

        (0, _array.arrayEach)(this.selectedRows, function (selectedRow) {
          _this6.newSize = _this6.setManualSize(selectedRow, _this6.currentHeight);
        });

        this.refreshHandlePosition();
        this.refreshGuidePosition();
      }
    }

    /**
     * 'mouseup' event callback - apply the row resizing.
     *
     * @private
     *
     * @fires Hooks#beforeRowResize
     * @fires Hooks#afterRowResize
     */

  }, {
    key: 'onMouseUp',
    value: function onMouseUp() {
      var _this7 = this;

      var render = function render() {
        _this7.hot.forceFullRender = true;
        _this7.hot.view.render(); // updates all
        _this7.hot.view.wt.wtOverlays.adjustElementsSize(true);
      };
      var runHooks = function runHooks(selectedRow, forceRender) {
        _this7.hot.runHooks('beforeRowResize', selectedRow, _this7.newSize);

        if (forceRender) {
          render();
        }

        _this7.saveManualRowHeights();

        _this7.hot.runHooks('afterRowResize', selectedRow, _this7.newSize, false);
      };
      if (this.pressed) {
        this.hideHandleAndGuide();
        this.pressed = false;

        if (this.newSize !== this.startHeight) {
          var selectedRowsLength = this.selectedRows.length;

          if (selectedRowsLength > 1) {
            (0, _array.arrayEach)(this.selectedRows, function (selectedRow) {
              runHooks(selectedRow);
            });
            render();
          } else {
            (0, _array.arrayEach)(this.selectedRows, function (selectedRow) {
              runHooks(selectedRow, true);
            });
          }
        }

        this.setupHandlePosition(this.currentTH);
      }
    }

    /**
     * Binds the mouse events.
     *
     * @private
     */

  }, {
    key: 'bindEvents',
    value: function bindEvents() {
      var _this8 = this;

      this.eventManager.addEventListener(this.hot.rootElement, 'mouseover', function (e) {
        return _this8.onMouseOver(e);
      });
      this.eventManager.addEventListener(this.hot.rootElement, 'mousedown', function (e) {
        return _this8.onMouseDown(e);
      });
      this.eventManager.addEventListener(window, 'mousemove', function (e) {
        return _this8.onMouseMove(e);
      });
      this.eventManager.addEventListener(window, 'mouseup', function () {
        return _this8.onMouseUp();
      });
    }

    /**
     * Sets the new height for specified row index.
     *
     * @param {Number} row Visual row index.
     * @param {Number} height Row height.
     * @returns {Number} Returns new height.
     *
     * @fires Hooks#modifyRow
     */

  }, {
    key: 'setManualSize',
    value: function setManualSize(row, height) {
      var physicalRow = this.hot.runHooks('modifyRow', row);

      this.manualRowHeights[physicalRow] = height;

      return height;
    }

    /**
     * Modifies the provided row height, based on the plugin settings.
     *
     * @private
     * @param {Number} height Row height.
     * @param {Number} row Visual row index.
     * @returns {Number}
     *
     * @fires Hooks#modifyRow
     */

  }, {
    key: 'onModifyRowHeight',
    value: function onModifyRowHeight(height, row) {
      if (this.enabled) {
        var autoRowSizePlugin = this.hot.getPlugin('autoRowSize');
        var autoRowHeightResult = autoRowSizePlugin ? autoRowSizePlugin.heights[row] : null;
        var physicalRow = this.hot.runHooks('modifyRow', row);
        var manualRowHeight = this.manualRowHeights[physicalRow];

        if (manualRowHeight !== void 0 && (manualRowHeight === autoRowHeightResult || manualRowHeight > (height || 0))) {
          return manualRowHeight;
        }
      }

      return height;
    }
  }]);

  return ManualRowResize;
}(_base2.default);

(0, _plugins.registerPlugin)('manualRowResize', ManualRowResize);

exports.default = ManualRowResize;