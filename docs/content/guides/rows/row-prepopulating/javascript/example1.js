import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const templateValues = ['one', 'two', 'three'];
const data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13],
];

function isEmptyRow(instance, row) {
  const rowData = instance.getDataAtRow(row);

  for (let i = 0, ilen = rowData.length; i < ilen; i++) {
    if (rowData[i] !== null) {
      return false;
    }
  }

  return true;
}

const defaultValueRenderer = (
  instance,
  td,
  row,
  col,
  prop,
  value,
  cellProperties
) => {
  if (value === null && isEmptyRow(instance, row)) {
    value = templateValues[col];
    td.style.color = '#999';
  } else {
    td.style.color = '';
  }

  Handsontable.renderers.TextRenderer(
    instance,
    td,
    row,
    col,
    prop,
    value,
    cellProperties
  );
};

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  startRows: 8,
  startCols: 5,
  minSpareRows: 1,
  contextMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  cells() {
    return { renderer: defaultValueRenderer };
  },
  beforeChange(changes) {
    const instance = hot;
    const columns = instance.countCols();
    const rowColumnSeen = {};
    const rowsToFill = {};
    const ch = changes === null ? [] : changes;

    for (let i = 0; i < changes.length; i++) {
      // if oldVal is empty
      if (ch[i][2] === null && ch[i][3] !== null) {
        if (isEmptyRow(instance, ch[i][0])) {
          // add this row/col combination to the cache so it will not be overwritten by the template
          rowColumnSeen[`${ch[i][0]}/${ch[i][1]}`] = true;
          rowsToFill[ch[i][0]] = true;
        }
      }
    }

    for (const r in rowsToFill) {
      if (rowsToFill.hasOwnProperty(r)) {
        for (let c = 0; c < columns; c++) {
          // if it is not provided by user in this change set, take the value from the template
          if (!rowColumnSeen[`${r}/${c}`]) {
            changes.push([Number(r), c, null, templateValues[c]]);
          }
        }
      }
    }
  },
  autoWrapRow: true,
  autoWrapCol: true,
});

// or, use `updateData()` to replace `data` without resetting states
hot.loadData(data);
