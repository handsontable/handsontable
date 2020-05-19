import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection, responsible for highlighting row and column headers. This type of selection
 * can occur multiple times.
 *
 * @returns {Selection}
 */
function createHighlight({ visualToRenderableCoords, renderableToVisualCoords, headerClassName, rowClassName, columnClassName }) {
  const s = new VisualSelection({
    visualToRenderableCoords,
    renderableToVisualCoords,
    className: 'highlight',
    highlightHeaderClassName: headerClassName,
    highlightRowClassName: rowClassName,
    highlightColumnClassName: columnClassName,
  });

  return s;
}

export default createHighlight;
