import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { stringify } from '../../helpers/mixed';
import { throwWithCause } from '../../helpers/errors';
import { warn } from '../../helpers/console';
import { mixin } from '../../helpers/object';
import hooksRefRegisterer from '../../mixins/hooksRefRegisterer';
import {
  getScrollbarWidth,
  offset,
  hasVerticalScrollbar,
  hasHorizontalScrollbar,
  outerWidth,
  outerHeight,
} from '../../helpers/dom/element';
import { getValueGetterValue } from '../../utils/valueAccessors';

export const EDITOR_TYPE = 'base';
export const EDITOR_STATE = Object.freeze({
  VIRGIN: 'STATE_VIRGIN', // before editing
  EDITING: 'STATE_EDITING',
  WAITING: 'STATE_WAITING', // waiting for async validation
  FINISHED: 'STATE_FINISHED'
});

/**
 * @class BaseEditor
 */
export class BaseEditor {
  /**
   * Returns the unique editor type identifier for the base editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * A reference to the source instance of the Handsontable.
   *
   * @type {Handsontable}
   */
  declare hot: HotInstance;
  /**
   * Editor's state.
   *
   * @type {string}
   */
  state: string = EDITOR_STATE.VIRGIN;
  /**
   * Flag to store information about editor's opening status.
   *
   * @private
   *
   * @type {boolean}
   */
  _opened: boolean = false;
  /**
   * Defines the editor's editing mode. When false, then an editor works in fast editing mode.
   *
   * @private
   *
   * @type {boolean}
   */
  _fullEditMode: boolean = false;
  /**
   * Callback to call after closing editor.
   *
   * @type {Function}
   */
  _closeCallback: ((result: boolean) => void) | null = null;
  /**
   * Flag to specify if the editor should be closed after data change.
   *
   * @type {boolean}
   */
  _closeAfterDataChange = true;
  /**
   * Currently rendered cell's TD element.
   *
   * @type {HTMLTableCellElement}
   */
  TD: HTMLTableCellElement | null = null;
  /**
   * Visual row index.
   *
   * @type {number}
   */
  row: number | null = null;
  /**
   * Visual column index.
   *
   * @type {number}
   */
  col: number | null = null;
  /**
   * Column property name or a column index, if datasource is an array of arrays.
   *
   * @type {number|string}
   */
  prop: number | string | null = null;
  /**
   * Original cell's value.
   *
   * @type {*}
   */
  originalValue: unknown = null;
  /**
   * Object containing the cell's properties.
   *
   * @type {object}
   */
  declare cellProperties: CellProperties;

  // Mixin-injected methods from hooksRefRegisterer
  /**
   * Internal storage map for hook callbacks registered on this editor instance.
   */
  declare _hooksStorage: Record<string, Function[]>;
  /**
   * Registers a hook callback for the given hook name on this editor instance.
   */
  declare addHook: (...args: unknown[]) => unknown;
  /**
   * Removes all hook callbacks registered under the given key on this editor instance.
   */
  declare removeHooksByKey: (...args: unknown[]) => unknown;
  /**
   * Removes all hook callbacks registered on this editor instance.
   */
  declare clearHooks: (...args: unknown[]) => unknown;

  /**
   * @param {Handsontable} hotInstance A reference to the source instance of the Handsontable.
   */
  constructor(hotInstance: HotInstance) {
    this.hot = hotInstance;
    this.init();
  }

  /**
   * Fires callback after closing editor.
   *
   * @private
   * @param {boolean} result The editor value.
   */
  _fireCallbacks(result: boolean): void {
    if (this._closeCallback) {
      this._closeCallback(result);
      this._closeCallback = null;
    }
  }

  /**
   * Initializes an editor's intance.
   */
  init(): void { // intentionally empty
  }

  /**
   * Required method to get current value from editable element.
   */
  getValue(): unknown {
    throwWithCause('Editor getValue() method unimplemented');
  }

  /**
   * Required method to set new value into editable element.
   */
  setValue(_value?: unknown): void {
    throwWithCause('Editor setValue() method unimplemented');
  }

