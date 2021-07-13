import { CellCoords } from './3rdparty/walkontable/src';
import { KEY_CODES, isFunctionKey, isCtrlMetaKey } from './helpers/unicode';
import { stopImmediatePropagation, isImmediatePropagationStopped } from './helpers/dom/event';
import { getEditorInstance } from './editors/registry';
import EventManager from './eventManager';
import { EDITOR_STATE } from './editors/baseEditor';
import { getParentWindow } from './helpers/dom/element';

class EditorManager {
  /**
   * @param {Core} instance The Handsontable instance.
   * @param {TableMeta} tableMeta The table meta instance.
   * @param {Selection} selection The selection instance.
   */
  constructor(instance, tableMeta, selection) {
    /**
     * Instance of {@link Handsontable}.
     *
     * @private
     * @type {Handsontable}
     */
    this.instance = instance;
    /**
     * Reference to an instance's private GridSettings object.
     *
     * @private
     * @type {GridSettings}
     */
    this.tableMeta = tableMeta;
    /**
     * Instance of {@link Selection}.
     *
     * @private
     * @type {Selection}
     */
    this.selection = selection;
    /**
     * Instance of {@link EventManager}.
     *
     * @private
     * @type {EventManager}
     */
    this.eventManager = new EventManager(instance);
    /**
     * Determines if EditorManager is destroyed.
     *
     * @private
     * @type {boolean}
     */
    this.destroyed = false;
    /**
     * Determines if EditorManager is locked.
     *
     * @private
     * @type {boolean}
     */
    this.lock = false;
    /**
     * A reference to an instance of the activeEditor.
     *
     * @private
     * @type {*}
     */
    this.activeEditor = void 0;
    /**
     * Keeps a reference to the cell's properties object.
     *
     * @type {object}
     */
    this.cellProperties = void 0;
    /**
     * Keeps last keyCode pressed from the keydown event.
     *
     * @type {number}
     */
    this.lastKeyCode = void 0;

    this.instance.addHook('afterDocumentKeyDown', event => this.onAfterDocumentKeyDown(event));

    let frame = this.instance.rootWindow;

    while (frame) {
      this.eventManager.addEventListener(frame.document.documentElement, 'keydown', (event) => {
        if (!this.destroyed) {
          this.instance.runHooks('afterDocumentKeyDown', event);
        }
      });

      frame = getParentWindow(frame);
    }

    // Open editor when text composition is started (IME editor)
    this.eventManager.addEventListener(this.instance.rootDocument.documentElement, 'compositionstart', (event) => {
      if (!this.destroyed && this.activeEditor && !this.activeEditor.isOpened() && this.instance.isListening()) {
        this.openEditor('', event);
      }
    });

    this.instance.view.wt.update('onCellDblClick', (event, coords, elem) => this.onCellDblClick(event, coords, elem));
  }

  /**
   * Lock the editor from being prepared and closed. Locking the editor prevents its closing and
   * reinitialized after selecting the new cell. This feature is necessary for a mobile editor.
   */
  lockEditor() {
    this.lock = true;
  }

  /**
   * Unlock the editor from being prepared and closed. This method restores the original behavior of
   * the editors where for every new selection its instances are closed.
   */
  unlockEditor() {
    this.lock = false;
  }

  /**
   * Destroy current editor, if exists.
   *
   * @param {boolean} revertOriginal If `false` and the cell using allowInvalid option,
   *                                 then an editor won't be closed until validation is passed.
   */
  destroyEditor(revertOriginal) {
    if (!this.lock) {
      this.closeEditor(revertOriginal);
    }
  }

  /**
   * Get active editor.
   *
   * @returns {*}
   */
  getActiveEditor() {
    return this.activeEditor;
  }

