import copyPaste from './../../../lib/copyPaste/copyPaste';
import SheetClip from './../../../lib/SheetClip/SheetClip';
import Hooks from './../../pluginHooks';
import {KEY_CODES, isCtrlKey} from './../../helpers/unicode';
import {arrayEach} from './../../helpers/array';
import {rangeEach} from './../../helpers/number';
import {stopImmediatePropagation, isImmediatePropagationStopped} from './../../helpers/dom/event';
import {getSelectionText} from './../../helpers/dom/element';
import {CellCoords, CellRange} from './../../3rdparty/walkontable/src';

Hooks.getSingleton().register('afterCopyLimit');
Hooks.getSingleton().register('modifyCopyableRange');
Hooks.getSingleton().register('beforeCut');
Hooks.getSingleton().register('afterCut');
Hooks.getSingleton().register('beforePaste');
Hooks.getSingleton().register('afterPaste');
Hooks.getSingleton().register('beforeCopy');
Hooks.getSingleton().register('afterCopy');

/**
 * @description
 * This plugin enables the copy/paste functionality in Handsontable.
 *
 * @example
 * ```js
 * ...
 * copyPaste: true,
 * ...
 * ```
 * @class CopyPaste
 * @plugin CopyPaste
 */
function CopyPastePlugin(instance) {
  var _this = this;

  this.copyPasteInstance = copyPaste();
  this.copyPasteInstance.onCut(onCut);
  this.copyPasteInstance.triggerCopy = callCopyAction;
  this.copyPasteInstance.onPaste(onPaste);
  this.onPaste = onPaste; // for paste testing purposes
  this.copyableRanges = [];

  instance.addHook('beforeKeyDown', onBeforeKeyDown);

  function onCut() {
    instance.isListening();
  }

  function callCutAction() {
    let rangedData = _this.getRangedData(_this.copyableRanges);

    if (instance.getSettings().fragmentSelection && (SheetClip.stringify(rangedData) != getSelectionText())) {
      return;
    }

    let allowCuttingOut = !!instance.runHooks('beforeCut', rangedData, _this.copyableRanges);

    if (allowCuttingOut) {
      instance.copyPaste.copyPasteInstance.copyable(SheetClip.stringify(rangedData));
      instance.selection.empty();
      instance.runHooks('afterCut', rangedData, _this.copyableRanges);

    } else {
      instance.copyPaste.copyPasteInstance.copyable('');
    }
  }

  function callCopyAction() {
    if (!instance.isListening()) {
      return;
    }

    let rangedData = _this.getRangedData(_this.copyableRanges);

    if (instance.getSettings().fragmentSelection && (SheetClip.stringify(rangedData) != getSelectionText())) {
      return;
    }

    let allowCopying = !!instance.runHooks('beforeCopy', rangedData, _this.copyableRanges);

    if (allowCopying) {
      instance.copyPaste.copyPasteInstance.copyable(SheetClip.stringify(rangedData));
      instance.runHooks('afterCopy', rangedData, _this.copyableRanges);

    } else {
      instance.copyPaste.copyPasteInstance.copyable('');
    }
  }

  function onPaste(str) {
    var
      input,
      inputArray,
      selected,
      coordsFrom,
      coordsTo,
      cellRange,
      topLeftCorner,
      bottomRightCorner,
      areaStart,
      areaEnd;

    if (!instance.isListening() || !instance.selection.isSelected()) {
      return;
    }
    input = str;
    inputArray = SheetClip.parse(input);
    selected = instance.getSelected();
    coordsFrom = new CellCoords(selected[0], selected[1]);
    coordsTo = new CellCoords(selected[2], selected[3]);
    cellRange = new CellRange(coordsFrom, coordsFrom, coordsTo);
    topLeftCorner = cellRange.getTopLeftCorner();
    bottomRightCorner = cellRange.getBottomRightCorner();
    areaStart = topLeftCorner;
    areaEnd = new CellCoords(
      Math.max(bottomRightCorner.row, inputArray.length - 1 + topLeftCorner.row),
      Math.max(bottomRightCorner.col, inputArray[0].length - 1 + topLeftCorner.col));

    let isSelRowAreaCoverInputValue = coordsTo.row - coordsFrom.row >= inputArray.length - 1;
    let isSelColAreaCoverInputValue = coordsTo.col - coordsFrom.col >= inputArray[0].length - 1;

    instance.addHookOnce('afterChange', (changes, source) => {
      let changesLength = changes ? changes.length : 0;

      if (changesLength) {
        let offset = {row: 0, col: 0};
        let highestColumnIndex = -1;

        arrayEach(changes, (change, index) => {
          let nextChange = changesLength > index + 1 ? changes[index + 1] : null;

          if (nextChange) {
            if (!isSelRowAreaCoverInputValue) {
              offset.row += Math.max(nextChange[0] - change[0] - 1, 0);
            }
            if (!isSelColAreaCoverInputValue && change[1] > highestColumnIndex) {
              highestColumnIndex = change[1];
              offset.col += Math.max(nextChange[1] - change[1] - 1, 0);
            }
          }
        });
        instance.selectCell(areaStart.row, areaStart.col, areaEnd.row + offset.row, areaEnd.col + offset.col);
      }
    });

    let allowPasting = !!instance.runHooks('beforePaste', inputArray, _this.copyableRanges);

    if (allowPasting) {
      instance.populateFromArray(areaStart.row, areaStart.col, inputArray, areaEnd.row, areaEnd.col, 'CopyPaste.paste', instance.getSettings().pasteMode);
      instance.runHooks('afterPaste', inputArray, _this.copyableRanges);
    }
  }

  function onBeforeKeyDown(event) {
    if (!instance.getSelected()) {
      return;
    }
    if (instance.getActiveEditor() && instance.getActiveEditor().isOpened()) {
      return;
    }
    if (isImmediatePropagationStopped(event)) {
      return;
    }
    if (isCtrlKey(event.keyCode)) {
      // When fragmentSelection is enabled and some text is selected then don't blur selection calling 'setCopyableText'
      if (instance.getSettings().fragmentSelection && getSelectionText()) {
        return;
      }
      // when CTRL is pressed, prepare selectable text in textarea
      _this.setCopyableText();
      stopImmediatePropagation(event);

      return;
    }
    // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    let ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (ctrlDown) {
      if (event.keyCode == KEY_CODES.A) {
        instance._registerTimeout(setTimeout(_this.setCopyableText.bind(_this), 0));
      }
      if (event.keyCode == KEY_CODES.X) {
        callCutAction();
      }
      if (event.keyCode == KEY_CODES.C) {
        callCopyAction();
      }
    }
  }

  /**
   * Destroy plugin instance.
   *
   * @function destroy
   * @memberof CopyPaste#
   */
  this.destroy = function() {
    if (this.copyPasteInstance) {
      this.copyPasteInstance.removeCallback(onCut);
      this.copyPasteInstance.removeCallback(onPaste);
      this.copyPasteInstance.destroy();
      this.copyPasteInstance = null;
    }
    instance.removeHook('beforeKeyDown', onBeforeKeyDown);
  };

  instance.addHook('afterDestroy', this.destroy.bind(this));

  /**
   * @function triggerPaste
   * @memberof CopyPaste#
   */
  this.triggerPaste = this.copyPasteInstance.triggerPaste.bind(this.copyPasteInstance);

  /**
   * @function triggerCut
   * @memberof CopyPaste#
   */
  this.triggerCut = this.copyPasteInstance.triggerCut.bind(this.copyPasteInstance);

  /**
   * Prepares copyable text in the invisible textarea.
   *
   * @function setCopyable
   * @memberof CopyPaste#
   */
  this.setCopyableText = function() {
    var settings = instance.getSettings();
    var copyRowsLimit = settings.copyRowsLimit;
    var copyColsLimit = settings.copyColsLimit;

    var selRange = instance.getSelectedRange();
    var topLeft = selRange.getTopLeftCorner();
    var bottomRight = selRange.getBottomRightCorner();
    var startRow = topLeft.row;
    var startCol = topLeft.col;
    var endRow = bottomRight.row;
    var endCol = bottomRight.col;
    var finalEndRow = Math.min(endRow, startRow + copyRowsLimit - 1);
    var finalEndCol = Math.min(endCol, startCol + copyColsLimit - 1);

    this.copyableRanges.length = 0;

    this.copyableRanges.push({
      startRow,
      startCol,
      endRow: finalEndRow,
      endCol: finalEndCol
    });

    this.copyableRanges = instance.runHooks('modifyCopyableRange', this.copyableRanges);

    let copyableData = this.getRangedCopyableData(this.copyableRanges);

    instance.copyPaste.copyPasteInstance.copyable(copyableData);

    if (endRow !== finalEndRow || endCol !== finalEndCol) {
      instance.runHooks('afterCopyLimit', endRow - startRow + 1, endCol - startCol + 1, copyRowsLimit, copyColsLimit);
    }
  };

  /**
   * Create copyable text releated to range objects.
   *
   * @since 0.19.0
   * @param {Array} ranges Array of Objects with properties `startRow`, `endRow`, `startCol` and `endCol`.
   * @returns {String} Returns string which will be copied into clipboard.
   */
  this.getRangedCopyableData = function(ranges) {
    let dataSet = [];
    let copyableRows = [];
    let copyableColumns = [];

    // Count all copyable rows and columns
    arrayEach(ranges, (range) => {
      rangeEach(range.startRow, range.endRow, (row) => {
        if (copyableRows.indexOf(row) === -1) {
          copyableRows.push(row);
        }
      });
      rangeEach(range.startCol, range.endCol, (column) => {
        if (copyableColumns.indexOf(column) === -1) {
          copyableColumns.push(column);
        }
      });
    });
    // Concat all rows and columns data defined in ranges into one copyable string
    arrayEach(copyableRows, (row) => {
      let rowSet = [];

      arrayEach(copyableColumns, (column) => {
        rowSet.push(instance.getCopyableData(row, column));
      });

      dataSet.push(rowSet);
    });

    return SheetClip.stringify(dataSet);
  };

  /**
   * Create copyable text releated to range objects.
   *
   * @since 0.31.1
   * @param {Array} ranges Array of Objects with properties `startRow`, `startCol`, `endRow` and `endCol`.
   * @returns {Array} Returns array of arrays which will be copied into clipboard.
   */
  this.getRangedData = function(ranges) {
    let dataSet = [];
    let copyableRows = [];
    let copyableColumns = [];

    let settings = instance.getSettings();
    let copyColumnHeaders = settings.columnHeadersClipboard;
    let copyRowHeaders = settings.rowHeadersClipboard;

    // Count all copyable rows and columns
    arrayEach(ranges, (range) => {
      rangeEach(range.startRow, range.endRow, (row) => {
        if (copyableRows.indexOf(row) === -1) {
          copyableRows.push(row);
        }
      });
      rangeEach(range.startCol, range.endCol, (column) => {
        if (copyableColumns.indexOf(column) === -1) {
          copyableColumns.push(column);
        }
      });
    });

    if (copyColumnHeaders) {
      var rowSet = [];
      if (copyRowHeaders) {
        rowSet.push(' ');
      }
      arrayEach(copyableColumns, (column) => {
        rowSet.push(instance.getColHeader(column));
      });
      dataSet.push(rowSet);
    }

    // Concat all rows and columns data defined in ranges into one copyable string
    arrayEach(copyableRows, (row) => {
      let rowSet = [];

      if (copyRowHeaders) {
        rowSet.push(instance.getRowHeader(row));
      }

      arrayEach(copyableColumns, (column) => {
        rowSet.push(instance.getCopyableData(row, column));
      });

      dataSet.push(rowSet);
    });

    return dataSet;
  };
}

/**
 * Init plugin.
 *
 * @function init
 * @memberof CopyPaste#
 */
function init() {
  var instance = this,
    pluginEnabled = instance.getSettings().copyPaste !== false;

  if (pluginEnabled && !instance.copyPaste) {
    /**
     * Instance of CopyPaste Plugin {@link Handsontable.CopyPaste}
     *
     * @alias copyPaste
     * @memberof! Handsontable.Core#
     * @type {CopyPaste}
     */
    instance.copyPaste = new CopyPastePlugin(instance);

  } else if (!pluginEnabled && instance.copyPaste) {
    instance.copyPaste.destroy();
    instance.copyPaste = null;
  }
}

Hooks.getSingleton().add('afterInit', init);
Hooks.getSingleton().add('afterUpdateSettings', init);

export default CopyPastePlugin;
