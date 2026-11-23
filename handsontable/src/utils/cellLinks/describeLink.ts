import { CELL_DESCRIPTION_LINK } from '../../i18n/constants';
import { CELL_DESCRIPTION_RANK, addCellDescriptionPart } from '../cellDescription/cellDescription';

/**
 * Adds the link part to the description of the cell being painted. The caller has just made an anchor in the cell
 * and says so: the focus stays on the cell and the anchor never takes it (it is out of the tab order, and Alt+Enter
 * opens it), so a screen reader that reads the cell's text would not say it is a link. The caller knows, so the
 * cell is not searched for an anchor on every paint.
 *
 * @param {object} hot The Handsontable instance.
 * @param {Function} hot.getTranslatedPhrase Returns a translated phrase.
 * @param {HTMLTableCellElement} TD The cell element being painted.
 */
export function describeLink(
  hot: { getTranslatedPhrase(dictionaryKey: string): string | null },
  TD: HTMLTableCellElement,
): void {
  addCellDescriptionPart(TD, CELL_DESCRIPTION_RANK.LINK, hot.getTranslatedPhrase(CELL_DESCRIPTION_LINK));
}
