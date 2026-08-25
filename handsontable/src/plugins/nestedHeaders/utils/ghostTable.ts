import type { HotInstance } from '../../../core/types';
import type StateManager from '../stateManager';
import type TreeNode from '../../../utils/dataStructures/tree';
import type { HeaderSettings } from '../stateManager/headersTree';
import { HTML_CHARACTERS } from '../../../helpers/dom/element';
import { sanitizeHTML } from '../../../utils/sanitizer';

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

  /**
   * Initializes the ghost table with the Handsontable instance and headers state manager, and registers the widths index map.
   */
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

    // Snapshot widths of collapsed columns before clearing the map. The rendered
    // ghost table correctly reflects the pre-collapse effective column width (e.g.
    // when a hidden column causes an intermediate header to render at colspan=1 with
    // a collapsible indicator). Reading the full-uncollapsed table would use
    // origColspan and miss that effect, so we preserve the previous measured value.
    const previousWidthsByPhysical = new Map<number, number>();

    if (hasCollapsedGroups) {
      collapsedPhysicalColumns.forEach((physCol) => {
        const prevWidth = this.widthsMap.getValueAtIndex<number>(physCol);

        if (prevWidth !== null && prevWidth !== undefined) {
          previousWidthsByPhysical.set(physCol, prevWidth);
        }
      });
    }

    this.container = this.hot.rootDocument.createElement('div');
    this.container.classList.add('handsontable', 'htGhostTable', 'htAutoSize', 'htNestedHeaders');

    if (currentThemeName) {
      this.container.classList.add(currentThemeName);
    }

    this.#buildGhostTable(this.container);

    this.hot.rootDocument.body.appendChild(this.container);

    const renderedTable = this.container.querySelector('[data-ghost-table="rendered"]');

    if (!renderedTable) {
      this.container.remove();
      this.container = null;

      return;
    }

    const allColumns = renderedTable.querySelectorAll('th[data-column]');

    // Build a map of visual column → last TH element with colspan=1. When rowspan is
    // used, a column's TH may appear only in an upper row, so "tr:last-of-type th"
    // would miss it. By iterating all THs and keeping the last colspan=1 entry per
    // column, we ensure every individual column is measured at its own width.
    const columnElementByVisual = new Map<number, HTMLTableCellElement>();

    for (let i = 0; i < allColumns.length; i++) {
      const th = allColumns[i] as HTMLTableCellElement;

      if (th.colSpan > 1) {
        continue; // eslint-disable-line no-continue
      }

      if (th.dataset.column === undefined) {
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
        width = previousWidthsByPhysical.get(physicalColumnIndex);
      }

      if (width === undefined || width === null) {
        width = thElement.getBoundingClientRect().width;
      }

      this.widthsMap.setValueAtIndex(physicalColumnIndex, width);
    });

    this.container.remove();
    this.container = null;
  }

  /**
   * Pre-compute the set of physical column indexes that have any collapsed ancestor.
   * This avoids repeated walkUp() calls per column during measurement.
   *
   * @returns {Set<number>} Set of physical column indexes under collapsed ancestors.
   */
  #getCollapsedPhysicalColumns() {
    const collapsedPhysicals = new Set<number>();
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
   * Build a temporary table for measuring minimal column widths. The table mirrors
   * the main table structure (colspans, only visible roots).
   *
   * @param {HTMLElement} container The element where the DOM nodes are injected.
   */
  #buildGhostTable(container: HTMLElement) {
    const settings = this.hot.getSettings();
    const isDropdownEnabled = !!settings.dropdownMenu;
    const isCollapsibleEnabled = !!settings.collapsibleColumns;
    const maxColumnsCount = this.hot.countCols();

    container.innerHTML = this.#buildRenderedTableHTML(
      maxColumnsCount, isDropdownEnabled, isCollapsibleEnabled
    );
  }

  /**
   * Build HTML string for a table that mirrors the main table (colspans, only visible roots).
   *
   * @param {number} maxColumnsCount Total column count.
   * @param {boolean} isDropdownEnabled Whether dropdown menu is enabled.
   * @param {boolean} isCollapsibleEnabled Whether collapsible columns are enabled.
   * @returns {string} HTML string for the rendered table.
   */
  #buildRenderedTableHTML(
    maxColumnsCount: number, isDropdownEnabled: boolean, isCollapsibleEnabled: boolean
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
          const rowspanAttr = (headerSettings.rowspan ?? 0) > 1
            ? ` rowspan="${headerSettings.rowspan}"`
            : '';

          cellsHTML += `<th data-column="${col}" colspan="${headerSettings.colspan}"${rowspanAttr}>${
            this.#buildHeaderLabelHTML(headerSettings, isDropdownEnabled, isCollapsibleEnabled)
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
   * @returns {string} HTML string for the header label.
   */
  #buildHeaderLabelHTML(
    headerSettings: HeaderSettings, isDropdownEnabled: boolean, isCollapsibleEnabled: boolean
  ) {
    // This measures the very label the main table writes through `updateCellHeader()`, so it has to
    // reach the sanitizer exactly as that path does, or the two disagree and the column is measured
    // against a string the user never sees.
    //
    // That means mirroring both of `fastInnerHTML`'s decisions: the `'header'` context (a
    // context-aware sanitizer would otherwise apply one rule set to the rendered header and another
    // to this copy), and the `HTML_CHARACTERS` gate, since `fastInnerHTML` routes plain text to
    // `fastInnerText` without consulting the sanitizer at all. Skipping that gate here would let a
    // sanitizer that rewrites plain text - a length cap, whitespace normalization - shorten the
    // measured label while the rendered one keeps its full width.
    //
    // `String()` mirrors `updateCellHeader()` too: `label` is typed `string`, but it comes from user
    // configuration, so `nestedHeaders: [[2024]]` puts a number there.
    const rawLabel = String(headerSettings.label);
    const label = HTML_CHARACTERS.test(rawLabel) ? sanitizeHTML(this.hot, rawLabel, 'header') : rawLabel;
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
