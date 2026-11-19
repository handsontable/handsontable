import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { getDirectionFromURL, getThemeNameFromURL } from '../../utils';
import { TEST_LICENSE_KEY } from '../../test-license-key';

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
    moveCells: true,
    licenseKey: TEST_LICENSE_KEY,
  });

  // Pre-select an interior range so the move zone bands are immediately
  // visible and the drag can be initiated without an extra click.
  hot.selectCells([[2, 2, 4, 4]]);

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
