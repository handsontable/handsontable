import { fastInnerHTML } from '../../../helpers/dom/element';

/**
 * @private
 */
class GhostTable {
  /**
   * Reference to the Handsontable instance
   *
   * @private
   * @type {Handsontable}
   */
  hot;
  /**
   * @private
   * @type {(row: number, column: number) => any}
   */
  nestedHeaderSettingsGetter;
  /**
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
      .createAndRegisterIndexMap('nestedHeaders.ghostTable.widthMap', 'physicalIndexToValue');
  }

  setLayersCount(layersCount) {
    this.layersCount = layersCount;

    return this;
  }

  getWidth(visualColumn) {
    return this.widthsMap.getValueAtIndex(this.hot.toPhysicalColumn(visualColumn));
  }

  /**
   * Build cache of the headers widths.
   *
   * @private
   */
  buildWidthsMapper() {
    this.container = this.hot.rootDocument.createElement('div');
    this.container.classList.add('handsontable');
    this._buildGhostTable(this.container);
    this.hot.rootDocument.body.appendChild(this.container);

    const columns = this.container.querySelectorAll('tr:last-of-type th');
    const maxColumns = columns.length;

    this.widthsMap.clear();

    for (let column = 0; column < maxColumns; column++) {
      this.widthsMap.setValueAtIndex(this.hot.toPhysicalColumn(column), columns[column].offsetWidth);
    }

    // this.container.parentNode.removeChild(this.container);
    // this.container = null;

    this.hot.render();
  }

  /**
   * Build temporary table for getting minimal columns widths.
   *
   * @private
   * @param {HTMLElement} container The element where the DOM nodes are injected.
   */
  _buildGhostTable(container) {
    const { rootDocument } = this.hot;
    const fragment = rootDocument.createDocumentFragment();
    const table = rootDocument.createElement('table');
    const isDropdownEnabled = !!this.hot.getSettings().dropdownMenu;
    const maxCols = this.hot.countCols();

    for (let row = 0; row < this.layersCount; row++) {
      const tr = rootDocument.createElement('tr');

      for (let col = 0; col < maxCols; col++) {
        const th = rootDocument.createElement('th');
        const headerSettings = {...this.nestedHeaderSettingsGetter(row, col)};

        if (headerSettings && (headerSettings.isPlaceholder === false ||
            headerSettings.isPlaceholder && this.hot.columnIndexMapper.isHidden(this.hot.toPhysicalColumn(col)))) {
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
