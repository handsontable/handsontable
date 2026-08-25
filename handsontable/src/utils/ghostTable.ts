import type { HotInstance } from '../core/types';
import type { CellProperties } from '../settings';
import type { BaseRenderer } from '../renderers/baseRenderer';
import { renderCell } from '../renderers/renderCell';
import { addClass } from './../helpers/dom/element';
import { arrayEach } from './../helpers/array';
import { throwWithCause } from '../helpers/errors';

/**
 * Structure returned by createTable().
 */
interface GhostTableStruct {
  fragment: DocumentFragment;
  table: HTMLTableElement;
  tHead: HTMLTableSectionElement;
  tBody: HTMLTableSectionElement;
  colGroup: HTMLTableColElement;
  tr: HTMLTableRowElement;
  th: HTMLTableCellElement;
}

/**
 * Structure returned by createContainer().
 */
interface GhostContainerStruct {
  fragment: DocumentFragment;
  container: HTMLDivElement;
}

/**
 * A single string entry within a sample.
 */
interface SampleString {
  col?: number;
  row?: number;
  value: unknown;
}

/**
 * A sample entry in the samples Map.
 */
interface SampleEntry {
  strings: SampleString[];
  [key: string]: unknown;
}

/**
 * @class GhostTable
 */
class GhostTable {
  /**
   * Handsontable instance.
   *
   * @type {Core}
   */
  hot: HotInstance | null = null;
  /**
   * Container element where every table will be injected.
   *
   * @type {HTMLElement|null}
   */
  container: GhostContainerStruct | null = null;
  /**
   * Flag which determine is table was injected to DOM.
   *
   * @type {boolean}
   */
  injected = false;
  /**
   * Added rows collection.
   *
   * @type {Array}
   */
  rows: Record<string, unknown>[] = [];
  /**
   * Added columns collection.
   *
   * @type {Array}
   */
  columns: Record<string, unknown>[] = [];
  /**
   * Samples prepared for calculations.
   *
   * @type {Map}
   * @default {null}
   */
  samples: Map<string | number, SampleEntry> | null = null;
  /**
   * Ghost table settings.
   *
   * @type {object}
   * @default {Object}
   */
  settings: Record<string, unknown> = {
    useHeaders: true
  };
  /**
   * Table element.
   *
   * @type {unknown}
   */
  table: GhostTableStruct | null = null;

  /**
   * Initializes the ghost table utility with a reference to the Handsontable instance used for DOM context.
   */
  constructor(hotInstance: HotInstance | object) {
    this.hot = hotInstance as HotInstance;
  }

  /**
   * Add row.
   *
   * @param {number} row Visual row index.
   * @param {Map} samples Samples Map object.
   */
  addRow(row: number, samples: Map<string | number, SampleEntry>) {
    if (this.columns.length) {
      throwWithCause('Doesn\'t support multi-dimensional table');
    }
    if (!this.rows.length) {
      this.container = this.createContainer(this.hot!.rootElement.className);
    }
    const rowObject: Record<string, unknown> = { row };

    this.rows.push(rowObject);

    this.samples = samples;
    this.table = this.createTable(this.hot!.table.className);
    this.table.colGroup.appendChild(this.createColGroupsCol(row));
    this.table.tr.appendChild(this.createRow(row));

    this.container!.container.appendChild(this.table.fragment);

    rowObject.table = this.table.table;
  }

  /**
   * Add a row consisting of the column headers.
   *
   * @param {Map} samples A map with sampled table values.
   */
  addColumnHeadersRow(samples: Map<string | number, SampleEntry>) {
    const colHeader = this.hot!.getColHeader(0);

    if (colHeader !== null && colHeader !== undefined) {
      const rowObject: Record<string, unknown> = { row: -1 };

      this.rows.push(rowObject);

      this.container = this.createContainer(this.hot!.rootElement.className);
      this.samples = samples;
      this.table = this.createTable(this.hot!.table.className);

      this.table.colGroup.appendChild(this.createColGroupsCol());

      this.appendColumnHeadersRow();

      this.container.container.appendChild(this.table.fragment);

      rowObject.table = this.table.table;
    }
  }

