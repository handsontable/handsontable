import { HTML_CHARACTERS } from '../helpers/dom/element';
import { htmlToPlainText } from '../helpers/string';

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
