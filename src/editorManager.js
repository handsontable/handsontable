import { CellCoords } from './3rdparty/walkontable/src';
import { KEY_CODES, isMetaKey, isCtrlMetaKey } from './helpers/unicode';
import { stopPropagation, stopImmediatePropagation, isImmediatePropagationStopped } from './helpers/dom/event';
import { getEditorInstance } from './editors';
import EventManager from './eventManager';
import { EditorState } from './editors/_baseEditor';
import { getParentWindow } from './helpers/dom/element';

class EditorManager {
  /**
   * @param {Handsontable} instance
   * @param {GridSettings} priv
   * @param {Selection} selection
   */
  constructor(instance, priv, selection) {
    /**
     * Instance of {@link Handsontable}
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
    this.priv = priv;
    /**
     * Instance of {@link Selection}
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
     * @type {Boolean}
     */
    this.destroyed = false;
    /**
     * Determines if EditorManager is locked.
     *
     * @private
     * @type {Boolean}
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
     * @type {Object}
     */
    this.cellProperties = void 0;

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
   * @param {Boolean} revertOriginal
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
    this.cellProperties = this.instance.getCellMeta(row, col);

    if (this.cellProperties.readOnly) {
      this.clearActiveEditor();

      return;
    }

    const editorClass = this.instance.getCellEditor(this.cellProperties);
    const td = this.instance.getCell(row, col, true);

    if (editorClass && td) {
      const prop = this.instance.colToProp(col);
      const originalValue = this.instance.getSourceDataAtCell(this.instance.runHooks('modifyRow', row), col);

      this.activeEditor = getEditorInstance(editorClass, this.instance);
      this.activeEditor.prepare(row, col, prop, td, originalValue, this.cellProperties);

    } else {
      this.clearActiveEditor();
    }
  }

  /**
   * Check is editor is opened/showed.
   *
   * @returns {Boolean}
   */
  isEditorOpened() {
    return this.activeEditor && this.activeEditor.isOpened();
  }

  /**
   * Open editor with initial value.
   *
   * @param {null|String} newInitialValue new value from which editor will start if handled property it's not the `null`.
   * @param {Event} event
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
   * @param {Boolean} restoreOriginalValue
   * @param {Boolean} [isCtrlPressed]
   * @param {Function} [callback]
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
   * @param {Boolean} isCtrlPressed
   */
  closeEditorAndSaveChanges(isCtrlPressed) {
    this.closeEditor(false, isCtrlPressed);
  }

