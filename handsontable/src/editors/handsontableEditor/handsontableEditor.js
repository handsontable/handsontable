import { TextEditor } from '../textEditor';
import { setCaretPosition } from '../../helpers/dom/element';
import {
  stopImmediatePropagation,
  isImmediatePropagationStopped,
} from '../../helpers/dom/event';
import { KEY_CODES } from '../../helpers/unicode';
import { extend } from '../../helpers/object';

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
    // this.addHook('beforeKeyDown', event => this.onBeforeKeyDown(event));

    super.open();

    if (this.htEditor) {
      this.htEditor.destroy();
    }

    if (this.htContainer.style.display === 'none') {
      this.htContainer.style.display = '';
    }

    // Construct and initialise a new Handsontable
    this.htEditor = new this.hot.constructor(this.htContainer, this.htOptions);
    this.htEditor.init();
    this.htEditor.rootElement.style.display = '';

    if (this.cellProperties.strict) {
      this.htEditor.selectCell(0, 0);
    } else {
      this.htEditor.deselectCell();
    }

    setCaretPosition(this.TEXTAREA, 0, this.TEXTAREA.value.length);
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
   * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
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
      afterOnCellMouseDown(_, coords) {
        const sourceValue = this.getSourceData(coords.row, coords.col);

        // if the value is undefined then it means we don't want to set the value
        if (sourceValue !== void 0) {
          parent.setValue(sourceValue);
        }
        parent.instance.destroyEditor();
      },
      preventWheel: true,
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
      const value = this.htEditor.getInstance().getValue();

      if (value !== void 0) { // if the value is undefined then it means we don't want to set the value
        this.setValue(value);
      }
    }

    super.finishEditing(restoreOriginalValue, ctrlDown, callback);
  }

  /**
   * Assings afterDestroy callback to prevent memory leaks.
   *
   * @private
   */
  assignHooks() {
    this.hot.addHook('afterDestroy', () => {
      if (this.htEditor) {
        this.htEditor.destroy();
      }
    });
  }

  /**
   * OnBeforeKeyDown callback.
   *
   * @private
   * @param {Event} event The keyboard event object.
   */
  onBeforeKeyDown(event) {
    if (isImmediatePropagationStopped(event)) {
      return;
    }

    const innerHOT = this.htEditor.getInstance();

    let rowToSelect;
    let selectedRow;

    if (event.keyCode === KEY_CODES.ARROW_DOWN) {
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

    } else if (event.keyCode === KEY_CODES.ARROW_UP) {
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
    }

    if (rowToSelect !== void 0) {
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
      }
    }

    super.onBeforeKeyDown(event);
  }
}