  /**
   * Required method to open editor.
   */
  open(_event?: Event): void {
    throwWithCause('Editor open() method unimplemented');
  }

  /**
   * Required method to close editor.
   */
  close(): void {
    throwWithCause('Editor close() method unimplemented');
  }

  /**
   * Required method to focus editor.
   */
  focus(): void {
    throwWithCause('Editor focus() method unimplemented');
  }

  /**
   * Prepares editor's meta data.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number|string} prop The column property (passed when datasource is an array of objects).
   * @param {HTMLTableCellElement} td The rendered cell element.
   * @param {*} value The rendered value.
   * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
   */
  prepare(
    row: number, col: number, prop: string | number,
    td: HTMLTableCellElement, value: unknown, cellProperties: CellProperties): void {
    this.TD = td;
    this.row = row;
    this.col = col;
    this.prop = prop;
    this.originalValue = value;
    this.cellProperties = cellProperties;
    this.state = this.isOpened() ? this.state : EDITOR_STATE.VIRGIN;
  }

  /**
   * Fallback method to provide extendable editors in ES5.
   *
   * @returns {Function}
   */
  extend(): unknown {
    return (class Editor extends (this.constructor as { new(...args: unknown[]): BaseEditor }) {});
  }

  /**
   * Saves value from editor into data storage.
   *
   * @param {*} value The editor value.
   * @param {boolean} ctrlDown If `true`, applies value to each cell in the last selected range.
   */
  saveValue(value: unknown, ctrlDown?: boolean): void {
    let visualRowFrom;
    let visualColumnFrom;
    let visualRowTo;
    let visualColumnTo;

    // if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
    if (ctrlDown) {
      const activeRange = this.hot.getSelectedRangeActive();
      const topStartCorner = activeRange?.getTopStartCorner();
      const bottomEndCorner = activeRange?.getBottomEndCorner();

      visualRowFrom = topStartCorner?.row ?? this.row;
      visualColumnFrom = topStartCorner?.col ?? this.col;
      visualRowTo = bottomEndCorner?.row ?? this.row;
      visualColumnTo = bottomEndCorner?.col ?? this.col;

    } else {
      [visualRowFrom, visualColumnFrom, visualRowTo, visualColumnTo] = [this.row, this.col, null, null];
    }

    const modifiedCellCoords = this.hot.runHooks('modifyGetCellCoords', visualRowFrom, visualColumnFrom, false, 'meta');

    if (Array.isArray(modifiedCellCoords)) {
      [visualRowFrom, visualColumnFrom] = modifiedCellCoords as [number, number];
    }

    // Saving values using the modified coordinates.
    this.hot.populateFromArray(
      visualRowFrom as number, visualColumnFrom as number, value as unknown[][],
      visualRowTo as number, visualColumnTo as number, 'edit');
  }

  /**
   * Begins editing on a highlighted cell and hides fillHandle corner if was present.
   *
   * @param {*} newInitialValue The initial editor value.
   * @param {Event} event The keyboard event object.
   */
  beginEditing(newInitialValue?: unknown, event?: Event): void {
    if (this.state !== EDITOR_STATE.VIRGIN) {
      return;
    }

    if (this.row === null || this.col === null) {
      warn('Editor opened without valid cell coordinates.');

      return;
    }

    const hotInstance = this.hot;
    // We have to convert visual indexes into renderable indexes
    // due to hidden columns don't participate in the rendering process
    const renderableRowIndex = hotInstance.rowIndexMapper.getRenderableFromVisualIndex(this.row);
    const renderableColumnIndex = hotInstance.columnIndexMapper.getRenderableFromVisualIndex(this.col);

    if (renderableRowIndex !== null && renderableColumnIndex !== null) {
      hotInstance.view
        .scrollViewport({ row: renderableRowIndex, col: renderableColumnIndex });
    }

    this.state = EDITOR_STATE.EDITING;

    // Set the editor value only in the full edit mode. In other mode the focusable element has to be empty,
    // otherwise IME (editor for Asia users) doesn't work.
    if (this.isInFullEditMode()) {
      const originalValue = getValueGetterValue(this.originalValue, this.hot.getCellMeta(this.row, this.col));
      const stringifiedInitialValue = typeof newInitialValue === 'string' ?
        newInitialValue : stringify(originalValue);

      this.setValue(stringifiedInitialValue);
    }

    this.open(event);
    this._opened = true;
    this.focus();

    // only rerender the selections (FillHandle should disappear when beginEditing is triggered)
    hotInstance.view.render();
    hotInstance.runHooks('afterBeginEditing', this.row, this.col);

    this.addHook('beforeDialogShow', () => this.cancelChanges());
  }

