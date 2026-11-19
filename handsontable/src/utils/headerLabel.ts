import { HTML_CHARACTERS } from '../helpers/dom/element';
import { spreadsheetColumnLabel } from '../helpers/data';
import { htmlToPlainText } from '../helpers/string';
import { extractText } from './textExtractor';
import type { HotInstance } from '../core/types';
import type { TextExtractorContext } from '../core/settings';

const HEADER_LABEL_SELECTOR = '.colHeader';

/**
 * Reduces a header label to the text a user reads: a line break (`<br>`) reads as a space and runs of
 * whitespace collapse to one.
 *
 * @param {string} text The label text.
 * @returns {string}
 */
function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Reduces a header value from the settings to plain text: a configured `textExtractor` runs first, under
 * `context`, then tags are stripped, character references decoded and `<br>` read as a space.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {*} value The header value.
 * @param {string} context The `textExtractor` context.
 * @returns {string}
 */
function toPlainLabel(hot: HotInstance, value: unknown, context: TextExtractorContext): string {
  const label = String(extractText(hot, value ?? '', context)).trim();

  return HTML_CHARACTERS.test(label) ?
    collapseWhitespace(htmlToPlainText(label.replace(/<br\s*\/?>/gi, ' '))) : label;
}

/**
 * Reads the name of a column the way a user sees it: the text of the rendered header, so markup and character
 * references in a header label never reach an accessible name or an announcement. A header that is not rendered
 * (virtualized out) is read from `getColHeader()`, passed through a configured `textExtractor` (context
 * `'A11y.columnLabel'`), and reduced the same way: tags stripped, character references decoded, `<br>` read as a
 * space. A column without a label is named by its spreadsheet letter.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} column Visual column index.
 * @returns {string}
 */
export function getColumnLabel(hot: HotInstance, column: number): string {
  const TH = hot.getCell(-1, column, true);
  const headerLabel = TH ? TH.querySelector<HTMLElement>(HEADER_LABEL_SELECTOR) : null;

  if (headerLabel) {
    const copy = headerLabel.cloneNode(true) as HTMLElement;

    copy.querySelectorAll('br').forEach(lineBreak => lineBreak.replaceWith(' '));

    const rendered = collapseWhitespace(copy.textContent ?? '');

    if (rendered) {
      return rendered;
    }
  }

  const plainHeader = toPlainLabel(hot, hot.getColHeader(column), 'A11y.columnLabel');

  return plainHeader !== '' ? plainHeader : spreadsheetColumnLabel(column);
}

/**
 * Reads the label of a row the way its row header shows it, through `Core#getRowHeader()`: the `modifyRowHeader`
 * hook (a paged `dataProvider`, `bindRowsWithHeaders`), an array of `rowHeaders` or a `rowHeaders` function, and the
 * `modifyRowHeaderValue` hook (a header renamed with EditableHeaders). A text header comes back as plain text
 * (through a configured `textExtractor`, context `'A11y.rowLabel'`), a numeric one as a number. A grid without row
 * headers, and an empty header, give the row number counted from 1, mapped by `modifyRowHeader`. A row that shows
 * a header runs `modifyRowHeader` once, inside `getRowHeader()`.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} row Visual row index.
 * @returns {string|number}
 */
export function getRowLabel(hot: HotInstance, row: number): string | number {
  const header: unknown = hot.getRowHeader(row);

  if (typeof header === 'number' && Number.isFinite(header)) {
    return header;
  }

  if (typeof header === 'string') {
    const label = toPlainLabel(hot, header, 'A11y.rowLabel');

    if (label !== '') {
      return label;
    }
  }

  if (Array.isArray(header)) {
    return row + 1;
  }

  return Number(hot.runHooks('modifyRowHeader', row) ?? row) + 1;
}
