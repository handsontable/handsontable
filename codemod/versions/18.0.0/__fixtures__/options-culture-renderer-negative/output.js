import Handsontable from 'handsontable';

new Handsontable(document.body, {
  columns: [
    {
      data: 'plain',
      locale: 'de-CH',
      numericFormat: {}
    },
    {
      data: 'builtIn',
      renderer: 'numeric',
      locale: 'de-DE',
      numericFormat: {}
    },
    {
      data: 'text',
      renderer: 'text',
      locale: 'pl-PL',
      numericFormat: {}
    },
    {
      data: 'unset',
      renderer: undefined,
      locale: 'en-GB',
      numericFormat: {}
    },
  ],
});
