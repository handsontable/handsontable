import { stringify } from '../../helpers/mixed';
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
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * A reference to the source instance of the Handsontable.
   *
   * @type {Handsontable}
   */
  hot;
  /**
   * Editor's state.
   *
   * @type {string}
   */
  state = EDITOR_STATE.VIRGIN;
  /**
   * Flag to store information about editor's opening status.
   *
   * @private
   *
   * @type {boolean}
   */
  _opened = false;
  /**
   * Defines the editor's editing mode. When false, then an editor works in fast editing mode.
   *
   * @private
   *
   * @type {boolean}
   */
  _fullEditMode = false;
  /**
   * Callback to call after closing editor.
   *
   * @type {Function}
   */
  _closeCallback = null;
  /**
   * Currently rendered cell's TD element.
   *
   * @type {HTMLTableCellElement}
   */
  TD = null;
  /**
   * Visual row index.
   *
   * @type {number}
   */
  row = null;
  /**
   * Visual column index.
   *
   * @type {number}
   */
  col = null;
  /**
   * Column property name or a column index, if datasource is an array of arrays.
   *
   * @type {number|string}
   */
  prop = null;
  /**
   * Original cell's value.
   *
   * @type {*}
   */
  originalValue = null;
  /**
   * Object containing the cell's properties.
   *
   * @type {object}
   */
  cellProperties = null;

  /**
   * @param {Handsontable} hotInstance A reference to the source instance of the Handsontable.
   */
  constructor(hotInstance) {
    this.hot = hotInstance;
    this.init();
  }

  /**
   * Fires callback after closing editor.
   *
   * @private
   * @param {boolean} result The editor value.
   */
  _fireCallbacks(result) {
    if (this._closeCallback) {
      this._closeCallback(result);
      this._closeCallback = null;
    }
  }

  /**
   * Initializes an editor's intance.
   */
  init() {}

  /**
   * Required method to get current value from editable element.
   */
  getValue() {
    throw Error('Editor getValue() method unimplemented');
  }

  /**
   * Required method to set new value into editable element.
   */
  setValue() {
    throw Error('Editor setValue() method unimplemented');
  }

  /**
   * Required method to open editor.
   */
  open() {
    throw Error('Editor open() method unimplemented');
  }

  /**
   * Required method to close editor.
   */
  close() {
    throw Error('Editor close() method unimplemented');
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
  prepare(row, col, prop, td, value, cellProperties) {
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
  extend() {
    return (class Editor extends this.constructor {});
  }

  /**
   * Saves value from editor into data storage.
   *
   * @param {*} value The editor value.
   * @param {boolean} ctrlDown If `true`, applies value to each cell in the last selected range.
   */
  saveValue(value, ctrlDown) {
    let visualRowFrom;
    let visualColumnFrom;
    let visualRowTo;
    let visualColumnTo;

    // if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
    if (ctrlDown) {
      const selectedLast = this.hot.getSelectedLast();

      visualRowFrom = Math.max(Math.min(selectedLast[0], selectedLast[2]), 0); // Math.max eliminate headers coords.
      visualColumnFrom = Math.max(Math.min(selectedLast[1], selectedLast[3]), 0); // Math.max eliminate headers coords.
      visualRowTo = Math.max(selectedLast[0], selectedLast[2]);
      visualColumnTo = Math.max(selectedLast[1], selectedLast[3]);

    } else {
      [visualRowFrom, visualColumnFrom, visualRowTo, visualColumnTo] = [this.row, this.col, null, null];
    }

    const modifiedCellCoords = this.hot
      .runHooks('modifyGetCellCoords', visualRowFrom, visualColumnFrom, false, 'meta');

    if (Array.isArray(modifiedCellCoords)) {
      [visualRowFrom, visualColumnFrom] = modifiedCellCoords;
    }

    // Saving values using the modified coordinates.
    this.hot.populateFromArray(visualRowFrom, visualColumnFrom, value, visualRowTo, visualColumnTo, 'edit');
  }

  /**
   * Begins editing on a highlighted cell and hides fillHandle corner if was present.
   *
   * @param {*} newInitialValue The initial editor value.
   * @param {Event} event The keyboard event object.
   */
  beginEditing(newInitialValue, event) {
    if (this.state !== EDITOR_STATE.VIRGIN) {
      return;
    }

    const hotInstance = this.hot;
    // We have to convert visual indexes into renderable indexes
    // due to hidden columns don't participate in the rendering process
    const renderableRowIndex = hotInstance.rowIndexMapper.getRenderableFromVisualIndex(this.row);
    const renderableColumnIndex = hotInstance.columnIndexMapper.getRenderableFromVisualIndex(this.col);

    const openEditor = () => {
      this.state = EDITOR_STATE.EDITING;

      // Set the editor value only in the full edit mode. In other mode the focusable element has to be empty,
      // otherwise IME (editor for Asia users) doesn't work.
      if (this.isInFullEditMode()) {
        const stringifiedInitialValue = typeof newInitialValue === 'string' ?
          newInitialValue : stringify(this.originalValue);

        this.setValue(stringifiedInitialValue);
      }

      this.open(event);
      this._opened = true;
      this.focus();

      // only rerender the selections (FillHandle should disappear when beginEditing is triggered)
      hotInstance.view.render();
      hotInstance.runHooks('afterBeginEditing', this.row, this.col);
    };

    this.hot.addHookOnce('afterScroll', openEditor);

    const wasScroll = hotInstance.view
      .scrollViewport(hotInstance._createCellCoords(renderableRowIndex, renderableColumnIndex));

    if (!wasScroll) {
      this.hot.removeHook('afterScroll', openEditor);
      openEditor();
    }
  }

  /**
   * Finishes editing and start saving or restoring process for editing cell or last selected range.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in the last selected range.
   * @param {Function} callback The callback function, fired after editor closing.
   */
  finishEditing(restoreOriginalValue, ctrlDown, callback) {
    let val;

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

      const value = this.getValue();

      if (this.cellProperties.trimWhitespace) {
        // We trim only string values
        val = [
          [typeof value === 'string' ? String.prototype.trim.call(value || '') : value]
        ];
      } else {
        val = [
          [value]
        ];
      }

      this.state = EDITOR_STATE.WAITING;
      this.saveValue(val, ctrlDown);

      if (this.hot.getCellValidator(this.cellProperties)) {
        this.hot.addHookOnce('postAfterValidate', (result) => {
          this.state = EDITOR_STATE.FINISHED;
          this.discardEditor(result);
        });
      } else {
        this.state = EDITOR_STATE.FINISHED;
        this.discardEditor(true);
      }
    }
  }

  /**
   * Finishes editing without singout saving value.
   */
  cancelChanges() {
    this.state = EDITOR_STATE.FINISHED;
    this.discardEditor();
  }

  /**
   * Verifies result of validation or closes editor if user's cancelled changes.
   *
   * @param {boolean|undefined} result If `false` and the cell using allowInvalid option,
   *                                   then an editor won't be closed until validation is passed.
   */
  discardEditor(result) {
    if (this.state !== EDITOR_STATE.FINISHED) {
      return;
    }

    // validator was defined and failed
    if (result === false && this.cellProperties.allowInvalid !== true) {
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
  enableFullEditMode() {
    this._fullEditMode = true;
  }

  /**
   * Checks if editor is in full edit mode.
   *
   * @returns {boolean}
   */
  isInFullEditMode() {
    return this._fullEditMode;
  }

  /**
   * Returns information whether the editor is open.
   *
   * @returns {boolean}
   */
  isOpened() {
    return this._opened;
  }

  /**
   * Returns information whether the editor is waiting, eg.: for async validation.
   *
   * @returns {boolean}
   */
  isWaiting() {
    return this.state === EDITOR_STATE.WAITING;
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
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
  getEditedCellRect() {
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
    const scrollableContainerTop = wtOverlays.topOverlay.holder;
    const scrollableContainerLeft = wtOverlays.inlineStartOverlay.holder;
    const containerScrollTop = scrollableContainerTop !== rootWindow ?
      scrollableContainerTop.scrollTop : 0;
    const containerScrollLeft = scrollableContainerLeft !== rootWindow ?
      scrollableContainerLeft.scrollLeft : 0;
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
      topPos += wtOverlays.topOverlay.getOverlayOffset();
    }

    if (['inline_start', 'top_inline_start_corner'].includes(overlayName)) {
      inlineStartPos += Math.abs(wtOverlays.inlineStartOverlay.getOverlayOffset());
    }

    const hasColumnHeaders = this.hot.hasColHeaders();
    const renderableRow = this.hot.rowIndexMapper.getRenderableFromVisualIndex(this.row);
    const renderableColumn = this.hot.columnIndexMapper.getRenderableFromVisualIndex(this.col);
    const nrOfRenderableRowIndexes = this.hot.rowIndexMapper.getRenderableIndexesLength();
    const firstRowIndexOfTheBottomOverlay = nrOfRenderableRowIndexes - this.hot.view._wt.getSetting('fixedRowsBottom');

    if (hasColumnHeaders && renderableRow <= 0 || renderableRow === firstRowIndexOfTheBottomOverlay) {
      topPos += 1;
    }

    if (renderableColumn <= 0) {
      inlineStartPos += 1;
    }

    const firstRowOffset = wtViewport.rowsRenderCalculator.startPosition;
    const firstColumnOffset = wtViewport.columnsRenderCalculator.startPosition;
    const horizontalScrollPosition = Math.abs(wtOverlays.inlineStartOverlay.getScrollPosition());
    const verticalScrollPosition = wtOverlays.topOverlay.getScrollPosition();
    const scrollbarWidth = getScrollbarWidth(this.hot.rootDocument);
    let cellTopOffset = TD.offsetTop;

    if (['inline_start', 'master'].includes(overlayName)) {
      cellTopOffset += firstRowOffset - verticalScrollPosition;
    }

    if (['bottom', 'bottom_inline_start_corner'].includes(overlayName)) {
      const {
        wtViewport: bottomWtViewport,
        wtTable: bottomWtTable,
      } = wtOverlays.bottomOverlay.clone;

      cellTopOffset += bottomWtViewport.getWorkspaceHeight() - bottomWtTable.getHeight() - scrollbarWidth;
    }

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

    const cellComputedStyle = rootWindow.getComputedStyle(this.TD);
    const borderPhysicalWidthProp = this.hot.isRtl() ? 'borderRightWidth' : 'borderLeftWidth';
    const inlineStartBorderCompensation = parseInt(cellComputedStyle[borderPhysicalWidthProp], 10) > 0 ? 0 : 1;
    const topBorderCompensation = parseInt(cellComputedStyle.borderTopWidth, 10) > 0 ? 0 : 1;
    const width = outerWidth(TD) + inlineStartBorderCompensation;
    const height = outerHeight(TD) + topBorderCompensation;
    const actualVerticalScrollbarWidth = hasVerticalScrollbar(scrollableContainerTop) ? scrollbarWidth : 0;
    const actualHorizontalScrollbarWidth = hasHorizontalScrollbar(scrollableContainerLeft) ? scrollbarWidth : 0;
    const maxWidth = this.hot.view.maximumVisibleElementWidth(cellStartOffset) -
      actualVerticalScrollbarWidth + inlineStartBorderCompensation;
    const maxHeight = Math.max(this.hot.view.maximumVisibleElementHeight(cellTopOffset) -
      actualHorizontalScrollbarWidth + topBorderCompensation, this.hot.view.getDefaultRowHeight());

    return {
      top: topPos,
      start: inlineStartPos,
      height,
      maxHeight,
      width,
      maxWidth,
    };
  }
  /* eslint-enable jsdoc/require-description-complete-sentence */

  /**
   * Gets className of the edited cell if exist.
   *
   * @returns {string}
   */
  getEditedCellsLayerClass() {
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
  getEditedCell() {
    return this.hot.getCell(this.row, this.col, true);
  }

  /**
   * Returns name of the overlay, where editor is placed.
   *
   * @private
   * @returns {string}
   */
  checkEditorSection() {
    const totalRows = this.hot.countRows();
    let section = '';

    if (this.row < this.hot.getSettings().fixedRowsTop) {
      if (this.col < this.hot.getSettings().fixedColumnsStart) {
        section = 'top-inline-start-corner';
      } else {
        section = 'top';
      }
    } else if (this.hot.getSettings().fixedRowsBottom &&
               this.row >= totalRows - this.hot.getSettings().fixedRowsBottom) {
      if (this.col < this.hot.getSettings().fixedColumnsStart) {
        section = 'bottom-inline-start-corner';
      } else {
        section = 'bottom';
      }
    } else if (this.col < this.hot.getSettings().fixedColumnsStart) {
      section = 'inline-start';
    }

    return section;
  }
}

mixin(BaseEditor, hooksRefRegisterer);
