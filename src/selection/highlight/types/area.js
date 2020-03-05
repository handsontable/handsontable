import { Selection } from './../../../3rdparty/walkontable/src';

/**
 * Default border style used for area selection highlight. The instance of
 * area selection highlight uses this class as the fallback for the default values
 * through prototypal inheritance.
 */
const defaultBorderStyle = {
  width: 1,
  color: '#4b89ff',
  strokeAlignment: 'inside',
};

export { defaultBorderStyle };

/**
 * Creates the new instance of Selection responsible for highlighting area of the selected multiple cells.
 *
 * @param {object} options Options object.
 * @returns {Selection}
 */
function createHighlight({ BorderStyle, layerLevel, areaCornerVisible }) {
  const borderStyle = new BorderStyle();

  borderStyle.cornerVisible = areaCornerVisible;

  const s = new Selection({
    className: 'area',
    markIntersections: true,
    layerLevel: Math.min(layerLevel, 7),
    border: borderStyle,
  });

  return s;
}

export default createHighlight;
