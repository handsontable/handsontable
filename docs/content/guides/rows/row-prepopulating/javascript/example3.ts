import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { BaseRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';

// Register all Handsontable's modules.
registerAllModules();

const templateValues: string[] = ['one', 'two', 'three'];
const data: (string | number)[][] = [
  ['Hydrogen', 'H', 1, 1.008, 7],
  ['Helium', 'He', 2, 4.003, 9],
  ['Lithium', 'Li', 3, 6.94, 9],
  ['Beryllium', 'Be', 4, 9.012, 11],
  ['Boron', 'B', 5, 10.81, 15],
];

function isEmptyRow(instance: Handsontable, row: number) {
  const rowData = instance.getDataAtRow(row);

  for (let i = 0, ilen = rowData.length; i < ilen; i++) {
    if (rowData[i] !== null) {
      return false;
    }
  }

  return true;
}

const defaultValueRenderer: BaseRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  if (value === null && isEmptyRow(instance, row)) {
    value = templateValues[col];
    td.style.color = '#999';
  } else {
    td.style.color = '';
  }

  textRenderer(instance, td, row, col, prop, value, cellProperties);
};

const container = document.querySelector('#example3')!;

const hot = new Handsontable(container, {
  startRows: 8,
  startCols: 5,
  colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes'],
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
    const ch = changes === null ? [] : (changes as Handsontable.CellChange);

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
