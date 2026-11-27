import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid')!, { data: [['a']], licenseKey: 'my-own-key' });

const value = hot.getCopyableSourceData(0, 0);

// Narrowed first, so the result is a string.
if (typeof value === 'string') {
  hot.setDataAtCell(0, 1, value.trim());
}

// Not a grid instance.
const store = { getCopyableSourceData() { return ''; } };

store.getCopyableSourceData();
