import Handsontable from "handsontable";
import { getDirectionFromURL, getThemeNameFromURL, getFromURL } from "../../utils";
import { data } from './data';

export function init() {
  const root = document.getElementById('root');
  const example = document.createElement('div');

  root.appendChild(example);

  new Handsontable(example, {
    data,
    layoutDirection: getDirectionFromURL(),
    language: getDirectionFromURL() === "rtl" ? arAR.languageCode : "en-US",
    themeName: getThemeNameFromURL(),
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    textEllipsis: true,
    licenseKey: "non-commercial-and-evaluation",
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
