
import BasePlugin from './../_base.js';
import Hooks from './../../pluginHooks';
import SheetClip from './../../../lib/SheetClip/SheetClip';
import {CellCoords, CellRange} from './../../3rdparty/walkontable/src';
import {KEY_CODES, isCtrlKey} from './../../helpers/unicode';
import {getSelectionText} from './../../helpers/dom/element';
import {arrayEach} from './../../helpers/array';
import {rangeEach} from './../../helpers/number';
import {stopImmediatePropagation, isImmediatePropagationStopped} from './../../helpers/dom/event';
import {registerPlugin} from './../../plugins';
import {getInstance} from './copyPasteManager';
import copyItem from './contextMenuItem/copy';
import cutItem from './contextMenuItem/cut';
import pasteItem from './contextMenuItem/paste';

Hooks.getSingleton().register('afterCopyLimit');
Hooks.getSingleton().register('modifyCopyableRange');
Hooks.getSingleton().register('beforeCut');
Hooks.getSingleton().register('afterCut');
Hooks.getSingleton().register('beforePaste');
Hooks.getSingleton().register('afterPaste');
Hooks.getSingleton().register('beforeCopy');
Hooks.getSingleton().register('afterCopy');

const ROWS_LIMIT = 1000;
const COLUMNS_LIMIT = 1000;

