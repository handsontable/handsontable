import { createHighlight as createActiveHighlight } from './types/activeHeader';
import { createHighlight as createAreaLayeredHighlight } from './types/areaLayered';
import { createHighlight as createAreaHighlight } from './types/area';
import { createHighlight as createColumnHighlight } from './types/column';
import { createHighlight as createFocusHighlight } from './types/focus';
import { createHighlight as createCustomHighlight } from './types/customSelection';
import { createHighlight as createFillHighlight } from './types/fill';
import { createHighlight as createHeaderHighlight } from './types/header';
import { createHighlight as createRowHighlight } from './types/row';
import {
  HIGHLIGHT_ACTIVE_HEADER_TYPE,
  HIGHLIGHT_AREA_TYPE,
  HIGHLIGHT_FOCUS_TYPE,
  HIGHLIGHT_CUSTOM_SELECTION_TYPE,
  HIGHLIGHT_FILL_TYPE,
  HIGHLIGHT_HEADER_TYPE,
  HIGHLIGHT_ROW_TYPE,
  HIGHLIGHT_COLUMN_TYPE,
} from '../../3rdparty/walkontable/src';
import { arrayEach } from './../../helpers/array';

export {
  HIGHLIGHT_ACTIVE_HEADER_TYPE as ACTIVE_HEADER_TYPE,
  HIGHLIGHT_AREA_TYPE as AREA_TYPE,
  HIGHLIGHT_FOCUS_TYPE as FOCUS_TYPE,
  HIGHLIGHT_CUSTOM_SELECTION_TYPE as CUSTOM_SELECTION_TYPE,
  HIGHLIGHT_FILL_TYPE as FILL_TYPE,
  HIGHLIGHT_HEADER_TYPE as HEADER_TYPE,
  HIGHLIGHT_ROW_TYPE as ROW_TYPE,
  HIGHLIGHT_COLUMN_TYPE as COLUMN_TYPE,
}

/**
 * Highlight class responsible for managing Walkontable Selection classes.
 *
 * With Highlight object you can manipulate four different highlight types:
 *  - `cell` can be added only to a single cell at a time and it defines currently selected cell;
 *  - `fill` can occur only once and its highlight defines selection of autofill functionality (managed by the plugin with the same name);
 *  - `areas` can be added to multiple cells at a time. This type highlights selected cell or multiple cells.
 *    The multiple cells have to be defined as an uninterrupted order (regular shape). Otherwise, the new layer of
 *    that type should be created to manage not-consecutive selection;
 *  - `header` can occur multiple times. This type is designed to highlight only headers. Like `area` type it
 *    can appear with multiple highlights (accessed under different level layers).
 *
 * @class Highlight
 * @util
 */
class Highlight {
  constructor(options) {
    /**
     * Options consumed by Highlight class and Walkontable Selection classes.
     *
     * @type {object}
     */
    this.options = options;
    /**
     * The property which describes which layer level of the visual selection will be modified.
     * This option is valid only for `area` and `header` highlight types which occurs multiple times on
     * the table (as a non-consecutive selection).
     *
     * An order of the layers is the same as the order of added new non-consecutive selections.
     *
     * @type {number}
     * @default 0
     */
    this.layerLevel = 0;
    /**
     * `cell` highlight object which describes attributes for the currently selected cell.
     * It can only occur only once on the table.
     *
     * @type {Selection}
     */
    this.focus = createFocusHighlight(options);
    /**
     * `fill` highlight object which describes attributes for the borders for autofill functionality.
     * It can only occur only once on the table.
     *
     * @type {Selection}
     */
    this.fill = createFillHighlight(options);
    /**
     * Collection of the `area` highlights. That objects describes attributes for the borders and selection of
     * the multiple selected cells. It can occur multiple times on the table.
     *
     * @type {Map.<number, Selection>}
     */
    this.areasLayered = new Map();
    this.areas = new Map();
    /**
     * Collection of the `header` highlights. That objects describes attributes for the selection of
     * the multiple selected rows and columns in the table header. It can occur multiple times on the table.
     *
     * @type {Map.<number, Selection>}
     */
    this.rowHeaders = new Map();
    this.columnHeaders = new Map();
    /**
     * Collection of the `active-header` highlights. That objects describes attributes for the selection of
     * the multiple selected rows and columns in the table header. The table headers which have selected all items in
     * a row will be marked as `active-header`.
     *
     * @type {Map.<number, Selection>}
     */
    this.activeRowHeaders = new Map();
    this.activeColumnHeaders = new Map();
    /**
     * Collection of the `rows` highlights. That objects describes attributes for the selection of
     * the multiple selected rows. It can occur multiple times on the table.
     *
     * @type {Map.<number, Selection>}
     */
    this.rowHighlights = new Map();
    /**
     * Collection of the `columns` highlights. That objects describes attributes for the selection of
     * the multiple selected columns. It can occur multiple times on the table.
     *
     * @type {Map.<number, Selection>}
     */
    this.columnHighlights = new Map();
    /**
     * Collection of the `custom-selection`, holder for example borders added through CustomBorders plugin.
     *
     * @type {Selection[]}
     */
    this.customSelections = [];
  }

