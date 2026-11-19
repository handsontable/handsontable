import Handsontable from 'handsontable';
import { getThemeNameFromURL } from '../../utils';
import { TEST_LICENSE_KEY } from '../../test-license-key';

export function init() {
  const root = document.getElementById('root');

  const container = document.createElement('div');
  container.id = 'hot';

  root.appendChild(container);

  new Handsontable(container, {
    data: Handsontable.helper.createSpreadsheetData(150, 150),
    colHeaders: true,
    rowHeaders: true,
    themeName: getThemeNameFromURL(),
    height: 500,
    width: 500,
    contextMenu: true,
    licenseKey: TEST_LICENSE_KEY,
  });
  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
