import Handsontable from 'handsontable/base';
import { IMPORTED_FORMAT, FORMATS } from './formats';

const DATE_FORMAT = 'DD.MM.YYYY';
const TIME_FORMAT = 'HH:mm:ss';
const LOCAL = { date: 'MM/DD/YYYY', intl: { year: 'numeric' } };
const INTL_FORMAT = { year: 'numeric', month: '2-digit' };
let mutable = 'YYYY-MM-DD';

new Handsontable(document.body, {
  columns: [
    { data: 'a', type: 'date', dateFormat: DATE_FORMAT },
    { data: 'b', type: 'time', timeFormat: TIME_FORMAT },
    { data: 'c', type: 'date', dateFormat: IMPORTED_FORMAT },
    { data: 'd', type: 'date', dateFormat: FORMATS.date },
    { data: 'e', type: 'date', dateFormat: LOCAL.date },
    { data: 'f', type: 'date', dateFormat: mutable },
    { data: 'g', type: 'time', timeFormat: FORMATS.time },
    { data: 'h', type: 'intl-date', dateFormat: INTL_FORMAT },
    { data: 'i', type: 'intl-date', dateFormat: LOCAL.intl },
    { data: 'j', type: 'intl-date', dateFormat: { year: 'numeric' } },
  ],
});
