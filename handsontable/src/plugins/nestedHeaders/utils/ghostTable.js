import { fastInnerHTML } from '../../../helpers/dom/element';

/**
 * @private
 */
class GhostTable {
  /**
   * Reference to NestedHeaders plugin.
   *
   * @type {NestedHeaders}
   */
  nestedHeaders;
  /**
   * Temporary element created to get minimal headers widths.
   *
   * @type {*}
   */
  container;
  /**
   * Cached the headers widths.
   *
   * @type {Array}
   */
  widthsCache = [];

  constructor(plugin) {
    this.nestedHeaders = plugin;
  }

  /**
   * Build cache of the headers widths.
   *
   * @private
   */
  buildWidthsMapper() {
    this.container = this.nestedHeaders.hot.rootDocument.createElement('div');

    this.buildGhostTable(this.container);
    this.nestedHeaders.hot.rootElement.appendChild(this.container);

    const columns = this.container.querySelectorAll('tr:last-of-type th');
    const maxColumns = columns.length;

    this.widthsCache.length = 0;

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
   * @param {HTMLElement} container The element where the DOM nodes are injected.
   */
  buildGhostTable(container) {
    const { rootDocument } = this.nestedHeaders.hot;
    const fragment = rootDocument.createDocumentFragment();
    const table = rootDocument.createElement('table');
    let lastRowColspan = false;
    const isDropdownEnabled = !!this.nestedHeaders.hot.getSettings().dropdownMenu;
    const maxRows = this.nestedHeaders.getLayersCount();
    const maxCols = this.nestedHeaders.hot.countCols();
    const lastRowIndex = maxRows - 1;

    for (let row = 0; row < maxRows; row++) {
      const tr = rootDocument.createElement('tr');

      lastRowColspan = false;

      for (let col = 0; col < maxCols; col++) {
        const th = rootDocument.createElement('th');
        const headerSettings = this.nestedHeaders.getHeaderSettings(row, col);

        if (headerSettings && !headerSettings.isPlaceholder) {
          let label = headerSettings.label;

          if (row === lastRowIndex) {
            if (headerSettings.colspan > 1) {
              lastRowColspan = true;
            }
            if (isDropdownEnabled) {
              label += '<button class="changeType"></button>';
            }
          }

          fastInnerHTML(th, label);
          th.colSpan = headerSettings.colspan;
          tr.appendChild(th);
        }
      }

      table.appendChild(tr);
    }

    // We have to be sure the last row contains only the single columns.
    if (lastRowColspan) {
      {
        const tr = rootDocument.createElement('tr');

        for (let col = 0; col < maxCols; col++) {
          const td = rootDocument.createElement('th');

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
