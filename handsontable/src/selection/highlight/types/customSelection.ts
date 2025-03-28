import { CellRange, HIGHLIGHT_CUSTOM_SELECTION_TYPE } from '../../../3rdparty/walkontable/src';
import VisualSelection, { VisualSelectionSettings } from '../visualSelection';

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell.
 * This type of selection can present on the table only one at the time.
 *
 * @param {object} highlightParams A configuration object to create a highlight.
 * @param {object} highlightParams.border Border configuration.
 * @param {object} highlightParams.visualCellRange Function to translate visual to renderable coords.
 * @returns {Selection}
 */
export function createHighlight({ border, visualCellRange, ...restOptions }: VisualSelectionSettings & { visualCellRange: CellRange; border: any }): VisualSelection {
  return new VisualSelection({
    ...border,
    ...restOptions,
    selectionType: HIGHLIGHT_CUSTOM_SELECTION_TYPE,
  }, visualCellRange);
}
