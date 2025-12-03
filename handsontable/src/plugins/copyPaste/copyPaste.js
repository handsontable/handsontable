import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { stringify, parse } from '../../3rdparty/SheetClip';
import { arrayEach } from '../../helpers/array';
import { sanitize, isJSON } from '../../helpers/string';
import { isObject } from '../../helpers/object';
import {
  removeContentEditableFromElementAndDeselect,
  runWithSelectedContendEditableElement,
  makeElementContentEditableAndSelectItsContent,
  isHTMLElement,
  isInternalElement,
} from '../../helpers/dom/element';
import { isSafari } from '../../helpers/browser';
import copyItem from './contextMenuItem/copy';
import copyColumnHeadersOnlyItem from './contextMenuItem/copyColumnHeadersOnly';
import copyWithColumnGroupHeadersItem from './contextMenuItem/copyWithColumnGroupHeaders';
import copyWithColumnHeadersItem from './contextMenuItem/copyWithColumnHeaders';
import cutItem from './contextMenuItem/cut';
import PasteEvent from './pasteEvent';
import {
  CopyableRangesFactory,
  normalizeRanges,
} from './copyableRanges';
import { _dataToHTML, htmlToGridSettings } from '../../utils/parseTable';

Hooks.getSingleton().register('afterCopyLimit');
Hooks.getSingleton().register('modifyCopyableRange');
Hooks.getSingleton().register('beforeCut');
Hooks.getSingleton().register('afterCut');
Hooks.getSingleton().register('beforePaste');
Hooks.getSingleton().register('afterPaste');
Hooks.getSingleton().register('beforeCopy');
Hooks.getSingleton().register('afterCopy');

