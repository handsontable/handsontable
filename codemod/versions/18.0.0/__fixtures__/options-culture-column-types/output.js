import Handsontable from 'handsontable';

// numericFormat does nothing in a text column or a column with no type, and locale would change how it sorts.
new Handsontable(document.body, {
  columns: [
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand if this column is numeric, and delete it if it is not. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'text', type: 'text', numericFormat: { culture: 'de-DE' } },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand if this column is numeric, and delete it if it is not. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'untyped', numericFormat: { culture: 'de-DE' } },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    {
      data: 'price',
      type: 'numeric',
      locale: 'de-DE',
      numericFormat: {}
    },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    {
      data: 'rendered',
      renderer: 'numeric',
      locale: 'pl-PL',
      numericFormat: {}
    },
  ],
});

// A column with no type of its own takes the type of the grid.
new Handsontable(document.body, {
  type: 'numeric',
  columns: [
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    {
      data: 'inherits',
      locale: 'fr-FR',
      numericFormat: {}
    },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand if this column is numeric, and delete it if it is not. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'overrides', type: 'text', numericFormat: { culture: 'fr-FR' } },
  ],
});
