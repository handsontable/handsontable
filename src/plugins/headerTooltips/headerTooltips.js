import {
  outerWidth
} from 'handsontable/helpers/dom/element.js';
import {registerPlugin} from 'handsontable/plugins.js';
import {rangeEach} from 'handsontable/helpers/number';
import BasePlugin from 'handsontable/plugins/_base.js';

/**
 * @plugin HeaderTooltips
 * @pro
 *
 * @description
 * Allows adding a tooltip to the table headers.
 *
 * Available options:
 * * the `rows` property defines if tooltips should be added to row headers,
 * * the `columns` property defines if tooltips should be added to column headers,
 * * the `onlyTrimmed` property defines if tooltips should be added only to headers, which content is trimmed by the header itself (the content being wider then the header).
 *
 * @example
 * ```js
 * ...
 *  headerTooltips: {
 *    rows: true,
 *    columns: true,
 *    onlyTrimmed: false
 *  }
 * ...
 * ```
 */
class HeaderTooltips extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    /**
     * Cached plugin settings.
     *
     * @type {Boolean|Object}
     */
    this.settings = null;
  }

  /**
   * Check if plugin is enabled.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().headerTooltips;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.settings = this.hot.getSettings().headerTooltips;

    this.parseSettings();

    this.addHook('afterGetColHeader', (col, TH) => this.onAfterGetHeader(col, TH));
    this.addHook('afterGetRowHeader', (col, TH) => this.onAfterGetHeader(col, TH));

    super.enablePlugin();
  }

  /**
   * Disable the plugin.
   */
  disablePlugin() {
    this.settings = null;

    this.clearTitleAttributes();

    super.disablePlugin();
  }

  /**
   * Parse the plugin settings.
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
   * Clear the previously assigned title attributes.
   *
   * @private
   */
  clearTitleAttributes() {
    let headerLevels = this.hot.view.wt.getSetting('columnHeaders').length;
    let mainHeaders = this.hot.view.wt.wtTable.THEAD;
    let topHeaders = this.hot.view.wt.wtOverlays.topOverlay.clone.wtTable.THEAD;
    let topLeftCornerHeaders = this.hot.view.wt.wtOverlays.topLeftCornerOverlay ?
      hot.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.THEAD : null;

    rangeEach(0, headerLevels - 1, (i) => {
      let masterLevel = mainHeaders.childNodes[i];
      let topLevel = topHeaders.childNodes[i];
      let topLeftCornerLevel = topLeftCornerHeaders ? topLeftCornerHeaders.childNodes[i] : null;

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
   * Add a tooltip to the headers.
   *
   * @private
   * @param {Number} index
   * @param {HTMLElement} TH
   */
  onAfterGetHeader(index, TH) {
    let innerSpan = TH.querySelector('span');
    let isColHeader = TH.parentNode.parentNode.nodeName === 'THEAD';

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
   * Destroy the plugin.
   */
  destroy() {
    this.settings = null;

    super.destroy();
  }

}

registerPlugin('headerTooltips', HeaderTooltips);

export default HeaderTooltips;
