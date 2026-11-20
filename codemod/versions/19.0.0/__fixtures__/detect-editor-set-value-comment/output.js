import Handsontable from 'handsontable';

// A custom editor that extends BaseEditor is described here, not written.
// TODO(handsontable-codemod 19.0.0/editor-set-value): Check the setValue() method of this custom editor. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-custom-editors-setvalue-receives-the-cell-value
export class MyEditor extends Handsontable.editors.BaseEditor {}
