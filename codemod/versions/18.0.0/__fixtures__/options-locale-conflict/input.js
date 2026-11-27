import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  columns: [
    { type: 'numeric', locale: 'fr-FR', numericFormat: { culture: 'de-DE' } },
    { type: 'numeric', locale: 'de-DE', numericFormat: { pattern: '0,0', culture: 'de-DE' } },
  ],
});
