import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell. This type of selection
 * can present on the table only one at the time.
 *
 * @returns {Selection}
 */
function createHighlight({ translateCoords, untranslateCoords, border, cellRange }) {
  const s = new VisualSelection({
    translateCoords,
    untranslateCoords,
    ...border,
  }, cellRange);

  return s;
}

export default createHighlight;
