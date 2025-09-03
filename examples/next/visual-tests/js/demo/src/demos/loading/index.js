import Handsontable from "handsontable";
import { getDirectionFromURL, getThemeNameFromURL, getFromURL } from "../../utils";
import { registerLanguageDictionary, arAR } from "handsontable/i18n";
import { data } from './data';

export function init() {
  registerLanguageDictionary(arAR);

  const root = document.getElementById('root');
  const example = document.createElement('div');

  const input = document.createElement('input');
  input.style.margin = '10px';
  input.placeholder = 'Input';
  root.appendChild(input);

  const style = document.createElement('style');
  style.innerHTML = `
    .ht-loading__icon-svg {
      animation: none;
    }
  `;
  root.appendChild(style);
  root.appendChild(example);

  const icon = getFromURL('icon', undefined);
  const title = getFromURL('title', undefined);
  const description = getFromURL('description', undefined);
  const noData = getFromURL('nodata', undefined);

  const dialogSettings = {
    icon,
    title,
    description,
  };

  const hot = new Handsontable(example, {
    data: noData ? [] : data,
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
      { data: 1, type: 'text', headerClassName: 'htRight bold-text green' },
      { data: 2, type: 'text' },
      {
        data: 3,
        type: 'text',
        headerClassName: 'htCenter bold-text italic-text',
      },
      {
        data: 4,
        type: 'date',
        allowInvalid: false,
      },
      { data: 5, type: 'text' },
      {
        data: 6,
        type: 'checkbox',
        className: 'htCenter',
        headerClassName: 'htCenter',
      },
      {
        data: 7,
        type: 'numeric',
        headerClassName: 'htRight bold-text',
      },
    ],
    loading: dialogSettings,
    width: 400,
    height: 400,
    licenseKey: "non-commercial-and-evaluation",
  });

  hot.getPlugin('loading').show();

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
