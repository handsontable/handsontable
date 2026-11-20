import Handsontable from 'handsontable';

const hot = new Handsontable(document.getElementById('grid'), {
  columns: [
    { type: 'date', dateFormat: 'DD/MM/YYYY' },
    { type: 'time', timeFormat: 'h:mm:ss a' },
    { type: 'date', locale: 'en-GB', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
    { type: 'time', locale: 'en-US', timeFormat: { hour: 'numeric', minute: '2-digit' } },
  ],
});
