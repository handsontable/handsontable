import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
import { getDirectionFromURL, getThemeNameFromURL } from "../../utils";
import { registerLanguageDictionary, arAR } from "handsontable/i18n";
import { TEST_LICENSE_KEY } from "../../test-license-key";

export function init() {
  registerAllModules();
  registerLanguageDictionary(arAR);

  const root = document.getElementById('root');
  const example = document.createElement('div');

  root.appendChild(example);

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
    licenseKey: TEST_LICENSE_KEY
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
