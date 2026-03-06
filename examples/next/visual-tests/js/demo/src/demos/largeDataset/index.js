import Handsontable from 'handsontable';
import { getThemeNameFromURL } from '../../utils';

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
    licenseKey: 'non-commercial-and-evaluation',
  });
  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
