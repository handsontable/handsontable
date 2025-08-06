
import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
import { getDirectionFromURL, getThemeNameFromURL } from "../../utils";
import { registerLanguageDictionary, arAR } from "handsontable/i18n";

export function init() {
    registerAllModules();
    registerLanguageDictionary(arAR);

    const root = document.getElementById('root');
    const example = document.createElement('div');

    example.style.width = '500px';
    example.style.height = '400px';

    root.appendChild(example);

    new Handsontable(example, {
        data: Handsontable.helper.createSpreadsheetData(20, 20),
        layoutDirection: getDirectionFromURL(),
        language: getDirectionFromURL() === "rtl" ? arAR.languageCode : "en-US",
        themeName: getThemeNameFromURL(),
        width: '100%',
        height: '100%',
        colWidths: 100,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        licenseKey: "non-commercial-and-evaluation"
    });

    console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
