import { CellCoords } from './3rdparty/walkontable/src';
import { KEY_CODES, isMetaKey, isCtrlMetaKey } from './helpers/unicode';
import { stopPropagation, stopImmediatePropagation, isImmediatePropagationStopped } from './helpers/dom/event';
import { getEditorInstance } from './editors';
import EventManager from './eventManager';
import { EditorState } from './editors/_baseEditor';

function EditorManager(instance, priv, selection) {
  const _this = this;
  const eventManager = new EventManager(instance);
  let destroyed = false;
  let lock = false;
  let activeEditor;

  function moveSelectionAfterEnter(shiftKey) {
    const enterMoves = typeof priv.settings.enterMoves === 'function' ? priv.settings.enterMoves(event) : priv.settings.enterMoves;

    if (shiftKey) {
      // move selection up
      selection.transformStart(-enterMoves.row, -enterMoves.col);
    } else {
      // move selection down (add a new row if needed)
      selection.transformStart(enterMoves.row, enterMoves.col, true);
    }
  }

  function moveSelectionUp(shiftKey) {
    if (shiftKey) {
      selection.transformEnd(-1, 0);
    } else {
      selection.transformStart(-1, 0);
    }
  }

  function moveSelectionDown(shiftKey) {
    if (shiftKey) {
      // expanding selection down with shift
      selection.transformEnd(1, 0);
    } else {
      selection.transformStart(1, 0);
    }
  }

  function moveSelectionRight(shiftKey) {
    if (shiftKey) {
      selection.transformEnd(0, 1);
    } else {
      selection.transformStart(0, 1);
    }
  }

  function moveSelectionLeft(shiftKey) {
    if (shiftKey) {
      selection.transformEnd(0, -1);
    } else {
      selection.transformStart(0, -1);
    }
  }

  function onKeyDown(event) {
    if (!instance.isListening()) {
      return;
    }
    instance.runHooks('beforeKeyDown', event);

    // keyCode 229 aka 'uninitialized' doesn't take into account with editors. This key code is produced when unfinished
    // character is entering (using IME editor). It is fired mainly on linux (ubuntu) with installed ibus-pinyin package.
    if (destroyed || event.keyCode === 229) {
      return;
    }
    if (isImmediatePropagationStopped(event)) {
      return;
    }
    priv.lastKeyCode = event.keyCode;

    if (!selection.isSelected()) {
      return;
    }
    // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    const ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (activeEditor && !activeEditor.isWaiting()) {
      if (!isMetaKey(event.keyCode) && !isCtrlMetaKey(event.keyCode) && !ctrlDown && !_this.isEditorOpened()) {
        _this.openEditor('', event);

        return;
      }
    }
    const rangeModifier = event.shiftKey ? selection.setRangeEnd : selection.setRangeStart;
    let tabMoves;

    switch (event.keyCode) {
      case KEY_CODES.A:
        if (!_this.isEditorOpened() && ctrlDown) {
          instance.selectAll();

          event.preventDefault();
          stopPropagation(event);
        }
        break;

      case KEY_CODES.ARROW_UP:
        if (_this.isEditorOpened() && !activeEditor.isWaiting()) {
          _this.closeEditorAndSaveChanges(ctrlDown);
        }
        moveSelectionUp(event.shiftKey);

        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.ARROW_DOWN:
        if (_this.isEditorOpened() && !activeEditor.isWaiting()) {
          _this.closeEditorAndSaveChanges(ctrlDown);
        }

        moveSelectionDown(event.shiftKey);

        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.ARROW_RIGHT:
        if (_this.isEditorOpened() && !activeEditor.isWaiting()) {
          _this.closeEditorAndSaveChanges(ctrlDown);
        }

        moveSelectionRight(event.shiftKey);

        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.ARROW_LEFT:
        if (_this.isEditorOpened() && !activeEditor.isWaiting()) {
          _this.closeEditorAndSaveChanges(ctrlDown);
        }

        moveSelectionLeft(event.shiftKey);

        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.TAB:
        tabMoves = typeof priv.settings.tabMoves === 'function' ? priv.settings.tabMoves(event) : priv.settings.tabMoves;

        if (event.shiftKey) {
          // move selection left
          selection.transformStart(-tabMoves.row, -tabMoves.col);
        } else {
          // move selection right (add a new column if needed)
          selection.transformStart(tabMoves.row, tabMoves.col, true);
        }
        event.preventDefault();
        stopPropagation(event);
        break;

      case KEY_CODES.BACKSPACE:
      case KEY_CODES.DELETE:
        instance.emptySelectedCells();
        _this.prepareEditor();
        event.preventDefault();
        break;

      case KEY_CODES.F2:
        /* F2 */
        if (activeEditor) {
          activeEditor.enableFullEditMode();
        }
        _this.openEditor(null, event);

        event.preventDefault(); // prevent Opera from opening 'Go to Page dialog'
        break;

      case KEY_CODES.ENTER:
        /* return/enter */
        if (_this.isEditorOpened()) {

          if (activeEditor && activeEditor.state !== EditorState.WAITING) {
            _this.closeEditorAndSaveChanges(ctrlDown);
          }
          moveSelectionAfterEnter(event.shiftKey);

        } else if (instance.getSettings().enterBeginsEditing) {
          if (activeEditor) {
            activeEditor.enableFullEditMode();
          }
          _this.openEditor(null, event);

        } else {
          moveSelectionAfterEnter(event.shiftKey);
        }
        event.preventDefault(); // don't add newline to field
        stopImmediatePropagation(event); // required by HandsontableEditor
        break;

      case KEY_CODES.ESCAPE:
        if (_this.isEditorOpened()) {
          _this.closeEditorAndRestoreOriginalValue(ctrlDown);

          activeEditor.focus();
        }
        event.preventDefault();
        break;

      case KEY_CODES.HOME:
        if (event.ctrlKey || event.metaKey) {
          rangeModifier.call(selection, new CellCoords(0, selection.selectedRange.current().from.col));
        } else {
          rangeModifier.call(selection, new CellCoords(selection.selectedRange.current().from.row, 0));
        }
        event.preventDefault(); // don't scroll the window
        stopPropagation(event);
        break;

      case KEY_CODES.END:
        if (event.ctrlKey || event.metaKey) {
          rangeModifier.call(selection, new CellCoords(instance.countRows() - 1, selection.selectedRange.current().from.col));
        } else {
          rangeModifier.call(selection, new CellCoords(selection.selectedRange.current().from.row, instance.countCols() - 1));
        }
        event.preventDefault(); // don't scroll the window
        stopPropagation(event);
        break;

      case KEY_CODES.PAGE_UP:
        selection.transformStart(-instance.countVisibleRows(), 0);
        event.preventDefault(); // don't page up the window
        stopPropagation(event);
        break;

      case KEY_CODES.PAGE_DOWN:
        selection.transformStart(instance.countVisibleRows(), 0);
        event.preventDefault(); // don't page down the window
        stopPropagation(event);
        break;
      default:
        break;
    }
  }

  function init() {
    instance.addHook('afterDocumentKeyDown', onKeyDown);

    eventManager.addEventListener(document.documentElement, 'keydown', (event) => {
      if (!destroyed) {
        instance.runHooks('afterDocumentKeyDown', event);
      }
    });

    // Open editor when text composition is started (IME editor)
    eventManager.addEventListener(document.documentElement, 'compositionstart', (event) => {
      if (!destroyed && activeEditor && !activeEditor.isOpened() && instance.isListening()) {
        _this.openEditor('', event);
      }
    });

    function onDblClick(event, coords, elem) {
      // may be TD or TH
      if (elem.nodeName === 'TD') {
        if (activeEditor) {
          activeEditor.enableFullEditMode();
        }
        _this.openEditor(null, event);
      }
    }
    instance.view.wt.update('onCellDblClick', onDblClick);
  }

  /**
  * Lock the editor from being prepared and closed. Locking the editor prevents its closing and
  * reinitialized after selecting the new cell. This feature is necessary for a mobile editor.
  *
  * @function lockEditor
  * @memberof! Handsontable.EditorManager#
   */
  this.lockEditor = function() {
    lock = true;
  };

  /**
  * Unlock the editor from being prepared and closed. This method restores the original behavior of
  * the editors where for every new selection its instances are closed.
  *
  * @function unlockEditor
  * @memberof! Handsontable.EditorManager#
   */
  this.unlockEditor = function() {
    lock = false;
  };

  /**
   * Destroy current editor, if exists.
   *
   * @function destroyEditor
   * @memberof! Handsontable.EditorManager#
   * @param {Boolean} revertOriginal
   */
  this.destroyEditor = function(revertOriginal) {
    if (!lock) {
      this.closeEditor(revertOriginal);
    }
  };

  /**
   * Get active editor.
   *
   * @function getActiveEditor
   * @memberof! Handsontable.EditorManager#
   * @returns {*}
   */
  this.getActiveEditor = function() {
    return activeEditor;
  };

  /**
   * Prepare text input to be displayed at given grid cell.
   *
   * @function prepareEditor
   * @memberof! Handsontable.EditorManager#
   */
  this.prepareEditor = function() {
    if (lock) {
      return;
    }

    if (activeEditor && activeEditor.isWaiting()) {
      this.closeEditor(false, false, (dataSaved) => {
        if (dataSaved) {
          _this.prepareEditor();
        }
      });

      return;
    }

    const row = instance.selection.selectedRange.current().highlight.row;
    const col = instance.selection.selectedRange.current().highlight.col;
    const prop = instance.colToProp(col);
    const td = instance.getCell(row, col);
    const originalValue = instance.getSourceDataAtCell(instance.runHooks('modifyRow', row), col);
    const cellProperties = instance.getCellMeta(row, col);
    const editorClass = instance.getCellEditor(cellProperties);

    if (editorClass) {
      activeEditor = getEditorInstance(editorClass, instance);
      activeEditor.prepare(row, col, prop, td, originalValue, cellProperties);

    } else {
      activeEditor = void 0;
    }
  };

  /**
   * Check is editor is opened/showed.
   *
   * @function isEditorOpened
   * @memberof! Handsontable.EditorManager#
   * @returns {Boolean}
   */
  this.isEditorOpened = function() {
    return activeEditor && activeEditor.isOpened();
  };

  /**
   * Open editor with initial value.
   *
   * @function openEditor
   * @memberof! Handsontable.EditorManager#
   * @param {null|String} newInitialValue new value from which editor will start if handled property it's not the `null`.
   * @param {DOMEvent} event
   */
  this.openEditor = function(newInitialValue, event) {
    if (!activeEditor) {
      return;
    }

    const readOnly = activeEditor.cellProperties.readOnly;

    if (readOnly) {
      // move the selection after opening the editor with ENTER key
      if (event && event.keyCode === KEY_CODES.ENTER) {
        moveSelectionAfterEnter();
      }
    } else {
      activeEditor.beginEditing(newInitialValue, event);
    }
  };

  /**
   * Close editor, finish editing cell.
   *
   * @function closeEditor
   * @memberof! Handsontable.EditorManager#
   * @param {Boolean} restoreOriginalValue
   * @param {Boolean} [ctrlDown]
   * @param {Function} [callback]
   */
  this.closeEditor = function(restoreOriginalValue, ctrlDown, callback) {
    if (activeEditor) {
      activeEditor.finishEditing(restoreOriginalValue, ctrlDown, callback);

    } else if (callback) {
      callback(false);
    }
  };

  /**
   * Close editor and save changes.
   *
   * @function closeEditorAndSaveChanges
   * @memberof! Handsontable.EditorManager#
   * @param {Boolean} ctrlDown
   */
  this.closeEditorAndSaveChanges = function(ctrlDown) {
    return this.closeEditor(false, ctrlDown);
  };

  /**
   * Close editor and restore original value.
   *
   * @function closeEditorAndRestoreOriginalValue
   * @memberof! Handsontable.EditorManager#
   * @param {Boolean} ctrlDown
   */
  this.closeEditorAndRestoreOriginalValue = function(ctrlDown) {
    return this.closeEditor(true, ctrlDown);
  };

  /**
   * Destroy the instance.
   */
  this.destroy = function() {
    destroyed = true;
  };

  init();
}

const instances = new WeakMap();

EditorManager.getInstance = function(hotInstance, hotSettings, selection, datamap) {
  let editorManager = instances.get(hotInstance);

  if (!editorManager) {
    editorManager = new EditorManager(hotInstance, hotSettings, selection, datamap);
    instances.set(hotInstance, editorManager);
  }

  return editorManager;
};

export default EditorManager;
