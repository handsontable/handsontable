import Handsontable from 'handsontable/base';
import { FMT } from './formats';

const PRESET = {
  eur: { pattern: '0,0.00', culture: 'de-DE' },
  plain: { pattern: '0,0.00' },
};
const FORMAT = { culture: 'de-CH' };
const PLAIN = { style: 'percent' };

new Handsontable(document.body, {
  columns: [
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand: numericFormat comes from a variable that sets culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'a', numericFormat: PRESET.eur },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand if it sets culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'b', numericFormat: FMT.amount },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand if it sets culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'c', numericFormat: { ...FMT.amount } },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand: numericFormat spreads an object that sets culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'd', numericFormat: { ...PRESET.eur, style: 'currency' } },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand: numericFormat comes from a variable that sets culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'e', numericFormat: FORMAT },
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand if it sets culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'f', numericFormat: FMT },
    { data: 'g', numericFormat: PRESET.plain },
    { data: 'h', numericFormat: PLAIN },
    { data: 'i', numericFormat: { ...PLAIN, currency: 'EUR' } },
    {
      data: 'j',
      locale: 'pl-PL',

      numericFormat: {
        ...PLAIN
      }
    },
    { data: 'k', locale: 'de-DE', numericFormat: { ...FMT.amount } },
    { data: 'l', locale: 'de-DE', numericFormat: FMT.amount },
  ],
});
