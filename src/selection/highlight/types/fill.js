import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection, responsible for highlighting cells which are covered by fill handle
 * functionality. This type of selection can present on the table only one at the time.
 *
 * @returns {Selection}
 */
function createHighlight({ translateCoords, untranslateCoords }) {
  const s = new VisualSelection({
    translateCoords,
    untranslateCoords,
    className: 'fill',
    border: {
      width: 1,
      color: '#ff0000',
    },
  });

  return s;
}

export default createHighlight;
