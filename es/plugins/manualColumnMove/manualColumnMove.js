var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import BasePlugin from './../_base';
import Hooks from './../../pluginHooks';
import { arrayEach } from './../../helpers/array';
import { addClass, removeClass, offset } from './../../helpers/dom/element';
import { rangeEach } from './../../helpers/number';
import EventManager from './../../eventManager';
import { registerPlugin } from './../../plugins';
import ColumnsMapper from './columnsMapper';
import BacklightUI from './ui/backlight';
import GuidelineUI from './ui/guideline';

Hooks.getSingleton().register('beforeColumnMove');
Hooks.getSingleton().register('afterColumnMove');
Hooks.getSingleton().register('unmodifyCol');

var privatePool = new WeakMap();
var CSS_PLUGIN = 'ht__manualColumnMove';
var CSS_SHOW_UI = 'show-ui';
var CSS_ON_MOVING = 'on-moving--columns';
var CSS_AFTER_SELECTION = 'after-selection--columns';

/**
 * @plugin ManualColumnMove
 *
 * @description
 * This plugin allows to change columns order. To make columns order persistent the {@link Options#persistentState}
 * plugin should be enabled.
 *
 * API:
 * - moveColumn - move single column to the new position.
 * - moveColumns - move many columns (as an array of indexes) to the new position.
 *
 * If you want apply visual changes, you have to call manually the render() method on the instance of Handsontable.
 *
 * The plugin creates additional components to make moving possibly using user interface:
 * - backlight - highlight of selected columns.
 * - guideline - line which shows where rows has been moved.
 *
 * @class ManualColumnMove
 * @plugin ManualColumnMove
 */

