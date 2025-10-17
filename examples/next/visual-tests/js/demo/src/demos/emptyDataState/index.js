import Handsontable from "handsontable";
import { getDirectionFromURL, getThemeNameFromURL, getFromURL } from "../../utils";
import { registerLanguageDictionary, arAR } from "handsontable/i18n";

export function init() {
  registerLanguageDictionary(arAR);

  const root = document.getElementById('root');
  const example = document.createElement('div');

  root.appendChild(example);

  const height = getFromURL('height', 400);

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
    columns: [
      { data: 1, type: 'text' },
      { data: 2, type: 'text' },
      { data: 3, type: 'text', },
      { data: 4, type: 'date' },
      { data: 5, type: 'text' },
      { data: 6, type: 'checkbox' },
      { data: 7, type: 'numeric' },
    ],
    width: 'auto',
    height: height,
    dropdownMenu: true,
    filters: true,
    navigableHeaders: true,
    emptyDataState: true,
    licenseKey: "non-commercial-and-evaluation",
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
