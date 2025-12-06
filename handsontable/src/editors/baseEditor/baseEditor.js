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
      const activeRange = this.hot.getSelectedRangeActive();
      const topStartCorner = activeRange.getTopStartCorner();
      const bottomEndCorner = activeRange.getBottomEndCorner();

      visualRowFrom = topStartCorner.row;
      visualColumnFrom = topStartCorner.col;
      visualRowTo = bottomEndCorner.row;
      visualColumnTo = bottomEndCorner.col;

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
        const originalValue =
          this.cellProperties.valueGetter ? this.cellProperties.valueGetter(this.originalValue) : this.originalValue;
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
    };

    this.hot.addHookOnce('afterScroll', openEditor);

    const wasScroll = hotInstance.view
      .scrollViewport(hotInstance._createCellCoords(renderableRowIndex, renderableColumnIndex));

    if (!wasScroll) {
      this.hot.removeHook('afterScroll', openEditor);
      openEditor();
    }

    this.addHook('beforeDialogShow', () => this.cancelChanges());
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
      actualHorizontalScrollbarWidth + topBorderCompensation, this.hot.stylesHandler.getDefaultRowHeight());

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

/** .........
 * Factory function for creating custom Handsontable editors by extending BaseEditor.
 *
 * This factory allows you to create custom editors by providing implementations for various
 * editor lifecycle methods. It handles the prototype chain setup and method delegation to
 * the BaseEditor superclass automatically.
 *
 * @param {object} params - Configuration object containing editor lifecycle methods and custom methods.
 * @param {Function} params.prepare - Called before editing begins to initialize the editor.
 * @param {Function} params.beginEditing - Called when editing starts.
 * @param {Function} params.finishEditing - Called when editing ends.
 * @param {Function} params.discardEditor - Called to discard editor changes.
 * @param {Function} params.saveValue - Called to save the edited value.
 * @param {Function} params.getValue - Called to retrieve the current editor value.
 * @param {Function} params.setValue - Called to set the editor value.
 * @param {Function} params.open - Called to open/show the editor UI.
 * @param {Function} params.close - Called to close/hide the editor UI.
 * @param {Function} params.focus - Called to focus the editor.
 * @param {Function} params.cancelChanges - Called to cancel editing changes.
 * @param {Function} params.checkEditorSection - Called to determine which section the editor belongs to.
 * @param {Function} params.enableFullEditMode - Called to enable full edit mode.
 * @param {Function} params.extend - Called to extend the editor class.
 * @param {Function} params.getEditedCell - Called to get the currently edited cell element.
 * @param {Function} params.getEditedCellRect - Called to get the edited cell's position and dimensions.
 * @param {Function} params.getEditedCellsZIndex - Called to get the z-index for the edited cell.
 * @param {Function} params.init - Called during editor initialization.
 * @param {Function} params.isInFullEditMode - Called to check if editor is in full edit mode.
 * @param {Function} params.isOpened - Called to check if editor is currently open.
 * @param {Function} params.isWaiting - Called to check if editor is waiting for input.
 *
 * @returns {Function} A custom editor class extending Handsontable's BaseEditor.
 *
 * @example
 * ```typescript
 * const MyEditor = editorBaseFactory({
 *   prepare(editor, row, col, prop, td, originalValue, cellProperties) {
 *     // Initialize your editor
 *   },
 *   open(editor) {
 *     // Show your editor UI
 *   },
 *   close(editor) {
 *     // Hide your editor UI
 *   },
 *   getValue(editor) {
 *     return editor.customValue;
 *   }
 * });
 * ```
 */
