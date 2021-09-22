import { addClass, outerHeight, outerWidth } from './../helpers/dom/element';
import { arrayEach } from './../helpers/array';

/**
 * @class GhostTable
 * @util
 */
class GhostTable {
  constructor(hotInstance) {
    /**
     * Handsontable instance.
     *
     * @type {Core}
     */
    this.hot = hotInstance;
    /**
     * Container element where every table will be injected.
     *
     * @type {HTMLElement|null}
     */
    this.container = null;
    /**
     * Flag which determine is table was injected to DOM.
     *
     * @type {boolean}
     */
    this.injected = false;
    /**
     * Added rows collection.
     *
     * @type {Array}
     */
    this.rows = [];
    /**
     * Added columns collection.
     *
     * @type {Array}
     */
    this.columns = [];
    /**
     * Samples prepared for calculations.
     *
     * @type {Map}
     * @default {null}
     */
    this.samples = null;
    /**
     * Ghost table settings.
     *
     * @type {object}
     * @default {Object}
     */
    this.settings = {
      useHeaders: true
    };
  }

  /**
   * Add row.
   *
   * @param {number} row Row index.
   * @param {Map} samples Samples Map object.
   */
  addRow(row, samples) {
    if (this.columns.length) {
      throw new Error('Doesn\'t support multi-dimensional table');
    }
    if (!this.rows.length) {
      this.container = this.createContainer(this.hot.rootElement.className);
    }
    const rowObject = { row };

    this.rows.push(rowObject);

    this.samples = samples;
    this.table = this.createTable(this.hot.table.className);
    this.table.colGroup.appendChild(this.createColGroupsCol());
    this.table.tr.appendChild(this.createRow(row));
    this.container.container.appendChild(this.table.fragment);

    rowObject.table = this.table.table;
  }

  /**
   * Add a row consisting of the column headers.
   *
   * @param {Map} samples A map with sampled table values.
   */
  addColumnHeadersRow(samples) {
    const colHeader = this.hot.getColHeader(0);

    if (colHeader !== null && colHeader !== void 0) {
      const rowObject = { row: -1 };

      this.rows.push(rowObject);

      this.container = this.createContainer(this.hot.rootElement.className);
      this.samples = samples;
      this.table = this.createTable(this.hot.table.className);

      this.table.colGroup.appendChild(this.createColGroupsCol());

      this.appendColumnHeadersRow();

      this.container.container.appendChild(this.table.fragment);

      rowObject.table = this.table.table;
    }
  }

  /**
   * Add column.
   *
   * @param {number} column Column index.
   * @param {Map} samples A map with sampled table values.
   */
  addColumn(column, samples) {
    if (this.rows.length) {
      throw new Error('Doesn\'t support multi-dimensional table');
    }
    if (!this.columns.length) {
      this.container = this.createContainer(this.hot.rootElement.className);
    }
    const columnObject = { col: column };

    this.columns.push(columnObject);

    this.samples = samples;
    this.table = this.createTable(this.hot.table.className);

    if (this.getSetting('useHeaders') && this.hot.getColHeader(column) !== null) {
      // Please keep in mind that the renderable column index equal to the visual columns index for the GhostTable.
      // We render all columns.
      this.hot.view.appendColHeader(column, this.table.th);
    }
    this.table.tBody.appendChild(this.createCol(column));
    this.container.container.appendChild(this.table.fragment);

    columnObject.table = this.table.table;
  }

  /**
   * Get calculated heights.
   *
   * @param {Function} callback Callback which will be fired for each calculated row.
   */
  getHeights(callback) {
    if (!this.injected) {
      this.injectTable();
    }
    arrayEach(this.rows, (row) => {
      // -1 <- reduce border-top from table
      callback(row.row, outerHeight(row.table) - 1);
    });
  }

