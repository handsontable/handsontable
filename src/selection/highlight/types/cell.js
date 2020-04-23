import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell. This type of selection
 * can present on the table only one at the time.
 *
 * @returns {Selection}
 */
function createHighlight({ visualToRenderableCoords, renderableToVisualCoords, cellCornerVisible }) {
  const s = new VisualSelection({
    visualToRenderableCoords,
    renderableToVisualCoords,
    className: 'current',
    border: {
      width: 2,
      color: '#4b89ff',
      cornerVisible: cellCornerVisible,
    },
  });

  return s;
}

export default createHighlight;