const editorBaseFactory = (params) => {
  const CustomBaseEditor = BaseEditor.prototype.extend();
  // Skip super in abstract funtions
  const skipSuperApply = [
    'close',
    'focus',
    'getValue',
    'open',
    'setValue',
  ];
  const prototypeFns = Object.getOwnPropertyNames(BaseEditor.prototype);

  // Apply editor class methods from params object
  prototypeFns.forEach((fnName) => {
    if (params[fnName]) {
      const superFn = CustomBaseEditor.prototype[fnName];

      CustomBaseEditor.prototype[fnName] = function(...args) {
        if (!skipSuperApply.includes(fnName)) {
          superFn.apply(this, args);
        }

        return params[fnName](this, ...args);
      };
    }
  });
  // Apply custom methods
  Object.keys(params).forEach((fnName) => {
    if (!prototypeFns.includes(fnName)) {
      CustomBaseEditor.prototype[fnName] = function(...args) {
        // `this` will be BaseEditor & T, as expected for custom methods.
        return params[fnName](this, ...args);
      };
    }
  });

  return CustomBaseEditor;
};

/** ............................
 * Factory function to create a custom Handsontable editor.
 *
 * `editorFactory` helps you create modular, reusable, and fully custom editors
 * for Handsontable grid cells. The factory handles lifecycle, DOM structure, and
 * keyboard shortcuts, allowing you to focus on business-specific UI and value logic.
 *
 * @param {object} options - Configuration and lifecycle methods for the editor.
 * @param {Function} options.init - Called when this editor is constructed by the Handsontable grid.
 * @param {Function} options.afterOpen - Called after the editor is opened and made visible.
 * @param {Function} options.afterInit - Called immediately after init, useful for event binding, etc.
 * @param {Function} options.afterClose - Called when the editor is closed and made invisible.
 * @param {Function} options.beforeOpen - Called before the editor is opened so you can set its value/state.
 * @param {Function} options.getValue - Called to retrieve the current editor value.
 * @param {Function} options.setValue - Called to set the editor's value and update any UI as needed.
 * @param {Function} options.onFocus - Called to focus the editor.
 * @param {Array<object>} [options.shortcuts] - Called to register all configured keyboard shortcuts for this editor instance.
 * @param {any} options.value - The initial value for the editor input/state.
 * @param {Function} options.render - Called to render the editor UI.
 * @param {any} options.config - The configuration for the editor.
 * @param {string} options.shortcutsGroup - The group for the keyboard shortcuts.
 * @param {string} options.position - The position of the editor. Either 'container' (default) or 'portal' (for elements outside of the table container viewport).
 * @param {...object} [options.args] - Any additional custom fields or helpers you want mixed into the editor instance.
 *
 * @returns {BaseEditor} A custom editor class extending Handsontable's BaseEditor.
 */
