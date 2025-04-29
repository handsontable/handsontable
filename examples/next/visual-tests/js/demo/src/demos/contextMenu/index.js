import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
import { getDirectionFromURL, getThemeNameFromURL } from "../../utils";
import { registerLanguageDictionary, arAR } from "handsontable/i18n";

registerAllModules();
registerLanguageDictionary(arAR);

const root = document.getElementById('root');
const example = document.createElement('div');

root.appendChild(example);

export function init() {
  new Handsontable(example, {
    data: Handsontable.helper.createSpreadsheetData(100, 50),
    layoutDirection: getDirectionFromURL(),
    language: getDirectionFromURL() === "rtl" ? arAR.languageCode : "en-US",
    themeName: getThemeNameFromURL(),
    height: 700,
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    navigableHeaders: true,
    contextMenu: true,
    licenseKey: "non-commercial-and-evaluation"
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
