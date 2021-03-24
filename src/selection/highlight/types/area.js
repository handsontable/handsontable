import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection responsible for highlighting area of the selected multiple cells.
 *
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
  });

  return s;
}

export default createHighlight;
