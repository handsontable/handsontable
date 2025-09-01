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
    fixedColumnsStart: 2,
    fixedRowsTop: 2,
    fixedRowsBottom: 2,
    themeName: getThemeNameFromURL(),
    height: 500,
    width: 500,
    autoRowSize: true,
    contextMenu: true,
    licenseKey: 'non-commercial-and-evaluation',
  });
  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
