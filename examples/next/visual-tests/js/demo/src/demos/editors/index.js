import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
import { getDirectionFromURL, getThemeNameFromURL, getFromURL } from "../../utils";
import { registerLanguageDictionary, arAR } from "handsontable/i18n";

registerAllModules();
registerLanguageDictionary(arAR);

const root = document.getElementById('root');
const example = document.createElement('div');

root.appendChild(example);

export function init() {
  const sizeSettings = {};

  if (getFromURL('hasDefinedSize')) {
    sizeSettings.height = 700;
  }

  const cellType = getFromURL('cellType', 'text');
  const editorSettings = {
    type: cellType,
  };

  if (cellType === 'handsontable') {
    Object.assign(editorSettings, {
      handsontable: {
        colHeaders: ['Marque', 'Country', 'Parent company'],
        autoColumnSize: true,
        data: [
          {name: 'BMW', country: 'Germany', owner: 'Bayerische Motoren Werke AG'},
          {name: 'Chrysler', country: 'USA', owner: 'Chrysler Group LLC'},
          {name: 'Nissan', country: 'Japan', owner: 'Nissan Motor Company Ltd'},
          {name: 'Suzuki', country: 'Japan', owner: 'Suzuki Motor Corporation'},
          {name: 'Toyota', country: 'Japan', owner: 'Toyota Motor Corporation'},
          {name: 'Volvo', country: 'Sweden', owner: 'Zhejiang Geely Holding Group'},
        ],
      },
    });
  }

  new Handsontable(example, {
    data: Handsontable.helper.createEmptySpreadsheetData(100, 50),
    layoutDirection: getDirectionFromURL(),
    language: getDirectionFromURL() === "rtl" ? arAR.languageCode : "en-US",
    themeName: getThemeNameFromURL(),
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    navigableHeaders: true,
    contextMenu: true,
    licenseKey: "non-commercial-and-evaluation",
    ...editorSettings,
    ...sizeSettings,
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
