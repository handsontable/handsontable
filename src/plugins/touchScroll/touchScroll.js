import * as dom from './../../dom.js';
import BasePlugin from './../_base.js';
import {registerPlugin} from './../../plugins.js';

export {TouchScroll};

/**
 * @class TouchScroll
 * @private
 * @plugin
 */
class TouchScroll extends BasePlugin {
  /**
   * @param {Object} hotInstance
   */
  constructor(hotInstance) {
    super(hotInstance);

    this.hot.addHook('afterInit', () => this.init());
  }

  init() {
    this.bindEvents();

    this.scrollbars = [
      this.hot.view.wt.wtOverlays.topOverlay,
      this.hot.view.wt.wtOverlays.leftOverlay
    ];
    if (this.hot.view.wt.wtOverlays.topLeftCornerOverlay) {
      this.scrollbars.push(this.hot.view.wt.wtOverlays.topLeftCornerOverlay);
    }
    this.clones = [];

    if (this.hot.view.wt.wtOverlays.topOverlay.needFullRender) {
      this.clones.push(this.hot.view.wt.wtOverlays.topOverlay.clone.wtTable.holder.parentNode);
    }
    if (this.hot.view.wt.wtOverlays.leftOverlay.needFullRender) {
      this.clones.push(this.hot.view.wt.wtOverlays.leftOverlay.clone.wtTable.holder.parentNode);
    }
    if (this.hot.view.wt.wtOverlays.topLeftCornerOverlay) {
      this.clones.push(this.hot.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder.parentNode);
    }
  }

  bindEvents() {
    var _this = this;

    this.hot.addHook('beforeTouchScroll', function() {
      Handsontable.freezeOverlays = true;

      for (var i = 0, cloneCount = _this.clones.length; i < cloneCount; i++) {
        dom.addClass(_this.clones[i], 'hide-tween');
      }
    });

    this.hot.addHook('afterMomentumScroll', function() {
      Handsontable.freezeOverlays = false;

      for (var i = 0, cloneCount = _this.clones.length; i < cloneCount; i++) {
        dom.removeClass(_this.clones[i], 'hide-tween');
      }

      for (var i = 0, cloneCount = _this.clones.length; i < cloneCount; i++) {
        dom.addClass(_this.clones[i], 'show-tween');
      }

      setTimeout(function() {
        for (var i = 0, cloneCount = _this.clones.length; i < cloneCount; i++) {
          dom.removeClass(_this.clones[i], 'show-tween');
        }
      }, 400);

      for (var i = 0, cloneCount = _this.scrollbars.length; i < cloneCount; i++) {
        _this.scrollbars[i].refresh();
        _this.scrollbars[i].resetFixedPosition();
      }

      _this.hot.view.wt.wtOverlays.scrollCallbacksPending = 0;
      _this.hot.view.wt.wtOverlays.syncScrollWithMaster();

    });
  }

}

export default TouchScroll;

registerPlugin('touchScroll', TouchScroll);

