import { addClass, removeClass } from '../../helpers/dom/element';
import { arrayEach } from '../../helpers/array';
import { BasePlugin } from '../base';
import { isTouchSupported } from '../../helpers/feature';

export const PLUGIN_KEY = 'touchScroll';
export const PLUGIN_PRIORITY = 200;

/**
 * @private
 * @plugin TouchScroll
 * @class TouchScroll
 */
export class TouchScroll extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get SETTING_KEYS() {
    return true;
  }

  /**
   * Collection of scrollbars to update.
   *
   * @type {Array}
   */
  scrollbars = [];
  /**
   * Collection of overlays to update.
   *
   * @type {Array}
   */
  clones = [];
  /**
   * Flag which determines if collection of overlays should be refilled on every table render.
   *
   * @type {boolean}
   * @default false
   */
  lockedCollection = false;
  /**
   * Flag which determines if walkontable should freeze overlays while scrolling.
   *
   * @type {boolean}
   * @default false
   */
  freezeOverlays = false;

  /**
   * Check if plugin is enabled.
   *
   * @returns {boolean}
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

    this.addHook('afterViewRender', () => this.#onAfterViewRender());
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
    this.addHook('beforeTouchScroll', () => this.#onBeforeTouchScroll());
    this.addHook('afterMomentumScroll', () => this.#onAfterMomentumScroll());
  }

  /**
   * After view render listener.
   */
  #onAfterViewRender() {
    if (this.lockedCollection) {
      return;
    }

    const {
      topOverlay,
      bottomOverlay,
      inlineStartOverlay,
      topInlineStartCornerOverlay,
      bottomInlineStartCornerOverlay
    } = this.hot.view._wt.wtOverlays;

    this.lockedCollection = true;
    this.scrollbars.length = 0;
    this.scrollbars.push(topOverlay);

    if (bottomOverlay.clone) {
      this.scrollbars.push(bottomOverlay);
    }

    this.scrollbars.push(inlineStartOverlay);

    if (topInlineStartCornerOverlay) {
      this.scrollbars.push(topInlineStartCornerOverlay);
    }
    if (bottomInlineStartCornerOverlay && bottomInlineStartCornerOverlay.clone) {
      this.scrollbars.push(bottomInlineStartCornerOverlay);
    }

    this.clones = [];

    if (topOverlay.needFullRender) {
      this.clones.push(topOverlay.clone.wtTable.holder.parentNode);
    }
    if (bottomOverlay.needFullRender) {
      this.clones.push(bottomOverlay.clone.wtTable.holder.parentNode);
    }
    if (inlineStartOverlay.needFullRender) {
      this.clones.push(inlineStartOverlay.clone.wtTable.holder.parentNode);
    }
    if (topInlineStartCornerOverlay) {
      this.clones.push(topInlineStartCornerOverlay.clone.wtTable.holder.parentNode);
    }
    if (bottomInlineStartCornerOverlay && bottomInlineStartCornerOverlay.clone) {
      this.clones.push(bottomInlineStartCornerOverlay.clone.wtTable.holder.parentNode);
    }
  }

  /**
   * Touch scroll listener.
   */
  #onBeforeTouchScroll() {
    this.freezeOverlays = true;

    arrayEach(this.clones, (clone) => {
      addClass(clone, 'hide-tween');
    });
  }

  /**
   * After momentum scroll listener.
   */
  #onAfterMomentumScroll() {
    this.freezeOverlays = false;

    arrayEach(this.clones, (clone) => {
      removeClass(clone, 'hide-tween');
      addClass(clone, 'show-tween');
    });

    this.hot._registerTimeout(() => {
      arrayEach(this.clones, (clone) => {
        removeClass(clone, 'show-tween');
      });
    }, 400);

    arrayEach(this.scrollbars, (scrollbar) => {
      scrollbar.refresh();
      scrollbar.resetFixedPosition();
    });

    this.hot.view._wt.wtOverlays.syncScrollWithMaster();
  }
}
