import { HIGHLIGHT_HEADER_TYPE } from '../../../3rdparty/walkontable/src';
import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection, responsible for highlighting column or row headers when
 * any cell is selected.
 * This type of selection can occur multiple times.
 *
 * @param {object} highlightParams A configuration object to create a highlight.
 * @param {string} highlightParams.headerClassName Highlighted headers' class name.
 * @returns {Selection}
 */
export function createHighlight({ headerClassName, ...restOptions }) {
  return new VisualSelection({
    className: headerClassName,
    ...restOptions,
    selectionType: HIGHLIGHT_HEADER_TYPE,
  });
}
