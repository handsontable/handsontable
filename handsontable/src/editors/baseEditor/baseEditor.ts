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
import {
  HotInstance,
  CellProperties,
  EditorState,
  BaseEditor as BaseEditorInterface,
  CellOffset
} from '../types';

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
export class BaseEditor implements BaseEditorInterface {
  static get EDITOR_TYPE(): string {
    return EDITOR_TYPE;
  }

  /**
   * A reference to the source instance of the Handsontable.
   *
   * @type {Handsontable}
   */
  hot: HotInstance;
  /**
   * Editor's state.
   *
   * @type {string}
   */
  state: EditorState = EDITOR_STATE.VIRGIN as EditorState;
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
  _closeCallback: ((result: boolean) => void) | null = null;
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
  originalValue: any = null;
  /**
   * Object containing the cell's properties.
   *
   * @type {object}
   */
  cellProperties: CellProperties = {} as CellProperties;

  /**
   * TextArea element for editors that need it
   */
  TEXTAREA?: HTMLTextAreaElement;

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
  init(): void {}

  /**
   * Required method to get current value from editable element.
   */
  getValue(): any {
    throw Error('Editor getValue() method unimplemented');
  }

  /**
   * Required method to set new value into editable element.
   */
  setValue(value: any): void {
    throw Error('Editor setValue() method unimplemented');
  }

  /**
   * Required method to open editor.
   */
  open(event?: Event): void {
    throw Error('Editor open() method unimplemented');
  }

