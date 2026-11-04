import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { getDirectionFromURL, getThemeNameFromURL } from '../../utils';

export function init() {
  registerAllModules();

  const root = document.getElementById('root');
  const example = document.createElement('div');

  root.appendChild(example);

  const hot = new Handsontable(example, {
    layoutDirection: getDirectionFromURL(),
    themeName: getThemeNameFromURL(),
    data: Handsontable.helper.createSpreadsheetData(10, 8),
    rowHeaders: true,
    colHeaders: true,
    width: 500,
    height: 300,
    selectionHandles: true,
    selectionMode: 'multiple',
    licenseKey: 'non-commercial-and-evaluation',
  });

  // Pre-select an interior range so handles are immediately available on hover.
  hot.selectCells([[2, 2, 5, 4]]);

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
