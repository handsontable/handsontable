import type { default as CellRange } from '../../../3rdparty/walkontable/src/cell/range';
import { HIGHLIGHT_CUSTOM_SELECTION_TYPE } from '../../../3rdparty/walkontable/src';
import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell.
 * This type of selection can present on the table only one at the time.
 *
 * @param {object} highlightParams A configuration object to create a highlight.
 * @param {object} highlightParams.border Border configuration.
 * @param {object} highlightParams.visualCellRange Function to translate visual to renderable coords.
 * @returns {Selection}
 */
export function createHighlight({ border, visualCellRange, ...restOptions }: Record<string, unknown>) {
  const isCellBorderObject = border !== null &&
    typeof border === 'object' &&
    'row' in border &&
    'col' in border;

  return new VisualSelection({
    ...(isCellBorderObject ? border as Record<string, unknown> : { border }),
    ...restOptions,
    selectionType: HIGHLIGHT_CUSTOM_SELECTION_TYPE,
  }, visualCellRange as CellRange | null);
}