class CopyPaste extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    /**
     * Maximum number of rows than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.
     *
     * @type {Number}
     * @default 1000
     */
    this.rowsLimit = ROWS_LIMIT;
    /**
     * Maximum number of columns than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.
     *
     * @type {Number}
     * @default 1000
     */
    this.columnsLimit = COLUMNS_LIMIT;
    /**
     * Ranges of the cells coordinates, which should be used to copy/cut/paste actions.
     *
     * @type {Array}
     */
    this.copyableRanges = [];
    /**
     * Defines paste (<kbd>CTRL</kbd> + <kbd>V</kbd>) behavior.
     * * Default value `"overwrite"` will paste clipboard value over current selection.
     * * When set to `"shift_down"`, clipboard data will be pasted in place of current selection, while all selected cells are moved down.
     * * When set to `"shift_right"`, clipboard data will be pasted in place of current selection, while all selected cells are moved right.
     *
     * @type {String}
     * @default 'overwrite'
     */
    this.pasteMode = 'overwrite';
    /**
     * The `textarea` element which is necessary to process copying, cutting off and pasting.
     *
     * @type {HTMLElement}
     * @default undefined
     */
    this.CopyPasteManager = getInstance();
  }

  /**
   * Check if plugin is enabled.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().copyPaste;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterContextMenuDefaultOptions', (options) => this.onAfterContextMenuDefaultOptions(options));
    this.addHook('beforeKeyDown', (event) => this.onBeforeKeyDown(event));

    super.enablePlugin();
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  onAfterContextMenuDefaultOptions(options) {
    options.items.push(
      Handsontable.plugins.ContextMenu.SEPARATOR,
      copyItem(this),
      cutItem(this),
      pasteItem(this)
    );
  }

  /**
   * Prepares copyable text in the invisible textarea.
   *
   * @function setCopyable
   * @memberof CopyPaste#
   */
  setCopyableText() {
    let selRange = this.hot.getSelectedRange();
    let topLeft = selRange.getTopLeftCorner();
    let bottomRight = selRange.getBottomRightCorner();
    let startRow = topLeft.row;
    let startCol = topLeft.col;
    let endRow = bottomRight.row;
    let endCol = bottomRight.col;
    let finalEndRow = Math.min(endRow, startRow + this.rowsLimit - 1);
    let finalEndCol = Math.min(endCol, startCol + this.columnsLimit - 1);

    this.copyableRanges.length = 0;

    this.copyableRanges.push({
      startRow,
      startCol,
      endRow: finalEndRow,
      endCol: finalEndCol
    });

    this.copyableRanges = this.hot.runHooks('modifyCopyableRange', this.copyableRanges);

    let copyableData = this.getRangedCopyableData(this.copyableRanges);

    this.CopyPasteManager.setData(copyableData);

    if (endRow !== finalEndRow || endCol !== finalEndCol) {
      this.run.runHooks('afterCopyLimit', endRow - startRow + 1, endCol - startCol + 1, copyRowsLimit, copyColsLimit);
    }
  }

  /**
   * Create copyable text releated to range objects.
   *
   * @since 0.19.0
   * @param {Array} ranges Array of Objects with properties `startRow`, `endRow`, `startCol` and `endCol`.
   * @returns {String} Returns string which will be copied into clipboard.
   */
  getRangedCopyableData(ranges) {
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
        rowSet.push(this.hot.getCopyableData(row, column));
      });

      dataSet.push(rowSet);
    });

    return SheetClip.stringify(dataSet);
  }

  /**
   * Create copyable text releated to range objects.
   *
   * @since 0.31.1
   * @param {Array} ranges Array of Objects with properties `startRow`, `startCol`, `endRow` and `endCol`.
   * @returns {Array} Returns array of arrays which will be copied into clipboard.
   */
  getRangedData(ranges) {
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
        rowSet.push(this.hot.getCopyableData(row, column));
      });

      dataSet.push(rowSet);
    });

    return dataSet;
  }

  /**
   * Copy action.
   */
  copy(byClick) {
    let rangedData = this.getRangedData(this.copyableRanges);

    let allowCopying = !!this.hot.runHooks('beforeCopy', rangedData, this.copyableRanges);

    if (allowCopying) {
      console.log('copyPaste: copy');
      this.CopyPasteManager.setData(SheetClip.stringify(rangedData));
      this.CopyPasteManager.action(this.hot.runHooks, 'afterCopy', rangedData, this.copyableRanges, byClick ? 'copy' : void 0);

    } else {
      this.CopyPasteManager.setData('');
    }
  }

  /**
   * Cut action.
   */
  cut(byClick) {
    let rangedData = this.getRangedData(this.copyableRanges);

    let allowCuttingOut = !!this.hot.runHooks('beforeCut', rangedData, this.copyableRanges);

    if (allowCuttingOut) {
      console.log('copyPaste: cut');
      this.CopyPasteManager.setData(SheetClip.stringify(rangedData));
      this.hot.selection.empty();

      this.CopyPasteManager.action(this.hot.runHooks, 'afterCut', rangedData, this.copyableRanges, byClick ? 'cut' : void 0);

    } else {
      this.CopyPasteManager.setData('');
    }
  }

  /**
   * Paste action.
   */
  paste() {
    let _this = this;

    function pasteAction(str) {
      let input,
        inputArray,
        selected,
        coordsFrom,
        coordsTo,
        cellRange,
        topLeftCorner,
        bottomRightCorner,
        areaStart,
        areaEnd;

      input = str;
      inputArray = SheetClip.parse(input);
      selected = _this.hot.getSelected();
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

      _this.hot.addHookOnce('afterChange', (changes, source) => {
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
          _this.hot.selectCell(areaStart.row, areaStart.col, areaEnd.row + offset.row, areaEnd.col + offset.col);
        }
      });

      let allowPasting = !!_this.hot.runHooks('beforePaste', inputArray, _this.copyableRanges);

      if (allowPasting) {
        console.log('copyPaste: paste');
        _this.hot.populateFromArray(areaStart.row, areaStart.col, inputArray, areaEnd.row, areaEnd.col, 'CopyPaste.paste', _this.pasteMode);
        _this.hot.runHooks('afterPaste', inputArray, _this.copyableRanges);
      }
    }

    this.CopyPasteManager.action(pasteAction);
  }

  onBeforeKeyDown(event) {
    if (!this.hot.getSelected()) {
      return;
    }
    if (this.hot.getActiveEditor() && this.hot.getActiveEditor().isOpened()) {
      return;
    }
    if (isImmediatePropagationStopped(event)) {
      return;
    }
    if (!this.CopyPasteManager.isActive() && getSelectionText()) {
      return;
    }

    if (isCtrlKey(event.keyCode)) {
      // When fragmentSelection is enabled and some text is selected then don't blur selection calling 'setCopyableText'
      if (this.hot.getSettings().fragmentSelection && getSelectionText()) {
        return;
      }
      // when CTRL is pressed, prepare selectable text in textarea
      this.setCopyableText();
      stopImmediatePropagation(event);

      return;
    }

    // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    let ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (ctrlDown) {
      if (event.keyCode == KEY_CODES.A) {
        console.log('selectAll');

        setTimeout(() => {
          this.setCopyableText();
        }, 0);

      }
      if (event.keyCode == KEY_CODES.X) {
        this.cut();
      }
      if (event.keyCode == KEY_CODES.C) {
        this.copy();
      }
      if (event.keyCode == KEY_CODES.V) {
        this.paste();
      }
    }
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    super.destroy();
  }
}

registerPlugin('CopyPaste', CopyPaste);

export default CopyPaste;
