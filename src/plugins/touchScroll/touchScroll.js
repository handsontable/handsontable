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
    this.scrollbars = [];
    this.clones = [];
  }

  /**
   * Initialize plugin
   */
  init() {
    this.registerEvents();

    this.scrollbars.push(this.hot.view.wt.wtOverlays.topOverlay);
    this.scrollbars.push(this.hot.view.wt.wtOverlays.leftOverlay);

    if (this.hot.view.wt.wtOverlays.topLeftCornerOverlay) {
      this.scrollbars.push(this.hot.view.wt.wtOverlays.topLeftCornerOverlay);
    }
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

    for (let i = 0, cloneCount = this.clones.length; i < cloneCount; i++) {
      dom.removeClass(this.clones[i], 'hide-tween');
    }

    for (let i = 0, cloneCount = this.clones.length; i < cloneCount; i++) {
      dom.addClass(this.clones[i], 'show-tween');
    }

    setTimeout(function() {
      for (let i = 0, cloneCount = this.clones.length; i < cloneCount; i++) {
        dom.removeClass(this.clones[i], 'show-tween');
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

