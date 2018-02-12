import BasePlugin from './../_base.js';
import Hooks from './../../pluginHooks';
import SheetClip from './../../../lib/SheetClip/SheetClip';
import {CellCoords, CellRange} from './../../3rdparty/walkontable/src';
import {getSelectionText} from './../../helpers/dom/element';
import {arrayEach} from './../../helpers/array';
import {rangeEach} from './../../helpers/number';
import {registerPlugin} from './../../plugins';
import Textarea from './textarea';
import copyItem from './contextMenuItem/copy';
import cutItem from './contextMenuItem/cut';
import EventManager from './../../eventManager';
import PasteEvent from './pasteEvent';

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
      isTriggeredByCopy: false,
      isTriggeredByCut: false,
      isBeginEditing: false,
      isFragmentSelectionEnabled: false,
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
    const priv = privatePool.get(this);

    this.textarea = Textarea.getSingleton();
    priv.isFragmentSelectionEnabled = settings.fragmentSelection;

    if (typeof settings.copyPaste === 'object') {
      this.pasteMode = settings.copyPaste.pasteMode || this.pasteMode;
      this.rowsLimit = settings.copyPaste.rowsLimit || this.rowsLimit;
      this.columnsLimit = settings.copyPaste.columnsLimit || this.columnsLimit;
    }

    this.addHook('afterContextMenuDefaultOptions', (options) => this.onAfterContextMenuDefaultOptions(options));
    this.addHook('afterSelectionEnd', () => this.onAfterSelectionEnd());

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
   * Prepares copyable text from the cells selection in the invisible textarea.
   *
   * @function setCopyable
   * @memberof CopyPaste#
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
  copy() {
    const priv = privatePool.get(this);

    priv.isTriggeredByCopy = true;

    this.textarea.select();
    document.execCommand('copy');
  }

  /**
   * Cut action.
   */
  cut() {
    const priv = privatePool.get(this);

    priv.isTriggeredByCut = true;

    this.textarea.select();
    document.execCommand('cut');
  }

  /**
   * Simulated paste action.
   *
   * @param {String} [value=''] New value, which should be `pasted`.
   */
  paste(value = '') {
    let pasteData = new PasteEvent();
    pasteData.clipboardData.setData('text/plain', value);

    this.onPaste(pasteData);
  }

  /**
   * Register event listeners.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(this.textarea.element, 'paste', (event) => this.onPaste(event));
    this.eventManager.addEventListener(this.textarea.element, 'cut', (event) => this.onCut(event));
    this.eventManager.addEventListener(this.textarea.element, 'copy', (event) => this.onCopy(event));
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

    this.setCopyableText();
    priv.isTriggeredByCopy = false;

    let rangedData = this.getRangedData(this.copyableRanges);
    let allowCopying = !!this.hot.runHooks('beforeCopy', rangedData, this.copyableRanges);
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

    this.setCopyableText();
    priv.isTriggeredByCut = false;

    let rangedData = this.getRangedData(this.copyableRanges);
    let allowCuttingOut = !!this.hot.runHooks('beforeCut', rangedData, this.copyableRanges);
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
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    let inputArray;

    if (event && typeof event.clipboardData !== 'undefined') {
      this.textarea.setValue(event.clipboardData.getData('text/plain'));

    } else if (typeof ClipboardEvent === 'undefined' && typeof window.clipboardData !== 'undefined') {
      this.textarea.setValue(window.clipboardData.getData('Text'));
    }

    inputArray = SheetClip.parse(this.textarea.getValue());
    this.textarea.setValue(' ');

    if (inputArray.length === 0) {
      return;
    }

    let allowPasting = !!this.hot.runHooks('beforePaste', inputArray, this.copyableRanges);

    if (!allowPasting) {
      return;
    }

    let selected = this.hot.getSelectedLast();
    let coordsFrom = new CellCoords(selected[0], selected[1]);
    let coordsTo = new CellCoords(selected[2], selected[3]);
    let cellRange = new CellRange(coordsFrom, coordsFrom, coordsTo);
    let topLeftCorner = cellRange.getTopLeftCorner();
    let bottomRightCorner = cellRange.getBottomRightCorner();
    let areaStart = topLeftCorner;
    let areaEnd = new CellCoords(
      Math.max(bottomRightCorner.row, inputArray.length - 1 + topLeftCorner.row),
      Math.max(bottomRightCorner.col, inputArray[0].length - 1 + topLeftCorner.col));

    let isSelRowAreaCoverInputValue = coordsTo.row - coordsFrom.row >= inputArray.length - 1;
    let isSelColAreaCoverInputValue = coordsTo.col - coordsFrom.col >= inputArray[0].length - 1;

    this.hot.addHookOnce('afterChange', (changes) => {
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
   * We have to keep focus on textarea element, to make possible use of the browser tools (copy, cut, paste).
   *
   * @private
   */
  onAfterSelectionEnd() {
    const priv = privatePool.get(this);
    const editor = this.hot.getActiveEditor();

    if (editor && typeof editor.isOpened !== 'undefined' && editor.isOpened()) {
      return;
    }
    if (priv.isFragmentSelectionEnabled && !this.textarea.isActive() && getSelectionText()) {
      return;
    }

    this.setCopyableText();
    this.textarea.select();
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
