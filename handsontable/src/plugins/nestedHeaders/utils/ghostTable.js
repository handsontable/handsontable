import { fastInnerHTML } from '../../../helpers/dom/element';

/**
 * The class generates the nested headers structure in the DOM and reads the column width for
 * each column. The hierarchy is built only for visible, non-hidden columns. Each time the
 * column is shown or hidden, the structure is rebuilt, and the width of the columns in the
 * map updated.
 *
 * @private
 */
class GhostTable {
  /**
   * Reference to the Handsontable instance.
   *
   * @private
   * @type {Handsontable}
   */
  hot;
  /**
   * The state manager for the nested headers.
   *
   * @private
   * @type {StateManager}
   */
  headersStateManager;
  /**
   * The value that holds information about the number of the nested header layers (header rows).
   *
   * @private
   * @type {number}
   */
  layersCount = 0;
  /**
   * Temporary element created to get minimal headers widths.
   *
   * @private
   * @type {*}
   */
  container;
  /**
   * PhysicalIndexToValueMap to keep and track of the columns' widths (as rendered in the main table).
   *
   * @private
   * @type {PhysicalIndexToValueMap}
   */
  widthsMap;

  constructor({ hot, headersStateManager }) {
    this.hot = hot;
    this.headersStateManager = headersStateManager;
    this.widthsMap = this.hot.columnIndexMapper
      .createAndRegisterIndexMap('nestedHeaders.widthsMap', 'physicalIndexToValue');
  }

  /**
   * Sets the number of nested headers layers count.
   *
   * @param {number} layersCount Total number of headers levels.
   * @returns {GhostTable}
   */
  setLayersCount(layersCount) {
    this.layersCount = layersCount;

    return this;
  }

  /**
   * Gets the column width based on the visual column index (as rendered in the main table).
   *
   * @param {number} visualColumn Visual column index.
   * @returns {number|null}
   */
  getWidth(visualColumn) {
    return this.widthsMap.getValueAtIndex(this.hot.toPhysicalColumn(visualColumn));
  }

  /**
   * Build cache of the headers widths.
   */
  buildWidthsMap() {
    const collapsedPhysicalColumns = this.#getCollapsedPhysicalColumns();
    const hasCollapsedGroups = collapsedPhysicalColumns.size > 0;
    const currentThemeName = this.hot.getCurrentThemeName();

    this.container = this.hot.rootDocument.createElement('div');
    this.container.classList.add('handsontable', 'htGhostTable', 'htAutoSize', 'htNestedHeaders');

    if (currentThemeName) {
      this.container.classList.add(currentThemeName);
    }

    this.#buildGhostTable(this.container, hasCollapsedGroups);

    this.hot.rootDocument.body.appendChild(this.container);

    const fullWidthByPhysical = hasCollapsedGroups
      ? this.#measureFullTable()
      : null;

    const renderedTable = this.container.querySelector('[data-ghost-table="rendered"]');
    const columns = renderedTable.querySelectorAll('tr.htGhostHeaderMeasureRow th');

    this.widthsMap.clear();

    for (let column = 0; column < columns.length; column++) {
      const visualColumnsIndex = Number.parseInt(columns[column].dataset.visualColumn, 10);
      const physicalColumnIndex = this.hot.toPhysicalColumn(visualColumnsIndex);

      if (this.hot.columnIndexMapper.isHidden(physicalColumnIndex)) {
        continue;
      }

      let width;

      if (hasCollapsedGroups && collapsedPhysicalColumns.has(physicalColumnIndex)) {
        const fullWidth = fullWidthByPhysical.get(physicalColumnIndex);

        if (fullWidth !== undefined) {
          width = fullWidth;
        }
      }

      if (width === undefined) {
        width = columns[column].getBoundingClientRect().width;
      }

      this.widthsMap.setValueAtIndex(physicalColumnIndex, width);
    }

    this.container.remove();
    this.container = null;
  }

