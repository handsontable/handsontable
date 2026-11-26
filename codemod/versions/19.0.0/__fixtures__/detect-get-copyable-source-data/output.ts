import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid')!, { data: [['a']], licenseKey: 'my-own-key' });

// TODO(handsontable-codemod 19.0.0/get-copyable-source-data): Check how this code uses the result of getCopyableSourceData(). See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#getcopyabledata-returns-a-string
const value = hot.getCopyableSourceData(0, 0);

// Narrowed first, so the result is a string.
if (typeof value === 'string') {
  hot.setDataAtCell(0, 1, value.trim());
}

// Not a grid instance.
const store = { getCopyableSourceData() { return ''; } };

store.getCopyableSourceData();
