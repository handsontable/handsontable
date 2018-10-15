var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import BasePlugin from './../_base';
import Hooks from './../../pluginHooks';
import { offset, outerHeight, outerWidth } from './../../helpers/dom/element';
import EventManager from './../../eventManager';
import { registerPlugin } from './../../plugins';
import { CellCoords } from './../../3rdparty/walkontable/src';
import { getDeltas, getDragDirectionAndRange, DIRECTIONS, getMappedFillHandleSetting } from './utils';

Hooks.getSingleton().register('modifyAutofillRange');
Hooks.getSingleton().register('beforeAutofill');

var INSERT_ROW_ALTER_ACTION_NAME = 'insert_row';
var INTERVAL_FOR_ADDING_ROW = 200;

/**
 * This plugin provides "drag-down" and "copy-down" functionalities, both operated using the small square in the right
 * bottom of the cell selection.
 *
 * "Drag-down" expands the value of the selected cells to the neighbouring cells when you drag the small square in the corner.
 *
 * "Copy-down" copies the value of the selection to all empty cells below when you double click the small square.
 *
 * @class Autofill
 * @plugin Autofill
 */

var Autofill = function (_BasePlugin) {
  _inherits(Autofill, _BasePlugin);

  function Autofill(hotInstance) {
    _classCallCheck(this, Autofill);

    /**
     * Event manager instance.
     *
     * @private
     * @type {EventManager}
     */
    var _this = _possibleConstructorReturn(this, (Autofill.__proto__ || Object.getPrototypeOf(Autofill)).call(this, hotInstance));

    _this.eventManager = new EventManager(_this);
    /**
     * Specifies if adding new row started.
     *
     * @private
     * @type {Boolean}
     */
    _this.addingStarted = false;
    /**
     * Specifies if there was mouse down on the cell corner.
     *
     * @private
     * @type {Boolean}
     */
    _this.mouseDownOnCellCorner = false;
    /**
     * Specifies if mouse was dragged outside Handsontable.
     *
     * @private
     * @type {Boolean}
     */
    _this.mouseDragOutside = false;
    /**
     * Specifies how many cell levels were dragged using the handle.
     *
     * @private
     * @type {Boolean}
     */
    _this.handleDraggedCells = 0;
    /**
     * Specifies allowed directions of drag (`'horizontal'` or '`vertical`').
     *
     * @private
     * @type {String[]}
     */
    _this.directions = [];
    /**
     * Specifies if can insert new rows if needed.
     *
     * @type {Boolean}
     */
    _this.autoInsertRow = false;
    return _this;
  }

  /**
   * Checks if the plugin is enabled in the Handsontable settings.
   *
   * @returns {Boolean}
   */


  _createClass(Autofill, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return this.hot.getSettings().fillHandle;
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

      this.mapSettings();
      this.registerEvents();

      this.addHook('afterOnCellCornerMouseDown', function (event) {
        return _this2.onAfterCellCornerMouseDown(event);
      });
      this.addHook('afterOnCellCornerDblClick', function (event) {
        return _this2.onCellCornerDblClick(event);
      });
      this.addHook('beforeOnCellMouseOver', function (event, coords) {
        return _this2.onBeforeCellMouseOver(coords);
      });

      _get(Autofill.prototype.__proto__ || Object.getPrototypeOf(Autofill.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
     */

  }, {
    key: 'updatePlugin',
    value: function updatePlugin() {
      this.disablePlugin();
      this.enablePlugin();
      _get(Autofill.prototype.__proto__ || Object.getPrototypeOf(Autofill.prototype), 'updatePlugin', this).call(this);
    }

    /**
     * Disables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      this.clearMappedSettings();
      _get(Autofill.prototype.__proto__ || Object.getPrototypeOf(Autofill.prototype), 'disablePlugin', this).call(this);
    }

    /**
     * Gets selection data
     *
     * @private
     * @returns {Array} Array with the data.
     */

  }, {
    key: 'getSelectionData',
    value: function getSelectionData() {
      var selRange = {
        from: this.hot.getSelectedRangeLast().from,
        to: this.hot.getSelectedRangeLast().to
      };

      return this.hot.getData(selRange.from.row, selRange.from.col, selRange.to.row, selRange.to.col);
    }

    /**
     * Try to apply fill values to the area in fill border, omitting the selection border.
     *
     * @private
     * @returns {Boolean} reports if fill was applied.
     *
     * @fires Hooks#modifyAutofillRange
     * @fires Hooks#beforeAutofill
     */

  }, {
    key: 'fillIn',
    value: function fillIn() {
      if (this.hot.selection.highlight.getFill().isEmpty()) {
        return false;
      }

      var cornersOfSelectionAndDragAreas = this.hot.selection.highlight.getFill().getCorners();

      this.resetSelectionOfDraggedArea();

      var cornersOfSelectedCells = this.getCornersOfSelectedCells();
      cornersOfSelectionAndDragAreas = this.hot.runHooks('modifyAutofillRange', cornersOfSelectionAndDragAreas, cornersOfSelectedCells);

      var _getDragDirectionAndR = getDragDirectionAndRange(cornersOfSelectedCells, cornersOfSelectionAndDragAreas),
          directionOfDrag = _getDragDirectionAndR.directionOfDrag,
          startOfDragCoords = _getDragDirectionAndR.startOfDragCoords,
          endOfDragCoords = _getDragDirectionAndR.endOfDragCoords;

      if (startOfDragCoords && startOfDragCoords.row > -1 && startOfDragCoords.col > -1) {
        var selectionData = this.getSelectionData();

        this.hot.runHooks('beforeAutofill', startOfDragCoords, endOfDragCoords, selectionData);

        var deltas = getDeltas(startOfDragCoords, endOfDragCoords, selectionData, directionOfDrag);
        var fillData = selectionData;

        if (['up', 'left'].indexOf(directionOfDrag) > -1) {
          fillData = [];

          var dragLength = null;
          var fillOffset = null;

          if (directionOfDrag === 'up') {
            dragLength = endOfDragCoords.row - startOfDragCoords.row + 1;
            fillOffset = dragLength % selectionData.length;

            for (var i = 0; i < dragLength; i++) {
              fillData.push(selectionData[(i + (selectionData.length - fillOffset)) % selectionData.length]);
            }
          } else {
            dragLength = endOfDragCoords.col - startOfDragCoords.col + 1;
            fillOffset = dragLength % selectionData[0].length;

            for (var _i = 0; _i < selectionData.length; _i++) {
              fillData.push([]);
              for (var j = 0; j < dragLength; j++) {
                fillData[_i].push(selectionData[_i][(j + (selectionData[_i].length - fillOffset)) % selectionData[_i].length]);
              }
            }
          }
        }

        this.hot.populateFromArray(startOfDragCoords.row, startOfDragCoords.col, fillData, endOfDragCoords.row, endOfDragCoords.col, this.pluginName + '.fill', null, directionOfDrag, deltas);

        this.setSelection(cornersOfSelectionAndDragAreas);
      } else {
        // reset to avoid some range bug
        this.hot._refreshBorders();
      }

      return true;
    }

    /**
     * Reduces the selection area if the handle was dragged outside of the table or on headers.
     *
     * @private
     * @param {CellCoords} coords indexes of selection corners.
     * @returns {CellCoords}
     */

  }, {
    key: 'reduceSelectionAreaIfNeeded',
    value: function reduceSelectionAreaIfNeeded(coords) {
      if (coords.row < 0) {
        coords.row = 0;
      }

      if (coords.col < 0) {
        coords.col = 0;
      }
      return coords;
    }

    /**
     * Gets the coordinates of the drag & drop borders.
     *
     * @private
     * @param {CellCoords} coordsOfSelection `CellCoords` coord object.
     * @returns {Array}
     */

  }, {
    key: 'getCoordsOfDragAndDropBorders',
    value: function getCoordsOfDragAndDropBorders(coordsOfSelection) {
      var topLeftCorner = this.hot.getSelectedRangeLast().getTopLeftCorner();
      var bottomRightCorner = this.hot.getSelectedRangeLast().getBottomRightCorner();
      var coords = void 0;

      if (this.directions.includes(DIRECTIONS.vertical) && (bottomRightCorner.row < coordsOfSelection.row || topLeftCorner.row > coordsOfSelection.row)) {
        coords = new CellCoords(coordsOfSelection.row, bottomRightCorner.col);
      } else if (this.directions.includes(DIRECTIONS.horizontal)) {
        coords = new CellCoords(bottomRightCorner.row, coordsOfSelection.col);
      } else {
        // wrong direction
        return;
      }

      return this.reduceSelectionAreaIfNeeded(coords);
    }

    /**
     * Show the fill border.
     *
     * @private
     * @param {CellCoords} coordsOfSelection `CellCoords` coord object.
     */

  }, {
    key: 'showBorder',
    value: function showBorder(coordsOfSelection) {
      var coordsOfDragAndDropBorders = this.getCoordsOfDragAndDropBorders(coordsOfSelection);

      if (coordsOfDragAndDropBorders) {
        this.redrawBorders(coordsOfDragAndDropBorders);
      }
    }

    /**
     * Add new row
     *
     * @private
     */

  }, {
    key: 'addRow',
    value: function addRow() {
      var _this3 = this;

      this.hot._registerTimeout(setTimeout(function () {
        _this3.hot.alter(INSERT_ROW_ALTER_ACTION_NAME, void 0, 1, _this3.pluginName + '.fill');

        _this3.addingStarted = false;
      }, INTERVAL_FOR_ADDING_ROW));
    }

    /**
     * Add new rows if they are needed to continue auto-filling values.
     *
     * @private
     */

  }, {
    key: 'addNewRowIfNeeded',
    value: function addNewRowIfNeeded() {
      if (this.hot.selection.highlight.getFill().cellRange && this.addingStarted === false && this.autoInsertRow) {
        var cornersOfSelectedCells = this.hot.getSelectedLast();
        var cornersOfSelectedDragArea = this.hot.selection.highlight.getFill().getCorners();
        var nrOfTableRows = this.hot.countRows();

        if (cornersOfSelectedCells[2] < nrOfTableRows - 1 && cornersOfSelectedDragArea[2] === nrOfTableRows - 1) {
          this.addingStarted = true;

          this.addRow();
        }
      }
    }

    /**
     * Get corners of selected cells.
     *
     * @private
     * @returns {Array}
     */

  }, {
    key: 'getCornersOfSelectedCells',
    value: function getCornersOfSelectedCells() {
      if (this.hot.selection.isMultiple()) {
        return this.hot.selection.highlight.createOrGetArea().getCorners();
      }
      return this.hot.selection.highlight.getCell().getCorners();
    }

    /**
     * Get index of last adjacent filled in row
     *
     * @private
     * @param {Array} cornersOfSelectedCells indexes of selection corners.
     * @returns {Number} gives number greater than or equal to zero when selection adjacent can be applied.
     * or -1 when selection adjacent can't be applied
     */

  }, {
    key: 'getIndexOfLastAdjacentFilledInRow',
    value: function getIndexOfLastAdjacentFilledInRow(cornersOfSelectedCells) {
      var data = this.hot.getData();
      var nrOfTableRows = this.hot.countRows();
      var lastFilledInRowIndex = void 0;

      for (var rowIndex = cornersOfSelectedCells[2] + 1; rowIndex < nrOfTableRows; rowIndex++) {
        for (var columnIndex = cornersOfSelectedCells[1]; columnIndex <= cornersOfSelectedCells[3]; columnIndex++) {
          var dataInCell = data[rowIndex][columnIndex];

          if (dataInCell) {
            return -1;
          }
        }

        var dataInNextLeftCell = data[rowIndex][cornersOfSelectedCells[1] - 1];
        var dataInNextRightCell = data[rowIndex][cornersOfSelectedCells[3] + 1];

        if (!!dataInNextLeftCell || !!dataInNextRightCell) {
          lastFilledInRowIndex = rowIndex;
        }
      }

      return lastFilledInRowIndex;
    }

    /**
     * Adds a selection from the start area to the specific row index.
     *
     * @private
     * @param {Array} selectStartArea selection area from which we start to create more comprehensive selection.
     * @param {Number} rowIndex
     */

  }, {
    key: 'addSelectionFromStartAreaToSpecificRowIndex',
    value: function addSelectionFromStartAreaToSpecificRowIndex(selectStartArea, rowIndex) {
      this.hot.selection.highlight.getFill().clear().add(new CellCoords(selectStartArea[0], selectStartArea[1])).add(new CellCoords(rowIndex, selectStartArea[3]));
    }

    /**
     * Sets selection based on passed corners.
     *
     * @private
     * @param {Array} cornersOfArea
     */

  }, {
    key: 'setSelection',
    value: function setSelection(cornersOfArea) {
      var _hot;

      (_hot = this.hot).selectCell.apply(_hot, _toConsumableArray(cornersOfArea).concat([false, false]));
    }

    /**
     * Try to select cells down to the last row in the left column and then returns if selection was applied.
     *
     * @private
     * @returns {Boolean}
     */

  }, {
    key: 'selectAdjacent',
    value: function selectAdjacent() {
      var cornersOfSelectedCells = this.getCornersOfSelectedCells();
      var lastFilledInRowIndex = this.getIndexOfLastAdjacentFilledInRow(cornersOfSelectedCells);

      if (lastFilledInRowIndex === -1 || lastFilledInRowIndex === void 0) {
        return false;
      }

      this.addSelectionFromStartAreaToSpecificRowIndex(cornersOfSelectedCells, lastFilledInRowIndex);

      return true;
    }

    /**
     * Resets selection of dragged area.
     *
     * @private
     */

  }, {
    key: 'resetSelectionOfDraggedArea',
    value: function resetSelectionOfDraggedArea() {
      this.handleDraggedCells = 0;

      this.hot.selection.highlight.getFill().clear();
    }

    /**
     * Redraws borders.
     *
     * @private
     * @param {CellCoords} coords `CellCoords` coord object.
     */

  }, {
    key: 'redrawBorders',
    value: function redrawBorders(coords) {
      this.hot.selection.highlight.getFill().clear().add(this.hot.getSelectedRangeLast().from).add(this.hot.getSelectedRangeLast().to).add(coords);

      this.hot.view.render();
    }

    /**
     * Get if mouse was dragged outside.
     *
     * @private
     * @param {MouseEvent} event `mousemove` event properties.
     * @returns {Boolean}
     */

  }, {
    key: 'getIfMouseWasDraggedOutside',
    value: function getIfMouseWasDraggedOutside(event) {
      var tableBottom = offset(this.hot.table).top - (window.pageYOffset || document.documentElement.scrollTop) + outerHeight(this.hot.table);
      var tableRight = offset(this.hot.table).left - (window.pageXOffset || document.documentElement.scrollLeft) + outerWidth(this.hot.table);

      return event.clientY > tableBottom && event.clientX <= tableRight;
    }

    /**
     * Bind the events used by the plugin.
     *
     * @private
     */

  }, {
    key: 'registerEvents',
    value: function registerEvents() {
      var _this4 = this;

      this.eventManager.addEventListener(document.documentElement, 'mouseup', function () {
        return _this4.onMouseUp();
      });
      this.eventManager.addEventListener(document.documentElement, 'mousemove', function (event) {
        return _this4.onMouseMove(event);
      });
    }

    /**
     * On cell corner double click callback.
     *
     * @private
     */

  }, {
    key: 'onCellCornerDblClick',
    value: function onCellCornerDblClick() {
      var selectionApplied = this.selectAdjacent();

      if (selectionApplied) {
        this.fillIn();
      }
    }

    /**
     * On after cell corner mouse down listener.
     *
     * @private
     */

  }, {
    key: 'onAfterCellCornerMouseDown',
    value: function onAfterCellCornerMouseDown() {
      this.handleDraggedCells = 1;
      this.mouseDownOnCellCorner = true;
    }

    /**
     * On before cell mouse over listener.
     *
     * @private
     * @param {CellCoords} coords `CellCoords` coord object.
     */

  }, {
    key: 'onBeforeCellMouseOver',
    value: function onBeforeCellMouseOver(coords) {
      if (this.mouseDownOnCellCorner && !this.hot.view.isMouseDown() && this.handleDraggedCells) {
        this.handleDraggedCells += 1;

        this.showBorder(coords);
        this.addNewRowIfNeeded();
      }
    }

    /**
     * On mouse up listener.
     *
     * @private
     */

  }, {
    key: 'onMouseUp',
    value: function onMouseUp() {
      if (this.handleDraggedCells) {
        if (this.handleDraggedCells > 1) {
          this.fillIn();
        }

        this.handleDraggedCells = 0;
        this.mouseDownOnCellCorner = false;
      }
    }

    /**
     * On mouse move listener.
     *
     * @private
     * @param {MouseEvent} event `mousemove` event properties.
     */

  }, {
    key: 'onMouseMove',
    value: function onMouseMove(event) {
      var mouseWasDraggedOutside = this.getIfMouseWasDraggedOutside(event);

      if (this.addingStarted === false && this.handleDraggedCells > 0 && mouseWasDraggedOutside) {
        this.mouseDragOutside = true;
        this.addingStarted = true;
      } else {
        this.mouseDragOutside = false;
      }

      if (this.mouseDragOutside && this.autoInsertRow) {
        this.addRow();
      }
    }

    /**
     * Clears mapped settings.
     *
     * @private
     */

  }, {
    key: 'clearMappedSettings',
    value: function clearMappedSettings() {
      this.directions.length = 0;
      this.autoInsertRow = false;
    }

    /**
     * Map settings.
     *
     * @private
     */

  }, {
    key: 'mapSettings',
    value: function mapSettings() {
      var mappedSettings = getMappedFillHandleSetting(this.hot.getSettings().fillHandle);
      this.directions = mappedSettings.directions;
      this.autoInsertRow = mappedSettings.autoInsertRow;
    }

    /**
     * Destroys the plugin instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      _get(Autofill.prototype.__proto__ || Object.getPrototypeOf(Autofill.prototype), 'destroy', this).call(this);
    }
  }]);

  return Autofill;
}(BasePlugin);

registerPlugin('autofill', Autofill);

export default Autofill;