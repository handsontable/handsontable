import * as dom from './../../dom.js';
import {registerPlugin, getPlugin} from './../../plugins.js';
import BasePlugin from './../_base.js';

/**
 * @class NestedHeaders
 * @plugin NestedHeaders
 *
 * @description
 * Allows creating a nested header structure, using the HTML's colspan attribute.
 *
 * @example
 *
 * ```js
 * ...
 * let hot = new Handsontable(document.getElementById('example'), {
 *   date: getData(),
 *   nestedHeaders: {
 *     colHeaders: [
 *       ['a', 'b', 'c', 'd', 'e'],
 *       function() {
 *         return ['f', 'g', 'h', 'i', 'j', 'k']
 *       }
 *     ],
 *     colspan: [
*        [1, 3, 1, 1],
 *       [1, 1, 2, 1, 1]
 *     ],
 *     overwriteHeaders: true
 *   }
 * ...
 * ```
 */
class NestedHeaders extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);

    if (!this.hot.getSettings().nestedHeaders) {
      return;
    }

    this.settings = this.hot.getSettings().nestedHeaders;
    if (this.settings.overwriteHeaders === void 0) {
      this.settings.overwriteHeaders = true;
    }

    this.bindHooks();
  }

  bindHooks() {
    this.hot.addHook('afterGetColumnHeaderRenderers', (array) => this.onAfterGetColumnHeaderRenderers(array));
  }

  /**
   * Checks wheter the provided nested header value is a function - if so, executes it
   *
   * @param {Array|Function} value
   * @returns {Array}
   */
  prepareHeaderValue(value) {
    if (typeof value === 'function') {
      return value();
    } else {
      return value;
    }
  }

  /**
   * Generates the appropriate header renederer for a header row
   *
   * @param {Integer} headerRow
   * @returns {Function}
   */
  headerRendererFactory(headerRow) {
    let _this = this;

    return function(index, TH) {
      let colspan = _this.settings.colspan && _this.settings.colspan[headerRow] ? _this.settings.colspan[headerRow][index] : 1;

      if (colspan && colspan > 1) {
        TH.setAttribute('colspan', colspan);
      }

      dom.empty(TH);

      let divEl = document.createElement('DIV');
      dom.addClass(divEl, 'relative');
      let spanEl = document.createElement('SPAN');
      dom.addClass(spanEl, 'colHeader');
      dom.fastInnerText(spanEl, _this.prepareHeaderValue(_this.settings.colHeaders[headerRow])[index] || '');

      divEl.appendChild(spanEl);
      TH.appendChild(divEl);

      Handsontable.hooks.run(this.instance, 'afterGetColHeader', index, TH);
    };
  }

  /**
   * `afterGetColumnHeader` hook callback - prepares the header structure
   *
   * @param array
   */
  onAfterGetColumnHeaderRenderers(array) {
    let overwriteHeaders = this.settings.overwriteHeaders;

    if (array) {
      if (overwriteHeaders === true) {
        array.length = 0;
      }

      for (let headersCount = this.settings.colHeaders.length, i = headersCount - (!overwriteHeaders ? array.length : 0) - 1; i >= 0; i--) {
        array.push(this.headerRendererFactory(i));
      }

      array.reverse();
    }
  }

}

export {NestedHeaders};

registerPlugin('nestedHeaders', NestedHeaders);