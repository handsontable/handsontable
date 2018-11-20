import { addClass, removeClass } from './../../helpers/dom/element';
import { arrayEach } from './../../helpers/array';
import BasePlugin from './../_base';
import { registerPlugin } from './../../plugins';
import { isTouchSupported } from './../../helpers/feature';

/**
 * @private
 * @plugin TouchScroll
 * @class TouchScroll
 */
class TouchScroll extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    /**
     * Collection of scrollbars to update.
     *
     * @type {Array}
     */
    this.scrollbars = [];
    /**
     * Collection of overlays to update.
     *
     * @type {Array}
     */
    this.clones = [];
    /**
     * Flag which determines if collection of overlays should be refilled on every table render.
     *
     * @type {Boolean}
     * @default false
     */
    this.lockedCollection = false;
    /**
     * Flag which determines if walkontable should freeze overlays while scrolling.
     *
     * @type {Boolean}
     * @default false
     */
    this.freezeOverlays = false;
  }

  /**
   * Check if plugin is enabled.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return isTouchSupported();
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterRender', () => this.onAfterRender());
    this.registerEvents();

    super.enablePlugin();
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   */
  updatePlugin() {
    this.lockedCollection = false;

    super.updatePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Register all necessary events.
   *
   * @private
   */
  registerEvents() {
    this.addHook('beforeTouchScroll', () => this.onBeforeTouchScroll());
    this.addHook('afterMomentumScroll', () => this.onAfterMomentumScroll());
  }

  /**
   * After render listener.
   *
   * @private
   */
  onAfterRender() {
    if (this.lockedCollection) {
      return;
    }

    const { topOverlay, bottomOverlay, leftOverlay, topLeftCornerOverlay, bottomLeftCornerOverlay } = this.hot.view.wt.wtOverlays;

    this.lockedCollection = true;
    this.scrollbars.length = 0;
    this.scrollbars.push(topOverlay);

    if (bottomOverlay.clone) {
      this.scrollbars.push(bottomOverlay);
    }
    this.scrollbars.push(leftOverlay);

    if (topLeftCornerOverlay) {
      this.scrollbars.push(topLeftCornerOverlay);
    }
    if (bottomLeftCornerOverlay && bottomLeftCornerOverlay.clone) {
      this.scrollbars.push(bottomLeftCornerOverlay);
    }

    this.clones.length = 0;

    if (topOverlay.needFullRender) {
      this.clones.push(topOverlay.clone.wtTable.holder.parentNode);
    }
    if (bottomOverlay.needFullRender) {
      this.clones.push(bottomOverlay.clone.wtTable.holder.parentNode);
    }
    if (leftOverlay.needFullRender) {
      this.clones.push(leftOverlay.clone.wtTable.holder.parentNode);
    }
    if (topLeftCornerOverlay) {
      this.clones.push(topLeftCornerOverlay.clone.wtTable.holder.parentNode);
    }
    if (bottomLeftCornerOverlay && bottomLeftCornerOverlay.clone) {
      this.clones.push(bottomLeftCornerOverlay.clone.wtTable.holder.parentNode);
    }
  }

  /**
   * Touch scroll listener.
   *
   * @private
   */
  onBeforeTouchScroll() {
    this.freezeOverlays = true;

    arrayEach(this.clones, (clone) => {
      addClass(clone, 'hide-tween');
    });
  }

  /**
   * After momentum scroll listener.
   *
   * @private
   */
  onAfterMomentumScroll() {
    this.freezeOverlays = false;

    arrayEach(this.clones, (clone) => {
      removeClass(clone, 'hide-tween');
      addClass(clone, 'show-tween');
    });

    setTimeout(() => {
      arrayEach(this.clones, (clone) => {
        removeClass(clone, 'show-tween');
      });
    }, 400);

    arrayEach(this.scrollbars, (scrollbar) => {
      scrollbar.refresh();
      scrollbar.resetFixedPosition();
    });

    this.hot.view.wt.wtOverlays.syncScrollWithMaster();
  }
}

registerPlugin('touchScroll', TouchScroll);

export default TouchScroll;
