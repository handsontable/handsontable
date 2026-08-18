import { HIGHLIGHT_FOCUS_TYPE } from '../../../3rdparty/walkontable/src';
import VisualSelection from '../visualSelection';
import { A11Y_SELECTED } from '../../../helpers/a11y';

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell. This type of selection
 * can present on the table only one at the time.
 *
 * @param {object} highlightParams A configuration object to create a highlight.
 * @param {Function} highlightParams.cellCornerVisible Function to determine if cell's corner should be visible.
 * @param {Function} highlightParams.cellMoveEnabled Function to determine if the move zone should be shown
 *   on the single-cell (focus) selection border.
 * @returns {Selection}
 */
export function createHighlight({ cellCornerVisible, cellMoveEnabled, ...restOptions }: Record<string, unknown>) {
  return new VisualSelection({
    className: 'current',
    headerAttributes: [A11Y_SELECTED()],
    border: {
      width: 2,
      color: '#4b89ff',
      cornerVisible: cellCornerVisible,
      moveEnabled: cellMoveEnabled,
    },
    ...restOptions,
    selectionType: HIGHLIGHT_FOCUS_TYPE,
  });
}
