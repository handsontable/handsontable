import Handsontable from 'handsontable';
import { registerLanguageDictionary, arAR } from 'handsontable/i18n';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

registerLanguageDictionary(arAR);

// generate random RTL data (e.g., Arabic)
function generateArabicData() {
  const randomName = () =>
    ['عمر', 'علي', 'عبد الله', 'معتصم'][Math.floor(Math.random() * 3)];

  const randomCountry = () =>
    ['تركيا', 'مصر', 'لبنان', 'العراق'][Math.floor(Math.random() * 3)];

  const randomDate = () =>
    new Date(Math.floor(Math.random() * Date.now())).toLocaleDateString();

  const randomBool = () => Math.random() > 0.5;
  const randomNumber = (a = 0, b = 1000) => a + Math.floor(Math.random() * b);
  const randomPhrase = () =>
    `${randomCountry()} ${randomName()} ${randomNumber()}`;

  const arr = Array.from({ length: 10 }, () => [
    randomBool(),
    randomName(),
    randomCountry(),
    randomPhrase(),
    randomDate(),
    randomPhrase(),
    randomBool(),
    randomNumber(0, 200).toString(),
    randomNumber(0, 10),
    randomNumber(0, 5),
  ]);

  return arr;
}

const container = document.querySelector('#example1');

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: generateArabicData(),
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  // render Handsontable from the right to the left
  layoutDirection: 'rtl',
  // load an RTL language (e.g., Arabic)
  language: 'ar-AR',
  // enable a few options that exemplify the layout direction
  dropdownMenu: true,
  filters: true,
  contextMenu: true,
  autoWrapRow: true,
  autoWrapCol: true,
});