  /**
   * Check if highlight cell rendering is disabled for specified highlight type.
   *
   * @param {string} highlightType Highlight type. Possible values are: `cell`, `area`, `fill` or `header`.
   * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
   * @returns {boolean}
   */
  isEnabledFor(highlightType, coords) {
    let type = highlightType;

    // Legacy compatibility.
    if (highlightType === HIGHLIGHT_FOCUS_TYPE) {
      type = 'current'; // One from settings for `disableVisualSelection` up to Handsontable 0.36/Handsontable Pro 1.16.0.
    }

    let disableHighlight = false;

    if (coords.isCell()) {
      disableHighlight = this.options.disabledCellSelection(coords.row, coords.col);
    }

    if (typeof disableHighlight === 'string') {
      disableHighlight = [disableHighlight];
    }

    return disableHighlight === false || Array.isArray(disableHighlight) && !disableHighlight.includes(type);
  }

  /**
   * Set a new layer level to make access to the desire `area` and `header` highlights.
   *
   * @param {number} [level=0] Layer level to use.
   * @returns {Highlight}
   */
  useLayerLevel(level = 0) {
    this.layerLevel = level;

    return this;
  }

  /**
   * Get Walkontable Selection instance created for controlling highlight of the currently selected/edited cell.
   *
   * @returns {Selection}
   */
  getCell() {
    return this.focus;
  }

  /**
   * Get Walkontable Selection instance created for controlling highlight of the autofill functionality.
   *
   * @returns {Selection}
   */
  getFill() {
    return this.fill;
  }

  /**
   * Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
   * of the multiple selected cells.
   *
   * @returns {Selection}
   */
  createOrGetAreaLayered() {
    const layerLevel = this.layerLevel;
    let area;

    if (this.areasLayered.has(layerLevel)) {
      area = this.areasLayered.get(layerLevel);
    } else {
      area = createAreaLayeredHighlight({ layerLevel, ...this.options });

      this.areasLayered.set(layerLevel, area);
    }

    return area;
  }
  createOrGetArea() {
    const layerLevel = this.layerLevel;
    let area;

    if (this.areas.has(layerLevel)) {
      area = this.areas.get(layerLevel);
    } else {
      area = createAreaHighlight({ layerLevel, ...this.options });

      this.areas.set(layerLevel, area);
    }

    return area;
  }

  /**
   * Get all Walkontable Selection instances which describes the state of the visual highlight of the cells.
   *
   * @returns {Selection[]}
   */
  getAreas() {
    return [...this.areas.values()];
  }
  getAreasLayered() {
    return [...this.areasLayered.values()];
  }

  /**
   * Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
   * of the multiple selected header cells.
   *
   * @returns {Selection}
   */
  createOrGetRowHeader() {
    const layerLevel = this.layerLevel;
    let header;

    if (this.rowHeaders.has(layerLevel)) {
      header = this.rowHeaders.get(layerLevel);
    } else {
      header = createHeaderHighlight({ ...this.options });

      this.rowHeaders.set(layerLevel, header);
    }

    return header;
  }

  /**
   * Get all Walkontable Selection instances which describes the state of the visual highlight of the headers.
   *
   * @returns {Selection[]}
   */
  getRowHeaders() {
    return [...this.rowHeaders.values()];
  }

  createOrGetColumnHeader() {
    const layerLevel = this.layerLevel;
    let header;

    if (this.columnHeaders.has(layerLevel)) {
      header = this.columnHeaders.get(layerLevel);
    } else {
      header = createHeaderHighlight({ ...this.options });

      this.columnHeaders.set(layerLevel, header);
    }

    return header;
  }

  getColumnHeaders() {
    return [...this.columnHeaders.values()];
  }

