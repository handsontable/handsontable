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
     * Cached reference to the HiddenColumns plugin.
     *
     * @private
     * @type {object}
     */
    this.hiddenColumnsPlugin = null;
    /**
     * Cached reference to the NestedHeaders plugin.
     *
     * @private
     * @type {object}
     */
    this.nestedHeadersPlugin = null;
    /**
     * Event manager instance reference.
     *
     * @private
     * @type {EventManager}
     */
    this.eventManager = null;
    /**
     * @type {ColumnStateManager}
     */
    this.columnManager = null;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link CollapsibleColumns#enablePlugin} method is called.
   *
   * @returns {boolean}
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

    const { collapsibleColumns } = this.hot.getSettings();

    this.hiddenColumnsPlugin = this.hot.getPlugin('hiddenColumns');
    this.nestedHeadersPlugin = this.hot.getPlugin('nestedHeaders');
    this.columnManager =  this.nestedHeadersPlugin.getColumnStateManager();

    if (!this.nestedHeadersPlugin.detectedOverlappedHeaders) {
      if (typeof collapsibleColumns === 'boolean') {
        // Add `collapsible: true` attribute all headers with colspan higher than 1.
        this.columnManager.mapState((columnSettings) => ({ collapsible: columnSettings.origColspan > 1 }));

      } else if (Array.isArray(collapsibleColumns)) {
        this.columnManager.mergeStateWith(collapsibleColumns);
      }
    }

    this.checkDependencies();

    this.addHook('afterRender', () => this.onAfterRender());
    this.addHook('afterGetColHeader', (col, TH) => this.onAfterGetColHeader(col, TH));
    this.addHook('beforeOnCellMouseDown', (event, coords, TD) => this.onBeforeOnCellMouseDown(event, coords, TD));

    this.eventManager = new EventManager(this.hot);

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hiddenColumnsPlugin = null;

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
   * Checks if all the required dependencies are enabled.
   *
   * @private
   */
  checkDependencies() {
    const settings = this.hot.getSettings();

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
   * @param {number} row Row index.
   * @param {number} column Column index.
   * @returns {HTMLElement}
   */
  generateIndicator(row, column) {
    const divEl = this.hot.rootDocument.createElement('div');
    const columnSettings = this.columnManager.getColumnSettings(column, row);

    addClass(divEl, 'collapsibleIndicator');

    if (columnSettings.isCollapsed) {
      addClass(divEl, 'collapsed');
      fastInnerText(divEl, '+');
    } else {
      addClass(divEl, 'expanded');
      fastInnerText(divEl, '-');
    }

    return divEl;
  }

  /**
   * Expands section at the provided coords.
   *
   * @param {object} coords Contains coordinates information. (`coords.row`, `coords.col`).
   */
  expandSection(coords) {
    this.toggleCollapsibleSection([coords], 'expand');
  }

  /**
   * Collapses section at the provided coords.
   *
   * @param {object} coords Contains coordinates information. (`coords.row`, `coords.col`).
   */
  collapseSection(coords) {
    this.toggleCollapsibleSection([coords], 'collapse');
  }

  /**
   * Collapses or expand all collapsible sections, depending on the action parameter.
   *
   * @param {string} action 'collapse' or 'expand'.
   */
  toggleAllCollapsibleSections(action) {

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
   * @param {string} action Action definition ('collapse' or 'expand').
   * @fires Hooks#beforeColumnCollapse
   * @fires Hooks#beforeColumnExpand
   * @fires Hooks#afterColumnCollapse
   * @fires Hooks#afterColumnExpand
   */
  toggleCollapsibleSection(coords, action) {
    if (!Array.isArray(coords)) {
      return;
    }

    // console.log( JSON.stringify(coords.map( a => a.toObject() )) );

    let collapsePossible = true;

    arrayEach(coords, ({ row, col }) => {
      console.log('COORDS', row, col);

      const columnSettings = this.columnManager.getColumnSettings(col, row);

      if (!columnSettings.collapsible) {
        collapsePossible = false;

        return false;
      }

      if (columnSettings.isCollapsed) {
        this.columnManager.triggerNodeModification('expand', col, row);
      } else {
        this.columnManager.triggerNodeModification('collapse', col, row);
      }

      // const colspanArray = this.nestedHeadersPlugin.colspanArray;
      // const level = this.nestedHeadersPlugin.rowCoordsToLevel(row);
      // const currentHeaderColspan = colspanArray[level][col].colspan;
      // const childHeaders = this.nestedHeadersPlugin.getChildHeaders(row, col);
      // let nextLevel = level + 1;
      // let childColspanLevel = colspanArray[nextLevel];
      // let firstChildColspan = childColspanLevel ? childColspanLevel[childHeaders[0]].colspan || 1 : 1;
      //
      // while (firstChildColspan === currentHeaderColspan && nextLevel < this.columnHeaderLevelCount) {
      //   nextLevel += 1;
      //   childColspanLevel = colspanArray[nextLevel];
      //   firstChildColspan = childColspanLevel ? childColspanLevel[childHeaders[0]].colspan || 1 : 1;
      // }
      //
      // rangeEach(firstChildColspan, currentHeaderColspan - 1, (i) => {
      //   const colToHide = col + i;
      //
      //   switch (action) {
      //     case 'collapse':
      //       if (!this.hiddenColumnsPlugin.isHidden(colToHide)) {
      //         this.hiddenColumnsPlugin.hideColumn(colToHide);
      //       }
      //
      //       this.markSectionAs('collapsed', row, col, true);
      //
      //       break;
      //     case 'expand':
      //       if (this.hiddenColumnsPlugin.isHidden(colToHide)) {
      //         this.hiddenColumnsPlugin.showColumn(colToHide);
      //       }
      //
      //       this.markSectionAs('expanded', row, col, true);
      //
      //       break;
      //     default:
      //       break;
      //   }
      // });
    });

    this.hot.render();
    this.hot.view.wt.wtOverlays.adjustElementsSize(true);
    return;

    // Added by @wszymanski, this code around was absent, when the original commit was performed.
    const destinationCollapsedColumns = this.hiddenColumnsPlugin.getHiddenColumns();

    if (action === 'collapse') {
      const allowColumnCollapse = this.hot.runHooks('beforeColumnCollapse', currentCollapsedColumns, destinationCollapsedColumns, collapsePossible);

      if (allowColumnCollapse === false) {
        // Added by @wszymanski, this code around was absent, when the original commit was performed.
        this.hiddenColumnsPlugin.showColumns(this.hiddenColumnsPlugin.getHiddenColumns());
        this.hiddenColumnsPlugin.hideColumns(this.collapsedColumns);
        this.collapsedSections = cloneCollapsedSections;

        return;
      }
    } else {
      const allowColumnExpand = this.hot.runHooks('beforeColumnExpand', currentCollapsedColumns, destinationCollapsedColumns, collapsePossible);

      if (allowColumnExpand === false) {
        // Added by @wszymanski, this code around was absent, when original commit was performed.
        this.hiddenColumnsPlugin.showColumns(this.hiddenColumnsPlugin.getHiddenColumns());
        this.hiddenColumnsPlugin.hideColumns(this.collapsedColumns);
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
   * @param {number} column Column index.
   * @param {HTMLElement} TH TH element.
   */
  onAfterGetColHeader(column, TH) {
    const TR = TH.parentNode;
    const THEAD = TR.parentNode;
    const row = ((-1) * THEAD.childNodes.length) + Array.prototype.indexOf.call(THEAD.childNodes, TR);
    const columnSettings = this.columnManager.getColumnSettings(column, row);

    if (columnSettings.collapsible && columnSettings.origColspan > 1 && column >= this.hot.getSettings().fixedColumnsLeft) {
      const button = this.generateIndicator(row, column);

      TH.querySelector('div:first-child').appendChild(button);
    }
  }

  /**
   * Indicator mouse event callback.
   *
   * @private
   * @param {object} event Mouse event.
   * @param {object} coords Event coordinates.
   */
  onBeforeOnCellMouseDown(event, coords) {
    if (hasClass(event.target, 'collapsibleIndicator')) {
      if (hasClass(event.target, 'expanded')) {
        this.eventManager.fireEvent(event.target, 'mouseup');
        this.toggleCollapsibleSection([coords], 'collapse');

      } else if (hasClass(event.target, 'collapsed')) {
        this.eventManager.fireEvent(event.target, 'mouseup');
        this.toggleCollapsibleSection([coords], 'expand');
      }

      stopImmediatePropagation(event);
    }
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
    super.destroy();
  }
}

registerPlugin('collapsibleColumns', CollapsibleColumns);

export default CollapsibleColumns;
