import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  columns: [
    { type: 'numeric', numericFormat: { culture: 'en_US' } },
    { type: 'numeric', numericFormat: { culture: 'not a tag' } },
    {
      type: 'numeric',
      locale: getCulture(),
      numericFormat: {}
    },
  ],
});
