import { CUSTOM_SELECTION_TYPE } from '../constants';
import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell. This type of selection
 * can present on the table only one at the time.
 *
 * @param {object} highlightParams A configuration object to create a highlight.
 * @param {object} highlightParams.border Border configuration.
 * @param {object} highlightParams.visualCellRange Function to translate visual to renderable coords.
 * @returns {Selection}
 */
function createHighlight({ border, visualCellRange, ...restOptions }) {
  const s = new VisualSelection({
    ...border,
    ...restOptions,
    selectionType: CUSTOM_SELECTION_TYPE,
  }, visualCellRange);

  return s;
}

export default createHighlight;
