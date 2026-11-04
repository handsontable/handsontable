// `handsontable/base` registers the text cell type, which is all this grid needs.
import Handsontable from 'handsontable/base';
import { getThemeNameFromURL, getFromURL } from '../../utils';
import { LICENSE_KEYS } from './keys';

/**
 * Visual regression demo: a small grid built with a license key that shows the "Powered by
 * Handsontable DataGrid" bar under it, chosen by `?key=` (`badge` or `trial`, see `./keys.js`). The grid
 * is 480 px wide so the bar's text stays on one line, and it has row and column headers so a trial's
 * corner badge has its corner cell.
 */
export function init() {
  const keyName = getFromURL('key', 'badge');

  if (!Object.prototype.hasOwnProperty.call(LICENSE_KEYS, keyName)) {
    throw new Error(`Unknown ?key= value: ${JSON.stringify(keyName)}`);
  }

  const root = document.getElementById('root');
  const example = document.createElement('div');

  root.appendChild(example);

  new Handsontable(example, {
    data: [
      ['Tesla', 'Model 3', 2021, 'Blue'],
      ['Ford', 'Mustang', 2019, 'Red'],
      ['Toyota', 'Corolla', 2022, 'White'],
      ['Honda', 'Civic', 2020, 'Black'],
      ['Volvo', 'XC40', 2023, 'Gray'],
    ],
    colHeaders: ['Brand', 'Model', 'Year', 'Color'],
    rowHeaders: true,
    width: 480,
    height: 'auto',
    themeName: getThemeNameFromURL(),
    licenseKey: LICENSE_KEYS[keyName],
  });
}
