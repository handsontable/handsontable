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
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns whether the plugin handles its own settings keys without a dedicated key list.
   */
  static get SETTING_KEYS(): true {
    return true;
  }

  /**
   * Collection of scrollbars to update.
   *
   * @type {Array}
   */
  scrollbars: unknown[] = [];
  /**
   * Collection of overlays to update.
   *
   * @type {Array}
   */
  clones: unknown[] = [];
  /**
   * Flag which determines if collection of overlays should be refilled on every table render.
   *
   * @type {boolean}
   * @default false
   */
  lockedCollection: boolean = false;
  /**
   * Flag which determines if walkontable should freeze overlays while scrolling.
   *
   * @type {boolean}
   * @default false
   */
  freezeOverlays: boolean = false;

  /**
   * Check if plugin is enabled.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return isTouchSupported();
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterViewRender', this.#onAfterViewRender);
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
    this.addHook('beforeTouchScroll', this.#onBeforeTouchScroll);
    this.addHook('afterMomentumScroll', this.#onAfterMomentumScroll);
  }

  /**
   * After view render listener.
   */
  #onAfterViewRender = () => {
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
      this.clones.push(topOverlay.clone?.wtTable.holder.parentNode);
    }
    if (bottomOverlay.needFullRender) {
      this.clones.push(bottomOverlay.clone?.wtTable.holder.parentNode);
    }
    if (inlineStartOverlay.needFullRender) {
      this.clones.push(inlineStartOverlay.clone?.wtTable.holder.parentNode);
    }
    if (topInlineStartCornerOverlay) {
      this.clones.push(topInlineStartCornerOverlay.clone?.wtTable.holder.parentNode);
    }
    if (bottomInlineStartCornerOverlay && bottomInlineStartCornerOverlay.clone) {
      this.clones.push(bottomInlineStartCornerOverlay.clone.wtTable.holder.parentNode);
    }
  };

  /**
   * Touch scroll listener.
   */
  #onBeforeTouchScroll = () => {
    this.freezeOverlays = true;

    arrayEach(this.clones, (clone) => {
      addClass(clone as HTMLElement, 'hide-tween');
    });
  };

  /**
   * After momentum scroll listener.
   */
  #onAfterMomentumScroll = () => {
    this.freezeOverlays = false;

    arrayEach(this.clones, (clone) => {
      removeClass(clone as HTMLElement, 'hide-tween');
      addClass(clone as HTMLElement, 'show-tween');
    });

    this.hot._registerTimeout(() => {
      arrayEach(this.clones, (clone) => {
        removeClass(clone as HTMLElement, 'show-tween');
      });
    }, 400);

    arrayEach(this.scrollbars, (scrollbar) => {
      (scrollbar as { refresh(): void; resetFixedPosition(): void }).refresh();
      (scrollbar as { refresh(): void; resetFixedPosition(): void }).resetFixedPosition();
    });

    (this.hot.view._wt.wtOverlays as unknown as { syncScrollWithMaster(): void }).syncScrollWithMaster();
  };
}