  /**
   * Measure widths from the full (uncollapsed) ghost table.
   *
   * @returns {Map<number, number>} Map of physical column index to width.
   */
  #measureFullTable() {
    const fullTable = this.container.querySelector('[data-ghost-table="full"]');
    const fullColumns = fullTable.querySelectorAll('tr:last-of-type th');
    const fullWidthByPhysical = new Map();

    for (let column = 0; column < fullColumns.length; column++) {
      const visualColumnIndex = Number.parseInt(fullColumns[column].dataset.column, 10);
      const physicalColumnIndex = this.hot.toPhysicalColumn(visualColumnIndex);

      fullWidthByPhysical.set(physicalColumnIndex, fullColumns[column].getBoundingClientRect().width);
    }

    return fullWidthByPhysical;
  }

  /**
   * Pre-compute the set of physical column indexes that have any collapsed ancestor.
   * This avoids repeated walkUp() calls per column during measurement.
   *
   * @returns {Set<number>} Set of physical column indexes under collapsed ancestors.
   */
  #getCollapsedPhysicalColumns() {
    const collapsedPhysicals = new Set();
    const maxColumnsCount = this.hot.countCols();

    for (let col = 0; col < maxColumnsCount; col++) {
      const treeNode = this.headersStateManager.getHeaderTreeNode(-1, col);

      if (!treeNode) {
        continue;
      }

      let found = false;

      treeNode.walkUp((node) => {
        if (node.data.isCollapsed === true) {
          found = true;

          return false;
        }
      });

      if (found) {
        collapsedPhysicals.add(this.hot.toPhysicalColumn(col));
      }
    }

    return collapsedPhysicals;
  }

  /**
   * Build temporary tables for getting minimal columns widths. Builds two tables when groups are collapsed:
   * - Full: one TH per column (no collapse/hidden), to store width of the first column of a collapsed
   *   group and fix jump on collapse/uncollapse.
   * - Rendered: same structure as the main table (colspans, only visible roots), built from renderable
   *   columns with a dedicated measure row (`htGhostHeaderMeasureRow`).
   *
   * @param {HTMLElement} container The element where the DOM nodes are injected.
   * @param {boolean} hasCollapsedGroups Whether any collapsed groups exist.
   */
  #buildGhostTable(container, hasCollapsedGroups) {
    const { rootDocument, columnIndexMapper } = this.hot;
    const isDropdownEnabled = !!this.hot.getSettings().dropdownMenu;
    const isCollapsibleColumnsEnabled = !!this.hot.getSettings().collapsibleColumns;
    const maxColumnsCount = this.hot.countCols();
    const sanitizer = this.hot.getSettings().sanitizer;

    if (hasCollapsedGroups) {
      const fullWrapper = rootDocument.createElement('div');

      fullWrapper.innerHTML = this.#buildFullColumnsTableHTML(maxColumnsCount, isDropdownEnabled, sanitizer);
      container.appendChild(fullWrapper.firstElementChild);
    }

    const fragment = rootDocument.createDocumentFragment();
    const table = rootDocument.createElement('table');

    table.setAttribute('data-ghost-table', 'rendered');

    const maxRenderedCols = columnIndexMapper.getRenderableIndexesLength();

    for (let row = 0; row < this.layersCount; row++) {
      const tr = rootDocument.createElement('tr');

      for (let col = 0; col < maxRenderedCols; col++) {
        const visualColumnsIndex = columnIndexMapper.getVisualFromRenderableIndex(col);

        if (visualColumnsIndex === null) {
          continue; // eslint-disable-line no-continue
        }

        const th = rootDocument.createElement('th');
        const headerSettings = this.headersStateManager.getHeaderSettings(row, visualColumnsIndex);

        if (headerSettings && !headerSettings.isPlaceholder && !headerSettings.isHidden) {
          const hasCollapsibleControl = isCollapsibleColumnsEnabled &&
            (headerSettings.origColspan > 1 || headerSettings.colspan > 1);
          const dropdownHtml = isDropdownEnabled ? '<button class="changeType"></button>' : '';
          const indicatorHtml = hasCollapsibleControl
            ? '<div class="collapsibleIndicator expanded">-</div>'
            : '';
          const html =
            `<div class="relative"><span class="colHeader">${headerSettings.label}` +
            `</span>${dropdownHtml}${indicatorHtml}</div>`;

          fastInnerHTML(th, html, sanitizer);
          th.colSpan = headerSettings.colspan;
          th.rowSpan = headerSettings.rowspan;
          tr.appendChild(th);
        }
      }

      table.appendChild(tr);
    }

    const measureRow = rootDocument.createElement('tr');

    measureRow.className = 'htGhostHeaderMeasureRow';

    for (let col = 0; col < maxRenderedCols; col++) {
      const visualColumnIndex = columnIndexMapper.getVisualFromRenderableIndex(col);

      if (visualColumnIndex === null || !this.#isColumnRenderedInAnyLayer(visualColumnIndex)) {
        continue; // eslint-disable-line no-continue
      }

      const th = rootDocument.createElement('th');

      th.dataset.visualColumn = `${visualColumnIndex}`;
      th.textContent = '';
      measureRow.appendChild(th);
    }

    table.appendChild(measureRow);

    fragment.appendChild(table);
    container.appendChild(fragment);
  }

  /**
   * Build HTML string for a table with one TH per column (colspan = origColspan),
   * regardless of hidden/collapsed state.
   *
   * @param {number} maxColumnsCount Total column count.
   * @param {boolean} isDropdownEnabled Whether dropdown menu is enabled.
   * @param {Function|undefined} sanitizer The sanitizer function.
   * @returns {string} HTML string for the full table.
   */
  #buildFullColumnsTableHTML(maxColumnsCount, isDropdownEnabled, sanitizer) {
    let rowsHTML = '';

    for (let row = 0; row < this.layersCount; row++) {
      let cellsHTML = '';

      for (let col = 0; col < maxColumnsCount; col++) {
        const headerSettings = this.headersStateManager.getHeaderTreeNodeData(row, col);

        if (headerSettings && headerSettings.isRoot) {
          cellsHTML += `<th data-column="${col}" colspan="${headerSettings.origColspan}">${
            this.#buildHeaderLabelHTML(headerSettings, isDropdownEnabled, sanitizer)
          }</th>`;
        }
      }

      rowsHTML += `<tr>${cellsHTML}</tr>`;
    }

    return `<table data-ghost-table="full"><thead>${rowsHTML}</thead></table>`;
  }

  /**
   * Build header cell content HTML string.
   *
   * @param {object} headerSettings Header settings (label, colspan, etc).
   * @param {boolean} isDropdownEnabled Whether dropdown menu is enabled.
   * @param {Function|undefined} sanitizer The sanitizer function.
   * @returns {string} HTML string for the header label.
   */
  #buildHeaderLabelHTML(headerSettings, isDropdownEnabled, sanitizer) {
    const label = typeof sanitizer === 'function'
      ? sanitizer(headerSettings.label, 'innerHTML')
      : headerSettings.label;
    const dropdownHtml = isDropdownEnabled ? '<button class="changeType"></button>' : '';
    const indicatorHtml = headerSettings.collapsible
      ? '<div class="collapsibleIndicator expanded">-</div>'
      : '';

    return `<div class="relative"><span class="colHeader">${label}</span>${dropdownHtml}${indicatorHtml}</div>`;
  }

  /**
   * Clear the widths cache.
   */
  clear() {
    this.widthsMap.clear();
    this.container = null;
  }

  /**
   * Checks whether there is at least one header node for the passed visual column index.
   *
   * @private
   * @param {number} visualColumnIndex A visual column index.
   * @returns {boolean}
   */
  #isColumnRenderedInAnyLayer(visualColumnIndex) {
    for (let row = 0; row < this.layersCount; row++) {
      const headerSettings = this.headersStateManager.getHeaderSettings(row, visualColumnIndex);

      if (headerSettings && !headerSettings.isPlaceholder && !headerSettings.isHidden) {
        return true;
      }
    }

    return false;
  }
}

export default GhostTable;
