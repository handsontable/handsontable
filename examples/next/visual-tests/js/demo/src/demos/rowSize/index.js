import Handsontable from 'handsontable';
import { registerAllModules } from 'handsontable/registry';
import { data } from './data';
import { getThemeNameFromURL, getDirectionFromURL, getFromURL } from '../../utils';
import { registerLanguageDictionary, arAR } from 'handsontable/i18n';

export function init() {
  registerAllModules();
  registerLanguageDictionary(arAR);

  const root = document.getElementById('root');
  const example = document.createElement('div');

  root.appendChild(example);

  const smallCells = getFromURL('smallcells', false);

  new Handsontable(example, {
    layoutDirection: getDirectionFromURL(),
    language: getDirectionFromURL() === "rtl" ? arAR.languageCode : "en-US",
    themeName: getThemeNameFromURL(),
    height: 320,
    colWidths: smallCells ? 40 : 100,
    data: data,
    rowHeaders: true,
    colHeaders: true,
    contextMenu: true,
    dialog: true,
    dropdownMenu: true,
    autoWrapRow: true,
    autoWrapCol: true,
    autoRowSize: true,
    licenseKey: "non-commercial-and-evaluation",
  });
}
