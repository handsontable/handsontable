import {objectEach} from 'handsontable/helpers/object';
import {arrayEach} from 'handsontable/helpers/array';
import {rangeEach} from 'handsontable/helpers/number';
import {
  addClass,
  hasClass,
  fastInnerText
} from 'handsontable/helpers/dom/element';
import EventManager from 'handsontable/eventManager';
import {
  registerPlugin,
  getPlugin
} from 'handsontable/plugins';
import {stopImmediatePropagation} from 'handsontable/helpers/dom/event';
import BasePlugin from 'handsontable/plugins/_base';

/**
 * @plugin CollapsibleColumns
 * @pro
 * @dependencies NestedHeaders HiddenColumns
 *
 * @description
 * The CollapsibleColumns plugin allows collapsing of columns, covered by a header with the `colspan` property defined.
 *
 * Clicking the "collapse/expand" button collapses (or expands) all "child" headers except the first one.
 *
 * Setting the `collapsibleColumns` property to `true` will display a "collapse/expand" button in every header with a defined
 * `colspan` property.
 *
 * To limit this functionality to a smaller group of headers, define the `collapsibleColumns` property as an array of objects, as in
 * the example below.
 * @example
 * ```js
 * ...
 *  collapsibleColumns: [
 *    {row: -4, col: 1, collapsible: true},
 *    {row: -3, col: 5, collapsible: true}
 *  ]
 * ...
 * ```
 * ```js
 * ...
 *  collapsibleColumns: true
 * ...
 * ```
 */
