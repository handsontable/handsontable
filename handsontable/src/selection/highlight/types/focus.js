import { HIGHLIGHT_FOCUS_TYPE } from '../../../3rdparty/walkontable/src';
import VisualSelection from '../visualSelection';
import { A11Y_SELECTED } from '../../../helpers/a11y';

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell. This type of selection
 * can present on the table only one at the time.
 *
 * @param {object} highlightParams A configuration object to create a highlight.
 * @param {Function} highlightParams.cellCornerVisible Function to determine if cell's corner should be visible.
 * @returns {Selection}
 */
export function createHighlight({ cellCornerVisible, ...restOptions }) {
  return new VisualSelection({
    className: 'current',
    headerAttributes: [A11Y_SELECTED()],
    border: {
      width: 2,
      color: '#4b89ff',
      cornerVisible: cellCornerVisible,
    },
    ...restOptions,
    selectionType: HIGHLIGHT_FOCUS_TYPE,
  });
}
