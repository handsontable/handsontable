import { HIGHLIGHT_COLUMN_TYPE } from '../../../3rdparty/walkontable/src';
import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection, responsible for highlighting row and column headers. This type of selection
 * can occur multiple times.
 *
 * @param {object} highlightParams A configuration object to create a highlight.
 * @param {string} highlightParams.columnClassName Highlighted column' class name.
 * @returns {Selection}
 */
function createHighlight({
  columnClassName,
  ...restOptions
}) {
  const s = new VisualSelection({
    className: columnClassName,
    highlightOnlyClosestHeader: true,
    ...restOptions,
    selectionType: HIGHLIGHT_COLUMN_TYPE,
  });

  return s;
}

export default createHighlight;
