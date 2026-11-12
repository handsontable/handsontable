import Handsontable from 'handsontable';

const container = document.querySelector<HTMLElement>('#grid')!;

new Handsontable(container, {
  columns: [
    { type: 'numeric', numericFormat: { pattern: '0,0.00 $' } },
    { type: 'numeric', locale: 'de-DE', numericFormat: { style: 'currency', currency: 'EUR' } },
  ],
});
