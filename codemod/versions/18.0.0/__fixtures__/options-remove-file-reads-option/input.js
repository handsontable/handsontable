import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  columns: [{ data: 'a', type: 'date', correctFormat: true, datePickerConfig: {} }],
});

// A custom editor of the project reads the option, so the tool keeps both.
function configOf(editor) {
  return editor.cellProperties.datePickerConfig ?? {};
}

const { correctFormat } = hot.getCellMeta(0, 0);
