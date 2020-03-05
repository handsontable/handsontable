import { Selection } from './../../../3rdparty/walkontable/src';

/**
 * Default border style used for fill selection highlight. The instance of
 * fill selection highlight uses this class as the fallback for the default values
 * through prototypal inheritance.
 */
const defaultBorderStyle = {
  width: 1,
  color: '#ff0000',
  strokeAlignment: 'inside',
};

export { defaultBorderStyle };

/**
 * Creates the new instance of Selection, responsible for highlighting cells which are covered by fill handle
 * functionality. This type of selection can present on the table only one at the time.
 *
 * @param {object} options Options object.
 * @returns {Selection}
 */
function createHighlight({ BorderStyle }) {
  const borderStyle = new BorderStyle();
  const s = new Selection({
    className: 'fill',
    border: borderStyle,
  });

  return s;
}

export default createHighlight;
