import Handsontable from 'handsontable';
import { registerLanguageDictionary, deDE } from 'handsontable/i18n';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

registerLanguageDictionary(deDE);

const container = document.querySelector('#example1');
const data = [
  ['Lorem', 'ipsum', 'dolor', 'sit', '12/1/2015', 23],
  ['adipiscing', 'elit', 'Ut', 'imperdiet', '5/12/2015', 6],
  ['Pellentesque', 'vulputate', 'leo', 'semper', '10/23/2015', 26],
  ['diam', 'et', 'malesuada', 'libero', '12/1/2014', 98],
  ['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5],
];

new Handsontable(container, {
  data,
  contextMenu: true,
  height: 'auto',
  language: 'de-DE',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
