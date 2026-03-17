import { html } from '../../../helpers/templateLiteralTag';

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
    const currentThemeName = this.hot.getCurrentThemeName();

    this.container = this.hot.rootDocument.createElement('div');
    this.container.classList.add('handsontable', 'htGhostTable', 'htAutoSize', 'htNestedHeaders');

    if (currentThemeName) {
      this.container.classList.add(currentThemeName);
    }

    this.#buildGhostTable(this.container);

    // todo
    this.hot.rootDocument.querySelectorAll('.htGhostTable').forEach(element => element.remove());

    this.hot.rootDocument.body.appendChild(this.container);

    const fullTable = this.container.querySelector('[data-ghost-table="full"]');
    const renderedTable = this.container.querySelector('[data-ghost-table="rendered"]');
    const fullColumns = fullTable.querySelectorAll('tr:last-of-type th');
    const renderedColumns = renderedTable.querySelectorAll('tr:last-of-type th');

    this.widthsMap.clear();

    const fullWidthByPhysical = new Map();

    for (let column = 0; column < fullColumns.length; column++) {
      const visualColumnIndex = Number.parseInt(fullColumns[column].dataset.column, 10);
      const physicalColumnIndex = this.hot.toPhysicalColumn(visualColumnIndex);
      const width = fullColumns[column].getBoundingClientRect().width;

      fullWidthByPhysical.set(physicalColumnIndex, width);
    }

    for (let column = 0; column < renderedColumns.length; column++) {
      const visualColumnIndex = Number.parseInt(renderedColumns[column].dataset.column, 10);
      const physicalColumnIndex = this.hot.toPhysicalColumn(visualColumnIndex);

      if (this.hot.columnIndexMapper.isHidden(physicalColumnIndex)) {
        continue;
      }

      const fullWidth = fullWidthByPhysical.get(physicalColumnIndex);

      if (fullWidth === undefined) {
        continue;
      }

      const renderedWidth = renderedColumns[column].getBoundingClientRect().width;
      const treeNode = this.headersStateManager.getHeaderTreeNode(-1, visualColumnIndex);

      let isAnyAncestorCollapsed = false;

      if (treeNode) {
        treeNode.walkUp((node) => {
          if (node.data.isCollapsed === true) {
            isAnyAncestorCollapsed = true;

            return false;
          }
        });
      }

      const width = isAnyAncestorCollapsed ? fullWidth : renderedWidth;

      this.widthsMap.setValueAtIndex(physicalColumnIndex, width);
    }

    this.container.remove();
    this.container = null;
  }

  /**
   * Build temporary tables for getting minimal columns widths. Builds two tables:
   * - Full: one TH per column (no collapse/hidden), to store width of the first column of a collapsed
   *   group and fix jump on collapse/uncollapse.
   * - Rendered: same structure as the main table (colspans, only visible roots), for width when a
   *   column has children and one is hidden (parent gets the width of the visible one).
   *
   * @param {HTMLElement} container The element where the DOM nodes are injected.
   */
  #buildGhostTable(container) {
    const { rootDocument } = this.hot;
    const isDropdownEnabled = !!this.hot.getSettings().dropdownMenu;
    const maxColumnsCount = this.hot.countCols();

    container.appendChild(this.#buildFullColumnsTable(rootDocument, maxColumnsCount, isDropdownEnabled));
    container.appendChild(this.#buildRenderedTable(rootDocument, maxColumnsCount, isDropdownEnabled));
  }

  /**
   * Build table with one TH per column (colspan 1), regardless of hidden/collapsed state.
   * Used to store the width of the first column of a collapsed group.
   *
   * @param {Document} rootDocument Document to create elements in.
   * @param {number} maxColumnsCount Total column count.
   * @param {boolean} isDropdownEnabled Whether dropdown menu is enabled.
   * @returns {HTMLTableElement}
   */
  #buildFullColumnsTable(rootDocument, maxColumnsCount, isDropdownEnabled) {
    const table = rootDocument.createElement('table');

    table.dataset.ghostTable = 'full';

    const thead = rootDocument.createElement('thead');

    for (let row = 0; row < this.layersCount; row++) {
      const tr = rootDocument.createElement('tr');

      for (let col = 0; col < maxColumnsCount; col++) {
        const headerSettings = this.headersStateManager.getHeaderTreeNodeData(row, col);

        if (
          headerSettings && headerSettings.isRoot
        ) {
          const th = rootDocument.createElement('th');
          const label = this.#buildHeaderLabel(headerSettings, isDropdownEnabled);

          th.dataset.column = col;
          th.colSpan = headerSettings.origColspan;

          th.appendChild(label);
          tr.appendChild(th);
        }
      }

      thead.appendChild(tr);
    }

    table.appendChild(thead);

    return table;
  }

  /**
   * Build table that mirrors the main table (colspans, only roots; placeholders/hidden not rendered).
   * Used when a column has children and one is hidden - parent width is the width of the visible one.
   *
   * @private
   * @param {Document} rootDocument Document to create elements in.
   * @param {number} maxColumnsCount Total column count.
   * @param {boolean} isDropdownEnabled Whether dropdown menu is enabled.
   * @returns {HTMLTableElement}
   */
  #buildRenderedTable(rootDocument, maxColumnsCount, isDropdownEnabled) {
    const table = rootDocument.createElement('table');

    table.dataset.ghostTable = 'rendered';

    const thead = rootDocument.createElement('thead');

    for (let row = 0; row < this.layersCount; row++) {
      const tr = rootDocument.createElement('tr');

      for (let col = 0; col < maxColumnsCount; col++) {
        const headerSettings = this.headersStateManager.getHeaderSettings(row, col);

        if (
          headerSettings &&
          (
            !headerSettings.isPlaceholder && !headerSettings.isHidden
          )
        ) {
          const th = rootDocument.createElement('th');
          const label = this.#buildHeaderLabel(headerSettings, isDropdownEnabled);

          th.colSpan = headerSettings.colspan;
          th.dataset.column = col;

          th.appendChild(label);
          tr.appendChild(th);
        }
      }

      thead.appendChild(tr);
    }

    table.appendChild(thead);

    return table;
  }

  /**
   * Build header cell content for the ghost table as DOM nodes.
   *
   * @param {object} headerSettings Header settings (label, colspan, etc).
   * @param {boolean} isDropdownEnabled Whether dropdown menu is enabled.
   * @returns {DocumentFragment} Fragment containing the wrapper div.relative with header content.
   */
  #buildHeaderLabel(headerSettings, isDropdownEnabled) {
    const sanitizer = this.hot.getSettings().sanitizer;
    const label = typeof sanitizer === 'function'
      ? sanitizer(headerSettings.label, 'innerHTML')
      : headerSettings.label;
    const dropdownHtml = isDropdownEnabled ? '<button class="changeType"></button>' : '';
    const indicatorHtml = headerSettings.collapsible
      ? '<div class="collapsibleIndicator expanded">-</div>'
      : '';
    const { fragment } = html`
      <div class="relative">
        <span class="colHeader">${label}</span>
        ${dropdownHtml}
        ${indicatorHtml}
      </div>
    `;

    return fragment;
  }

  /**
   * Clear the widths cache.
   */
  clear() {
    this.widthsMap.clear();
    this.container = null;
  }
}

export default GhostTable;
