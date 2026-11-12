import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  columns: [
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Set locale to 'de-DE' if that was intended, then remove culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { type: 'numeric', locale: 'fr-FR', numericFormat: { culture: 'de-DE' } },
    { type: 'numeric', locale: 'de-DE', numericFormat: {
      pattern: '0,0'
    } },
  ],
});
