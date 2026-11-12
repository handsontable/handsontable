import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  columns: [
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): numericFormat.culture is "en_US", which is not a valid BCP 47 locale tag. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { type: 'numeric', numericFormat: { culture: 'en_US' } },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): numericFormat.culture is "not a tag", which is not a valid BCP 47 locale tag. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { type: 'numeric', numericFormat: { culture: 'not a tag' } },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check that numericFormat.culture is a BCP 47 tag such as de-DE: its value is not a string literal. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    {
      type: 'numeric',
      locale: getCulture(),
      numericFormat: {}
    },
  ],
});
