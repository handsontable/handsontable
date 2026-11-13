import Handsontable from 'handsontable';

new Handsontable(document.body, {
  columns: [
    { data: 'plain', numericFormat: { culture: 'de-CH' } },
    { data: 'builtIn', renderer: 'numeric', numericFormat: { culture: 'de-DE' } },
    { data: 'text', renderer: 'text', numericFormat: { culture: 'pl-PL' } },
    { data: 'unset', renderer: undefined, numericFormat: { culture: 'en-GB' } },
  ],
});