  /**
   * Prepare text input to be displayed at given grid cell.
   */
  prepareEditor() {
    if (this.lock) {
      return;
    }

    if (this.activeEditor && this.activeEditor.isWaiting()) {
      this.closeEditor(false, false, (dataSaved) => {
        if (dataSaved) {
          this.prepareEditor();
        }
      });

      return;
    }

    const { row, col } = this.instance.selection.selectedRange.current().highlight;
    const modifiedCellCoords = this.instance.runHooks('modifyGetCellCoords', row, col);
    let visualRowToCheck = row;
    let visualColumnToCheck = col;

    if (Array.isArray(modifiedCellCoords)) {
      [visualRowToCheck, visualColumnToCheck] = modifiedCellCoords;
    }

    // Getting values using the modified coordinates.
    this.cellProperties = this.instance.getCellMeta(visualRowToCheck, visualColumnToCheck);

    const { activeElement } = this.instance.rootDocument;

    if (activeElement) {
      // Bluring the activeElement removes unwanted border around the focusable element
      // (and resets activeElement prop). Without blurring the activeElement points to the
      // previously focusable element after clicking onto the cell (#6877).
      activeElement.blur();
    }

    if (this.cellProperties.readOnly) {
      this.clearActiveEditor();

      return;
    }

    const editorClass = this.instance.getCellEditor(this.cellProperties);
    // Getting element using coordinates from the selection.
    const td = this.instance.getCell(row, col, true);

    if (editorClass && td) {
      const prop = this.instance.colToProp(visualColumnToCheck);

      const originalValue =
        this.instance.getSourceDataAtCell(this.instance.toPhysicalRow(visualRowToCheck), visualColumnToCheck);

      this.activeEditor = getEditorInstance(editorClass, this.instance);
      // Using not modified coordinates, as we need to get the table element using selection coordinates.
      // There is an extra translation in the editor for saving value.
      this.activeEditor.prepare(row, col, prop, td, originalValue, this.cellProperties);

    } else {
      this.clearActiveEditor();
    }
  }

  /**
   * Check is editor is opened/showed.
   *
   * @returns {boolean}
   */
  isEditorOpened() {
    return this.activeEditor && this.activeEditor.isOpened();
  }

  /**
   * Open editor with initial value.
   *
   * @param {null|string} newInitialValue New value from which editor will start if handled property it's not the `null`.
   * @param {Event} event The event object.
   */
  openEditor(newInitialValue, event) {
    if (!this.activeEditor) {
      return;
    }

    this.activeEditor.beginEditing(newInitialValue, event);
  }

  /**
   * Close editor, finish editing cell.
   *
   * @param {boolean} restoreOriginalValue If `true`, then closes editor without saving value from the editor into a cell.
   * @param {boolean} isCtrlPressed If `true`, then editor will save value to each cell in the last selected range.
   * @param {Function} callback The callback function, fired after editor closing.
   */
  closeEditor(restoreOriginalValue, isCtrlPressed, callback) {
    if (this.activeEditor) {
      this.activeEditor.finishEditing(restoreOriginalValue, isCtrlPressed, callback);

    } else if (callback) {
      callback(false);
    }
  }

  /**
   * Close editor and save changes.
   *
   * @param {boolean} isCtrlPressed If `true`, then editor will save value to each cell in the last selected range.
   */
  closeEditorAndSaveChanges(isCtrlPressed) {
    this.closeEditor(false, isCtrlPressed);
  }

  /**
   * Close editor and restore original value.
   *
   * @param {boolean} isCtrlPressed Indication of whether the CTRL button is pressed.
   */
  closeEditorAndRestoreOriginalValue(isCtrlPressed) {
    this.closeEditor(true, isCtrlPressed);
  }

  /**
   * Clears reference to an instance of the active editor.
   *
   * @private
   */
  clearActiveEditor() {
    this.activeEditor = void 0;
  }

  /**
   * Controls selection's behaviour after clicking `Enter`.
   *
   * @private
   * @param {boolean} isShiftPressed If `true`, then the selection will move up after hit enter.
   */
  moveSelectionAfterEnter(isShiftPressed) {
    const enterMoves = typeof this.tableMeta.enterMoves === 'function' ?
      this.tableMeta.enterMoves(event) : this.tableMeta.enterMoves;

    if (isShiftPressed) {
      // move selection up
      this.selection.transformStart(-enterMoves.row, -enterMoves.col);
    } else {
      // move selection down (add a new row if needed)
      this.selection.transformStart(enterMoves.row, enterMoves.col, true);
    }
  }

  /**
   * Controls selection behaviour after clicking `arrow up`.
   *
   * @private
   * @param {boolean} isShiftPressed If `true`, then the selection will expand up.
   */
  moveSelectionUp(isShiftPressed) {
    if (isShiftPressed) {
      this.selection.transformEnd(-1, 0);
    } else {
      this.selection.transformStart(-1, 0);
    }
  }

