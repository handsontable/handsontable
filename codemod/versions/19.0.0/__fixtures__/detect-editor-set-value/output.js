import Handsontable from 'handsontable';

// TODO(handsontable-codemod 19.0.0/editor-set-value): Check the setValue() method of this custom editor. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-custom-editors-setvalue-receives-the-cell-value
class MyEditor extends Handsontable.editors.BaseEditor {
  setValue(value) {
    this.input.value = value;
  }
}

// TODO(handsontable-codemod 19.0.0/editor-set-value): Check the setValue() method of this custom editor. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-custom-editors-setvalue-receives-the-cell-value
export const RatingEditor = Handsontable.editors.editorFactory({
  init(editor) {},
});

// An editor that extends TextEditor stringifies inside setValue(), so it is not reported.
class Upper extends Handsontable.editors.TextEditor {}