  /**
   * Close editor and restore original value.
   *
   * @param {Boolean} isCtrlPressed
   */
  closeEditorAndRestoreOriginalValue(isCtrlPressed) {
    return this.closeEditor(true, isCtrlPressed);
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
   * @param {Boolean} isShiftPressed
   */
  moveSelectionAfterEnter(isShiftPressed) {
    const enterMoves = typeof this.priv.settings.enterMoves === 'function' ? this.priv.settings.enterMoves(event) : this.priv.settings.enterMoves;

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
   * @param {Boolean} isShiftPressed
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
   * @param {Boolean} isShiftPressed
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
   * @param {Boolean} isShiftPressed
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
   * @param {Boolean} isShiftPressed
   */
  moveSelectionLeft(isShiftPressed) {
    if (isShiftPressed) {
      this.selection.transformEnd(0, -1);
    } else {
      this.selection.transformStart(0, -1);
    }
  }

  /**
   * onAfterDocumentKeyDown callback.
   *
   * @private
   * @param {KeyboardEvent} event
   */
  onAfterDocumentKeyDown(event) {
    if (!this.instance.isListening()) {
      return;
    }

    this.instance.runHooks('beforeKeyDown', event);

    // keyCode 229 aka 'uninitialized' doesn't take into account with editors. This key code is produced when unfinished
    // character is entering (using IME editor). It is fired mainly on linux (ubuntu) with installed ibus-pinyin package.
    if (this.destroyed || event.keyCode === 229) {
      return;
    }
    if (isImmediatePropagationStopped(event)) {
      return;
    }
    this.priv.lastKeyCode = event.keyCode;

    if (!this.selection.isSelected()) {
      return;
    }
    // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    const isCtrlPressed = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (this.activeEditor && !this.activeEditor.isWaiting()) {
      if (!isMetaKey(event.keyCode) && !isCtrlMetaKey(event.keyCode) && !isCtrlPressed && !this.isEditorOpened()) {
        this.openEditor('', event);

        return;
      }
    }

    const isShiftPressed = event.shiftKey;

    const rangeModifier = isShiftPressed ? this.selection.setRangeEnd : this.selection.setRangeStart;
    let tabMoves;

    switch (event.keyCode) {
      case KEY_CODES.A:
        if (!this.isEditorOpened() && isCtrlPressed) {
          this.instance.selectAll();

          event.preventDefault();
          stopPropagation(event);
        }
        break;

      case KEY_CODES.ARROW_UP:
        if (this.isEditorOpened() && !this.activeEditor.isWaiting()) {
          this.closeEditorAndSaveChanges(isCtrlPressed);
        }
        this.moveSelectionUp(isShiftPressed);

        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.ARROW_DOWN:
        if (this.isEditorOpened() && !this.activeEditor.isWaiting()) {
          this.closeEditorAndSaveChanges(isCtrlPressed);
        }

        this.moveSelectionDown(isShiftPressed);

        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.ARROW_RIGHT:
        if (this.isEditorOpened() && !this.activeEditor.isWaiting()) {
          this.closeEditorAndSaveChanges(isCtrlPressed);
        }

        this.moveSelectionRight(isShiftPressed);

        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.ARROW_LEFT:
        if (this.isEditorOpened() && !this.activeEditor.isWaiting()) {
          this.closeEditorAndSaveChanges(isCtrlPressed);
        }

        this.moveSelectionLeft(isShiftPressed);

        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.TAB:
        tabMoves = typeof this.priv.settings.tabMoves === 'function' ? this.priv.settings.tabMoves(event) : this.priv.settings.tabMoves;

        if (isShiftPressed) {
          // move selection left
          this.selection.transformStart(-tabMoves.row, -tabMoves.col);
        } else {
          // move selection right (add a new column if needed)
          this.selection.transformStart(tabMoves.row, tabMoves.col, true);
        }
        event.preventDefault();
        stopPropagation(event);
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

          if (this.activeEditor && this.activeEditor.state !== EditorState.WAITING) {
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
          rangeModifier.call(this.selection, new CellCoords(0, this.selection.selectedRange.current().from.col));
        } else {
          rangeModifier.call(this.selection, new CellCoords(this.selection.selectedRange.current().from.row, 0));
        }
        event.preventDefault(); // don't scroll the window
        stopPropagation(event);
        break;

      case KEY_CODES.END:
        if (event.ctrlKey || event.metaKey) {
          rangeModifier.call(this.selection, new CellCoords(this.instance.countRows() - 1, this.selection.selectedRange.current().from.col));
        } else {
          rangeModifier.call(this.selection, new CellCoords(this.selection.selectedRange.current().from.row, this.instance.countCols() - 1));
        }
        event.preventDefault(); // don't scroll the window
        stopPropagation(event);
        break;

      case KEY_CODES.PAGE_UP:
        this.selection.transformStart(-this.instance.countVisibleRows(), 0);
        event.preventDefault(); // don't page up the window
        stopPropagation(event);
        break;

      case KEY_CODES.PAGE_DOWN:
        this.selection.transformStart(this.instance.countVisibleRows(), 0);
        event.preventDefault(); // don't page down the window
        stopPropagation(event);
        break;

      default:
        break;
    }
  }

  /**
   * onCellDblClick callback.
   *
   * @private
   * @param {MouseEvent} event
   * @param {Object} coords
   * @param {HTMLTableCellElement|HTMLTableHeaderCellElement} elem
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
 * @param {Handsontable} hotInstance
 * @param {GridSettings} hotSettings
 * @param {Selection} selection
 * @param {DataMap} datamap
 */
EditorManager.getInstance = function(hotInstance, hotSettings, selection, datamap) {
  let editorManager = instances.get(hotInstance);

  if (!editorManager) {
    editorManager = new EditorManager(hotInstance, hotSettings, selection, datamap);
    instances.set(hotInstance, editorManager);
  }

  return editorManager;
};

export default EditorManager;
