import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell. This type of selection
 * can present on the table only one at the time.
 *
 * @returns {Selection}
 */
function createHighlight({ border, cellRange, ...restOptions }) {
  const s = new VisualSelection({
    ...border,
    ...restOptions,
  }, cellRange);

  return s;
}

export default createHighlight;
