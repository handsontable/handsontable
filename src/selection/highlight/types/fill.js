import { FILL_TYPE } from '../constants';
import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection, responsible for highlighting cells which are covered by fill handle
 * functionality. This type of selection can present on the table only one at the time.
 *
 * @param {object} highlightParams A configuration object to create a highlight.
 * @returns {Selection}
 */
function createHighlight({ ...restOptions }) {
  const s = new VisualSelection({
    className: 'fill',
    border: {
      width: 1,
      color: '#ff0000',
    },
    ...restOptions,
    selectionType: FILL_TYPE,
  });

  return s;
}

export default createHighlight;
