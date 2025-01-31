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
   * The function for retrieving the nested headers settings.
   *
   * @private
   * @type {Function}
   */
  nestedHeaderSettingsGetter;
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
   * PhysicalIndexToValueMap to keep and track of the columns' widths.
   *
   * @private
   * @type {PhysicalIndexToValueMap}
   */
  widthsMap;

  constructor(hot, nestedHeaderSettingsGetter) {
    this.hot = hot;
    this.nestedHeaderSettingsGetter = nestedHeaderSettingsGetter;
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
   * Gets the column width based on the visual column index.
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
    this.container.classList.add('handsontable', 'htGhostTable', 'htAutoSize');

    if (currentThemeName) {
      this.container.classList.add(currentThemeName);
    }

    this._buildGhostTable(this.container);
    this.hot.rootDocument.body.appendChild(this.container);

    const columns = this.container.querySelectorAll('tr:last-of-type th');
    const maxColumns = columns.length;

    this.widthsMap.clear();

    for (let column = 0; column < maxColumns; column++) {
      const visualColumnsIndex = this.hot.columnIndexMapper.getVisualFromRenderableIndex(column);
      const physicalColumnIndex = this.hot.toPhysicalColumn(visualColumnsIndex);

      this.widthsMap.setValueAtIndex(physicalColumnIndex, columns[column].offsetWidth);
    }

    this.container.parentNode.removeChild(this.container);
    this.container = null;
  }

  /**
   * Build temporary table for getting minimal columns widths.
   *
   * @private
   * @param {HTMLElement} container The element where the DOM nodes are injected.
   */
  _buildGhostTable(container) {
    const { rootDocument, columnIndexMapper } = this.hot;
    const fragment = rootDocument.createDocumentFragment();
    const table = rootDocument.createElement('table');
    const isDropdownEnabled = !!this.hot.getSettings().dropdownMenu;
    const maxRenderedCols = columnIndexMapper.getRenderableIndexesLength();

    for (let row = 0; row < this.layersCount; row++) {
      const tr = rootDocument.createElement('tr');

      for (let col = 0; col < maxRenderedCols; col++) {
        let visualColumnsIndex = columnIndexMapper.getVisualFromRenderableIndex(col);

        if (visualColumnsIndex === null) {
          visualColumnsIndex = col;
        }

        const th = rootDocument.createElement('th');
        const headerSettings = this.nestedHeaderSettingsGetter(row, visualColumnsIndex);

        if (headerSettings && (!headerSettings.isPlaceholder || headerSettings.isHidden)) {
          let label = headerSettings.label;

          if (isDropdownEnabled) {
            label += '<button class="changeType"></button>';
          }

          fastInnerHTML(th, label);
          th.colSpan = headerSettings.colspan;
          tr.appendChild(th);
        }
      }

      table.appendChild(tr);
    }

    fragment.appendChild(table);
    container.appendChild(fragment);
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
