import VisualSelection from '../visualSelection';

/**
 * Default border style used for single cell selection highlight. The instance of
 * single cell selection highlight uses this class as the fallback for the default values
 * through prototypal inheritance.
 */
const defaultBorderStyle = {
  width: 2,
  color: '#4b89ff',
  strokeAlignment: 'inside',
};

export { defaultBorderStyle };

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell. This type of selection
 * can present on the table only one at the time.
 *
 * @param {object} options Options object.
 * @returns {Selection}
 */
function createHighlight({ BorderStyle, visualToRenderableCoords, renderableToVisualCoords, cellCornerVisible }) {
  const borderStyle = new BorderStyle();

  borderStyle.cornerVisible = cellCornerVisible;

  const s = new VisualSelection({
    visualToRenderableCoords,
    renderableToVisualCoords,
    className: 'current',
    border: borderStyle,
  });

  return s;
}

export default createHighlight;
