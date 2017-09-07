import {fastInnerHTML} from 'handsontable/helpers/dom/element';
import {clone} from 'handsontable/helpers/object';

class GhostTable {
  constructor(plugin) {
    /**
     * Reference to NestedHeaders plugin.
     *
     * @type {NestedHeaders}
     */
    this.nestedHeaders = plugin;
    /**
     * Temporary element created to get minimal headers widths.
     *
     * @type {*}
     */
    this.container = void 0;
    /**
     * Cached the headers widths.
     *
     * @type {Array}
     */
    this.widthsCache = [];
  }

  /**
   * Build cache of the headers widths.
   *
   * @private
   */
  buildWidthsMapper() {
    this.container = document.createElement('div');

    this.buildGhostTable(this.container);
    this.nestedHeaders.hot.rootElement.appendChild(this.container);

    let columns = this.container.querySelectorAll('tr:last-of-type th');
    let maxColumns = columns.length;

    for (let i = 0; i < maxColumns; i++) {
      this.widthsCache.push(columns[i].offsetWidth);
    }

    this.container.parentNode.removeChild(this.container);
    this.container = null;

    this.nestedHeaders.hot.render();
  }

  /**
   * Build temporary table for getting minimal columns widths.
   *
   * @private
   * @param {HTMLElement} container
   */
  buildGhostTable(container) {
    let d = document;
    let fragment = d.createDocumentFragment();
    let table = d.createElement('table');
    let lastRowColspan = false;
    let isDropdownEnabled = !!this.nestedHeaders.hot.getSettings().dropdownMenu;
    let maxRows = this.nestedHeaders.colspanArray.length;
    let maxCols = this.nestedHeaders.hot.countCols();
    let lastRowIndex = maxRows - 1;

    for (let row = 0; row < maxRows; row++) {
      let tr = d.createElement('tr');

      lastRowColspan = false;

      for (let col = 0; col < maxCols; col++) {
        let td = d.createElement('th');
        let headerObj = clone(this.nestedHeaders.colspanArray[row][col]);

        if (headerObj && !headerObj.hidden) {
          if (row === lastRowIndex) {
            if (headerObj.colspan > 1) {
              lastRowColspan = true;
            }
            if (isDropdownEnabled) {
              headerObj.label += '<button class="changeType"></button>';
            }
          }

          fastInnerHTML(td, headerObj.label);
          td.colSpan = headerObj.colspan;
          tr.appendChild(td);
        }
      }

      table.appendChild(tr);
    }

    // We have to be sure the last row contains only the single columns.
    if (lastRowColspan) {
      {
        let tr = d.createElement('tr');

        for (let col = 0; col < maxCols; col++) {
          let td = d.createElement('th');
          tr.appendChild(td);
        }

        table.appendChild(tr);
      }
    }

    fragment.appendChild(table);
    container.appendChild(fragment);
  }

  /**
   * Clear the widths cache.
   */
  clear() {
    this.container = null;
    this.widthsCache.length = 0;
  }

}

export default GhostTable;
