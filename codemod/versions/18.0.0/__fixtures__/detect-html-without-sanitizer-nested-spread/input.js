import Handsontable from 'handsontable';
import { remote } from './remote';

const headers = { colHeaders: ['<i>A</i>'] };
const unknownAndMarkup = { ...remote, ...headers };
const sanitized = { ...remote, colHeaders: ['<i>A</i>'], sanitizer: html => html };
const viaMember = { ...unknownAndMarkup, rowHeaders: ['plain'] };
const knownOnly = { ...headers, rowHeaders: ['plain'] };
const unknownOnly = { ...remote, rowHeaders: ['plain'] };

new Handsontable(document.body, { ...unknownAndMarkup });
new Handsontable(document.body, { ...viaMember });
new Handsontable(document.body, { ...sanitized });
new Handsontable(document.body, { ...unknownOnly });
new Handsontable(document.body, { ...knownOnly, sanitizer: html => html });
