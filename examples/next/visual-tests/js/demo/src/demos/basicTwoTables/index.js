import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../test-license-key';

export function init() {
  const root = document.getElementById('root');

  const topTable = document.createElement('div');
  topTable.id = 'tableTop';

  const input1 = document.createElement('input');
  input1.style.margin = '10px 0';
  input1.placeholder = 'Input 1';
  topTable.appendChild(input1);

  const example1 = document.createElement('div');
  topTable.appendChild(example1);

  root.appendChild(topTable);

  const bottomTable = document.createElement('div');
  bottomTable.id = 'tableBottom';

  const input2 = document.createElement('input');
  input2.style.margin = '10px 0';
  input2.placeholder = 'Input 2';
  bottomTable.appendChild(input2);

  const example2 = document.createElement('div');
  bottomTable.appendChild(example2);

  root.appendChild(bottomTable);

  new Handsontable(example1, {
    data: Handsontable.helper.createSpreadsheetData(5, 5),
    height: 'auto',
    licenseKey: TEST_LICENSE_KEY,
  });

  new Handsontable(example2, {
    data: Handsontable.helper.createSpreadsheetData(30, 5),
    height: '200px',
    licenseKey: TEST_LICENSE_KEY,
  });

  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
