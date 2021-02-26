import VisualSelection from '../visualSelection';

/**
 * @returns {Selection}
 */
function createHighlight({ activeHeaderClassName, ...restOptions }) {
  const s = new VisualSelection({
    highlightHeaderClassName: activeHeaderClassName,
    ...restOptions,
  });

  return s;
}

export default createHighlight;