  /**
   * Get calculated widths.
   *
   * @param {Function} callback Callback which will be fired for each calculated column.
   */
  getWidths(callback) {
    if (!this.injected) {
      this.injectTable();
    }
    arrayEach(this.columns, (column) => {
      callback(column.col, outerWidth(column.table));
    });
  }

  /**
   * Set the Ghost Table settings to the provided object.
   *
   * @param {object} settings New Ghost Table Settings.
   */
  setSettings(settings) {
    this.settings = settings;
  }

  /**
   * Set a single setting of the Ghost Table.
   *
   * @param {string} name Setting name.
   * @param {*} value Setting value.
   */
  setSetting(name, value) {
    if (!this.settings) {
      this.settings = {};
    }

    this.settings[name] = value;
  }

  /**
   * Get the Ghost Table settings.
   *
   * @returns {object|null}
   */
  getSettings() {
    return this.settings;
  }

  /**
   * Get a single Ghost Table setting.
   *
   * @param {string} name The setting name to get.
   * @returns {boolean|null}
   */
  getSetting(name) {
    if (this.settings) {
      return this.settings[name];
    }

    return null;

  }

  /**
   * Create colgroup col elements.
   *
   * @returns {DocumentFragment}
   */
  createColGroupsCol() {
    const fragment = this.hot.rootDocument.createDocumentFragment();

    if (this.hot.hasRowHeaders()) {
      fragment.appendChild(this.createColElement(-1));
    }

    this.samples.forEach((sample) => {
      arrayEach(sample.strings, (string) => {
        fragment.appendChild(this.createColElement(string.col));
      });
    });

    return fragment;
  }

  /**
   * Create table row element.
   *
   * @param {number} row Row index.
   * @returns {DocumentFragment} Returns created table row elements.
   */
  createRow(row) {
    const { rootDocument } = this.hot;
    const fragment = rootDocument.createDocumentFragment();
    const th = rootDocument.createElement('th');

    if (this.hot.hasRowHeaders()) {
      this.hot.view.appendRowHeader(row, th);

      fragment.appendChild(th);
    }

    this.samples.forEach((sample) => {
      arrayEach(sample.strings, (string) => {
        const column = string.col;
        const cellProperties = this.hot.getCellMeta(row, column);

        cellProperties.col = column;
        cellProperties.row = row;

        const renderer = this.hot.getCellRenderer(cellProperties);
        const td = rootDocument.createElement('td');

        // Indicate that this element is created and supported by GhostTable. It can be useful to
        // exclude rendering performance costly logic or exclude logic which doesn't work within a hidden table.
        td.setAttribute('ghost-table', 1);
        renderer(this.hot, td, row, column, this.hot.colToProp(column), string.value, cellProperties);
        fragment.appendChild(td);
      });
    });

    return fragment;
  }

  /**
   * Creates DOM elements for headers and appends them to the THEAD element of the table.
   */
  appendColumnHeadersRow() {
    const { rootDocument } = this.hot;
    const domFragment = rootDocument.createDocumentFragment();
    const columnHeaders = [];

    if (this.hot.hasRowHeaders()) {
      const th = rootDocument.createElement('th');

      columnHeaders.push([-1, th]);
      domFragment.appendChild(th);
    }

    this.samples.forEach((sample) => {
      arrayEach(sample.strings, (string) => {
        const column = string.col;
        const th = rootDocument.createElement('th');

        columnHeaders.push([column, th]);
        domFragment.appendChild(th);
      });
    });

    // Appending DOM elements for headers
    this.table.tHead.appendChild(domFragment);

    arrayEach(columnHeaders, (columnHeader) => {
      const [column, th] = columnHeader;

      // Using source method for filling a header with value.
      this.hot.view.appendColHeader(column, th);
    });
  }

