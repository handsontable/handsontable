import Handsontable from 'handsontable';

new Handsontable(document.body, {
  columns: [
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    {
      data: 'plain',
      type: 'numeric',
      locale: 'de-CH',
      numericFormat: {}
    },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    {
      data: 'builtIn',
      renderer: 'numeric',
      locale: 'de-DE',
      numericFormat: {}
    },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    {
      data: 'text',
      type: 'numeric',
      renderer: 'text',
      locale: 'pl-PL',
      numericFormat: {}
    },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    {
      data: 'unset',
      type: 'numeric',
      renderer: undefined,
      locale: 'en-GB',
      numericFormat: {}
    },
  ],
});