const editorFactory = ({
  /**
   * Called when this editor is constructed by the Handsontable grid.
   * Assigns value/config/render/etc, creates UI container, initializes with provided init.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  init,

  /**
   * Called after the editor is opened and made visible.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  afterOpen,

  /**
   * Called immediately after init, useful for event binding, etc.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  afterInit,

  /**
   * Called when the editor is closed and made invisible.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  afterClose,

  /**
   * Called before the editor is opened so you can set its value/state.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  beforeOpen,

  /**
   * Called to retrieve the current editor value.
   *
   * @param {BaseEditor} editor
   * @returns {any}
   */
  getValue,

  /**
   * Called to set the editor's value and update any UI as needed.
   *
   * @param {BaseEditor} editor
   * @param {any} value
   * @returns {void}
   */
  setValue,

  /**
   * Called to focus the editor.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  onFocus,

  shortcuts,
  value,

  /**
   * Called to render the editor UI.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  render,

  config,
  shortcutsGroup = 'custom-editor',
  position = 'container',

  /**
   * @param {...object} [args] Any additional custom fields or helpers you want mixed into the editor instance.
   */
  ...args

}) => {
  /**
   * Register all configured keyboard shortcuts for this editor instance.
   *
   * @param {BaseEditor} editor - The editor instance.
   * @returns {void}
   * @private
   */
  const registerShortcuts = (editor) => {
    const shortcutManager = editor.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');
    const contextConfig = {
      group: shortcutsGroup,
    };

    if (shortcuts) {
      editorContext.addShortcuts(shortcuts.map(shortcut => ({
        ...shortcut,
        relativeToGroup: shortcut.relativeToGroup ||
                  'editorManager.handlingEditor',
        position: shortcut.position || 'before',
        callback: event => shortcut.callback(editor, event),
      })),
      contextConfig);
    }
  };

  // Compose the Handsontable editor definition using the core editorBaseFactory:
  return editorBaseFactory({
    /**
     * Called when this editor is constructed by the Handsontable grid.
     * Assigns value/config/render/etc, creates UI container, initializes with provided init.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @returns {void}
     */
    init(editor) {
      Object.assign(editor, { value, config, render, position, ...args });
      editor._open = false;
      editor.container = editor.hot.rootDocument.createElement('DIV');
      editor.container.style.display = 'none';
      editor.container.classList.add('htSelectEditor');

      if (position === 'portal') {
        editor.hot.rootPortalElement.appendChild(editor.container);
      } else {
        editor.hot.rootElement.appendChild(editor.container);
      }
      init(editor);

      if (!editor.input) {
        // TODO: what should we do here?
        // console.error('input not found');
      }
      editor.container.appendChild(editor.input);

      if (typeof afterInit === 'function') {
        afterInit(editor);
      }
    },
    /**
     * Retrieve the value from the editor UI.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @returns {any}
     */
    getValue(editor) {
      if (typeof getValue === 'function') {
        return getValue(editor);
      }

      return editor.value;
    },
    /**
     * Set the editor's value and update any UI as needed.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @param {any} _value - The value to set.
     * @returns {void}
     */
    setValue(editor, _value) {
      if (typeof setValue === 'function') {
        setValue(editor, _value);
      } else {
        editor.value = _value;
      }
      if (typeof render === 'function') {
        render(editor);
      }
    },
    /**
     * Opens the editor, making the container visible and binding shortcuts.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @param {Event} event - The event that triggered the editor opening.
     * @returns {void}
     */
    open(editor, event = undefined) {

      editor.container.style.display = 'block';
      editor.container.style.position = 'absolute';

      if (editor.position === 'portal') {
        const _offset = editor.TD.getBoundingClientRect();

        editor.container.style.top = `${editor.hot.rootWindow.pageYOffset + _offset.top}px`;
        editor.container.style.left = `${editor.hot.rootWindow.pageXOffset + _offset.left}px`;
      } else {
        const rect = editor.getEditedCellRect();

        editor.container.style.top = `${rect.top}px`;
        editor.container.style.left = `${rect.start}px`;
        editor.container.style.width = `${rect.width}px`;
        editor.container.style.height = `${rect.height}px`;
      }

      editor.container.classList.add('ht_editor_visible');
      editor._open = true;
      editor.hot.getShortcutManager().setActiveContextName('editor');
      registerShortcuts(editor);

      if (afterOpen) {
        afterOpen(editor, event);
      }
    },
    /**
     * Focus on the correct UI element within your editor.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @returns {void}
     */
    focus(editor) {
      if (typeof onFocus === 'function') {
        onFocus(editor);
      } else {
        // eslint-disable-next-line max-len
        editor.container.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus();
      }
    },
    /**
     * Close the editor UI and cleanup active shortcuts.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @returns {void}
     */
    close(editor) {
      editor._open = false;
      editor.container.style.display = 'none';
      editor.container.classList.remove('ht_editor_visible');
      const shortcutManager = editor.hot.getShortcutManager();
      const editorContext = shortcutManager.getContext('editor');

      editorContext.removeShortcutsByGroup(shortcutsGroup);

      if (typeof afterClose === 'function') {
        afterClose(editor);
      }
    },
    /**
     * Prepare the editor to start editing a new value. Invokes beforeOpen or falls back.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     * @param {number|string} prop - The property name or index.
     * @param {HTMLTableCellElement} td - The table cell element.
     * @param {any} originalValue - The original value.
     * @param {object} cellProperties - The cell properties.
     * @returns {void}
     */
    prepare(editor, row, col, prop, td, originalValue, cellProperties) {
      if (typeof beforeOpen === 'function') {
        beforeOpen(editor, {
          row,
          col,
          prop,
          td,
          originalValue,
          cellProperties,
        });
      } else {
        editor.setValue(originalValue);
      }
    },
  });
};

BaseEditor.factory = editorFactory;
