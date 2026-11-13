import Handsontable from 'handsontable';

const hot = new Handsontable(document.getElementById('grid'), {
  columns: [
    // TODO(handsontable-codemod 18.0.0/moment-date-format): Replace the string dateFormat with an Intl.DateTimeFormat object. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format
    { type: 'date', dateFormat: 'DD/MM/YYYY' },
    // TODO(handsontable-codemod 18.0.0/moment-time-format): Replace the string timeFormat with an Intl.DateTimeFormat object. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format
    { type: 'time', timeFormat: 'h:mm:ss a' },
    { type: 'date', locale: 'en-GB', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
    { type: 'time', locale: 'en-US', timeFormat: { hour: 'numeric', minute: '2-digit' } },
  ],
});
