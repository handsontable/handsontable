import {
  objectEach,
  deepClone
} from '../../helpers/object';
import { arrayEach } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import { warn } from '../../helpers/console';
import {
  addClass,
  hasClass,
  fastInnerText
} from '../../helpers/dom/element';
import EventManager from '../../eventManager';
import { registerPlugin } from '../../plugins';
import { stopImmediatePropagation } from '../../helpers/dom/event';
import BasePlugin from '../_base';

/**
 * @plugin CollapsibleColumns
 * @dependencies NestedHeaders HiddenColumns
 *
 * @description
 * The {@link CollapsibleColumns} plugin allows collapsing of columns, covered by a header with the `colspan` property defined.
 *
 * Clicking the "collapse/expand" button collapses (or expands) all "child" headers except the first one.
 *
 * Setting the {@link Options#collapsibleColumns} property to `true` will display a "collapse/expand" button in every header
 * with a defined `colspan` property.
 *
 * To limit this functionality to a smaller group of headers, define the `collapsibleColumns` property as an array
 * of objects, as in the example below.
 *
 * @example
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: generateDataObj(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   // enable plugin
 *   collapsibleColumns: true,
 * });
 *
 * // or
 * const hot = new Handsontable(container, {
 *   data: generateDataObj(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   // enable and configure which columns can be collapsed
 *   collapsibleColumns: [
 *     {row: -4, col: 1, collapsible: true},
 *     {row: -3, col: 5, collapsible: true}
 *   ],
 * });
 * ```
 */