var ManualColumnMove = function (_BasePlugin) {
  _inherits(ManualColumnMove, _BasePlugin);

  function ManualColumnMove(hotInstance) {
    _classCallCheck(this, ManualColumnMove);

    /**
     * Set up WeakMap of plugin to sharing private parameters;
     */
    var _this = _possibleConstructorReturn(this, (ManualColumnMove.__proto__ || Object.getPrototypeOf(ManualColumnMove)).call(this, hotInstance));

    privatePool.set(_this, {
      columnsToMove: [],
      countCols: 0,
      fixedColumns: 0,
      pressed: void 0,
      disallowMoving: void 0,
      target: {
        eventPageX: void 0,
        coords: void 0,
        TD: void 0,
        col: void 0
      }
    });

    /**
     * List of last removed row indexes.
     *
     * @private
     * @type {Array}
     */
    _this.removedColumns = [];
    /**
     * Object containing visual row indexes mapped to data source indexes.
     *
     * @private
     * @type {RowsMapper}
     */
    _this.columnsMapper = new ColumnsMapper(_this);
    /**
     * Event Manager object.
     *
     * @private
     * @type {Object}
     */
    _this.eventManager = new EventManager(_this);
    /**
     * Backlight UI object.
     *
     * @private
     * @type {Object}
     */
    _this.backlight = new BacklightUI(hotInstance);
    /**
     * Guideline UI object.
     *
     * @private
     * @type {Object}
     */
    _this.guideline = new GuidelineUI(hotInstance);
    return _this;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ManualColumnMove#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */


  _createClass(ManualColumnMove, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return !!this.hot.getSettings().manualColumnMove;
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

      this.addHook('beforeOnCellMouseDown', function (event, coords, TD, blockCalculations) {
        return _this2.onBeforeOnCellMouseDown(event, coords, TD, blockCalculations);
      });
      this.addHook('beforeOnCellMouseOver', function (event, coords, TD, blockCalculations) {
        return _this2.onBeforeOnCellMouseOver(event, coords, TD, blockCalculations);
      });
      this.addHook('afterScrollVertically', function () {
        return _this2.onAfterScrollVertically();
      });
      this.addHook('modifyCol', function (row, source) {
        return _this2.onModifyCol(row, source);
      });
      this.addHook('beforeRemoveCol', function (index, amount) {
        return _this2.onBeforeRemoveCol(index, amount);
      });
      this.addHook('afterRemoveCol', function () {
        return _this2.onAfterRemoveCol();
      });
      this.addHook('afterCreateCol', function (index, amount) {
        return _this2.onAfterCreateCol(index, amount);
      });
      this.addHook('afterLoadData', function () {
        return _this2.onAfterLoadData();
      });
      this.addHook('unmodifyCol', function (column) {
        return _this2.onUnmodifyCol(column);
      });

      this.registerEvents();

      // TODO: move adding plugin classname to BasePlugin.
      addClass(this.hot.rootElement, CSS_PLUGIN);

      _get(ManualColumnMove.prototype.__proto__ || Object.getPrototypeOf(ManualColumnMove.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
     */

  }, {
    key: 'updatePlugin',
    value: function updatePlugin() {
      this.disablePlugin();
      this.enablePlugin();

      this.onAfterPluginsInitialized();

      _get(ManualColumnMove.prototype.__proto__ || Object.getPrototypeOf(ManualColumnMove.prototype), 'updatePlugin', this).call(this);
    }

    /**
     * Disables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      var pluginSettings = this.hot.getSettings().manualColumnMove;

      if (Array.isArray(pluginSettings)) {
        this.columnsMapper.clearMap();
      }

      removeClass(this.hot.rootElement, CSS_PLUGIN);

      this.unregisterEvents();
      this.backlight.destroy();
      this.guideline.destroy();

      _get(ManualColumnMove.prototype.__proto__ || Object.getPrototypeOf(ManualColumnMove.prototype), 'disablePlugin', this).call(this);
    }

    /**
     * Moves a single column.
     *
     * @param {Number} column Visual column index to be moved.
     * @param {Number} target Visual column index being a target for the moved column.
     * @fires Hooks#beforeColumnMove
     * @fires Hooks#afterColumnMove
     */

  }, {
    key: 'moveColumn',
    value: function moveColumn(column, target) {
      this.moveColumns([column], target);
    }

    /**
     * Moves a multiple columns.
     *
     * @param {Array} columns Array of visual column indexes to be moved.
     * @param {Number} target Visual column index being a target for the moved columns.
     * @fires Hooks#beforeColumnMove
     * @fires Hooks#afterColumnMove
     */

  }, {
    key: 'moveColumns',
    value: function moveColumns(columns, target) {
      var _this3 = this;

      var visualColumns = [].concat(_toConsumableArray(columns));
      var priv = privatePool.get(this);
      var beforeColumnHook = this.hot.runHooks('beforeColumnMove', visualColumns, target);

      priv.disallowMoving = !beforeColumnHook;

      if (beforeColumnHook !== false) {
        // first we need to rewrite an visual indexes to physical for save reference after move
        arrayEach(columns, function (column, index, array) {
          array[index] = _this3.columnsMapper.getValueByIndex(column);
        });

        // next, when we have got an physical indexes, we can move columns
        arrayEach(columns, function (column, index) {
          var actualPosition = _this3.columnsMapper.getIndexByValue(column);

          if (actualPosition !== target) {
            _this3.columnsMapper.moveColumn(actualPosition, target + index);
          }
        });

        // after moving we have to clear columnsMapper from null entries
        this.columnsMapper.clearNull();
      }

      this.hot.runHooks('afterColumnMove', visualColumns, target);
    }

    /**
     * Correct the cell selection after the move action. Fired only when action was made with a mouse.
     * That means that changing the column order using the API won't correct the selection.
     *
     * @private
     * @param {Number} startColumn Visual column index for the start of the selection.
     * @param {Number} endColumn Visual column index for the end of the selection.
     */

  }, {
    key: 'changeSelection',
    value: function changeSelection(startColumn, endColumn) {
      this.hot.selectColumns(startColumn, endColumn);
    }

    /**
     * Gets the sum of the widths of columns in the provided range.
     *
     * @private
     * @param {Number} from Visual column index.
     * @param {Number} to Visual column index.
     * @returns {Number}
     */

  }, {
    key: 'getColumnsWidth',
    value: function getColumnsWidth(from, to) {
      var width = 0;

      for (var i = from; i < to; i++) {
        var columnWidth = 0;

        if (i < 0) {
          columnWidth = this.hot.view.wt.wtViewport.getRowHeaderWidth() || 0;
        } else {
          columnWidth = this.hot.view.wt.wtTable.getStretchedColumnWidth(i) || 0;
        }

        width += columnWidth;
      }

      return width;
    }

    /**
     * Loads initial settings when persistent state is saved or when plugin was initialized as an array.
     *
     * @private
     */

  }, {
    key: 'initialSettings',
    value: function initialSettings() {
      var pluginSettings = this.hot.getSettings().manualColumnMove;

      if (Array.isArray(pluginSettings)) {
        this.moveColumns(pluginSettings, 0);
      } else if (pluginSettings !== void 0) {
        this.persistentStateLoad();
      }
    }

    /**
     * Checks if the provided column is in the fixedColumnsLeft section.
     *
     * @private
     * @param {Number} column Visual column index to check.
     * @returns {Boolean}
     */

  }, {
    key: 'isFixedColumnsLeft',
    value: function isFixedColumnsLeft(column) {
      return column < this.hot.getSettings().fixedColumnsLeft;
    }

    /**
     * Saves the manual column positions to the persistent state (the {@link Options#persistentState} option has to be enabled).
     */

  }, {
    key: 'persistentStateSave',
    value: function persistentStateSave() {
      this.hot.runHooks('persistentStateSave', 'manualColumnMove', this.columnsMapper._arrayMap);
    }

    /**
     * Loads the manual column positions from the persistent state (the {@link Options#persistentState} option has to be enabled).
     */

  }, {
    key: 'persistentStateLoad',
    value: function persistentStateLoad() {
      var storedState = {};

      this.hot.runHooks('persistentStateLoad', 'manualColumnMove', storedState);

      if (storedState.value) {
        this.columnsMapper._arrayMap = storedState.value;
      }
    }

    /**
     * Prepares an array of indexes based on actual selection.
     *
     * @private
     * @returns {Array}
     */

  }, {
    key: 'prepareColumnsToMoving',
    value: function prepareColumnsToMoving(start, end) {
      var selectedColumns = [];

      rangeEach(start, end, function (i) {
        selectedColumns.push(i);
      });

      return selectedColumns;
    }

    /**
     * Updates the UI visual position.
     *
     * @private
     */

  }, {
    key: 'refreshPositions',
    value: function refreshPositions() {
      var priv = privatePool.get(this);
      var firstVisible = this.hot.view.wt.wtTable.getFirstVisibleColumn();
      var lastVisible = this.hot.view.wt.wtTable.getLastVisibleColumn();
      var wtTable = this.hot.view.wt.wtTable;
      var scrollableElement = this.hot.view.wt.wtOverlays.scrollableElement;
      var scrollLeft = typeof scrollableElement.scrollX === 'number' ? scrollableElement.scrollX : scrollableElement.scrollLeft;
      var tdOffsetLeft = this.hot.view.THEAD.offsetLeft + this.getColumnsWidth(0, priv.coordsColumn);
      var mouseOffsetLeft = priv.target.eventPageX - (priv.rootElementOffset - (scrollableElement.scrollX === void 0 ? scrollLeft : 0));
      var hiderWidth = wtTable.hider.offsetWidth;
      var tbodyOffsetLeft = wtTable.TBODY.offsetLeft;
      var backlightElemMarginLeft = this.backlight.getOffset().left;
      var backlightElemWidth = this.backlight.getSize().width;
      var rowHeaderWidth = 0;

      if (priv.rootElementOffset + wtTable.holder.offsetWidth + scrollLeft < priv.target.eventPageX) {
        if (priv.coordsColumn < priv.countCols) {
          priv.coordsColumn += 1;
        }
      }

      if (priv.hasRowHeaders) {
        rowHeaderWidth = this.hot.view.wt.wtOverlays.leftOverlay.clone.wtTable.getColumnHeader(-1).offsetWidth;
      }
      if (this.isFixedColumnsLeft(priv.coordsColumn)) {
        tdOffsetLeft += scrollLeft;
      }
      tdOffsetLeft += rowHeaderWidth;

      if (priv.coordsColumn < 0) {
        // if hover on rowHeader
        if (priv.fixedColumns > 0) {
          priv.target.col = 0;
        } else {
          priv.target.col = firstVisible > 0 ? firstVisible - 1 : firstVisible;
        }
      } else if (priv.target.TD.offsetWidth / 2 + tdOffsetLeft <= mouseOffsetLeft) {
        var newCoordsCol = priv.coordsColumn >= priv.countCols ? priv.countCols - 1 : priv.coordsColumn;
        // if hover on right part of TD
        priv.target.col = newCoordsCol + 1;
        // unfortunately first column is bigger than rest
        tdOffsetLeft += priv.target.TD.offsetWidth;

        if (priv.target.col > lastVisible && lastVisible < priv.countCols) {
          this.hot.scrollViewportTo(void 0, lastVisible + 1, void 0, true);
        }
      } else {
        // elsewhere on table
        priv.target.col = priv.coordsColumn;

        if (priv.target.col <= firstVisible && priv.target.col >= priv.fixedColumns && firstVisible > 0) {
          this.hot.scrollViewportTo(void 0, firstVisible - 1);
        }
      }

      if (priv.target.col <= firstVisible && priv.target.col >= priv.fixedColumns && firstVisible > 0) {
        this.hot.scrollViewportTo(void 0, firstVisible - 1);
      }

      var backlightLeft = mouseOffsetLeft;
      var guidelineLeft = tdOffsetLeft;

      if (mouseOffsetLeft + backlightElemWidth + backlightElemMarginLeft >= hiderWidth) {
        // prevent display backlight on the right side of the table
        backlightLeft = hiderWidth - backlightElemWidth - backlightElemMarginLeft;
      } else if (mouseOffsetLeft + backlightElemMarginLeft < tbodyOffsetLeft + rowHeaderWidth) {
        // prevent display backlight on the left side of the table
        backlightLeft = tbodyOffsetLeft + rowHeaderWidth + Math.abs(backlightElemMarginLeft);
      }

      if (tdOffsetLeft >= hiderWidth - 1) {
        // prevent display guideline outside the table
        guidelineLeft = hiderWidth - 1;
      } else if (guidelineLeft === 0) {
        // guideline has got `margin-left: -1px` as default
        guidelineLeft = 1;
      } else if (scrollableElement.scrollX !== void 0 && priv.coordsColumn < priv.fixedColumns) {
        guidelineLeft -= priv.rootElementOffset <= scrollableElement.scrollX ? priv.rootElementOffset : 0;
      }

      this.backlight.setPosition(null, backlightLeft);
      this.guideline.setPosition(null, guidelineLeft);
    }

    /**
     * This method checks arrayMap from columnsMapper and updates the columnsMapper if it's necessary.
     *
     * @private
     */

  }, {
    key: 'updateColumnsMapper',
    value: function updateColumnsMapper() {
      var countCols = this.hot.countSourceCols();
      var columnsMapperLen = this.columnsMapper._arrayMap.length;

      if (columnsMapperLen === 0) {
        this.columnsMapper.createMap(countCols || this.hot.getSettings().startCols);
      } else if (columnsMapperLen < countCols) {
        var diff = countCols - columnsMapperLen;

        this.columnsMapper.insertItems(columnsMapperLen, diff);
      } else if (columnsMapperLen > countCols) {
        var maxIndex = countCols - 1;
        var columnsToRemove = [];

        arrayEach(this.columnsMapper._arrayMap, function (value, index) {
          if (value > maxIndex) {
            columnsToRemove.push(index);
          }
        });

        this.columnsMapper.removeItems(columnsToRemove);
      }
    }

    /**
     * Binds the events used by the plugin.
     *
     * @private
     */

  }, {
    key: 'registerEvents',
    value: function registerEvents() {
      var _this4 = this;

      this.eventManager.addEventListener(document.documentElement, 'mousemove', function (event) {
        return _this4.onMouseMove(event);
      });
      this.eventManager.addEventListener(document.documentElement, 'mouseup', function () {
        return _this4.onMouseUp();
      });
    }

    /**
     * Unbinds the events used by the plugin.
     *
     * @private
     */

  }, {
    key: 'unregisterEvents',
    value: function unregisterEvents() {
      this.eventManager.clear();
    }

    /**
     * Changes the behavior of selection / dragging.
     *
     * @private
     * @param {MouseEvent} event `mousedown` event properties.
     * @param {CellCoords} coords Visual cell coordinates where was fired event.
     * @param {HTMLElement} TD Cell represented as HTMLElement.
     * @param {Object} blockCalculations Object which contains information about blockCalculation for row, column or cells.
     */

  }, {
    key: 'onBeforeOnCellMouseDown',
    value: function onBeforeOnCellMouseDown(event, coords, TD, blockCalculations) {
      var wtTable = this.hot.view.wt.wtTable;
      var isHeaderSelection = this.hot.selection.isSelectedByColumnHeader();
      var selection = this.hot.getSelectedRangeLast();
      var priv = privatePool.get(this);
      // This block action shouldn't be handled below.
      var isSortingElement = event.realTarget.className.indexOf('sortAction') > -1;

      if (!selection || !isHeaderSelection || priv.pressed || event.button !== 0 || isSortingElement) {
        priv.pressed = false;
        priv.columnsToMove.length = 0;
        removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI]);
        return;
      }

      var guidelineIsNotReady = this.guideline.isBuilt() && !this.guideline.isAppended();
      var backlightIsNotReady = this.backlight.isBuilt() && !this.backlight.isAppended();

      if (guidelineIsNotReady && backlightIsNotReady) {
        this.guideline.appendTo(wtTable.hider);
        this.backlight.appendTo(wtTable.hider);
      }

      var from = selection.from,
          to = selection.to;

      var start = Math.min(from.col, to.col);
      var end = Math.max(from.col, to.col);

      if (coords.row < 0 && coords.col >= start && coords.col <= end) {
        blockCalculations.column = true;
        priv.pressed = true;
        priv.target.eventPageX = event.pageX;
        priv.coordsColumn = coords.col;
        priv.target.TD = TD;
        priv.target.col = coords.col;
        priv.columnsToMove = this.prepareColumnsToMoving(start, end);
        priv.hasRowHeaders = !!this.hot.getSettings().rowHeaders;
        priv.countCols = this.hot.countCols();
        priv.fixedColumns = this.hot.getSettings().fixedColumnsLeft;
        priv.rootElementOffset = offset(this.hot.rootElement).left;

        var countColumnsFrom = priv.hasRowHeaders ? -1 : 0;
        var topPos = wtTable.holder.scrollTop + wtTable.getColumnHeaderHeight(0) + 1;
        var fixedColumns = coords.col < priv.fixedColumns;
        var scrollableElement = this.hot.view.wt.wtOverlays.scrollableElement;
        var wrapperIsWindow = scrollableElement.scrollX ? scrollableElement.scrollX - priv.rootElementOffset : 0;

        var mouseOffset = event.layerX - (fixedColumns ? wrapperIsWindow : 0);
        var leftOffset = Math.abs(this.getColumnsWidth(start, coords.col) + mouseOffset);

        this.backlight.setPosition(topPos, this.getColumnsWidth(countColumnsFrom, start) + leftOffset);
        this.backlight.setSize(this.getColumnsWidth(start, end + 1), wtTable.hider.offsetHeight - topPos);
        this.backlight.setOffset(null, leftOffset * -1);

        addClass(this.hot.rootElement, CSS_ON_MOVING);
      } else {
        removeClass(this.hot.rootElement, CSS_AFTER_SELECTION);
        priv.pressed = false;
        priv.columnsToMove.length = 0;
      }
    }

    /**
     * 'mouseMove' event callback. Fired when pointer move on document.documentElement.
     *
     * @private
     * @param {MouseEvent} event `mousemove` event properties.
     */

  }, {
    key: 'onMouseMove',
    value: function onMouseMove(event) {
      var priv = privatePool.get(this);

      if (!priv.pressed) {
        return;
      }

      // callback for browser which doesn't supports CSS pointer-event: none
      if (event.realTarget === this.backlight.element) {
        var width = this.backlight.getSize().width;
        this.backlight.setSize(0);

        setTimeout(function () {
          this.backlight.setPosition(width);
        });
      }

      priv.target.eventPageX = event.pageX;
      this.refreshPositions();
    }

    /**
     * 'beforeOnCellMouseOver' hook callback. Fired when pointer was over cell.
     *
     * @private
     * @param {MouseEvent} event `mouseover` event properties.
     * @param {CellCoords} coords Visual cell coordinates where was fired event.
     * @param {HTMLElement} TD Cell represented as HTMLElement.
     * @param {Object} blockCalculations Object which contains information about blockCalculation for row, column or cells.
     */

  }, {
    key: 'onBeforeOnCellMouseOver',
    value: function onBeforeOnCellMouseOver(event, coords, TD, blockCalculations) {
      var selectedRange = this.hot.getSelectedRangeLast();
      var priv = privatePool.get(this);

      if (!selectedRange || !priv.pressed) {
        return;
      }

      if (priv.columnsToMove.indexOf(coords.col) > -1) {
        removeClass(this.hot.rootElement, CSS_SHOW_UI);
      } else {
        addClass(this.hot.rootElement, CSS_SHOW_UI);
      }

      blockCalculations.row = true;
      blockCalculations.column = true;
      blockCalculations.cell = true;
      priv.coordsColumn = coords.col;
      priv.target.TD = TD;
    }

    /**
     * `onMouseUp` hook callback.
     *
     * @private
     */

  }, {
    key: 'onMouseUp',
    value: function onMouseUp() {
      var priv = privatePool.get(this);

      priv.coordsColumn = void 0;
      priv.pressed = false;
      priv.backlightWidth = 0;

      removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI, CSS_AFTER_SELECTION]);

      if (this.hot.selection.isSelectedByColumnHeader()) {
        addClass(this.hot.rootElement, CSS_AFTER_SELECTION);
      }
      if (priv.columnsToMove.length < 1 || priv.target.col === void 0 || priv.columnsToMove.indexOf(priv.target.col) > -1) {
        return;
      }

      this.moveColumns(priv.columnsToMove, priv.target.col);
      this.persistentStateSave();
      this.hot.render();
      this.hot.view.wt.wtOverlays.adjustElementsSize(true);

      if (!priv.disallowMoving) {
        var selectionStart = this.columnsMapper.getIndexByValue(priv.columnsToMove[0]);
        var selectionEnd = this.columnsMapper.getIndexByValue(priv.columnsToMove[priv.columnsToMove.length - 1]);
        this.changeSelection(selectionStart, selectionEnd);
      }

      priv.columnsToMove.length = 0;
    }

    /**
     * `afterScrollHorizontally` hook callback. Fired the table was scrolled horizontally.
     *
     * @private
     */

  }, {
    key: 'onAfterScrollVertically',
    value: function onAfterScrollVertically() {
      var wtTable = this.hot.view.wt.wtTable;
      var headerHeight = wtTable.getColumnHeaderHeight(0) + 1;
      var scrollTop = wtTable.holder.scrollTop;
      var posTop = headerHeight + scrollTop;

      this.backlight.setPosition(posTop);
      this.backlight.setSize(null, wtTable.hider.offsetHeight - posTop);
    }

    /**
     * `afterCreateCol` hook callback.
     *
     * @private
     * @param {Number} index Visual index of the created column.
     * @param {Number} amount Amount of created columns.
     */

  }, {
    key: 'onAfterCreateCol',
    value: function onAfterCreateCol(index, amount) {
      this.columnsMapper.shiftItems(index, amount);
    }

    /**
     * On before remove column listener.
     *
     * @private
     * @param {Number} index Visual column index.
     * @param {Number} amount Defines how many columns removed.
     */

  }, {
    key: 'onBeforeRemoveCol',
    value: function onBeforeRemoveCol(index, amount) {
      var _this5 = this;

      this.removedColumns.length = 0;

      if (index !== false) {
        // Collect physical row index.
        rangeEach(index, index + amount - 1, function (removedIndex) {
          _this5.removedColumns.push(_this5.hot.runHooks('modifyCol', removedIndex, _this5.pluginName));
        });
      }
    }

    /**
     * `afterRemoveCol` hook callback.
     *
     * @private
     */

  }, {
    key: 'onAfterRemoveCol',
    value: function onAfterRemoveCol() {
      this.columnsMapper.unshiftItems(this.removedColumns);
    }

    /**
     * `afterLoadData` hook callback.
     *
     * @private
     */

  }, {
    key: 'onAfterLoadData',
    value: function onAfterLoadData() {
      this.updateColumnsMapper();
    }

    /**
     * 'modifyRow' hook callback.
     *
     * @private
     * @param {Number} column Visual column index.
     * @returns {Number} Physical column index.
     */

  }, {
    key: 'onModifyCol',
    value: function onModifyCol(column, source) {
      var physicalColumn = column;

      if (source !== this.pluginName) {
        // ugly fix for try to insert new, needed columns after pasting data
        var columnInMapper = this.columnsMapper.getValueByIndex(physicalColumn);
        physicalColumn = columnInMapper === null ? physicalColumn : columnInMapper;
      }

      return physicalColumn;
    }

    /**
     * 'unmodifyCol' hook callback.
     *
     * @private
     * @param {Number} column Physical column index.
     * @returns {Number} Visual column index.
     */

  }, {
    key: 'onUnmodifyCol',
    value: function onUnmodifyCol(column) {
      var indexInMapper = this.columnsMapper.getIndexByValue(column);

      return indexInMapper === null ? column : indexInMapper;
    }

    /**
     * `afterPluginsInitialized` hook callback.
     *
     * @private
     */

  }, {
    key: 'onAfterPluginsInitialized',
    value: function onAfterPluginsInitialized() {
      this.updateColumnsMapper();
      this.initialSettings();
      this.backlight.build();
      this.guideline.build();
    }

    /**
     * Destroys the plugin instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.backlight.destroy();
      this.guideline.destroy();

      _get(ManualColumnMove.prototype.__proto__ || Object.getPrototypeOf(ManualColumnMove.prototype), 'destroy', this).call(this);
    }
  }]);

  return ManualColumnMove;
}(BasePlugin);

registerPlugin('ManualColumnMove', ManualColumnMove);

export default ManualColumnMove;