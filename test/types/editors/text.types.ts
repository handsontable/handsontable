import * as Handsontable from 'handsontable';

class TextEditor extends Handsontable.editors.TextEditor {
  init() {
    super.init();
  }

  prepare(row: number, col: number, prop: string | number, td: HTMLElement, originalValue: any, cellProperties: Handsontable.GridSettings) {
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

  setValue(value: any) {
    super.setValue(value);
  }

  beginEditing(newInitialValue?: any) {
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