  /**
   * Required method to close editor.
   */
  close(): void {
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
  prepare(row: number, col: number, prop: number | string, td: HTMLTableCellElement, value: any, cellProperties: CellProperties): void {
    this.TD = td;
    this.row = row;
    this.col = col;
    this.prop = prop;
    this.originalValue = value;
    this.cellProperties = cellProperties;
    this.state = this.isOpened() ? this.state : EDITOR_STATE.VIRGIN as EditorState;
  }

  /**
   * Fallback method to provide extendable editors in ES5.
   *
   * @returns {Function}
   */
  extend(): any {
    return (class Editor extends (this.constructor as any) {});
  }

  /**
   * Saves value from editor into data storage.
   *
   * @param {*} value The editor value.
   * @param {boolean} ctrlDown If `true`, applies value to each cell in the last selected range.
   */
  saveValue(value: any, ctrlDown: boolean): void {
    let visualRowFrom: number;
    let visualColumnFrom: number;
    let visualRowTo: number | null;
    let visualColumnTo: number | null;

    // if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
    if (ctrlDown) {
      const selectedLast = this.hot.getSelectedLast();

      visualRowFrom = Math.max(Math.min(selectedLast[0], selectedLast[2]), 0); // Math.max eliminate headers coords.
      visualColumnFrom = Math.max(Math.min(selectedLast[1], selectedLast[3]), 0); // Math.max eliminate headers coords.
      visualRowTo = Math.max(selectedLast[0], selectedLast[2]);
      visualColumnTo = Math.max(selectedLast[1], selectedLast[3]);

    } else {
      [visualRowFrom, visualColumnFrom, visualRowTo, visualColumnTo] = [this.row as number, this.col as number, null, null];
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
  beginEditing(newInitialValue: any, event?: Event): void {
    if (this.state !== EDITOR_STATE.VIRGIN) {
      return;
    }

    const hotInstance = this.hot;
    // We have to convert visual indexes into renderable indexes
    // due to hidden columns don't participate in the rendering process
    const renderableRowIndex = hotInstance.rowIndexMapper.getRenderableFromVisualIndex(this.row as number);
    const renderableColumnIndex = hotInstance.columnIndexMapper.getRenderableFromVisualIndex(this.col as number);

    const openEditor = (): void => {
      this.state = EDITOR_STATE.EDITING as EditorState;

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

      // Only for text-type editors
      const caretPosition = typeof newInitialValue === 'number' ? newInitialValue.toString().length : newInitialValue?.length || 0;

      if (this.isInFullEditMode() && typeof caretPosition === 'number') {
        this.selectRange(caretPosition, caretPosition);
      }
    };

    const result = hotInstance.runHooks('beforeBeginEditing', this.row, this.col, this.prop, newInitialValue, this);

    if (result === false) {
      return;
    }

    // Getting element outside the viewport isn't supported.
    if (renderableRowIndex === null || renderableColumnIndex === null) {
      return;
    }

    openEditor();
  }

  /**
   * Finishes editing and start saving or restoring process for editing cell or last selected range.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in the last selected range.
   * @param {Function} callback The callback function on process finish.
   */
  finishEditing(restoreOriginalValue = false, ctrlDown = false, callback?: (result: boolean) => void): void {
    if (this.isWaiting()) {
      return;
    }

    if (this.state === EDITOR_STATE.VIRGIN) {
      this.state = EDITOR_STATE.EDITING as EditorState;

      setTimeout(() => {
        this.finishEditing(restoreOriginalValue, ctrlDown, callback);
      });

      return;
    }

    if (this.state === EDITOR_STATE.EDITING) {
      if (restoreOriginalValue) {
        this.cancelChanges();
        this.hot.getShortcutManager().setActiveContextName('grid');

        if (callback) {
          callback(true);
        }

      } else {
        const value = this.getValue();

        if (this.hot.getSettings().trimWhitespace) {
          // We trim only string values
          const isValueTypeString = typeof value === 'string';

          if (isValueTypeString) {
            this.setValue(value.trim());
          }
        }

        this.state = EDITOR_STATE.WAITING as EditorState;
        this.saveValue(value, ctrlDown);

        if (this.hot.getCellValidator(this.cellProperties)) {
          this.hot.addHookOnce('postAfterValidate', (result: boolean) => {
            this.state = EDITOR_STATE.FINISHED as EditorState;
            this.discardEditor(result);

            if (callback) {
              callback(result);
            }
          });

        } else {
          this.state = EDITOR_STATE.FINISHED as EditorState;
          this.discardEditor(true);

          this.hot.getShortcutManager().setActiveContextName('grid');

          if (callback) {
            callback(true);
          }
        }
      }
    }
  }

  /**
   * Finishes editing without singout saving value.
   */
  cancelChanges(): void {
    this.state = EDITOR_STATE.FINISHED as EditorState;
    this.discardEditor();
  }

  /**
   * Verifies result of validation or closes editor if user's cancelled changes.
   *
   * @param {boolean|undefined} result If `false` and the cell using allowInvalid option,
   *                                   then an editor won't be discard after clicking outside the table.
   */
  discardEditor(result?: boolean): void {
    if (this.state !== EDITOR_STATE.FINISHED) {
      return;
    }

    // validator was defined and failed
    if (result === false && this.cellProperties && this.cellProperties.allowInvalid) {
      this.state = EDITOR_STATE.EDITING as EditorState;
      this.focus();

      return;
    }

    this.close();
    this._opened = false;
    this._fullEditMode = false;
    this.state = EDITOR_STATE.VIRGIN as EditorState;

    this._fireCallbacks(result !== false);
  }

  /**
   * Switch editor into full edit mode. In this state navigation keys don't close editor. This mode is activated
   * automatically when editor is opened using "F2" key or double click on the cell.
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
   * Returns information whether the editor is waiting, eg.: for async validation.
   *
   * @returns {boolean}
   */
  isWaiting(): boolean {
    return this.state === EDITOR_STATE.WAITING;
  }

  /**
   * Gets the HTML element of the cell being edited.
   *
   * @returns {HTMLTableCellElement}
   */
  getEditedCell(): HTMLTableCellElement | null {
    return this.TD;
  }

  /**
   * Returns name of the overlay, where editor is placed.
   *
   * @private
   * @returns {string}
   */
  checkEditorSection(): string {
    const totalRows = this.hot.countRows();
    let section = '';

    if (this.row !== null && this.col !== null) {
      if (this.row < totalRows - (this.hot.getSettings().fixedRowsBottom || 0) && this.row >= totalRows - totalRows) {
        if (this.col < (this.hot.getSettings().fixedColumnsStart || 0)) {
          section = 'top-left-corner';
        } else {
          section = 'top';
        }

      } else if (this.hot.getSettings().fixedRowsBottom && this.row >= totalRows - (this.hot.getSettings().fixedRowsBottom || 0)) {
        if (this.col < (this.hot.getSettings().fixedColumnsStart || 0)) {
          section = 'bottom-left-corner';
        } else {
          section = 'bottom';
        }

      } else if (this.col < (this.hot.getSettings().fixedColumnsStart || 0)) {
        section = 'left';
      }
    }

    return section;
  }

  /**
   * Gets the editor value.
   *
   * @returns {string}
   */
  getEditedCellsLayerClass(): string {
    const editorSection = this.checkEditorSection();
    let editorSectionClassName;

    switch (editorSection) {
      case 'top-left-corner':
        editorSectionClassName = 'ht_clone_top_left_corner';
        break;
      case 'top':
        editorSectionClassName = 'ht_clone_top';
        break;
      case 'bottom-left-corner':
        editorSectionClassName = 'ht_clone_bottom_left_corner';
        break;
      case 'bottom':
        editorSectionClassName = 'ht_clone_bottom';
        break;
      case 'left':
        editorSectionClassName = 'ht_clone_left';
        break;
      default:
        break;
    }

    return editorSectionClassName || 'ht_clone_master';
  }

  /**
   * Gets the parsed coordinates of the edited cell.
   *
   * @private
   * @returns {object} Returns an object with properties `top`, `start`, `width` and `height` or undefined`.
   */
  getEditedCellRect(): CellOffset | null {
    const TD = this.getEditedCell();

    // TD is outside of the viewport.
    if (!TD) {
      return null;
    }

    const layerClass = this.getEditedCellsLayerClass();
    const hotContainer = this.hot.container;
    let containerOffset = offset(hotContainer);
    let scrollOffset = { left: 0, top: 0 };

    let verticalScrollTop = 0;
    let horizontalScrollStart = 0;

    if (layerClass !== 'ht_clone_master') {
      const clonedTable = this.hot.rootDocument.querySelector(`.${layerClass}`);

      containerOffset = offset(clonedTable as HTMLElement);
    }

    verticalScrollTop = this.hot.view.wt.wtOverlays.topOverlay.getScrollPosition();
    horizontalScrollStart = this.hot.view.wt.wtOverlays.inlineStartOverlay.getScrollPosition();

    scrollOffset.top = verticalScrollTop;
    scrollOffset.left = horizontalScrollStart;

    const editorSection = this.checkEditorSection();

    // If the editor is on the top-left, top, bottom or left overlay, there should be no scrolling allowed.
    if (editorSection !== '') {
      scrollOffset.top = 0;
      scrollOffset.left = 0;
    }

    const x = TD.offsetLeft - horizontalScrollStart;
    const y = TD.offsetTop - verticalScrollTop;
    const width = TD.offsetWidth;
    const height = TD.offsetHeight;

    // Convert DOMRect to CellOffset
    return {
      top: containerOffset.top + y,
      start: containerOffset.left + x,
      width,
      height
    };
  }

  /**
   * Moves focus to the textarea element.
   *
   * @private
   */
  focus(): void {
    // For IME editor textarea element must be focused using ".select" method. Using ".focus" browser automatically scroll
    // into the focused element which is undesired effect.
    if (this.TEXTAREA) {
      this.TEXTAREA.select();
    }
  }

  /**
   * Set focus inside the editor
   *
   * @private
   * @param {number} start A position where selection should start.
   * @param {number} end A position where selection should end (optional).
   */
  selectRange(start: number, end: number = start): void {
    const elem = this.TEXTAREA;

    if (!elem) {
      return;
    }

    elem.focus();

    try {
      // There is no universal method for selectring range of text in all browsers. This implementation
      // works in modern browsers (Chrome, Safari, Firefox, Edge).
      elem.setSelectionRange(start, end);
    } catch (error) {
      elem.focus();
      elem.value = elem.value;
    }
  }
}

mixin(BaseEditor, hooksRefRegisterer);