class CollapsibleColumns extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);

    /**
     * Cached plugin settings.
     *
     * @type {Boolean|Array}
     */
    this.settings = null;
    /**
     * Object listing headers with buttons enabled.
     *
     * @type {Object}
     */
    this.buttonEnabledList = {};
    /**
     * Cached reference to the HiddenColumns plugin.
     *
     * @type {Object}
     */
    this.hiddenColumnsPlugin = null;
    /**
     * Cached reference to the NestedHeaders plugin.
     *
     * @type {Object}
     */
    this.nestedHeadersPlugin = null;
    /**
     * Object listing the currently collapsed sections.
     *
     * @type {Object}
     */
    this.collapsedSections = {};
    /**
     * Number of column header levels.
     *
     * @type {Number}
     */
    this.columnHeaderLevelCount = null;
    /**
     * Event manager instance reference.
     *
     * @type {EventManager}
     */
    this.eventManager = null;
  }

  /**
   * Check if the plugin is enabled.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().collapsibleColumns;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.settings = this.hot.getSettings().collapsibleColumns;

    if (typeof this.settings !== 'boolean') {
      this.parseSettings();
    }

    this.hiddenColumnsPlugin = this.hot.getPlugin('hiddenColumns');
    this.nestedHeadersPlugin = this.hot.getPlugin('nestedHeaders');

    this.checkDependencies();

    this.addHook('afterRender', () => this.onAfterRender());
    this.addHook('afterInit', () => this.onAfterInit());
    this.addHook('afterGetColHeader', (col, TH) => this.onAfterGetColHeader(col, TH));
    this.addHook('beforeOnCellMouseDown', (event, coords, TD) => this.onBeforeOnCellMouseDown(event, coords, TD));

    this.eventManager = new EventManager(this.hot);

    super.enablePlugin();
  }

  /**
   * Disable the plugin.
   */
  disablePlugin() {
    this.settings = null;
    this.buttonEnabledList = {};
    this.hiddenColumnsPlugin = null;
    this.collapsedSections = {};

    this.clearButtons();

    super.disablePlugin();
  }

  /**
   * Clear the expand/collapse buttons.
   *
   * @private
   */
  clearButtons() {
    if (!this.hot.view) {
      return;
    }

    let headerLevels = this.hot.view.wt.getSetting('columnHeaders').length;
    let mainHeaders = this.hot.view.wt.wtTable.THEAD;
    let topHeaders = this.hot.view.wt.wtOverlays.topOverlay.clone.wtTable.THEAD;
    let topLeftCornerHeaders = this.hot.view.wt.wtOverlays.topLeftCornerOverlay ?
      this.hot.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.THEAD : null;

    let removeButton = function(button) {
      if (button) {
        button.parentNode.removeChild(button);
      }
    };

    rangeEach(0, headerLevels - 1, (i) => {
      let masterLevel = mainHeaders.childNodes[i];
      let topLevel = topHeaders.childNodes[i];
      let topLeftCornerLevel = topLeftCornerHeaders ? topLeftCornerHeaders.childNodes[i] : null;

      rangeEach(0, masterLevel.childNodes.length - 1, (j) => {
        let button = masterLevel.childNodes[j].querySelector('.collapsibleIndicator');

        removeButton(button);

        if (topLevel && topLevel.childNodes[j]) {
          button = topLevel.childNodes[j].querySelector('.collapsibleIndicator');

          removeButton(button);
        }

        if (topLeftCornerHeaders && topLeftCornerLevel && topLeftCornerLevel.childNodes[j]) {
          button = topLeftCornerLevel.childNodes[j].querySelector('.collapsibleIndicator');

          removeButton(button);
        }
      });
    }, true);
  }

  /**
   * Parse the plugin settings and create a button configuration array.
   */
  parseSettings() {
    objectEach(this.settings, (val) => {

      if (!this.buttonEnabledList[val.row]) {
        this.buttonEnabledList[val.row] = {};
      }

      this.buttonEnabledList[val.row][val.col] = val.collapsible;
    });
  }

  /**
   * Check if plugin dependencies are met.
   *
   * @returns {Boolean}
   */
  meetsDependencies() {
    let settings = this.hot.getSettings();

    return settings.nestedHeaders && settings.hiddenColumns;
  }

  /**
   * Checks if all the required dependencies are enabled.
   */
  checkDependencies() {
    let settings = this.hot.getSettings();

    if (this.meetsDependencies()) {
      return;
    }

    if (!settings.nestedHeaders) {
      console.warn('You need to configure the Nested Headers plugin in order to use collapsible headers.');
    }

    if (!settings.hiddenColumns) {
      console.warn('You need to configure the Hidden Columns plugin in order to use collapsible headers.');
    }
  }

  /**
   * Generates the indicator element.
   *
   * @param {Number} col Column index.
   * @param {HTMLElement} TH TH Element.
   * @returns {HTMLElement}
   */
  generateIndicator(col, TH) {
    let TR = TH.parentNode;
    let THEAD = TR.parentNode;
    let row = ((-1) * THEAD.childNodes.length) + Array.prototype.indexOf.call(THEAD.childNodes, TR);

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
   * Mark (internally) a section as 'collapsed' or 'expanded' (optionally, also mark the 'child' headers).
   *
   * @param {String} state State ('collapsed' or 'expanded').
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @param {Boolean} recursive If `true`, it will also attempt to mark the child sections.
   */
  markSectionAs(state, row, column, recursive) {
    if (!this.collapsedSections[row]) {
      this.collapsedSections[row] = {};
    }

    switch (state) {
      case 'collapsed':
        this.collapsedSections[row][column] = true;

        break;
      case 'expanded':
        this.collapsedSections[row][column] = void 0;

        break;
      default:
        break;
    }

    if (recursive) {
      let nestedHeadersColspans = this.nestedHeadersPlugin.colspanArray;
      let level = this.nestedHeadersPlugin.rowCoordsToLevel(row);
      let childHeaders = this.nestedHeadersPlugin.getChildHeaders(row, column);
      let childColspanLevel = nestedHeadersColspans[level + 1];

      for (let i = 1; i < childHeaders.length; i++) {
        if (childColspanLevel && childColspanLevel[childHeaders[i]].colspan > 1) {
          this.markSectionAs(state, row + 1, childHeaders[i], true);
        }
      }
    }
  }

  /**
   * Expand section at the provided coords.
   *
   * @param {Object} coords Contains coordinates information. (`coords.row`, `coords.col`)
   */
  expandSection(coords) {
    this.markSectionAs('expanded', coords.row, coords.col, true);
    this.toggleCollapsibleSection(coords, 'expand');
  }

  /**
   * Collapse section at the provided coords.
   *
   * @param {Object} coords Contains coordinates information. (`coords.row`, `coords.col`)
   */
  collapseSection(coords) {
    this.markSectionAs('collapsed', coords.row, coords.col, true);
    this.toggleCollapsibleSection(coords, 'collapse');
  }

  /**
   * Collapse or expand all collapsible sections, depending on the action parameter.
   *
   * @param {String} action 'collapse' or 'expand'.
   */
  toggleAllCollapsibleSections(action) {
    let nestedHeadersColspanArray = this.nestedHeadersPlugin.colspanArray;

    if (this.settings === true) {

      arrayEach(nestedHeadersColspanArray, (headerLevel, i) => {
        arrayEach(headerLevel, (header, j) => {
          if (header.colspan > 1) {
            i = parseInt(i, 10);
            j = parseInt(j, 10);

            let row = this.nestedHeadersPlugin.levelToRowCoords(i);
            let col = j;

            this.markSectionAs(action === 'collapse' ? 'collapsed' : 'expanded', row, col, true);
            this.toggleCollapsibleSection({
              row: row,
              col: col
            }, action);

          }
        });
      });

    } else {
      objectEach(this.buttonEnabledList, (headerRow, i) => {
        objectEach(headerRow, (header, j) => {
          i = parseInt(i, 10);
          j = parseInt(j, 10);

          this.markSectionAs(action === 'collapse' ? 'collapsed' : 'expanded', i, j, true);
          this.toggleCollapsibleSection({
            row: i,
            col: j
          }, action);

        });
      });
    }
  }

  /**
   * Collapse all collapsible sections.
   */
  collapseAll() {
    this.toggleAllCollapsibleSections('collapse');
  }

  /**
   * Expand all collapsible sections.
   */
  expandAll() {
    this.toggleAllCollapsibleSections('expand');
  }

  /**
   * Collapse/Expand a section.
   *
   * @param {Object} coords Section coordinates.
   * @param {String} action Action definition ('collapse' or 'expand').
   */
  toggleCollapsibleSection(coords, action) {
    if (coords.row) {
      coords.row = parseInt(coords.row, 10);
    }
    if (coords.col) {
      coords.col = parseInt(coords.col, 10);
    }

    let hiddenColumns = this.hiddenColumnsPlugin.hiddenColumns;
    let colspanArray = this.nestedHeadersPlugin.colspanArray;
    let level = this.nestedHeadersPlugin.rowCoordsToLevel(coords.row);
    let currentHeaderColspan = colspanArray[level][coords.col].colspan;
    let childHeaders = this.nestedHeadersPlugin.getChildHeaders(coords.row, coords.col);
    let nextLevel = level + 1;
    let childColspanLevel = colspanArray[nextLevel];
    let firstChildColspan = childColspanLevel ? childColspanLevel[childHeaders[0]].colspan || 1 : 1;

    while (firstChildColspan === currentHeaderColspan && nextLevel < this.columnHeaderLevelCount) {
      nextLevel += 1;
      childColspanLevel = colspanArray[nextLevel];
      firstChildColspan = childColspanLevel ? childColspanLevel[childHeaders[0]].colspan || 1 : 1;
    }

    rangeEach(firstChildColspan, currentHeaderColspan - 1, (i) => {
      let colToHide = coords.col + i;

      switch (action) {
        case 'collapse':
          if (!this.hiddenColumnsPlugin.isHidden(colToHide)) {
            hiddenColumns.push(colToHide);
          }

          break;
        case 'expand':
          if (this.hiddenColumnsPlugin.isHidden(colToHide)) {
            hiddenColumns.splice(hiddenColumns.indexOf(colToHide), 1);
          }

          break;
        default:
          break;
      }
    });

    this.hot.render();

  }

  /**
   * Add the indicator to the headers.
   *
   * @private
   * @param {Number} column Column index.
   * @param {HTMLElement} TH TH element.
   */
  onAfterGetColHeader(column, TH) {
    if (TH.hasAttribute('colspan') && TH.getAttribute('colspan') > 1 && column >= this.hot.getSettings().fixedColumnsLeft) {
      let button = this.generateIndicator(column, TH);

      if (button !== null) {
        TH.querySelector('div:first-child').appendChild(button);
      }
    }
  }

  /**
   * Indicator mouse event callback.
   *
   * @private
   * @param {Object} event Mouse event.
   * @param {Object} coords Event coordinates.
   */
  onBeforeOnCellMouseDown(event, coords) {
    if (hasClass(event.target, 'collapsibleIndicator')) {
      if (hasClass(event.target, 'expanded')) {

        // mark section as collapsed
        if (!this.collapsedSections[coords.row]) {
          this.collapsedSections[coords.row] = [];
        }

        this.markSectionAs('collapsed', coords.row, coords.col, true);
        this.eventManager.fireEvent(event.target, 'mouseup');
        this.toggleCollapsibleSection(coords, 'collapse');

      } else if (hasClass(event.target, 'collapsed')) {

        this.markSectionAs('expanded', coords.row, coords.col, true);
        this.eventManager.fireEvent(event.target, 'mouseup');
        this.toggleCollapsibleSection(coords, 'expand');
      }

      stopImmediatePropagation(event);
      return false;
    }
  }

  /**
   * AfterInit hook callback.
   *
   * @private
   */
  onAfterInit() {
    this.columnHeaderLevelCount = this.hot.view.wt.getSetting('columnHeaders').length;
  }

  /**
   * AfterRender hook callback.
   */
  onAfterRender() {
    if (!this.nestedHeadersPlugin.enabled || !this.hiddenColumnsPlugin.enabled) {
      this.disablePlugin();
    }
  }

  /**
   * Destroy the plugin.
   */
  destroy() {
    this.settings = null;
    this.buttonEnabledList = null;
    this.hiddenColumnsPlugin = null;
    this.nestedHeadersPlugin = null;
    this.collapsedSections = null;
    this.columnHeaderLevelCount = null;

    super.destroy();
  }

}

registerPlugin('collapsibleColumns', CollapsibleColumns);

export default CollapsibleColumns;
