import BasePlugin from './../_base';
import Hooks from './../../pluginHooks';
import SheetClip from './../../../lib/SheetClip/SheetClip';
import { arrayEach } from './../../helpers/array';
import { rangeEach } from './../../helpers/number';
import { getSelectionText } from './../../helpers/dom/element';
import { registerPlugin } from './../../plugins';
import copyItem from './contextMenuItem/copy';
import cutItem from './contextMenuItem/cut';
import PasteEvent from './pasteEvent';
import { createElement, destroyElement } from './focusableElement';
import { arrayToTable, tableToArray } from './utils';

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
    this.addHook('afterOnCellMouseUp', () => this.onAfterOnCellMouseUp());
    this.addHook('afterSelectionEnd', () => this.onAfterSelectionEnd());
    this.addHook('beforeKeyDown', () => this.onBeforeKeyDown());

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
    this.getOrCreateFocusableElement();

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
   * Copies the selected cell into the clipboard.
   */
  copy() {
    const priv = privatePool.get(this);
    priv.isTriggeredByCopy = true;

    this.getOrCreateFocusableElement();
    this.focusableElement.focus();
    document.execCommand('copy');
  }

  /**
   * Cuts the selected cell into the clipboard.
   */
  cut() {
    const priv = privatePool.get(this);
    priv.isTriggeredByCut = true;

    this.getOrCreateFocusableElement();
    this.focusableElement.focus();
    document.execCommand('cut');
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
   * Simulates the paste action.
   *
   * @param {String} [value] Value to paste.
   */
  paste(pastableText = '', pastableHtml = pastableText) {
    if (!pastableText && !pastableHtml) {
      return;
    }

    const pasteData = new PasteEvent();

    if (pastableText) {
      pasteData.clipboardData.setData('text/plain', pastableText);
    }
    if (pastableHtml) {
      pasteData.clipboardData.setData('text/html', pastableHtml);
    }

    this.getOrCreateFocusableElement();
    this.onPaste(pasteData);
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
   * Force focus on editable element.
   *
   * @private
   */
  getOrCreateFocusableElement() {
    const editor = this.hot.getActiveEditor();
    const editableElement = editor ? editor.TEXTAREA : void 0;

    if (editableElement) {
      this.focusableElement.setFocusableElement(editableElement);
    } else {
      this.focusableElement.useSecondaryElement();
    }
  }

  /**
   * Verifies if editor exists and is open.
   *
   * @private
   */
  isEditorOpened() {
    const editor = this.hot.getActiveEditor();

    return editor && editor.isOpened();
  }

  /**
   * Prepares new values to populate them into datasource.
   *
   * @private
   * @param {Array} inputArray
   * @param {Array} selection
   * @returns {Array} Range coordinates after populate data
   */
  populateValues(inputArray, selection = this.hot.getSelectedLast()) {
    if (!inputArray.length) {
      return;
    }

    const newValuesMaxRow = inputArray.length - 1;
    const newValuesMaxColumn = inputArray[0].length - 1;

    const startRow = Math.min(selection[0], selection[2]);
    const endRow = Math.max(selection[0], selection[2], newValuesMaxRow + startRow);
    const startColumn = Math.min(selection[1], selection[3]);
    const endColumn = Math.max(selection[1], selection[3], newValuesMaxColumn + startColumn);
    const newValues = [];

    for (let row = startRow, valuesRow = 0; row <= endRow; row += 1) {
      const newRow = [];

      for (let column = startColumn, valuesColumn = 0; column <= endColumn; column += 1) {
        newRow.push(inputArray[valuesRow][valuesColumn]);

        valuesColumn = valuesColumn === newValuesMaxColumn ? 0 : valuesColumn += 1;
      }

      newValues.push(newRow);

      valuesRow = valuesRow === newValuesMaxRow ? 0 : valuesRow += 1;
    }

    this.hot.populateFromArray(startRow, startColumn, newValues, void 0, void 0, 'CopyPaste.paste', this.pasteMode);

    return [startRow, startColumn, endRow, endColumn];
  }

  /**
   * `copy` event callback on textarea element.
   *
   * @param {Event} event ClipboardEvent.
   * @private
   */
  onCopy(event) {
    const priv = privatePool.get(this);

    if ((!this.hot.isListening() && !priv.isTriggeredByCopy) || this.isEditorOpened()) {
      return;
    }

    this.setCopyableText();
    priv.isTriggeredByCopy = false;

    const rangedData = this.getRangedData(this.copyableRanges);
    const allowCopying = !!this.hot.runHooks('beforeCopy', rangedData, this.copyableRanges);

    if (allowCopying) {
      const textPlain = SheetClip.stringify(rangedData);

      if (event && event.clipboardData) {
        const textHTML = arrayToTable(rangedData);

        event.clipboardData.setData('text/plain', textPlain);
        event.clipboardData.setData('text/html', textHTML);

      } else if (typeof ClipboardEvent === 'undefined') {
        window.clipboardData.setData('Text', textPlain);
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

    if ((!this.hot.isListening() && !priv.isTriggeredByCut) || this.isEditorOpened()) {
      return;
    }

    this.setCopyableText();
    priv.isTriggeredByCut = false;

    const rangedData = this.getRangedData(this.copyableRanges);
    const allowCuttingOut = !!this.hot.runHooks('beforeCut', rangedData, this.copyableRanges);

    if (allowCuttingOut) {
      const textPlain = SheetClip.stringify(rangedData);

      if (event && event.clipboardData) {
        const textHTML = arrayToTable(rangedData);

        event.clipboardData.setData('text/plain', textPlain);
        event.clipboardData.setData('text/html', textHTML);

      } else if (typeof ClipboardEvent === 'undefined') {
        window.clipboardData.setData('Text', textPlain);
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
    if (!this.hot.isListening() || this.isEditorOpened()) {
      return;
    }

    if (event && event.preventDefault) {
      event.preventDefault();
    }

    let pastedData;

    if (event && typeof event.clipboardData !== 'undefined') {
      const textHTML = event.clipboardData.getData('text/html');

      if (textHTML && /(<table)|(<TABLE)/.test(textHTML)) {
        pastedData = tableToArray(textHTML);
      } else {
        pastedData = event.clipboardData.getData('text/plain');
      }

    } else if (typeof ClipboardEvent === 'undefined' && typeof window.clipboardData !== 'undefined') {
      pastedData = window.clipboardData.getData('Text');
    }

    const inputArray = typeof pastedData !== 'string' ? pastedData : SheetClip.parse(pastedData);

    if (inputArray.length === 0) {
      return;
    }

    if (this.hot.runHooks('beforePaste', inputArray, this.copyableRanges) === false) {
      return;
    }

    const [startRow, startColumn, endRow, endColumn] = this.populateValues(inputArray);

    this.hot.selectCell(
      startRow,
      startColumn,
      Math.min(this.hot.countRows() - 1, endRow),
      Math.min(this.hot.countCols() - 1, endColumn),
    );

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
   * Force focus on focusableElement.
   *
   * @private
   */
  onAfterOnCellMouseUp() {
    if (!this.hot.isListening() || this.isEditorOpened()) {
      return;
    }

    this.getOrCreateFocusableElement();
    this.focusableElement.focus();
  }

  /**
   * Force focus on focusableElement after end of the selection.
   *
   * @private
   */
  onAfterSelectionEnd() {
    const { isFragmentSelectionEnabled } = privatePool.get(this);

    if (this.isEditorOpened()) {
      return;
    }

    this.getOrCreateFocusableElement();

    if (isFragmentSelectionEnabled && this.focusableElement.getFocusableElement() !== document.activeElement && getSelectionText()) {
      return;
    }

    this.setCopyableText();
    this.focusableElement.focus();
  }

  /**
   * `beforeKeyDown` listener to force focus of focusableElement.
   *
   * @private
   */
  onBeforeKeyDown() {
    if (!this.hot.isListening() || this.isEditorOpened()) {
      return;
    }
    const activeElement = document.activeElement;
    const activeEditor = this.hot.getActiveEditor();

    if (!activeEditor || (activeElement !== this.focusableElement.getFocusableElement() && activeElement !== activeEditor.select)) {
      return;
    }

    this.getOrCreateFocusableElement();
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