  /**
   * Finishes editing and start saving or restoring process for editing cell or last selected range.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in the last selected range.
   * @param {Function} callback The callback function, fired after editor closing.
   */
  finishEditing(restoreOriginalValue?: boolean, ctrlDown?: boolean, callback?: Function): void {
    let val: unknown;

    if (callback) {
      const previousCloseCallback = this._closeCallback;

      this._closeCallback = (result) => {
        if (previousCloseCallback) {
          previousCloseCallback(result);
        }

        callback(result);
        this.hot.view.render();
      };
    }

    if (this.isWaiting()) {
      return;
    }

    if (this.state === EDITOR_STATE.VIRGIN) {
      this.hot._registerTimeout(() => {
        this._fireCallbacks(true);
      });

      return;
    }

    if (this.state === EDITOR_STATE.EDITING) {
      if (restoreOriginalValue) {
        this.cancelChanges();
        this.hot.view.render();

        return;
      }

      let value = this.getValue();

      if (this.cellProperties.trimWhitespace) {
        value = typeof value === 'string' ? String.prototype.trim.call(value || '') : value;
      }

      if (typeof this.cellProperties.valueParser === 'function') {
        value = this.cellProperties.valueParser(value, this.cellProperties);
      }

      this.state = EDITOR_STATE.WAITING;
      this.saveValue([[value]], ctrlDown);

      if (this.hot.getCellValidator(this.cellProperties)) {
        this.hot.addHookOnce('postAfterValidate', (result: unknown) => {
          this.state = EDITOR_STATE.FINISHED;
          this.discardEditor(result as boolean);
        });
      } else {
        this.state = EDITOR_STATE.FINISHED;
        this.discardEditor(true);
      }
    }
  }

  /**
   * Finishes editing without saving value.
   */
  cancelChanges(): void {
    this.state = EDITOR_STATE.FINISHED;
    this.discardEditor();
  }

  /**
   * Verifies result of validation or closes editor if user's cancelled changes.
   *
   * @param {boolean|undefined} result If `false` and the cell using allowInvalid option,
   *                                   then an editor won't be closed until validation is passed.
   */
  discardEditor(result?: boolean): void {
    if (this.state !== EDITOR_STATE.FINISHED) {
      return;
    }

    // validator was defined and failed
    if (result === false && this.cellProperties.allowInvalid !== true) {
      if (this.row === null || this.col === null) {
        return;
      }

      this.hot.selectCell(this.row, this.col);
      this.focus();
      this.state = EDITOR_STATE.EDITING;
      this._fireCallbacks(false);

    } else {
      this.close();

      this._opened = false;
      this._fullEditMode = false;
      this.state = EDITOR_STATE.VIRGIN;
      this._fireCallbacks(true);

      const shortcutManager = this.hot.getShortcutManager();

      shortcutManager.setActiveContextName('grid');
    }
  }

  /**
   * Switch editor into full edit mode. In this state navigation keys don't close editor. This mode is activated
   * automatically after hit ENTER or F2 key on the cell or while editing cell press F2 key.
   */
  enableFullEditMode(): void {
    this._fullEditMode = true;
  }

  /**
   * Checks if editor is in full edit mode.
   *
   * @returns {boolean}
   */
  isInFullEditMode(): boolean {
    return this._fullEditMode;
  }

