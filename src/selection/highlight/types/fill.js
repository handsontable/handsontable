import { Selection } from './../../../3rdparty/walkontable/src';

/**
 *
 */
export function DefaultBorderStyle() {

}
DefaultBorderStyle.prototype = {
  width: 1,
  color: '#ff0000',
  strokeAlignment: 'inside'
};

/**
 * Creates the new instance of Selection, responsible for highlighting cells which are covered by fill handle
 * functionality. This type of selection can present on the table only one at the time.
 *
 * @param {object} options Options object.
 * @returns {Selection}
 */
function createHighlight({ FillBorderStyleClass }) {
  const borderStyle = new FillBorderStyleClass();

  const s = new Selection({
    className: 'fill',
    border: borderStyle,
  });

  return s;
}

export default createHighlight;
