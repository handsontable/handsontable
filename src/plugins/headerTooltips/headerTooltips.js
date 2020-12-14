import {
  outerWidth
} from '../../helpers/dom/element';
import { warn } from '../../helpers/console';
import { rangeEach } from '../../helpers/number';
import { BasePlugin } from '../base';

export const PLUGIN_KEY = 'headerTooltips';
export const PLUGIN_PRIORITY = 270;
let isDeprecationMessageShowed = false;

/**
 * @plugin HeaderTooltips
 *
 * @deprecated This plugin is deprecated and will be removed in the next major release.
 * @description
 * Allows to add a tooltip to the table headers.
 *
 * Available options:
 * * the `rows` property defines if tooltips should be added to row headers,
 * * the `columns` property defines if tooltips should be added to column headers,
 * * the `onlyTrimmed` property defines if tooltips should be added only to headers, which content is trimmed by the header itself (the content being wider then the header).
 *
 * @example
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   // enable and configure header tooltips
 *   headerTooltips: {
 *     rows: true,
 *     columns: true,
 *     onlyTrimmed: false
 *   }
 * });
 * ```
 */
export class HeaderTooltips extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  constructor(hotInstance) {
    super(hotInstance);

    /**
     * Cached plugin settings.
     *
     * @private
     * @type {boolean|object}
     */
    this.settings = null;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link HeaderTooltips#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    if (!isDeprecationMessageShowed) {
      isDeprecationMessageShowed = true;
      warn('The Header Tooltips plugin is deprecated and will be removed in the next major release');
    }

    this.settings = this.hot.getSettings()[PLUGIN_KEY];

    this.parseSettings();

    this.addHook('afterGetColHeader', (col, TH) => this.onAfterGetHeader(col, TH));
    this.addHook('afterGetRowHeader', (col, TH) => this.onAfterGetHeader(col, TH));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.settings = null;

    this.clearTitleAttributes();

    super.disablePlugin();
  }

  /**
   * Parses the plugin settings.
   *
   * @private
   */
  parseSettings() {
    if (typeof this.settings === 'boolean') {
      this.settings = {
        rows: true,
        columns: true,
        onlyTrimmed: false
      };
    }
  }

  /**
   * Clears the previously assigned title attributes.
   *
   * @private
   */
  clearTitleAttributes() {
    const headerLevels = this.hot.view.wt.getSetting('columnHeaders').length;
    const mainHeaders = this.hot.view.wt.wtTable.THEAD;
    const topHeaders = this.hot.view.wt.wtOverlays.topOverlay.clone.wtTable.THEAD;
    const topLeftCornerOverlay = this.hot.view.wt.wtOverlays.topLeftCornerOverlay;
    const topLeftCornerHeaders = topLeftCornerOverlay ? topLeftCornerOverlay.clone.wtTable.THEAD : null;

    rangeEach(0, headerLevels - 1, (i) => {
      const masterLevel = mainHeaders.childNodes[i];
      const topLevel = topHeaders.childNodes[i];
      const topLeftCornerLevel = topLeftCornerHeaders ? topLeftCornerHeaders.childNodes[i] : null;

      rangeEach(0, masterLevel.childNodes.length - 1, (j) => {
        masterLevel.childNodes[j].removeAttribute('title');

        if (topLevel && topLevel.childNodes[j]) {
          topLevel.childNodes[j].removeAttribute('title');
        }

        if (topLeftCornerHeaders && topLeftCornerLevel && topLeftCornerLevel.childNodes[j]) {
          topLeftCornerLevel.childNodes[j].removeAttribute('title');
        }
      });
    }, true);
  }

  /**
   * Adds a tooltip to the headers.
   *
   * @private
   * @param {number} index Visual column index.
   * @param {HTMLElement} TH Header's TH element.
   */
  onAfterGetHeader(index, TH) {
    const innerSpan = TH.querySelector('span');
    const isColHeader = TH.parentNode.parentNode.nodeName === 'THEAD';

    if (isColHeader && this.settings.columns || !isColHeader && this.settings.rows) {
      if (this.settings.onlyTrimmed) {
        if (outerWidth(innerSpan) >= outerWidth(TH) && outerWidth(innerSpan) !== 0) {
          TH.setAttribute('title', innerSpan.textContent);
        }

      } else {
        TH.setAttribute('title', innerSpan.textContent);
      }
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.settings = null;

    super.destroy();
  }

}
