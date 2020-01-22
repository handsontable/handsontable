import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection, responsible for highlighting row and column headers. This type of selection
 * can occur multiple times.
 *
 * @return {Selection}
 */
function createHighlight({ translateCoords, untranslateCoords, headerClassName, rowClassName, columnClassName }) {
  const s = new VisualSelection({
    translateCoords,
    untranslateCoords,
    className: 'highlight',
    highlightHeaderClassName: headerClassName,
    highlightRowClassName: rowClassName,
    highlightColumnClassName: columnClassName,
  });

  return s;
}

export default createHighlight;