export const PLUGIN_KEY = 'copyPaste';
export const PLUGIN_PRIORITY = 80;
const SETTING_KEYS = ['fragmentSelection'];
const SOURCE_DATA_HTML_MIME_TYPE = 'application/ht-source-data-json-html';
const META_HEAD = [
  '<meta name="generator" content="Handsontable"/>',
  '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
].join('');

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @description
 * Copy, cut, and paste data by using the `CopyPaste` plugin.
 *
 * Control the `CopyPaste` plugin programmatically through its [API methods](#methods).
 *
 * The user can access the copy-paste features through:
 * - The [context menu](@/guides/cell-features/clipboard/clipboard.md#context-menu).
 * - The [keyboard shortcuts](@/guides/cell-features/clipboard/clipboard.md#related-keyboard-shortcuts).
 * - The browser's menu bar.
 *
 * Read more:
 * - [Guides: Clipboard](@/guides/cell-features/clipboard/clipboard.md)
 * - [Configuration options: `copyPaste`](@/api/options.md#copypaste)
 *
 * @example
 * ```js
 * // enable the plugin with the default configuration
 * copyPaste: true,
 *
 * // or, enable the plugin with a custom configuration
 * copyPaste: {
 *   columnsLimit: 25,
 *   rowsLimit: 50,
 *   pasteMode: 'shift_down',
 *   copyColumnHeaders: true,
 *   copyColumnGroupHeaders: true,
 *   copyColumnHeadersOnly: true,
 *   uiContainer: document.body,
 * },
 * ```
 * @class CopyPaste
 * @plugin CopyPaste
 */
export class CopyPaste extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get SETTING_KEYS() {
    return [
      PLUGIN_KEY,
      ...SETTING_KEYS
    ];
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {
      pasteMode: 'overwrite',
      rowsLimit: Infinity,
      columnsLimit: Infinity,
      copyColumnHeaders: false,
      copyColumnGroupHeaders: false,
      copyColumnHeadersOnly: false,
    };
  }

  /**
   * The maximum number of columns than can be copied to the clipboard.
   *
   * @type {number}
   * @default Infinity
   */
  columnsLimit = Infinity;
  /**
   * The maximum number of rows than can be copied to the clipboard.
   *
   * @type {number}
   * @default Infinity
   */
  rowsLimit = Infinity;
  /**
   * When pasting:
   * - `'overwrite'` - overwrite the currently-selected cells
   * - `'shift_down'` - move currently-selected cells down
   * - `'shift_right'` - move currently-selected cells to the right
   *
   * @type {string}
   * @default 'overwrite'
   */
  pasteMode = 'overwrite';
  /**
   * The UI container for the secondary focusable element.
   *
   * @type {HTMLElement}
   */
  uiContainer = this.hot.rootDocument.body;
  /**
   * Shows the "Copy with headers" item in the context menu and extends the context menu with the
   * `'copy_with_column_headers'` option that can be used for creating custom menus arrangements.
   *
   * @type {boolean}
   * @default false
   */
  #enableCopyColumnHeaders = false;
  /**
   * Shows the "Copy with group headers" item in the context menu and extends the context menu with the
   * `'copy_with_column_group headers'` option that can be used for creating custom menus arrangements.
   *
   * @type {boolean}
   * @default false
   */
  #enableCopyColumnGroupHeaders = false;
  /**
   * Shows the "Copy headers only" item in the context menu and extends the context menu with the
   * `'copy_column_headers_only'` option that can be used for creating custom menus arrangements.
   *
   * @type {boolean}
   * @default false
   */
  #enableCopyColumnHeadersOnly = false;
  /**
   * Defines the data range to copy. Possible values:
   *  * `'cells-only'` Copy selected cells only;
   *  * `'column-headers-only'` Copy column headers only;
   *  * `'with-column-group-headers'` Copy cells with all column headers;
   *  * `'with-column-headers'` Copy cells with column headers;
   *
   * @type {'cells-only' | 'column-headers-only' | 'with-column-group-headers' | 'with-column-headers'}
   */
  #copyMode = 'cells-only';
  /**
   * Flag that is used to prevent copying when the native shortcut was not pressed.
   *
   * @type {boolean}
   */
  #isTriggeredByCopy = false;
  /**
   * Flag that is used to prevent cutting when the native shortcut was not pressed.
   *
   * @type {boolean}
   */
  #isTriggeredByCut = false;
  /**
   * Class that helps generate copyable ranges based on the current selection for different copy mode
   * types.
   *
   * @type {CopyableRangesFactory}
   */
  #copyableRangesFactory = new CopyableRangesFactory({
    countRows: () => this.hot.countRows(),
    countColumns: () => this.hot.countCols(),
    rowsLimit: () => this.rowsLimit,
    columnsLimit: () => this.columnsLimit,
    countColumnHeaders: () => this.hot.view.getColumnHeadersCount(),
  });
  /**
   * Flag that indicates if the viewport scroll should be prevented after pasting the data.
   *
   * @type {boolean}
   */
  #preventViewportScrollOnPaste = false;
  /**
   * Ranges of the cells coordinates, which should be used to copy/cut/paste actions.
   *
   * @private
   * @type {Array<{startRow: number, startCol: number, endRow: number, endCol: number}>}
   */
  copyableRanges = [];

  /**
   * Checks if the [`CopyPaste`](#copypaste) plugin is enabled.
   *
   * This method gets called by Handsontable's [`beforeInit`](@/api/hooks.md#beforeinit) hook.
   * If it returns `true`, the [`enablePlugin()`](#enableplugin) method gets called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the [`CopyPaste`](#copypaste) plugin for your Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.pasteMode = this.getSetting('pasteMode') ?? this.pasteMode;
    this.rowsLimit = isNaN(this.getSetting('rowsLimit')) ? this.rowsLimit : this.getSetting('rowsLimit');
    this.columnsLimit = isNaN(this.getSetting('columnsLimit')) ? this.columnsLimit : this.getSetting('columnsLimit');
    this.#enableCopyColumnHeaders = this.getSetting('copyColumnHeaders');
    this.#enableCopyColumnGroupHeaders = this.getSetting('copyColumnGroupHeaders');
    this.#enableCopyColumnHeadersOnly = this.getSetting('copyColumnHeadersOnly');
    this.uiContainer = this.getSetting('uiContainer') ?? this.uiContainer;

    this.addHook('afterContextMenuDefaultOptions', options => this.#onAfterContextMenuDefaultOptions(options));
    this.addHook('afterSelection', (...args) => this.#onAfterSelection(...args));
    this.addHook('afterSelectionEnd', () => this.#onAfterSelectionEnd());

    // Events are attached to the document, not the root table element - as it should,
    // for Chrome 133 and lower to copy/paste/cut work properly (#dev-2277).
    this.eventManager.addEventListener(this.hot.rootDocument, 'copy', (...args) => this.onCopy(...args));
    this.eventManager.addEventListener(this.hot.rootDocument, 'cut', (...args) => this.onCut(...args));
    this.eventManager.addEventListener(this.hot.rootDocument, 'paste', (...args) => this.onPaste(...args));

    // Without this workaround Safari (tested on Safari@16.5.2) does allow copying/cutting from the browser menu.
    if (isSafari()) {
      this.eventManager.addEventListener(
        this.hot.rootDocument.body, 'mouseenter', (...args) => this.#onSafariMouseEnter(...args)
      );
      this.eventManager.addEventListener(
        this.hot.rootDocument.body, 'mouseleave', (...args) => this.#onSafariMouseLeave(...args)
      );

      this.addHook('afterSelection', () => this.#onSafariAfterSelection());
    }

    super.enablePlugin();
  }

  /**
   * Updates the state of the [`CopyPaste`](#copypaste) plugin.
   *
   * Gets called when [`updateSettings()`](@/api/core.md#updatesettings)
   * is invoked with any of the following configuration options:
   *  - [`copyPaste`](@/api/options.md#copypaste)
   *  - [`fragmentSelection`](@/api/options.md#fragmentselection)
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the [`CopyPaste`](#copypaste) plugin for your Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Copies the contents of the selected cells (and/or their related column headers) to the system clipboard.
   *
   * Takes an optional parameter (`copyMode`) that defines the scope of copying:
   *
   * | `copyMode` value              | Description                                                     |
   * | ----------------------------- | --------------------------------------------------------------- |
   * | `'cells-only'` (default)      | Copy the selected cells                                         |
   * | `'with-column-headers'`       | - Copy the selected cells<br>- Copy the nearest column headers  |
   * | `'with-column-group-headers'` | - Copy the selected cells<br>- Copy all related columns headers |
   * | `'column-headers-only'`       | Copy the nearest column headers (without copying cells)         |
   *
   * @param {string} [copyMode='cells-only'] Copy mode.
   */
  copy(copyMode = 'cells-only') {
    this.#copyMode = copyMode;
    this.#isTriggeredByCopy = true;

    this.#ensureClipboardEventsGetTriggered('copy');
  }

  /**
   * Copies the contents of the selected cells.
   */
  copyCellsOnly() {
    this.copy('cells-only');
  }
  /**
   * Copies the contents of column headers that are nearest to the selected cells.
   */
  copyColumnHeadersOnly() {
    this.copy('column-headers-only');
  }
  /**
   * Copies the contents of the selected cells and all their related column headers.
   */
  copyWithAllColumnHeaders() {
    this.copy('with-column-group-headers');
  }
  /**
   * Copies the contents of the selected cells and their nearest column headers.
   */
  copyWithColumnHeaders() {
    this.copy('with-column-headers');
  }

  /**
   * Cuts the contents of the selected cells to the system clipboard.
   */
  cut() {
    this.#isTriggeredByCut = true;

    this.#ensureClipboardEventsGetTriggered('cut');
  }

  /**
   * Converts the contents of multiple ranges (`ranges`) into a single string.
   *
   * @param {Array<{startRow: number, startCol: number, endRow: number, endCol: number}>} ranges Array of objects with properties `startRow`, `endRow`, `startCol` and `endCol`.
   * @returns {string} A string that will be copied to the clipboard.
   */
  getRangedCopyableData(ranges) {
    return stringify(this.getRangedData(ranges));
  }

  /**
   * Converts the contents of multiple ranges (`ranges`) into an array of arrays.
   *
   * @param {Array<{startRow: number, startCol: number, endRow: number, endCol: number}>} ranges Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`.
   * @param {boolean} [useSourceData=false] Whether to use the source data instead of the data. This will stringify objects as JSON.
   * @returns {Array[]} An array of arrays that will be copied to the clipboard.
   */
  getRangedData(ranges, useSourceData = false) {
    const data = [];
    const { rows, columns } = normalizeRanges(ranges);

    // concatenate all rows and columns data defined in ranges into one copyable string
    arrayEach(rows, (row) => {
      const rowSet = [];

      arrayEach(columns, (column) => {
        if (row < 0) {
          // `row` as the second argument acts here as the `headerLevel` argument
          rowSet.push(this.hot.getColHeader(column, row));

        } else {
          let copyableCellData =
            useSourceData ?
              this.hot.getCopyableSourceData(row, column) :
              this.hot.getCopyableData(row, column);

          if (useSourceData &&
            (isObject(copyableCellData) || Array.isArray(copyableCellData))
          ) {
            copyableCellData = JSON.stringify(copyableCellData);
          }

          rowSet.push(copyableCellData);
        }
      });

      data.push(rowSet);
    });

    return data;
  }

  /**
   * Simulates the paste action.
   *
   * For security reasons, modern browsers don't allow reading from the system clipboard.
   *
   * @param {string} pastableText The value to paste, as a raw string.
   * @param {string} [pastableHtml=''] The value to paste, as HTML.
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

    this.onPaste(pasteData);
  }

  /**
   * Prepares copyable text from the cells selection in the invisible textarea.
   */
  setCopyableText() {
    const selectionRange = this.hot.getSelectedRangeActive();

    if (!selectionRange) {
      return;
    }

    if (selectionRange.isSingleHeader()) {
      this.copyableRanges = [];

      return;
    }

    this.#copyableRangesFactory.setSelectedRange(selectionRange);

    const groupedRanges = new Map([
      ['headers', null],
      ['cells', null],
    ]);

    if (this.#copyMode === 'column-headers-only') {
      groupedRanges.set('headers', this.#copyableRangesFactory.getMostBottomColumnHeadersRange());

    } else {
      if (this.#copyMode === 'with-column-headers') {
        groupedRanges.set('headers', this.#copyableRangesFactory.getMostBottomColumnHeadersRange());

      } else if (this.#copyMode === 'with-column-group-headers') {
        groupedRanges.set('headers', this.#copyableRangesFactory.getAllColumnHeadersRange());
      }

      groupedRanges.set('cells', this.#copyableRangesFactory.getCellsRange());
    }

    this.copyableRanges = Array.from(groupedRanges.values())
      .filter(range => range !== null)
      .map(({ startRow, startCol, endRow, endCol }) => ({ startRow, startCol, endRow, endCol }));

    this.copyableRanges = this.hot.runHooks('modifyCopyableRange', this.copyableRanges);

    const cellsRange = groupedRanges.get('cells');

    if (cellsRange !== null && cellsRange.isRangeTrimmed) {
      const {
        startRow, startCol, endRow, endCol
      } = cellsRange;

      this.hot.runHooks('afterCopyLimit',
        endRow - startRow + 1, endCol - startCol + 1, this.rowsLimit, this.columnsLimit);
    }
  }

  /**
   * Verifies if editor exists and is open.
   *
   * @private
   * @returns {boolean}
   */
  isEditorOpened() {
    return this.hot.getActiveEditor()?.isOpened();
  }

  /**
   * Ensure that the `copy`/`cut` events get triggered properly in Safari.
   *
   * @param {string} eventName Name of the event to get triggered.
   */
  #ensureClipboardEventsGetTriggered(eventName) {
    // Without this workaround Safari (tested on Safari@16.5.2) does not trigger the 'copy' event.
    if (isSafari()) {
      const activeSelectedRange = this.hot.getSelectedRangeActive();

      if (activeSelectedRange) {
        const { row: highlightRow, col: highlightColumn } = activeSelectedRange.highlight;
        const currentlySelectedCell = this.hot.getCell(highlightRow, highlightColumn, true);

        if (currentlySelectedCell) {
          runWithSelectedContendEditableElement(currentlySelectedCell, () => {
            this.hot.rootDocument.execCommand(eventName);
          });
        }
      }

    } else {
      this.hot.rootDocument.execCommand(eventName);
    }
  }

  /**
   * Counts how many column headers will be copied based on the passed range.
   *
   * @private
   * @param {Array<{startRow: number, startCol: number, endRow: number, endCol: number}>} ranges Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`.
   * @returns {{ columnHeadersCount: number }} Returns an object with keys that holds
   *                                           information with the number of copied headers.
   */
  #countCopiedHeaders(ranges) {
    const { rows } = normalizeRanges(ranges);
    let columnHeadersCount = 0;

    for (let row = 0; row < rows.length; row++) {
      if (rows[row] >= 0) {
        break;
      }

      columnHeadersCount += 1;
    }

    return {
      columnHeadersCount,
    };
  }

  /**
   * Prepares new values to populate them into datasource.
   *
   * @private
   * @param {Array} inputArray An array of the data to populate.
   * @param {Array} sourceInputArray An array of the source data to populate.
   * @param {Array} [selection] The selection which indicates from what position the data will be populated.
   * @returns {Array} Range coordinates after populate data.
   */
  populateValues(inputArray, sourceInputArray, selection = this.hot.getSelectedRangeActive()) {
    if (!inputArray.length) {
      return [null, null, null, null];
    }

    const populatedRowsLength = inputArray.length;
    const populatedColumnsLength = inputArray[0].length;
    const newRows = [];

    const { row: startRow, col: startColumn } = selection.getTopStartCorner();
    const { row: endRowFromSelection, col: endColumnFromSelection } = selection.getBottomEndCorner();

    let visualRowForPopulatedData = startRow;
    let visualColumnForPopulatedData = startColumn;
    let lastVisualRow = startRow;
    let lastVisualColumn = startColumn;

    // We try to populate just all copied data or repeat copied data within a selection. Please keep in mind that we
    // don't know whether populated data is bigger than selection on start as there are some cells for which values
    // should be not inserted (it's known right after getting cell meta).
    while (newRows.length < populatedRowsLength || visualRowForPopulatedData <= endRowFromSelection) {
      const { skipRowOnPaste, visualRow } = this.hot.getCellMeta(visualRowForPopulatedData, startColumn);

      visualRowForPopulatedData = visualRow + 1;

      if (skipRowOnPaste === true) {
        /* eslint-disable no-continue */
        continue;
      }

      lastVisualRow = visualRow;
      visualColumnForPopulatedData = startColumn;

      const newRow = [];
      const insertedRow = newRows.length % populatedRowsLength;

      while (newRow.length < populatedColumnsLength || visualColumnForPopulatedData <= endColumnFromSelection) {
        const {
          skipColumnOnPaste,
          visualCol,
        } = this.hot.getCellMeta(visualRow, visualColumnForPopulatedData);
        const sourceDataAtTarget = this.hot.getSourceDataAtCell(visualRow, visualColumnForPopulatedData);
        const insertedColumn = newRow.length % populatedColumnsLength;

        visualColumnForPopulatedData = visualCol + 1;

        if (skipColumnOnPaste === true) {
          /* eslint-disable no-continue */
          continue;
        }

        lastVisualColumn = visualCol;

        const sourceCellValue = sourceInputArray?.[insertedRow]?.[insertedColumn];
        let cellValue = inputArray[insertedRow][insertedColumn];

        if (sourceInputArray && isJSON(sourceCellValue)) {
          const parsedCellValue = JSON.parse(sourceCellValue);

          if (
            Array.isArray(sourceDataAtTarget) ||
            isObject(sourceDataAtTarget) ||
            sourceDataAtTarget === null
          ) {
            cellValue = parsedCellValue;
          }
        }

        newRow.push(cellValue);
      }

      newRows.push(newRow);
    }

    this.#preventViewportScrollOnPaste = true;
    this.hot.populateFromArray(startRow, startColumn, newRows, undefined, undefined, 'CopyPaste.paste', this.pasteMode);

    return [startRow, startColumn, lastVisualRow, lastVisualColumn];
  }

  /**
   * Add the `contenteditable` attribute to the highlighted cell and select its content.
   */
  #addContentEditableToHighlightedCell() {
    if (this.hot.isListening()) {
      const activeSelectedRange = this.hot.getSelectedRangeActive();

      if (activeSelectedRange) {
        const { row: highlightRow, col: highlightColumn } = activeSelectedRange.highlight;
        const currentlySelectedCell = this.hot.getCell(highlightRow, highlightColumn, true);

        if (currentlySelectedCell) {
          makeElementContentEditableAndSelectItsContent(currentlySelectedCell);
        }
      }
    }
  }

  /**
   * Remove the `contenteditable` attribute from the highlighted cell and deselect its content.
   */
  #removeContentEditableFromHighlightedCell() {
    // If the instance is not listening, the workaround is not needed.
    if (this.hot.isListening()) {
      const activeSelectedRange = this.hot.getSelectedRangeActive();

      if (activeSelectedRange) {
        const { row: highlightRow, col: highlightColumn } = activeSelectedRange.highlight;
        const currentlySelectedCell = this.hot.getCell(highlightRow, highlightColumn, true);

        if (currentlySelectedCell?.hasAttribute('contenteditable')) {
          removeContentEditableFromElementAndDeselect(currentlySelectedCell);
        }
      }
    }
  }

  /**
   * `copy` event callback on textarea element.
   *
   * @param {Event} event ClipboardEvent.
   * @private
   */
  onCopy(event) {
    const eventTarget = event.composedPath()[0];
    const focusedElement = this.hot.getFocusManager().getRefocusElement();
    const isHotInput = eventTarget?.hasAttribute('data-hot-input');

    if (
      !this.hot.isListening() && !this.#isTriggeredByCopy ||
      this.isEditorOpened() ||
      isHTMLElement(eventTarget) && (
        (isHotInput && eventTarget !== focusedElement) ||
        (
          !isHotInput && eventTarget !== this.hot.rootDocument.body &&
          !isInternalElement(eventTarget, this.hot.rootElement)
        )
      )
    ) {
      return;
    }

    event.preventDefault();
    this.setCopyableText();
    this.#isTriggeredByCopy = false;

    const rangedData = this.getRangedData(this.copyableRanges);
    const rangedSourceData = this.getRangedData(this.copyableRanges, true);

    const copiedHeadersCount = this.#countCopiedHeaders(this.copyableRanges);
    const allowCopying = !!this.hot.runHooks('beforeCopy', rangedData, this.copyableRanges, copiedHeadersCount);

    if (allowCopying) {
      this.#setClipboardData(event, rangedData, rangedSourceData);

      this.hot.runHooks('afterCopy', rangedData, this.copyableRanges, copiedHeadersCount);
    }

    this.#copyMode = 'cells-only';
  }

  /**
   * `cut` event callback on textarea element.
   *
   * @param {Event} event ClipboardEvent.
   * @private
   */
  onCut(event) {
    const eventTarget = event.composedPath()[0];
    const focusedElement = this.hot.getFocusManager().getRefocusElement();
    const isHotInput = eventTarget?.hasAttribute('data-hot-input');

    if (
      !this.hot.isListening() && !this.#isTriggeredByCut ||
      this.isEditorOpened() ||
      isHTMLElement(eventTarget) && (
        (isHotInput && eventTarget !== focusedElement) ||
        (
          !isHotInput && eventTarget !== this.hot.rootDocument.body &&
          !isInternalElement(eventTarget, this.hot.rootElement)
        )
      )
    ) {
      return;
    }

    event.preventDefault();
    this.setCopyableText();
    this.#isTriggeredByCut = false;

    const rangedData = this.getRangedData(this.copyableRanges);
    const rangedSourceData = this.getRangedData(this.copyableRanges, true);
    const allowCuttingOut = !!this.hot.runHooks('beforeCut', rangedData, this.copyableRanges);

    if (allowCuttingOut) {
      this.#setClipboardData(event, rangedData, rangedSourceData);

      this.hot.emptySelectedCells('CopyPaste.cut');
      this.hot.runHooks('afterCut', rangedData, this.copyableRanges);
    }
  }

  /**
   * `paste` event callback on textarea element.
   *
   * @param {Event} event ClipboardEvent or pseudo ClipboardEvent, if paste was called manually.
   * @private
   */
  onPaste(event) {
    const eventTarget = event.composedPath()[0];
    const focusedElement = this.hot.getFocusManager().getRefocusElement();
    const isHotInput = eventTarget?.hasAttribute('data-hot-input');

    if (
      !this.hot.isListening() ||
      this.isEditorOpened() ||
      !this.hot.getSelected() ||
      isHTMLElement(eventTarget) && (
        (isHotInput && eventTarget !== focusedElement) ||
        (
          !isHotInput && eventTarget !== this.hot.rootDocument.body &&
          !isInternalElement(eventTarget, this.hot.rootElement)
        )
      )
    ) {
      return;
    }

    event.preventDefault();

    let pastedData;
    let pastedSourceData;

    if (event && typeof event.clipboardData !== 'undefined') {
      const sourceDataHTML = event.clipboardData.getData(SOURCE_DATA_HTML_MIME_TYPE);

      if (sourceDataHTML) {
        const parsedSourceConfig = htmlToGridSettings(sourceDataHTML, this.hot.rootDocument);

        pastedSourceData = parsedSourceConfig.data;
      }

      const textHTML = sanitize(event.clipboardData.getData('text/html'), {
        ADD_TAGS: ['meta'],
        ADD_ATTR: ['content'],
        FORCE_BODY: true,
      });

      if (textHTML && /(<table)|(<TABLE)/g.test(textHTML)) {
        const parsedConfig = htmlToGridSettings(textHTML, this.hot.rootDocument);

        pastedData = parsedConfig.data;
      } else {
        pastedData = event.clipboardData.getData('text/plain');
      }

    } else if (typeof ClipboardEvent === 'undefined' && typeof this.hot.rootWindow.clipboardData !== 'undefined') {
      pastedData = this.hot.rootWindow.clipboardData.getData('Text');
    }

    if (typeof pastedData === 'string') {
      pastedData = parse(pastedData);
    }

    if (pastedData === void 0 || pastedData && pastedData.length === 0) {
      return;
    }

    if (this.hot.runHooks('beforePaste', pastedData, this.copyableRanges) === false) {
      return;
    }

    const [startRow, startColumn, endRow, endColumn] = this.populateValues(pastedData, pastedSourceData);

    if (startRow !== null && startColumn !== null) {
      this.hot.selectCell(
        startRow,
        startColumn,
        Math.min(this.hot.countRows() - 1, endRow),
        Math.min(this.hot.countCols() - 1, endColumn),
      );
    }

    this.hot.runHooks('afterPaste', pastedData, this.copyableRanges);
  }

  /**
   * Sets the clipboard data.
   *
   * @param {ClipboardEvent} event The Clipboard event.
   * @param {Array} rangedData Ranged data to set to the clipboard.
   * @param {Array} rangedSourceData Ranged source data to set to the clipboard.
   */
  #setClipboardData(event, rangedData, rangedSourceData) {
    const textPlain = stringify(rangedData);

    if (event && event.clipboardData) {
      const textHTML = _dataToHTML(rangedData);
      const textSourceDataHTML = _dataToHTML(rangedSourceData);

      event.clipboardData.setData('text/plain', textPlain);
      event.clipboardData.setData('text/html', [META_HEAD, textHTML].join(''));
      event.clipboardData.setData(SOURCE_DATA_HTML_MIME_TYPE, [META_HEAD, textSourceDataHTML].join(''));

    } else if (typeof ClipboardEvent === 'undefined') {
      this.hot.rootWindow.clipboardData.setData('Text', textPlain);
    }
  }

  /**
   * Add copy and cut options to the Context Menu.
   *
   * @param {object} options Contains default added options of the Context Menu.
   */
  #onAfterContextMenuDefaultOptions(options) {
    options.items.push(
      { name: '---------' },
      copyItem(this),
    );

    if (this.#enableCopyColumnHeaders) {
      options.items.push(
        copyWithColumnHeadersItem(this),
      );
    }
    if (this.#enableCopyColumnGroupHeaders) {
      options.items.push(
        copyWithColumnGroupHeadersItem(this),
      );
    }
    if (this.#enableCopyColumnHeadersOnly) {
      options.items.push(
        copyColumnHeadersOnlyItem(this),
      );
    }

    options.items.push(cutItem(this));
  }

  /**
   * Disables the viewport scroll after pasting the data.
   *
   * @param {number} fromRow Selection start row visual index.
   * @param {number} fromColumn Selection start column visual index.
   * @param {number} toRow Selection end row visual index.
   * @param {number} toColumn Selection end column visual index.
   * @param {object} preventScrolling Object with `value` property. If `true`, the viewport scroll will be prevented.
   */
  #onAfterSelection(fromRow, fromColumn, toRow, toColumn, preventScrolling) {
    if (this.#preventViewportScrollOnPaste) {
      preventScrolling.value = true;
    }

    this.#preventViewportScrollOnPaste = false;
  }

  /**
   * Force focus on focusableElement after end of the selection.
   */
  #onAfterSelectionEnd() {
    if (this.isEditorOpened()) {
      return;
    }

    if (this.hot.getSettings().fragmentSelection) {
      return;
    }

    this.setCopyableText();
  }

  /**
   * `document.body` `mouseenter` callback used to work around a Safari's problem with copying/cutting from the
   * browser's menu.
   */
  #onSafariMouseEnter() {
    this.#removeContentEditableFromHighlightedCell();
  }

  /**
   * `document.body` `mouseleave` callback used to work around a Safari's problem with copying/cutting from the
   * browser's menu.
   */
  #onSafariMouseLeave() {
    this.#addContentEditableToHighlightedCell();
  }

  /**
   * `afterSelection` hook callback triggered only on Safari.
   */
  #onSafariAfterSelection() {
    this.#removeContentEditableFromHighlightedCell();
  }

  /**
   * Destroys the `CopyPaste` plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
