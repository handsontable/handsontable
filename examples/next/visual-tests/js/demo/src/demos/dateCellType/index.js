import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
import { getDirectionFromURL, getThemeNameFromURL } from "../../utils";
import { registerLanguageDictionary, arAR } from "handsontable/i18n";

export function init() {
  registerAllModules();
  registerLanguageDictionary(arAR);

  const root = document.getElementById('root');
  const example = document.createElement('div');

  root.appendChild(example);

  new Handsontable(example, {
    data: (() => {
      const base = new Date('2024-01-15T12:00:00.000Z');

      return Array.from({ length: 100 }, (_, row) =>
        Array.from({ length: 50 }, (_, col) => {
          const d = new Date(base);

          d.setUTCDate(d.getUTCDate() + row * 7 + col);

          return d.toISOString().slice(0, 10);
        })
      );
    })(),
    type: 'date',
    dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' },
    layoutDirection: getDirectionFromURL(),
    language: getDirectionFromURL() === "rtl" ? arAR.languageCode : "en-US",
    themeName: getThemeNameFromURL(),
    height: 700,
    colWidths: 130,
    rowHeaders: true,
    colHeaders: true,
    navigableHeaders: true,
    contextMenu: true,
    licenseKey: "non-commercial-and-evaluation"
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
