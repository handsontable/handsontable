import { BasePlugin } from '../base';
import Hooks from '../../pluginHooks';
import { stringify } from '../../3rdparty/SheetClip';
import { sanitize } from '../../helpers/string';
import {
  removeContentEditableFromElementAndDeselect,
  runWithSelectedContendEditableElement,
  makeElementContentEditableAndSelectItsContent
} from '../../helpers/dom/element';
import { isSafari } from '../../helpers/browser';
import copyItem from './contextMenuItem/copy';
import copyColumnHeadersOnlyItem from './contextMenuItem/copyColumnHeadersOnly';
import copyWithColumnGroupHeadersItem from './contextMenuItem/copyWithColumnGroupHeaders';
import copyWithColumnHeadersItem from './contextMenuItem/copyWithColumnHeaders';
import cutItem from './contextMenuItem/cut';
import {
  CopyableRangesFactory,
} from './copyableRanges';
import { transformRangeLikeToIndexes } from '../../selection';
import {
  getDataByCoords, getHTMLFromConfig,
} from '../../utils/parseTable';
import EventManager from '../../eventManager';

import './copyPaste.css';
import { CopyClipboardData, PasteClipboardData, META_HEAD } from './clipboardData';

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

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @description
 * Copy, cut, and paste data by using the `CopyPaste` plugin.
 *
 * Control the `CopyPaste` plugin programmatically through its [API methods](#methods).
 *
 * The user can access the copy-paste features through:
 * - The [context menu](@/guides/cell-features/clipboard.md#context-menu).
 * - The [keyboard shortcuts](@/guides/cell-features/clipboard.md#related-keyboard-shortcuts).
 * - The browser's menu bar.
 *
 * Read more:
 * - [Guides: Clipboard](@/guides/cell-features/clipboard.md)
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
   * - `'overwrite'`: overwrite the currently-selected cells
   * - `'shift_down'`: move currently-selected cells down
   * - `'shift_right'`: move currently-selected cells to the right
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
    const { [PLUGIN_KEY]: settings } = this.hot.getSettings();

    if (typeof settings === 'object') {
      this.pasteMode = settings.pasteMode ?? this.pasteMode;
      this.rowsLimit = isNaN(settings.rowsLimit) ? this.rowsLimit : settings.rowsLimit;
      this.columnsLimit = isNaN(settings.columnsLimit) ? this.columnsLimit : settings.columnsLimit;
      this.#enableCopyColumnHeaders = !!settings.copyColumnHeaders;
      this.#enableCopyColumnGroupHeaders = !!settings.copyColumnGroupHeaders;
      this.#enableCopyColumnHeadersOnly = !!settings.copyColumnHeadersOnly;
      this.uiContainer = settings.uiContainer ?? this.uiContainer;
    }

    this.addHook('afterContextMenuDefaultOptions', options => this.#onAfterContextMenuDefaultOptions(options));
    this.addHook('afterSelectionEnd', () => this.#onAfterSelectionEnd());

    this.eventManager = new EventManager(this);

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
   * @returns {Array[]} An array of arrays that will be copied to the clipboard.
   */
  getRangedData(ranges) {
    const { rows, columns } = transformRangeLikeToIndexes(ranges);

    return getDataByCoords(this.hot, { rows, columns });
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

    const pasteData = {
      clipboardData: {
        data: {},
        setData(type, value) {
          this.data[type] = value;
        },
        getData(type) {
          return this.data[type];
        }
      }
    };

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
    const selectionRange = this.hot.getSelectedRangeLast();

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
      const lastSelectedRange = this.hot.getSelectedRangeLast();

      if (lastSelectedRange) {
        const { row: highlightRow, col: highlightColumn } = lastSelectedRange.highlight;
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
   * Prepares new values to populate them into datasource.
   *
   * @private
   * @param {Array} inputArray An array of the data to populate.
   * @param {Array} [selection] The selection which indicates from what position the data will be populated.
   * @returns {Array} Range coordinates after populate data.
   */
  populateValues(inputArray, selection = this.hot.getSelectedRangeLast()) {
    if (!inputArray.length) {
      return;
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
        const { skipColumnOnPaste, visualCol } = this.hot.getCellMeta(startRow, visualColumnForPopulatedData);

        visualColumnForPopulatedData = visualCol + 1;

        if (skipColumnOnPaste === true) {
          /* eslint-disable no-continue */
          continue;
        }

        lastVisualColumn = visualCol;
        const insertedColumn = newRow.length % populatedColumnsLength;

        newRow.push(inputArray[insertedRow][insertedColumn]);
      }

      newRows.push(newRow);
    }

    this.hot.populateFromArray(startRow, startColumn, newRows, undefined, undefined, 'CopyPaste.paste', this.pasteMode);

    return [startRow, startColumn, lastVisualRow, lastVisualColumn];
  }

  /**
   * Add the `contenteditable` attribute to the highlighted cell and select its content.
   */
  #addContentEditableToHighlightedCell() {
    if (this.hot.isListening()) {
      const lastSelectedRange = this.hot.getSelectedRangeLast();

      if (lastSelectedRange) {
        const { row: highlightRow, col: highlightColumn } = lastSelectedRange.highlight;
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
      const lastSelectedRange = this.hot.getSelectedRangeLast();

      if (lastSelectedRange) {
        const { row: highlightRow, col: highlightColumn } = lastSelectedRange.highlight;
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
    if ((!this.hot.isListening() && !this.#isTriggeredByCopy) || this.isEditorOpened()) {
      return;
    }

    this.setCopyableText();
    this.#isTriggeredByCopy = false;

    const copyClipboardData = new CopyClipboardData(this.hot, this.copyableRanges);
    const allowCopying = !!this.hot.runHooks('beforeCopy', copyClipboardData);

    if (allowCopying) {
      event.clipboardData.setData('text/plain', stringify(copyClipboardData.getData()));
      event.clipboardData.setData('text/html', [copyClipboardData.getType() === 'handsontable' ? META_HEAD : '',
        getHTMLFromConfig(copyClipboardData.getMetaInfo())].join(''));

      this.hot.runHooks('afterCopy', copyClipboardData);
    }

    this.#copyMode = 'cells-only';
    event.preventDefault();
  }

  /**
   * `cut` event callback on textarea element.
   *
   * @param {Event} event ClipboardEvent.
   * @private
   */
  onCut(event) {
    if ((!this.hot.isListening() && !this.#isTriggeredByCut) || this.isEditorOpened()) {
      return;
    }

    this.setCopyableText();
    this.#isTriggeredByCut = false;

    const copyClipboardData = new CopyClipboardData(this.hot, this.copyableRanges);
    const allowCuttingOut = !!this.hot.runHooks('beforeCut', copyClipboardData);

    if (allowCuttingOut) {
      event.clipboardData.setData('text/plain', stringify(copyClipboardData.getData()));
      event.clipboardData.setData('text/html', [copyClipboardData.getType() === 'handsontable' ? META_HEAD : '',
        getHTMLFromConfig(copyClipboardData.getMetaInfo())].join(''));

      this.hot.emptySelectedCells('CopyPaste.cut');
      this.hot.runHooks('afterCut', copyClipboardData);
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
    if (!this.hot.isListening() || this.isEditorOpened() || !this.hot.getSelected()) {
      return;
    }

    if (event && event.preventDefault) {
      event.preventDefault();
    }

    const html = sanitize(event.clipboardData.getData('text/html'), {
      ADD_TAGS: ['meta'],
      ADD_ATTR: ['content'],
      FORCE_BODY: true,
    });

    const pasteClipboardData = new PasteClipboardData(event.clipboardData.getData('text/plain'), html);

    if (this.hot.runHooks('beforePaste', pasteClipboardData) === false) {
      return;
    }

    const pastedTable = pasteClipboardData.getData();

    if (pastedTable.length === 0) {
      return;
    }

    const [startRow, startColumn, endRow, endColumn] = this.populateValues(pastedTable);

    this.hot.selectCell(
      startRow,
      startColumn,
      Math.min(this.hot.countRows() - 1, endRow),
      Math.min(this.hot.countCols() - 1, endColumn),
    );

    this.hot.runHooks('afterPaste', pasteClipboardData);
  }

  /**
   * Add copy and cut options to the Context Menu.
   *
   * @private
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
   *
   * @private
   */
  #onSafariMouseEnter() {
    this.#removeContentEditableFromHighlightedCell();
  }

  /**
   * `document.body` `mouseleave` callback used to work around a Safari's problem with copying/cutting from the
   * browser's menu.
   *
   * @private
   */
  #onSafariMouseLeave() {
    this.#addContentEditableToHighlightedCell();
  }

  /**
   * `afterSelection` hook callback triggered only on Safari.
   *
   * @private
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
