import { Selection } from './../../../3rdparty/walkontable/src';

/**
 *
 */
function defaults() {

}
defaults.prototype = {
  width: 1,
  color: '#4b89ff',
  strokeAlignment: 'inside'
};

/**
 *
 */
export function getBorderPrototype() {
  const CellBorderInHandsontableInstance = class {
    iAmCellBorderInHandsontableInstance = () => {}
  };
  CellBorderInHandsontableInstance.prototype = Object.create(defaults.prototype);
  updateBorderStyle(CellBorderInHandsontableInstance, {});
  return CellBorderInHandsontableInstance;
}

/**
 * Update style properties of the highlight's border.
 *
 * @param InstanceBorder
 * @param {object} obj An object with optional `color` and `width` properties.
 */
export function updateBorderStyle(InstanceBorder, obj) {

  if (obj.borderWidth) {
    InstanceBorder.prototype.width = obj.borderWidth;
  } else if (InstanceBorder.prototype.hasOwnProperty('width')) {
    delete InstanceBorder.prototype.width;
  }
  if (obj.borderColor) {
    InstanceBorder.prototype.color = obj.borderColor;
  } else if (InstanceBorder.prototype.hasOwnProperty('color')) {
    delete InstanceBorder.prototype.color;
  }

}

/**
 * Creates the new instance of Selection responsible for highlighting area of the selected multiple cells.
 *
 * @returns {Selection}
 * @param InstanceBorder
 */
function createHighlight({ areaBorderPrototype, layerLevel, areaCornerVisible }) {
  const borderStyle = new areaBorderPrototype();
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
