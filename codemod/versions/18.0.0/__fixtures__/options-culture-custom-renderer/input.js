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
    { data: 'bid', renderer: quoteRenderer, numericFormat: { pattern: '0.0000', culture: 'de-CH' } },
    { data: 'ask', renderer: function(instance, td) { return td; }, numericFormat: { culture: 'de-CH' } },
    { data: 'mid', renderer: 'nwm.signed', numericFormat: { culture: 'de-DE' } },
    { data: 'last', renderer: (instance, td) => td, numericFormat: { culture: 'pl-PL' } },
  ],
});