class CollapsibleColumns extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Cached plugin settings.
     *
     * @private
     * @type {Boolean|Array}
     */
    this.settings = null;
    /**
     * Map listing headers with buttons enabled.
     *
     * @private
      * @type {Map<number, Set<number>>}
     */
    this.buttonEnabledList = new Map();
    /**
     * Cached reference to the HiddenColumns plugin.
     *
     * @private
     * @type {Object}
     */
    this.hiddenColumnsPlugin = null;
    /**
     * Cached reference to the NestedHeaders plugin.
     *
     * @private
     * @type {Object}
     */
    this.nestedHeadersPlugin = null;
    /**
     * Map listing the currently collapsed sections.
     *
     * @private
      * @type {Map<number, any[]>}
     */
    this.collapsedSections = new Map();
    /**
     * Number of column header levels.
     *
     * @private
     * @type {Number}
     */
    this.columnHeaderLevelCount = null;
    /**
     * Event manager instance reference.
     *
     * @private
     * @type {EventManager}
     */
    this.eventManager = null;
    /**
     * List of currently collapsed columns.
     *
     * @private
     * @type {Number[]}
     */
    this.collapsedColumns = [];
    /**
     * List of collapsable coords.
     *
     * @private
     * @type {Map<number, Set<number>>}
     */
    this.collapsableCoordsList = new Map();
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link CollapsibleColumns#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().collapsibleColumns;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
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
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.settings = null;
    this.buttonEnabledList.clear();
    this.hiddenColumnsPlugin = null;
    this.collapsedSections.clear();

    this.clearButtons();

    super.disablePlugin();
  }

  /**
   * Clears the expand/collapse buttons.
   *
   * @private
   */
  clearButtons() {
    if (!this.hot.view) {
      return;
    }

    const headerLevels = this.hot.view.wt.getSetting('columnHeaders').length;
    const mainHeaders = this.hot.view.wt.wtTable.THEAD;
    const topHeaders = this.hot.view.wt.wtOverlays.topOverlay.clone.wtTable.THEAD;
    const topLeftCornerHeaders = this.hot.view.wt.wtOverlays.topLeftCornerOverlay ?
      this.hot.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.THEAD : null;

    const removeButton = function(button) {
      if (button) {
        button.parentNode.removeChild(button);
      }
    };

    rangeEach(0, headerLevels - 1, (i) => {
      const masterLevel = mainHeaders.childNodes[i];
      const topLevel = topHeaders.childNodes[i];
      const topLeftCornerLevel = topLeftCornerHeaders ? topLeftCornerHeaders.childNodes[i] : null;

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
   * Parses the plugin settings and create a button configuration array.
   *
   * @private
   */
  parseSettings() {
    objectEach(this.settings, (val) => {

      if (!this.buttonEnabledList.has(val.row)) {
        this.buttonEnabledList.set(val.row, new Set());
      }

      this.buttonEnabledList.get(val.row).add(val.col);
    });

    this.collapsableCoordsList = this.buttonEnabledList;
  }

  /**
   * Checks if plugin dependencies are met.
   *
   * @private
   * @returns {Boolean}
   */
  meetsDependencies() {
    const settings = this.hot.getSettings();

    return settings.nestedHeaders && settings.hiddenColumns;
  }

  /**
   * Checks if all the required dependencies are enabled.
   *
   * @private
   */
  checkDependencies() {
    const settings = this.hot.getSettings();

    if (this.meetsDependencies()) {
      return;
    }

    if (!settings.nestedHeaders) {
      warn('You need to configure the Nested Headers plugin in order to use collapsible headers.');
    }

    if (!settings.hiddenColumns) {
      warn('You need to configure the Hidden Columns plugin in order to use collapsible headers.');
    }
  }

  /**
   * Generates the indicator element.
   *
   * @private
   * @param {Number} column Column index.
   * @param {HTMLElement} TH TH Element.
   * @returns {HTMLElement}
   */
  generateIndicator(column, TH) {
    const TR = TH.parentNode;
    const THEAD = TR.parentNode;
    const row = ((-1) * THEAD.childNodes.length) + Array.prototype.indexOf.call(THEAD.childNodes, TR);

    if (this.buttonEnabledList.size > 0 && (!this.buttonEnabledList.has(row) || !this.buttonEnabledList.get(row).has(column))) {
      return null;
    }

    const divEl = this.hot.rootDocument.createElement('DIV');

    addClass(divEl, 'collapsibleIndicator');

    if (this.collapsedSections.has(row) && this.collapsedSections.get(row)[column] === true) {
      addClass(divEl, 'collapsed');
      fastInnerText(divEl, '+');
    } else {
      addClass(divEl, 'expanded');
      fastInnerText(divEl, '-');
    }

    return divEl;
  }

  /**
   * Generates the list of collapsable coords.
   *
   * @private
   * @param {Number} column Column index.
   * @param {HTMLElement} TH TH Element.
   */
  generateCollapsableCoordsList(column, TH) {
    const TR = TH.parentNode;
    const THEAD = TR.parentNode;
    const row = ((-1) * THEAD.childNodes.length) + Array.from(THEAD.childNodes).indexOf(TR);

    if (!this.collapsableCoordsList.has(row)) {
      this.collapsableCoordsList.set(row, new Set());
    }

    this.collapsableCoordsList.get(row).add(column);
  }

  /**
   * Marks (internally) a section as 'collapsed' or 'expanded' (optionally, also mark the 'child' headers).
   *
   * @private
   * @param {String} state State ('collapsed' or 'expanded').
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @param {Boolean} recursive If `true`, it will also attempt to mark the child sections.
   */
  markSectionAs(state, row, column, recursive) {
    if (!this.collapsedSections.has(row)) {
      this.collapsedSections.set(row, []);
    }

    switch (state) {
      case 'collapsed':
        this.collapsedSections.get(row)[column] = true;

        break;
      case 'expanded':
        this.collapsedSections.get(row)[column] = void 0;

        break;
      default:
        break;
    }

    if (recursive) {
      const nestedHeadersColspans = this.nestedHeadersPlugin.colspanArray;
      const level = this.nestedHeadersPlugin.rowCoordsToLevel(row);
      const childHeaders = this.nestedHeadersPlugin.getChildHeaders(row, column);
      const childColspanLevel = nestedHeadersColspans[level + 1];

      for (let i = 1; i < childHeaders.length; i++) {
        if (childColspanLevel && childColspanLevel[childHeaders[i]].colspan > 1) {
          this.markSectionAs(state, row + 1, childHeaders[i], true);
        }
      }
    }
  }

  /**
   * Expands section at the provided coords.
   *
   * @param {Object} coords Contains coordinates information. (`coords.row`, `coords.col`)
   */
  expandSection(coords) {
    this.toggleCollapsibleSection([coords], 'expand');
  }

  /**
   * Collapses section at the provided coords.
   *
   * @param {Object} coords Contains coordinates information. (`coords.row`, `coords.col`)
   */
  collapseSection(coords) {
    this.toggleCollapsibleSection([coords], 'collapse');
  }

  /**
   * Collapses or expand all collapsible sections, depending on the action parameter.
   *
   * @param {String} action 'collapse' or 'expand'.
   */
  toggleAllCollapsibleSections(action) {
    const nestedHeadersColspanArray = this.nestedHeadersPlugin.colspanArray;
    const sectionToToggle = [];

    if (this.settings === true) {

      arrayEach(nestedHeadersColspanArray, (headerLevel, i) => {
        arrayEach(headerLevel, (header, j) => {
          if (header.colspan > 1) {
            const row = this.nestedHeadersPlugin.levelToRowCoords(parseInt(i, 10));
            const col = parseInt(j, 10);

            sectionToToggle.push({
              row,
              col
            });
          }
        });
      });

    } else {
      arrayEach(this.buttonEnabledList, ([headerRowIndex, columnIndexes]) => {
        arrayEach(columnIndexes, (columnIndex) => {
          const rowIndex = parseInt(headerRowIndex, 10);

          sectionToToggle.push({
            row: rowIndex,
            col: columnIndex
          });
        });
      });
    }

    this.toggleCollapsibleSection(sectionToToggle, action);
  }

  /**
   * Collapses all collapsible sections.
   */
  collapseAll() {
    this.toggleAllCollapsibleSections('collapse');
  }

  /**
   * Expands all collapsible sections.
   */
  expandAll() {
    this.toggleAllCollapsibleSections('expand');
  }

  /**
   * Collapses/Expands a section.
   *
   * @param {Array} coords Array of coords - section coordinates.
   * @param {String} action Action definition ('collapse' or 'expand').
   * @fires Hooks#beforeColumnCollapse
   * @fires Hooks#beforeColumnExpand
   * @fires Hooks#afterColumnCollapse
   * @fires Hooks#afterColumnExpand
   */
  toggleCollapsibleSection(coords, action) {
    if (!Array.isArray(coords)) {
      return;
    }

    const currentCollapsedColumns = this.collapsedColumns;
    const hiddenColumns = this.hiddenColumnsPlugin.hiddenColumns;
    const cloneCollapsedSections = new Map(deepClone(Array.from(this.collapsedSections)));
    let collapsePossible;

    arrayEach(coords, (currentCoords) => {
      if (currentCoords.row) {
        currentCoords.row = parseInt(currentCoords.row, 10);
      }
      if (currentCoords.col) {
        currentCoords.col = parseInt(currentCoords.col, 10);
      }

      if (!this.collapsableCoordsList.has(currentCoords.row) ||
        (this.collapsableCoordsList.has(currentCoords.row) && !this.collapsableCoordsList.get(currentCoords.row).has(currentCoords.col))) {
        collapsePossible = false;

        return false;
      }

      collapsePossible = this.collapsableCoordsList.get(currentCoords.row).has(currentCoords.col);

      const colspanArray = this.nestedHeadersPlugin.colspanArray;
      const level = this.nestedHeadersPlugin.rowCoordsToLevel(currentCoords.row);
      const currentHeaderColspan = colspanArray[level][currentCoords.col].colspan;
      const childHeaders = this.nestedHeadersPlugin.getChildHeaders(currentCoords.row, currentCoords.col);
      let nextLevel = level + 1;
      let childColspanLevel = colspanArray[nextLevel];
      let firstChildColspan = childColspanLevel ? childColspanLevel[childHeaders[0]].colspan || 1 : 1;

      while (firstChildColspan === currentHeaderColspan && nextLevel < this.columnHeaderLevelCount) {
        nextLevel += 1;
        childColspanLevel = colspanArray[nextLevel];
        firstChildColspan = childColspanLevel ? childColspanLevel[childHeaders[0]].colspan || 1 : 1;
      }

      rangeEach(firstChildColspan, currentHeaderColspan - 1, (i) => {
        const colToHide = currentCoords.col + i;

        switch (action) {
          case 'collapse':
            if (!this.hiddenColumnsPlugin.isHidden(colToHide)) {
              hiddenColumns.push(colToHide);
            }

            this.markSectionAs('collapsed', currentCoords.row, currentCoords.col, true);

            break;
          case 'expand':
            if (this.hiddenColumnsPlugin.isHidden(colToHide)) {
              hiddenColumns.splice(hiddenColumns.indexOf(colToHide), 1);
            }

            this.markSectionAs('expanded', currentCoords.row, currentCoords.col, true);

            break;
          default:
            break;
        }
      });
    });

    const destinationCollapsedColumns = Array.from(hiddenColumns);

    if (action === 'collapse') {
      const allowColumnCollapse = this.hot.runHooks('beforeColumnCollapse', currentCollapsedColumns, destinationCollapsedColumns, collapsePossible);

      if (allowColumnCollapse === false) {
        this.hiddenColumnsPlugin.hiddenColumns = Array.from(this.collapsedColumns);
        this.collapsedSections = cloneCollapsedSections;

        return;
      }
    } else {
      const allowColumnExpand = this.hot.runHooks('beforeColumnExpand', currentCollapsedColumns, destinationCollapsedColumns, collapsePossible);

      if (allowColumnExpand === false) {
        this.hiddenColumnsPlugin.hiddenColumns = Array.from(this.collapsedColumns);
        this.collapsedSections = cloneCollapsedSections;

        return;
      }
    }

    this.collapsedColumns = destinationCollapsedColumns;

    if (action === 'collapse') {
      this.hot.runHooks('afterColumnCollapse', currentCollapsedColumns, destinationCollapsedColumns, collapsePossible,
        destinationCollapsedColumns.length > currentCollapsedColumns.length);

    } else {
      this.hot.runHooks('afterColumnExpand', currentCollapsedColumns, destinationCollapsedColumns, collapsePossible,
        destinationCollapsedColumns.length < currentCollapsedColumns.length);
    }

    this.hot.render();
    this.hot.view.wt.wtOverlays.adjustElementsSize(true);
  }

  /**
   * Adds the indicator to the headers.
   *
   * @private
   * @param {Number} column Column index.
   * @param {HTMLElement} TH TH element.
   */
  onAfterGetColHeader(column, TH) {
    if (TH.hasAttribute('colspan') && TH.getAttribute('colspan') > 1 && column >= this.hot.getSettings().fixedColumnsLeft) {
      const button = this.generateIndicator(column, TH);

      if (this.buttonEnabledList.size === 0) {
        this.generateCollapsableCoordsList(column, TH);
      }

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
        if (!this.collapsedSections.has(coords.row)) {
          this.collapsedSections.set(coords.row, []);
        }

        this.eventManager.fireEvent(event.target, 'mouseup');
        this.toggleCollapsibleSection([coords], 'collapse');

      } else if (hasClass(event.target, 'collapsed')) {
        this.eventManager.fireEvent(event.target, 'mouseup');
        this.toggleCollapsibleSection([coords], 'expand');
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
   *
   * @private
   */
  onAfterRender() {
    if (!this.nestedHeadersPlugin.enabled || !this.hiddenColumnsPlugin.enabled) {
      this.disablePlugin();
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.settings = null;
    this.buttonEnabledList = null;
    this.hiddenColumnsPlugin = null;
    this.nestedHeadersPlugin = null;
    this.collapsedSections = null;
    this.columnHeaderLevelCount = null;
    this.collapsedColumns = null;
    this.collapsableCoordsList = null;

    super.destroy();
  }

}

registerPlugin('collapsibleColumns', CollapsibleColumns);

export default CollapsibleColumns;
