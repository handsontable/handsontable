import { HTML_CHARACTERS } from '../helpers/dom/element';
import { spreadsheetColumnLabel } from '../helpers/data';
import { htmlToPlainText } from '../helpers/string';
import { extractText } from './textExtractor';
import type { HotInstance } from '../core/types';

/**
 * The element inside a column header that holds its label.
 */
const HEADER_LABEL_SELECTOR = '.colHeader';

/**
 * Reads the name of a column header the way a user sees it, for an announcement: the text of the
 * rendered header, so markup and character references in a header label never reach a screen reader.
 * A line break (`<br>`) reads as a space and runs of whitespace collapse to one. A header that is not
 * rendered (virtualized out), or renders no text, is read from its declared label and reduced the
 * same way: tags stripped, character references decoded, `<br>` read as a space.
 *
 * @param {HTMLElement|null} TH The rendered header element, `null` when it is not rendered.
 * @param {*} declaredLabel The label the header was configured with.
 * @returns {string} The label, or an empty string for a header without one.
 */
export function getHeaderLabelText(TH: HTMLElement | null, declaredLabel: unknown): string {
  const labelElement = TH?.querySelector<HTMLElement>(HEADER_LABEL_SELECTOR) ?? null;

  if (labelElement) {
    const copy = labelElement.cloneNode(true) as HTMLElement;

    copy.querySelectorAll('br').forEach(lineBreak => lineBreak.replaceWith(' '));

    const rendered = (copy.textContent ?? '').replace(/\s+/g, ' ').trim();

    if (rendered) {
      return rendered;
    }
  }

  const declared = String(declaredLabel ?? '').trim();

  return HTML_CHARACTERS.test(declared) ?
    htmlToPlainText(declared.replace(/<br\s*\/?>/gi, ' ')).replace(/\s+/g, ' ').trim() : declared;
}

/**
 * Reads the name of a column the way a user sees it, with `getHeaderLabelText()`. Only a header that is not
 * rendered (virtualized out), or renders no text, is read from `getColHeader()`, through a configured
 * `textExtractor` (context `'A11y.columnLabel'`), so neither runs while the rendered header gives the name. A column
 * without a label is named by its spreadsheet letter.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} column Visual column index.
 * @returns {string}
 */
export function getColumnLabel(hot: HotInstance, column: number): string {
  const rendered = getHeaderLabelText(hot.getCell(-1, column, true), '');

  if (rendered !== '') {
    return rendered;
  }

  const declared = getHeaderLabelText(null, extractText(hot, hot.getColHeader(column) ?? '', 'A11y.columnLabel'));

  return declared !== '' ? declared : spreadsheetColumnLabel(column);
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
    const label = getHeaderLabelText(null, extractText(hot, header, 'A11y.rowLabel'));

    if (label !== '') {
      return label;
    }
  }

  if (Array.isArray(header)) {
    return row + 1;
  }

  return Number(hot.runHooks('modifyRowHeader', row) ?? row) + 1;
}
