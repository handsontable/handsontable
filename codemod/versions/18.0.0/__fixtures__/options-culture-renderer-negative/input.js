import Handsontable from 'handsontable';

new Handsontable(document.body, {
  columns: [
    { data: 'plain', type: 'numeric', numericFormat: { culture: 'de-CH' } },
    { data: 'builtIn', renderer: 'numeric', numericFormat: { culture: 'de-DE' } },
    { data: 'text', type: 'numeric', renderer: 'text', numericFormat: { culture: 'pl-PL' } },
    { data: 'unset', type: 'numeric', renderer: undefined, numericFormat: { culture: 'en-GB' } },
  ],
});