  /**
   * Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
   * of the multiple selected active header cells.
   *
   * @returns {Selection}
   */
  createOrGetActiveRowHeader() {
    const layerLevel = this.layerLevel;
    let header;

    if (this.activeRowHeaders.has(layerLevel)) {
      header = this.activeRowHeaders.get(layerLevel);
    } else {
      header = createActiveHighlight({ ...this.options });

      this.activeRowHeaders.set(layerLevel, header);
    }

    return header;
  }
  createOrGetActiveColumnHeader() {
    const layerLevel = this.layerLevel;
    let header;

    if (this.activeColumnHeaders.has(layerLevel)) {
      header = this.activeColumnHeaders.get(layerLevel);
    } else {
      header = createActiveHighlight({ ...this.options });

      this.activeColumnHeaders.set(layerLevel, header);
    }

    return header;
  }

  /**
   * Get all Walkontable Selection instances which describes the state of the visual highlight of the active headers.
   *
   * @returns {Selection[]}
   */
  getActiveRowHeaders() {
    return [...this.activeRowHeaders.values()];
  }
  getActiveColumnHeaders() {
    return [...this.activeColumnHeaders.values()];
  }

  /**
   * Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
   * of the multiple selected rows.
   *
   * @returns {Selection}
   */
  createOrGetRowHighlight() {
    const layerLevel = this.layerLevel;
    let header;

    if (this.rowHighlights.has(layerLevel)) {
      header = this.rowHighlights.get(layerLevel);
    } else {
      header = createRowHighlight({ ...this.options });

      this.rowHighlights.set(layerLevel, header);
    }

    return header;
  }

  /**
   * Get all Walkontable Selection instances which describes the state of the rows highlighting.
   *
   * @returns {Selection[]}
   */
  getRowHighlights() {
    return [...this.rowHighlights.values()];
  }

  /**
   * Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
   * of the multiple selected columns.
   *
   * @returns {Selection}
   */
  createOrGetColumnHighlight() {
    const layerLevel = this.layerLevel;
    let header;

    if (this.columnHighlights.has(layerLevel)) {
      header = this.columnHighlights.get(layerLevel);
    } else {
      header = createColumnHighlight({ ...this.options });

      this.columnHighlights.set(layerLevel, header);
    }

    return header;
  }

  /**
   * Get all Walkontable Selection instances which describes the state of the columns highlighting.
   *
   * @returns {Selection[]}
   */
  getColumnHighlights() {
    return [...this.columnHighlights.values()];
  }

  /**
   * Get Walkontable Selection instance created for controlling highlight of the custom selection functionality.
   *
   * @returns {Selection}
   */
  getCustomSelections() {
    return [...this.customSelections.values()];
  }

  /**
   * Add selection to the custom selection instance. The new selection are added to the end of the selection collection.
   *
   * @param {object} selectionInstance The selection instance.
   */
  addCustomSelection(selectionInstance) {
    this.customSelections.push(createCustomHighlight({
      ...this.options,
      ...selectionInstance
    }));
  }

  /**
   * Perform cleaning visual highlights for the whole table.
   */
  clear() {
    this.focus.clear();
    this.fill.clear();

    arrayEach(this.areas.values(), highlight => void highlight.clear());
    arrayEach(this.areasLayered.values(), highlight => void highlight.clear());
    arrayEach(this.rowHeaders.values(), highlight => void highlight.clear());
    arrayEach(this.columnHeaders.values(), highlight => void highlight.clear());
    arrayEach(this.activeRowHeaders.values(), highlight => void highlight.clear());
    arrayEach(this.activeColumnHeaders.values(), highlight => void highlight.clear());
    arrayEach(this.rowHighlights.values(), highlight => void highlight.clear());
    arrayEach(this.columnHighlights.values(), highlight => void highlight.clear());
  }

  /**
   * This object can be iterate over using `for of` syntax or using internal `arrayEach` helper.
   *
   * @returns {Selection[]}
   */
  [Symbol.iterator]() {
    return [
      this.focus,
      this.fill,
      ...this.areas.values(),
      ...this.areasLayered.values(),
      ...this.rowHeaders.values(),
      ...this.columnHeaders.values(),
      ...this.activeRowHeaders.values(),
      ...this.activeColumnHeaders.values(),
      ...this.rowHighlights.values(),
      ...this.columnHighlights.values(),
      ...this.customSelections,
    ][Symbol.iterator]();
  }
}

export default Highlight;
