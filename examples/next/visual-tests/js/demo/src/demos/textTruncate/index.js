import Handsontable from "handsontable";
import { getDirectionFromURL, getThemeNameFromURL, getFromURL } from "../../utils";
import { data } from './data';

const root = document.getElementById('root');
const example = document.createElement('div');

root.appendChild(example);

export function init() {
  const truncateTextOption = getFromURL('truncateTextOption', 'text');
  console.log('truncateTextOption', truncateTextOption);

  let editorSettings = {};

  if (truncateTextOption === 'all') {
    Object.assign(editorSettings, {
      textTruncate: true,
    });
  }

  if (truncateTextOption === 'column') {
    Object.assign(editorSettings, {
      columns: [
        {textTruncate: true},
        {},
        {textTruncate: true},
        {},
      ]
    });
  }

  if (truncateTextOption === 'row') {
    Object.assign(editorSettings, {
      cells: function (row) {
        if (row === 0) {
          return { textTruncate: true };
        }
      },
    });
  }

  console.log(editorSettings);
  
  new Handsontable(example, {
    data,
    layoutDirection: getDirectionFromURL(),
    language: getDirectionFromURL() === "rtl" ? arAR.languageCode : "en-US",
    themeName: getThemeNameFromURL(),
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    licenseKey: "non-commercial-and-evaluation",
    ...editorSettings,
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
