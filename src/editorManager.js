import { CellCoords } from './3rdparty/walkontable/src';
import { KEY_CODES, isMetaKey, isCtrlMetaKey } from './helpers/unicode';
import { stopPropagation, stopImmediatePropagation, isImmediatePropagationStopped } from './helpers/dom/event';
import { getEditorInstance } from './editors';
import EventManager from './eventManager';
import { EditorState } from './editors/_baseEditor';

class EditorManager {

  /**
   * @param {Handsontable} instance
   * @param {GridSettings} priv
   * @param {Selection} selection
   */
  constructor(instance, priv, selection) {
    /**
     * @private
     * @type {Handsontable}
     */
    this.instance = instance;
    /**
     * @private
     * @type {GridSettings}
     */
    this.priv = priv;
    /**
     * @private
     * @type {Selection}
     */
    this.selection = selection;
    /**
     * @private
     * @type {EventManager}
     */
    this.eventManager = new EventManager(instance);
    /**
     * @private
     * @type {Boolean}
     */
    this.destroyed = false;
    /**
     * @private
     * @type {Boolean}
     */
    this.lock = false;
    /**
     * An active editor's instance.
     *
     * @private
     * @type {*}
     */
    this.activeEditor = void 0;

    this.instance.addHook('afterDocumentKeyDown', event => this.onAfterDocumentKeyDown(event));

    this.eventManager.addEventListener(document.documentElement, 'keydown', (event) => {
      if (!this.destroyed) {
        this.instance.runHooks('afterDocumentKeyDown', event);
      }
    });

    // Open editor when text composition is started (IME editor)
    this.eventManager.addEventListener(document.documentElement, 'compositionstart', (event) => {
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

    const row = this.instance.selection.selectedRange.current().highlight.row;
    const col = this.instance.selection.selectedRange.current().highlight.col;
    const prop = this.instance.colToProp(col);
    const td = this.instance.getCell(row, col);
    const originalValue = this.instance.getSourceDataAtCell(this.instance.runHooks('modifyRow', row), col);
    const cellProperties = this.instance.getCellMeta(row, col);
    const editorClass = this.instance.getCellEditor(cellProperties);

    if (editorClass) {
      this.activeEditor = getEditorInstance(editorClass, this.instance);
      this.activeEditor.prepare(row, col, prop, td, originalValue, cellProperties);

    } else {
      this.activeEditor = void 0;
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
   * @param {DOMEvent} event
   */
  openEditor(newInitialValue, event) {
    if (!this.activeEditor) {
      return;
    }

    const readOnly = this.activeEditor.cellProperties.readOnly;

    if (readOnly) {
      // move the selection after opening the editor with ENTER key
      if (event && event.keyCode === KEY_CODES.ENTER) {
        this.moveSelectionAfterEnter();
      }
    } else {
      this.activeEditor.beginEditing(newInitialValue, event);
    }
  }

  /**
   * Close editor, finish editing cell.
   *
   * @param {Boolean} restoreOriginalValue
   * @param {Boolean} [ctrlDown]
   * @param {Function} [callback]
   */
  closeEditor(restoreOriginalValue, ctrlDown, callback) {
    if (this.activeEditor) {
      this.activeEditor.finishEditing(restoreOriginalValue, ctrlDown, callback);

    } else if (callback) {
      callback(false);
    }
  }

  /**
   * Close editor and save changes.
   *
   * @param {Boolean} ctrlDown
   */
  closeEditorAndSaveChanges(ctrlDown) {
    this.closeEditor(false, ctrlDown);
  }

  /**
   * Close editor and restore original value.
   *
   * @param {Boolean} ctrlDown
   */
  closeEditorAndRestoreOriginalValue(ctrlDown) {
    return this.closeEditor(true, ctrlDown);
  }

  /**
   * Controls selection's behaviour after clicking `Enter`.
   *
   * @private
   * @param {Boolean} shiftKey
   */
  moveSelectionAfterEnter(shiftKey) {
    const enterMoves = typeof this.priv.settings.enterMoves === 'function' ? this.priv.settings.enterMoves(event) : this.priv.settings.enterMoves;

    if (shiftKey) {
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
   * @param {Boolean} shiftKey
   */
  moveSelectionUp(shiftKey) {
    if (shiftKey) {
      this.selection.transformEnd(-1, 0);
    } else {
      this.selection.transformStart(-1, 0);
    }
  }

  /**
   * Controls selection's behaviour after clicking `arrow down`.
   *
   * @private
   * @param {Boolean} shiftKey
   */
  moveSelectionDown(shiftKey) {
    if (shiftKey) {
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
   * @param {Boolean} shiftKey
   */
  moveSelectionRight(shiftKey) {
    if (shiftKey) {
      this.selection.transformEnd(0, 1);
    } else {
      this.selection.transformStart(0, 1);
    }
  }

  /**
   * Controls selection's behaviour after clicking `arrow left`.
   *
   * @private
   * @param {Boolean} shiftKey
   */
  moveSelectionLeft(shiftKey) {
    if (shiftKey) {
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
    const ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (this.activeEditor && !this.activeEditor.isWaiting()) {
      if (!isMetaKey(event.keyCode) && !isCtrlMetaKey(event.keyCode) && !ctrlDown && !this.isEditorOpened()) {
        this.openEditor('', event);

        return;
      }
    }
    const rangeModifier = event.shiftKey ? this.selection.setRangeEnd : this.selection.setRangeStart;
    let tabMoves;

    switch (event.keyCode) {
      case KEY_CODES.A:
        if (!this.isEditorOpened() && ctrlDown) {
          this.instance.selectAll();

          event.preventDefault();
          stopPropagation(event);
        }
        break;

      case KEY_CODES.ARROW_UP:
        if (this.isEditorOpened() && !this.activeEditor.isWaiting()) {
          this.closeEditorAndSaveChanges(ctrlDown);
        }
        this.moveSelectionUp(event.shiftKey);

        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.ARROW_DOWN:
        if (this.isEditorOpened() && !this.activeEditor.isWaiting()) {
          this.closeEditorAndSaveChanges(ctrlDown);
        }

        this.moveSelectionDown(event.shiftKey);

        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.ARROW_RIGHT:
        if (this.isEditorOpened() && !this.activeEditor.isWaiting()) {
          this.closeEditorAndSaveChanges(ctrlDown);
        }

        this.moveSelectionRight(event.shiftKey);

        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.ARROW_LEFT:
        if (this.isEditorOpened() && !this.activeEditor.isWaiting()) {
          this.closeEditorAndSaveChanges(ctrlDown);
        }

        this.moveSelectionLeft(event.shiftKey);

        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.TAB:
        tabMoves = typeof this.priv.settings.tabMoves === 'function' ? this.priv.settings.tabMoves(event) : this.priv.settings.tabMoves;

        if (event.shiftKey) {
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
            this.closeEditorAndSaveChanges(ctrlDown);
          }
          this.moveSelectionAfterEnter(event.shiftKey);

        } else if (this.instance.getSettings().enterBeginsEditing) {
          if (this.activeEditor) {
            this.activeEditor.enableFullEditMode();
          }
          this.openEditor(null, event);

        } else {
          this.moveSelectionAfterEnter(event.shiftKey);
        }
        event.preventDefault(); // don't add newline to field
        stopImmediatePropagation(event); // required by HandsontableEditor
        break;

      case KEY_CODES.ESCAPE:
        if (this.isEditorOpened()) {
          this.closeEditorAndRestoreOriginalValue(ctrlDown);

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
