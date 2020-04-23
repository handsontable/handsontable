import VisualSelection from '../visualSelection';

/**
 * @returns {Selection}
 */
function createHighlight({ visualToRenderableCoords, renderableToVisualCoords, activeHeaderClassName }) {
  const s = new VisualSelection({
    visualToRenderableCoords,
    renderableToVisualCoords,
    highlightHeaderClassName: activeHeaderClassName,
  });

  return s;
}

export default createHighlight;