  /**
   * Add a column consisting of the row headers of the sampled rows.
   *
   * The mirror image of {@link GhostTable#addColumnHeadersRow}: that one measures how tall the
   * column headers are, this one measures how wide the row headers are. The column is registered
   * under a negative index (`-1` for the first header level, `-2` for the second, and so on),
   * matching the convention that the row header sits at column `-1`.
   *
   * @param {Map} samples A map with sampled row header labels, keyed the way
   *                      {@link SamplesGenerator} keys them. Only the row indexes are read - the
   *                      label itself is rendered by the grid's own row header renderers.
   * @param {number} [headerLevel=0] The row header level, counting from the grid's edge.
   * @param {Function} [renderer] The renderer that fills one header cell of that level. Defaults to
   *                              the grid's own first-level row header renderer.
   */
  addRowHeadersColumn(
    samples: Map<string | number, SampleEntry>,
    headerLevel = 0,
    renderer?: (visualRow: number, TH: HTMLTableCellElement) => void
  ) {
    if (this.rows.length) {
      throwWithCause('Doesn\'t support multi-dimensional table');
    }
    if (!this.hot!.hasRowHeaders() || samples.size === 0) {
      return;
    }
    if (!this.columns.length) {
      this.container = this.createContainer(this.hot!.rootElement.className);
    }
    const columnObject: Record<string, unknown> = { col: -1 - headerLevel };

    this.columns.push(columnObject);
    this.samples = samples;

    // `createTable` reads the row/column counts to decide the table's orientation, so it has to run
    // after the `push` above - the horizontal branch is what overrides the `width: 0` and
    // `table-layout: fixed` that the copied `htCore` class would otherwise impose (#4363).
    this.table = this.createTable(this.hot!.table.className);
    this.table.tBody.appendChild(this.createRowHeadersCol(renderer));
    this.container!.container.appendChild(this.table.fragment);

    columnObject.table = this.table.table;
  }

  /**
   * Add column.
   *
   * @param {number} column Visual column index.
   * @param {Map} samples A map with sampled table values.
   */
  addColumn(column: number, samples: Map<string | number, SampleEntry>) {
    if (this.rows.length) {
      throwWithCause('Doesn\'t support multi-dimensional table');
    }
    if (!this.columns.length) {
      this.container = this.createContainer(this.hot!.rootElement.className);
    }
    const columnObject: Record<string, unknown> = { col: column };

    this.columns.push(columnObject);

    this.samples = samples;
    this.table = this.createTable(this.hot!.table.className);

    if (this.getSetting('useHeaders') && this.hot!.getColHeader(column) !== null) {
      // Please keep in mind that the renderable column index equal to the visual columns index for the GhostTable.
      // We render all columns.
      this.hot!.view.appendColHeader(column, this.table.th, undefined, -1);
    }
    this.table.tBody.appendChild(this.createCol(column));
    this.container!.container.appendChild(this.table.fragment);

    columnObject.table = this.table.table;
  }

  /**
   * Get calculated heights.
   *
   * @param {Function} callback Callback which will be fired for each calculated row.
   */
  getHeights(callback: Function) {
    if (!this.injected) {
      this.injectTable();
    }

    arrayEach(this.rows, (row: Record<string, unknown>) => {
      // Use getBoundingClientRect() instead of offsetHeight for sub-pixel precision.
      // Math.round is used instead of Math.ceil to avoid over-rounding at non-100% browser zoom
      // levels (e.g. 90%), where fractional BCR values like 28.88 would ceil to 29 but
      // a default-height row should remain at 29, not be inflated to 30.
      // For genuinely taller rows the fractional part is typically >= 0.5, so round still
      // produces the correct ceiling.
      const { height } = (row.table as HTMLTableElement).getBoundingClientRect();

      callback(row.row, Math.round(height));
    });
  }

  /**
   * Get calculated widths.
   *
   * @param {Function} callback Callback which will be fired for each calculated column.
   */
  getWidths(callback: Function) {
    if (!this.injected) {
      this.injectTable();
    }
    arrayEach(this.columns, (column: Record<string, unknown>) => {
      // In cases when the cell's content produces the width with a decimal point, the width
      // needs to be rounded up to make sure that there will be a space for the cell's content.
      // The `.offsetWidth` always returns the rounded number (floored), so it's not suitable for this case.
      const { width } = (column.table as HTMLTableElement).getBoundingClientRect();

      callback(column.col, Math.ceil(width));
    });
  }

  /**
   * Set the Ghost Table settings to the provided object.
   *
   * @param {object} settings New Ghost Table Settings.
   */
  setSettings(settings: Record<string, unknown>) {
    this.settings = settings;
  }

