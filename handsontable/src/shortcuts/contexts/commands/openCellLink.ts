import type { HotInstance } from '../../../core/types';
import { LINK_CLASS_NAME } from '../../../utils/cellLinks';

/**
 * Returns the first grid-made link inside the selected cell's rendered element, or `null`.
 *
 * The rendered anchor is the single source of truth: every feature that links a cell
 * (`formulas.hyperlinks`, `autoLink`) marks its anchor with `ht-link`, so the command needs no
 * knowledge of which feature produced it. A cell that is not rendered has no anchor to read, so the
 * chord is left to the host application in that case.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @returns {HTMLAnchorElement|null} The anchor, or `null` when the selected cell holds no link.
 */
export function getSelectedCellLink(hot: HotInstance): HTMLAnchorElement | null {
  const highlight = hot.getSelectedRangeActive()?.highlight;

  if (!highlight || !highlight.isCell() || highlight.row === null || highlight.col === null) {
    return null;
  }

  return hot.getCell(highlight.row, highlight.col)?.querySelector<HTMLAnchorElement>(`a.${LINK_CLASS_NAME}`) ?? null;
}

export const command = {
  name: 'openCellLink',
  callback(hot: HotInstance) {
    const link = getSelectedCellLink(hot);

    if (link !== null) {
      hot.rootWindow.open(link.href, link.target || '_blank', 'noopener,noreferrer');
    }
  },
};
