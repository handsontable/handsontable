import { Selection } from './../../../3rdparty/walkontable/src';

/**
 *
 */
export function defaults() {

}
defaults.prototype = {
  width: 1,
  color: '#4b89ff',
  strokeAlignment: 'inside'
};

/**
 * Creates the new instance of Selection responsible for highlighting area of the selected multiple cells.
 *
 * @param {object} options Options object.
 * @returns {Selection}
 */
function createHighlight({ AreaBorderPrototype, layerLevel, areaCornerVisible }) {
  const borderStyle = new AreaBorderPrototype();
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
