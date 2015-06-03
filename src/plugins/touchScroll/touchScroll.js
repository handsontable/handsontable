import * as dom from './../../dom.js';
import BasePlugin from './../_base.js';
import {registerPlugin} from './../../plugins.js';


/**
 * @class TouchScroll
 * @plugin
 */
class TouchScroll extends BasePlugin {
  /**
   * @param {Handsontable} hotInstance
   */
  constructor(hotInstance) {
    super(hotInstance);

    this.hot.addHook('afterInit', () => this.init());
    this.hot.addHook('afterUpdateSettings', () => this.onAfterUpdateSettings());
    this.scrollbars = [];
    this.clones = [];
  }

  /**
   * Initialize plugin
   */
  init() {
    this.registerEvents();
    this.onAfterUpdateSettings();
  }

  onAfterUpdateSettings() {
    var _this = this;

    // Wait for the overlays to render and update their .needFullRender property
    this.hot.addHookOnce('afterRender', function() {
      let wtOverlays = _this.hot.view.wt.wtOverlays;

      _this.scrollbars = [];
      _this.scrollbars.push(wtOverlays.topOverlay);
      _this.scrollbars.push(wtOverlays.leftOverlay);

      if (wtOverlays.topLeftCornerOverlay) {
        _this.scrollbars.push(wtOverlays.topLeftCornerOverlay);
      }
      _this.clones = [];

      if (wtOverlays.topOverlay.needFullRender) {
        _this.clones.push(wtOverlays.topOverlay.clone.wtTable.holder.parentNode);
      }
      if (wtOverlays.leftOverlay.needFullRender) {
        _this.clones.push(wtOverlays.leftOverlay.clone.wtTable.holder.parentNode);
      }
      if (wtOverlays.topLeftCornerOverlay) {
        _this.clones.push(wtOverlays.topLeftCornerOverlay.clone.wtTable.holder.parentNode);
      }
    });
  }

  /**
   * Register all necessary events
   */
  registerEvents() {
    this.hot.addHook('beforeTouchScroll', () => this.onBeforeTouchScroll());
    this.hot.addHook('afterMomentumScroll', () => this.onAfterMomentumScroll());
  }

  /**
   * Touch scroll listener
   */
  onBeforeTouchScroll() {
    Handsontable.freezeOverlays = true;

    for (let i = 0, cloneCount = this.clones.length; i < cloneCount; i++) {
      dom.addClass(this.clones[i], 'hide-tween');
    }
  }

  /**
   * After momentum scroll listener
   */
  onAfterMomentumScroll() {
    Handsontable.freezeOverlays = false;
    var _that = this;

    for (let i = 0, cloneCount = this.clones.length; i < cloneCount; i++) {
      dom.removeClass(this.clones[i], 'hide-tween');
    }

    for (let i = 0, cloneCount = this.clones.length; i < cloneCount; i++) {
      dom.addClass(this.clones[i], 'show-tween');
    }

    setTimeout(function() {
      for (let i = 0, cloneCount = _that.clones.length; i < cloneCount; i++) {
        dom.removeClass(_that.clones[i], 'show-tween');
      }
    }, 400);

    for (let i = 0, cloneCount = this.scrollbars.length; i < cloneCount; i++) {
      this.scrollbars[i].refresh();
      this.scrollbars[i].resetFixedPosition();
    }
    this.hot.view.wt.wtOverlays.syncScrollWithMaster();
  }
}

export {TouchScroll};

registerPlugin('touchScroll', TouchScroll);

