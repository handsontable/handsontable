import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { stopImmediatePropagation } from 'handsontable/helpers/dom/event';
// Register all Handsontable's modules.
registerAllModules();
let lastChange = null;
const container = document.querySelector('#example2');
const hot = new Handsontable(container, {
  data: [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'yellow', 'gray'],
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  minSpareRows: 1,
  beforeChange(changes) {
    lastChange = changes;
  },
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
hot.updateSettings({
  beforeKeyDown(e) {
    const selected = hot.getSelected();
    if (!selected)
      return;
    const selection = selected[0];
    // Ignore header and corner selections (row or column index < 0)
    if (selection[0] < 0 || selection[1] < 0)
      return;
    console.log(selection);
    // BACKSPACE or DELETE
    if (e.keyCode === 8 || e.keyCode === 46) {
      stopImmediatePropagation(e);
      // remove data at cell, shift up
      hot.spliceCol(selection[1], selection[0], 1);
      e.preventDefault();
    }
    // ENTER
    else if (e.keyCode === 13) {
      // if last change affected a single cell and did not change it's values
      if (lastChange && lastChange.length === 1 && lastChange[0][2] == lastChange[0][3]) {
        stopImmediatePropagation(e);
        hot.spliceCol(selection[1], selection[0], 0, '');
        // add new cell
        hot.selectCell(selection[0], selection[1]);
        // select new cell
      }
    }
    lastChange = null;
  },
});
