import Handsontable from 'handsontable';

const base = { width: 100 };
const withFormat = { dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } };
const nested = { ...withFormat };

const hot = new Handsontable(document.getElementById('grid'), {
  columns: [
    { data: 'a', type: 'date' },
    { data: 'b', type: 'time' },
    { data: 'c', type: 'date', ...base },
    { data: 'd', type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
    { data: 'e', type: 'time', timeFormat: { hour: 'numeric', minute: '2-digit' } },
    { data: 'f', type: 'date', ...withFormat },
    { data: 'g', type: 'date', ...nested },
    { data: 'h', type: 'date', ...unknown },
    { data: 'i', type: 'text' },
    { data: 'j', type: 'intl-date' },
    { data: 'k', type: kind },
    { data: 'l' },
  ],
});

const unrelated = { type: 'date', note: 'not a Handsontable option object' };

// A grid-level format applies to every column inside it, so these columns are not reported.
new Handsontable(document.getElementById('other'), {
  dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' },
  timeFormat: { hour: 'numeric', minute: '2-digit' },
  columns: [{ data: 'a', type: 'date' }, { data: 'b', type: 'time' }],
});