  /**
   * Controls selection's behaviour after clicking `arrow down`.
   *
   * @private
   * @param {boolean} isShiftPressed If `true`, then the selection will expand down.
   */
  moveSelectionDown(isShiftPressed) {
    if (isShiftPressed) {
      // expanding selection down with shift
      this.selection.transformEnd(1, 0);
    } else {
      this.selection.transformStart(1, 0);
    }
  }

  /**
   * Controls selection's behaviour after clicking `arrow right`.
   *
   * @private
   * @param {boolean} isShiftPressed If `true`, then the selection will expand right.
   */
  moveSelectionRight(isShiftPressed) {
    if (isShiftPressed) {
      this.selection.transformEnd(0, 1);
    } else {
      this.selection.transformStart(0, 1);
    }
  }

  /**
   * Controls selection's behaviour after clicking `arrow left`.
   *
   * @private
   * @param {boolean} isShiftPressed If `true`, then the selection will expand left.
   */
  moveSelectionLeft(isShiftPressed) {
    if (isShiftPressed) {
      this.selection.transformEnd(0, -1);
    } else {
      this.selection.transformStart(0, -1);
    }
  }

  /**
   * OnAfterDocumentKeyDown callback.
   *
   * @private
   * @param {KeyboardEvent} event The keyboard event object.
   */
  onAfterDocumentKeyDown(event) {
    if (!this.instance.isListening()) {
      return;
    }

    this.instance.runHooks('beforeKeyDown', event);

    const { keyCode } = event;

    // keyCode 229 aka 'uninitialized' doesn't take into account with editors. This key code is produced when unfinished
    // character is entering (using IME editor). It is fired mainly on linux (ubuntu) with installed ibus-pinyin package.
    if (this.destroyed || keyCode === 229) {
      return;
    }
    if (isImmediatePropagationStopped(event)) {
      return;
    }

    this.lastKeyCode = keyCode;

    if (!this.selection.isSelected()) {
      return;
    }
    // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    const isCtrlPressed = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (this.activeEditor && !this.activeEditor.isWaiting()) {
      if (!isFunctionKey(keyCode) && !isCtrlMetaKey(keyCode) && !isCtrlPressed && !this.isEditorOpened()) {
        this.openEditor('', event);

        return;
      }
    }

    const isShiftPressed = event.shiftKey;

    const rangeModifier = isShiftPressed ? this.selection.setRangeEnd : this.selection.setRangeStart;
    let tabMoves;

