import Handsontable from "handsontable/base";

import { getDirectionFromURL, getThemeNameFromURL } from "../../utils";
import { registerPlugin, SheetsBar } from 'handsontable/plugins';

export function init() {
  registerPlugin(SheetsBar);

  const root = document.getElementById('root');
  const example = document.createElement('div');

  root.appendChild(example);

  window.hotInstance = new Handsontable(example, {
    layoutDirection: getDirectionFromURL(),
    themeName: getThemeNameFromURL(),
    height: 300,
    colHeaders: true,
    rowHeaders: true,
    sheetsBar: {
      sheets: [
        { name: 'Sheet1', data: [['A1', 'A2'], ['A3', 'A4']] },
        { name: 'Sheet2', data: [['B1', 'B2'], ['B3', 'B4']] },
        { name: 'Sheet3', data: [['C1', 'C2'], ['C3', 'C4']] },
      ],
    },
    licenseKey: "non-commercial-and-evaluation",
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
