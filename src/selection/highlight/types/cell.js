import { Selection } from './../../../3rdparty/walkontable/src';

/**
 *
 */
function defaults() {

}
defaults.prototype = {
  width: 2,
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
 * Creates the new instance of Selection responsible for highlighting currently selected cell. This type of selection
 * can present on the table only one at the time.
 *
 * @returns {Selection}
 * @param InstanceBorder
 */
function createHighlight({ cellBorderPrototype, cellCornerVisible }) {
  const borderStyle = new cellBorderPrototype();
  setTimeout(() => {
    console.log('current borderStyle', borderStyle);
  }, 1000);

  borderStyle.cornerVisible = cellCornerVisible;
  const s = new Selection({
    className: 'current',
    border: borderStyle,
  });

  return s;
}

export default createHighlight;
