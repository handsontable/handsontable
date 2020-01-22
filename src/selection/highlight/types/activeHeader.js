import VisualSelection from '../visualSelection';

/**
 * @return {Selection}
 */
function createHighlight({ translateCoords, untranslateCoords, activeHeaderClassName }) {
  const s = new VisualSelection({
    translateCoords,
    untranslateCoords,
    highlightHeaderClassName: activeHeaderClassName,
  });

  return s;
}

export default createHighlight;
