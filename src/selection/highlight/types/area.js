import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection responsible for highlighting area of the selected multiple cells.
 *
 * @returns {Selection}
 */
function createHighlight({ translateCoords, untranslateCoords, layerLevel, areaCornerVisible }) {
  const s = new VisualSelection({
    translateCoords,
    untranslateCoords,
    className: 'area',
    markIntersections: true,
    layerLevel: Math.min(layerLevel, 7),
    border: {
      width: 1,
      color: '#4b89ff',
      cornerVisible: areaCornerVisible,
    },
  });

  return s;
}

export default createHighlight;