  /**
   * Create table column elements.
   *
   * @param {number} column Column index.
   * @returns {DocumentFragment} Returns created column table column elements.
   */
  createCol(column) {
    const { rootDocument } = this.hot;
    const fragment = rootDocument.createDocumentFragment();

    this.samples.forEach((sample) => {
      arrayEach(sample.strings, (string) => {
        const row = string.row;
        const cellProperties = this.hot.getCellMeta(row, column);

        cellProperties.col = column;
        cellProperties.row = row;

        const renderer = this.hot.getCellRenderer(cellProperties);
        const td = rootDocument.createElement('td');
        const tr = rootDocument.createElement('tr');

        // Indicate that this element is created and supported by GhostTable. It can be useful to
        // exclude rendering performance costly logic or exclude logic which doesn't work within a hidden table.
        td.setAttribute('ghost-table', 1);
        renderer(this.hot, td, row, column, this.hot.colToProp(column), string.value, cellProperties);
        tr.appendChild(td);
        fragment.appendChild(tr);
      });
    });

    return fragment;
  }

  /**
   * Remove table from document and reset internal state.
   */
  clean() {
    this.rows.length = 0;
    this.rows[-1] = void 0;
    this.columns.length = 0;

    if (this.samples) {
      this.samples.clear();
    }
    this.samples = null;
    this.removeTable();
  }

  /**
   * Inject generated table into document.
   *
   * @param {HTMLElement} [parent=null] The element to which the ghost table is injected.
   */
  injectTable(parent = null) {
    if (!this.injected) {
      (parent || this.hot.rootElement).appendChild(this.container.fragment);
      this.injected = true;
    }
  }

  /**
   * Remove table from document.
   */
  removeTable() {
    if (this.injected && this.container.container.parentNode) {
      this.container.container.parentNode.removeChild(this.container.container);
      this.container = null;
      this.injected = false;
    }
  }

  /**
   * Create col element.
   *
   * @param {number} column Column index.
   * @returns {HTMLElement}
   */
  createColElement(column) {
    const col = this.hot.rootDocument.createElement('col');

    col.style.width = `${this.hot.view.wt.wtTable.getStretchedColumnWidth(column)}px`;

    return col;
  }

  /**
   * Create table element.
   *
   * @param {string} className The CSS classes to add.
   * @returns {object}
   */
  createTable(className = '') {
    const { rootDocument } = this.hot;
    const fragment = rootDocument.createDocumentFragment();
    const table = rootDocument.createElement('table');
    const tHead = rootDocument.createElement('thead');
    const tBody = rootDocument.createElement('tbody');
    const colGroup = rootDocument.createElement('colgroup');
    const tr = rootDocument.createElement('tr');
    const th = rootDocument.createElement('th');

    if (this.isVertical()) {
      table.appendChild(colGroup);
    }
    if (this.isHorizontal()) {
      tr.appendChild(th);
      tHead.appendChild(tr);
      table.style.tableLayout = 'auto';
      table.style.width = 'auto';
    }
    table.appendChild(tHead);

    if (this.isVertical()) {
      tBody.appendChild(tr);
    }
    table.appendChild(tBody);
    addClass(table, className);
    fragment.appendChild(table);

    return { fragment, table, tHead, tBody, colGroup, tr, th };
  }

  /**
   * Create container for tables.
   *
   * @param {string} className The CSS classes to add.
   * @returns {object}
   */
  createContainer(className = '') {
    const { rootDocument } = this.hot;
    const fragment = rootDocument.createDocumentFragment();
    const container = rootDocument.createElement('div');
    const containerClassName = `htGhostTable htAutoSize ${className.trim()}`;

    addClass(container, containerClassName);
    fragment.appendChild(container);

    return { fragment, container };
  }

  /**
   * Checks if table is raised vertically (checking rows).
   *
   * @returns {boolean}
   */
  isVertical() {
    return !!(this.rows.length && !this.columns.length);
  }

  /**
   * Checks if table is raised horizontally (checking columns).
   *
   * @returns {boolean}
   */
  isHorizontal() {
    return !!(this.columns.length && !this.rows.length);
  }
}

export default GhostTable;
