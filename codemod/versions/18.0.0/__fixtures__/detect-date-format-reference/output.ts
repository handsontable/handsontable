import Handsontable from 'handsontable/base';
import { IMPORTED_FORMAT, FORMATS } from './formats';

const DATE_FORMAT = 'DD.MM.YYYY';
const TIME_FORMAT = 'HH:mm:ss';
const LOCAL = { date: 'MM/DD/YYYY', intl: { year: 'numeric' } };
const INTL_FORMAT = { year: 'numeric', month: '2-digit' };
let mutable = 'YYYY-MM-DD';

new Handsontable(document.body, {
  columns: [
    // TODO(handsontable-codemod 18.0.0/moment-date-format): Replace the string dateFormat with an Intl.DateTimeFormat object. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format
    { data: 'a', type: 'date', dateFormat: DATE_FORMAT },
    // TODO(handsontable-codemod 18.0.0/moment-time-format): Replace the string timeFormat with an Intl.DateTimeFormat object. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format
    { data: 'b', type: 'time', timeFormat: TIME_FORMAT },
    // TODO(handsontable-codemod 18.0.0/moment-date-format): Check the dateFormat value, because it comes from a variable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format
    { data: 'c', type: 'date', dateFormat: IMPORTED_FORMAT },
    // TODO(handsontable-codemod 18.0.0/moment-date-format): Check the dateFormat value, because it comes from a variable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format
    { data: 'd', type: 'date', dateFormat: FORMATS.date },
    // TODO(handsontable-codemod 18.0.0/moment-date-format): Replace the string dateFormat with an Intl.DateTimeFormat object. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format
    { data: 'e', type: 'date', dateFormat: LOCAL.date },
    // TODO(handsontable-codemod 18.0.0/moment-date-format): Check the dateFormat value, because it comes from a variable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format
    { data: 'f', type: 'date', dateFormat: mutable },
    // TODO(handsontable-codemod 18.0.0/moment-time-format): Check the timeFormat value, because it comes from a variable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format
    { data: 'g', type: 'time', timeFormat: FORMATS.time },
    { data: 'h', type: 'intl-date', dateFormat: INTL_FORMAT },
    { data: 'i', type: 'intl-date', dateFormat: LOCAL.intl },
    { data: 'j', type: 'intl-date', dateFormat: { year: 'numeric' } },
  ],
});
