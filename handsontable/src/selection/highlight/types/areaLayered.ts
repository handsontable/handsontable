import { HIGHLIGHT_AREA_TYPE } from '../../../3rdparty/walkontable/src';
import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection responsible for highlighting area of the selected multiple cells.
 *
 * @param {object} highlightParams A configuration object to create a highlight.
 * @param {object} highlightParams.areaCornerVisible Function to determine if area's corner should be visible.
 * @param {object} highlightParams.adjustHandlesVisible Function to determine if adjustment handles should be visible.
 * @returns {Selection}
 */
export function createHighlight({ areaCornerVisible, adjustHandlesVisible, ...restOptions }: Record<string, unknown>) {
  return new VisualSelection({
    className: 'area',
    createLayers: true,
    border: {
      width: 1,
      color: '#4b89ff',
      cornerVisible: areaCornerVisible,
      adjustHandlesVisible,
    },
    ...restOptions,
    selectionType: HIGHLIGHT_AREA_TYPE,
  });
}
