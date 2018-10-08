import BasePlugin from './../_base';
import Hooks from './../../pluginHooks';
import SheetClip from './../../../lib/SheetClip/SheetClip';
import { CellCoords, CellRange } from './../../3rdparty/walkontable/src';
import { getSelectionText } from './../../helpers/dom/element';
import { arrayEach } from './../../helpers/array';
import { rangeEach } from './../../helpers/number';
import { registerPlugin } from './../../plugins';
import copyItem from './contextMenuItem/copy';
import cutItem from './contextMenuItem/cut';
import PasteEvent from './pasteEvent';
import { createElement, destroyElement } from './focusableElement';

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
 * This plugin enables the copy/paste functionality in the Handsontable. The functionality works for API, Context Menu,
 * using keyboard shortcuts and menu bar from the browser.
 * Possible values:
 * * `true` (to enable default options),
 * * `false` (to disable completely)
 *
 * or an object with values:
 * * `'columnsLimit'` (see {@link CopyPaste#columnsLimit})
 * * `'rowsLimit'` (see {@link CopyPaste#rowsLimit})
 * * `'pasteMode'` (see {@link CopyPaste#pasteMode})
 *
 * See [the copy/paste demo](https://docs.handsontable.com/demo-copy-paste.html) for examples.
 *
 * @example
 * ```js
 * // Enables the plugin with default values
 * copyPaste: true,
 * // Enables the plugin with custom values
 * copyPaste: {
 *   columnsLimit: 25,
 *   rowsLimit: 50,
 *   pasteMode: 'shift_down',
 * },
 * ```
 * @class CopyPaste
 * @plugin CopyPaste
 */
class CopyPaste extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
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
     * @type {String}
     * @default 'overwrite'
     */
    this.pasteMode = 'overwrite';
    /**
     * Maximum number of rows than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.
     *
     * @type {Number}
     * @default 1000
     */
    this.rowsLimit = ROWS_LIMIT;

    privatePool.set(this, {
      isTriggeredByCopy: false,
      isTriggeredByCut: false,
      isBeginEditing: false,
      isFragmentSelectionEnabled: false,
    });
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link CopyPaste#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().copyPaste;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    const settings = this.hot.getSettings();
    const priv = privatePool.get(this);

    priv.isFragmentSelectionEnabled = settings.fragmentSelection;

    if (typeof settings.copyPaste === 'object') {
      this.pasteMode = settings.copyPaste.pasteMode || this.pasteMode;
      this.rowsLimit = settings.copyPaste.rowsLimit || this.rowsLimit;
      this.columnsLimit = settings.copyPaste.columnsLimit || this.columnsLimit;
    }

    this.addHook('afterContextMenuDefaultOptions', options => this.onAfterContextMenuDefaultOptions(options));
    this.addHook('afterSelectionEnd', () => this.onAfterSelectionEnd());

    this.focusableElement = createElement();
    this.focusableElement
      .addLocalHook('copy', event => this.onCopy(event))
      .addLocalHook('cut', event => this.onCut(event))
      .addLocalHook('paste', event => this.onPaste(event));

    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    if (this.focusableElement) {
      destroyElement(this.focusableElement);
    }

    super.disablePlugin();
  }

  /**
   * Prepares copyable text from the cells selection in the invisible textarea.
   */
  setCopyableText() {
    const selRange = this.hot.getSelectedRangeLast();

    if (!selRange) {
      return;
    }
    const topLeft = selRange.getTopLeftCorner();
    const bottomRight = selRange.getBottomRightCorner();
    const startRow = topLeft.row;
    const startCol = topLeft.col;
    const endRow = bottomRight.row;
    const endCol = bottomRight.col;
    const finalEndRow = Math.min(endRow, startRow + this.rowsLimit - 1);
    const finalEndCol = Math.min(endCol, startCol + this.columnsLimit - 1);

    this.copyableRanges.length = 0;

    this.copyableRanges.push({
      startRow,
      startCol,
      endRow: finalEndRow,
      endCol: finalEndCol
    });

    this.copyableRanges = this.hot.runHooks('modifyCopyableRange', this.copyableRanges);

    if (endRow !== finalEndRow || endCol !== finalEndCol) {
      this.hot.runHooks('afterCopyLimit', endRow - startRow + 1, endCol - startCol + 1, this.rowsLimit, this.columnsLimit);
    }
  }

  /**
   * Creates copyable text releated to range objects.
   *
   * @param {Object[]} ranges Array of objects with properties `startRow`, `endRow`, `startCol` and `endCol`.
   * @returns {String} Returns string which will be copied into clipboard.
   */
  getRangedCopyableData(ranges) {
    const dataSet = [];
    const copyableRows = [];
    const copyableColumns = [];

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
      const rowSet = [];

      arrayEach(copyableColumns, (column) => {
        rowSet.push(this.hot.getCopyableData(row, column));
      });

      dataSet.push(rowSet);
    });

    return SheetClip.stringify(dataSet);
  }

  /**
   * Creates copyable text releated to range objects.
   *
   * @param {Object[]} ranges Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`.
   * @returns {Array[]} Returns array of arrays which will be copied into clipboard.
   */
  getRangedData(ranges) {
    const dataSet = [];
    const copyableRows = [];
    const copyableColumns = [];

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
      const rowSet = [];

      arrayEach(copyableColumns, (column) => {
        rowSet.push(this.hot.getCopyableData(row, column));
      });

      dataSet.push(rowSet);
    });

    return dataSet;
  }

  /**
   * Copies the selected cell into the clipboard.
   */
  copy() {
    const priv = privatePool.get(this);

    priv.isTriggeredByCopy = true;
    this.focusableElement.focus();
    document.execCommand('copy');
  }

  /**
   * Cuts the selected cell into the clipboard.
   */
  cut() {
    const priv = privatePool.get(this);

    priv.isTriggeredByCut = true;
    this.focusableElement.focus();
    document.execCommand('cut');
  }

  /**
   * Simulates the paste action.
   *
   * @param {String} [value] Value to paste.
   */
  paste(value = '') {
    const pasteData = new PasteEvent();

    pasteData.clipboardData.setData('text/plain', value);
    this.onPaste(pasteData);
  }

  /**
   * `copy` event callback on textarea element.
   *
   * @param {Event} event ClipboardEvent.
   * @private
   */
  onCopy(event) {
    const priv = privatePool.get(this);

    if (!this.hot.isListening() && !priv.isTriggeredByCopy) {
      return;
    }

    const editor = this.hot.getActiveEditor();

    if (editor && editor.isOpened()) {
      return;
    }

    this.setCopyableText();
    priv.isTriggeredByCopy = false;

    const rangedData = this.getRangedData(this.copyableRanges);
    const allowCopying = !!this.hot.runHooks('beforeCopy', rangedData, this.copyableRanges);
    let value = '';

    if (allowCopying) {
      value = SheetClip.stringify(rangedData);

      if (event && event.clipboardData) {
        event.clipboardData.setData('text/plain', value);

      } else if (typeof ClipboardEvent === 'undefined') {
        window.clipboardData.setData('Text', value);
      }

      this.hot.runHooks('afterCopy', rangedData, this.copyableRanges);
    }

    event.preventDefault();
  }

  /**
   * `cut` event callback on textarea element.
   *
   * @param {Event} event ClipboardEvent.
   * @private
   */
  onCut(event) {
    const priv = privatePool.get(this);

    if (!this.hot.isListening() && !priv.isTriggeredByCut) {
      return;
    }

    const editor = this.hot.getActiveEditor();

    if (editor && editor.isOpened()) {
      return;
    }

    this.setCopyableText();
    priv.isTriggeredByCut = false;

    const rangedData = this.getRangedData(this.copyableRanges);
    const allowCuttingOut = !!this.hot.runHooks('beforeCut', rangedData, this.copyableRanges);
    let value;

    if (allowCuttingOut) {
      value = SheetClip.stringify(rangedData);

      if (event && event.clipboardData) {
        event.clipboardData.setData('text/plain', value);

      } else if (typeof ClipboardEvent === 'undefined') {
        window.clipboardData.setData('Text', value);
      }

      this.hot.emptySelectedCells();
      this.hot.runHooks('afterCut', rangedData, this.copyableRanges);
    }

    event.preventDefault();
  }

  /**
   * `paste` event callback on textarea element.
   *
   * @param {Event} event ClipboardEvent or pseudo ClipboardEvent, if paste was called manually.
   * @private
   */
  onPaste(event) {
    if (!this.hot.isListening()) {
      return;
    }

    const editor = this.hot.getActiveEditor();

    if (editor && editor.isOpened()) {
      return;
    }

    if (event && event.preventDefault) {
      event.preventDefault();
    }

    let pastedData;

    if (event && typeof event.clipboardData !== 'undefined') {
      pastedData = event.clipboardData.getData('text/plain');

    } else if (typeof ClipboardEvent === 'undefined' && typeof window.clipboardData !== 'undefined') {
      pastedData = window.clipboardData.getData('Text');
    }

    const inputArray = SheetClip.parse(pastedData);

    if (inputArray.length === 0) {
      return;
    }

    const allowPasting = !!this.hot.runHooks('beforePaste', inputArray, this.copyableRanges);

    if (!allowPasting) {
      return;
    }

    const selected = this.hot.getSelectedLast();
    const coordsFrom = new CellCoords(selected[0], selected[1]);
    const coordsTo = new CellCoords(selected[2], selected[3]);
    const cellRange = new CellRange(coordsFrom, coordsFrom, coordsTo);
    const topLeftCorner = cellRange.getTopLeftCorner();
    const bottomRightCorner = cellRange.getBottomRightCorner();
    const areaStart = topLeftCorner;
    const areaEnd = new CellCoords(
      Math.max(bottomRightCorner.row, inputArray.length - 1 + topLeftCorner.row),
      Math.max(bottomRightCorner.col, inputArray[0].length - 1 + topLeftCorner.col));

    const isSelRowAreaCoverInputValue = coordsTo.row - coordsFrom.row >= inputArray.length - 1;
    const isSelColAreaCoverInputValue = coordsTo.col - coordsFrom.col >= inputArray[0].length - 1;

    this.hot.addHookOnce('afterChange', (changes) => {
      const changesLength = changes ? changes.length : 0;

      if (changesLength) {
        const offset = { row: 0, col: 0 };
        let highestColumnIndex = -1;

        arrayEach(changes, (change, index) => {
          const nextChange = changesLength > index + 1 ? changes[index + 1] : null;

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
   * We have to keep focus on textarea element, to make possible use of the browser tools (copy, cut, paste).
   *
   * @private
   */
  onAfterSelectionEnd() {
    const { isFragmentSelectionEnabled } = privatePool.get(this);
    const editor = this.hot.getActiveEditor();

    if (editor && editor.isOpened()) {
      return;
    }

    const editableElement = editor ? editor.TEXTAREA : void 0;

    if (editableElement) {
      this.focusableElement.setFocusableElement(editableElement);
    } else {
      this.focusableElement.useSecondaryElement();
    }

    if (isFragmentSelectionEnabled && this.focusableElement.getFocusableElement() !== document.activeElement && getSelectionText()) {
      return;
    }

    this.setCopyableText();
    this.focusableElement.focus();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    if (this.focusableElement) {
      destroyElement(this.focusableElement);
      this.focusableElement = null;
    }

    super.destroy();
  }
}

registerPlugin('CopyPaste', CopyPaste);

export default CopyPaste;
