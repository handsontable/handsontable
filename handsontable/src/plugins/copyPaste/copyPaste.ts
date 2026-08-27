import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { stringify, parse } from '../../3rdparty/SheetClip';
import { arrayEach } from '../../helpers/array';
import { isJSON } from '../../helpers/string';
import { isObject, deepClone } from '../../helpers/object';
import {
  removeContentEditableFromElementAndDeselect,
  runWithSelectedContendEditableElement,
  makeElementContentEditableAndSelectItsContent,
  isHTMLElement,
  isInternalElement,
  isShadowRoot,
} from '../../helpers/dom/element';
import { sanitizeHTML } from '../../utils/sanitizer';
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

/**
 * Internet Explorer-specific window extension with legacy clipboard API.
 */
interface IEWindow extends Window {
  clipboardData: DataTransfer;
}

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

/**
 * Squares off a ragged clipboard in place, filling the gaps with the empty-cell value.
 *
 * The grid pastes as wide as the widest row, so the rows that are shorter cover cells too. Doing
 * this before the `beforePaste` hook keeps the hooks and the grid describing the same paste.
 *
 * @param {Array} data The parsed clipboard data.
 */
function padRowsToWidest(data: unknown[][]) {
  const width = data.reduce((widest: number, row: unknown[]) => Math.max(widest, row.length), 0);

  data.forEach((row: unknown[]) => {
    for (let column = 0; column < width; column += 1) {
      if (row[column] === undefined) {
        row[column] = null;
      }
    }
  });
}

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
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the setting keys that trigger a plugin update when changed via `updateSettings`.
   */
  static get SETTING_KEYS() {
    return [
      PLUGIN_KEY,
      ...SETTING_KEYS
    ];
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   */
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
  columnsLimit: number = Infinity;
  /**
   * The maximum number of rows than can be copied to the clipboard.
   *
   * @type {number}
   * @default Infinity
   */
  rowsLimit: number = Infinity;
  /**
   * When pasting:
   * - `'overwrite'` - overwrite the currently-selected cells
   * - `'shift_down'` - move currently-selected cells down
   * - `'shift_right'` - move currently-selected cells to the right
   *
   * @type {string}
   * @default 'overwrite'
   */
  pasteMode: string = 'overwrite';
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
   * Registry of the clipboard events that were already processed. When the grid lives inside
   * a Shadow DOM tree, the clipboard listeners are bound both to the document and to the
   * grid's shadow root, so the same event instance can reach the plugin twice.
   *
   * @type {WeakSet<object>}
   */
  #processedClipboardEvents: WeakSet<object> = new WeakSet();
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
  copyableRanges: Record<string, number>[] = [];

  /**
   * Checks if the [`CopyPaste`](#copypaste) plugin is enabled.
   *
   * This method gets called by Handsontable's [`beforeInit`](@/api/hooks.md#beforeinit) hook.
   * If it returns `true`, the [`enablePlugin()`](#enableplugin) method gets called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the [`CopyPaste`](#copypaste) plugin for your Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    this.pasteMode = this.getSetting<string>('pasteMode') ?? this.pasteMode;
    this.rowsLimit = isNaN(this.getSetting<number>('rowsLimit')!)
      ? this.rowsLimit : this.getSetting<number>('rowsLimit')!;
    this.columnsLimit = isNaN(this.getSetting<number>('columnsLimit')!)
      ? this.columnsLimit : this.getSetting<number>('columnsLimit')!;
    this.#enableCopyColumnHeaders = this.getSetting<boolean>('copyColumnHeaders')!;
    this.#enableCopyColumnGroupHeaders = this.getSetting<boolean>('copyColumnGroupHeaders')!;
    this.#enableCopyColumnHeadersOnly = this.getSetting<boolean>('copyColumnHeadersOnly')!;
    this.uiContainer = this.getSetting<HTMLElement>('uiContainer') ?? this.uiContainer;

    this.addHook('afterContextMenuDefaultOptions', this.#onAfterContextMenuDefaultOptions);
    this.addHook('afterSelection', this.#onAfterSelection);
    this.addHook('afterSelectionEnd', this.#onAfterSelectionEnd);

    // Events are attached to the document, not the root table element - as it should,
    // for Chrome 133 and lower to copy/paste/cut work properly (#dev-2277).
    const dedupe = (handler: (event: ClipboardEvent) => void) => (event: ClipboardEvent) => {
      if (this.#processedClipboardEvents.has(event)) {
        return;
      }
      this.#processedClipboardEvents.add(event);
      handler(event);
    };

    this.eventManager.addEventListener(this.hot.rootDocument, 'copy', dedupe((e: ClipboardEvent) => this.onCopy(e)));
    this.eventManager.addEventListener(this.hot.rootDocument, 'cut', dedupe((e: ClipboardEvent) => this.onCut(e)));
    this.eventManager.addEventListener(this.hot.rootDocument, 'paste', dedupe((e: ClipboardEvent) => this.onPaste(e)));

    const rootNode = this.hot.rootElement.getRootNode();

    // When the grid lives inside a Shadow DOM tree, the same listeners are attached to the
    // grid's shadow root as well. Sandboxed hosts (e.g. Salesforce Lightning Web Security)
    // retarget events observed at the document level, which hides the grid internals from
    // the document listeners above. Listeners bound inside the grid's own shadow tree still
    // receive the untouched event path. The `#processedClipboardEvents` registry prevents
    // double handling when both listeners receive the same event.
    if (isShadowRoot(rootNode)) {
      this.eventManager.addEventListener(rootNode, 'copy', dedupe((e: ClipboardEvent) => this.onCopy(e)));
      this.eventManager.addEventListener(rootNode, 'cut', dedupe((e: ClipboardEvent) => this.onCut(e)));
      this.eventManager.addEventListener(rootNode, 'paste', dedupe((e: ClipboardEvent) => this.onPaste(e)));
    }

    // Without this workaround Safari (tested on Safari@16.5.2) does allow copying/cutting from the browser menu.
    if (isSafari()) {
      this.eventManager.addEventListener(
        this.hot.rootDocument.body, 'mouseenter', this.#onSafariMouseEnter
      );
      this.eventManager.addEventListener(
        this.hot.rootDocument.body, 'mouseleave', this.#onSafariMouseLeave
      );

      this.addHook('afterSelection', this.#onSafariAfterSelection);
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
  updatePlugin(): void {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the [`CopyPaste`](#copypaste) plugin for your Handsontable instance.
   */
  disablePlugin(): void {
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
  copy(copyMode: string = 'cells-only'): void {
    this.#copyMode = copyMode;
    this.#isTriggeredByCopy = true;

    this.#ensureClipboardEventsGetTriggered('copy');
  }

  /**
   * Copies the contents of the selected cells.
   */
  copyCellsOnly(): void {
    this.copy('cells-only');
  }
  /**
   * Copies the contents of column headers that are nearest to the selected cells.
   */
  copyColumnHeadersOnly(): void {
    this.copy('column-headers-only');
  }
  /**
   * Copies the contents of the selected cells and all their related column headers.
   */
  copyWithAllColumnHeaders(): void {
    this.copy('with-column-group-headers');
  }
  /**
   * Copies the contents of the selected cells and their nearest column headers.
   */
  copyWithColumnHeaders(): void {
    this.copy('with-column-headers');
  }

  /**
   * Cuts the contents of the selected cells to the system clipboard.
   */
  cut(): void {
    this.#isTriggeredByCut = true;

    this.#ensureClipboardEventsGetTriggered('cut');
  }

  /**
   * Converts the contents of multiple ranges (`ranges`) into a single string.
   *
   * @param {Array<{startRow: number, startCol: number, endRow: number, endCol: number}>} ranges Array of objects with properties `startRow`, `endRow`, `startCol` and `endCol`.
   * @returns {string} A string that will be copied to the clipboard.
   */
  getRangedCopyableData(ranges: Record<string, number>[]): string {
    return stringify(this.getRangedData(ranges));
  }

  /**
   * Converts the contents of multiple ranges (`ranges`) into an array of arrays.
   *
   * @param {Array<{startRow: number, startCol: number, endRow: number, endCol: number}>} ranges Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`.
   * @param {boolean} [useSourceData=false] Whether to use the source data instead of the data. This will stringify objects as JSON.
   * @returns {Array[]} An array of arrays that will be copied to the clipboard.
   */
  getRangedData(ranges: Record<string, number>[], useSourceData: boolean = false): unknown[][] {
    const data: unknown[][] = [];
    const { rows, columns } = normalizeRanges(ranges);

    // concatenate all rows and columns data defined in ranges into one copyable string
    arrayEach(rows, (row: number) => {
      const rowSet: unknown[] = [];

      arrayEach(columns, (column: number) => {
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
  paste(pastableText: string = '', pastableHtml: string = pastableText): void {
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
  setCopyableText(): void {
    const selectionRange = this.hot.getSelectedRangeActive();

    if (!selectionRange) {
      return;
    }

    if (selectionRange.isSingleHeader()) {
      this.copyableRanges = [];

      return;
    }

    this.#copyableRangesFactory.setSelectedRange(selectionRange);

    type RangeEntry = {
      isRangeTrimmed: boolean; startRow: number; startCol: number; endRow: number; endCol: number
    } | null;
    const groupedRanges = new Map<string, RangeEntry>([
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

    if (cellsRange !== null && cellsRange !== undefined && cellsRange.isRangeTrimmed) {
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
  #ensureClipboardEventsGetTriggered(eventName: string) {
    // Without this workaround Safari (tested on Safari@16.5.2) does not trigger the 'copy' event.
    if (isSafari()) {
      const activeSelectedRange = this.hot.getSelectedRangeActive();

      if (activeSelectedRange) {
        const { row: highlightRow, col: highlightColumn } = activeSelectedRange.highlight;

        if (highlightRow !== null && highlightColumn !== null) {
          const currentlySelectedCell = this.hot.getCell(highlightRow, highlightColumn, true);

          if (currentlySelectedCell) {
            runWithSelectedContendEditableElement(currentlySelectedCell, () => {
              this.hot.rootDocument.execCommand(eventName);
            });
          }
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
  #countCopiedHeaders(ranges: Record<string, number>[]) {
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
   * @param {object} pasteData An object with the data to populate.
   * @param {object} pasteData.plainData The plain data to populate.
   * @param {object} pasteData.sourceData The source data to populate.
   * @param {object} pasteData.originalPlainData The original plain data before user modifications in beforePaste.
   * @returns {number[]} Range coordinates after populate data.
   */
  populateValues({ plainData, originalPlainData, sourceData }: {
    plainData: unknown[][];
    originalPlainData: unknown[][];
    sourceData: unknown[][];
  }) {
    if (!plainData.length) {
      return [null, null, null, null];
    }

    const selection = this.hot.getSelectedRangeActive();
    const populatedRowsLength = plainData.length;
    // A ragged clipboard (rows of unequal length) must not be narrowed to the first row's width -
    // cells past that width would never be written. The widest row wins, as in spreadsheet apps.
    const populatedColumnsLength = plainData
      .reduce((maxLength: number, row: unknown[]) => Math.max(maxLength, row.length), 0);
    const newRows = [];

    if (!selection) {
      return [null, null, null, null];
    }

    const { row: startRow, col: startColumn } = selection.getTopStartCorner();
    const { row: endRowFromSelection, col: endColumnFromSelection } = selection.getBottomEndCorner();

    if (startRow === null || startColumn === null || endRowFromSelection === null || endColumnFromSelection === null) {
      return [null, null, null, null];
    }

    let visualRowForPopulatedData: number = startRow;
    let visualColumnForPopulatedData: number = startColumn;
    let lastVisualRow: number = startRow;
    let lastVisualColumn: number = startColumn;

    // We try to populate just all copied data or repeat copied data within a selection. Please keep in mind that we
    // don't know whether populated data is bigger than selection on start as there are some cells for which values
    // should be not inserted (it's known right after getting cell meta).
    while (newRows.length < populatedRowsLength || visualRowForPopulatedData <= endRowFromSelection) {
      const { skipRowOnPaste, visualRow } = this.hot.getCellMeta<{ skipRowOnPaste: boolean, visualRow: number }>(
        visualRowForPopulatedData, startColumn);

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
          parsePastedValue,
        } = this.hot.getCellMeta<{ skipColumnOnPaste: boolean, visualCol: number, parsePastedValue: unknown }>(
          visualRow, visualColumnForPopulatedData);
        const sourceDataAtTarget = this.hot.getSourceDataAtCell(visualRow, visualColumnForPopulatedData);
        const insertedColumn = newRow.length % populatedColumnsLength;

        visualColumnForPopulatedData = visualCol + 1;

        if (skipColumnOnPaste === true) {
          /* eslint-disable no-continue */
          continue;
        }

        lastVisualColumn = visualCol;

        const sourceCellValue = sourceData?.[insertedRow]?.[insertedColumn];
        const originalCellValue = originalPlainData?.[insertedRow]?.[insertedColumn];
        let cellValue: unknown = plainData[insertedRow][insertedColumn];

        if (parsePastedValue && sourceData && isJSON(sourceCellValue as string) && cellValue === originalCellValue) {
          const parsedCellValue: unknown = JSON.parse(sourceCellValue as string);

          cellValue = parsedCellValue;
        }

        // A row shorter than the widest one has no value here. Write the empty-cell value rather
        // than `undefined`, which would delete the property outright in an object data source.
        newRow.push(cellValue === undefined ? null : cellValue);
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

        if (highlightRow === null || highlightColumn === null) {
          return;
        }

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

        if (highlightRow === null || highlightColumn === null) {
          return;
        }

        const currentlySelectedCell = this.hot.getCell(highlightRow, highlightColumn, true);

        if (currentlySelectedCell?.hasAttribute('contenteditable')) {
          removeContentEditableFromElementAndDeselect(currentlySelectedCell);
        }
      }
    }
  }

  /**
   * Resolves the element the clipboard event originated from. A complete path (one that
   * crosses shadow boundaries and therefore contains ShadowRoot entries) is trusted as-is -
   * its initial element is the real source, e.g. a node inside a web component that a custom
   * renderer put in a cell. A path without ShadowRoot entries either involves no shadow tree
   * at all (then `target` equals the path's initial element) or was filtered by a sandboxed
   * host (e.g. Salesforce Lightning Web Security) that collapses `composedPath()` to the
   * shadow host chain while still retargeting `event.target` correctly for listeners bound
   * within the grid's shadow tree - in both cases the retargeted `target` is the deepest
   * reliable reference to the source element.
   *
   * @param {ClipboardEvent | PasteEvent} event The clipboard event to resolve.
   * @returns {unknown} The deepest known event source element.
   */
  #resolveClipboardEventTarget(event: ClipboardEvent | PasteEvent): unknown {
    const eventPath = event.composedPath();

    if (eventPath.some(entry => isShadowRoot(entry))) {
      return eventPath[0];
    }

    const target = 'target' in event ? event.target : null;

    return target ?? eventPath[0];
  }

  /**
   * `copy` event callback on textarea element.
   *
   * @param {Event} event ClipboardEvent.
   * @private
   */
  onCopy(event: ClipboardEvent) {
    const eventTarget = this.#resolveClipboardEventTarget(event);
    const focusedElement = this.hot.getFocusManager().getRefocusElement();
    const isHotInput = isHTMLElement(eventTarget) && 'hotInput' in eventTarget.dataset;

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
  onCut(event: ClipboardEvent) {
    const eventTarget = this.#resolveClipboardEventTarget(event);
    const focusedElement = this.hot.getFocusManager().getRefocusElement();
    const isHotInput = isHTMLElement(eventTarget) && 'hotInput' in eventTarget.dataset;

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
  onPaste(event: ClipboardEvent | PasteEvent) {
    const eventTarget = this.#resolveClipboardEventTarget(event);
    const focusedElement = this.hot.getFocusManager().getRefocusElement();
    const isHotInput = isHTMLElement(eventTarget) && 'hotInput' in eventTarget.dataset;

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

    event.preventDefault?.();

    const clipboardResult = this.#readClipboardData(event);
    const { pastedSourceData } = clipboardResult;
    let { pastedData } = clipboardResult;

    if (typeof pastedData === 'string') {
      pastedData = parse(pastedData);
    }

    if (pastedData === void 0 || Array.isArray(pastedData) && pastedData.length === 0) {
      return;
    }

    padRowsToWidest(pastedData as unknown[][]);

    // Store a copy of the original pasted data before user can modify it in beforePaste hook.
    // This is needed to detect if user modified values and respect their modifications over source data.
    const originalPastedData = deepClone(pastedData);

    if (this.hot.runHooks('beforePaste', pastedData, this.copyableRanges) === false) {
      return;
    }

    const [startRow, startColumn, endRow, endColumn] = this.populateValues({
      plainData: pastedData as unknown[][],
      sourceData: pastedSourceData as unknown[][],
      originalPlainData: originalPastedData as unknown[][],
    });

    if (startRow !== null && startColumn !== null && endRow !== null && endColumn !== null) {
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
   * Reads pasted data and source data from a paste event's clipboard.
   *
   * @param {ClipboardEvent | PasteEvent} event The paste event.
   * @returns {{ pastedData: unknown, pastedSourceData: unknown }} The pasted data and source data.
   */
  #readClipboardData(event: ClipboardEvent | PasteEvent): { pastedData: unknown; pastedSourceData: unknown } {
    let pastedData: unknown;
    let pastedSourceData: unknown;

    if (event && typeof event.clipboardData !== 'undefined') {
      const clipboardData = event.clipboardData!;
      // `SOURCE_DATA_HTML_MIME_TYPE` is written by Handsontable's own copy handler, but the
      // clipboard is not a trusted channel: any page can set the same type from its own `copy`
      // handler, so it is sanitized like the `text/html` branch below.
      //
      // It gets its own context. The sink it feeds is inert (`htmlToGridSettings()` parses through
      // `DOMParser`), so a sanitizer may pass this payload through without reopening an injection
      // hole, and passing it through is what keeps object-based source data surviving a strict
      // sanitizer. Sharing one context would force that choice on everyone and would also run the
      // sanitizer twice over the same cells on an internal paste, since both clipboard types carry
      // a full table.
      const sourceDataHTML = sanitizeHTML(
        this.hot, clipboardData.getData(SOURCE_DATA_HTML_MIME_TYPE) ?? '', 'CopyPaste.paste.sourceData'
      );

      if (sourceDataHTML) {
        const parsedSourceConfig = htmlToGridSettings(sourceDataHTML, this.hot.rootDocument);

        pastedSourceData = parsedSourceConfig?.data;
      }

      const textHTML = sanitizeHTML(this.hot, clipboardData.getData('text/html') ?? '', 'CopyPaste.paste');

      if (textHTML && /(<table)|(<TABLE)/g.test(textHTML)) {
        const parsedConfig = htmlToGridSettings(textHTML, this.hot.rootDocument);

        pastedData = parsedConfig?.data;
      } else {
        pastedData = clipboardData.getData('text/plain');

        // Excel terminates every row (including the last) with a CRLF. For a single-cell copy that
        // produces a trailing newline, which `SheetClip.parse` would read as a row separator and emit
        // an extra empty row, blanking the cell below the paste target. Treat a single trailing
        // newline as a terminator, not a separator.
        if (typeof pastedData === 'string') {
          pastedData = pastedData.replace(/(\r\n|\r|\n)$/, '');
        }
      }

    } else if (typeof ClipboardEvent === 'undefined' &&
      typeof (this.hot.rootWindow as unknown as IEWindow).clipboardData !== 'undefined') {
      pastedData = (this.hot.rootWindow as unknown as IEWindow).clipboardData.getData('Text');
    }

    return { pastedData, pastedSourceData };
  }

  /**
   * Sets the clipboard data.
   *
   * @param {ClipboardEvent} event The Clipboard event.
   * @param {Array} rangedData Ranged data to set to the clipboard.
   * @param {Array} rangedSourceData Ranged source data to set to the clipboard.
   */
  #setClipboardData(event: ClipboardEvent, rangedData: unknown[][], rangedSourceData: unknown[][]) {
    const textPlain = stringify(rangedData);

    if (event && event.clipboardData) {
      const textHTML = _dataToHTML(rangedData);
      const textSourceDataHTML = _dataToHTML(rangedSourceData);

      event.clipboardData.setData('text/plain', textPlain);
      event.clipboardData.setData('text/html', [META_HEAD, textHTML].join(''));
      event.clipboardData.setData(SOURCE_DATA_HTML_MIME_TYPE, [META_HEAD, textSourceDataHTML].join(''));

    } else if (typeof ClipboardEvent === 'undefined') {
      (this.hot.rootWindow as unknown as IEWindow).clipboardData.setData('Text', textPlain);
    }
  }

  /**
   * Add copy and cut options to the Context Menu.
   *
   * @param {object} options Contains default added options of the Context Menu.
   */
  #onAfterContextMenuDefaultOptions = (options: { items: unknown[] }) => {
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
  };

  /**
   * Disables the viewport scroll after pasting the data.
   *
   * @param {number} fromRow Selection start row visual index.
   * @param {number} fromColumn Selection start column visual index.
   * @param {number} toRow Selection end row visual index.
   * @param {number} toColumn Selection end column visual index.
   * @param {object} preventScrolling Object with `value` property. If `true`, the viewport scroll will be prevented.
   */
  #onAfterSelection = (
    fromRow: number, fromColumn: number, toRow: number, toColumn: number,
    preventScrolling: { value: boolean }
  ) => {
    if (this.#preventViewportScrollOnPaste) {
      preventScrolling.value = true;
    }

    this.#preventViewportScrollOnPaste = false;
  };

  /**
   * Force focus on focusableElement after end of the selection.
   */
  #onAfterSelectionEnd = () => {
    if (this.isEditorOpened()) {
      return;
    }

    if (this.hot.getSettings().fragmentSelection) {
      return;
    }

    this.setCopyableText();
  };

  /**
   * `document.body` `mouseenter` callback used to work around a Safari's problem with copying/cutting from the
   * browser's menu.
   */
  #onSafariMouseEnter = () => {
    this.#removeContentEditableFromHighlightedCell();
  };

  /**
   * `document.body` `mouseleave` callback used to work around a Safari's problem with copying/cutting from the
   * browser's menu.
   */
  #onSafariMouseLeave = () => {
    this.#addContentEditableToHighlightedCell();
  };

  /**
   * `afterSelection` hook callback triggered only on Safari.
   */
  #onSafariAfterSelection = () => {
    this.#removeContentEditableFromHighlightedCell();
  };

  /**
   * Destroys the `CopyPaste` plugin instance.
   */
  destroy(): void {
    super.destroy();
  }
}
