import Handsontable from 'handsontable';

function quoteRenderer(instance, td, row, col, prop, value) {
  td.textContent = String(value);

  return td;
}

const signed = (instance, td, row, col, prop, value) => {
  td.textContent = String(value);

  return td;
};

Handsontable.renderers.registerRenderer('nwm.signed', signed);

new Handsontable(document.body, {
  columns: [
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale and update the renderer in the same change. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'bid', renderer: quoteRenderer, numericFormat: { pattern: '0.0000', culture: 'de-CH' } },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale and update the renderer in the same change. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'ask', renderer: function(instance, td) { return td; }, numericFormat: { culture: 'de-CH' } },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale and update the renderer in the same change. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'mid', renderer: 'nwm.signed', numericFormat: { culture: 'de-DE' } },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale and update the renderer in the same change. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'last', renderer: (instance, td) => td, numericFormat: { culture: 'pl-PL' } },
  ],
});
