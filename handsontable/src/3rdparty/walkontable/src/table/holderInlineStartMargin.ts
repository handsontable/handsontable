/**
 * Measures how far the holder's right edge sits from the page's right edge: the page margin on the
 * inline-start side of an RTL grid the window scrolls. Both inputs come from the same moment, so the
 * result stays valid after the holder grows: in RTL the right edge stays where it is and only the left
 * edge moves.
 *
 * @param {object} geometryReader The reader of the layout geometry.
 * @param {Function} geometryReader.clientWidth Reads an element's client width.
 * @param {Function} geometryReader.offsetWidth Reads an element's offset width.
 * @param {Document} rootDocument The document the grid lives in.
 * @param {HTMLElement} holder The master table's holder.
 * @param {number} holderLeft The holder's left offset from the page, read at the same moment.
 * @returns {number}
 */
export function measureHolderInlineStartMargin(
  geometryReader: { clientWidth(element: HTMLElement): number, offsetWidth(element: HTMLElement): number },
  rootDocument: Document,
  holder: HTMLElement,
  holderLeft: number,
): number {
  return geometryReader.clientWidth(rootDocument.documentElement) -
    (holderLeft + geometryReader.offsetWidth(holder));
}
