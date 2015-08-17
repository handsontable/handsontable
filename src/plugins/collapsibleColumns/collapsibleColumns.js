import {
  addClass,
  hasClass,
  fastInnerText
} from './../../helpers/dom/element.js';
import {EventManager} from './../../eventManager.js';
import {registerPlugin, getPlugin} from './../../plugins.js';
import BasePlugin from './../_base.js';

/**
 * @class CollapsibleColumns
 * @plugin CollapsibleColumns
 * @dependencies NestedHeaders HiddenColumns
 *
 * @description
 * Allows collapsing of headers with a defined colspan
 */
class CollapsibleColumns extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);

    if (!this.hot.getSettings().collapsibleColumns) {
      return;
    }

    this.settings = this.hot.getSettings().collapsibleColumns;
    this.buttonEnabledList = {};
    if (typeof this.settings !== 'boolean') {
      this.parseSettings();
    }

    this.hiddenColumnsPlugin = null;
    this.collapsedSections = {};

    this.bindHooks();
  }

  parseSettings() {
    for (var i in this.settings) {
      if (this.settings.hasOwnProperty(i)) {
        let currentEl = this.settings[i];

        if (!this.buttonEnabledList[currentEl.row]) {
          this.buttonEnabledList[currentEl.row] = [];
        }

        this.buttonEnabledList[currentEl.row][currentEl.col] = currentEl.collapsible;
      }
    }
  }

  /**
   * Checks if all the needed dependencies are enabled
   *
   * @returns {Boolean}
   */
  checkDependencies() {
    let settings = this.hot.getSettings();

    if (!settings.nestedHeaders) {
      console.warn('You need to configure the Nested Headers plugin in order to use collapsible headers.');

      return false;
    }

    if (!settings.hiddenColumns) {
      console.warn('You need to configure the Nested Headers plugin in order to use collapsible headers.');

      return false;
    }
  }

  /**
   * Bind the HOT hooks
   */
  bindHooks() {
    this.hot.addHook('afterInit', () => this.onAfterInit());
    this.hot.addHook('afterGetColHeader', (col, TH) => this.onAfterGetColHeader(col, TH));
    this.hot.addHook('beforeOnCellMouseDown', (event, coords, TD) => this.onBeforeOnCellMouseDown(event, coords, TD));
  }

  onAfterInit() {
    this.checkDependencies();

    this.hiddenColumnsPlugin = this.hot.getPlugin('hiddenColumns');
    this.columnHeaderLevelCount = this.hot.view.wt.getSetting('columnHeaders').length;
    this.nestedHeadersPlugin = this.hot.getPlugin('nestedHeaders');
  }

  /**
   * Generates the indicator element
   *
   * @param {Number} col
   * @param {HTMLElement} TH
   * @returns {HTMLElement}
   */
  generateIndicator(col, TH) {
    let TR = TH.parentNode;
    let THEAD = TR.parentNode;
    let row = (-1) * THEAD.childNodes.length + Array.prototype.indexOf.call(THEAD.childNodes, TR);

    if (Object.keys(this.buttonEnabledList).length > 0 && (!this.buttonEnabledList[row] || !this.buttonEnabledList[row][col])) {
      return null;
    }

    let divEl = document.createElement('DIV');

    addClass(divEl, 'collapsibleIndicator');

    if (this.collapsedSections[row] && this.collapsedSections[row][col] === true) {
      addClass(divEl, 'collapsed');
      fastInnerText(divEl, '+');
    } else {
      addClass(divEl, 'expanded');
      fastInnerText(divEl, '-');
    }

    return divEl;
  }

  /**
   * Add the indicator to the headers
   *
   * @param {Number} col
   * @param {HTMLElement} TH
   */
  onAfterGetColHeader(col, TH) {
    if (TH.hasAttribute('colspan') && TH.getAttribute('colspan') > 1) {
      let button = this.generateIndicator(col, TH);
      if (button !== null) {
        TH.querySelector('div:first-child').appendChild(button);

      }
    }
  }

  /**
   * Indicator mouse event callback
   *
   * @param {Object} event
   * @param {Object} coords
   * @param {HTMLElement} TD
   */
  onBeforeOnCellMouseDown(event, coords, TD) {
    if (hasClass(event.target, 'collapsibleIndicator')) {

      if (hasClass(event.target, 'expanded')) {

        // mark section as collapsed
        if (!this.collapsedSections[coords.row]) {
          this.collapsedSections[coords.row] = [];
        }

        this.markSectionAs('collapsed', coords.row, coords.col, true);

        this.toggleCollapsedSection(coords, TD, 'collapse');

      } else if (hasClass(event.target, 'collapsed')) {

        this.markSectionAs('expanded', coords.row, coords.col, true);

        this.toggleCollapsedSection(coords, TD, 'expand');
      }

      event.stopImmediatePropagation();
    }
  }

  /**
   * Mark (internally) a section as 'collapsed' or 'expanded' (optionally, also mark the 'child' headers)
   *
   * @param {String} state
   * @param {Number} row
   * @param {Number} col
   * @param {HTMLElement} TH
   * @param {Boolean} recursive
   */
  markSectionAs(state, row, col, recursive) {
    if (!this.collapsedSections[row]) {
      this.collapsedSections[row] = [];
    }

    switch (state) {
      case 'collapsed':
        this.collapsedSections[row][col] = true;

        break;
      case 'expanded':
        this.collapsedSections[row][col] = void 0;

        break;
    }

    if (recursive) {
      let nestedHeadersColspans = this.nestedHeadersPlugin.colspanArray;
      let level = this.nestedHeadersPlugin.rowCoordsToLevel(row);
      let childHeaders = this.nestedHeadersPlugin.getChildHeaders(row, col);
      let childColspanLevel = nestedHeadersColspans[level + 1];

      for (let i = 1, childrenLength = childHeaders.length; i < childrenLength; i++) {

        if (childColspanLevel && childColspanLevel[childHeaders[i]].colspan > 1) {
          this.markSectionAs(state, row + 1, childHeaders[i], true);

        }
      }
    }
  }

  /**
   * Collapse/Expand a section
   *
   * @param {Object} coords
   * @param {HTMLElement} TD
   * @param {String} action
   */
  toggleCollapsedSection(coords, TD, action) {
    let hiddenColumns = this.hiddenColumnsPlugin.hiddenColumns;
    let colspanArray = this.nestedHeadersPlugin.colspanArray;
    let level = this.nestedHeadersPlugin.rowCoordsToLevel(coords.row);
    let currentHeaderColspan = colspanArray[level][coords.col].colspan;
    let childHeaders = this.nestedHeadersPlugin.getChildHeaders(coords.row, coords.col);
    let childColspanLevel = colspanArray[level + 1];
    let firstChildColspan = childColspanLevel ? childColspanLevel[childHeaders[0]].colspan || 1 : 1;

    for (let i = firstChildColspan; i < currentHeaderColspan; i++) {
      let colToHide = coords.col + i;


      switch (action) {
        case 'collapse':
          if (!hiddenColumns[colToHide]) {
            hiddenColumns[colToHide] = true;
          }
          break;
        case 'expand':
          if (hiddenColumns[colToHide]) {
            hiddenColumns[colToHide] = void 0;
          }
          break;
      }
    }

    this.hot.render();
  }


}

export {CollapsibleColumns};

registerPlugin('collapsibleColumns', CollapsibleColumns);