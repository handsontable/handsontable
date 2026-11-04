import Handsontable from "handsontable";
import { getDirectionFromURL, getThemeNameFromURL, getFromURL } from "../../utils";
import { registerLanguageDictionary, arAR } from "handsontable/i18n";
import { TEST_LICENSE_KEY } from "../../test-license-key";

export function init() {
  registerLanguageDictionary(arAR);

  const root = document.getElementById('root');
  const example = document.createElement('div');

  root.appendChild(example);

  document.body.style.backgroundColor = 'rgb(128 128 128 / 25%)';

  const height = getFromURL('height', 400);
  const noColumns = getFromURL('noColumns', false);

  const settings = {};

  if (height !== 'undefined') {
    settings.height = height;
  }

  if (noColumns) {
    settings.columns = [];
  } else {
    settings.columns = [
      { data: 1, type: 'text' },
      { data: 2, type: 'text' },
      { data: 3, type: 'text' },
      { data: 4, type: 'date' },
      { data: 5, type: 'text' },
      { data: 6, type: 'checkbox' },
      { data: 7, type: 'numeric' },
    ];
  }

  new Handsontable(example, {
    data: [],
    layoutDirection: getDirectionFromURL(),
    language: getDirectionFromURL() === "rtl" ? arAR.languageCode : "en-US",
    themeName: getThemeNameFromURL(),
    rowHeaders: true,
    colHeaders: [
      'Company name',
      'Country',
      'Name',
      'Sell date',
      'Order ID',
      'In stock',
      'Qty',
    ],
    width: 'auto',
    dropdownMenu: true,
    filters: true,
    navigableHeaders: true,
    emptyDataState: true,
    ...settings,
    licenseKey: TEST_LICENSE_KEY,
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