    switch (keyCode) {
      case KEY_CODES.A:
        if (!this.isEditorOpened() && isCtrlPressed) {
          this.instance.selectAll();

          event.preventDefault();
          event.stopPropagation();
        }
        break;

      case KEY_CODES.ARROW_UP:
        if (this.isEditorOpened() && !this.activeEditor.isWaiting()) {
          this.closeEditorAndSaveChanges(isCtrlPressed);
        }
        this.moveSelectionUp(isShiftPressed);

        event.preventDefault();
        event.stopPropagation();
        break;

      case KEY_CODES.ARROW_DOWN:
        if (this.isEditorOpened() && !this.activeEditor.isWaiting()) {
          this.closeEditorAndSaveChanges(isCtrlPressed);
        }

        this.moveSelectionDown(isShiftPressed);

        event.preventDefault();
        event.stopPropagation();
        break;

      case KEY_CODES.ARROW_RIGHT:
        if (this.isEditorOpened() && !this.activeEditor.isWaiting()) {
          this.closeEditorAndSaveChanges(isCtrlPressed);
        }

        this.moveSelectionRight(isShiftPressed);

        event.preventDefault();
        event.stopPropagation();
        break;

      case KEY_CODES.ARROW_LEFT:
        if (this.isEditorOpened() && !this.activeEditor.isWaiting()) {
          this.closeEditorAndSaveChanges(isCtrlPressed);
        }

        this.moveSelectionLeft(isShiftPressed);

        event.preventDefault();
        event.stopPropagation();
        break;

      case KEY_CODES.TAB:
        tabMoves = typeof this.tableMeta.tabMoves === 'function' ?
          this.tableMeta.tabMoves(event) : this.tableMeta.tabMoves;

        if (isShiftPressed) {
          // move selection left
          this.selection.transformStart(-tabMoves.row, -tabMoves.col);
        } else {
          // move selection right (add a new column if needed)
          this.selection.transformStart(tabMoves.row, tabMoves.col, true);
        }
        event.preventDefault();
        event.stopPropagation();
        break;

      case KEY_CODES.BACKSPACE:
      case KEY_CODES.DELETE:
        this.instance.emptySelectedCells();
        this.prepareEditor();
        event.preventDefault();
        break;

      case KEY_CODES.F2:
        /* F2 */
        if (this.activeEditor) {
          this.activeEditor.enableFullEditMode();
        }
        this.openEditor(null, event);

        event.preventDefault(); // prevent Opera from opening 'Go to Page dialog'
        break;

      case KEY_CODES.ENTER:
        /* return/enter */
        if (this.isEditorOpened()) {

          if (this.activeEditor && this.activeEditor.state !== EDITOR_STATE.WAITING) {
            this.closeEditorAndSaveChanges(isCtrlPressed);
          }
          this.moveSelectionAfterEnter(isShiftPressed);

        } else if (this.instance.getSettings().enterBeginsEditing) {
          if (this.cellProperties.readOnly) {
            this.moveSelectionAfterEnter();

          } else if (this.activeEditor) {
            this.activeEditor.enableFullEditMode();
            this.openEditor(null, event);
          }

        } else {
          this.moveSelectionAfterEnter(isShiftPressed);
        }
        event.preventDefault(); // don't add newline to field
        stopImmediatePropagation(event); // required by HandsontableEditor
        break;

      case KEY_CODES.ESCAPE:
        if (this.isEditorOpened()) {
          this.closeEditorAndRestoreOriginalValue(isCtrlPressed);

          this.activeEditor.focus();
        }
        event.preventDefault();
        break;

      case KEY_CODES.HOME:
        if (event.ctrlKey || event.metaKey) {
          rangeModifier.call(this.selection,
            new CellCoords(
              this.instance.rowIndexMapper.getFirstNotHiddenIndex(0, 1),
              this.selection.selectedRange.current().from.col));
        } else {
          rangeModifier.call(this.selection,
            new CellCoords(this.selection.selectedRange.current().from.row,
              this.instance.columnIndexMapper.getFirstNotHiddenIndex(0, 1)));
        }
        event.preventDefault(); // don't scroll the window
        event.stopPropagation();
        break;

      case KEY_CODES.END:
        if (event.ctrlKey || event.metaKey) {
          rangeModifier.call(
            this.selection,
            new CellCoords(this.instance.rowIndexMapper.getFirstNotHiddenIndex(this.instance.countRows() - 1, -1),
              this.selection.selectedRange.current().from.col)
          );
        } else {
          rangeModifier.call(
            this.selection,
            new CellCoords(this.selection.selectedRange.current().from.row,
              this.instance.columnIndexMapper.getFirstNotHiddenIndex(this.instance.countCols() - 1, -1))
          );
        }
        event.preventDefault(); // don't scroll the window
        event.stopPropagation();
        break;

      case KEY_CODES.PAGE_UP:
        this.selection.transformStart(-this.instance.countVisibleRows(), 0);
        event.preventDefault(); // don't page up the window
        event.stopPropagation();
        break;

      case KEY_CODES.PAGE_DOWN:
        this.selection.transformStart(this.instance.countVisibleRows(), 0);
        event.preventDefault(); // don't page down the window
        event.stopPropagation();
        break;

      default:
        break;
    }
  }

  /**
   * OnCellDblClick callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   * @param {object} coords The cell coordinates.
   * @param {HTMLTableCellElement|HTMLTableHeaderCellElement} elem The element which triggers the action.
   */
  onCellDblClick(event, coords, elem) {
    // may be TD or TH
    if (elem.nodeName === 'TD') {
      if (this.activeEditor) {
        this.activeEditor.enableFullEditMode();
      }
      this.openEditor(null, event);
    }
  }

  /**
   * Destroy the instance.
   */
  destroy() {
    this.destroyed = true;
    this.eventManager.destroy();
  }
}

const instances = new WeakMap();

/**
 * @param {Core} hotInstance The Handsontable instance.
 * @param {TableMeta} tableMeta The table meta class instance.
 * @param {Selection} selection The selection instance.
 * @returns {EditorManager}
 */
EditorManager.getInstance = function(hotInstance, tableMeta, selection) {
  let editorManager = instances.get(hotInstance);

  if (!editorManager) {
    editorManager = new EditorManager(hotInstance, tableMeta, selection);
    instances.set(hotInstance, editorManager);
  }

  return editorManager;
};

export default EditorManager;
