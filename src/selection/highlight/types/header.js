import { HEADER_TYPE } from '../constants';
import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection, responsible for highlighting row and column headers. This type of selection
 * can occur multiple times.
 *
 * @param {object} highlightParams A configuration object to create a highlight.
 * @param {string} highlightParams.headerClassName Highlighted headers' class name.
 * @param {string} highlightParams.rowClassName Highlighted row' class name.
 * @param {string} highlightParams.columnClassName Highlighted column' class name.
 * @returns {Selection}
 */
function createHighlight({
  headerClassName,
  rowClassName,
  columnClassName,
  ...restOptions
}) {
  const s = new VisualSelection({
    className: 'highlight',
    highlightHeaderClassName: headerClassName,
    highlightRowClassName: rowClassName,
    highlightColumnClassName: columnClassName,
    ...restOptions,
    highlightOnlyClosestHeader: true,
    selectionType: HEADER_TYPE,
  });

  return s;
}

export default createHighlight;
