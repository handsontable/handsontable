import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]] });

if (hot.getCopyableData(0, 0) === 1) {
  hot.setDataAtCell(0, 1, 'Approved');
}

// Not a grid instance.
const store = { getCopyableData() {} };

store.getCopyableData();
