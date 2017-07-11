import BasePlugin from './../_base.js';
import Hooks from './../../pluginHooks';
import SheetClip from './../../../lib/SheetClip/SheetClip';
import {CellCoords, CellRange} from './../../3rdparty/walkontable/src';
import {KEY_CODES, isCtrlKey} from './../../helpers/unicode';
import {getSelectionText} from './../../helpers/dom/element';
import {arrayEach} from './../../helpers/array';
import {rangeEach} from './../../helpers/number';
import {stopImmediatePropagation, stopPropagation, isImmediatePropagationStopped} from './../../helpers/dom/event';
import {registerPlugin} from './../../plugins';
import Textarea from './textarea';
import copyItem from './contextMenuItem/copy';
import cutItem from './contextMenuItem/cut';
import EventManager from './../../eventManager';

import './copyPaste.css';

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
const privatePool = new WeakMap();

/**
 * @description
 * This plugin enables the copy/paste functionality in the Handsontable.
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
class CopyPaste extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Event manager
     *
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);
    /**
     * Maximum number of columns than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.
     *
     * @private
     * @type {Number}
     * @default 1000
     */
    this.columnsLimit = COLUMNS_LIMIT;
    /**
     * Ranges of the cells coordinates, which should be used to copy/cut/paste actions.
     *
     * @private
     * @type {Array}
     */
    this.copyableRanges = [];
    /**
     * Defines paste (<kbd>CTRL</kbd> + <kbd>V</kbd>) behavior.
     * * Default value `"overwrite"` will paste clipboard value over current selection.
     * * When set to `"shift_down"`, clipboard data will be pasted in place of current selection, while all selected cells are moved down.
     * * When set to `"shift_right"`, clipboard data will be pasted in place of current selection, while all selected cells are moved right.
     *
     * @private
     * @type {String}
     * @default 'overwrite'
     */
    this.pasteMode = 'overwrite';
    /**
     * Maximum number of rows than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.
     *
     * @private
     * @type {Number}
     * @default 1000
     */
    this.rowsLimit = ROWS_LIMIT;
    /**
     * The `textarea` element which is necessary to process copying, cutting off and pasting.
     *
     * @private
     * @type {HTMLElement}
     * @default undefined
     */
    this.textarea = void 0;

    privatePool.set(this, {
      isTriggeredByPaste: false,
    });
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

    const settings = this.hot.getSettings();

    this.textarea = Textarea.getSingleton();

    if (typeof settings.copyPaste === 'object') {
      this.pasteMode = settings.copyPaste.pasteMode || this.pasteMode;
      this.rowsLimit = settings.copyPaste.rowsLimit || this.rowsLimit;
      this.columnsLimit = settings.copyPaste.columnsLimit || this.columnsLimit;
    }

    this.addHook('afterContextMenuDefaultOptions', (options) => this.onAfterContextMenuDefaultOptions(options));
    this.addHook('beforeKeyDown', (event) => this.onBeforeKeyDown(event));
    // this.addHook('beforeOnCellMouseDown', () => this.onBeforeOnCellMouseDown());

    this.registerEvents();

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
    if (this.textarea) {
      this.textarea.destroy();
    }

    super.disablePlugin();
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

    this.textarea.setValue(copyableData);

    if (endRow !== finalEndRow || endCol !== finalEndCol) {
      this.hot.runHooks('afterCopyLimit', endRow - startRow + 1, endCol - startCol + 1, this.rowsLimit, this.columnsLimit);
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
   *
   * @param {Boolean} isTriggeredByClick Flag to determine that copy action was executed by the mouse click.
   */
  copy(isTriggeredByClick) {
    let rangedData = this.getRangedData(this.copyableRanges);

    let allowCopying = !!this.hot.runHooks('beforeCopy', rangedData, this.copyableRanges);

    if (allowCopying) {
      this.textarea.setValue(SheetClip.stringify(rangedData));
      this.textarea.select();

      if (isTriggeredByClick) {
        document.execCommand('copy');
      }

      this.hot.runHooks('afterCopy', rangedData, this.copyableRanges);

    } else {
      this.textarea.setValue('');
    }
  }

  /**
   * Cut action.
   *
   * @param {Boolean} isTriggeredByClick Flag to determine that cut action was executed by the mouse click.
   */
  cut(isTriggeredByClick) {
    let rangedData = this.getRangedData(this.copyableRanges);

    let allowCuttingOut = !!this.hot.runHooks('beforeCut', rangedData, this.copyableRanges);

    if (allowCuttingOut) {
      this.textarea.setValue(SheetClip.stringify(rangedData));
      this.hot.selection.empty();
      this.textarea.select();

      if (isTriggeredByClick) {
        document.execCommand('cut');
      }

      this.hot.runHooks('afterCut', rangedData, this.copyableRanges);

    } else {
      this.textarea.setValue('');
    }
  }

  /**
   * Simulated paste action.
   *
   * @param {String} [value=''] New value, which should be `pasted`.
   */
  paste(value = '') {
    this.textarea.setValue(value);

    this.onPaste();
    this.onInput();
  }

  /**
   * Register event listeners.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(this.textarea.element, 'paste', (event) => this.onPaste(event));
    this.eventManager.addEventListener(this.textarea.element, 'input', (event) => this.onInput(event));
  }

  /**
   * Trigger to make possible observe `onInput` in textarea.
   *
   * @private
   */
  triggerPaste() {
    this.textarea.select();

    this.onPaste();
  }

  /**
   * `paste` event callback on textarea element.
   *
   * @private
   */
  onPaste() {
    const priv = privatePool.get(this);

    priv.isTriggeredByPaste = true;
  }

  /**
   * `input` event callback is called after `paste` event callback.
   *
   * @private
   */
  onInput() {
    const priv = privatePool.get(this);

    if (!this.hot.isListening() || !priv.isTriggeredByPaste) {
      return;
    }

    priv.isTriggeredByPaste = false;

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

    input = this.textarea.getValue();
    inputArray = SheetClip.parse(input);

    let allowPasting = !!this.hot.runHooks('beforePaste', inputArray, this.copyableRanges);

    if (!allowPasting) {
      return;
    }

    selected = this.hot.getSelected();
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

    this.hot.addHookOnce('afterChange', (changes, source) => {
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
        this.hot.selectCell(areaStart.row, areaStart.col, areaEnd.row + offset.row, areaEnd.col + offset.col);
      }
    });

    this.hot.populateFromArray(areaStart.row, areaStart.col, inputArray, areaEnd.row, areaEnd.col, 'CopyPaste.paste', this.pasteMode);
    this.hot.runHooks('afterPaste', inputArray, this.copyableRanges);
  }

  /**
   * Add copy, cut and paste options to the Context Menu.
   *
   * @private
   * @param {Object} options Contains default added options of the Context Menu.
   */
  onAfterContextMenuDefaultOptions(options) {
    options.items.push(
      {
        name: '---------',
      },
      copyItem(this),
      cutItem(this)
    );
  }

  /**
   * beforeKeyDown callback.
   *
   * @private
   * @param {Event} event
   */
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
    if (!this.textarea.isActive() && getSelectionText()) {
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
        this.triggerPaste();
      }
    }
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    if (this.textarea) {
      this.textarea.destroy();
    }

    super.destroy();
  }
}

registerPlugin('CopyPaste', CopyPaste);

export default CopyPaste;
