import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { addClass, empty, fastInnerText, hasClass, isHTMLElement } from '../../helpers/dom/element';
import { isEmpty, stringify } from '../../helpers/mixed';
import { LINK_CLASS_NAME } from '../../utils/cellLinks/linkElement';
import {
  getTextTruncation,
  LINE_CLAMP_CSS_VARIABLE,
  LINE_CLAMP_WRAPPER_CLASS_NAME,
  TEXT_LINE_CLAMP_CLASS_NAME,
} from '../baseRenderer/textTruncation';

export const RENDERER_TYPE: 'text' = 'text';

/**
 * Returns the direct child of a node that is the clamp wrapper, or `null` when there is none.
 *
 * @param {Node} parent The node whose children are searched.
 * @returns {HTMLElement | null}
 */
function findWrapperChild(parent: Node): HTMLElement | null {
  for (let child = parent.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === Node.ELEMENT_NODE && isHTMLElement(child) &&
        hasClass(child, LINE_CLAMP_WRAPPER_CLASS_NAME)) {
      return child;
    }
  }

  return null;
}

/**
 * Returns the clamp wrapper of the cell, or `null` when the cell doesn't hold one. The wrapper is a direct
 * child of the cell, or sits inside a link: the whole-cell link modes (`autoLink` with `inline: false`,
 * the Formulas `HYPERLINK` function) move every child of the cell into an anchor, so the wrapper can follow
 * other nodes there (the autocomplete arrow). Looking inside the anchor keeps the wrapper from being rebuilt
 * on every draw. Only the anchors those two features build (`a.ht-link`) count: an anchor a custom renderer
 * drew is not ours to keep, and a recycled cell must not carry it over to a row that has no link.
 *
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @returns {HTMLElement | null}
 */
function findLineClampWrapper(TD: HTMLTableCellElement): HTMLElement | null {
  // This runs for every text cell on every draw, and a plain cell holds a single text node. The
  // `nodeType` compare is an integer check, so that cell leaves before any element guard runs.
  for (let child = TD.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === Node.ELEMENT_NODE && isHTMLElement(child)) {
      if (hasClass(child, LINE_CLAMP_WRAPPER_CLASS_NAME)) {
        return child;
      }

      const inner = child.localName === 'a' && hasClass(child, LINK_CLASS_NAME) ? findWrapperChild(child) : null;

      if (inner) {
        return inner;
      }
    }
  }

  return null;
}

/**
 * Writes the text into the cell's clamp wrapper. The wrapper is created once and kept across draws, so a
 * redraw only replaces the text node. Anything that sits beside the wrapper is removed, so the markup a
 * decorating renderer added after the previous draw (the autocomplete arrow) is rebuilt together with the
 * text. A wrapper inside a link keeps its place, and the link keeps the cell.
 *
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {string} text The text to write.
 * @param {number} lines The number of lines to clamp the text to.
 */
function writeClampedText(TD: HTMLTableCellElement, text: string, lines: number): void {
  let wrapper = findLineClampWrapper(TD);

  if (wrapper) {
    const parent = wrapper.parentNode!;

    while (wrapper.previousSibling) {
      parent.removeChild(wrapper.previousSibling);
    }

    while (wrapper.nextSibling) {
      parent.removeChild(wrapper.nextSibling);
    }

  } else {
    empty(TD);
    wrapper = TD.ownerDocument.createElement('div');
    addClass(wrapper, LINE_CLAMP_WRAPPER_CLASS_NAME);
    TD.appendChild(wrapper);
  }

  addClass(TD, TEXT_LINE_CLAMP_CLASS_NAME);
  wrapper.style.setProperty(LINE_CLAMP_CSS_VARIABLE, String(lines));
  fastInnerText(wrapper, text);
}

/**
 * Default text renderer.
 *
 * @private
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
 */
export function textRenderer(
  this: unknown,
  hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
  prop: string | number, value: unknown, cellProperties: CellProperties): void {
  let escaped = value;

  if (isEmpty(escaped) && cellProperties.placeholder) {
    escaped = cellProperties.placeholder;
  }

  const escapedStr = stringify(escaped);
  let finalStr = escapedStr;

  if (cellProperties.trimWhitespace) {
    finalStr = escapedStr.trim();
  }

  const truncation = getTextTruncation(cellProperties);

  if (truncation.mode === 'clamp') {
    writeClampedText(TD, finalStr, truncation.lines);

    return;
  }

  if (findLineClampWrapper(TD)) {
    // The cell was clamped before. Drop the wrapper so the text sits in the cell again.
    empty(TD);
  }

  // this is faster than innerHTML.
  fastInnerText(TD, finalStr);
}

textRenderer.RENDERER_TYPE = RENDERER_TYPE;