  /**
   * Returns information whether the editor is open.
   *
   * @returns {boolean}
   */
  isOpened(): boolean {
    return this._opened;
  }

  /**
   * Refreshes the editor's value from the source data. Overridden in editors that support it.
   */
  refreshValue?(): void;

  /**
   * Returns information whether the editor is waiting, eg.: for async validation.
   *
   * @returns {boolean}
   */
  isWaiting(): boolean {
    return this.state === EDITOR_STATE.WAITING;
  }

  /**
   * Gets the object that provides information about the edited cell size and its position
   * relative to the table viewport.
   *
   * The rectangle has six integer properties:
   *  - `top` The top position relative to the table viewport
   *  - `start` The left (or right in RTL) position relative to the table viewport
   *  - `width` The cell's current width;
   *  - `maxWidth` The maximum cell's width after which the editor goes out of the table viewport
   *  - `height` The cell's current height;
   *  - `maxHeight` The maximum cell's height after which the editor goes out of the table viewport
   *
   * @returns {{top: number, start: number, width: number, maxWidth: number, height: number, maxHeight: number} | undefined}
   */
  getEditedCellRect(): {
    top: number, start: number, width: number, maxWidth: number, height: number, maxHeight: number
  } | undefined {
    const TD = this.getEditedCell();

    // TD is outside of the viewport.
    if (!TD) {
      return;
    }

    const { wtOverlays, wtViewport } = this.hot.view._wt;
    const rootWindow = this.hot.rootWindow;
    const currentOffset = offset(TD);
    const cellWidth = outerWidth(TD);
    const containerOffset = offset(this.hot.rootElement);
    const containerWidth = outerWidth(this.hot.rootElement);
    const scrollableContainerTop = wtOverlays.topOverlay?.holder;
    const scrollableContainerLeft = wtOverlays.inlineStartOverlay?.holder;
    const containerScrollTop = scrollableContainerTop !== rootWindow ?
      (scrollableContainerTop as HTMLElement).scrollTop : 0;
    const containerScrollLeft = scrollableContainerLeft !== rootWindow ?
      (scrollableContainerLeft as HTMLElement).scrollLeft : 0;
    const gridMostRightPos = rootWindow.innerWidth - containerOffset.left - containerWidth;
    const { wtTable: overlayTable } = wtOverlays.getParentOverlay(TD) ?? this.hot.view._wt;
    const overlayName = overlayTable.name;

    const scrollTop = ['master', 'inline_start'].includes(overlayName) ? containerScrollTop : 0;
    const scrollLeft = ['master', 'top', 'bottom'].includes(overlayName) ? containerScrollLeft : 0;

    // If colHeaders is disabled, cells in the first row have border-top
    const editTopModifier = currentOffset.top === containerOffset.top ? 0 : 1;

    let topPos = currentOffset.top - containerOffset.top - editTopModifier - scrollTop;
    let inlineStartPos = 0;

    if (this.hot.isRtl()) {
      inlineStartPos = rootWindow.innerWidth - currentOffset.left - cellWidth - gridMostRightPos - 1 + scrollLeft;
    } else {
      inlineStartPos = currentOffset.left - containerOffset.left - 1 - scrollLeft;
    }

    // When the scrollable element is Window object then the editor position needs to be compensated
    // by the overlays' position (position relative to the table viewport). In other cases, the overlay's
    // position always returns 0.
    if (['top', 'top_inline_start_corner'].includes(overlayName)) {
      topPos += wtOverlays.topOverlay?.getOverlayOffset() ?? 0;
    }

    if (['inline_start', 'top_inline_start_corner'].includes(overlayName)) {
      inlineStartPos += Math.abs(wtOverlays.inlineStartOverlay?.getOverlayOffset() ?? 0);
    }

    const hasColumnHeaders = this.hot.hasColHeaders();
    const renderableRow = this.hot.rowIndexMapper.getRenderableFromVisualIndex(this.row ?? 0);
    const renderableColumn = this.hot.columnIndexMapper.getRenderableFromVisualIndex(this.col ?? 0);
    const nrOfRenderableRowIndexes = this.hot.rowIndexMapper.getRenderableIndexesLength();
    const firstRowIndexOfTheBottomOverlay =
      nrOfRenderableRowIndexes - (this.hot.view._wt.getSetting('fixedRowsBottom') as number);

    if (hasColumnHeaders && (renderableRow ?? 0) <= 0 || renderableRow === firstRowIndexOfTheBottomOverlay) {
      topPos += 1;
    }

    if ((renderableColumn ?? 0) <= 0) {
      inlineStartPos += 1;
    }

    const firstRowOffset = wtViewport.rowsRenderCalculator?.startPosition ?? 0;
    const firstColumnOffset = wtViewport.columnsRenderCalculator?.startPosition ?? 0;
    const horizontalScrollPosition = Math.abs(wtOverlays.inlineStartOverlay?.getScrollPosition() ?? 0);
    const verticalScrollPosition = wtOverlays.topOverlay?.getScrollPosition() ?? 0;
    const scrollbarWidth = getScrollbarWidth(this.hot.rootDocument);
    const cellTopOffset = this.#calcCellTopOffset(TD, overlayName, firstRowOffset,
      verticalScrollPosition, scrollbarWidth);
    const cellStartOffset = this.#calcCellStartOffset(TD, overlayName, overlayTable, cellWidth,
      firstColumnOffset, horizontalScrollPosition);

    const cellComputedStyle = rootWindow.getComputedStyle(TD);
    const borderPhysicalWidthProp = this.hot.isRtl() ? 'borderRightWidth' : 'borderLeftWidth';
    const inlineStartBorderCompensation = Number.parseInt(cellComputedStyle[borderPhysicalWidthProp], 10) > 0 ? 0 : 1;
    const topBorderCompensation = Number.parseInt(cellComputedStyle.borderTopWidth, 10) > 0 ? 0 : 1;
    const width = outerWidth(TD) + inlineStartBorderCompensation;
    const height = outerHeight(TD) + topBorderCompensation;
    const actualVerticalScrollbarWidth = scrollableContainerTop &&
      hasVerticalScrollbar(scrollableContainerTop) ? scrollbarWidth : 0;
    const actualHorizontalScrollbarWidth = scrollableContainerLeft &&
      hasHorizontalScrollbar(scrollableContainerLeft) ? scrollbarWidth : 0;
    const maxWidth = this.hot.view.maximumVisibleElementWidth(cellStartOffset) -
      actualVerticalScrollbarWidth + inlineStartBorderCompensation;
    const maxHeight = Math.max(this.hot.view.maximumVisibleElementHeight(cellTopOffset ?? 0) -
      actualHorizontalScrollbarWidth + topBorderCompensation, this.hot.stylesHandler.getDefaultRowHeight() ?? 0);

    return {
      top: topPos,
      start: inlineStartPos,
      height,
      maxHeight,
      width,
      maxWidth,
    };
  }

  /**
   * Calculates the top offset of the edited cell within the overlay's coordinate space.
   *
   * @param {HTMLTableCellElement} TD The edited cell element.
   * @param {string} overlayName The name of the overlay containing the cell.
   * @param {number} firstRowOffset The start position of the rows render calculator.
   * @param {number} verticalScrollPosition The current vertical scroll position.
   * @param {number} scrollbarWidth The scrollbar width in pixels.
   * @returns {number}
   */
  #calcCellTopOffset(
    TD: HTMLTableCellElement, overlayName: string,
    firstRowOffset: number, verticalScrollPosition: number, scrollbarWidth: number
  ): number {
    let cellTopOffset = TD.offsetTop;
    const { wtOverlays } = this.hot.view._wt;

    if (['inline_start', 'master'].includes(overlayName)) {
      cellTopOffset += firstRowOffset - verticalScrollPosition;
    }

    if (['bottom', 'bottom_inline_start_corner'].includes(overlayName) && wtOverlays.bottomOverlay?.clone) {
      const {
        wtViewport: bottomWtViewport,
        wtTable: bottomWtTable,
      } = wtOverlays.bottomOverlay!.clone!;

      cellTopOffset += bottomWtViewport.getWorkspaceHeight() - bottomWtTable.getHeight() - scrollbarWidth;
    }

    return cellTopOffset;
  }

  /**
   * Calculates the inline-start offset of the edited cell within the overlay's coordinate space.
   *
   * @param {HTMLTableCellElement} TD The edited cell element.
   * @param {string} overlayName The name of the overlay containing the cell.
   * @param {object} overlayTable The Walkontable table instance for the overlay.
   * @param {number} cellWidth The width of the edited cell.
   * @param {number} firstColumnOffset The start position of the columns render calculator.
   * @param {number} horizontalScrollPosition The current horizontal scroll position.
   * @returns {number}
   */
  #calcCellStartOffset(
    TD: HTMLTableCellElement, overlayName: string, overlayTable: { getWidth(): number },
    cellWidth: number, firstColumnOffset: number, horizontalScrollPosition: number
  ): number {
    let cellStartOffset = TD.offsetLeft;

    if (this.hot.isRtl()) {
      if (cellStartOffset >= 0) {
        cellStartOffset = overlayTable.getWidth() - TD.offsetLeft;
      } else {
        // The `offsetLeft` returns negative values when the parent offset element has position relative
        // (it happens when on the cell the selection is applied - the `area` CSS class).
        // When it happens the `offsetLeft` value is calculated from the right edge of the parent element.
        cellStartOffset = Math.abs(cellStartOffset);
      }

      cellStartOffset += firstColumnOffset - horizontalScrollPosition - cellWidth;

    } else if (['top', 'master', 'bottom'].includes(overlayName)) {
      cellStartOffset += firstColumnOffset - horizontalScrollPosition;
    }

    return cellStartOffset;
  }

  /**
   * Gets className of the edited cell if exist.
   *
   * @returns {string}
   */
  getEditedCellsLayerClass(): string {
    const editorSection = this.checkEditorSection();

    switch (editorSection) {
      case 'inline-start':
        return 'ht_clone_left ht_clone_inline_start';
      case 'bottom':
        return 'ht_clone_bottom';
      case 'bottom-inline-start-corner':
        return 'ht_clone_bottom_left_corner ht_clone_bottom_inline_start_corner';
      case 'top':
        return 'ht_clone_top';
      case 'top-inline-start-corner':
        return 'ht_clone_top_left_corner ht_clone_top_inline_start_corner';
      default:
        return 'ht_clone_master';
    }
  }

  /**
   * Gets HTMLTableCellElement of the edited cell if exist.
   *
   * @returns {HTMLTableCellElement|null}
   */
  getEditedCell(): HTMLTableCellElement | null {
    if (this.row === null || this.col === null) {
      return null;
    }

    return this.hot.getCell(this.row, this.col, true);
  }

  /**
   * Returns name of the overlay, where editor is placed.
   *
   * @private
   * @returns {string}
   */
  checkEditorSection(): string {
    if (this.row === null || this.col === null) {
      return '';
    }

    const totalRows = this.hot.countRows();
    const settings = this.hot.getSettings();
    let section = '';

    if (this.row < (settings.fixedRowsTop ?? 0)) {
      if (this.col < (settings.fixedColumnsStart ?? 0)) {
        section = 'top-inline-start-corner';
      } else {
        section = 'top';
      }
    } else if (settings.fixedRowsBottom &&
               this.row >= totalRows - settings.fixedRowsBottom) {
      if (this.col < (settings.fixedColumnsStart ?? 0)) {
        section = 'bottom-inline-start-corner';
      } else {
        section = 'bottom';
      }
    } else if (this.col < (settings.fixedColumnsStart ?? 0)) {
      section = 'inline-start';
    }

    return section;
  }
}

mixin(BaseEditor, hooksRefRegisterer);
