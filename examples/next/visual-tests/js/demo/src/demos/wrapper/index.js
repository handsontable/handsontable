
import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
import { getDirectionFromURL, getFromURL, getThemeNameFromURL } from "../../utils";
import { registerLanguageDictionary, arAR } from "handsontable/i18n";

export function init() {
    registerAllModules();
    registerLanguageDictionary(arAR);

    const root = document.getElementById('root');
    const example = document.createElement('div');

    root.appendChild(example);

    const preventOverflow = getFromURL('preventOverflow', false);

    if (preventOverflow) {
        new Handsontable(example, {
            columns: [
                {
                title: 'TEST LONGER HEADER',
                },
                {
                title: 'TEST NO:2 LONG HEADER',
                },
            ],
            preventOverflow: 'horizontal',
            licenseKey: 'non-commercial-and-evaluation',
        });
    } else {
        example.style.width = '500px';
        example.style.height = '400px';

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
    }

    console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
