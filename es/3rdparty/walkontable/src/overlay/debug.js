function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import { addClass } from './../../../../helpers/dom/element';
import Overlay from './_base';

/**
 * A overlay that renders ALL available rows & columns positioned on top of the original Walkontable instance and all other overlays.
 * Used for debugging purposes to see if the other overlays (that render only part of the rows & columns) are positioned correctly
 *
 * @class DebugOverlay
 */

var DebugOverlay = function (_Overlay) {
  _inherits(DebugOverlay, _Overlay);

  /**
   * @param {Walkontable} wotInstance
   */
  function DebugOverlay(wotInstance) {
    _classCallCheck(this, DebugOverlay);

    var _this = _possibleConstructorReturn(this, (DebugOverlay.__proto__ || Object.getPrototypeOf(DebugOverlay)).call(this, wotInstance));

    _this.clone = _this.makeClone(Overlay.CLONE_DEBUG);
    _this.clone.wtTable.holder.style.opacity = 0.4;
    _this.clone.wtTable.holder.style.textShadow = '0 0 2px #ff0000';

    addClass(_this.clone.wtTable.holder.parentNode, 'wtDebugVisible');
    return _this;
  }

  return DebugOverlay;
}(Overlay);

Overlay.registerOverlay(Overlay.CLONE_DEBUG, DebugOverlay);

export default DebugOverlay;