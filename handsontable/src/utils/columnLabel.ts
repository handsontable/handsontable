import { HTML_CHARACTERS } from '../helpers/dom/element';
import { spreadsheetColumnLabel } from '../helpers/data';
import { htmlToPlainText } from '../helpers/string';
import { extractText } from './textExtractor';
import type { HotInstance } from '../core/types';

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

  const header = String(extractText(hot, hot.getColHeader(column) ?? '', 'A11y.columnLabel')).trim();
  const plainHeader = HTML_CHARACTERS.test(header) ?
    collapseWhitespace(htmlToPlainText(header.replace(/<br\s*\/?>/gi, ' '))) : header;

  return plainHeader !== '' ? plainHeader : spreadsheetColumnLabel(column);
}
