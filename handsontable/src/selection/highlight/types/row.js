import { HIGHLIGHT_ROW_TYPE } from '../../../3rdparty/walkontable/src';
import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection, responsible for highlighting row and column headers. This type of selection
 * can occur multiple times.
 *
 * @param {object} highlightParams A configuration object to create a highlight.
 * @param {string} highlightParams.rowClassName Highlighted row' class name.
 * @returns {Selection}
 */
export function createHighlight({
  rowClassName,
  ...restOptions
}) {
  const s = new VisualSelection({
    className: rowClassName,
    ...restOptions,
    selectionType: HIGHLIGHT_ROW_TYPE,
  });

  return s;
}
