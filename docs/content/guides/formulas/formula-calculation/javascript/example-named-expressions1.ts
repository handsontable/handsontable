import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import { HyperFormula } from 'hyperformula';
import { Formulas } from 'handsontable/plugins';
import { DetailedSettings } from 'handsontable/plugins/formulas';

const data: (string | number)[][] = [
  ['Travel ID', 'Destination', 'Base price', 'Price with extra cost'],
  ['154', 'Rome', 400, '=ROUND(ADDITIONAL_COST+C2,0)'],
  ['155', 'Athens', 300, '=ROUND(ADDITIONAL_COST+C3,0)'],
  ['156', 'Warsaw', 150, '=ROUND(ADDITIONAL_COST+C4,0)'],
];

const container = document.querySelector('#example-named-expressions1')!;

const hot = new Handsontable(container, {
  data,
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  formulas: {
    engine: HyperFormula,
    namedExpressions: [
      {
        name: 'ADDITIONAL_COST',
        expression: 100,
      },
    ],
  } as DetailedSettings,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const input = document.getElementById('named-expressions-input')!;
const formulasPlugin: Formulas = hot.getPlugin('formulas');
const button = document.getElementById('named-expressions-button')!;

button!.addEventListener('click', () => {
  formulasPlugin.engine?.changeNamedExpression(
    'ADDITIONAL_COST',
    (input as HTMLInputElement).value
  );
  hot.render();
});
