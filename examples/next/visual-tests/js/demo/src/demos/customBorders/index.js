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
  window.hotInstance = new Handsontable(example, {
    layoutDirection: getDirectionFromURL(),
    language: getDirectionFromURL() === "rtl" ? arAR.languageCode : "en-US",
    themeName: getThemeNameFromURL(),
    data: Handsontable.helper.createSpreadsheetData(20, 10),
    rowHeaders: true,
    colHeaders: true,
    fixedRowsTop: 2,
    fixedColumnsLeft: 2,
    customBorders: [
      {
        range: {
          from: {
            row: 0,
            col: 0,
          },
          to: {
            row: 19,
            col: 0,
          },
        },
        top: {
          width: 3,
          color: "blue",
        },
        left: {
          width: 3,
          color: "orange",
        },
        bottom: {
          width: 3,
          color: "red",
        },
        right: {
          width: 3,
          color: "magenta",
        },
      },
      {
        range: {
          from: {
            row: 0,
            col: 3,
          },
          to: {
            row: 4,
            col: 5,
          },
        },
        top: {
          width: 2,
          color: "magenta",
        },
        left: {
          width: 2,
          color: "blue",
        },
        bottom: {
          width: 2,
          color: "orange",
        },
        right: {
          width: 2,
          color: "red",
        },
      },
      {
        range: {
          from: {
            row: 10,
            col: 3,
          },
          to: {
            row: 14,
            col: 9,
          },
        },
        top: {
          width: 4,
          color: "magenta",
        },
        left: {
          width: 4,
          color: "red",
        },
        bottom: {
          width: 4,
          color: "orange",
        },
        right: {
          width: 4,
          color: "blue",
        },
      },
    ],
    licenseKey: "non-commercial-and-evaluation"
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
