var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import { outerHeight, outerWidth, setOverlayPosition, resetCssTransform } from './../../../../helpers/dom/element';
import Overlay from './_base';

/**
 * @class TopLeftCornerOverlay
 */

var TopLeftCornerOverlay = function (_Overlay) {
  _inherits(TopLeftCornerOverlay, _Overlay);

  /**
   * @param {Walkontable} wotInstance
   */
  function TopLeftCornerOverlay(wotInstance) {
    _classCallCheck(this, TopLeftCornerOverlay);

    var _this = _possibleConstructorReturn(this, (TopLeftCornerOverlay.__proto__ || Object.getPrototypeOf(TopLeftCornerOverlay)).call(this, wotInstance));

    _this.clone = _this.makeClone(Overlay.CLONE_TOP_LEFT_CORNER);
    return _this;
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */


  _createClass(TopLeftCornerOverlay, [{
    key: 'shouldBeRendered',
    value: function shouldBeRendered() {
      return !!((this.wot.getSetting('fixedRowsTop') || this.wot.getSetting('columnHeaders').length) && (this.wot.getSetting('fixedColumnsLeft') || this.wot.getSetting('rowHeaders').length));
    }

    /**
     * Updates the corner overlay position
     */

  }, {
    key: 'resetFixedPosition',
    value: function resetFixedPosition() {
      this.updateTrimmingContainer();

      if (!this.wot.wtTable.holder.parentNode) {
        // removed from DOM
        return;
      }
      var overlayRoot = this.clone.wtTable.holder.parentNode;
      var tableHeight = outerHeight(this.clone.wtTable.TABLE);
      var tableWidth = outerWidth(this.clone.wtTable.TABLE);
      var preventOverflow = this.wot.getSetting('preventOverflow');

      if (this.trimmingContainer === window) {
        var box = this.wot.wtTable.hider.getBoundingClientRect();
        var top = Math.ceil(box.top);
        var left = Math.ceil(box.left);
        var bottom = Math.ceil(box.bottom);
        var right = Math.ceil(box.right);
        var finalLeft = '0';
        var finalTop = '0';

        if (!preventOverflow || preventOverflow === 'vertical') {
          if (left < 0 && right - overlayRoot.offsetWidth > 0) {
            finalLeft = -left + 'px';
          }
        }

        if (!preventOverflow || preventOverflow === 'horizontal') {
          if (top < 0 && bottom - overlayRoot.offsetHeight > 0) {
            finalTop = -top + 'px';
          }
        }
        setOverlayPosition(overlayRoot, finalLeft, finalTop);
      } else {
        resetCssTransform(overlayRoot);
      }
      overlayRoot.style.height = (tableHeight === 0 ? tableHeight : tableHeight + 4) + 'px';
      overlayRoot.style.width = (tableWidth === 0 ? tableWidth : tableWidth + 4) + 'px';
    }
  }]);

  return TopLeftCornerOverlay;
}(Overlay);

Overlay.registerOverlay(Overlay.CLONE_TOP_LEFT_CORNER, TopLeftCornerOverlay);

export default TopLeftCornerOverlay;