import type { HotInstance } from 'handsontable';
import { TextEditor } from 'handsontable/editors';

interface CellProperties {
  row: number;
  col: number;
  instance: HotInstance;
  visualRow: number;
  visualCol: number;
  prop: string | number;
  [key: string]: unknown;
}

class CustomTextEditor extends TextEditor {
  init() {
    super.init();
  }

  prepare(row: number, col: number, prop: string | number, td: HTMLTableCellElement,
          originalValue: unknown, cellProperties: CellProperties) {
    super.prepare(row, col, prop, td, originalValue, cellProperties);
  }

  hideEditableElement() {
    super.hideEditableElement();
  }

  showEditableElement() {
    super.showEditableElement();
  }

  getValue() {
    super.getValue();
  }

  setValue(value?: unknown) {
    super.setValue(value);
  }

  beginEditing(newInitialValue?: unknown) {
    super.beginEditing(newInitialValue);
  }

  open() {
    super.open();
  }

  close() {
    super.close();
  }

  focus() {
    super.focus();
  }

  createElements() {
    super.createElements();
  }

  getEditedCell() {
    const editedCell = super.getEditedCell();

    return editedCell;
  }

  refreshValue() {
    super.refreshValue();
  }

  refreshDimensions(force: boolean = false) {
    super.refreshDimensions(force);
  }

  bindEvents() {
    super.bindEvents();
  }
}
