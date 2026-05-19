import type { HotInstance } from '../../../core/types';
import type { GridSettings } from '../../../core/settings';
import type StateManager from '../stateManager';
import type TreeNode from '../../../utils/dataStructures/tree';
import type { HeaderSettings } from '../stateManager/headersTree';

/**
 * The class generates the nested headers structure in the DOM and reads the column width for
 * each column.
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
  declare hot: HotInstance;
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
  declare container: HTMLElement | null;
  /**
   * PhysicalIndexToValueMap to keep and track of the columns' widths (as rendered in the main table).
   *
   * @private
   * @type {PhysicalIndexToValueMap}
   */
  widthsMap;

  constructor({ hot, headersStateManager }: { hot: HotInstance; headersStateManager: StateManager }) {
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
  setLayersCount(layersCount: number) {
    this.layersCount = layersCount;

    return this;
  }

  /**
   * Gets the column width based on the visual column index (as rendered in the main table).
   *
   * @param {number} visualColumn Visual column index.
   * @returns {number|null}
   */
  getWidth(visualColumn: number): number | undefined {
    return this.widthsMap.getValueAtIndex<number>(this.hot.toPhysicalColumn(visualColumn));
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
    const allColumns = renderedTable.querySelectorAll('th[data-column]');

    // Build a map of visual column → last TH element with colspan=1. When rowspan is
    // used, a column's TH may appear only in an upper row, so "tr:last-of-type th"
    // would miss it. By iterating all THs and keeping the last colspan=1 entry per
    // column, we ensure every individual column is measured at its own width.
    const columnElementByVisual = new Map();

    for (let i = 0; i < allColumns.length; i++) {
      const th = allColumns[i] as HTMLTableCellElement;

      if (th.colSpan > 1) {
        continue; // eslint-disable-line no-continue
      }

      const visCol = Number.parseInt(th.dataset.column, 10);

      columnElementByVisual.set(visCol, th);
    }

    this.widthsMap.clear();

    columnElementByVisual.forEach((thElement, visualColumnIndex) => {
      const physicalColumnIndex = this.hot.toPhysicalColumn(visualColumnIndex);

      if (this.hot.columnIndexMapper.isHidden(physicalColumnIndex)) {
        return;
      }

      let width;

      if (hasCollapsedGroups && collapsedPhysicalColumns.has(physicalColumnIndex)) {
        const fullWidth = fullWidthByPhysical.get(physicalColumnIndex);

        if (fullWidth !== undefined) {
          width = fullWidth;
        }
      }

      if (width === undefined) {
        width = thElement.getBoundingClientRect().width;
      }

      this.widthsMap.setValueAtIndex(physicalColumnIndex, width);
    });

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
      const visualColumnIndex = Number.parseInt((fullColumns[column] as HTMLTableCellElement).dataset.column, 10);
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

      treeNode.walkUp((node: TreeNode) => {
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
   * Build temporary tables for getting minimal columns widths. Builds two tables:
   * - Full: one TH per column (no collapse/hidden), to store width of the first column of a collapsed
   *   group and fix jump on collapse/uncollapse. Only built when collapsed groups exist.
   * - Rendered: same structure as the main table (colspans, only visible roots), for width when a
   *   column has children and one is hidden (parent gets the width of the visible one).
   *
   * @param {HTMLElement} container The element where the DOM nodes are injected.
   * @param {boolean} hasCollapsedGroups Whether any collapsed groups exist.
   */
  #buildGhostTable(container: HTMLElement, hasCollapsedGroups: boolean) {
    type GridSettingsWithSanitizer = GridSettings & { sanitizer?: (value: unknown, context: string) => string };
    const settings = this.hot.getSettings() as GridSettingsWithSanitizer;
    const isDropdownEnabled = !!settings.dropdownMenu;
    const isCollapsibleEnabled = !!settings.collapsibleColumns;
    const maxColumnsCount = this.hot.countCols();
    const sanitizer = settings.sanitizer;

    if (hasCollapsedGroups) {
      container.innerHTML = this.#buildFullColumnsTableHTML(
        maxColumnsCount, isDropdownEnabled, isCollapsibleEnabled, sanitizer
      ) + this.#buildRenderedTableHTML(
        maxColumnsCount, isDropdownEnabled, isCollapsibleEnabled, sanitizer
      );
    } else {
      container.innerHTML = this.#buildRenderedTableHTML(
        maxColumnsCount, isDropdownEnabled, isCollapsibleEnabled, sanitizer
      );
    }
  }

  /**
   * Build HTML string for a table with one TH per column (colspan = origColspan),
   * regardless of hidden/collapsed state.
   *
   * @param {number} maxColumnsCount Total column count.
   * @param {boolean} isDropdownEnabled Whether dropdown menu is enabled.
   * @param {boolean} isCollapsibleEnabled Whether collapsible columns are enabled.
   * @param {Function|undefined} sanitizer The sanitizer function.
   * @returns {string} HTML string for the full table.
   */
  #buildFullColumnsTableHTML(
    maxColumnsCount: number, isDropdownEnabled: boolean, isCollapsibleEnabled: boolean, sanitizer: Function | undefined
  ) {
    let rowsHTML = '';

    for (let row = 0; row < this.layersCount; row++) {
      let cellsHTML = '';

      for (let col = 0; col < maxColumnsCount; col++) {
        const headerSettings = this.headersStateManager.getHeaderTreeNodeData(row, col);

        if (headerSettings && headerSettings.isRoot) {
          cellsHTML += `<th data-column="${col}" colspan="${headerSettings.origColspan}">${
            this.#buildHeaderLabelHTML(headerSettings, isDropdownEnabled, isCollapsibleEnabled, sanitizer)
          }</th>`;
        }
      }

      rowsHTML += `<tr>${cellsHTML}</tr>`;
    }

    return `<table data-ghost-table="full"><thead>${rowsHTML}</thead></table>`;
  }

  /**
   * Build HTML string for a table that mirrors the main table (colspans, only visible roots).
   *
   * @param {number} maxColumnsCount Total column count.
   * @param {boolean} isDropdownEnabled Whether dropdown menu is enabled.
   * @param {boolean} isCollapsibleEnabled Whether collapsible columns are enabled.
   * @param {Function|undefined} sanitizer The sanitizer function.
   * @returns {string} HTML string for the rendered table.
   */
  #buildRenderedTableHTML(
    maxColumnsCount: number, isDropdownEnabled: boolean, isCollapsibleEnabled: boolean, sanitizer: Function | undefined
  ) {
    let rowsHTML = '';

    for (let row = 0; row < this.layersCount; row++) {
      let cellsHTML = '';

      for (let col = 0; col < maxColumnsCount; col++) {
        const headerSettings = this.headersStateManager.getHeaderSettings(row, col);

        if (
          headerSettings &&
          !headerSettings.isPlaceholder && !headerSettings.isHidden &&
          !headerSettings.isRowspanPlaceholder
        ) {
          const rowspanAttr = headerSettings.rowspan > 1
            ? ` rowspan="${headerSettings.rowspan}"`
            : '';

          cellsHTML += `<th data-column="${col}" colspan="${headerSettings.colspan}"${rowspanAttr}>${
            this.#buildHeaderLabelHTML(headerSettings, isDropdownEnabled, isCollapsibleEnabled, sanitizer)
          }</th>`;
        }
      }

      rowsHTML += `<tr>${cellsHTML}</tr>`;
    }

    return `<table data-ghost-table="rendered"><thead>${rowsHTML}</thead></table>`;
  }

  /**
   * Build header cell content HTML string.
   *
   * @param {object} headerSettings Header settings (label, colspan, etc).
   * @param {boolean} isDropdownEnabled Whether dropdown menu is enabled.
   * @param {boolean} isCollapsibleEnabled Whether collapsible columns are enabled.
   * @param {Function|undefined} sanitizer The sanitizer function.
   * @returns {string} HTML string for the header label.
   */
  #buildHeaderLabelHTML(
    headerSettings: HeaderSettings, isDropdownEnabled: boolean, isCollapsibleEnabled: boolean, sanitizer: Function | undefined
  ) {
    const label = typeof sanitizer === 'function'
      ? sanitizer(headerSettings.label, 'innerHTML')
      : headerSettings.label;
    const dropdownHtml = isDropdownEnabled ? '<button class="changeType"></button>' : '';
    const hasCollapsibleControl = isCollapsibleEnabled &&
      (headerSettings.origColspan > 1 || headerSettings.colspan > 1);
    const indicatorHtml = hasCollapsibleControl
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
}

export default GhostTable;
