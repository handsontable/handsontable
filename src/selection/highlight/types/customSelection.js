import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell. This type of selection
 * can present on the table only one at the time.
 *
 * @returns {Selection}
 */
function createHighlight({ visualToRenderableCoords, renderableToVisualCoords, border, cellRange }) {
  const s = new VisualSelection({
    visualToRenderableCoords,
    renderableToVisualCoords,
    ...border,
  }, cellRange);

  return s;
}

export default createHighlight;
