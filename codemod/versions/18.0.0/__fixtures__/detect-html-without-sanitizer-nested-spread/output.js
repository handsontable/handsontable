import Handsontable from 'handsontable';
import { remote } from './remote';

const headers = { colHeaders: ['<i>A</i>'] };
const unknownAndMarkup = { ...remote, ...headers };
const sanitized = { ...remote, colHeaders: ['<i>A</i>'], sanitizer: html => html };
const viaMember = { ...unknownAndMarkup, rowHeaders: ['plain'] };
const knownOnly = { ...headers, rowHeaders: ['plain'] };
const unknownOnly = { ...remote, rowHeaders: ['plain'] };

// TODO(handsontable-codemod 18.0.0/html-without-sanitizer): Check that one of the spread ...remote sets a sanitizer option, because the tool could not see... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer
new Handsontable(document.body, { ...unknownAndMarkup });
// TODO(handsontable-codemod 18.0.0/html-without-sanitizer): Check that one of the spread ...remote sets a sanitizer option, because the tool could not see... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer
new Handsontable(document.body, { ...viaMember });
new Handsontable(document.body, { ...sanitized });
new Handsontable(document.body, { ...unknownOnly });
new Handsontable(document.body, { ...knownOnly, sanitizer: html => html });