  /**
   * Set a single setting of the Ghost Table.
   *
   * @param {string} name Setting name.
   * @param {*} value Setting value.
   */
  setSetting(name: string, value: unknown) {
    if (!this.settings) {
      this.settings = { useHeaders: true };
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
  getSetting(name: string) {
    if (this.settings) {
      return this.settings[name];
    }

    return null;

  }

  /**
   * Create colgroup col elements.
   *
   * @param {number} row Visual row index.
   * @returns {DocumentFragment}
   */
  createColGroupsCol(row?: number) {
    const fragment = this.hot!.rootDocument.createDocumentFragment();

    if (this.hot!.hasRowHeaders()) {
      fragment.appendChild(this.createColElement(-1, -1));
    }

    this.samples!.forEach((sample: SampleEntry) => {
      arrayEach(sample.strings, (string: SampleString) => {
        fragment.appendChild(this.createColElement(string.col!, row!));
      });
    });

    return fragment;
  }

  /**
   * Create table row element.
   *
   * @param {number} row Visual row index.
   * @returns {DocumentFragment} Returns created table row elements.
   */
  createRow(row: number) {
    const rootDocument = this.hot!.rootDocument;
    const fragment = rootDocument.createDocumentFragment();
    const th = rootDocument.createElement('th');

    if (this.hot!.hasRowHeaders()) {
      this.hot!.view.appendRowHeader(row, th);

      fragment.appendChild(th);
    }

    this.samples!.forEach((sample: SampleEntry) => {
      arrayEach(sample.strings, (string: SampleString) => {
        const column = string.col!;
        const cellProperties = this.hot!.getCellMetaTransient<CellProperties>(row, column);
        const td = rootDocument.createElement('td');

        // Indicate that this element is created and supported by GhostTable. It can be useful to
        // exclude rendering performance costly logic or exclude logic which doesn't work within a hidden table.
        td.setAttribute('ghost-table', '1');
        this.#renderCell(td, row, column, string.value, cellProperties);
        fragment.appendChild(td);
      });
    });

    return fragment;
  }

  /**
   * Creates DOM elements for headers and appends them to the THEAD element of the table.
   */
  appendColumnHeadersRow() {
    const rootDocument = this.hot!.rootDocument;
    // The headers must sit in a real `<tr>` (`table > thead > tr > th`), mirroring the grid's
    // DOM — the cell styling is scoped with child combinators (#4363), so a `<th>` appended
    // straight into `<thead>` would miss it and measure without padding/borders.
    const headersRow = rootDocument.createElement('tr');
    const columnHeaders: [number, HTMLTableCellElement][] = [];

    if (this.hot!.hasRowHeaders()) {
      const th = rootDocument.createElement('th');

      columnHeaders.push([-1, th]);
      headersRow.appendChild(th);
    }

    this.samples!.forEach((sample: SampleEntry) => {
      arrayEach(sample.strings, (string: SampleString) => {
        const column = string.col!;
        const th = rootDocument.createElement('th');

        columnHeaders.push([column, th]);
        headersRow.appendChild(th);
      });
    });

    // Appending DOM elements for headers
    this.table!.tHead.appendChild(headersRow);

    arrayEach(columnHeaders, (columnHeader: [number, HTMLTableCellElement]) => {
      const [column, th] = columnHeader;

      // Using source method for filling a header with value.
      this.hot!.view.appendColHeader(column, th);
    });
  }

  /**
   * Create table column elements.
   *
   * @param {number} column Visual column index.
   * @returns {DocumentFragment} Returns created column table column elements.
   */
  createCol(column: number) {
    const rootDocument = this.hot!.rootDocument;
    const fragment = rootDocument.createDocumentFragment();

    this.samples!.forEach((sample: SampleEntry) => {
      arrayEach(sample.strings, (string: SampleString) => {
        const row = string.row!;
        const cellProperties = this.hot!.getCellMetaTransient<CellProperties>(row, column);
        const td = rootDocument.createElement('td');
        const tr = rootDocument.createElement('tr');

        // Indicate that this element is created and supported by GhostTable. It can be useful to
        // exclude rendering performance costly logic or exclude logic which doesn't work within a hidden table.
        td.setAttribute('ghost-table', '1');
        this.#renderCell(td, row, column, string.value, cellProperties);
        tr.appendChild(td);
        fragment.appendChild(tr);
      });
    });

    return fragment;
  }

  /**
   * Create the table rows holding the row headers to measure.
   *
   * The row header counterpart of {@link GhostTable#createCol}, and shaped like it: one `<tr>` per
   * sampled row, so the column sizes itself to the widest of them.
   *
   * @param {Function} [renderer] The renderer that fills one header cell. Defaults to the grid's
   *                              own first-level row header renderer.
   * @returns {DocumentFragment} Returns created table row elements.
   */
  createRowHeadersCol(renderer?: (visualRow: number, TH: HTMLTableCellElement) => void) {
    const rootDocument = this.hot!.rootDocument;
    const fragment = rootDocument.createDocumentFragment();
    // Using a source renderer so the measured header carries whatever the renderers and the
    // `afterGetRowHeader` hook put there - the width has to cover the real markup, not just the label.
    const fillHeader = renderer ?? ((visualRow: number, th: HTMLTableCellElement) => {
      this.hot!.view.appendRowHeader(visualRow, th);
    });

    this.samples!.forEach((sample: SampleEntry) => {
      arrayEach(sample.strings, (string: SampleString) => {
        const tr = rootDocument.createElement('tr');
        const th = rootDocument.createElement('th');

        // Indicate that this element is created and supported by GhostTable. It can be useful to
        // exclude rendering performance costly logic or exclude logic which doesn't work within a hidden table.
        th.setAttribute('ghost-table', '1');
        fillHeader(string.row!, th);
        tr.appendChild(th);
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
    (this.rows as Record<number, Record<string, unknown> | undefined>)[-1] = undefined;
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
  injectTable(parent: HTMLElement | null = null) {
    if (!this.injected) {
      (parent || this.hot!.rootElement).appendChild(this.container!.fragment);
      this.injected = true;
    }
  }

  /**
   * Remove table from document.
   */
  removeTable() {
    if (this.injected && this.container!.container.parentNode) {
      this.container!.container.parentNode.removeChild(this.container!.container);
      this.container = null;
      this.injected = false;
    }
  }

  /**
   * Create col element.
   *
   * @param {number} column Visual column index.
   * @param {number} row Visual row index.
   * @returns {HTMLElement}
   */
  createColElement(column: number, row: number) {
    const col = this.hot!.rootDocument.createElement('col');
    let colspan = 0;

    if (row >= 0 && column >= 0) {
      colspan = Number(this.hot!.getCellMetaTransient(row, column).colspan);
    }

    let width = this.hot!.getColWidth(column);

    if (colspan > 1) {
      for (let nextColumn = column + 1; nextColumn < column + colspan; nextColumn++) {
        width += this.hot!.getColWidth(nextColumn);
      }
    }

    col.style.width = `${width}px`;

    return col;
  }

  /**
   * Create table element.
   *
   * @param {string} className The CSS classes to add.
   * @returns {object}
   */
  createTable(className = ''): GhostTableStruct {
    const rootDocument = this.hot!.rootDocument;
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
  createContainer(className = ''): GhostContainerStruct {
    const rootDocument = this.hot!.rootDocument;
    const fragment = rootDocument.createDocumentFragment();
    const container = rootDocument.createElement('div');
    const containerClassName = `htGhostTable htAutoSize ${className.trim()}`;

    addClass(container, containerClassName);
    fragment.appendChild(container);

    return { fragment, container };
  }

  /**
   * Renders one sampled cell into the TD that will be measured, through the same `renderCell`
   * contract `TableView.cellRenderer` uses: run the cell's own renderer, run the base renderer
   * when that renderer did not chain it itself, then reset the chaining flag. Calling only the
   * cell renderer here would leave the measured TD without `cellProperties.className` and the
   * other base-renderer classes, so AutoRowSize and AutoColumnSize would measure a cell styled
   * differently from the one the user sees.
   *
   * The sampled value must be rendered verbatim — the AutoRowSize and AutoColumnSize samplers
   * already run `formatCellValue` when building samples. Formatting here again would
   * double-format: a date sample already formatted to `1/1/24` fails the ISO-only
   * `parseToLocalDate` and renders as `#bad-value#`, inflating the measured width.
   *
   * @param {HTMLTableCellElement} td The cell element that will be measured.
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {*} value The sampled cell value, already formatted by the sampler.
   * @param {object} cellProperties The cell meta object.
   */
  #renderCell(
    td: HTMLTableCellElement,
    row: number,
    column: number,
    value: unknown,
    cellProperties: CellProperties
  ) {
    const rendererArgs: Parameters<BaseRenderer> = [
      this.hot!,
      td,
      row,
      column,
      this.hot!.colToProp(column),
      value,
      cellProperties,
    ];

    renderCell(this.hot!.getCellRenderer(cellProperties), rendererArgs);
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
