import { isFunctionKey, isCtrlMetaKey } from './helpers/unicode';
import { stopImmediatePropagation } from './helpers/dom/event';
import { getEditorInstance } from './editors/registry';
import EventManager from './eventManager';
import { isDefined } from './helpers/mixed';

export const SHORTCUTS_GROUP_NAVIGATION = 'editorManager.navigation';
export const SHORTCUTS_GROUP_EDITOR = 'editorManager.handlingEditor';

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
     * @type {BaseEditor}
     */
    this.activeEditor = void 0;
    /**
     * Keeps a reference to the cell's properties object.
     *
     * @type {object}
     */
    this.cellProperties = void 0;

    const shortcutManager = this.instance.getShortcutManager();

    shortcutManager.addContext('editor');

    this.registerShortcuts();

    this.instance.addHook('afterDocumentKeyDown', event => this.onAfterDocumentKeyDown(event));

    // Open editor when text composition is started (IME editor)
    this.eventManager.addEventListener(this.instance.rootDocument.documentElement, 'compositionstart', (event) => {
      if (!this.destroyed && this.instance.isListening()) {
        this.openEditor('', event);
      }
    });

    this.instance.view._wt.update('onCellDblClick', (event, coords, elem) => this.onCellDblClick(event, coords, elem));
  }

  /**
   * Register shortcuts responsible for handling some actions related to an editor.
   *
   * @private
   */
  registerShortcuts() {
    const shortcutManager = this.instance.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    const editorContext = shortcutManager.getContext('editor');
    const config = { group: SHORTCUTS_GROUP_EDITOR };

    editorContext.addShortcuts([{
      keys: [['Enter'], ['Enter', 'Shift'], ['Enter', 'Control/Meta'], ['Enter', 'Control/Meta', 'Shift']],
      callback: (event, keys) => {
        this.closeEditorAndSaveChanges(shortcutManager.isCtrlPressed());
        this.moveSelectionAfterEnter(keys.includes('shift'));
      }
    }, {
      keys: [['Escape'], ['Escape', 'Control/Meta']],
      callback: () => {
        this.closeEditorAndRestoreOriginalValue(shortcutManager.isCtrlPressed());
        this.activeEditor.focus();
      },
    }], config);

    gridContext.addShortcuts([{
      keys: [['F2']],
      callback: (event) => {
        this.openEditor(null, event, true);
      },
    }, {
      keys: [['Backspace'], ['Delete']],
      callback: () => {
        this.instance.emptySelectedCells();
        this.prepareEditor();
      },
    }, {
      keys: [['Enter'], ['Enter', 'Shift']],
      callback: (event, keys) => {
        if (this.instance.getSettings().enterBeginsEditing) {
          if (this.cellProperties.readOnly) {
            this.moveSelectionAfterEnter();

          } else {
            this.openEditor(null, event, true);
          }

        } else {
          this.moveSelectionAfterEnter(keys.includes('shift'));
        }

        stopImmediatePropagation(event); // required by HandsontableEditor
      },
    }], config);
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
   * @returns {BaseEditor}
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

    const { row, col } = this.instance.getSelectedRangeLast().highlight;
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
      // Blurring the activeElement removes unwanted border around the focusable element
      // (and resets activeElement prop). Without blurring the activeElement points to the
      // previously focusable element after clicking onto the cell (#6877).
      activeElement.blur();
    }

    if (!this.isCellEditable()) {
      this.clearActiveEditor();

      return;
    }

    const td = this.instance.getCell(row, col, true);

    // Skip the preparation when the cell is not rendered in the DOM. The cell is scrolled out of
    // the table's viewport.
    if (td) {
      const editorClass = this.instance.getCellEditor(this.cellProperties);
      const prop = this.instance.colToProp(visualColumnToCheck);
      const originalValue =
        this.instance.getSourceDataAtCell(this.instance.toPhysicalRow(visualRowToCheck), visualColumnToCheck);

      this.activeEditor = getEditorInstance(editorClass, this.instance);
      // Using not modified coordinates, as we need to get the table element using selection coordinates.
      // There is an extra translation in the editor for saving value.
      this.activeEditor.prepare(row, col, prop, td, originalValue, this.cellProperties);
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
   * @param {boolean} [enableFullEditMode=false] When true, an editor works in full editing mode. Mode disallows closing an editor
   *                                             when arrow keys are pressed.
   */
  openEditor(newInitialValue, event, enableFullEditMode = false) {
    if (!this.isCellEditable()) {
      this.clearActiveEditor();

      return;
    }

    if (!this.activeEditor) {
      const { row, col } = this.instance.getSelectedRangeLast().highlight;
      const renderableRowIndex = this.instance.rowIndexMapper.getRenderableFromVisualIndex(row);
      const renderableColumnIndex = this.instance.columnIndexMapper.getRenderableFromVisualIndex(col);

      this.instance.view.scrollViewport(this.instance._createCellCoords(renderableRowIndex, renderableColumnIndex));
      this.instance.view.render();
      this.prepareEditor();
    }

    if (this.activeEditor) {
      if (enableFullEditMode) {
        this.activeEditor.enableFullEditMode();
      }

      this.activeEditor.beginEditing(newInitialValue, event);
    }
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
   * It checks if the currently selected cell (pointed by selection highlight coords) is editable.
   * Meaning of the editable cell:
   *   - the cell has defined an editor type;
   *   - the cell is not marked as read-only;
   *   - the cell is not hidden.
   *
   * @private
   * @returns {boolean}
   */
  isCellEditable() {
    const editorClass = this.instance.getCellEditor(this.cellProperties);
    const { row, col } = this.instance.getSelectedRangeLast().highlight;
    const {
      rowIndexMapper,
      columnIndexMapper
    } = this.instance;
    const isCellHidden = rowIndexMapper.isHidden(this.instance.toPhysicalRow(row)) ||
      columnIndexMapper.isHidden(this.instance.toPhysicalColumn(col));

    if (this.cellProperties.readOnly || !editorClass || isCellHidden) {
      return false;
    }

    return true;
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
   * OnAfterDocumentKeyDown callback.
   *
   * @private
   * @param {KeyboardEvent} event The keyboard event object.
   */
  onAfterDocumentKeyDown(event) {
    if (!this.instance.isListening()) {
      return;
    }

    const { keyCode } = event;

    if (!this.selection.isSelected()) {
      return;
    }

    // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    const isCtrlPressed = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (this.activeEditor && !this.activeEditor.isWaiting()) {
      if (!isFunctionKey(keyCode) && !isCtrlMetaKey(keyCode) && !isCtrlPressed && !this.isEditorOpened()) {
        const shortcutManager = this.instance.getShortcutManager();
        const editorContext = shortcutManager.getContext('editor');
        const runOnlySelectedConfig = {
          runOnlyIf: () => isDefined(this.instance.getSelected()),
          group: SHORTCUTS_GROUP_NAVIGATION
        };

        editorContext.addShortcuts([{
          keys: [['ArrowUp']],
          callback: () => {
            this.instance.selection.transformStart(-1, 0);
          },
        }, {
          keys: [['ArrowDown']],
          callback: () => {
            this.instance.selection.transformStart(1, 0);
          },
        }, {
          keys: [['ArrowLeft']],
          callback: () => {
            this.instance.selection.transformStart(0, -1 * this.instance.getDirectionFactor());
          },
        }, {
          keys: [['ArrowRight']],
          callback: () => {
            this.instance.selection.transformStart(0, this.instance.getDirectionFactor());
          },
        }], runOnlySelectedConfig);

        this.openEditor('', event);
      }
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
      this.openEditor(null, event, true);
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
