import { AREA_TYPE } from '../constants';
import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection responsible for highlighting area of the selected multiple cells.
 *
 * @param {object} highlightParams A configuration object to create a highlight.
 * @param {number} highlightParams.layerLevel Layer level.
 * @param {object} highlightParams.areaCornerVisible Function to determine if area's corner should be visible.
 * @returns {Selection}
 */
function createHighlight({ layerLevel, areaCornerVisible, ...restOptions }) {
  const s = new VisualSelection({
    className: 'area',
    markIntersections: true,
    layerLevel: Math.min(layerLevel, 7),
    border: {
      width: 1,
      color: '#4b89ff',
      cornerVisible: areaCornerVisible,
    },
    ...restOptions,
    selectionType: AREA_TYPE,
  });

  return s;
}

export default createHighlight;
