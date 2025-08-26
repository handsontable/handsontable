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

  root.appendChild(example);
  
  const input2 = document.createElement('input');
  input2.style.margin = '10px';
  input2.placeholder = 'Input 2';
  root.appendChild(input2);

  const background = getFromURL('background', 'solid');
  const contentBackground = getFromURL('contentbackground', false);
  const pagination = getFromURL('pagination', false);
  const focus = getFromURL('focus', false);

  const content = document.createElement("div");
  const button = document.createElement("button");

  button.innerHTML = "Close modal";
  content.innerHTML = `<h6>Hello world</h6><p>Lorem ipsum</p>`;
  content.appendChild(button);

  if (Boolean(focus)) {
    const inputContent1 = document.createElement('input');
    inputContent1.id = 'testInput';
    inputContent1.style.margin = '10px';
    inputContent1.placeholder = 'Input 1';
    content.appendChild(inputContent1);

    const inputContent2 = document.createElement('input');
    inputContent2.style.margin = '10px';
    inputContent2.placeholder = 'Input 2';

    content.appendChild(inputContent2);
  }

  const dialogSettings = {
    background,
    contentBackground: Boolean(contentBackground),
    pagination: Boolean(pagination),
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
    width: 400,
    height: 400,
    licenseKey: "non-commercial-and-evaluation",
  });

  if (Boolean(focus)) {
    hot.addHook("afterDialogFocus", (placement) => {
      if (placement !== "click") {
        document.getElementById("testInput").focus();
      }
    });
  }

  hot.getPlugin('dialog').show();

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
