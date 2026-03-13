import { fastInnerHTML } from '../../../helpers/dom/element';

/**
 * Writes debug logs for runtime bug investigation.
 *
 * @param {Window} rootWindow The current root window reference.
 * @param {object} payload The debug payload.
 */
function writeAgentDebugLog(rootWindow, payload) {
  try {
    const logWindow = rootWindow?.top || rootWindow;
    const fullPayload = {
      ...payload,
      timestamp: Date.now(),
    };

    if (typeof logWindow?.agentDebugLog === 'function') {
      logWindow.agentDebugLog(fullPayload);

      return;
    }

    if (!logWindow) {
      return;
    }

    if (!Array.isArray(logWindow.__agentDebugLogs)) {
      logWindow.__agentDebugLogs = [];
    }

    logWindow.__agentDebugLogs.push(fullPayload);
  } catch {
    // silent by design
  }
}

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

    const columns = this.container.querySelectorAll('tr.htGhostHeaderMeasureRow th');
    const maxColumns = columns.length;

    this.widthsMap.clear();

    for (let column = 0; column < maxColumns; column++) {
      const visualColumnsIndex = Number.parseInt(columns[column].dataset.visualColumn, 10);
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
    const isCollapsibleColumnsEnabled = !!this.hot.getSettings().collapsibleColumns;
    const maxRenderedCols = columnIndexMapper.getRenderableIndexesLength();

    for (let row = 0; row < this.layersCount; row++) {
      const tr = rootDocument.createElement('tr');

      for (let col = 0; col < maxRenderedCols; col++) {
        const visualColumnsIndex = columnIndexMapper.getVisualFromRenderableIndex(col);

        if (visualColumnsIndex === null) {
          continue; // eslint-disable-line no-continue
        }

        const th = rootDocument.createElement('th');
        const headerSettings = this.nestedHeaderSettingsGetter(row, visualColumnsIndex);

        if (
          headerSettings &&
          (
            (!headerSettings.isPlaceholder && !headerSettings.isCollapsed) ||
            headerSettings.isHidden
          )
        ) {
          let label = headerSettings.label;
          const hasCollapsibleControl = isCollapsibleColumnsEnabled &&
            (headerSettings.origColspan > 1 || headerSettings.colspan > 1);

          if (isDropdownEnabled) {
            label += '<button class="changeType"></button>';
          }

          if (hasCollapsibleControl) {
            label += '<button class="collapsibleIndicator expanded"></button>';
          }

          if (headerSettings.label === 'D/E') {
            // #region agent log
            writeAgentDebugLog(this.hot.rootWindow, {
              hypothesisId: 'W3',
              location: 'ghostTable.js:_buildGhostTable',
              message: 'Built ghost header for D/E',
              data: {
                row,
                visualColumnsIndex,
                colspan: headerSettings.colspan,
                rowspan: headerSettings.rowspan,
                isCollapsed: headerSettings.isCollapsed,
                isDropdownEnabled,
                hasCollapsibleControl,
              },
            });
            // #endregion
          }

          fastInnerHTML(th, label, this.hot.getSettings().sanitizer);
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

    // #region agent log
    writeAgentDebugLog(this.hot.rootWindow, {
      hypothesisId: 'W4',
      location: 'ghostTable.js:_buildGhostTable:summary',
      message: 'Built ghost table controls summary',
      data: {
        isDropdownEnabled,
        isCollapsibleColumnsEnabled,
        dropdownButtons: table.querySelectorAll('button.changeType').length,
        collapsibleButtons: table.querySelectorAll('button.collapsibleIndicator').length,
      },
    });
    // #endregion

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

  /**
   * Checks whether there is at least one header node for the passed visual column index.
   *
   * @private
   * @param {number} visualColumnIndex A visual column index.
   * @returns {boolean}
   */
  #isColumnRenderedInAnyLayer(visualColumnIndex) {
    for (let row = 0; row < this.layersCount; row++) {
      const headerSettings = this.nestedHeaderSettingsGetter(row, visualColumnIndex);

      if (
        headerSettings &&
        (
          (!headerSettings.isPlaceholder && !headerSettings.isCollapsed) ||
          headerSettings.isHidden
        )
      ) {
        return true;
      }
    }

    return false;
  }
}

export default GhostTable;
