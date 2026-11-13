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
    { data: 'a', numericFormat: PRESET.eur },
    { data: 'b', numericFormat: FMT.amount },
    { data: 'c', numericFormat: { ...FMT.amount } },
    { data: 'd', numericFormat: { ...PRESET.eur, style: 'currency' } },
    { data: 'e', numericFormat: FORMAT },
    { data: 'f', numericFormat: FMT },
    { data: 'g', numericFormat: PRESET.plain },
    { data: 'h', numericFormat: PLAIN },
    { data: 'i', numericFormat: { ...PLAIN, currency: 'EUR' } },
    { data: 'j', numericFormat: { culture: 'pl-PL', ...PLAIN } },
    { data: 'k', locale: 'de-DE', numericFormat: { ...FMT.amount } },
    { data: 'l', locale: 'de-DE', numericFormat: FMT.amount },
  ],
});
