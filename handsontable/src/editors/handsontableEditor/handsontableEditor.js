import { TextEditor } from '../textEditor';
import { setCaretPosition } from '../../helpers/dom/element';
import {
  stopImmediatePropagation,
} from '../../helpers/dom/event';
import { extend } from '../../helpers/object';
import { EDITOR_EDIT_GROUP } from '../../shortcutContexts';

const SHORTCUTS_GROUP = 'handsontableEditor';

export const EDITOR_TYPE = 'handsontable';

/**
 * @private
 * @class HandsontableEditor
 */
export class HandsontableEditor extends TextEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * Opens the editor and adjust its size.
   */
  open() {
    super.open();

    const containerStyle = this.htContainer.style;

    if (this.htEditor) {
      this.htEditor.destroy();
      containerStyle.width = '';
      containerStyle.height = '';
      containerStyle.overflow = '';
    }

    if (containerStyle.display === 'none') {
      containerStyle.display = '';
    }

    // Constructs and initializes a new Handsontable instance
    this.htEditor = new this.hot.constructor(this.htContainer, this.htOptions);
    this.htEditor.init();
    this.htEditor.rootElement.style.display = '';

    if (this.cellProperties.strict) {
      this.htEditor.selectCell(0, 0);
    } else {
      this.htEditor.deselectCell();
    }

    setCaretPosition(this.TEXTAREA, 0, this.TEXTAREA.value.length);

    this.htEditor.updateSettings({
      width: this.getWidth(),
      height: this.getHeight(),
    });

    this.refreshDimensions();
  }

  /**
   * Closes the editor.
   */
  close() {
    if (this.htEditor) {
      this.htEditor.rootElement.style.display = 'none';
    }

    this.removeHooksByKey('beforeKeyDown');
    super.close();
  }

  /**
   * Prepares editor's meta data and configuration of the internal Handsontable's instance.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number|string} prop The column property (passed when datasource is an array of objects).
   * @param {HTMLTableCellElement} td The rendered cell element.
   * @param {*} value The rendered value.
   * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
   */
  prepare(row, col, prop, td, value, cellProperties) {
    super.prepare(row, col, prop, td, value, cellProperties);

    const parent = this;
    const options = {
      startRows: 0,
      startCols: 0,
      minRows: 0,
      minCols: 0,
      className: 'listbox',
      copyPaste: false,
      autoColumnSize: false,
      autoRowSize: false,
      readOnly: true,
      fillHandle: false,
      autoWrapCol: false,
      autoWrapRow: false,
      ariaTags: false,
      themeName: this.hot.getCurrentThemeName(),
      afterOnCellMouseDown(_, coords) {
        const sourceValue = this.getSourceData(coords.row, coords.col);

        // if the value is undefined then it means we don't want to set the value
        if (sourceValue !== undefined) {
          parent.setValue(sourceValue);
        }
        parent.hot.destroyEditor();
      },
      preventWheel: true,
      layoutDirection: this.hot.isRtl() ? 'rtl' : 'ltr',
    };

    if (this.cellProperties.handsontable) {
      extend(options, cellProperties.handsontable);
    }
    this.htOptions = options;
  }

  /**
   * Begins editing on a highlighted cell and hides fillHandle corner if was present.
   *
   * @param {*} newInitialValue The editor initial value.
   * @param {*} event The keyboard event object.
   */
  beginEditing(newInitialValue, event) {
    const onBeginEditing = this.hot.getSettings().onBeginEditing;

    if (onBeginEditing && onBeginEditing() === false) {
      return;
    }

    super.beginEditing(newInitialValue, event);
  }

  /**
   * Creates an editor's elements and adds necessary CSS classnames.
   */
  createElements() {
    super.createElements();

    const DIV = this.hot.rootDocument.createElement('DIV');

    DIV.className = 'handsontableEditor';
    this.TEXTAREA_PARENT.appendChild(DIV);

    this.htContainer = DIV;
    this.assignHooks();
  }

  /**
   * Finishes editing and start saving or restoring process for editing cell or last selected range.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in the last selected range.
   * @param {Function} callback The callback function, fired after editor closing.
   */
  finishEditing(restoreOriginalValue, ctrlDown, callback) {
    if (this.htEditor && this.htEditor.isListening()) { // if focus is still in the HOT editor
      this.hot.listen(); // return the focus to the parent HOT instance
    }

    if (this.htEditor && this.htEditor.getSelectedLast()) {
      const value = this.htEditor.getValue();

      if (value !== undefined) { // if the value is undefined then it means we don't want to set the value
        this.setValue(value);
      }
    }

    super.finishEditing(restoreOriginalValue, ctrlDown, callback);
  }

  /**
   * Calculates and return the internal Handsontable's height.
   *
   * @private
   * @returns {number}
   */
  getHeight() {
    return this.htEditor.view.getTableHeight() + 1;
  }

  /**
   * Calculates and return the internal Handsontable's width.
   *
   * @private
   * @returns {number}
   */
  getWidth() {
    return this.htEditor.view.getTableWidth();
  }

  /**
   * Assigns afterDestroy callback to prevent memory leaks.
   *
   * @private
   */
  assignHooks() {
    this.hot.addHook('afterDestroy', () => {
      this.htEditor?.destroy();
    });

    this.hot.addHook('afterSetTheme', (themeName, firstRun) => {
      if (!firstRun) {
        this.htEditor?.useTheme(themeName);
      }
    });
  }

  /**
   * Register shortcuts responsible for handling editor.
   *
   * @private
   */
  registerShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    super.registerShortcuts();

    const contextConfig = {
      group: SHORTCUTS_GROUP,
      relativeToGroup: EDITOR_EDIT_GROUP,
      position: 'before',
    };

    const action = (rowToSelect, event) => {
      const innerHOT = this.htEditor;

      if (rowToSelect !== undefined) {
        if (rowToSelect < 0 || (innerHOT.flipped && rowToSelect > innerHOT.countRows() - 1)) {
          innerHOT.deselectCell();
        } else {
          innerHOT.selectCell(rowToSelect, 0);
        }
        if (innerHOT.getData().length) {
          event.preventDefault();
          stopImmediatePropagation(event);

          this.hot.listen();
          this.TEXTAREA.focus();

          return false;
        }
      }
    };

    editorContext.addShortcuts([{
      keys: [['ArrowUp']],
      callback: (event) => {
        const innerHOT = this.htEditor;
        let rowToSelect;
        let selectedRow;

        if (!innerHOT.getSelectedLast() && innerHOT.flipped) {
          rowToSelect = innerHOT.countRows() - 1;

        } else if (innerHOT.getSelectedLast()) {
          if (innerHOT.flipped) {
            selectedRow = innerHOT.getSelectedLast()[0];
            rowToSelect = Math.max(0, selectedRow - 1);
          } else {
            selectedRow = innerHOT.getSelectedLast()[0];
            rowToSelect = selectedRow - 1;
          }
        }

        return action(rowToSelect, event);
      },
      preventDefault: false, // Doesn't block default behaviour (navigation) for a `textArea` HTMLElement.
    }, {
      keys: [['ArrowDown']],
      callback: (event) => {
        const innerHOT = this.htEditor;
        let rowToSelect;
        let selectedRow;

        if (!innerHOT.getSelectedLast() && !innerHOT.flipped) {
          rowToSelect = 0;

        } else if (innerHOT.getSelectedLast()) {
          if (innerHOT.flipped) {
            rowToSelect = innerHOT.getSelectedLast()[0] + 1;

          } else if (!innerHOT.flipped) {
            const lastRow = innerHOT.countRows() - 1;

            selectedRow = innerHOT.getSelectedLast()[0];
            rowToSelect = Math.min(lastRow, selectedRow + 1);
          }
        }

        return action(rowToSelect, event);
      },
      preventDefault: false, // Doesn't block default behaviour (navigation) for a `textArea` HTMLElement.
    }], contextConfig);
  }

  /**
   * Unregister shortcuts responsible for handling editor.
   *
   * @private
   */
  unregisterShortcuts() {
    super.unregisterShortcuts();

    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }
}
