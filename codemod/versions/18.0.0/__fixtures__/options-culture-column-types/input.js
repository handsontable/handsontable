import Handsontable from 'handsontable';

// numericFormat does nothing in a text column or a column with no type, and locale would change how it sorts.
new Handsontable(document.body, {
  columns: [
    { data: 'text', type: 'text', numericFormat: { culture: 'de-DE' } },
    { data: 'untyped', numericFormat: { culture: 'de-DE' } },
    { data: 'price', type: 'numeric', numericFormat: { culture: 'de-DE' } },
    { data: 'rendered', renderer: 'numeric', numericFormat: { culture: 'pl-PL' } },
  ],
});

// A column with no type of its own takes the type of the grid.
new Handsontable(document.body, {
  type: 'numeric',
  columns: [
    { data: 'inherits', numericFormat: { culture: 'fr-FR' } },
    { data: 'overrides', type: 'text', numericFormat: { culture: 'fr-FR' } },
  ],
});
