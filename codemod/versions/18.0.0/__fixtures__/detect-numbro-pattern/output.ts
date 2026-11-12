import Handsontable from 'handsontable';

const container = document.querySelector<HTMLElement>('#grid')!;

new Handsontable(container, {
  columns: [
    // TODO(handsontable-codemod 18.0.0/numbro-pattern): Replace numericFormat.pattern with Intl.NumberFormat options. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    {
      type: 'numeric',
      numericFormat: { pattern: '0,0.00 $' }
    },
    { type: 'numeric', locale: 'de-DE', numericFormat: { style: 'currency', currency: 'EUR' } },
  ],
});
