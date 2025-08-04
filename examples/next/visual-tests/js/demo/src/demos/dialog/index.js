import Handsontable from "handsontable";
import { getDirectionFromURL, getThemeNameFromURL, getFromURL } from "../../utils";
import { data } from './data';

const root = document.getElementById('root');
const example = document.createElement('div');

root.appendChild(example);

export function init() {
  const background = getFromURL('background', 'solid');
  const contentBackground = getFromURL('contentbackground', false);

  const content = document.createElement("div");
  const button = document.createElement("button");

  button.innerHTML = "Close modal";
  content.innerHTML = `<h6>Hello world</h6><p>Lorem ipsum</p>`;
  content.appendChild(button);

  const dialogSettings = {
    background,
    contentBackground: Boolean(contentBackground),
    content,
  };

  const hot = new Handsontable(example, {
    data,
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
    dialog: dialogSettings,
    width: '100%',
    height: 400,
    licenseKey: "non-commercial-and-evaluation",
  });

  hot.getPlugin('dialog').show();

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
