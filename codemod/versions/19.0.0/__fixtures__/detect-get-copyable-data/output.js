import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]] });

// TODO(handsontable-codemod 19.0.0/get-copyable-data): Check how this code uses the result of getCopyableData(). See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#getcopyabledata-returns-a-string
if (hot.getCopyableData(0, 0) === 1) {
  hot.setDataAtCell(0, 1, 'Approved');
}

// Not a grid instance.
const store = { getCopyableData() {} };

store.getCopyableData();
