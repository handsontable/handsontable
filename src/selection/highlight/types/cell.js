import { Selection } from './../../../3rdparty/walkontable/src';

/**
 * Default border style used for single cell selection highlight. The instance single cell selection highlight uses this class as the fallback for
 * the default values through prototypal inheritance.
 */
export function DefaultBorderStyle() {

}
DefaultBorderStyle.prototype = {
  width: 2,
  color: '#4b89ff',
  strokeAlignment: 'inside'
};

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell. This type of selection
 * can present on the table only one at the time.
 *
 * @param {object} options Options object.
 * @returns {Selection}
 */
function createHighlight({ CellBorderStyleClass, cellCornerVisible }) {
  const borderStyle = new CellBorderStyleClass();

  borderStyle.cornerVisible = cellCornerVisible;
  const s = new Selection({
    className: 'current',
    border: borderStyle,
  });

  return s;
}

export default createHighlight;
